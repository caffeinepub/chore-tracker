import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useSetParentPin, useVerifyParentPin } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ParentPinDialog({ open, onClose, onSuccess }: Props) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [isSettingPin, setIsSettingPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { actor, isFetching } = useActor();
  const setParentPin = useSetParentPin();
  const verifyParentPin = useVerifyParentPin();

  // Determine if a PIN has been set using localStorage as a reliable indicator.
  // The backend cannot distinguish "no PIN set" from "wrong PIN" via verifyParentPin,
  // so we track PIN creation state in localStorage.
  const [pinExistsLocal, setPinExistsLocal] = useState<boolean>(
    () => localStorage.getItem("choreTrackerPinSet") === "true",
  );
  // Show loading while actor is not ready OR while fetching
  const checkingPin = isFetching || !actor;

  // hasPinSet: true = PIN exists (need to verify), false = no PIN (need to create)
  const hasPinSet = pinExistsLocal;

  useEffect(() => {
    if (open) {
      setPin("");
      setConfirmPin("");
      setError("");
      setIsSettingPin(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const _isPinMode = hasPinSet === true; // PIN is set, need to enter it
  const isCreateMode = !hasPinSet; // No PIN, need to create one

  const handleSubmit = async () => {
    setError("");

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (isCreateMode || isSettingPin) {
      if (confirmPin !== pin) {
        setError("PINs don't match");
        return;
      }
      try {
        await setParentPin.mutateAsync(pin);
        localStorage.setItem("choreTrackerPinSet", "true");
        setPinExistsLocal(true);
        onSuccess();
      } catch {
        setError("Failed to set PIN");
      }
      return;
    }

    // Verify existing PIN
    try {
      const valid = await verifyParentPin.mutateAsync(pin);
      if (valid) {
        onSuccess();
      } else {
        setError("Wrong PIN, try again!");
        setPin("");
      }
    } catch {
      setError("Something went wrong");
    }
  };

  const handlePinInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setError("");
  };

  const handleConfirmInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setConfirmPin(digits);
    setError("");
  };

  if (!open) return null;

  const title =
    isCreateMode || isSettingPin ? "Create Parent PIN" : "Parent Mode";
  const subtitle =
    isCreateMode || isSettingPin
      ? "Set a 4-digit PIN to protect Parent Mode"
      : "Enter your 4-digit PIN to continue";

  const isLoading =
    setParentPin.isPending || verifyParentPin.isPending || isFetching || !actor;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Dialog */}
          <motion.div
            data-ocid="pin.dialog"
            className="relative z-10 bg-card rounded-3xl p-8 shadow-float w-full max-w-sm border border-border"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex flex-col items-center gap-6">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-kid"
                style={{ background: "oklch(0.22 0.04 50)" }}
              >
                {isCreateMode || isSettingPin ? (
                  <ShieldCheck className="w-8 h-8 text-white" />
                ) : (
                  <Lock className="w-8 h-8 text-white" />
                )}
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-display font-black text-foreground">
                  {title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              </div>

              {checkingPin ? (
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  {/* PIN dots display */}
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border-2 transition-all"
                        style={{
                          background:
                            pin.length > i
                              ? "oklch(0.76 0.16 75)"
                              : "oklch(0.94 0.02 80)",
                          borderColor:
                            pin.length > i
                              ? "oklch(0.66 0.16 75)"
                              : "oklch(0.88 0.03 80)",
                          color:
                            pin.length > i
                              ? "oklch(0.12 0.04 50)"
                              : "transparent",
                        }}
                        animate={{
                          scale: pin.length === i + 1 ? [1, 1.1, 1] : 1,
                        }}
                        transition={{ duration: 0.15 }}
                      >
                        {showPin && pin[i] ? pin[i] : pin.length > i ? "●" : ""}
                      </motion.div>
                    ))}
                  </div>

                  {/* Hidden input for PIN */}
                  <div className="relative">
                    <input
                      ref={inputRef}
                      data-ocid="pin.input"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => handlePinInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && pin.length === 4 && handleSubmit()
                      }
                      placeholder="Enter 4-digit PIN"
                      className="w-full h-12 px-4 rounded-xl border-2 border-border bg-muted text-center text-lg font-mono tracking-widest focus:outline-none focus:border-ring transition-colors"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPin((s) => !s)}
                    >
                      {showPin ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Confirm PIN for create mode */}
                  {(isCreateMode || isSettingPin) && (
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmPin}
                        onChange={(e) => handleConfirmInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          pin.length === 4 &&
                          confirmPin.length === 4 &&
                          handleSubmit()
                        }
                        placeholder="Confirm PIN"
                        className="w-full h-12 px-4 rounded-xl border-2 border-border bg-muted text-center text-lg font-mono tracking-widest focus:outline-none focus:border-ring transition-colors"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <motion.p
                      data-ocid="pin.error_state"
                      className="text-center text-sm font-semibold text-destructive"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <Button
                  data-ocid="pin.cancel_button"
                  variant="outline"
                  className="flex-1 rounded-xl h-12"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="pin.submit_button"
                  className="flex-1 rounded-xl h-12 font-bold"
                  style={{
                    background: "oklch(0.22 0.04 50)",
                    color: "white",
                  }}
                  onClick={handleSubmit}
                  disabled={
                    isLoading ||
                    pin.length !== 4 ||
                    ((isCreateMode || isSettingPin) && confirmPin.length !== 4)
                  }
                >
                  {isLoading
                    ? "..."
                    : isCreateMode || isSettingPin
                      ? "Set PIN"
                      : "Enter"}
                </Button>
              </div>

              {/* Change PIN option */}
              {!isCreateMode && !isSettingPin && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  onClick={() => {
                    setIsSettingPin(true);
                    setPin("");
                    setConfirmPin("");
                    setError("");
                  }}
                >
                  Change PIN
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
