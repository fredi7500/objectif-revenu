import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  simulateMicroFromNet,
  simulateMicroFromTurnover,
  simulateSasuSalaryFromNet,
} from '@/logic/monEntrepriseApi';
import {
  calculTotalEntrees,
  calculResteAEncaisser,
  calculProgression,
  calculCaNecessaireSasuDividendes,
  calculFlatTaxSasuDividendes,
  calculImpotSocietesSasuDividendes,
  calculPrelevementProportionnel,
  calculRevenuDisponibleSasuDividendes,
} from '@/logic/calculations';
import {
  createPaymentFeedback,
  type FeedbackState,
  type FeedbackVariant,
} from '@/logic/feedback';
import {
  Trophy,
  Wallet,
  Flame,
  ChartColumn,
  Plus,
  Target,
  Sparkles,
  CircleDollarSign,
  Download,
  Minus,
} from 'lucide-react';

import AccountPromptDialog from '@/components/AccountPromptDialog';
import {
  getAppStorageKey,
  isTrialExpired as isUserTrialExpired,
  type AppUserProfile,
} from '@/lib/auth';

type PaymentInputMode = 'HT' | 'TTC';

type PaymentEntry = {
  id: string;
  amountInput: number;
  amountHT: number;
  amountVAT: number;
  inputMode: PaymentInputMode;
  createdAt: string;
  monthKey: string;
};

type ChargeEntry = {
  id: string;
  amount: number;
  createdAt: string;
  monthKey: string;
};

type MicroActivity = 'achat-revente' | 'services' | 'liberale';
type SasuMode = 'salaire' | 'dividendes';

const MAX_AMOUNT = 1_000_000;
const SASU_IS_RATE = 0.25;
const MICRO_MAX_SALARY_GOAL = 5100;
const TEMPORARY_STRIPE_PAYMENT_LINK =
  'https://buy.stripe.com/28EdR99GhgkPccP7N52Ji01';

type AppState = {
  setupDone: boolean;
  trialStartDate: string;
  isPremium: boolean;
  salaryGoal: number;
  status: 'micro-entreprise (auto-entrepreneur)' | 'SASU';
  microActivity: MicroActivity;
  sasuMode: SasuMode;
  paymentInputMode: PaymentInputMode;
  vatRate: number;
  targetDate: string;
  monthKey: string;
  payments: PaymentEntry[];
  charges: ChargeEntry[];
  quickAmounts: number[];
};

function currency(value: number | string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function sanitizeVatRate(value: number) {
  if (!Number.isFinite(value)) return 0.2;
  const normalized = value > 1 ? value / 100 : value;
  return Math.min(Math.max(normalized, 0), 1);
}

function clampAmount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), MAX_AMOUNT);
}

function sanitizeAmountInput(value: string) {
  const normalized = value.replace(',', '.');
  const parts = normalized.split('.');
  const rawIntegerPart = (parts[0] ?? '').replace(/\D/g, '');
  const decimalPart = parts.slice(1).join('').replace(/\D/g, '').slice(0, 2);
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, '');

  if (!integerPart && !decimalPart) {
    return '';
  }

  const rawValue = decimalPart ? `${integerPart || '0'}.${decimalPart}` : integerPart;
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return '';
  }

  if (parsed >= MAX_AMOUNT) {
    return String(MAX_AMOUNT);
  }

  return decimalPart ? `${integerPart || '0'}.${decimalPart}` : integerPart;
}

function parseAmountInput(value: string) {
  const sanitized = sanitizeAmountInput(value.trim());
  if (!sanitized) return 0;

  return clampAmount(Number(sanitized));
}

function normalizeAmountInput(value: string) {
  return sanitizeAmountInput(value.trim());
}

function clampQuickAmount(value: number) {
  return Math.round(clampAmount(value));
}

function handleAmountInputChange(
  event: ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void
) {
  setter(normalizeAmountInput(event.target.value));
}

function handleAmountPaste(
  event: ClipboardEvent<HTMLInputElement>,
  setter: (value: string) => void
) {
  event.preventDefault();
  setter(normalizeAmountInput(event.clipboardData.getData('text')));
}

function buildPaymentAmounts(amountInput: number, inputMode: PaymentInputMode, vatRate: number) {
  const safeAmount = clampAmount(Number(amountInput || 0));
  const safeRate = sanitizeVatRate(vatRate);

  if (inputMode === 'TTC') {
    const amountHT = roundCurrency(safeAmount / (1 + safeRate));
    const amountVAT = roundCurrency(safeAmount - amountHT);
    return {
      amountInput: roundCurrency(safeAmount),
      amountHT,
      amountVAT,
    };
  }

  return {
    amountInput: roundCurrency(safeAmount),
    amountHT: roundCurrency(safeAmount),
    amountVAT: 0,
  };
}

function normalizePaymentEntry(entry: Partial<PaymentEntry> & { amount?: number }, monthKey: string, vatRate: number): PaymentEntry {
  const inputMode = entry.inputMode === 'TTC' ? 'TTC' : 'HT';
  const fallbackAmount = Number(entry.amountInput ?? entry.amountHT ?? entry.amount ?? 0);
  const amounts = entry.amountHT !== undefined || entry.amountVAT !== undefined
    ? {
        amountInput: roundCurrency(clampAmount(Number(entry.amountInput ?? fallbackAmount))),
        amountHT: roundCurrency(clampAmount(Number(entry.amountHT ?? fallbackAmount))),
        amountVAT: roundCurrency(clampAmount(Number(entry.amountVAT ?? 0))),
      }
    : buildPaymentAmounts(fallbackAmount, inputMode, vatRate);

  return {
    id: entry.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    monthKey: entry.monthKey ?? monthKey,
    inputMode,
    ...amounts,
  };
}

