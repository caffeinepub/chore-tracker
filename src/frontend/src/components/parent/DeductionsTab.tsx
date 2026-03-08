import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, MinusCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useApplyDeduction, useListChildren } from "../../hooks/useQueries";
import { formatDollars, getColorStyle } from "../../utils/format";

export default function DeductionsTab() {
  const { data: children } = useListChildren();
  const applyDeduction = useApplyDeduction();

  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedChild = children?.find(
    (c) => c.childId.toString() === selectedChildId,
  );

  const handleSubmit = async () => {
    if (!selectedChildId || !amount || !reason.trim()) return;
    const cents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(cents) || cents <= 0) return;

    try {
      await applyDeduction.mutateAsync({
        childId: BigInt(selectedChildId),
        amountCents: BigInt(cents),
        note: reason.trim(),
      });
      setSuccess(true);
      setAmount("");
      setReason("");
      setSelectedChildId("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="text-xl font-display font-bold text-foreground">
          Apply Deduction
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Deduct money from a child's balance for misbehavior or other reasons
        </p>
      </div>

      <motion.div
        className="bg-card rounded-2xl border border-border p-6 space-y-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Warning banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "oklch(0.97 0.04 50)",
            border: "1px solid oklch(0.88 0.08 50)",
          }}
        >
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "oklch(0.60 0.16 50)" }}
          />
          <p
            className="text-xs font-semibold"
            style={{ color: "oklch(0.40 0.12 50)" }}
          >
            Deductions are immediate and cannot be undone. Be sure before
            applying.
          </p>
        </div>

        {/* Child select */}
        <div className="space-y-1.5">
          <Label className="font-semibold">Child</Label>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger
              data-ocid="deduction.select"
              className="rounded-xl h-11"
            >
              <SelectValue placeholder="Select a child..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {children?.map((child) => (
                <SelectItem
                  key={child.childId.toString()}
                  value={child.childId.toString()}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={getColorStyle(child.colorTag)}
                    />
                    <span>{child.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({formatDollars(child.balanceCents)})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label className="font-semibold">Amount to Deduct ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
              $
            </span>
            <Input
              data-ocid="deduction.input"
              type="number"
              min="0.01"
              step="0.25"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl h-11 pl-7"
            />
          </div>
          {selectedChild &&
            amount &&
            !Number.isNaN(Number.parseFloat(amount)) && (
              <p className="text-xs text-muted-foreground mt-1">
                New balance would be:{" "}
                <span
                  className="font-bold"
                  style={{
                    color:
                      Number(selectedChild.balanceCents) -
                        Math.round(Number.parseFloat(amount) * 100) >=
                      0
                        ? "oklch(0.45 0.16 150)"
                        : "oklch(0.55 0.22 25)",
                  }}
                >
                  {formatDollars(
                    selectedChild.balanceCents -
                      BigInt(Math.round(Number.parseFloat(amount) * 100)),
                  )}
                </span>
              </p>
            )}
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <Label className="font-semibold">Reason</Label>
          <Textarea
            data-ocid="deduction.textarea"
            placeholder="e.g. Didn't follow directions, broke a rule..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl resize-none min-h-20"
          />
        </div>

        {/* Submit */}
        <Button
          data-ocid="deduction.submit_button"
          className="w-full h-12 rounded-xl font-bold gap-2"
          style={{
            background: "oklch(0.60 0.22 25)",
            color: "white",
          }}
          onClick={handleSubmit}
          disabled={
            !selectedChildId ||
            !amount ||
            !reason.trim() ||
            Number.isNaN(Number.parseFloat(amount)) ||
            Number.parseFloat(amount) <= 0 ||
            applyDeduction.isPending
          }
        >
          {applyDeduction.isPending ? (
            "Applying..."
          ) : (
            <>
              <MinusCircle className="w-4 h-4" />
              Apply Deduction
            </>
          )}
        </Button>

        {/* Success message */}
        {success && (
          <motion.div
            data-ocid="deduction.success_state"
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{
              background: "oklch(0.94 0.06 150)",
              color: "oklch(0.35 0.14 150)",
              border: "1px solid oklch(0.80 0.10 150)",
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ✅ Deduction applied successfully
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
