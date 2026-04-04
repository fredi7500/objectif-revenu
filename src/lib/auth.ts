import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AuthSession = {
  userId: string;
  email: string;
  signedInAt: string;
};

type PersistedEntry = { id?: string };

const SESSION_KEY = 'objectif-revenu-auth-session-v1';
const APP_STORAGE_PREFIX = 'objectif-revenu-app-v3';
const AUTH_EVENT = 'objectif-revenu-auth-change';

export const GUEST_USER_ID = 'guest';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
