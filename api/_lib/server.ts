import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export { getEnv };

export function getAppUrl() {
  return process.env.VITE_APP_URL ?? 'http://localhost:3000';
}

export function getStripeClient() {
  return new Stripe(getEnv('STRIPE_SECRET_KEY'));
}

export function getSupabaseServerClient() {
  return createClient(
    getEnv('VITE_SUPABASE_URL'),
    getEnv('VITE_SUPABASE_ANON_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export function getSupabaseAdminClient() {
  return createClient(
    getEnv('VITE_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function getAuthenticatedUserFromRequest(req: { headers: Record<string, string | string[] | undefined> }) {
  const authorization = req.headers.authorization;
  const bearer = Array.isArray(authorization) ? authorization[0] : authorization;
  const token = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;

  if (!token) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message || 'Unable to verify Supabase user.');
  }

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function readRawBody(req: AsyncIterable<Buffer | string>) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}
