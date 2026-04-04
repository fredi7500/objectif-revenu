import { motion } from 'framer-motion';
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Eye,
  Gauge,
  Quote,
  Rocket,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PhoneMockup from '@/components/PhoneMockup';

const steps = [
  {
    title: 'Renseigne ton objectif',
    description: 'Choisis ton revenu cible, ton statut et ton rythme de travail en moins d’une minute.',
  },
  {
    title: 'Vois ce qu’il faut encaisser',
    description: 'L’app transforme ton objectif net en chiffre d’affaires concret avec le bon niveau de lecture.',
  },
  {
    title: 'Pilote chaque mois',
    description: 'Tu sais combien il manque, où tu en es et quoi faire pour rester dans le rythme.',
  },
];

const differentiators = [
  {
    title: 'Simple à prendre en main',
    description: 'Pas de tableau complexe, pas de jargon fiscal inutile, juste les chiffres qui aident à décider.',
    icon: Gauge,
  },
  {
    title: 'Focus résultat',
    description: 'Chaque écran est pensé pour répondre à une seule question : combien encaisser pour atteindre ton objectif.',
    icon: Target,
  },
  {
    title: 'Vision immédiate',
    description: 'Tu visualises ton avancée, ton reste à encaisser et la trajectoire du mois sans perdre de temps.',
    icon: Eye,
  },
];

const testimonials = [
  {
    quote:
      'Avant, je pilotais mon mois au feeling. Maintenant, je vois tout de suite si je suis dans le bon rythme.',
    name: 'Camille',
    role: 'Freelance en communication',
  },
  {
    quote:
      'L’app me donne une vision simple de ce qu’il me reste à encaisser. C’est clair, rapide et rassurant.',
    name: 'Thomas',
    role: 'Consultant indépendant',
  },
  {
    quote:
      'J’aime le côté concret. En deux minutes, je sais où j’en suis et ce que je dois viser pour finir le mois.',
    name: 'Sarah',
    role: 'Designer freelance',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f9ff_0%,#edf4ff_30%,#eef8f3_100%)] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.10),transparent_30%)]" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-500 uppercase">Objectif revenu</p>
            <p className="text-sm text-slate-600">Copilote pour indépendants</p>
          </div>
        </a>

        <div className="hidden items-center gap-3 sm:flex">
          <a className="text-sm font-medium text-slate-600 transition hover:text-slate-950" href="#prix">
            Tarifs
          </a>
          <a
            href="#/app"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
          >
            Essayer gratuitement
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Garde le cap sur ton revenu chaque mois
              </motion.div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Fixe ton objectif, suis ta progression, atteins ton revenu.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Objectif Revenu aide les indépendants à transformer un revenu cible en plan concret,
                  lisible et actionnable, sans tableur ni calcul mental.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#/app"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-base font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a
                  href="#fonctionnement"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:text-slate-950"
                >
                  Voir comment ça marche
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500">Essai gratuit</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">10 jours</p>
                  </CardContent>
                </Card>
                <Card className="rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500">Abonnement</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">5,99€/mois</p>
                  </CardContent>
                </Card>
                <Card className="rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <CardContent className="p-5">
                    <p className="text-sm text-slate-500">Promesse</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">Plus clair</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="relative"
            >
              <div className="absolute -left-4 top-10 h-28 w-28 rounded-full bg-cyan-200/70 blur-3xl sm:h-36 sm:w-36" />
              <div className="absolute -right-2 bottom-10 h-32 w-32 rounded-full bg-emerald-200/60 blur-3xl sm:h-40 sm:w-40" />
              <PhoneMockup className="relative z-10" />
              <div className="pointer-events-none absolute -left-2 bottom-8 z-20 rounded-[24px] border border-white/10 bg-slate-950/88 p-4 text-white shadow-[0_24px_70px_rgba(2,8,23,0.32)] backdrop-blur sm:-left-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-cyan-200">Progression mensuelle</p>
                    <p className="mt-1 text-2xl font-bold">Vision concrète du mois</p>
                  </div>
                  <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-semibold text-emerald-200">
                    Actionnable
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-[32px] border-0 bg-slate-950 text-white shadow-[0_25px_70px_rgba(15,23,42,0.16)]">
              <CardContent className="p-7 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Le problème</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight">Quand tu es indé, ton revenu manque souvent de lisibilité.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  Entre les charges, les statuts et le chiffre d’affaires à encaisser, beaucoup pilotent au
                  feeling. Résultat : du stress, des décisions floues et des fins de mois subies.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border border-emerald-100 bg-white/90 shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
              <CardContent className="p-7 sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">La solution</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">L’app te dit quoi viser, quoi suivre et combien il reste.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  Objectif Revenu transforme ton revenu cible en trajectoire de chiffre d’affaires, suit tes
                  encaissements et te montre instantanément ton avancée.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <Card className="overflow-hidden rounded-[36px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111f3f_60%,#0b2b2a_100%)] text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
            <CardContent className="p-7 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Fonctionnement</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Trois étapes simples pour piloter ton mois.</h2>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {steps.map((step, index) => (
                  <div key={step.title} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                      <span className="text-base font-black">{index + 1}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pourquoi c’est différent</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Une app pensée pour obtenir un résultat, pas pour t’occuper.</h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {differentiators.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
                >
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Avis clients</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Des indépendants qui pilotent déjà leur revenu plus clairement.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card
                key={testimonial.name}
                className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300">
                    <Quote className="h-5 w-5" />
                  </div>
                  <p className="mt-5 text-base leading-7 text-slate-700">“{testimonial.quote}”</p>
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="prix" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <Card className="overflow-hidden rounded-[36px] border border-emerald-100 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
            <CardContent className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Prix</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Teste gratuitement, puis reste sur une formule simple.</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  10 jours gratuits pour essayer l’app. Ensuite, 5,99€/mois pour continuer à piloter ton
                  revenu avec un outil clair, utile et sans friction.
                </p>
              </div>

              <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[0_25px_70px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3 text-cyan-300">
                  <Clock3 className="h-5 w-5" />
                  <span className="text-sm font-semibold">10 jours gratuits</span>
                </div>
                <p className="mt-5 text-5xl font-black tracking-tight">5,99€</p>
                <p className="mt-2 text-sm text-slate-300">par mois, sans complexité</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24">
          <Card className="overflow-hidden rounded-[38px] border-0 bg-[linear-gradient(135deg,#082f49_0%,#0f172a_55%,#14532d_100%)] text-white shadow-[0_35px_100px_rgba(15,23,42,0.22)]">
            <CardContent className="p-7 text-center sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 backdrop-blur">
                <Rocket className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Passe d’un revenu subi à un revenu piloté.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-200">
                Commence gratuitement, fixe ton objectif et vois tout de suite combien tu dois encaisser pour y arriver.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href="#/app"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Essayer gratuitement
                </a>
                <a
                  href="#fonctionnement"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Voir le fonctionnement
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-8 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div>Objectif Revenu</div>
        <p>Landing visible sur `/`, app accessible via `/#/app`.</p>
      </footer>
    </div>
  );
}