function normalizeChargeEntry(entry: Partial<ChargeEntry> & { amount?: number }, monthKey: string): ChargeEntry {
  return {
    id: entry.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`),
    amount: clampAmount(Number(entry.amount ?? 0)),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    monthKey: entry.monthKey ?? monthKey,
  };
}

function getDaysLeft(date = new Date(), targetDate?: string) {
  if (targetDate) {
    const target = new Date(targetDate);
    if (!Number.isNaN(target.getTime())) {
      const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
      const diffMs = end.getTime() - today.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return Math.max(0, last.getDate() - date.getDate());
}

function getPaceReferenceDate(now: Date, targetDate?: string) {
  if (targetDate) {
    const parsed = new Date(targetDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

function getExpectedProgress(now: Date, targetDate?: string) {
  const referenceDate = getPaceReferenceDate(now, targetDate);
  const startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const totalDays = Math.max(
    1,
    Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1
  );
  const elapsedDays = Math.max(
    0,
    Math.min(totalDays, Math.floor((currentDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
  );

  return (elapsedDays / totalDays) * 100;
}

function hasRecentPayment(payments: PaymentEntry[], now = new Date()) {
  if (payments.length === 0) return false;

  const latestPaymentTime = payments.reduce((latest, payment) => {
    const paymentTime = new Date(payment.createdAt).getTime();
    if (Number.isNaN(paymentTime)) return latest;
    return Math.max(latest, paymentTime);
  }, 0);

  if (!latestPaymentTime) return false;

  const daysSinceLastPayment = (now.getTime() - latestPaymentTime) / 86_400_000;
  return daysSinceLastPayment <= 7;
}

function buildDefaultState(): AppState {
  return {
    setupDone: false,
    trialStartDate: new Date().toISOString(),
    isPremium: false,
    salaryGoal: 3000,
    status: 'micro-entreprise (auto-entrepreneur)',
    microActivity: 'services',
    sasuMode: 'salaire',
    paymentInputMode: 'HT',
    vatRate: 0.2,
    targetDate: '',
    monthKey: getMonthKey(),
    payments: [],
    charges: [],
    quickAmounts: [100, 250, 500, 1000],
  };
}

function motivationalMessage({
  progress,
  payments,
  targetDate,
  now = new Date(),
}: {
  progress: number;
  payments: PaymentEntry[];
  targetDate?: string;
  now?: Date;
}) {
  if (!hasRecentPayment(payments, now)) {
    if (payments.length === 0) return 'Aucun paiement récent.';
    return 'Reprends ton suivi aujourd hui.';
  }

  const expectedProgress = getExpectedProgress(now, targetDate);
  const delta = progress - expectedProgress;

  if (delta >= 10) {
    if (progress >= 85) return 'Tu peux dépasser ton objectif.';
    if (progress >= 50) return 'Excellent rythme.';
    return 'Tu es en avance sur ton objectif.';
  }

  if (delta <= -10) {
    if (progress <= 15) return 'Tu dois rattraper aujourd hui.';
    if (progress <= 50) return 'Attention, tu es sous le rythme.';
    return 'Tu es en retard, il faut accelerer.';
  }

  if (progress < 5) return 'Un premier paiement suffit a lancer la dynamique.';
  if (progress < 15) return 'Tu es lance, continue.';
  if (progress < 25) return 'Tu avances, ne ralentis pas.';
  if (progress < 35) return 'Tu es sur la bonne voie.';
  if (progress < 45) return 'Tu approches du milieu.';
  if (progress < 55) return 'Tu es a mi-parcours.';
  if (progress < 65) return 'Tu avances bien.';
  if (progress < 75) return 'Plus que quelques efforts.';
  if (progress < 85) return 'Tu y es presque.';
  if (progress < 95) return 'Encore un petit effort.';
  if (progress < 100) return 'Objectif presque atteint.';
  return 'Objectif atteint. Tout ce qui rentre maintenant est du bonus.';
}

function getPrelevementRate(state: AppState) {
  if (state.status === 'micro-entreprise (auto-entrepreneur)') {
    if (state.microActivity === 'achat-revente') return 0.123;
    if (state.microActivity === 'liberale') return 0.256;
    return 0.212;
  }

  if (state.status === 'SASU') {
    return state.sasuMode === 'dividendes' ? 0.314 : 0.75;
  }

  return 0.212;
}

function getStatusLabel(state: AppState) {
  if (state.status === 'micro-entreprise (auto-entrepreneur)') {
    if (state.microActivity === 'achat-revente') return 'Micro • Achat-revente';
    if (state.microActivity === 'liberale') return 'Micro • Libérale';
    return 'Micro • Services';
  }

  if (state.status === 'SASU') {
    return `SASU • ${state.sasuMode === 'salaire' ? 'Salaire' : 'Dividendes'}`;
  }

  return 'Micro • Services';
}

function getPrelevementLabel(state: AppState) {
  if (state.status === 'SASU') {
    return state.sasuMode === 'salaire'
      ? 'Charges salariales'
      : 'Flat tax sur dividendes (PFU 31.4%)';
  }

  return 'Prélèvement';
}

function getFeedbackVariantStyles(variant: FeedbackVariant) {
  if (variant === 'success') {
    return {
      card: 'border-emerald-300/35 bg-[linear-gradient(180deg,rgba(8,40,31,0.92)_0%,rgba(6,78,59,0.92)_100%)] shadow-[0_0_28px_rgba(16,185,129,0.22)]',
      badge: 'bg-emerald-400/18 text-emerald-100',
      icon: 'bg-emerald-400/18 text-emerald-200',
    };
  }

  if (variant === 'milestone') {
    return {
      card: 'border-cyan-300/35 bg-[linear-gradient(180deg,rgba(14,36,77,0.92)_0%,rgba(18,77,129,0.92)_100%)] shadow-[0_0_28px_rgba(34,211,238,0.2)]',
      badge: 'bg-cyan-400/18 text-cyan-100',
      icon: 'bg-cyan-400/18 text-cyan-200',
    };
  }

  if (variant === 'warning') {
    return {
      card: 'border-amber-300/35 bg-[linear-gradient(180deg,rgba(70,36,10,0.94)_0%,rgba(120,53,15,0.92)_100%)] shadow-[0_0_28px_rgba(251,146,60,0.18)]',
      badge: 'bg-amber-400/18 text-amber-100',
      icon: 'bg-amber-400/18 text-amber-200',
    };
  }

  return {
    card: 'border-cyan-400/25 bg-[linear-gradient(180deg,rgba(16,34,92,0.82)_0%,rgba(10,18,54,0.92)_100%)] shadow-[0_0_24px_rgba(59,130,246,0.16)]',
    badge: 'bg-cyan-400/18 text-cyan-100',
    icon: 'bg-cyan-400/18 text-cyan-200',
  };
}

function FeedbackIcon({ variant }: { variant: FeedbackVariant }) {
  if (variant === 'success' || variant === 'milestone') {
    return <Trophy className="h-5 w-5" />;
  }

  if (variant === 'warning') {
    return <Flame className="h-5 w-5" />;
  }

  return <ChartColumn className="h-5 w-5" />;
}

type ObjectifRevenuAppProps = {
  userId: string;
  userEmail: string;
  userProfile: AppUserProfile | null;
  isAuthenticated: boolean;
  onSignOut: () => void;
};

export default function ObjectifRevenuApp({
  userId,
  userEmail,
  userProfile,
  isAuthenticated,
  onSignOut,
}: ObjectifRevenuAppProps) {
  const storageKey = getAppStorageKey(userId);
  const [state, setState] = useState<AppState>(buildDefaultState());
  const [activeTab, setActiveTab] = useState('accueil');
  const [showSetup, setShowSetup] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCharge, setShowCharge] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [accountPromptReason, setAccountPromptReason] = useState<'payment-gate' | 'manual-signin'>('payment-gate');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [paymentFeedback, setPaymentFeedback] = useState<FeedbackState | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [apiResult, setApiResult] = useState<{
    caMonthly: number;
    prelevementMonthly: number;
    netMonthly: number;
    currentNetMonthly?: number;
    currentPrelevementMonthly?: number;
  } | null>(null);

  const [, setApiLoading] = useState(false);

  useEffect(() => {
    if (!paymentFeedback) return;

    const timeoutId = window.setTimeout(() => {
      setPaymentFeedback(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [paymentFeedback]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setShowAccountPrompt(false);
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setShowSetup(true);
        return;
      }

      const parsed = JSON.parse(raw);
      const currentMonth = getMonthKey();
      const paymentInputMode: PaymentInputMode =
        parsed.paymentInputMode === 'TTC' ? 'TTC' : 'HT';
      const vatRate = sanitizeVatRate(Number(parsed.vatRate ?? 0.2));
      const trialStartDate =
        typeof parsed.trialStartDate === 'string' && parsed.trialStartDate
          ? parsed.trialStartDate
          : new Date().toISOString();
      const hydrated: AppState = {
        ...buildDefaultState(),
        ...parsed,
        trialStartDate,
        isPremium: Boolean(parsed.isPremium),
        paymentInputMode,
        vatRate,
        monthKey: currentMonth,
        payments: Array.isArray(parsed.payments)
          ? parsed.payments
              .map((payment: Partial<PaymentEntry> & { amount?: number }) =>
                normalizePaymentEntry(payment, currentMonth, vatRate)
              )
              .filter((payment: PaymentEntry) => payment.monthKey === currentMonth)
          : [],
        charges: Array.isArray(parsed.charges)
          ? parsed.charges
              .map((charge: Partial<ChargeEntry> & { amount?: number }) =>
                normalizeChargeEntry(charge, currentMonth)
              )
              .filter((charge: ChargeEntry) => charge.monthKey === currentMonth)
          : [],
        quickAmounts:
          Array.isArray(parsed.quickAmounts) && parsed.quickAmounts.length === 4
            ? parsed.quickAmounts.map((n: number) => clampQuickAmount(Number(n || 0)))
            : [100, 250, 500, 1000],
      };

      setState(hydrated);
      setShowSetup(!hydrated.setupDone);
    } catch {
      setShowSetup(true);
    }
  }, [storageKey]);

  const totalReceived = useMemo(
    () => calculTotalEntrees(state.payments),
    [state.payments]
  );

  const totalVatCollected = useMemo(
    () => state.payments.reduce((sum, payment) => sum + Number(payment.amountVAT || 0), 0),
    [state.payments]
  );

  const totalAddedCharges = useMemo(
    () => calculTotalEntrees(state.charges),
    [state.charges]
  );

  const totalChargesGlobal = totalAddedCharges;
  const isSasu = state.status === 'SASU';
  const isSasuDividendes = isSasu && state.sasuMode === 'dividendes';
  const usesVat = isSasu && state.paymentInputMode === 'TTC';
  const isSasuDividendesHt = isSasuDividendes && !usesVat;
  const isSasuDividendesTtc = isSasuDividendes && usesVat;
  const usesSasuVatLayout = isSasu && usesVat;
  const effectivePaymentInputMode: PaymentInputMode = isSasu
    ? state.paymentInputMode
    : 'HT';
  const effectiveVatRate = usesVat ? state.vatRate : 0;

  useEffect(() => {
    let cancelled = false;

    async function runSimulation() {
      try {
        setApiLoading(true);

        if (state.status === 'micro-entreprise (auto-entrepreneur)') {
          const result = await simulateMicroFromNet(
            state.salaryGoal + totalChargesGlobal,
            state.microActivity
          );
          const currentResult = await simulateMicroFromTurnover(
            totalReceived,
            state.microActivity
          );

          if (!cancelled) {
            setApiResult({
              caMonthly: result.caMonthly,
              prelevementMonthly: result.prelevementMonthly,
              netMonthly: result.netMonthly,
              currentNetMonthly: currentResult.netMonthly,
              currentPrelevementMonthly: currentResult.prelevementMonthly,
            });

            console.log('MICRO API RESULT:', result);
            console.log('MICRO CURRENT API RESULT:', currentResult);
            console.log('MICRO DASHBOARD COMPARISON', {
              activity: state.microActivity,
              turnoverInputMonthly: totalReceived,
              apiTurnoverMonthly:
                'apiCaMonthly' in currentResult ? currentResult.apiCaMonthly : undefined,
              apiNetMonthly: currentResult.netMonthly,
              dashboardPrelevementMonthly: currentResult.prelevementMonthly,
            });
          }

          return;
        }

        if (state.status === 'SASU' && state.sasuMode === 'salaire') {
          const result = await simulateSasuSalaryFromNet(
            state.salaryGoal + totalChargesGlobal
          );

          if (!cancelled) {
            setApiResult({
              caMonthly: result.costMonthly,
              prelevementMonthly: result.prelevementMonthly,
              netMonthly: result.netMonthly,
            });

            console.log('SASU API RESULT:', result);
          }

          return;
        }

        if (!cancelled) {
          setApiResult(null);
        }
      } catch (error) {
        console.error('Erreur simulation API:', error);
        if (!cancelled) {
          setApiResult(null);
        }
      } finally {
        if (!cancelled) {
          setApiLoading(false);
        }
      }
    }

    runSimulation();

    return () => {
      cancelled = true;
    };
  }, [
    state.status,
    state.salaryGoal,
    state.microActivity,
    state.sasuMode,
    totalChargesGlobal,
    totalReceived,
  ]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  useEffect(() => {
    if (!userProfile) return;

    setState((prev) => ({
      ...prev,
      trialStartDate: userProfile.trialStartDate,
      isPremium: userProfile.isPremium,
    }));
  }, [userProfile?.trialStartDate, userProfile?.isPremium]);

  useEffect(() => {
    const currentTrialExpired = userProfile
      ? isUserTrialExpired(userProfile)
      : !state.isPremium && isUserTrialExpired({
          trialStartDate: state.trialStartDate,
          isPremium: state.isPremium,
        });

    if (!currentTrialExpired) return;

    if (showPayment || showCharge || showSetup) {
      openUpgradePrompt();
    }
  }, [userProfile, state.isPremium, state.trialStartDate, showPayment, showCharge, showSetup, userId, userEmail]);

  const objectifCa = useMemo(() => {
    if (state.status === 'micro-entreprise (auto-entrepreneur)') {
      return apiResult?.caMonthly ?? 0;
    }

    if (state.status === 'SASU' && state.sasuMode === 'salaire') {
      return apiResult?.caMonthly ?? 0;
    }

    if (state.status === 'SASU' && state.sasuMode === 'dividendes') {
      return calculCaNecessaireSasuDividendes(
        state.salaryGoal,
        totalChargesGlobal,
        SASU_IS_RATE,
        getPrelevementRate(state)
      );
    }

    return state.salaryGoal;
  }, [state, totalChargesGlobal, apiResult]);

  const prelevement = useMemo(() => {
    if (state.status === 'micro-entreprise (auto-entrepreneur)') {
      return apiResult?.currentPrelevementMonthly ?? 0;
    }

    if (state.status === 'SASU' && state.sasuMode === 'salaire') {
      if (!apiResult || apiResult.caMonthly <= 0) {
        return 0;
      }

      const ratio = apiResult.prelevementMonthly / apiResult.caMonthly;
      return totalReceived * ratio;
    }

    return calculPrelevementProportionnel(totalReceived, getPrelevementRate(state));
  }, [state, totalReceived, apiResult]);

  const revenuDisponible = useMemo(() => {
    if (state.status === 'micro-entreprise (auto-entrepreneur)') {
      return (apiResult?.currentNetMonthly ?? 0) - totalChargesGlobal;
    }

    if (state.status === 'SASU' && state.sasuMode === 'dividendes') {
      return calculRevenuDisponibleSasuDividendes(
        totalReceived,
        totalChargesGlobal,
        SASU_IS_RATE,
        getPrelevementRate(state)
      );
    }

    return totalReceived - prelevement - totalChargesGlobal;
  }, [state, totalReceived, prelevement, totalChargesGlobal]);

  const impotSocietes = useMemo(() => {
    if (!isSasuDividendes) return 0;

    return calculImpotSocietesSasuDividendes(
      totalReceived,
      totalChargesGlobal,
      SASU_IS_RATE
    );
  }, [isSasuDividendes, totalReceived, totalChargesGlobal]);

  const flatTax = useMemo(() => {
    if (!isSasuDividendes) return 0;

    return calculFlatTaxSasuDividendes(
      totalReceived,
      totalChargesGlobal,
      SASU_IS_RATE,
      getPrelevementRate(state)
    );
  }, [isSasuDividendes, totalReceived, totalChargesGlobal, state]);

  const progress = calculProgression(totalReceived, objectifCa);
  const progressLabel = Math.round(progress);
  const remaining = calculResteAEncaisser(objectifCa, totalReceived);
  const effectiveTrialStartDate = userProfile?.trialStartDate ?? state.trialStartDate;
  const effectiveIsPremium = userProfile?.isPremium ?? state.isPremium;
  const shouldApplyTrial = isAuthenticated && !effectiveIsPremium;
  const trialExpired = shouldApplyTrial && (
    userProfile
      ? isUserTrialExpired(userProfile)
      : isUserTrialExpired({
          trialStartDate: effectiveTrialStartDate,
          isPremium: effectiveIsPremium,
        })
  );
  const trialStart = new Date(effectiveTrialStartDate);
  const trialDaysElapsed = Number.isNaN(trialStart.getTime())
    ? 0
    : Math.max(0, Math.floor((Date.now() - trialStart.getTime()) / 86_400_000));
  const trialDaysRemaining = shouldApplyTrial ? Math.max(0, 10 - trialDaysElapsed) : 0;
  const displayedRemaining = usesVat
    ? roundCurrency(remaining * (1 + state.vatRate))
    : remaining;
  const daysLeft = getDaysLeft(new Date(), state.targetDate);
  const heroMessage = useMemo(
    () =>
      motivationalMessage({
        progress,
        payments: state.payments,
        targetDate: state.targetDate,
      }),
    [progress, state.payments, state.targetDate]
  );
  const quickAmounts = state.quickAmounts || [100, 250, 500, 1000];
  const prelevementLabel = getPrelevementLabel(state);
  const paymentInputLabel = effectivePaymentInputMode === 'TTC' ? 'TTC' : 'HT';
  const collectedAmountLabel = isSasu ? 'CA encaissé HT' : 'CA encaissé';
  const paymentAmountPlaceholder = isSasu
    ? `Montant ${paymentInputLabel}`
    : '0 €';
  const blockedActionMessage = trialExpired
    ? 'Votre essai est terminé. Débloquez le suivi pour continuer à modifier vos données.'
    : null;
  const getNextSalaryGoal = (value: string) => {
    const nextValue = parseAmountInput(value);

    if (
      state.status === 'micro-entreprise (auto-entrepreneur)' &&
      nextValue > MICRO_MAX_SALARY_GOAL
    ) {
      return MICRO_MAX_SALARY_GOAL;
    }

    return nextValue;
  };
  const paymentHistoryMeta = (payment: PaymentEntry) => {
    if (!isSasu) {
      return `Montant ${currency(payment.amountHT)}`;
    }

    return `Saisi en ${payment.inputMode} • HT ${currency(payment.amountHT)}${
      payment.amountVAT > 0 ? ` • TVA ${currency(payment.amountVAT)}` : ''
    }`;
  };

  const openUpgradePrompt = () => {
    setShowPayment(false);
    setShowCharge(false);
    setShowSetup(false);
    setShowUpgradePrompt(true);
  };

  const guardMutationAction = (callback: () => void) => {
    if (trialExpired) {
      openUpgradePrompt();
      return;
    }

    callback();
  };

  const redirectToCheckout = async () => {
    if (!isAuthenticated || !userProfile?.id) {
      setAccountPromptReason('manual-signin');
      setShowAccountPrompt(true);
      return;
    }

    try {
      setCheckoutLoading(true);
      // Temporary Stripe Payment Link integration.
      // Do not unlock Premium on the client after redirect or return pages.
      // A Stripe webhook must later confirm payment and update public.profiles.is_premium = true.
      window.location.assign(TEMPORARY_STRIPE_PAYMENT_LINK);
    } catch (error) {
      console.error('Erreur ouverture paiement Stripe:', error);
      setPaymentFeedback({
        variant: 'warning',
        title: 'Paiement indisponible',
        subtitle:
          error instanceof Error
            ? error.message
            : 'Impossible d’ouvrir le lien de paiement Stripe pour le moment.',
        meta: 'Réessayez dans quelques instants.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const saveSetup = () => {
    if (trialExpired) {
      openUpgradePrompt();
      return;
    }

    setState((prev) => ({ ...prev, setupDone: true }));
    setShowSetup(false);
  };

  const handleSetupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveSetup();
  };

  const handlePaymentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trialExpired) {
      openUpgradePrompt();
      return;
    }

    const amount = parseAmountInput(paymentAmount);
    if (!amount || amount <= 0) return;

    addPayment(amount);
  };

  const addPayment = (amount: number) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

    const computedAmounts = buildPaymentAmounts(
      amount,
      effectivePaymentInputMode,
      effectiveVatRate
    );

    const newPayment: PaymentEntry = {
      id,
      ...computedAmounts,
      inputMode: effectivePaymentInputMode,
      createdAt: new Date().toISOString(),
      monthKey: getMonthKey(),
    };

    const nextTotalReceived = totalReceived + newPayment.amountHT;
    const nextRemaining = calculResteAEncaisser(objectifCa, nextTotalReceived);
    const nextFeedback = createPaymentFeedback({
      addedAmount: newPayment.amountHT,
      previousCollected: totalReceived,
      currentCollected: nextTotalReceived,
      targetAmount: objectifCa,
      remainingAmount: nextRemaining,
      daysRemaining: getDaysLeft(new Date(), state.targetDate),
      targetDate: state.targetDate,
    });

    const nextPaymentsCount = state.payments.length + 1;

    setState((prev) => ({ ...prev, payments: [newPayment, ...prev.payments] }));
    setPaymentFeedback(nextFeedback);
    setPaymentAmount('');
    setShowPayment(false);

    if (!isAuthenticated && nextPaymentsCount >= 2) {
      setAccountPromptReason('payment-gate');
      setShowAccountPrompt(true);
    }
  };

  const handleChargeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trialExpired) {
      openUpgradePrompt();
      return;
    }

    const amount = parseAmountInput(chargeAmount);
    if (!amount || amount <= 0) return;

    addCharge(amount);
  };

  const addCharge = (amount: number) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

    const newCharge: ChargeEntry = {
      id,
      amount,
      createdAt: new Date().toISOString(),
      monthKey: getMonthKey(),
    };

    setState((prev) => ({ ...prev, charges: [newCharge, ...prev.charges] }));
    setChargeAmount('');
    setShowCharge(false);
  };

  const resetMonth = () => {
    if (trialExpired) {
      openUpgradePrompt();
      return;
    }

    setState((prev) => ({
      ...prev,
      payments: [],
      charges: [],
      monthKey: getMonthKey(),
    }));
    setPaymentFeedback(null);
  };

  const feedbackStyles = paymentFeedback
    ? getFeedbackVariantStyles(paymentFeedback.variant)
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(94,66,255,0.28),transparent_24%),radial-gradient(circle_at_bottom,rgba(0,214,255,0.18),transparent_22%),linear-gradient(180deg,#0a0f23_0%,#11183a_48%,#090d1b_100%)] p-4 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(120,160,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,160,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1.2px)] [background-size:24px_24px]" />

      <div className="relative z-10 mx-auto max-w-md">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Ton copilote revenu</p>
            <h1 className="text-2xl font-bold tracking-tight">Objectif du mois</h1>
            <p className="mt-1 text-xs text-cyan-200">
              {isAuthenticated ? userEmail : 'Mode invité • progression enregistrée localement'}
            </p>
            {trialExpired ? (
              <div className="mt-2 inline-flex items-center rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                Essai expiré
              </div>
            ) : isAuthenticated && !effectiveIsPremium ? (
              <div className="mt-2 inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Essai en cours • {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-2 inline-flex items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Crée un compte pour enregistrer ta progression
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                Accès Premium
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-cyan-300/35 bg-slate-950/70 px-5 text-slate-100 shadow-[0_0_20px_rgba(87,183,255,0.18)] hover:bg-slate-900 hover:text-white"
              onClick={() => guardMutationAction(() => setShowSetup(true))}
            >
              Réglages
            </Button>
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="rounded-full border-rose-300/30 bg-slate-950/70 px-4 text-rose-100 shadow-[0_0_20px_rgba(251,113,133,0.12)] hover:bg-slate-900 hover:text-white"
                onClick={onSignOut}
              >
                Sortir
              </Button>
            ) : (
              <Button
                variant="outline"
                className="rounded-full border-cyan-300/35 bg-slate-950/70 px-4 text-cyan-100 shadow-[0_0_20px_rgba(87,183,255,0.18)] hover:bg-slate-900 hover:text-white"
                onClick={() => {
                  setAccountPromptReason('manual-signin');
                  setShowAccountPrompt(true);
                }}
              >
                Connexion
              </Button>
            )}
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 rounded-full border border-cyan-400/20 bg-slate-950/70 p-1 shadow-[0_0_24px_rgba(67,137,255,0.18)]">
            <TabsTrigger value="accueil" className="rounded-full text-slate-300 data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-950">
              Accueil
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-full text-slate-300 data-[state=active]:bg-cyan-300 data-[state=active]:text-slate-950">
              Statistiques
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatePresence mode="wait">
          {activeTab === 'accueil' ? (
            <motion.div key="accueil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <Card className="overflow-hidden rounded-[28px] border border-cyan-400/25 bg-slate-950/55 shadow-[0_0_40px_rgba(64,170,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <CardHeader className="relative overflow-hidden pb-6 pt-7">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(95,60,255,0.32),transparent_55%),linear-gradient(180deg,rgba(63,94,251,0.18)_0%,rgba(10,15,35,0)_100%)]" />
                  <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]" />
                  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
                  <div className="absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent" />

                  <div className="relative text-center space-y-4">
                   <div className="grid grid-cols-2 gap-3">
  <div className="rounded-[26px] border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(23,214,174,0.92)_0%,rgba(11,170,209,0.88)_100%)] px-6 py-4 text-white shadow-[0_0_28px_rgba(45,212,191,0.34),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
    <div className="flex items-center justify-center gap-2 text-sm opacity-90">
      <Target className="h-4 w-4" /> Revenu visé
    </div>
    <div className="text-center text-3xl font-black tracking-tight text-lime-100 drop-shadow-[0_0_10px_rgba(210,255,122,0.25)]">
      {currency(state.salaryGoal)}
    </div>
  </div>

  <div className="rounded-[26px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(25,57,138,0.92)_0%,rgba(16,110,190,0.88)_100%)] px-6 py-4 text-white shadow-[0_0_28px_rgba(56,189,248,0.28),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
    <div className="flex items-center justify-center gap-2 text-sm opacity-90">
      <Wallet className="h-4 w-4" /> Revenu actuel
    </div>
    <div className="text-center text-3xl font-black tracking-tight text-cyan-100 drop-shadow-[0_0_10px_rgba(125,211,252,0.25)]">
      {currency(revenuDisponible)}
    </div>
  </div>
</div>

                    <div className="flex justify-center">
                      <div className="rounded-full border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(16,34,92,0.7)_0%,rgba(10,18,54,0.85)_100%)] px-5 py-2.5 text-sm font-semibold text-slate-100 shadow-[0_0_16px_rgba(96,165,250,0.2)] backdrop-blur-sm">
                        {heroMessage}
                      </div>
                    </div>

                  <div className="flex justify-center">
                      <div className="rounded-full border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(62,89,255,0.45)_0%,rgba(22,38,96,0.58)_100%)] px-5 py-2.5 text-sm font-semibold text-slate-100 shadow-[0_0_16px_rgba(96,165,250,0.2)] backdrop-blur-sm">
                        {daysLeft} jours pour atteindre ton objectif
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(19,27,66,0.82)_0%,rgba(10,14,34,0.92)_100%)] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                    <div className="mb-3 grid grid-cols-3 items-end">
                      <span className="text-sm font-medium text-slate-200">Progression</span>
                      <span className="text-center text-lg font-semibold text-cyan-300">{progressLabel}%</span>
                      <span className="text-right text-sm font-semibold text-cyan-200">{currency(totalReceived)} / {currency(objectifCa)}</span>
                    </div>
                    <div className="relative h-5 overflow-hidden rounded-full border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(3,6,25,0.95)_0%,rgba(0,0,0,0.82)_100%)] shadow-[inset_0_0_20px_rgba(0,0,0,0.75),0_0_12px_rgba(34,211,238,0.08)]">
                      <div className="absolute inset-y-0 left-0 w-10 rounded-full bg-emerald-300/20 blur-lg" />
                      <motion.div
                        className="absolute left-0 top-0 h-full rounded-full bg-[linear-gradient(90deg,#14f1b2_0%,#22d3ee_40%,#60f7d4_100%)] shadow-[0_0_18px_rgba(45,212,191,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center" style={{ width: `${Math.max(progress, 6)}%` }}>
                        <div className="ml-1.5 h-3.5 w-3.5 rounded-full border border-white/60 bg-[radial-gradient(circle,#ecfeff_0%,#67e8f9_45%,#14f1b2_100%)] shadow-[0_0_14px_rgba(45,212,191,0.95)]" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        {[25, 50, 75].map((step) => (
                          <div key={step} className="h-2.5 w-2.5 rounded-full bg-white/15 shadow-[0_0_10px_rgba(255,255,255,0.06)]" />
                        ))}
                      </div>
                    </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Départ</span>
                      <span>Objectif</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 items-stretch gap-3">
                    {isSasuDividendesHt ? (
                      <>
                        <div className="col-span-2 flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(106,48,17,0.72)_0%,rgba(186,96,15,0.88)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.24)]">
                          <div className="mb-3 flex items-center gap-2 text-amber-100">
                            <Flame className="h-4 w-4 text-amber-300" />
                            <span className="text-sm">CA restant à encaisser</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-amber-50">{currency(displayedRemaining)}</p>
                        </div>
                        <div className="col-span-2 grid grid-cols-2 items-stretch gap-3">
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(16,34,92,0.78)_0%,rgba(10,18,54,0.92)_100%)] p-4 shadow-[0_0_18px_rgba(59,130,246,0.12)]">
                            <div className="mb-3 flex items-center gap-2 text-slate-300">
                              <Wallet className="h-4 w-4 text-cyan-300" />
                              <span className="text-sm">{collectedAmountLabel}</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-white">{currency(totalReceived)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-orange-300/35 bg-[linear-gradient(180deg,rgba(120,53,15,0.76)_0%,rgba(194,65,12,0.9)_100%)] p-4 text-right shadow-[0_0_24px_rgba(249,115,22,0.24)]">
                            <div className="mb-3 flex items-center justify-end gap-2 text-orange-100">
                              <CircleDollarSign className="h-4 w-4 text-orange-200" />
                              <span className="text-sm">Impôt sur les sociétés</span>
                            </div>
                            <p className="text-lg font-bold text-orange-50">{currency(impotSocietes)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(91,33,182,0.72)_0%,rgba(126,34,206,0.88)_100%)] p-4 text-right shadow-[0_0_22px_rgba(192,132,252,0.2)]">
                            <div className="mb-3 flex items-center justify-end gap-2 text-fuchsia-100">
                              <CircleDollarSign className="h-4 w-4 text-fuchsia-200" />
                              <span className="text-sm">Flat tax</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(flatTax)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-rose-400/25 bg-[linear-gradient(180deg,rgba(66,22,29,0.8)_0%,rgba(38,12,16,0.95)_100%)] p-4">
                            <div className="mb-3 flex items-center gap-2 text-rose-200">
                              <Minus className="h-4 w-4 text-rose-300" />
                              <span className="text-sm">Charges</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(totalChargesGlobal)}</p>
                          </div>
                        </div>
                      </>
                    ) : isSasuDividendesTtc ? (
                      <>
                        <div className="col-span-2 grid grid-cols-2 items-stretch gap-3">
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(106,48,17,0.72)_0%,rgba(186,96,15,0.88)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.24)]">
                            <div className="mb-3 flex items-center gap-2 text-amber-100">
                              <Flame className="h-4 w-4 text-amber-300" />
                              <span className="text-sm">CA restant à encaisser</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-amber-50">{currency(displayedRemaining)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(16,34,92,0.78)_0%,rgba(10,18,54,0.92)_100%)] p-4 shadow-[0_0_18px_rgba(59,130,246,0.12)]">
                            <div className="mb-3 flex items-center gap-2 text-slate-300">
                              <Wallet className="h-4 w-4 text-cyan-300" />
                              <span className="text-sm">{collectedAmountLabel}</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-white">{currency(totalReceived)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-orange-300/35 bg-[linear-gradient(180deg,rgba(120,53,15,0.76)_0%,rgba(194,65,12,0.9)_100%)] p-4 text-right shadow-[0_0_24px_rgba(249,115,22,0.24)]">
                            <div className="mb-3 flex items-center justify-end gap-2 text-orange-100">
                              <CircleDollarSign className="h-4 w-4 text-orange-200" />
                              <span className="text-sm">Impôt sur les sociétés</span>
                            </div>
                            <p className="text-lg font-bold text-orange-50">{currency(impotSocietes)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(91,33,182,0.72)_0%,rgba(126,34,206,0.88)_100%)] p-4 text-right shadow-[0_0_22px_rgba(192,132,252,0.2)]">
                            <div className="mb-3 flex items-center justify-end gap-2 text-fuchsia-100">
                              <CircleDollarSign className="h-4 w-4 text-fuchsia-200" />
                              <span className="text-sm">Flat tax</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(flatTax)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(91,33,182,0.72)_0%,rgba(126,34,206,0.88)_100%)] p-4 shadow-[0_0_22px_rgba(192,132,252,0.2)]">
                            <div className="mb-3 flex items-center gap-2 text-fuchsia-100">
                              <CircleDollarSign className="h-4 w-4 text-fuchsia-200" />
                              <span className="text-sm">TVA à mettre de côté</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(totalVatCollected)}</p>
                          </div>
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-rose-400/25 bg-[linear-gradient(180deg,rgba(66,22,29,0.8)_0%,rgba(38,12,16,0.95)_100%)] p-4">
                            <div className="mb-3 flex items-center gap-2 text-rose-200">
                              <Minus className="h-4 w-4 text-rose-300" />
                              <span className="text-sm">Charges</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(totalChargesGlobal)}</p>
                          </div>
                        </div>
                      </>
                    ) : isSasuDividendes ? (
                      <>
                        <div className="col-span-2 flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(106,48,17,0.72)_0%,rgba(186,96,15,0.88)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.24)]">
                          <div className="mb-3 flex items-center gap-2 text-amber-100">
                            <Flame className="h-4 w-4 text-amber-300" />
                            <span className="text-sm">CA restant à encaisser</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-amber-50">{currency(displayedRemaining)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(16,34,92,0.78)_0%,rgba(10,18,54,0.92)_100%)] p-4 shadow-[0_0_18px_rgba(59,130,246,0.12)]">
                          <div className="mb-3 flex items-center gap-2 text-slate-300">
                            <Wallet className="h-4 w-4 text-cyan-300" />
                            <span className="text-sm">{collectedAmountLabel}</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-white">{currency(totalReceived)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between gap-3">
                          <div className="flex h-full min-h-[calc(50%-0.375rem)] flex-col justify-between rounded-[24px] border border-orange-300/35 bg-[linear-gradient(180deg,rgba(120,53,15,0.76)_0%,rgba(194,65,12,0.9)_100%)] p-4 text-right shadow-[0_0_24px_rgba(249,115,22,0.24)]">
                            <div className="mb-3 flex items-center justify-end gap-2 text-orange-100">
                              <CircleDollarSign className="h-4 w-4 text-orange-200" />
                              <span className="text-sm">Impôt sur les sociétés</span>
                            </div>
                            <p className="text-lg font-bold text-orange-50">{currency(impotSocietes)}</p>
                          </div>
                          <div className="flex h-full min-h-[calc(50%-0.375rem)] flex-col justify-between rounded-[24px] border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(91,33,182,0.72)_0%,rgba(126,34,206,0.88)_100%)] p-4 text-right shadow-[0_0_22px_rgba(192,132,252,0.2)]">
                            <div className="mb-3 flex items-center justify-end gap-2 text-fuchsia-100">
                              <CircleDollarSign className="h-4 w-4 text-fuchsia-200" />
                              <span className="text-sm">Flat tax</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(flatTax)}</p>
                          </div>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-rose-400/25 bg-[linear-gradient(180deg,rgba(66,22,29,0.8)_0%,rgba(38,12,16,0.95)_100%)] p-4">
                          <div className="mb-3 flex items-center gap-2 text-rose-200">
                            <Minus className="h-4 w-4 text-rose-300" />
                            <span className="text-sm">Charges</span>
                          </div>
                          <p className="text-lg font-bold text-white">{currency(totalChargesGlobal)}</p>
                        </div>
                      </>
                    ) : usesSasuVatLayout ? (
                      <>
                        <div className="col-span-2 flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(106,48,17,0.72)_0%,rgba(186,96,15,0.88)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.24)]">
                          <div className="mb-3 flex items-center gap-2 text-amber-100">
                            <Flame className="h-4 w-4 text-amber-300" />
                            <span className="text-sm">CA restant à encaisser</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-amber-50">{currency(displayedRemaining)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(16,34,92,0.78)_0%,rgba(10,18,54,0.92)_100%)] p-4 shadow-[0_0_18px_rgba(59,130,246,0.12)]">
                          <div className="mb-3 flex items-center gap-2 text-slate-300">
                            <Wallet className="h-4 w-4 text-cyan-300" />
                            <span className="text-sm">{collectedAmountLabel}</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-white">{currency(totalReceived)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-orange-300/35 bg-[linear-gradient(180deg,rgba(120,53,15,0.76)_0%,rgba(194,65,12,0.9)_100%)] p-4 shadow-[0_0_24px_rgba(249,115,22,0.24)]">
                          <div className="mb-3 flex items-center gap-2 text-orange-100">
                            <CircleDollarSign className="h-4 w-4 text-orange-200" />
                            <span className="text-sm">{prelevementLabel}</span>
                          </div>
                          <p className="text-lg font-bold text-orange-50">{currency(prelevement)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(91,33,182,0.72)_0%,rgba(126,34,206,0.88)_100%)] p-4 shadow-[0_0_22px_rgba(192,132,252,0.2)]">
                          <div className="mb-3 flex items-center gap-2 text-fuchsia-100">
                            <CircleDollarSign className="h-4 w-4 text-fuchsia-200" />
                            <span className="text-sm">TVA à mettre de côté</span>
                          </div>
                          <p className="text-lg font-bold text-white">{currency(totalVatCollected)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-rose-400/25 bg-[linear-gradient(180deg,rgba(66,22,29,0.8)_0%,rgba(38,12,16,0.95)_100%)] p-4">
                          <div className="mb-3 flex items-center gap-2 text-rose-200">
                            <Minus className="h-4 w-4 text-rose-300" />
                            <span className="text-sm">Charges</span>
                          </div>
                          <p className="text-lg font-bold text-white">{currency(totalChargesGlobal)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(16,34,92,0.78)_0%,rgba(10,18,54,0.92)_100%)] p-4 shadow-[0_0_18px_rgba(59,130,246,0.12)]">
                          <div className="mb-3 flex items-center gap-2 text-slate-300">
                            <Wallet className="h-4 w-4 text-cyan-300" />
                            <span className="text-sm">{collectedAmountLabel}</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-white">{currency(totalReceived)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(106,48,17,0.72)_0%,rgba(186,96,15,0.88)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.24)]">
                          <div className="mb-3 flex items-center gap-2 text-amber-100">
                            <Flame className="h-4 w-4 text-amber-300" />
                            <span className="text-sm">CA restant à encaisser</span>
                          </div>
                          <p className="text-3xl font-black tracking-tight text-amber-50">{currency(displayedRemaining)}</p>
                        </div>
                        {usesVat ? (
                          <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-fuchsia-300/30 bg-[linear-gradient(180deg,rgba(91,33,182,0.72)_0%,rgba(126,34,206,0.88)_100%)] p-4 shadow-[0_0_22px_rgba(192,132,252,0.2)]">
                            <div className="mb-3 flex items-center gap-2 text-fuchsia-100">
                              <CircleDollarSign className="h-4 w-4 text-fuchsia-200" />
                              <span className="text-sm">TVA à mettre de côté</span>
                            </div>
                            <p className="text-lg font-bold text-white">{currency(totalVatCollected)}</p>
                          </div>
                        ) : null}
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-rose-400/25 bg-[linear-gradient(180deg,rgba(66,22,29,0.8)_0%,rgba(38,12,16,0.95)_100%)] p-4">
                          <div className="mb-3 flex items-center gap-2 text-rose-200">
                            <Minus className="h-4 w-4 text-rose-300" />
                            <span className="text-sm">Charges</span>
                          </div>
                          <p className="text-lg font-bold text-white">{currency(totalChargesGlobal)}</p>
                        </div>
                        <div className="flex min-h-[132px] h-full flex-col justify-between rounded-[24px] border border-amber-300/35 bg-[linear-gradient(180deg,rgba(106,48,17,0.72)_0%,rgba(186,96,15,0.88)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.24)]">
                          <div className="mb-3 flex items-center gap-2 text-amber-100">
                            <CircleDollarSign className="h-4 w-4 text-amber-300" />
                            <span className="text-sm">{prelevementLabel}</span>
                          </div>
                          <p className="text-lg font-bold text-amber-50">{currency(prelevement)}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => guardMutationAction(() => setShowPayment(true))}
                      className="h-14 w-full rounded-[22px] border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(34,197,94,0.95)_0%,rgba(16,185,129,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:brightness-110"
                    >
                      <Plus className="mr-2 h-5 w-5" /> Paiement reçu
                    </Button>
                    <Button
                      onClick={() => guardMutationAction(() => setShowCharge(true))}
                      variant="outline"
                      className="h-14 w-full rounded-[22px] border border-rose-400/40 bg-[linear-gradient(180deg,rgba(244,63,94,0.95)_0%,rgba(190,18,60,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(244,63,94,0.35)] hover:brightness-110"
                    >
                      <Minus className="mr-2 h-5 w-5" /> Charge
                    </Button>
                  </div>

                  {trialExpired ? (
                    <div className="rounded-[24px] border border-amber-300/30 bg-[linear-gradient(180deg,rgba(82,44,12,0.55)_0%,rgba(47,25,7,0.82)_100%)] p-4 shadow-[0_0_24px_rgba(251,146,60,0.14)]">
                      <p className="text-sm font-semibold text-amber-100">Vous êtes à {progressLabel}% de votre objectif.</p>
                      <p className="mt-2 text-sm leading-6 text-amber-50/90">
                        Débloquez le suivi pour continuer à avancer et atteindre votre revenu ce mois-ci.
                      </p>
                      <Button
                        type="button"
                        onClick={redirectToCheckout}
                        disabled={checkoutLoading}
                        className="mt-4 h-11 w-full rounded-[18px] border border-amber-200/40 bg-[linear-gradient(180deg,rgba(251,191,36,0.96)_0%,rgba(245,158,11,0.95)_100%)] text-sm font-semibold text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.28)] hover:brightness-105"
                      >
                        {checkoutLoading ? 'Ouverture...' : 'Continuer avec Cash Pilot'}
                      </Button>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-3 shadow-[0_0_10px_rgba(34,211,238,0.12)] text-sm text-slate-300">
                    Appuie sur <span className="font-semibold">Paiement reçu</span> dès que de l’argent rentre.
                    {usesVat ? ` La TVA (${Math.round(state.vatRate * 100)}%) est séparée automatiquement.` : null}
                  </div>
                </CardContent>
              </Card>

            </motion.div>
          ) : (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <Card className="rounded-[28px] border border-cyan-400/20 bg-slate-950/55 shadow-[0_0_34px_rgba(56,189,248,0.18)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-white">
                    <ChartColumn className="h-5 w-5 text-cyan-300" /> Vue d’ensemble
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-white">
                  <div className="rounded-[24px] border border-cyan-400/30 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-4 text-white shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                    <p className="flex items-center gap-2 text-sm text-slate-300"><Target className="h-4 w-4 text-emerald-400" /> Régime</p>
                    <p className="mt-1 text-xl font-bold">{getStatusLabel(state)}</p>
                  </div>
                  <div className="rounded-[24px] border border-cyan-400/30 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-4 text-white shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                    <p className="flex items-center gap-2 text-sm text-slate-300"><Wallet className="h-4 w-4 text-cyan-300" /> {collectedAmountLabel}</p>
                    <p className="mt-1 text-xl font-bold">{currency(totalReceived)}</p>
                  </div>
                  {usesVat ? (
                    <div className="rounded-[24px] border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-900/50 to-purple-900/45 p-4 text-white shadow-[0_0_12px_rgba(217,70,239,0.15)]">
                      <p className="flex items-center gap-2 text-sm text-fuchsia-100"><CircleDollarSign className="h-4 w-4 text-fuchsia-200" /> TVA collectée</p>
                      <p className="mt-1 text-xl font-bold">{currency(totalVatCollected)}</p>
                    </div>
                  ) : null}
                  <div className="rounded-[24px] border border-cyan-400/30 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-4 text-white shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                    <p className="flex items-center gap-2 text-sm text-slate-300"><Minus className="h-4 w-4 text-rose-400" /> Charges</p>
                    <p className="mt-1 text-xl font-bold">{currency(totalChargesGlobal)}</p>
                  </div>
                  <div className="rounded-[24px] border border-cyan-400/30 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-4 text-white shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                    <p className="flex items-center gap-2 text-sm text-slate-300"><CircleDollarSign className="h-4 w-4 text-emerald-400" /> Paiements</p>
                    <p className="mt-1 text-xl font-bold">{state.payments.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-cyan-400/20 bg-slate-950/55 shadow-[0_0_34px_rgba(56,189,248,0.18)] backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Derniers paiements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {state.payments.length === 0 ? (
                    <div className="rounded-[24px] border border-cyan-400/30 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-4 text-sm text-slate-300 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                      Aucun paiement ajouté pour le moment.
                    </div>
                  ) : (
                    state.payments.slice(0, 8).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-slate-800/70 to-slate-900/80 p-3 shadow-[0_0_10px_rgba(34,211,238,0.12)]">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Paiement reçu</p>
                            <p className="text-xs text-slate-300">
                              {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-xs text-slate-400">
                              {paymentHistoryMeta(payment)}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-white">{currency(payment.amountInput)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl border-cyan-300/20 bg-slate-900/60 text-white hover:bg-slate-800 hover:text-white"
                  onClick={() => guardMutationAction(() => setShowSetup(true))}
                >
                  Modifier l’objectif
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl border-rose-300/25 bg-slate-900/60 text-white hover:bg-slate-800 hover:text-white"
                  onClick={() => guardMutationAction(resetMonth)}
                >
                  Remise à zéro
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 rounded-3xl border border-dashed border-cyan-400/20 bg-slate-900/40 p-4 text-sm text-slate-300 shadow-sm">
          <div className="mb-1 flex items-center gap-2 font-medium text-slate-100">
            <Download className="h-4 w-4 text-cyan-300" /> Astuce installation
          </div>
          <p>Ajoute cette web-app à ton écran d’accueil pour l’utiliser comme une vraie app.</p>
          <button
            type="button"
            onClick={() => setShowInstallHelp(true)}
            className="mt-2 inline-flex text-sm font-semibold text-cyan-200 transition hover:text-cyan-100"
          >
            Voir comment l’installer
          </button>
        </div>
      </div>

      <Dialog open={showInstallHelp} onOpenChange={setShowInstallHelp}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.98)_100%)] p-0 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
          <DialogHeader className="border-b border-cyan-400/15 px-5 py-4 sm:px-6">
            <DialogTitle className="text-lg font-bold tracking-tight text-white">
              Installer Cash Pilot sur votre téléphone
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 px-5 py-5 text-sm leading-6 text-slate-300 sm:px-6">
            <section className="rounded-[22px] border border-cyan-400/15 bg-slate-900/50 p-4">
              <h3 className="text-sm font-semibold text-white">iPhone (Safari)</h3>
              <ol className="mt-3 space-y-2 text-slate-300">
                <li>1. Appuyez sur le bouton “Partager”</li>
                <li>2. Cliquez sur “Sur l’écran d’accueil”</li>
                <li>3. Validez</li>
              </ol>
            </section>
            <section className="rounded-[22px] border border-cyan-400/15 bg-slate-900/50 p-4">
              <h3 className="text-sm font-semibold text-white">Android (Chrome)</h3>
              <ol className="mt-3 space-y-2 text-slate-300">
                <li>1. Ouvrez le menu (3 points)</li>
                <li>2. Cliquez sur “Ajouter à l’écran d’accueil”</li>
                <li>3. Confirmez</li>
              </ol>
            </section>
          </div>
          <DialogFooter className="border-t border-cyan-400/15 px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-[20px] border-cyan-300/20 bg-slate-900/60 text-white hover:bg-slate-800 hover:text-white sm:w-auto"
              onClick={() => setShowInstallHelp(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradePrompt} onOpenChange={setShowUpgradePrompt}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-[28px] border border-amber-300/20 bg-[linear-gradient(180deg,rgba(25,16,6,0.98)_0%,rgba(42,23,8,0.98)_100%)] p-0 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
          <DialogHeader className="border-b border-amber-300/15 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                Essai expiré
              </div>
            </div>
            <DialogTitle className="pt-3 text-lg font-bold tracking-tight text-white">
              Débloquez le suivi complet de Cash Pilot
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-5 py-5 text-sm leading-6 text-amber-50/90 sm:px-6">
            <p>{blockedActionMessage}</p>
            <div className="rounded-[22px] border border-amber-300/15 bg-black/15 p-4">
              <p className="font-semibold text-white">Vous êtes à {progressLabel}% de votre objectif.</p>
              <p className="mt-2">
                Débloquez le suivi pour continuer à avancer et atteindre votre revenu ce mois-ci.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">Abonnement 5,99€/mois</p>
          </div>
          <DialogFooter className="border-t border-amber-300/15 px-5 py-4 sm:px-6">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-[18px] border-amber-200/20 bg-transparent text-amber-50 hover:bg-white/5 hover:text-white sm:w-auto"
                onClick={() => setShowUpgradePrompt(false)}
              >
                Plus tard
              </Button>
              <Button
                type="button"
                className="w-full rounded-[18px] border border-amber-200/40 bg-[linear-gradient(180deg,rgba(251,191,36,0.96)_0%,rgba(245,158,11,0.95)_100%)] text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.28)] hover:brightness-105 sm:w-auto"
                onClick={redirectToCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Ouverture...' : 'Continuer avec Cash Pilot'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(240,249,255,0.98)_100%)] p-0 shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[calc(100dvh-3rem)] sm:max-w-xl">
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSetupSubmit}>
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-cyan-100 px-5 py-5 sm:px-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(240,249,255,0.94)_100%)]" />
            <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Reglages
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight text-slate-950">
                    Ajuste ton espace de pilotage
                  </DialogTitle>
                  <p className="mt-1 text-sm text-slate-600">
                    Personnalise ton objectif, ton statut et tes raccourcis sans toucher a tes donnees.
                  </p>
                </div>
              </div>
              <div className="hidden rounded-[24px] border border-cyan-200/80 bg-white/75 px-4 py-3 text-right shadow-[0_12px_30px_rgba(34,211,238,0.12)] sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Revenu vise
                </p>
                <p className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  {currency(state.salaryGoal)}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,rgba(241,245,249,0.22)_0%,rgba(255,255,255,0.72)_100%)] px-5 py-5 pb-8 sm:px-6">
            <div className="space-y-4">
              <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Objectif
                    </p>
                    <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                      Cadre du mois
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Definis le revenu vise et la date a atteindre pour piloter ton mois.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      Cible
                    </p>
                    <p className="mt-1 text-lg font-black tracking-tight text-emerald-900">
                      {currency(state.salaryGoal)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Combien veux-tu gagner ce mois-ci ?
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      enterKeyHint="done"
                      value={String(state.salaryGoal)}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          salaryGoal: getNextSalaryGoal(e.target.value),
                        }))
                      }
                      onPaste={(e) => {
                        e.preventDefault();
                        setState((prev) => ({
                          ...prev,
                          salaryGoal: getNextSalaryGoal(e.clipboardData.getData('text')),
                        }));
                      }}
                      className="h-12 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 text-base font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-cyan-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date objectif
                    </label>
                    <Input
                      type="date"
                      enterKeyHint="done"
                      value={state.targetDate}
                      onChange={(e) => setState((prev) => ({ ...prev, targetDate: e.target.value }))}
                      className="h-12 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-cyan-400 focus:bg-white"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Structure
                  </p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                    Parametres d activite
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choisis la structure adaptee a ton fonctionnement pour garder des estimations coherentes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['micro-entreprise (auto-entrepreneur)', 'SASU'].map((statusOption) => {
                    const active = state.status === statusOption;
                    return (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setState((prev) => ({ ...prev, status: statusOption as AppState['status'] }))}
                        className={`rounded-[22px] border px-4 py-4 text-left transition ${
                          active
                            ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_36px_rgba(15,23,42,0.2)]'
                            : 'border-slate-200 bg-slate-50/85 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/70'
                        }`}
                      >
                        <p className="text-sm font-semibold">
                          {statusOption === 'micro-entreprise (auto-entrepreneur)' ? 'Micro-entreprise' : statusOption}
                        </p>
                        <p className={`mt-1 text-xs ${active ? 'text-white/70' : 'text-slate-500'}`}>
                          {statusOption === 'micro-entreprise (auto-entrepreneur)'
                            ? 'Pilotage simple, oriente activite et prelevements.'
                            : 'Configuration complete avec sortie salaire ou dividendes.'}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {isSasu && (
                  <div className="mt-4 rounded-[24px] border border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.95)_0%,rgba(239,246,255,0.95)_100%)] p-4">
                    <label className="mb-3 block text-sm font-semibold text-slate-700">
                      Quand tu notes un paiement, tu saisis generalement :
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['HT', 'TTC'] as PaymentInputMode[]).map((mode) => {
                        const active = state.paymentInputMode === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setState((prev) => ({ ...prev, paymentInputMode: mode }))}
                            className={`rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? 'border-cyan-500 bg-cyan-500 text-white shadow-[0_14px_28px_rgba(6,182,212,0.22)]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50'
                            }`}
                          >
                            {mode === 'HT' ? 'Montant HT' : 'Montant TTC'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {state.status === 'micro-entreprise (auto-entrepreneur)' && (
                  <div className="mt-4 rounded-[24px] border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.95)_0%,rgba(240,253,250,0.95)_100%)] p-4">
                    <label className="mb-3 block text-sm font-semibold text-slate-700">
                      Votre activite
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {[
                        { key: 'achat-revente', label: 'Achat-revente' },
                        { key: 'services', label: 'Services' },
                        { key: 'liberale', label: 'Activite liberale' },
                      ].map((activity) => {
                        const active = state.microActivity === activity.key;
                        return (
                          <button
                            key={activity.key}
                            type="button"
                            onClick={() => setState((prev) => ({ ...prev, microActivity: activity.key as MicroActivity }))}
                            className={`rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                              active
                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_14px_28px_rgba(16,185,129,0.22)]'
                                : 'border-emerald-100 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            {activity.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      Les prelevements affiches sont des estimations et n incluent pas l impot sur le revenu, qui depend de votre situation personnelle.
                    </p>
                  </div>
                )}

                {state.status === 'SASU' && (
                  <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-4">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-700">
                        Mode de sortie
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'salaire', label: 'Salaire' },
                          { key: 'dividendes', label: 'Dividendes' },
                        ].map((mode) => {
                          const active = state.sasuMode === mode.key;
                          return (
                            <button
                              key={mode.key}
                              type="button"
                              onClick={() => setState((prev) => ({ ...prev, sasuMode: mode.key as SasuMode }))}
                              className={`rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                                active
                                  ? 'border-slate-950 bg-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {mode.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5 text-xs leading-relaxed text-slate-500">
                      <p>L impot sur les societes est calcule automatiquement dans l estimation.</p>
                      <p>Les montants affiches n incluent pas l impot sur le revenu, qui depend de votre situation personnelle.</p>
                      {state.sasuMode === 'dividendes' && <p>Mode dividendes : l estimation integrera un prelevement forfaitaire de 31,4 %.</p>}
                    </div>
                  </div>
                )}

                {usesVat && (
                  <div className="mt-4 rounded-[24px] border border-fuchsia-100 bg-[linear-gradient(180deg,rgba(250,245,255,0.98)_0%,rgba(245,243,255,0.98)_100%)] p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Taux de TVA
                    </label>
                    <Input
                      type="number"
                      value={Math.round(state.vatRate * 100)}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          vatRate: sanitizeVatRate(Number(e.target.value)),
                        }))
                      }
                      className="h-12 rounded-[20px] border border-fuchsia-100 bg-white px-4 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition focus:border-fuchsia-300"
                    />
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      Utilise pour convertir automatiquement chaque paiement TTC en montant HT et TVA collectee.
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Raccourcis
                  </p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                    Montants rapides
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Configure les boutons instantanes visibles dans l ecran principal et dans la fenetre de paiement.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {quickAmounts.map((amount, index) => (
                    <div
                      key={index}
                      className="rounded-[22px] border border-slate-200 bg-slate-50/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                    >
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Raccourci {index + 1}
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="done"
                        placeholder="0 €"
                        value={amount === 0 ? '' : String(amount)}
                        onChange={(e) => {
                          const normalized = normalizeAmountInput(e.target.value);
                          const next = [...quickAmounts];
                          next[index] = normalized
                            ? clampQuickAmount(parseAmountInput(normalized))
                            : 0;
                          setState((prev) => ({ ...prev, quickAmounts: next }));
                        }}
                        className="h-11 rounded-[18px] border border-slate-200 bg-white px-3 text-center font-semibold text-slate-950 outline-none transition focus:border-cyan-400"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-cyan-100 bg-white/85 px-5 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex w-full items-center justify-between gap-4">
              <p className="hidden text-sm text-slate-500 sm:block">
                Les changements sont appliques immediatement dans ton espace.
              </p>
              <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
              <Button
                type="submit"
                className="h-12 w-full rounded-[20px] bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] text-base font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.24)] hover:brightness-110 sm:w-auto sm:min-w-[180px]"
              >
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="mx-auto my-auto w-full max-w-md rounded-[28px] border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(10,15,35,0.98)_0%,rgba(17,24,58,0.98)_100%)] p-0 text-white shadow-[0_0_40px_rgba(34,211,238,0.18)] max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <form onSubmit={handlePaymentSubmit}>
            <DialogHeader className="border-b border-cyan-400/15 px-5 py-4">
              <DialogTitle className="text-white">Paiement reçu</DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-2">
              {isSasu ? (
                <p className="mb-2 mt-4 text-sm text-slate-300">
                  Saisie en {paymentInputLabel}
                  {usesVat ? ` • TVA ${Math.round(state.vatRate * 100)}%` : ''}
                </p>
              ) : null}
              <Input
                autoFocus
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                placeholder={paymentAmountPlaceholder}
                value={paymentAmount}
                onChange={(e) => handleAmountInputChange(e, setPaymentAmount)}
                onPaste={(e) => handleAmountPaste(e, setPaymentAmount)}
                className="h-14 rounded-2xl border border-cyan-400/25 bg-slate-950/80 px-4 text-lg text-white placeholder:text-slate-400"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 px-4 py-2">
              {quickAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  className="rounded-[18px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,61,0.95)_0%,rgba(7,11,30,0.98)_100%)] text-cyan-100 hover:bg-slate-700 hover:text-white"
                  onClick={() => setPaymentAmount(String(amount))}
                >
                  {amount}€
                </Button>
              ))}
            </div>
            <DialogFooter className="px-4 pb-4 pt-2">
              <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
              <Button
                type="submit"
                className="h-12 rounded-[22px] border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(34,197,94,0.95)_0%,rgba(16,185,129,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:brightness-110"
              >
                Valider
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AccountPromptDialog
        open={showAccountPrompt}
        reason={accountPromptReason}
        onOpenChange={setShowAccountPrompt}
      />

      <Dialog open={showCharge} onOpenChange={setShowCharge}>
        <DialogContent className="mx-auto my-auto w-full max-w-md rounded-[28px] border border-rose-400/25 bg-[linear-gradient(180deg,rgba(10,15,35,0.98)_0%,rgba(17,24,58,0.98)_100%)] p-0 text-white shadow-[0_0_40px_rgba(244,63,94,0.18)] max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <form onSubmit={handleChargeSubmit}>
            <DialogHeader className="border-b border-rose-400/15 px-5 py-4">
              <DialogTitle className="text-white">Ajouter une charge</DialogTitle>
            </DialogHeader>
            <div className="px-4 pb-2 pt-4">
              <Input
                autoFocus
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                placeholder="Montant en €"
                value={chargeAmount}
                onChange={(e) => handleAmountInputChange(e, setChargeAmount)}
                onPaste={(e) => handleAmountPaste(e, setChargeAmount)}
                className="h-14 rounded-2xl border border-rose-400/25 bg-slate-950/80 px-4 text-lg text-white placeholder:text-slate-400"
              />
            </div>
            <DialogFooter className="px-4 pb-4 pt-2">
              <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
              <Button
                type="submit"
                className="h-12 rounded-[22px] border border-rose-400/40 bg-[linear-gradient(180deg,rgba(244,63,94,0.95)_0%,rgba(190,18,60,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(244,63,94,0.35)] hover:brightness-110"
              >
                Valider
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {paymentFeedback && feedbackStyles ? (
          <motion.div
            key={`${paymentFeedback.title}-${paymentFeedback.subtitle}-${paymentFeedback.meta}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2"
          >
            <div className={`rounded-[24px] border p-4 text-white shadow-2xl backdrop-blur-xl ${feedbackStyles.card}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-2xl p-2.5 ${feedbackStyles.icon}`}>
                  <FeedbackIcon variant={paymentFeedback.variant} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${feedbackStyles.badge}`}>
                      {paymentFeedback.title}
                    </span>
                    {paymentFeedback.milestoneReached ? (
                      <span className="text-xs font-medium text-white/75">
                        Palier {paymentFeedback.milestoneReached} %
                      </span>
                    ) : null}
                  </div>
                  {paymentFeedback.subtitle ? (
                    <p className="mt-3 text-base font-semibold leading-tight text-white">
                      {paymentFeedback.subtitle}
                    </p>
                  ) : null}
                  {paymentFeedback.meta ? (
                    <p className="mt-1 text-sm leading-relaxed text-white/78">
                      {paymentFeedback.meta}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </div>
  );
}
