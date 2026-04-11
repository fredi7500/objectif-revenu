import {
  getAppUrl,
  getAuthenticatedUserFromRequest,
  getEnv,
  getStripeMode,
  getStripeClient,
  getUserProfileById,
} from './_lib/server';
import Stripe from 'stripe';

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
