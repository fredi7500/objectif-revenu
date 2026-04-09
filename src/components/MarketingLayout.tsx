import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { applyPageMetadata, type PageMetadata } from '@/lib/seo';

type MarketingLayoutProps = {
  metadata: PageMetadata;
  children: ReactNode;
};

const seoLinks = [
  { href: '/calcul-revenu-auto-entrepreneur', label: 'Calcul revenu auto-entrepreneur' },
  { href: '/combien-ca-pour-3000-net', label: 'CA pour 3000€ net' },
  { href: '/simulateur-revenu-freelance', label: 'Simulateur revenu freelance' },
];

export default function MarketingLayout({ metadata, children }: MarketingLayoutProps) {
  useEffect(() => {
    applyPageMetadata(metadata);
  }, [metadata]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f9ff_0%,#edf4ff_30%,#eef8f3_100%)] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_30%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3">
          {/* Replace this asset when the new Cap Revenu logo image is available if the bitmap still shows "Cash Pilot". */}
          <img
            src="/logo-cashpilot.png"
            alt="Cap Revenu logo"
            className="h-10 w-auto rounded-xl object-contain shadow-[0_20px_50px_rgba(15,23,42,0.14)] sm:h-11"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Cap Revenu</p>
            <p className="text-sm text-slate-600">Simulateur de revenu pour indépendants</p>
          </div>
        </a>

        <div className="hidden items-center gap-3 sm:flex">
          <a className="text-sm font-medium text-slate-600 transition hover:text-slate-950" href="/#prix">
            Tarifs
          </a>
          <a
            href="/app"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
          >
            Essayer gratuitement
          </a>
        </div>
      </header>

      <main>{children}</main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-8 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo-cashpilot.png"
            alt="Cap Revenu logo"
            className="h-8 w-auto object-contain"
          />
          <span>Cap Revenu</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/" className="transition hover:text-slate-950">
            Accueil
          </a>
          {seoLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-slate-950">
              {link.label}
            </a>
          ))}
          <a href="/app" className="transition hover:text-slate-950">
            Simulateur
          </a>
        </div>
        <p>Cap Revenu vous aide à estimer votre revenu mensuel, votre chiffre d’affaires cible et votre progression.</p>
      </footer>
    </div>
  );
}
