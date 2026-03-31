export type MicroActivity = 'achat-revente' | 'services' | 'liberale';

const SASU_IS_REDUCED_RATE = 0.15;
const SASU_IS_REDUCED_THRESHOLD_ANNUAL = 42_500;

export function getMicroRate(activity: MicroActivity): number {
  switch (activity) {
    case 'achat-revente':
      return 0.123;
    case 'services':
      return 0.212;
    case 'liberale':
      return 0.256;
    default:
      return 0.212;
  }
}

export function calculTotalEntrees(
  items: Array<{ amount?: number; amountHT?: number }>
): number {
  return items.reduce(
    (sum, item) => sum + Number(item.amountHT ?? item.amount ?? 0),
    0
  );
}

export function calculPrelevementMicro(
  totalEncaisse: number,
  activity: MicroActivity
): number {
  return totalEncaisse * getMicroRate(activity);
}

export function calculPrelevementProportionnel(
  totalEncaisse: number,
  rate: number
): number {
  const normalizedTotal = Number(totalEncaisse || 0);
  const normalizedRate = Number(rate || 0);

  if (!Number.isFinite(normalizedTotal) || !Number.isFinite(normalizedRate)) {
    return 0;
  }

  return normalizedTotal * normalizedRate;
}

export function calculBeneficeAvantIs(
  totalEncaisse: number,
  chargesFixes: number
): number {
  return Math.max(0, Number(totalEncaisse || 0) - Number(chargesFixes || 0));
}

export function calculImpotSocietesSasuDividendes(
  totalEncaisse: number,
  chargesFixes: number,
  isRate = 0.25
): number {
  const beneficeMensuel = calculBeneficeAvantIs(totalEncaisse, chargesFixes);
  const beneficeAnnuel = beneficeMensuel * 12;
  const standardRate = Number(isRate || 0.25);

  if (!Number.isFinite(beneficeAnnuel) || beneficeAnnuel <= 0) {
    return 0;
  }

  const reducedBase = Math.min(beneficeAnnuel, SASU_IS_REDUCED_THRESHOLD_ANNUAL);
  const standardBase = Math.max(
    0,
    beneficeAnnuel - SASU_IS_REDUCED_THRESHOLD_ANNUAL
  );
  const impotAnnuel =
    reducedBase * SASU_IS_REDUCED_RATE + standardBase * standardRate;

  return impotAnnuel / 12;
}

export function calculBeneficeDistribuableApresIs(
  totalEncaisse: number,
  chargesFixes: number,
  isRate = 0.25
): number {
  const beneficeAvantIs = calculBeneficeAvantIs(totalEncaisse, chargesFixes);
  const impotSocietes = calculImpotSocietesSasuDividendes(totalEncaisse, chargesFixes, isRate);
  return Math.max(0, beneficeAvantIs - impotSocietes);
}

export function calculFlatTaxSasuDividendes(
  totalEncaisse: number,
  chargesFixes: number,
  isRate = 0.25,
  flatTaxRate = 0.314
): number {
  return calculBeneficeDistribuableApresIs(totalEncaisse, chargesFixes, isRate) * Number(flatTaxRate || 0);
}

export function calculCaNecessaireApresPrelevement(
  objectifRevenuNet: number,
  chargesFixes: number,
  rate: number
): number {
  const normalizedRate = Number(rate || 0);
  if (!Number.isFinite(normalizedRate) || normalizedRate >= 1) return 0;

  return (Number(objectifRevenuNet || 0) + Number(chargesFixes || 0)) / (1 - normalizedRate);
}

export function calculRevenuDisponibleApresPrelevement(
  totalEncaisse: number,
  chargesFixes: number,
  rate: number
): number {
  const prelevement = calculPrelevementProportionnel(totalEncaisse, rate);
  return totalEncaisse - prelevement - Number(chargesFixes || 0);
}

export function calculCaNecessaireSasuDividendes(
  objectifRevenuNet: number,
  chargesFixes: number,
  isRate = 0.25,
  flatTaxRate = 0.314
): number {
  const targetNet = Number(objectifRevenuNet || 0);
  const fixedCharges = Number(chargesFixes || 0);

  if (!Number.isFinite(targetNet) || targetNet <= 0) {
    return Math.max(0, fixedCharges);
  }

  let low = fixedCharges;
  let high = Math.max(fixedCharges + targetNet * 2, 1);

  while (
    calculRevenuDisponibleSasuDividendes(high, fixedCharges, isRate, flatTaxRate) <
    targetNet
  ) {
    high *= 2;
    if (high > 10_000_000) {
      break;
    }
  }

  for (let index = 0; index < 40; index += 1) {
    const mid = (low + high) / 2;
    const net = calculRevenuDisponibleSasuDividendes(
      mid,
      fixedCharges,
      isRate,
      flatTaxRate
    );

    if (net >= targetNet) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}

export function calculRevenuDisponibleSasuDividendes(
  totalEncaisse: number,
  chargesFixes: number,
  isRate = 0.25,
  flatTaxRate = 0.314
): number {
  const beneficeDistribuable = calculBeneficeDistribuableApresIs(totalEncaisse, chargesFixes, isRate);
  const flatTax = calculFlatTaxSasuDividendes(totalEncaisse, chargesFixes, isRate, flatTaxRate);
  return Math.max(0, beneficeDistribuable - flatTax);
}

export function calculCaNecessaireMicro(
  objectifRevenu: number,
  chargesFixes: number,
  activity: MicroActivity
): number {
  return calculCaNecessaireApresPrelevement(
    objectifRevenu,
    chargesFixes,
    getMicroRate(activity)
  );
}

export function calculRevenuDisponibleMicro(
  totalEncaisse: number,
  chargesFixes: number,
  activity: MicroActivity
): number {
  return calculRevenuDisponibleApresPrelevement(
    totalEncaisse,
    chargesFixes,
    getMicroRate(activity)
  );
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
