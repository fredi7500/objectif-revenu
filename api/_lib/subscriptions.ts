import Stripe from 'stripe';
import { getSupabaseAdminClient } from './server';

type ProfileSubscriptionRow = {
  id: string;
  email: string;
  is_premium: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  access_until: string | null;
  plan: string | null;
  canceled_at: string | null;
  trial_start_date: string;
  created_at: string;
};

function unixToIso(value?: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function getPlanLabel(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const price = item?.price;

  if (!price) {
    return null;
  }

  return price.lookup_key || price.nickname || price.id || null;
}

function hasPremiumAccess(input: {
  subscriptionStatus: string | null;
  accessUntil: string | null;
}) {
  if (!input.accessUntil) {
    return false;
  }

  const accessUntilTs = new Date(input.accessUntil).getTime();
  if (Number.isNaN(accessUntilTs) || accessUntilTs <= Date.now()) {
    return false;
  }

  return input.subscriptionStatus !== 'incomplete_expired' && input.subscriptionStatus !== 'unpaid';
}

export function mapProfileSubscriptionRow(row: ProfileSubscriptionRow) {
  return {
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    trialStartDate: row.trial_start_date,
    isPremium: Boolean(row.is_premium),
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    subscriptionStatus: row.subscription_status,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    currentPeriodEnd: row.current_period_end,
    accessUntil: row.access_until,
    plan: row.plan,
    canceledAt: row.canceled_at,
  };
}

export async function getProfileByStripeCustomerId(stripeCustomerId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id,
      email,
      is_premium,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      cancel_at_period_end,
      current_period_end,
      access_until,
      plan,
      canceled_at,
      trial_start_date,
      created_at
    `)
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle<ProfileSubscriptionRow>();

  if (error) {
    throw new Error(error.message || 'Unable to load profile by Stripe customer ID.');
  }

  return data;
}

export async function getProfileByStripeSubscriptionId(stripeSubscriptionId: string) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id,
      email,
      is_premium,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      cancel_at_period_end,
      current_period_end,
      access_until,
      plan,
      canceled_at,
      trial_start_date,
      created_at
    `)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle<ProfileSubscriptionRow>();

  if (error) {
    throw new Error(error.message || 'Unable to load profile by Stripe subscription ID.');
  }

  return data;
}

export async function getProfileByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id,
      email,
      is_premium,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      cancel_at_period_end,
      current_period_end,
      access_until,
      plan,
      canceled_at,
      trial_start_date,
      created_at
    `)
    .ilike('email', normalizedEmail)
    .maybeSingle<ProfileSubscriptionRow>();

  if (error) {
    throw new Error(error.message || 'Unable to load profile by email.');
  }

  return data;
}

export async function syncProfileSubscriptionFromStripeSubscription(
  subscription: Stripe.Subscription,
  options?: { supabaseUserId?: string | null; customerEmail?: string | null; eventType?: string | null }
) {
  const stripeCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const stripeSubscriptionId = subscription.id;
  const currentPeriodEnd = unixToIso(subscription.current_period_end);
  const canceledAt = unixToIso(subscription.canceled_at);
  const accessUntil = currentPeriodEnd;
  const subscriptionStatus = subscription.status ?? null;
  const plan = getPlanLabel(subscription);
  const supabaseUserId =
    options?.supabaseUserId ??
    subscription.metadata.supabase_user_id ??
    null;

  let profileId = supabaseUserId;
  if (!profileId && stripeSubscriptionId) {
    profileId = (await getProfileByStripeSubscriptionId(stripeSubscriptionId))?.id ?? null;
  }
  if (!profileId && stripeCustomerId) {
    profileId = (await getProfileByStripeCustomerId(stripeCustomerId))?.id ?? null;
  }
  if (!profileId && options?.customerEmail) {
    profileId = (await getProfileByEmail(options.customerEmail))?.id ?? null;
  }

  if (!profileId) {
    console.error('stripe-sync profile resolution failed', {
      eventType: options?.eventType ?? null,
      stripeSubscriptionId,
      stripeCustomerId,
      subscriptionStatus,
      metadataSupabaseUserId: subscription.metadata.supabase_user_id ?? null,
      customerEmail: options?.customerEmail ?? null,
    });
    throw new Error('Unable to resolve Supabase profile for Stripe subscription.');
  }

  const isPremium = hasPremiumAccess({
    subscriptionStatus,
    accessUntil,
  });

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: subscriptionStatus,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      current_period_end: currentPeriodEnd,
      access_until: accessUntil,
      plan,
      canceled_at: canceledAt,
      is_premium: isPremium,
    })
    .eq('id', profileId)
    .select(`
      id,
      email,
      is_premium,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_status,
      cancel_at_period_end,
      current_period_end,
      access_until,
      plan,
      canceled_at,
      trial_start_date,
      created_at
    `)
    .single<ProfileSubscriptionRow>();

  if (error) {
    console.error('stripe-sync supabase update failed', {
      eventType: options?.eventType ?? null,
      profileId,
      stripeSubscriptionId,
      stripeCustomerId,
      subscriptionStatus,
      customerEmail: options?.customerEmail ?? null,
      error,
    });
    throw new Error(error.message || 'Unable to sync profile subscription state.');
  }

  console.info('stripe-sync supabase update success', {
    eventType: options?.eventType ?? null,
    profileId,
    stripeSubscriptionId,
    stripeCustomerId,
    subscriptionStatus,
    isPremium,
    customerEmail: options?.customerEmail ?? null,
  });

  return data;
}
