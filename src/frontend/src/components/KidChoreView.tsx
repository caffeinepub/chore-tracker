import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import {
  type ChildProfile,
  Frequency,
  Variant_pending_approved_rejected,
} from "../backend.d";
import {
  useCompleteChore,
  useListChildren,
  useListChores,
  useListPendingCompletions,
} from "../hooks/useQueries";
import {
  choreEmoji,
  formatDollars,
  formatFrequency,
  getColorStyle,
} from "../utils/format";

interface Props {
  child: ChildProfile;
  onBack: () => void;
}

type ChoreState = "available" | "pending" | "completed";

export default function KidChoreView({ child, onBack }: Props) {
  const { data: chores, isLoading: choresLoading } = useListChores();
  const { data: pendingCompletions, isLoading: completionsLoading } =
    useListPendingCompletions();
  const { data: children } = useListChildren();
  const completeChore = useCompleteChore();
  const qc = useQueryClient();

  const [celebrating, setCelebrating] = useState<bigint | null>(null);

  // Get the latest balance from the freshly loaded children list
  const freshChild =
    children?.find((c) => c.childId === child.childId) ?? child;

  // Get chores assigned to this child
  const myChores =
    chores?.filter((c) =>
      c.assignedChildIds.some((id) => id === child.childId),
    ) ?? [];

  const getChoreState = useCallback(
    (choreId: bigint): ChoreState => {
      if (!pendingCompletions) return "available";

      const myCompletions = pendingCompletions.filter(
        (comp) => comp.childId === child.childId && comp.choreId === choreId,
      );

      // Check for pending
      const hasPending = myCompletions.some(
        (c) => c.status === Variant_pending_approved_rejected.pending,
      );
      if (hasPending) return "pending";

      // Check for recently approved (today/this week based on frequency)
      const chore = chores?.find((c) => c.choreId === choreId);
      if (!chore) return "available";

      const approvedCompletions = myCompletions.filter(
        (c) => c.status === Variant_pending_approved_rejected.approved,
      );

      if (approvedCompletions.length === 0) return "available";

      if (chore.frequency === Frequency.oncePerDay) {
        // Check if approved today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartMs = BigInt(todayStart.getTime() * 1_000_000);
        const hasToday = approvedCompletions.some(
          (c) => c.timestamp >= todayStartMs,
        );
        if (hasToday) return "completed";
      } else if (chore.frequency === Frequency.oncePerWeek) {
        // Check if approved this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekStartMs = BigInt(weekStart.getTime() * 1_000_000);
        const hasThisWeek = approvedCompletions.some(
          (c) => c.timestamp >= weekStartMs,
        );
        if (hasThisWeek) return "completed";
      }
      // unlimitedDaily is always available

      return "available";
    },
    [pendingCompletions, child.childId, chores],
  );

  const handleComplete = async (choreId: bigint, _choreName: string) => {
    try {
      await completeChore.mutateAsync({ childId: child.childId, choreId });
      setCelebrating(choreId);
      qc.invalidateQueries({ queryKey: ["completions"] });
      setTimeout(() => setCelebrating(null), 2000);
    } catch {
      // Error handled by mutation
    }
  };

  const isLoading = choresLoading || completionsLoading;

  const availableCount = myChores.filter(
    (c) => getChoreState(c.choreId) === "available",
  ).length;
  const pendingCount = myChores.filter(
    (c) => getChoreState(c.choreId) === "pending",
  ).length;
  const completedCount = myChores.filter(
    (c) => getChoreState(c.choreId) === "completed",
  ).length;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Colorful background matching child's color */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${(getColorStyle(child.colorTag) as { backgroundColor: string }).backgroundColor} 0%, transparent 60%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 pt-6 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            data-ocid="kid.back_button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors rounded-2xl px-3 py-2 hover:bg-white/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      {/* Child profile banner */}
      <div className="relative z-10 px-4 pt-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="rounded-3xl p-6 text-white shadow-kid-lg relative overflow-hidden"
            style={getColorStyle(freshChild.colorTag)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/10" />

            <div className="relative flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-sm font-semibold">
                    Hi there!
                  </span>
                </div>
                <h1 className="text-3xl font-display font-black leading-tight">
                  {freshChild.name}
                </h1>
              </div>
              <div className="text-right">
                <div className="text-white/80 text-xs font-semibold mb-1">
                  My Balance
                </div>
                <div className="text-3xl font-display font-black leading-tight">
                  {formatDollars(freshChild.balanceCents)}
                </div>
              </div>
            </div>

            {/* Progress strip */}
            <div className="mt-4 flex gap-2">
              {[
                {
                  emoji: "⭐",
                  label: `${availableCount} to do`,
                  bg: "bg-white/20",
                },
                {
                  emoji: "⏳",
                  label: `${pendingCount} waiting`,
                  bg: "bg-white/20",
                },
                {
                  emoji: "✅",
                  label: `${completedCount} done`,
                  bg: "bg-white/20",
                },
              ].map(({ emoji, label, bg }) => (
                <div
                  key={label}
                  className={`flex-1 ${bg} rounded-2xl px-2 py-2 text-center`}
                >
                  <div className="text-lg">{emoji}</div>
                  <div className="text-xs font-bold text-white/90 mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chores list */}
      <main className="flex-1 relative z-10 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-display font-black text-foreground mb-4">
            My Chores 📋
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-3xl" />
              ))}
            </div>
          ) : myChores.length === 0 ? (
            <div
              data-ocid="kid.empty_state"
              className="text-center py-16 rounded-3xl border-2 border-dashed border-border bg-white/50"
            >
              <div className="text-5xl mb-3">😊</div>
              <p className="font-display font-bold text-xl text-foreground">
                No chores yet!
              </p>
              <p className="text-muted-foreground mt-1">
                Ask a parent to assign some chores to you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {myChores.map((chore, idx) => {
                  const state = getChoreState(chore.choreId);
                  const isCelebrating = celebrating === chore.choreId;

                  return (
                    <motion.div
                      key={chore.choreId.toString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: idx * 0.08,
                        duration: 0.35,
                        type: "spring",
                      }}
                    >
                      <KidChoreCard
                        choreId={chore.choreId}
                        name={chore.name}
                        rewardCents={chore.rewardCents}
                        frequency={chore.frequency}
                        state={state}
                        index={idx}
                        isCelebrating={isCelebrating}
                        onComplete={() =>
                          handleComplete(chore.choreId, chore.name)
                        }
                        isSubmitting={completeChore.isPending}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-muted-foreground py-4">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

interface KidChoreCardProps {
  choreId: bigint;
  name: string;
  rewardCents: bigint;
  frequency: Frequency;
  state: ChoreState;
  index: number;
  isCelebrating: boolean;
  onComplete: () => void;
  isSubmitting: boolean;
}

function KidChoreCard({
  name,
  rewardCents,
  frequency,
  state,
  index,
  isCelebrating,
  onComplete,
  isSubmitting,
}: KidChoreCardProps) {
  const emoji = choreEmoji(name);
  const frequencyLabel = formatFrequency(frequency);

  return (
    <div
      className={`relative rounded-3xl p-5 border-2 transition-all duration-300 ${
        state === "completed"
          ? "bg-[oklch(0.96_0.06_150)] border-[oklch(0.80_0.10_150)] opacity-75"
          : state === "pending"
            ? "bg-[oklch(0.97_0.04_90)] border-[oklch(0.85_0.10_90)]"
            : "bg-card border-border shadow-kid"
      }`}
    >
      {/* Celebration burst */}
      <AnimatePresence>
        {isCelebrating && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-2">
              {["🎉", "⭐", "💰", "🌟"].map((e, i) => (
                <motion.span
                  key={e}
                  className="text-3xl"
                  initial={{ scale: 0, y: 0 }}
                  animate={{ scale: [0, 1.4, 1], y: [-40, -80] }}
                  transition={{ delay: i * 0.08, duration: 0.6 }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <motion.span
          className="text-4xl flex-shrink-0 leading-none"
          animate={
            isCelebrating ? { scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] } : {}
          }
          transition={{ duration: 0.5 }}
        >
          {state === "completed" ? "✅" : state === "pending" ? "⏳" : emoji}
        </motion.span>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-display font-black text-lg leading-tight ${
              state === "completed"
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {name}
          </h3>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span
              className="font-display font-bold text-base"
              style={{
                color:
                  state === "completed"
                    ? "oklch(0.45 0.16 150)"
                    : state === "pending"
                      ? "oklch(0.60 0.16 90)"
                      : "oklch(0.45 0.16 150)",
              }}
            >
              {formatDollars(rewardCents)}
            </span>
            <span className="text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">
              {frequencyLabel}
            </span>
          </div>

          {state === "pending" && (
            <motion.div
              className="flex items-center gap-1.5 mt-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.60 0.16 90)" }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: "oklch(0.50 0.16 90)" }}
              >
                Waiting for parent to approve...
              </span>
            </motion.div>
          )}

          {state === "completed" && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <CheckCircle2
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.55 0.16 150)" }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: "oklch(0.45 0.14 150)" }}
              >
                Done for{" "}
                {frequency === Frequency.oncePerWeek ? "this week" : "today"}!
              </span>
            </div>
          )}
        </div>

        {state === "available" && (
          <motion.div whileTap={{ scale: 0.92 }} className="flex-shrink-0">
            <Button
              data-ocid={`kid.chore_complete_button.${index + 1}`}
              className="rounded-2xl h-14 px-5 font-display font-black text-base shadow-kid gap-2"
              style={{
                background: "var(--kid-mint)",
                color: "white",
              }}
              onClick={onComplete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "..."
              ) : (
                <>
                  Done!
                  <span className="text-lg">✨</span>
                </>
              )}
            </Button>
          </motion.div>
        )}

        {state === "pending" && (
          <div className="flex-shrink-0">
            <div
              className="rounded-2xl h-14 px-4 flex items-center justify-center text-sm font-bold"
              style={{
                background: "oklch(0.90 0.08 90)",
                color: "oklch(0.50 0.16 90)",
              }}
            >
              ⏳ Pending
            </div>
          </div>
        )}

        {state === "completed" && (
          <div className="flex-shrink-0">
            <div
              className="rounded-2xl h-14 px-4 flex items-center justify-center text-sm font-bold"
              style={{
                background: "oklch(0.90 0.08 150)",
                color: "oklch(0.45 0.16 150)",
              }}
            >
              ✅ Done!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
