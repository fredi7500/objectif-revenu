import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import ObjectifRevenuApp from './components/ObjectifRevenuApp';
import AuthScreen from './components/AuthScreen';
import {
  GUEST_USER_ID,
  getOrCreateUserProfile,
  type AppUserProfile,
  migrateGuestAppStateToUser,
  signOut,
} from './lib/auth';
import { buildAppUrl, clearGuestModeInUrl, isGuestModeEnabledFromLocation, replaceLocation } from './lib/navigation';
import { supabase } from './lib/supabase';

const AUTH_DEBUG_PREFIX = '[supabase-magic-link]';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [guestMode, setGuestMode] = useState<boolean>(() => isGuestModeEnabledFromLocation(window.location));

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      console.info(`${AUTH_DEBUG_PREFIX} arrival route`, {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.info(`${AUTH_DEBUG_PREFIX} getSession() on app load`, {
        hasSession: Boolean(session),
        session,
        user: session?.user ?? null,
      });

      if (!cancelled) {
        setUser(session?.user ?? null);
        if (session?.user) {
          clearGuestModeInUrl();
          setGuestMode(false);
        }
      }
    }

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.info(`${AUTH_DEBUG_PREFIX} onAuthStateChange in App`, {
        event: _event,
        hasSession: Boolean(session),
        session,
        user: session?.user ?? null,
      });

      if (!cancelled) {
        setUser(session?.user ?? null);
        if (session?.user) {
          clearGuestModeInUrl();
          setGuestMode(false);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncGuestMode = () => {
      setGuestMode(isGuestModeEnabledFromLocation(window.location));
    };

    window.addEventListener('popstate', syncGuestMode);

    return () => {
      window.removeEventListener('popstate', syncGuestMode);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    migrateGuestAppStateToUser(user.id);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function syncUserProfile() {
      if (!user?.id || !user.email) {
        setUserProfileLoading(false);
        setUserProfile(null);
        return;
      }

      if (!cancelled) {
        setUserProfileLoading(true);
      }

      try {
        const profile = await getOrCreateUserProfile(user.id, user.email);
        console.info('[supabase-profile] sync success in App', {
          userId: user.id,
          email: user.email,
          hasProfile: Boolean(profile),
          profile,
        });
        if (!cancelled) {
          setUserProfile(profile);
          setUserProfileLoading(false);
        }
      } catch (error) {
        console.error('[supabase-profile] sync failed in App', {
          userId: user.id,
          email: user.email,
          error,
        });
        if (!cancelled) {
          setUserProfile(null);
          setUserProfileLoading(false);
        }
      }
    }

    void syncUserProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.id]);

  if (!user && !guestMode) {
    return (
      <AuthScreen
        onContinueAsGuest={() => {
          replaceLocation(buildAppUrl({ guest: true }));
          setGuestMode(true);
        }}
      />
    );
  }

  return (
    <ObjectifRevenuApp
      userId={user?.id ?? GUEST_USER_ID}
      userEmail={user?.email?.trim().toLowerCase() ?? 'Mode invité'}
      userProfile={userProfile}
      isUserProfileLoading={userProfileLoading}
      isAuthenticated={Boolean(user)}
      onUserProfileChange={setUserProfile}
      onSignOut={() => {
        signOut();
        setUser(null);
        setUserProfile(null);
        setUserProfileLoading(false);
      }}
    />
  );
}

export default App;
