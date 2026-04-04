export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type AuthSession = {
  userId: string;
  email: string;
  signedInAt: string;
};

type PersistedEntry = { id?: string };

const USERS_KEY = 'objectif-revenu-auth-users-v1';
const SESSION_KEY = 'objectif-revenu-auth-session-v1';
const APP_STORAGE_PREFIX = 'objectif-revenu-app-v3';
const AUTH_EVENT = 'objectif-revenu-auth-change';

export const GUEST_USER_ID = 'guest';

function readUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

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

async function hashPassword(password: string) {
  const value = password.trim();

  if (!value) {
    throw new Error('Le mot de passe est requis.');
  }

  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildSession(user: AuthUser): AuthSession {
  return {
    userId: user.id,
    email: user.email,
    signedInAt: new Date().toISOString(),
  };
}

function persistSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  window.dispatchEvent(new CustomEvent<AuthSession | null>(AUTH_EVENT, { detail: session }));
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.userId || !parsed?.email) {
      return null;
    }

    const users = readUsers();
    const matchingUser = users.find(
      (user) => user.id === parsed.userId && user.email === normalizeEmail(parsed.email)
    );

    if (!matchingUser) {
      persistSession(null);
      return null;
    }

    return {
      userId: matchingUser.id,
      email: matchingUser.email,
      signedInAt:
        typeof parsed.signedInAt === 'string' ? parsed.signedInAt : new Date().toISOString(),
    } satisfies AuthSession;
  } catch {
    return null;
  }
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

  return () => {
    window.removeEventListener(AUTH_EVENT, handleLocalAuthChange);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function signUp(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('L’email est requis.');
  }

  if (password.trim().length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
  }

  const users = readUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('Un compte existe déjà avec cet email.');
  }

  const user: AuthUser = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  saveUsers([user, ...users]);

  const session = buildSession(user);
  persistSession(session);
  return session;
}

export async function signIn(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('L’email est requis.');
  }

  const users = readUsers();
  const user = users.find((entry) => entry.email === normalizedEmail);
  if (!user) {
    throw new Error('Compte introuvable.');
  }

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) {
    throw new Error('Mot de passe incorrect.');
  }

  const session = buildSession(user);
  persistSession(session);
  return session;
}

export function signOut() {
  persistSession(null);
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
