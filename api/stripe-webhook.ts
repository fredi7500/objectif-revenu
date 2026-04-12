import Stripe from 'stripe';
import {
  getStripeClient,
  readRawBody,
} from './_lib/server.js';
import {
  getProfileByEmail,
  getProfileByStripeCustomerId,
  getProfileByStripeSubscriptionId,
  syncProfileSubscriptionFromStripeSubscription,
} from './_lib/subscriptions.js';

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

type CheckoutSessionCompletedEvent = Stripe.CheckoutSessionCompletedEvent;
type InvoiceEvent = Stripe.InvoicePaidEvent | Stripe.InvoicePaymentSucceededEvent;
type SubscriptionLifecycleEvent =
  | Stripe.CustomerSubscriptionCreatedEvent
  | Stripe.CustomerSubscriptionUpdatedEvent
  | Stripe.CustomerSubscriptionDeletedEvent;
type SupportedStripeEvent =
  | CheckoutSessionCompletedEvent
  | InvoiceEvent
  | SubscriptionLifecycleEvent;

function getMetadataFromStripeObject(object: { metadata?: Stripe.Metadata | null }) {
  return object.metadata ?? {};
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer) {
  return typeof customer === 'string' ? customer : customer.id;
}

function isDeletedCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer
): customer is Stripe.DeletedCustomer {
  return 'deleted' in customer && customer.deleted === true;
}

function getCustomerEmail(
  customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>
) {
  if (isDeletedCustomer(customer)) {
    return null;
  }

  return customer.email?.trim().toLowerCase() ?? null;
}

async function getCustomerEmailFromEvent(
  stripe: Stripe,
  event: SupportedStripeEvent
) {
  const directMetadata = getMetadataFromStripeObject(event.data.object);

  if (directMetadata.email) {
    return directMetadata.email.trim().toLowerCase();
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      if (session.customer_details?.email) {
        return session.customer_details.email.trim().toLowerCase();
      }

      if (typeof session.customer_email === 'string') {
        return session.customer_email.trim().toLowerCase();
      }

      if (typeof session.customer === 'string') {
        const customer = await stripe.customers.retrieve(session.customer);
        return getCustomerEmail(customer);
      }

      return null;
    }
    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;

      if (typeof invoice.customer_email === 'string') {
        return invoice.customer_email.trim().toLowerCase();
      }

      if (typeof invoice.customer === 'string') {
        const customer = await stripe.customers.retrieve(invoice.customer);
        return getCustomerEmail(customer);
      }

      return null;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      if (typeof subscription.customer === 'string') {
        const customer = await stripe.customers.retrieve(subscription.customer);
        return getCustomerEmail(customer);
      }

      return null;
    }
  }
}

async function getSupabaseUserIdFromEvent(
  stripe: Stripe,
  event: SupportedStripeEvent
) {
  const directMetadata = getMetadataFromStripeObject(event.data.object);

  if (directMetadata.supabase_user_id) {
    return directMetadata.supabase_user_id;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      if (typeof session.subscription === 'string') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        return subscription.metadata.supabase_user_id ?? null;
      }

      if (typeof session.customer === 'string') {
        const profile = await getProfileByStripeCustomerId(session.customer);
        if (profile?.id) {
          return profile.id;
        }
      }

      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return subscription.metadata.supabase_user_id ?? null;
      }

      if (typeof invoice.customer === 'string') {
        const profile = await getProfileByStripeCustomerId(invoice.customer);
        if (profile?.id) {
          return profile.id;
        }
      }

      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const profile = await getProfileByStripeSubscriptionId(subscription.id);
      if (profile?.id) {
        return profile.id;
      }

      const customerId = getCustomerId(subscription.customer);
      const customerProfile = await getProfileByStripeCustomerId(customerId);
      if (customerProfile?.id) {
        return customerProfile.id;
      }

      break;
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

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as SupportedStripeEvent;
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
      const session = event.data.object;
      if (typeof session.subscription === 'string') {
        const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.info('stripe-webhook syncing checkout.session.completed', {
          eventId: event.id,
          eventType: event.type,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: getCustomerId(subscription.customer),
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
      const invoice = event.data.object;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id;

      if (subscriptionId) {
        const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.info('stripe-webhook syncing invoice event', {
          eventId: event.id,
          eventType: event.type,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: getCustomerId(subscription.customer),
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
      const subscription = event.data.object;
      const supabaseUserId = await getSupabaseUserIdFromEvent(stripe, event);
      console.info('stripe-webhook syncing subscription lifecycle event', {
        eventId: event.id,
        eventType: event.type,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: getCustomerId(subscription.customer),
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
