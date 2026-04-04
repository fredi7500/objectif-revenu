import { useEffect, useState } from 'react';
import { Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { sendMagicLink } from '@/lib/auth';

type AccountPromptDialogProps = {
  open: boolean;
  reason: 'payment-gate' | 'manual-signin';
  onOpenChange: (open: boolean) => void;
};

export default function AccountPromptDialog({
  open,
  reason,
  onOpenChange,
}: AccountPromptDialogProps) {
  const [showForm, setShowForm] = useState(reason !== 'payment-gate');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    if (!open) return;

    setShowForm(reason !== 'payment-gate');
    setEmail('');
    setError('');
    setMagicLinkSent(false);
  }, [open, reason]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-cyan-400/25 bg-[linear-gradient(180deg,rgba(10,15,35,0.98)_0%,rgba(17,24,58,0.98)_100%)] p-0 text-white shadow-[0_0_40px_rgba(34,211,238,0.18)]">
        <DialogHeader className="border-b border-cyan-400/15 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-slate-950/70 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Sauvegarde</p>
              <DialogTitle className="mt-1 text-left text-xl font-bold text-white">
                {showForm ? 'Connexion sans mot de passe' : 'Garde ta progression'}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {!showForm ? (
          <>
            <div className="space-y-4 px-5 py-5">
              <p className="text-base leading-7 text-slate-200">
                Continue à suivre ton objectif et sauvegarde ta progression.
                <br />
                Active ton compte via un lien magique envoyé par email.
              </p>
              <div className="rounded-[22px] border border-cyan-400/20 bg-slate-950/45 p-4 text-sm text-slate-300">
                Ton 2e paiement est bien enregistré. Tu peux continuer maintenant et te connecter plus tard.
              </div>
            </div>
            <DialogFooter className="grid grid-cols-1 gap-3 px-5 pb-5 pt-1 sm:grid-cols-2">
              <Button
                className="h-12 rounded-[20px] border border-emerald-300/35 bg-[linear-gradient(180deg,rgba(34,197,94,0.95)_0%,rgba(16,185,129,0.95)_100%)] text-base font-semibold text-white shadow-[0_0_22px_rgba(16,185,129,0.35)] hover:brightness-110"
                onClick={() => setShowForm(true)}
              >
                Recevoir mon lien
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[20px] border border-cyan-400/20 bg-slate-950/60 text-slate-200 hover:bg-slate-900 hover:text-white"
                onClick={() => onOpenChange(false)}
              >
                Continuer plus tard
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-5 px-5 py-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-cyan-200">
                  Entre ton email pour recevoir ton lien de connexion
                </p>
                <p className="text-sm leading-6 text-slate-300">
                  Le même flow fonctionne pour la connexion et la création de compte.
                </p>
              </div>

              {reason === 'payment-gate' && !magicLinkSent ? (
                <div className="rounded-[22px] border border-cyan-400/20 bg-slate-950/45 p-4 text-sm leading-6 text-slate-300">
                  Continue à suivre ton objectif et sauvegarde ta progression.
                  <br />
                  Ton compte sera activé via le lien reçu par email.
                </div>
              ) : null}

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
              </form>

              <div className="rounded-[24px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(16,24,61,0.95)_0%,rgba(7,11,30,0.98)_100%)] p-4 text-sm text-slate-300">
                <div className="mb-2 flex items-center gap-2 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">Sauvegarde locale conservée</span>
                </div>
                <p>
                  Tes données invité sont gardées sur cet appareil puis rattachées à ton compte après connexion.
                </p>
              </div>
            </div>

            <DialogFooter className="px-5 pb-5 pt-1">
              <Button
                variant="outline"
                className="h-11 w-full rounded-[20px] border border-cyan-400/20 bg-slate-950/60 text-slate-200 hover:bg-slate-900 hover:text-white"
                onClick={() => onOpenChange(false)}
              >
                {reason === 'payment-gate' && !magicLinkSent ? 'Continuer plus tard' : 'Fermer'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
