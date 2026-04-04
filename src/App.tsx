import { useEffect, useState } from 'react';
import ObjectifRevenuApp from './components/ObjectifRevenuApp';
import {
  GUEST_USER_ID,
  getStoredSession,
  migrateGuestAppStateToUser,
  signOut,
  subscribeToAuthChanges,
  type AuthSession,
} from './lib/auth';

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  useEffect(() => subscribeToAuthChanges(setSession), []);
  useEffect(() => {
    if (!session?.userId) return;
    migrateGuestAppStateToUser(session.userId);
  }, [session?.userId]);

  return (
    <ObjectifRevenuApp
      userId={session?.userId ?? GUEST_USER_ID}
      userEmail={session?.email ?? 'Mode invité'}
      isAuthenticated={Boolean(session)}
      onSignOut={() => {
        signOut();
        setSession(null);
      }}
    />
  );
}

export default App;
