import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import MarketingLayout from '@/components/MarketingLayout';
import type { PageMetadata } from '@/lib/seo';
import { buildAppUrl } from '@/lib/navigation';

type Section = {
  title: string;
  paragraphs: string[];
};

type RelatedLink = {
  href: string;
  label: string;
};

type SeoContentPageProps = {
  metadata: PageMetadata;
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  relatedLinks: RelatedLink[];
};

export default function SeoContentPage({
  metadata,
  eyebrow,
  title,
  intro,
  sections,
  relatedLinks,
}: SeoContentPageProps) {
  const appEntryUrl = buildAppUrl({ guest: true });

  return (
    <MarketingLayout metadata={metadata}>
      <section className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {eyebrow}
          </div>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{intro}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={appEntryUrl}
              className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-base font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              Lancer le simulateur
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:text-slate-950"
            >
              Retour à la page principale
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-5">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <CardContent className="p-7 sm:p-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">{section.title}</h2>
                <div className="mt-4 space-y-3 text-base leading-7 text-slate-600">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="overflow-hidden rounded-[36px] border-0 bg-[linear-gradient(135deg,#082f49_0%,#0f172a_55%,#14532d_100%)] text-white shadow-[0_35px_100px_rgba(15,23,42,0.22)]">
          <CardContent className="p-7 sm:p-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Continuer votre lecture</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {relatedLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-[24px] border border-white/15 bg-white/5 px-5 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </MarketingLayout>
  );
}
