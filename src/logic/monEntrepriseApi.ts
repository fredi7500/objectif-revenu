const MON_ENTREPRISE_API_URL = 'https://mon-entreprise.urssaf.fr/api/v1/evaluate';

type Situation = Record<string, string | number | boolean | null>;

type EvaluatePayload = {
  situation: Situation;
  expressions: string[];
};

type MissingVariables = Record<string, number>;

type EvaluateNode = {
  nodeValue?: number | null;
  unit?: {
    numerators?: string[];
    denominators?: string[];
  };
  missingVariables?: MissingVariables;
};

type EvaluateWarning = {
  message?: string;
};

type EvaluateResponse = {
  evaluate?: EvaluateNode[];
  warnings?: EvaluateWarning[];
  situationError?: unknown;
  responseCachedAt?: number;
  cacheExpiresAt?: number;
};

export async function evaluateMonEntreprise(
  payload: EvaluatePayload
): Promise<EvaluateResponse> {
  const response = await fetch(MON_ENTREPRISE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API Mon Entreprise error: ${response.status}`);
  }

  return response.json();
}

export type MicroApiActivity = 'achat-revente' | 'services' | 'liberale';

type MicroNatureConfig = {
  nature: string;
  serviceOuVente: "'service'" | "'vente'" | null;
  reglementee: string | null;
};

function normalizeMonthlyNodeValue(
  node: EvaluateNode | undefined,
  referenceMonthlyValue: number
) {
  const rawValue = node?.nodeValue;

  if (typeof rawValue !== 'number' || Number.isNaN(rawValue)) {
    return null;
  }

  const denominators = node?.unit?.denominators ?? [];

  if (denominators.includes('mois')) {
    return rawValue;
  }

  if (denominators.includes('an')) {
    return rawValue / 12;
  }

  return rawValue > referenceMonthlyValue * 2 ? rawValue / 12 : rawValue;
}

function getMicroNature(activity: MicroApiActivity): MicroNatureConfig {
  if (activity === 'achat-revente') {
    return {
      nature: "'commerciale'",
      serviceOuVente: "'vente'",
      reglementee: null,
    };
  }

  if (activity === 'liberale') {
    return {
      nature: "'libérale'",
      serviceOuVente: null,
      reglementee: "non",
    };
  }

  return {
    nature: "'commerciale'",
    serviceOuVente: "'service'",
    reglementee: null,
  };
}

export async function simulateMicroFromNet(
  targetNetMonthly: number,
  activity: MicroApiActivity
) {
  const activityConfig = getMicroNature(activity);

  const situation: Situation = {
    "entreprise . catégorie juridique": "'EI'",
    "entreprise . catégorie juridique . EI . auto-entrepreneur": "oui",
    "dirigeant . auto-entrepreneur": "oui",
    "dirigeant . auto-entrepreneur . éligible à l'ACRE": "non",
    "entreprise . imposition": "'micro'",
    "entreprise . activité . nature": activityConfig.nature,
    "entreprise . activités . revenus mixtes": "non",
    "entreprise . date de création": "01/01/2026",
    "établissement . commune . département": "'Paris'",
    "établissement . commune . département . outre-mer": "non",
    "dirigeant . auto-entrepreneur . revenu net": `${targetNetMonthly} €/mois`,
  };

  if (activityConfig.serviceOuVente) {
    situation["entreprise . activités . service ou vente"] =
      activityConfig.serviceOuVente;
  }

  if (activityConfig.reglementee !== null) {
    situation["entreprise . activité . nature . libérale . réglementée"] =
      activityConfig.reglementee;
  }

  const payload: EvaluatePayload = {
    situation,
    expressions: [
      "dirigeant . auto-entrepreneur . revenu net",
      "dirigeant . auto-entrepreneur . chiffre d'affaires",
    ],
  };

  const result = await evaluateMonEntreprise(payload);
  console.log("API RESPONSE", result);

  const netNode = result.evaluate?.[0];
  const caNode = result.evaluate?.[1];

  const netMonthly = normalizeMonthlyNodeValue(netNode, targetNetMonthly);
  const caMonthly = normalizeMonthlyNodeValue(
    caNode,
    Math.max(targetNetMonthly, 1)
  );

  console.log('MICRO API DEBUG', {
    activity,
    situation,
    netNode,
    caNode,
    warnings: result.warnings ?? [],
    raw: result,
  });

  if (
    typeof netMonthly !== 'number' ||
    typeof caMonthly !== 'number' ||
    Number.isNaN(netMonthly) ||
    Number.isNaN(caMonthly) ||
    caMonthly <= 0
  ) {
    throw new Error(
      `Simulation micro invalide pour activité=${activity}. Vérifie MICRO API DEBUG dans la console.`
    );
  }

  return {
    netMonthly,
    caMonthly,
    prelevementMonthly: caMonthly - netMonthly,
    missingNet: netNode?.missingVariables ?? {},
    missingCa: caNode?.missingVariables ?? {},
    warnings: result.warnings ?? [],
    raw: result,
  };
}

export async function simulateMicroFromTurnover(
  turnoverMonthly: number,
  activity: MicroApiActivity
) {
  const activityConfig = getMicroNature(activity);

  const situation: Situation = {
    "entreprise . catégorie juridique": "'EI'",
    "entreprise . catégorie juridique . EI . auto-entrepreneur": "oui",
    "dirigeant . auto-entrepreneur": "oui",
    "dirigeant . auto-entrepreneur . éligible à l'ACRE": "non",
    "entreprise . imposition": "'micro'",
    "entreprise . activité . nature": activityConfig.nature,
    "entreprise . activités . revenus mixtes": "non",
    "entreprise . date de création": "01/01/2026",
    "établissement . commune . département": "'Paris'",
    "établissement . commune . département . outre-mer": "non",
    "dirigeant . auto-entrepreneur . chiffre d'affaires": `${turnoverMonthly} €/mois`,
  };

  if (activityConfig.serviceOuVente) {
    situation["entreprise . activités . service ou vente"] =
      activityConfig.serviceOuVente;
  }

  if (activityConfig.reglementee !== null) {
    situation["entreprise . activité . nature . libérale . réglementée"] =
      activityConfig.reglementee;
  }

  const payload: EvaluatePayload = {
    situation,
    expressions: [
      "dirigeant . auto-entrepreneur . revenu net",
      "dirigeant . auto-entrepreneur . chiffre d'affaires",
    ],
  };

  const result = await evaluateMonEntreprise(payload);
  console.log("API RESPONSE", result);

  const netNode = result.evaluate?.[0];
  const caNode = result.evaluate?.[1];

  const netMonthly = normalizeMonthlyNodeValue(netNode, turnoverMonthly);
  const caFromApiMonthly = normalizeMonthlyNodeValue(caNode, turnoverMonthly);

  console.log('MICRO TURNOVER API DEBUG', {
    activity,
    situation,
    netNode,
    caNode,
    warnings: result.warnings ?? [],
    raw: result,
  });

  if (
    typeof netMonthly !== 'number' ||
    Number.isNaN(netMonthly) ||
    typeof caFromApiMonthly !== 'number' ||
    Number.isNaN(caFromApiMonthly) ||
    caFromApiMonthly < 0
  ) {
    throw new Error(
      `Simulation micro sur CA invalide pour activité=${activity}. Vérifie API RESPONSE dans la console.`
    );
  }
  const caMonthly = turnoverMonthly;

  return {
    netMonthly,
    caMonthly,
    prelevementMonthly: caMonthly - netMonthly,
    apiCaMonthly: caFromApiMonthly,
    missingNet: netNode?.missingVariables ?? {},
    missingCa: caNode?.missingVariables ?? {},
    warnings: result.warnings ?? [],
    raw: result,
  };
}

export async function simulateSasuSalaryFromNet(
  targetNetMonthly: number
) {
  const payload: EvaluatePayload = {
    situation: {
      "entreprise . catégorie juridique": "'SAS'",
      "entreprise . imposition": "'IS'",
      "salarié": "oui",
      "dirigeant . assimilé salarié": "oui",
      "salarié . rémunération . net . à payer avant impôt": `${targetNetMonthly} €/mois`,
      "entreprise . date de création": "01/01/2026",
      "établissement . commune . département": "'Paris'",
      "établissement . commune . département . outre-mer": "non",
      "entreprise . charges": "0 €/mois",
    },
    expressions: [
      "salarié . rémunération . net . à payer avant impôt",
      "salarié . coût total employeur",
    ],
  };

  const result = await evaluateMonEntreprise(payload);

  const netNode = result.evaluate?.[0];
  const costNode = result.evaluate?.[1];

  const netMonthly = netNode?.nodeValue;
  const costMonthly = costNode?.nodeValue;

  console.log('SASU API DEBUG', {
    payload,
    result,
    netMonthly,
    costMonthly,
    missingNet: netNode?.missingVariables ?? {},
    missingCost: costNode?.missingVariables ?? {},
    warnings: result.warnings ?? [],
  });

  if (
    typeof netMonthly !== 'number' ||
    typeof costMonthly !== 'number' ||
    Number.isNaN(netMonthly) ||
    Number.isNaN(costMonthly) ||
    costMonthly <= 0
  ) {
    throw new Error('Simulation SASU invalide');
  }

  return {
    netMonthly,
    costMonthly,
    prelevementMonthly: costMonthly - netMonthly,
    missingNet: netNode?.missingVariables ?? {},
    missingCost: costNode?.missingVariables ?? {},
    warnings: result.warnings ?? [],
    raw: result,
  };
}
