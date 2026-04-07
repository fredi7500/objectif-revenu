import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AuthSession = {
  userId: string;
  email: string;
  signedInAt: string;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

type UserProfileRow = {
  id: string;
  email: string;
  created_at: string;
  trial_start_date: string;
  is_premium: boolean;
};

export type AppUserProfile = {
  id: string;
  email: string;
  createdAt: string;
  trialStartDate: string;
  isPremium: boolean;
};

type PersistedEntry = { id?: string };

const SESSION_KEY = 'objectif-revenu-auth-session-v1';
const APP_STORAGE_PREFIX = 'objectif-revenu-app-v3';
const AUTH_EVENT = 'objectif-revenu-auth-change';

export const GUEST_USER_ID = 'guest';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUserProfile(row: UserProfileRow): AppUserProfile {
  return {
    id: row.id,
    email: normalizeEmail(row.email),
    createdAt: row.created_at,
    trialStartDate: row.trial_start_date,
    isPremium: Boolean(row.is_premium),
  };
}

function readAppState(storageKey: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function dedupeEntries(entries: PersistedEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (!entry?.id) {
      return true;
    }

    if (seen.has(entry.id)) {
      return false;
    }

    seen.add(entry.id);
    return true;
  });
}

function buildSession(session: Session | null): AuthSession | null {
  const user = session?.user;
  const email = normalizeEmail(user?.email ?? '');

  if (!user?.id || !email) {
    return null;
  }

  return {
    userId: user.id,
    email,
    signedInAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

function readPersistedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.userId || !parsed?.email) {
      return null;
    }

    return {
      userId: String(parsed.userId),
      email: normalizeEmail(String(parsed.email)),
      signedInAt:
        typeof parsed.signedInAt === 'string' ? parsed.signedInAt : new Date().toISOString(),
    } satisfies AuthSession;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  window.dispatchEvent(new CustomEvent<AuthSession | null>(AUTH_EVENT, { detail: session }));
}

async function syncSessionFromSupabase() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const nextSession = buildSession(session);
  persistSession(nextSession);
  return nextSession;
}

export function getStoredSession() {
  return readPersistedSession();
}

export function subscribeToAuthChanges(callback: (session: AuthSession | null) => void) {
  function handleLocalAuthChange(event: Event) {
    callback((event as CustomEvent<AuthSession | null>).detail ?? null);
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== SESSION_KEY) return;
    callback(getStoredSession());
  }

  window.addEventListener(AUTH_EVENT, handleLocalAuthChange);
  window.addEventListener('storage', handleStorage);

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    persistSession(buildSession(session));
  });

  callback(getStoredSession());
  void syncSessionFromSupabase().catch(() => {
    persistSession(null);
  });

  return () => {
    subscription.unsubscribe();
    window.removeEventListener(AUTH_EVENT, handleLocalAuthChange);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function sendMagicLink(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('L’email est requis.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(error.message || 'Impossible d’envoyer le lien de connexion.');
  }
}

export function signOut() {
  persistSession(null);
  void supabase.auth.signOut();
}

export async function getUserProfile(userId: string) {
  if (!userId || userId === GUEST_USER_ID) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, created_at, trial_start_date, is_premium')
    .eq('id', userId)
    .maybeSingle<UserProfileRow>();

  if (error) {
    throw new Error(error.message || 'Impossible de charger le profil utilisateur.');
  }

  return data ? mapUserProfile(data) : null;
}

export async function getOrCreateUserProfile(userId: string, email: string) {
  if (!userId || userId === GUEST_USER_ID) return null;

  const normalizedEmail = normalizeEmail(email);
  const existingProfile = await getUserProfile(userId);

  if (existingProfile) {
    if (existingProfile.email !== normalizedEmail) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ email: normalizedEmail })
        .eq('id', userId)
        .select('id, email, created_at, trial_start_date, is_premium')
        .single<UserProfileRow>();

      if (error) {
        throw new Error(error.message || 'Impossible de mettre à jour le profil utilisateur.');
      }

      return mapUserProfile(data);
    }

    return existingProfile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: normalizedEmail,
      trial_start_date: new Date().toISOString(),
      is_premium: false,
    })
    .select('id, email, created_at, trial_start_date, is_premium')
    .single<UserProfileRow>();

  if (error) {
    throw new Error(error.message || 'Impossible de créer le profil utilisateur.');
  }

  return mapUserProfile(data);
}

export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message || 'Impossible de récupérer l’utilisateur connecté.');
  }

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    userId: user.id,
    email: normalizeEmail(user.email),
  } satisfies AuthenticatedUser;
}

export async function getOrCreateCurrentUserProfile() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return null;
  }

  return getOrCreateUserProfile(authUser.userId, authUser.email);
}

export async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || 'Impossible de récupérer la session utilisateur.');
  }

  return session?.access_token ?? null;
}

export async function createCheckoutSession() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Vous devez être connecté pour continuer.');
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : 'Impossible de créer la session de paiement.';
    throw new Error(message);
  }

  if (!payload || typeof payload.url !== 'string' || !payload.url) {
    throw new Error('L’URL Stripe est invalide.');
  }

  return payload.url;
}

export async function activatePremiumForUser(userId: string) {
  if (!userId || userId === GUEST_USER_ID) {
    throw new Error('Un compte utilisateur est requis pour activer Premium.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', userId)
    .select('id, email, created_at, trial_start_date, is_premium')
    .single<UserProfileRow>();

  if (error) {
    throw new Error(error.message || 'Impossible d’activer Premium.');
  }

  return mapUserProfile(data);
}

export function isTrialExpired(
  user: Pick<AppUserProfile, 'trialStartDate' | 'isPremium'> | null,
  now = new Date()
) {
  if (!user || user.isPremium || !user.trialStartDate) {
    return false;
  }

  const start = new Date(user.trialStartDate);
  if (Number.isNaN(start.getTime())) {
    return false;
  }

  return now.getTime() - start.getTime() > 10 * 86_400_000;
}

export function getAppStorageKey(userId: string) {
  return `${APP_STORAGE_PREFIX}:${userId}`;
}

export function getGuestAppStorageKey() {
  return getAppStorageKey(GUEST_USER_ID);
}

export function migrateGuestAppStateToUser(userId: string) {
  if (!userId || userId === GUEST_USER_ID) return;

  const guestKey = getGuestAppStorageKey();
  const userKey = getAppStorageKey(userId);
  const guestState = readAppState(guestKey);

  if (!guestState) return;

  const userState = readAppState(userKey);
  if (!userState) {
    localStorage.setItem(userKey, JSON.stringify(guestState));
    localStorage.removeItem(guestKey);
    return;
  }

  const guestPayments = Array.isArray(guestState.payments)
    ? guestState.payments as PersistedEntry[]
    : [];
  const userPayments = Array.isArray(userState.payments)
    ? userState.payments as PersistedEntry[]
    : [];
  const guestCharges = Array.isArray(guestState.charges)
    ? guestState.charges as PersistedEntry[]
    : [];
  const userCharges = Array.isArray(userState.charges)
    ? userState.charges as PersistedEntry[]
    : [];

  const mergedState = {
    ...guestState,
    ...userState,
    payments: dedupeEntries([...guestPayments, ...userPayments]),
    charges: dedupeEntries([...guestCharges, ...userCharges]),
  };

  localStorage.setItem(userKey, JSON.stringify(mergedState));
  localStorage.removeItem(guestKey);
}
