import {
  getAuthenticatedUserFromRequest,
  getStripeClient,
  getUserProfileById,
} from './_lib/server.js';
import { mapProfileSubscriptionRow, syncProfileSubscriptionFromStripeSubscription } from './_lib/subscriptions.js';

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

    if (!profile.stripe_subscription_id) {
      return res.status(404).json({ error: 'No active Stripe subscription found for this account.' });
    }

    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    const stripeCustomerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    if (profile.stripe_customer_id && stripeCustomerId !== profile.stripe_customer_id) {
      return res.status(409).json({ error: 'Stripe customer mismatch for this account.' });
    }

    if (subscription.cancel_at_period_end) {
      const syncedProfile = await syncProfileSubscriptionFromStripeSubscription(subscription, {
        supabaseUserId: user.id,
      });
      return res.status(200).json({
        subscriptionStatus: subscription.status,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: syncedProfile.current_period_end,
        accessUntil: syncedProfile.access_until,
        profile: mapProfileSubscriptionRow(syncedProfile),
      });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    const syncedProfile = await syncProfileSubscriptionFromStripeSubscription(updatedSubscription, {
      supabaseUserId: user.id,
    });

    return res.status(200).json({
      subscriptionStatus: updatedSubscription.status,
      cancelAtPeriodEnd: Boolean(updatedSubscription.cancel_at_period_end),
      currentPeriodEnd: syncedProfile.current_period_end,
      accessUntil: syncedProfile.access_until,
      profile: mapProfileSubscriptionRow(syncedProfile),
    });
  } catch (error) {
    console.error('cancel-subscription error', error);
    const message =
      error instanceof Error ? error.message : 'Unable to schedule subscription cancellation.';
    return res.status(500).json({ error: message });
  }
}
