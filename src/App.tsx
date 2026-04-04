import { useEffect, useState } from 'react';
import ObjectifRevenuApp from './components/ObjectifRevenuApp';
import {
  GUEST_USER_ID,
  getStoredSession,
  signOut,
  subscribeToAuthChanges,
  type AuthSession,
} from './lib/auth';

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  useEffect(() => subscribeToAuthChanges(setSession), []);

  return (
    <ObjectifRevenuApp
      userId={session?.userId ?? GUEST_USER_ID}
      userEmail={session?.email ?? 'Mode invité'}
      isAuthenticated={Boolean(session)}
      onAuthenticated={setSession}
      onSignOut={() => {
        signOut();
        setSession(null);
      }}
    />
  );
}

export default App;
