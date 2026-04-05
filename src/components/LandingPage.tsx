import { motion } from 'framer-motion';
import {
  ArrowRight,
  Clock3,
  Eye,
  Gauge,
  Rocket,
  ShieldCheck,
  Target,
} from 'lucide-react';
import MarketingLayout from '@/components/MarketingLayout';
import { Card, CardContent } from '@/components/ui/card';
import PhoneMockup from '@/components/PhoneMockup';

const steps = [
  {
    title: 'Définissez votre objectif mensuel',
    description: 'Choisissez votre revenu cible, votre statut et votre rythme de travail pour poser un cap clair dès le départ.',
  },
  {
    title: 'Calculez le chiffre d’affaires à viser',
    description: 'L’outil de calcul de revenu transforme votre objectif net en estimation de chiffre d’affaires concrète et exploitable.',
  },
  {
    title: 'Suivez votre progression chaque mois',
    description: 'Vous savez ce qui est déjà encaissé, ce qu’il reste à facturer et le rythme à tenir pour atteindre votre revenu mensuel.',
  },
];

const differentiators = [
  {
    title: 'Simple à prendre en main',
    description: 'Pas de tableau complexe ni de jargon inutile, seulement les chiffres utiles pour décider vite.',
    icon: Gauge,
  },
  {
    title: 'Focus résultat',
    description: 'Chaque écran répond à une question précise : combien encaisser pour atteindre votre objectif de revenu mensuel.',
    icon: Target,
  },
  {
    title: 'Vision immédiate',
    description: 'En quelques secondes, vous savez exactement combien vous devez encaisser pour atteindre votre objectif.',
    icon: Eye,
  },
];

const testimonials = [
  {
    quote:
      'Avant, je pilotais mon mois au feeling. Maintenant, je sais immédiatement si mon chiffre d’affaires est au bon niveau.',
    name: 'Camille',
    role: 'Freelance en communication',
  },
  {
    quote:
      'L’application me dit clairement ce qu’il me reste à encaisser pour atteindre mon revenu. C’est rapide et très rassurant.',
    name: 'Thomas',
    role: 'Consultant indépendant',
  },
  {
    quote:
      'En deux minutes, je sais où j’en suis et quel chiffre d’affaires viser pour finir le mois.',
    name: 'Sarah',
    role: 'Designer freelance',
  },
];

const seoSections = [
  {
    title: 'Comment calculer son revenu en tant qu’indépendant ?',
    paragraphs: [
      'Le revenu d’un indépendant, d’un freelance ou d’un auto-entrepreneur ne se résume pas au chiffre d’affaires encaissé. Il faut tenir compte du statut, des prélèvements et du niveau d’activité réellement nécessaire.',
      'La méthode la plus simple consiste à partir du revenu net souhaité, puis à remonter vers le chiffre d’affaires à viser. Vous obtenez ainsi un repère clair pour piloter votre activité.',
      'Cash Pilot vous aide à faire ce calcul revenu rapidement et à suivre votre progression sans perdre de temps.',
    ],
  },
  {
    title: 'Combien de chiffre d’affaires pour atteindre 3000€ net ?',
    paragraphs: [
      'Atteindre 3000€ net demande toujours plus de 3000€ de chiffre d’affaires. Le montant exact dépend de votre statut, de vos charges et de votre mode de rémunération.',
      'Un simulateur revenu permet d’éviter les estimations approximatives. Vous partez d’un objectif clair et obtenez une estimation de chiffre d’affaires adaptée à votre situation.',
      'Cette lecture vous aide à fixer un cap mensuel crédible et à savoir rapidement si vous êtes dans le bon rythme.',
    ],
  },
  {
    title: 'Pourquoi suivre son objectif de revenu est essentiel ?',
    paragraphs: [
      'Beaucoup d’indépendants regardent leur activité trop tard, alors que les décisions utiles se prennent pendant le mois. Suivre son objectif de revenu permet d’agir avant de subir un écart.',
      'Vous savez ce qui a déjà été encaissé, ce qu’il reste à produire et si votre rythme actuel est suffisant. Cette visibilité améliore le pilotage du revenu et réduit l’incertitude.',
      'Cash Pilot transforme ce suivi en indicateurs simples, lisibles et directement utiles pour décider.',
    ],
  },
];

