import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
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
      'Cap Revenu vous aide à faire ce calcul revenu rapidement et à suivre votre progression sans perdre de temps.',
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
      'Cap Revenu transforme ce suivi en indicateurs simples, lisibles et directement utiles pour décider.',
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
      'Le montant varie selon le statut, les charges et les prélèvements applicables. Cap Revenu permet de partir de votre objectif de revenu mensuel pour obtenir une estimation de chiffre d’affaires plus précise.',
  },
];

export default function LandingPage() {
  const [openSeoSection, setOpenSeoSection] = useState(0);
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);

  return (
    <MarketingLayout
      metadata={{
        title:
          'Simulateur revenu indépendant : combien de chiffre d’affaires viser ? | Cap Revenu',
        description:
          'Calculez combien vous devez encaisser pour atteindre votre revenu mensuel avec Cap Revenu, outil de calcul de revenu pour indépendant, freelance et auto-entrepreneur.',
      }}
    >
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:px-4 sm:py-2 sm:text-sm"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Outil de calcul de revenu pour indépendants
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <img
                  src="/logo-cashpilot.png"
                  alt="Cap Revenu logo"
                  className="h-8 w-auto object-contain sm:h-10"
                />
                {/* Replace this asset when the new Cap Revenu logo image is available if the bitmap still shows "Cash Pilot". */}
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-sm sm:tracking-[0.24em]">
                  Cap Revenu
                </span>
              </div>
              <h1 className="max-w-3xl text-[2rem] font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Arrêtez de piloter votre revenu à l’aveugle
              </h1>
              <p className="max-w-2xl text-[15px] leading-6 text-slate-600 sm:text-lg sm:leading-7">
                Cap Revenu vous montre combien encaisser et où vous en êtes, en un coup d’œil.
              </p>
              <p className="max-w-xl text-[15px] leading-6 text-slate-600 sm:text-base sm:leading-7">
                Fixez votre objectif, suivez votre progression et sachez exactement ce qu’il vous reste à encaisser.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <div className="flex flex-col items-center sm:items-start">
                <a
                  href="/app"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-base font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <p className="text-xs text-white/60 mt-2 text-center">
                  Sans engagement
                </p>
              </div>
              <a
                href="#fonctionnement"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:text-slate-950"
              >
                Voir comment ça marche
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              <Card className="h-full rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="flex h-full flex-col p-4 sm:p-5">
                  <p className="text-xs text-slate-500 sm:text-sm">Essai gratuit</p>
                  <p className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">10 jours</p>
                </CardContent>
              </Card>
              <Card className="h-full rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                <CardContent className="flex h-full flex-col p-4 sm:p-5">
                  <p className="text-xs text-slate-500 sm:text-sm">Abonnement</p>
                  <p className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">5,99€/mois</p>
                </CardContent>
              </Card>
              <Card className="col-span-2 h-full rounded-[28px] border border-white/80 bg-white/85 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:col-span-1">
                <CardContent className="flex h-full flex-col p-4 sm:p-5">
                  <p className="text-xs text-slate-500 sm:text-sm">Réassurance</p>
                  <p className="mt-1.5 text-lg font-semibold leading-tight text-slate-950 sm:mt-2 sm:text-xl">
                    Sans engagement
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">Annulable à tout moment</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="relative mx-auto w-full max-w-[320px] sm:max-w-none"
          >
            <div className="absolute left-0 top-8 h-20 w-20 rounded-full bg-cyan-200/70 blur-3xl sm:-left-4 sm:top-10 sm:h-36 sm:w-36" />
            <div className="absolute right-0 bottom-8 h-24 w-24 rounded-full bg-emerald-200/60 blur-3xl sm:-right-2 sm:bottom-10 sm:h-40 sm:w-40" />
            <PhoneMockup className="relative z-10" />
            <div className="pointer-events-none absolute inset-x-4 bottom-5 z-20 rounded-[22px] border border-white/10 bg-slate-950/88 p-3 text-white shadow-[0_24px_70px_rgba(2,8,23,0.32)] backdrop-blur sm:inset-x-auto sm:-left-6 sm:bottom-8 sm:rounded-[24px] sm:p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-cyan-200 sm:text-sm">Objectif de revenu mensuel</p>
                  <p className="mt-1 text-lg font-bold leading-tight sm:text-2xl">Montant à encaisser clair</p>
                </div>
                <div className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-200 sm:px-3 sm:text-sm">
                  Actionnable
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          <Card className="rounded-[32px] border-0 bg-slate-950 text-white shadow-[0_25px_70px_rgba(15,23,42,0.16)]">
            <CardContent className="p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 sm:text-sm sm:tracking-[0.18em]">Le problème</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:mt-3 sm:text-3xl">
                Quand on travaille en indépendant, le revenu manque souvent de lisibilité.
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-300 sm:mt-4 sm:text-base sm:leading-7">
                Entre les charges, les statuts et le chiffre d’affaires à encaisser, beaucoup pilotent encore leur
                activité sans repère clair. Résultat : du stress, des décisions prises trop tard et des fins de mois imprévisibles.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border border-emerald-100 bg-white/90 shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
            <CardContent className="p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 sm:text-sm sm:tracking-[0.18em]">La solution</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:mt-3 sm:text-3xl">
                L’application vous indique quoi viser, quoi suivre et combien il reste.
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                Cap Revenu transforme votre revenu cible en estimation de chiffre d’affaires, suit vos
                encaissements et vous montre immédiatement ce qu’il reste à atteindre.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="fonctionnement" className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-16">
        <Card className="overflow-hidden rounded-[36px] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#111f3f_60%,#0b2b2a_100%)] text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <CardContent className="p-5 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 sm:text-sm sm:tracking-[0.18em]">Fonctionnement</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:mt-3 sm:text-3xl">Trois étapes simples pour piloter votre mois.</h2>

            <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-3 md:gap-5">
              {steps.map((step, index) => (
                <div key={step.title} className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur sm:rounded-[28px] sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 sm:h-11 sm:w-11">
                    <span className="text-base font-black">{index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold sm:mt-4 sm:text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300 sm:mt-3">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.18em]">Pourquoi c’est différent</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Une application pensée pour obtenir un résultat, pas pour vous occuper.
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-3 md:gap-5">
          {differentiators.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-950 sm:mt-5 sm:text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.18em]">Avis clients</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Des indépendants qui pilotent déjà leur revenu plus clairement.
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-3 md:gap-5">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="text-xs font-semibold tracking-[0.16em] text-amber-500 sm:text-sm sm:tracking-[0.18em]">★★★★★</div>
                <p className="mt-2 text-[15px] leading-6 text-slate-700 sm:mt-3 sm:text-base sm:leading-7">“{testimonial.quote}”</p>
                <div className="mt-4 sm:mt-5">
                  <p className="text-sm font-semibold text-slate-950">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 lg:py-10">
        <div className="space-y-3 sm:space-y-5">
          {seoSections.map((section, index) => {
            const isOpen = openSeoSection === index;

            return (
              <Card
                key={section.title}
                className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <CardContent className="p-4 sm:p-8">
                  <button
                    type="button"
                    onClick={() => setOpenSeoSection(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 rounded-[20px] py-1 text-left sm:cursor-default sm:py-0"
                    aria-expanded={isOpen}
                  >
                    <h2 className="pr-2 text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">{section.title}</h2>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-transform duration-300 sm:hidden">
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  <div
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out sm:mt-4 sm:grid-rows-[1fr] sm:opacity-100 ${
                      isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0 sm:mt-4'
                    }`}
                  >
                    <div className="min-h-0">
                      <div className="space-y-2.5 text-[15px] leading-6 text-slate-600 sm:space-y-3 sm:text-base sm:leading-7">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.18em]">FAQ</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Questions fréquentes sur le calcul revenu et le chiffre d’affaires
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:mt-6 md:grid-cols-2 md:gap-5">
          {faqItems.map((item, index) => {
            const isOpen = openFaqItem === index;

            return (
              <Card
                key={item.question}
                className="rounded-[30px] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
              >
                <CardContent className="p-4 sm:p-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaqItem(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 rounded-[20px] py-1 text-left sm:cursor-default sm:py-0"
                    aria-expanded={isOpen}
                  >
                    <h3 className="pr-2 text-lg font-bold text-slate-950 sm:text-xl">{item.question}</h3>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-transform duration-300 sm:hidden">
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  <div
                    className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out sm:mt-3 sm:grid-rows-[1fr] sm:opacity-100 ${
                      isOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0 sm:mt-3'
                    }`}
                  >
                    <div className="min-h-0">
                      <p className="text-sm leading-6 text-slate-600">{item.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="prix" className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8 lg:py-16">
        <Card className="overflow-hidden rounded-[36px] border border-emerald-100 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
          <CardContent className="grid gap-5 p-5 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 sm:text-sm sm:tracking-[0.18em]">Prix</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:mt-3 sm:text-3xl">
                Testez gratuitement, puis restez sur une formule simple.
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                10 jours gratuits pour essayer l’application. Ensuite, 5,99€/mois pour continuer à piloter votre
                revenu avec un outil clair, utile et sans friction.
              </p>
            </div>

            <div className="rounded-[24px] bg-slate-950 p-5 text-white shadow-[0_25px_70px_rgba(15,23,42,0.18)] sm:rounded-[28px] sm:p-6">
              <div className="flex items-center gap-3 text-cyan-300">
                <Clock3 className="h-5 w-5" />
                <span className="text-sm font-semibold">10 jours gratuits</span>
              </div>
              <p className="mt-4 text-4xl font-black tracking-tight sm:mt-5 sm:text-5xl">5,99€</p>
              <p className="mt-1.5 text-sm text-slate-300 sm:mt-2">par mois, sans complexité</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pb-24">
        <Card className="overflow-hidden rounded-[38px] border-0 bg-[linear-gradient(135deg,#082f49_0%,#0f172a_55%,#14532d_100%)] text-white shadow-[0_35px_100px_rgba(15,23,42,0.22)]">
          <CardContent className="p-5 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300 backdrop-blur sm:h-14 sm:w-14">
              <Rocket className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:mt-5 sm:text-4xl">
              Sachez enfin combien encaisser pour atteindre votre revenu, chaque mois.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-6 text-slate-200 sm:mt-4 sm:text-base sm:leading-7">
              Commencez gratuitement, fixez votre objectif et pilotez votre revenu avec une estimation claire du chiffre d’affaires à atteindre.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:mt-8 sm:flex-row">
              <a
                href="/app"
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
