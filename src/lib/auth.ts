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

const USERS_KEY = 'objectif-revenu-auth-users-v1';
const SESSION_KEY = 'objectif-revenu-auth-session-v1';
const APP_STORAGE_PREFIX = 'objectif-revenu-app-v3';
const AUTH_EVENT = 'objectif-revenu-auth-change';

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
