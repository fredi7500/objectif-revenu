import SeoContentPage from '@/components/SeoContentPage';

const relatedLinks = [
  { href: '/', label: 'Découvrir Cash Pilot' },
  { href: '/calcul-revenu-auto-entrepreneur', label: 'Calcul revenu auto-entrepreneur' },
  { href: '/combien-ca-pour-3000-net', label: 'Combien de chiffre d’affaires pour 3000€ net ?' },
  { href: '/simulateur-revenu-freelance', label: 'Simulateur revenu freelance' },
  { href: '/#/app', label: 'Accéder au simulateur' },
];

export function CalculRevenuAutoEntrepreneurPage() {
  return (
    <SeoContentPage
      metadata={{
        title: 'Calcul revenu auto-entrepreneur : estimer son chiffre d’affaires | Cash Pilot',
        description:
          'Estimez combien gagner en auto-entrepreneur et quel chiffre d’affaires viser pour atteindre votre revenu mensuel avec Cash Pilot.',
      }}
      eyebrow="Guide pratique pour auto-entrepreneur"
      title="Calcul revenu auto-entrepreneur : combien de chiffre d’affaires viser pour votre revenu mensuel ?"
      intro="Cash Pilot vous aide à estimer combien gagner en auto-entrepreneur selon votre objectif net, votre activité et votre rythme mensuel. Vous visualisez plus rapidement le chiffre d’affaires à encaisser pour atteindre un revenu réaliste."
      sections={[
        {
          title: 'Comment calculer son revenu en auto-entrepreneur ?',
          paragraphs: [
            'Le revenu d’un auto-entrepreneur ne correspond pas à son chiffre d’affaires encaissé. Il faut tenir compte des cotisations, du type d’activité et du niveau d’encaissement nécessaire pour conserver un revenu stable.',
            'Le plus simple est de partir d’un objectif mensuel net, puis de remonter vers le chiffre d’affaires à produire. Cette logique évite de travailler avec des montants trop théoriques.',
            'Cash Pilot vous aide à transformer ce calcul en objectif concret, lisible et facile à suivre chaque mois.',
          ],
        },
        {
          title: 'Combien gagner en auto-entrepreneur pour vivre correctement ?',
          paragraphs: [
            'La bonne réponse dépend de votre niveau de charges, de vos besoins personnels et du temps réellement disponible pour produire. Deux indépendants avec le même chiffre d’affaires peuvent dégager un revenu très différent.',
            'L’enjeu n’est donc pas seulement de gagner plus, mais de savoir combien encaisser pour atteindre un revenu utile. Un objectif clair aide à prendre de meilleures décisions commerciales.',
            'En suivant votre progression mensuelle, vous pouvez ajuster vos actions avant la fin du mois plutôt que subir le résultat.',
          ],
        },
        {
          title: 'Pourquoi un simulateur de revenu indépendant est utile ?',
          paragraphs: [
            'Un simulateur évite les estimations approximatives et les tableurs difficiles à maintenir. Vous obtenez une vue directe de votre objectif de revenu mensuel et du chiffre d’affaires correspondant.',
            'Cette visibilité permet de mieux piloter votre activité, vos offres et votre volume de missions. Vous savez plus vite si votre rythme actuel est suffisant.',
            'Cash Pilot a été conçu pour rendre cette lecture simple, rapide et actionnable.',
          ],
        },
      ]}
      relatedLinks={relatedLinks}
    />
  );
}

