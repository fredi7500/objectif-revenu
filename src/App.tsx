import { useEffect, useState } from 'react';
import ObjectifRevenuApp from './components/ObjectifRevenuApp';
import {
  getOrCreateUserProfile,
  GUEST_USER_ID,
  getStoredSession,
  type AppUserProfile,
  migrateGuestAppStateToUser,
  signOut,
  subscribeToAuthChanges,
  type AuthSession,
} from './lib/auth';

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);

  useEffect(() => subscribeToAuthChanges(setSession), []);
  useEffect(() => {
    if (!session?.userId) return;
    migrateGuestAppStateToUser(session.userId);
  }, [session?.userId]);
  useEffect(() => {
    let cancelled = false;

    async function syncUserProfile() {
      if (!session?.userId || !session.email) {
        setUserProfile(null);
        return;
      }

      try {
        const profile = await getOrCreateUserProfile(session.userId, session.email);
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
  }, [session?.userId, session?.email]);

  return (
    <ObjectifRevenuApp
      userId={session?.userId ?? GUEST_USER_ID}
      userEmail={session?.email ?? 'Mode invité'}
      userProfile={userProfile}
      isAuthenticated={Boolean(session)}
      onSignOut={() => {
        signOut();
        setSession(null);
        setUserProfile(null);
      }}
    />
  );
}

export default App;
