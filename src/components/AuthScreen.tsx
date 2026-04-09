import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendMagicLink } from '@/lib/auth';

type AuthScreenProps = {
  onContinueAsGuest?: () => void;
};

export default function AuthScreen({ onContinueAsGuest }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError('');

    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Impossible d’envoyer le lien de connexion.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(94,66,255,0.24),transparent_26%),radial-gradient(circle_at_bottom,rgba(0,214,255,0.16),transparent_28%),linear-gradient(180deg,#0a0f23_0%,#101736_50%,#090d1b_100%)] px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(120,160,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(120,160,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.45)_1px,transparent_1.2px)] [background-size:24px_24px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-5"
        >
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/35 bg-slate-950/60 shadow-[0_0_30px_rgba(34,211,238,0.22)]">
              <ShieldCheck className="h-8 w-8 text-cyan-300" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">Espace protege</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Cap Revenu</h1>
            </div>
            <p className="text-sm text-slate-300">
              Entre ton email pour recevoir ton lien de connexion et retrouver ton suivi mensuel.
            </p>
          </div>

          <Card className="rounded-[32px] border border-cyan-400/25 bg-slate-950/60 shadow-[0_0_40px_rgba(64,170,255,0.18)] backdrop-blur-xl">
            <CardContent className="space-y-5 p-5">
              <div className="rounded-[24px] border border-cyan-400/20 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                Connexion sans mot de passe
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Email</label>
                  <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-slate-900/80 px-4">
                    <Mail className="h-4 w-4 text-cyan-300" />
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 border-0 bg-transparent text-white outline-none placeholder:text-slate-500"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                {magicLinkSent ? (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    On t’a envoyé un lien de connexion par email. Vérifie ta boîte mail.
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-[22px] border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(34,197,94,0.95)_0%,rgba(16,185,129,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:brightness-110"
                >
                  {submitting ? 'Envoi en cours...' : 'Recevoir mon lien'}
                </Button>

                {onContinueAsGuest ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-[22px] border border-cyan-400/20 bg-slate-950/60 text-base font-medium text-slate-200 hover:bg-slate-900 hover:text-white"
                    onClick={onContinueAsGuest}
                  >
                    Continuer en invité
                  </Button>
                ) : null}
              </form>

              <div className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,61,0.95)_0%,rgba(7,11,30,0.98)_100%)] p-4 text-sm text-slate-300">
                <div className="mb-2 flex items-center gap-2 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">Lien magique par email</span>
                </div>
                <p>
                  Utilise ton email pour recevoir un lien de connexion unique. Aucun mot de passe n est demande.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
