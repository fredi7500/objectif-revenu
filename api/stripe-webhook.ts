import Stripe from 'stripe';
import {
  getSupabaseAdminClient,
  getStripeClient,
  readRawBody,
} from './_lib/server';

type ApiRequest = AsyncIterable<Buffer | string> & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (body: unknown) => void;
    send: (body: string) => void;
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

function getMetadataFromStripeObject(object: Stripe.Event.Data.Object['object']) {
  return 'metadata' in object && object.metadata ? object.metadata : {};
}

async function activatePremiumForUser(supabaseUserId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', supabaseUserId);

  if (error) {
    throw new Error(error.message || 'Failed to update profiles.is_premium.');
  }
}

async function getSupabaseUserIdFromEvent(
  stripe: Stripe,
  event: Stripe.Event
) {
  const object = event.data.object;
  const directMetadata = getMetadataFromStripeObject(object);

  if (directMetadata.supabase_user_id) {
    return directMetadata.supabase_user_id;
  }

  if (
    event.type === 'checkout.session.completed' &&
    'subscription' in object &&
    typeof object.subscription === 'string'
  ) {
    const subscription = await stripe.subscriptions.retrieve(object.subscription);
    return subscription.metadata.supabase_user_id ?? null;
  }

  if (
    (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') &&
    'subscription' in object &&
    typeof object.subscription === 'string'
  ) {
    const subscription = await stripe.subscriptions.retrieve(object.subscription);
    return subscription.metadata.supabase_user_id ?? null;
  }

  return null;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed.');
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).send('Missing Stripe signature.');
  }

  try {
    const stripe = getStripeClient();
    const rawBody = await readRawBody(req);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res
        .status(500)
        .send('Missing STRIPE_WEBHOOK_SECRET. Webhook verification cannot run.');
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'invoice.paid' ||
      event.type === 'invoice.payment_succeeded' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const object = event.data.object;
      const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
      const checkoutPaid =
        event.type === 'checkout.session.completed' &&
        'payment_status' in object &&
        object.payment_status === 'paid';
      const subscriptionStatus =
        'status' in object && typeof object.status === 'string' ? object.status : null;
      const shouldActivate =
        checkoutPaid ||
        event.type === 'invoice.paid' ||
        event.type === 'invoice.payment_succeeded' ||
        subscriptionStatus === 'active' ||
        subscriptionStatus === 'trialing';

      if (supabaseUserId && shouldActivate) {
        await activatePremiumForUser(supabaseUserId);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    console.error('stripe-webhook error', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    return res.status(500).send(message);
  }
}
