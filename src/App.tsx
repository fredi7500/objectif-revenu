import { useEffect, useState } from 'react';
import ObjectifRevenuApp from './components/ObjectifRevenuApp';
import AuthScreen from './components/AuthScreen';
import {
  getStoredSession,
  signOut,
  subscribeToAuthChanges,
  type AuthSession,
} from './lib/auth';

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());

  useEffect(() => subscribeToAuthChanges(setSession), []);

  if (!session) {
    return <AuthScreen onAuthenticated={setSession} />;
  }

  return (
    <ObjectifRevenuApp
      userId={session.userId}
      userEmail={session.email}
      onSignOut={() => {
        signOut();
        setSession(null);
      }}
    />
  );
}

export default App;
