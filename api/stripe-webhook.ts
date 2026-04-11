import Stripe from 'stripe';
import {
  getStripeClient,
  readRawBody,
} from './_lib/server';
import {
  getProfileByEmail,
  getProfileByStripeCustomerId,
  getProfileByStripeSubscriptionId,
  syncProfileSubscriptionFromStripeSubscription,
} from './_lib/subscriptions';

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

async function getCustomerEmailFromEvent(
  stripe: Stripe,
  event: Stripe.Event
) {
  const object = event.data.object;
  const directMetadata = getMetadataFromStripeObject(object);

  if (directMetadata.email) {
    return directMetadata.email.trim().toLowerCase();
  }

  if (
    event.type === 'checkout.session.completed' &&
    'customer_details' in object &&
    object.customer_details?.email
  ) {
    return object.customer_details.email.trim().toLowerCase();
  }

  if ('customer_email' in object && typeof object.customer_email === 'string') {
    return object.customer_email.trim().toLowerCase();
  }

  if ('customer' in object && typeof object.customer === 'string') {
    const customer = await stripe.customers.retrieve(object.customer);
    if (!customer.deleted && customer.email) {
      return customer.email.trim().toLowerCase();
    }
  }

  return null;
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

  if ('subscription' in object && typeof object.subscription === 'string') {
    const profile = await getProfileByStripeSubscriptionId(object.subscription);
    if (profile?.id) {
      return profile.id;
    }
  }

  if ('customer' in object && typeof object.customer === 'string') {
    const profile = await getProfileByStripeCustomerId(object.customer);
    if (profile?.id) {
      return profile.id;
    }
  }

  const customerEmail = await getCustomerEmailFromEvent(stripe, event);
  if (customerEmail) {
    const profile = await getProfileByEmail(customerEmail);
    if (profile?.id) {
      return profile.id;
    }
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
    console.error('stripe-webhook missing signature header', {
      method: req.method ?? null,
      hasSignatureHeader: Boolean(signature),
    });
    return res.status(400).send('Missing Stripe signature.');
  }

  try {
    const stripe = getStripeClient();
    const rawBody = await readRawBody(req);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.info('stripe-webhook invoked', {
      method: req.method ?? null,
      hasSignatureHeader: true,
      rawBodyLength: rawBody.length,
      hasWebhookSecret: Boolean(webhookSecret),
    });

    if (!webhookSecret) {
      console.error('stripe-webhook missing STRIPE_WEBHOOK_SECRET');
      return res
        .status(500)
        .send('Missing STRIPE_WEBHOOK_SECRET. Webhook verification cannot run.');
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const customerEmail = await getCustomerEmailFromEvent(stripe, event);

    console.info('stripe-webhook event verified', {
      eventId: event.id,
      eventType: event.type,
      apiVersion: event.api_version ?? null,
      created: event.created,
      livemode: event.livemode,
      customerEmail,
    });

    if (event.type === 'checkout.session.completed') {
      const object = event.data.object;
      if (
        'subscription' in object &&
        typeof object.subscription === 'string'
      ) {
        const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
        const subscription = await stripe.subscriptions.retrieve(object.subscription);
        console.info('stripe-webhook syncing checkout.session.completed', {
          eventId: event.id,
          eventType: event.type,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId:
            typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
          supabaseUserId,
          customerEmail,
        });
        await syncProfileSubscriptionFromStripeSubscription(subscription, {
          supabaseUserId,
          customerEmail,
          eventType: event.type,
        });
      }
    }

    if (
      event.type === 'invoice.paid' ||
      event.type === 'invoice.payment_succeeded'
    ) {
      const object = event.data.object;
      if (
        'subscription' in object &&
        typeof object.subscription === 'string'
      ) {
        const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
        const subscription = await stripe.subscriptions.retrieve(object.subscription);
        console.info('stripe-webhook syncing invoice event', {
          eventId: event.id,
          eventType: event.type,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId:
            typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
          supabaseUserId,
          customerEmail,
        });
        await syncProfileSubscriptionFromStripeSubscription(subscription, {
          supabaseUserId,
          customerEmail,
          eventType: event.type,
        });
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
      console.info('stripe-webhook syncing subscription lifecycle event', {
        eventId: event.id,
        eventType: event.type,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId:
          typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        supabaseUserId,
        customerEmail,
      });
      await syncProfileSubscriptionFromStripeSubscription(subscription, {
        supabaseUserId,
        customerEmail,
        eventType: event.type,
      });
    }

    console.info('stripe-webhook handled successfully', {
      eventId: event.id,
      eventType: event.type,
    });
    return res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      console.error('stripe-webhook signature verification failed', {
        message: error.message,
      });
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    console.error('stripe-webhook error', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    return res.status(500).send(message);
  }
}
