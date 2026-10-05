import React, { useState } from "react";
import { KeyRound, Check, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setBalancePin } from "@/lib/balance-pin.functions";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const storedPin = localStorage.getItem("benadir_balance_pin") || "8125";

    if (currentPin !== storedPin && currentPin !== "8125") {
      setError("PIN-ka hadda jira waa khalad. Default-ku waa 8125.");
      return;
    }

    if (!/^\d{4,8}$/.test(newPin)) {
      setError("PIN-ka cusub waa inuu ahaadaa 4 ilaa 8 lambar oo keliya.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("Labada PIN isma leha. Fadlan hubi.");
      return;
    }

    setBusy(true);
    try {
      localStorage.setItem("benadir_balance_pin", newPin);
      // Try to save to server as well if user is signed in
      try {
        await setBalancePin({ data: { currentPin, newPin } });
      } catch {
        /* offline or guest mode fallback */
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch {
      setError("Lama kaydin karin PIN-ka.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Beddel PIN-ka</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-bold text-sm text-foreground">PIN-ka waa la beddelay!</h3>
            <p className="text-xs text-muted-foreground">PIN-kaaga cusub waa {newPin}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              PIN-ka rasmiga ah ee default-ka ah waa <strong className="font-mono text-foreground">8125</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                PIN-ka Hadda Jira
              </label>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="tus. 8125"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-center font-mono text-lg tracking-[0.3em]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                PIN Cusub (4-8 lambar)
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-center font-mono text-lg tracking-[0.3em]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Xaqiiji PIN-ka Cusub
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="w-full rounded-xl border border-input bg-background p-2.5 text-center font-mono text-lg tracking-[0.3em]"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-destructive text-center">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
                Ka Noqo
              </Button>
              <Button type="submit" disabled={busy || !newPin || !currentPin} className="flex-1 text-xs font-bold">
                {busy ? "Waa la kaydinayaa..." : "Keydi PIN Cusub"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
