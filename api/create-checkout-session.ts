import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
  };
};

type UserProfile = {
  id: string;
  email: string;
  is_premium: boolean;
  trial_start_date: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  access_until: string | null;
  plan: string | null;
  canceled_at: string | null;
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function getAppUrl(req: ApiRequest) {
  const configuredAppUrl = process.env.VITE_APP_URL?.trim();
  if (configuredAppUrl) {
    return configuredAppUrl.replace(/\/+$/, '');
  }

  const origin = readHeader(req.headers, 'origin');
  if (origin) {
    return origin.replace(/\/+$/, '');
  }

  const forwardedProto = readHeader(req.headers, 'x-forwarded-proto');
  const forwardedHost = readHeader(req.headers, 'x-forwarded-host');
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
  }

  const host = readHeader(req.headers, 'host');
  if (host) {
    return `https://${host}`.replace(/\/+$/, '');
  }

  return 'http://localhost:3000';
}

function getStripeMode(secretKey: string) {
  if (secretKey.startsWith('sk_live_')) {
    return 'live';
  }

  if (secretKey.startsWith('sk_test_')) {
    return 'test';
  }

  return 'unknown';
}

function getStripeClient() {
  return new Stripe(getEnv('STRIPE_SECRET_KEY'));
}

function getSupabaseServerClient() {
  return createClient(
    getEnv('VITE_SUPABASE_URL'),
    getEnv('VITE_SUPABASE_ANON_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getSupabaseAdminClient() {
  return createClient(
    getEnv('VITE_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function getAuthenticatedUserFromRequest(req: ApiRequest) {
  const authorization = req.headers.authorization;
  const bearer = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;

  if (!token) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message || 'Unable to verify Supabase user.');
  }

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

async function getUserProfileById(userId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, is_premium, trial_start_date, stripe_customer_id, stripe_subscription_id, subscription_status, cancel_at_period_end, current_period_end, access_until, plan, canceled_at')
    .eq('id', userId)
    .maybeSingle<UserProfile>();

  if (error) {
    throw new Error(error.message || 'Unable to load Supabase profile.');
  }

  return data;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const profile = await getUserProfileById(user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (profile.is_premium) {
      return res.status(409).json({ error: 'Premium is already active for this account.' });
    }

    const stripeSecretKey = getEnv('STRIPE_SECRET_KEY').trim();
    if (!stripeSecretKey) {
      throw new Error('Missing environment variable: STRIPE_SECRET_KEY');
    }

    const stripePriceId = getEnv('STRIPE_PRICE_ID').trim();
    if (!stripePriceId) {
      throw new Error('Missing environment variable: STRIPE_PRICE_ID');
    }

    const stripe = getStripeClient();
    const stripeMode = getStripeMode(stripeSecretKey);
    const appUrl = getAppUrl(req);
    const customerEmail = profile.email || user.email;
    const successUrl = new URL('/success', `${appUrl}/`).toString();
    const cancelUrl = new URL('/cancel', `${appUrl}/`).toString();

    const price = await stripe.prices.retrieve(stripePriceId);
    if (price.deleted) {
      throw new Error(
        `Stripe price "${stripePriceId}" is deleted in ${stripeMode} mode. Check STRIPE_PRICE_ID.`
      );
    }

    if (!price.active) {
      throw new Error(
        `Stripe price "${stripePriceId}" is inactive in ${stripeMode} mode. Check STRIPE_PRICE_ID.`
      );
    }

    let customerConfig:
      | {
          customer: string;
        }
      | {
          customer_email: string;
        };

    if (profile.stripe_customer_id) {
      try {
        await stripe.customers.retrieve(profile.stripe_customer_id);
        customerConfig = {
          customer: profile.stripe_customer_id,
        };
      } catch (error) {
        if (
          error instanceof Stripe.errors.StripeError &&
          error.code === 'resource_missing'
        ) {
          console.warn('create-checkout-session invalid stored Stripe customer, falling back to email', {
            supabaseUserId: user.id,
            email: customerEmail,
            stripeCustomerId: profile.stripe_customer_id,
            stripeMode,
            stripePriceId,
            message: error.message,
            code: error.code,
            type: error.type,
            requestId: error.requestId ?? null,
          });
          customerConfig = {
            customer_email: customerEmail,
          };
        } else {
          throw error;
        }
      }
    } else {
      customerConfig = {
        customer_email: customerEmail,
      };
    }

    console.info('create-checkout-session start', {
      supabaseUserId: user.id,
      email: customerEmail,
      stripeMode,
      stripePriceId,
      successUrl,
      cancelUrl,
      hasStoredStripeCustomerId: Boolean(profile.stripe_customer_id),
      usesExistingStripeCustomer: 'customer' in customerConfig,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        email: customerEmail,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          email: customerEmail,
        },
      },
      ...customerConfig,
    });

    if (!session.url) {
      return res.status(500).json({ error: 'Stripe session URL missing.' });
    }

    console.info('create-checkout-session success', {
      supabaseUserId: user.id,
      email: customerEmail,
      stripeMode,
      stripePriceId,
      sessionId: session.id,
      hasUrl: Boolean(session.url),
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('create-checkout-session stripe error', {
        message: error.message,
        type: error.type,
        code: error.code ?? null,
        param: error.param ?? null,
        requestId: error.requestId ?? null,
        statusCode: error.statusCode ?? null,
      });
    } else {
      console.error('create-checkout-session error', error);
    }

    const message = error instanceof Stripe.errors.StripeError
      ? `Stripe error${error.code ? ` (${error.code})` : ''}: ${error.message}`
      : error instanceof Error
        ? error.message
        : 'Unable to create checkout session.';
    return res.status(500).json({ error: message });
  }
}