const faqItems = [
  {
    question: 'Combien gagner en auto-entrepreneur ?',
    answer:
      'Le revenu dépend du chiffre d’affaires encaissé, de l’activité exercée et des cotisations associées. Le plus utile est de définir un revenu mensuel cible, puis de calculer le chiffre d’affaires à atteindre.',
  },
  {
    question: 'Quel chiffre d’affaires pour 2000€, 3000€ ou 5000€ net ?',
    answer:
      'Le montant varie selon le statut, les charges et les prélèvements applicables. Cash Pilot permet de partir de votre objectif de revenu mensuel pour obtenir une estimation de chiffre d’affaires plus précise.',
  },
];

export default function LandingPage() {
  return (
    <MarketingLayout
      metadata={{
        title:
          'Simulateur revenu indépendant : combien de chiffre d’affaires viser ? | Cash Pilot',
        description:
          'Calculez combien vous devez encaisser pour atteindre votre revenu mensuel avec Cash Pilot, outil de calcul de revenu pour indépendant, freelance et auto-entrepreneur.',
      }}
    >
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Outil de calcul de revenu pour indépendants
            </motion.div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo-cashpilot.png"
                  alt="Cash Pilot logo"
                  className="h-9 w-auto object-contain sm:h-10"
                />
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Cash Pilot
                </span>
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Calculez combien vous devez encaisser pour atteindre votre revenu mensuel
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Arrêtez de piloter à l’aveugle. Définissez un objectif clair et suivez exactement ce qu’il vous reste à encaisser pour atteindre votre revenu.
              </p>
              <p className="max-w-xl text-base leading-7 text-slate-600">
                Cash Pilot est un simulateur revenu pour indépendant, freelance et auto-entrepreneur qui transforme votre objectif en plan d’action concret, sans tableur ni calculs compliqués.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/#/app"
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
                  <p className="text-sm text-cyan-200">Objectif de revenu mensuel</p>
                  <p className="mt-1 text-2xl font-bold">Montant à encaisser clair</p>
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
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Quand on travaille en indépendant, le revenu manque souvent de lisibilité.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                Entre les charges, les statuts et le chiffre d’affaires à encaisser, beaucoup pilotent encore leur
                activité sans repère clair. Résultat : du stress, des décisions prises trop tard et des fins de mois imprévisibles.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-emerald-100 bg-white/90 shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
            <CardContent className="p-7 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">La solution</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                L’application vous indique quoi viser, quoi suivre et combien il reste.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Cash Pilot transforme votre revenu cible en estimation de chiffre d’affaires, suit vos
                encaissements et vous montre immédiatement ce qu’il reste à atteindre.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <Card className="overflow-hidden rounded-[36px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111f3f_60%,#0b2b2a_100%)] text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <CardContent className="p-7 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Fonctionnement</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Trois étapes simples pour piloter votre mois.</h2>

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
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Une application pensée pour obtenir un résultat, pas pour vous occuper.
          </h2>
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
                <div className="text-sm font-semibold tracking-[0.18em] text-amber-500">★★★★★</div>
                <p className="mt-3 text-base leading-7 text-slate-700">“{testimonial.quote}”</p>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="space-y-5">
          {seoSections.map((section) => (
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

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Questions fréquentes sur le calcul revenu et le chiffre d’affaires
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {faqItems.map((item) => (
            <Card
              key={item.question}
              className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-slate-950">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
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
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Testez gratuitement, puis restez sur une formule simple.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                10 jours gratuits pour essayer l’application. Ensuite, 5,99€/mois pour continuer à piloter votre
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
              Sachez enfin combien encaisser pour atteindre votre revenu, chaque mois.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-200">
              Commencez gratuitement, fixez votre objectif et pilotez votre revenu avec une estimation claire du chiffre d’affaires à atteindre.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/#/app"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-base font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Essayer gratuitement
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </MarketingLayout>
  );
}
