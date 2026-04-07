import { useEffect, useState } from 'react';
import App from './App';
import LandingPage from './components/LandingPage';
import PaymentStatusPage from './components/PaymentStatusPage';
import {
  CalculRevenuAutoEntrepreneurPage,
  CombienCaPour3000NetPage,
  SimulateurRevenuFreelancePage,
} from './components/seoPages';

type View =
  | 'landing'
  | 'app'
  | 'success'
  | 'cancel'
  | 'calcul-revenu-auto-entrepreneur'
  | 'combien-ca-pour-3000-net'
  | 'simulateur-revenu-freelance';

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}

function getCurrentView(): View {
  if (window.location.hash.startsWith('#/app')) {
    return 'app';
  }

  const pathname = normalizePathname(window.location.pathname);

  if (pathname === '/calcul-revenu-auto-entrepreneur') {
    return 'calcul-revenu-auto-entrepreneur';
  }

  if (pathname === '/success') {
    return 'success';
  }

  if (pathname === '/cancel') {
    return 'cancel';
  }

  if (pathname === '/combien-ca-pour-3000-net') {
    return 'combien-ca-pour-3000-net';
  }

  if (pathname === '/simulateur-revenu-freelance') {
    return 'simulateur-revenu-freelance';
  }

  return 'landing';
}

export default function Root() {
  const [view, setView] = useState<View>(() => getCurrentView());

  useEffect(() => {
    const syncView = () => {
      setView(getCurrentView());
    };

    window.addEventListener('hashchange', syncView);
    window.addEventListener('popstate', syncView);
    return () => {
      window.removeEventListener('hashchange', syncView);
      window.removeEventListener('popstate', syncView);
    };
  }, []);

  if (view === 'app') {
    return <App />;
  }

  if (view === 'calcul-revenu-auto-entrepreneur') {
    return <CalculRevenuAutoEntrepreneurPage />;
  }

  if (view === 'success') {
    return <PaymentStatusPage status="success" />;
  }

  if (view === 'cancel') {
    return <PaymentStatusPage status="cancel" />;
  }

  if (view === 'combien-ca-pour-3000-net') {
    return <CombienCaPour3000NetPage />;
  }

  if (view === 'simulateur-revenu-freelance') {
    return <SimulateurRevenuFreelancePage />;
  }

  return <LandingPage />;
}
