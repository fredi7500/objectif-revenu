export type StatutSolo =
  | 'micro-entreprise (auto-entrepreneur)'
  | 'SASU';

export type TauxStatut = {
  prelevement: number;
};

export function getTauxByStatut(statut: StatutSolo): TauxStatut {
  switch (statut) {
    case 'micro-entreprise (auto-entrepreneur)':
      return { prelevement: 0.22 };

    case 'SASU':
      return { prelevement: 0.45 };

    default:
      return { prelevement: 0.22 };
  }
}

export type Entry = {
  amount: number;
};

export function calculTotalEntrees(items: Entry[]): number {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

export function calculPrelevementEstime(
  totalEncaisse: number,
  statut: StatutSolo
): number {
  const { prelevement } = getTauxByStatut(statut);
  return totalEncaisse * prelevement;
}

export function calculRevenuDisponibleAvantIR(
  totalEncaisse: number,
  monthlyCharges: number,
  statut: StatutSolo
): number {
  const prelevement = calculPrelevementEstime(totalEncaisse, statut);
  return totalEncaisse - prelevement - Number(monthlyCharges || 0);
}

export function calculCaNecessaireAvantIR(
  objectifRevenu: number,
  monthlyCharges: number,
  statut: StatutSolo
): number {
  const { prelevement } = getTauxByStatut(statut);

  if (prelevement >= 1) return 0;

  return (Number(objectifRevenu || 0) + Number(monthlyCharges || 0)) / (1 - prelevement);
}

export function calculResteAEncaisser(
  objectifCa: number,
  totalEncaisse: number
): number {
  return Math.max(0, objectifCa - totalEncaisse);
}

export function calculProgression(
  totalEncaisse: number,
  objectifCa: number
): number {
  if (objectifCa <= 0) return 0;
  return Math.min(100, (totalEncaisse / objectifCa) * 100);
}

export function calculNiveauDepuisProgression(progress: number) {
  if (progress >= 100) return { level: 5, title: 'Maîtrise' };
  if (progress >= 75) return { level: 4, title: 'Dernière ligne droite' };
  if (progress >= 50) return { level: 3, title: 'Accélération' };
  if (progress >= 25) return { level: 2, title: 'En mouvement' };
  return { level: 1, title: 'Lancement' };
}

export function calculProgressionNiveau(progress: number): number {
  if (progress >= 100) return 100;
  if (progress > 0 && progress % 25 === 0) return 25;
  return progress % 25;
}
