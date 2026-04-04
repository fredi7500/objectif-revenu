import { useEffect, useState } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';

function getCurrentView() {
  return window.location.hash.startsWith('#/app') ? 'app' : 'landing';
}

export default function Root() {
  const [view, setView] = useState<'landing' | 'app'>(() => getCurrentView());

  useEffect(() => {
    const handleHashChange = () => {
      setView(getCurrentView());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (view === 'app') {
    return <App />;
  }

  return <LandingPage />;
}
