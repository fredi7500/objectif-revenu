import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, CircleX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type PaymentStatusPageProps = {
  status: 'success' | 'cancel';
};

const content = {
  success: {
    eyebrow: 'Abonnement',
    title: 'Paiement pris en compte',
    body:
      'Votre abonnement est en cours de validation. Le statut Premium sera activé automatiquement après confirmation Stripe.',
    action: 'Retourner à l’app',
    icon: CheckCircle2,
    accent:
      'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
  },
  cancel: {
    eyebrow: 'Paiement annulé',
    title: 'Le paiement n’a pas été finalisé',
    body:
      'Aucun abonnement n’a été activé. Vous pouvez revenir à l’app et relancer le paiement quand vous voulez.',
    action: 'Revenir à l’app',
    icon: CircleX,
    accent:
      'border-amber-300/30 bg-amber-500/10 text-amber-100',
  },
} as const;

export default function PaymentStatusPage({ status }: PaymentStatusPageProps) {
  const current = content[status];
  const Icon = current.icon;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(94,66,255,0.24),transparent_26%),radial-gradient(circle_at_bottom,rgba(0,214,255,0.16),transparent_28%),linear-gradient(180deg,#0a0f23_0%,#101736_50%,#090d1b_100%)] px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(120,160,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,160,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card className="rounded-[32px] border border-cyan-400/25 bg-slate-950/60 shadow-[0_0_40px_rgba(64,170,255,0.18)] backdrop-blur-xl">
            <CardContent className="space-y-6 p-6 text-center">
              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/35 bg-slate-950/60 shadow-[0_0_30px_rgba(34,211,238,0.22)]">
                  <Icon className="h-8 w-8 text-cyan-300" />
                </div>
                <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${current.accent}`}>
                  {current.eyebrow}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white">{current.title}</h1>
                <p className="text-sm leading-6 text-slate-300">{current.body}</p>
              </div>

              <Button
                type="button"
                className="h-12 w-full rounded-[22px] border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(34,197,94,0.95)_0%,rgba(16,185,129,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:brightness-110"
                onClick={() => {
                  window.location.assign('/#/app');
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {current.action}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
