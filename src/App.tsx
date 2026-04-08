import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import ObjectifRevenuApp from './components/ObjectifRevenuApp';
import {
  GUEST_USER_ID,
  getOrCreateUserProfile,
  type AppUserProfile,
  migrateGuestAppStateToUser,
  signOut,
} from './lib/auth';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!cancelled) {
        setUser(session?.user ?? null);
      }
    }

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
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
        setUserProfile(null);
        return;
      }

      try {
        const profile = await getOrCreateUserProfile(user.id, user.email);
        if (!cancelled) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Erreur profil utilisateur:', error);
        if (!cancelled) {
          setUserProfile(null);
        }
      }
    }

    void syncUserProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.id]);

  return (
    <ObjectifRevenuApp
      userId={user?.id ?? GUEST_USER_ID}
      userEmail={user?.email?.trim().toLowerCase() ?? 'Mode invité'}
      userProfile={userProfile}
      isAuthenticated={Boolean(user)}
      onSignOut={() => {
        signOut();
        setUser(null);
        setUserProfile(null);
      }}
    />
  );
}

export default App;