export function CombienCaPour3000NetPage() {
  return (
    <SeoContentPage
      metadata={{
        title: 'Combien de chiffre d’affaires pour 3000€ net ? | Cash Pilot',
        description:
          'Découvrez combien de chiffre d’affaires viser pour atteindre 3000€ net par mois et pilotez votre objectif avec Cash Pilot.',
      }}
      eyebrow="Objectif de revenu mensuel"
      title="Combien de chiffre d’affaires faut-il pour atteindre 3000€ net par mois ?"
      intro="Pour atteindre 3000€ net, il faut raisonner à partir de votre statut, de vos prélèvements et du chiffre d’affaires réellement encaissé. Cash Pilot vous permet de transformer cet objectif en trajectoire mensuelle claire."
      sections={[
        {
          title: 'Pourquoi 3000€ net ne correspondent pas à 3000€ encaissés ?',
          paragraphs: [
            'Le revenu net est toujours inférieur au chiffre d’affaires encaissé. Entre les charges et le cadre fiscal, il faut produire plus que le montant que vous souhaitez réellement garder.',
            'C’est pourquoi un objectif de 3000€ net demande un calcul précis. Sans ce repère, il est facile de sous-estimer l’effort commercial à fournir.',
            'Cash Pilot permet de visualiser cette différence immédiatement.',
          ],
        },
        {
          title: 'Quel chiffre d’affaires viser pour 3000€ net ?',
          paragraphs: [
            'Le montant exact varie selon que vous exercez en micro-entreprise, en SASU ou dans une autre configuration. Le niveau de prélèvements n’est pas le même et le chiffre d’affaires cible non plus.',
            'L’approche la plus utile consiste à définir votre objectif mensuel net, puis à calculer le chiffre d’affaires nécessaire avec le bon scénario. Vous obtenez ainsi un cap réaliste pour votre mois.',
            'Cette méthode est plus fiable qu’un simple calcul mental ou qu’une estimation rapide.',
          ],
        },
        {
          title: 'Comment suivre cet objectif au fil du mois ?',
          paragraphs: [
            'Un bon objectif ne sert à rien s’il n’est pas suivi régulièrement. Vous devez savoir ce que vous avez déjà encaissé, ce qu’il manque et si votre rythme est suffisant.',
            'Avec Cash Pilot, vous reliez directement votre revenu cible à votre progression mensuelle. Vous voyez rapidement si vous êtes en avance, au bon niveau ou en retard.',
            'Ce suivi améliore à la fois la visibilité et la conversion de vos efforts commerciaux.',
          ],
        },
      ]}
      relatedLinks={relatedLinks}
    />
  );
}

export function SimulateurRevenuFreelancePage() {
  return (
    <SeoContentPage
      metadata={{
        title: 'Simulateur revenu freelance : calculez votre objectif mensuel | Cash Pilot',
        description:
          'Utilisez un simulateur de revenu freelance pour savoir combien encaisser chaque mois et atteindre votre objectif de revenu avec Cash Pilot.',
      }}
      eyebrow="Simulateur revenu freelance"
      title="Simulateur de revenu freelance : calculez combien encaisser pour atteindre votre objectif mensuel"
      intro="Cash Pilot est un simulateur de revenu pour indépendants qui vous aide à savoir combien encaisser pour atteindre votre objectif mensuel. Vous partez de votre revenu cible et obtenez une lecture claire de votre trajectoire."
      sections={[
        {
          title: 'À quoi sert un simulateur de revenu freelance ?',
          paragraphs: [
            'Un simulateur de revenu freelance sert à relier vos objectifs financiers à votre activité réelle. Vous ne pilotez plus votre mois uniquement au ressenti ou au volume de travail.',
            'Vous pouvez estimer plus rapidement le chiffre d’affaires nécessaire et mieux anticiper votre niveau de revenu. Cette lecture vous aide à prioriser les bonnes actions.',
            'Cash Pilot a été conçu pour rendre ce pilotage simple et compréhensible.',
          ],
        },
        {
          title: 'Comment calculer combien de chiffre d’affaires pour un revenu net ?',
          paragraphs: [
            'Le principe consiste à partir du revenu net souhaité, puis à intégrer le statut et les prélèvements applicables. Le résultat donne un objectif de chiffre d’affaires plus réaliste à atteindre.',
            'Cette méthode est particulièrement utile pour les freelances qui veulent lisser leur revenu sur le mois. Elle donne un repère commercial concret et exploitable.',
            'Vous pouvez ensuite suivre l’écart entre votre objectif et vos encaissements.',
          ],
        },
        {
          title: 'Pourquoi suivre son objectif de revenu est essentiel ?',
          paragraphs: [
            'Sans suivi, même un bon mois peut sembler flou. Vous risquez de manquer de visibilité sur votre rentabilité réelle et sur le niveau d’effort encore nécessaire.',
            'Le suivi d’objectif permet d’agir plus tôt sur vos offres, votre prospection ou votre rythme de production. Vous transformez un revenu subi en revenu piloté.',
            'C’est précisément la logique de Cash Pilot.',
          ],
        },
      ]}
      relatedLinks={relatedLinks}
    />
  );
}
