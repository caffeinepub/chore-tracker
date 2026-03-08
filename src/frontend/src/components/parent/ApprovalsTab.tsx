import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Clock, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useApproveCompletion,
  useListChildren,
  useListChores,
  useListPendingCompletions,
} from "../../hooks/useQueries";
import { choreEmoji, formatTimestamp, getColorStyle } from "../../utils/format";
import { formatDollars } from "../../utils/format";

export default function ApprovalsTab() {
  const { data: completions, isLoading } = useListPendingCompletions();
  const { data: chores } = useListChores();
  const { data: children } = useListChildren();
  const approveCompletion = useApproveCompletion();

  const getChore = (choreId: bigint) =>
    chores?.find((c) => c.choreId === choreId);
  const getChild = (childId: bigint) =>
    children?.find((c) => c.childId === childId);

  const handleApprove = async (completionId: bigint, approve: boolean) => {
    await approveCompletion.mutateAsync({ completionId, approve });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-foreground">
          Pending Approvals
        </h2>
        {completions && completions.length > 0 && (
          <span className="text-sm text-muted-foreground font-medium">
            {completions.length} waiting
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !completions?.length ? (
        <div
          data-ocid="approval.empty_state"
          className="text-center py-16 rounded-3xl border-2 border-dashed border-border"
        >
          <div className="text-4xl mb-3">✅</div>
          <p className="font-display font-bold text-lg text-foreground">
            All caught up!
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            No chores waiting for approval
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {completions.map((completion, idx) => {
              const chore = getChore(completion.choreId);
              const child = getChild(completion.childId);
              const isPending = approveCompletion.isPending;

              return (
                <motion.div
                  key={completion.completionId.toString()}
                  data-ocid={`approval.item.${idx + 1}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-kid transition-shadow"
                >
                  {/* Child color strip */}
                  {child && (
                    <div
                      className="h-1.5"
                      style={getColorStyle(child.colorTag)}
                    />
                  )}
                  <div className="px-5 py-4 flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0">
                      {chore ? choreEmoji(chore.name) : "⭐"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-foreground">
                          {chore?.name ?? "Unknown chore"}
                        </h3>
                        {chore && (
                          <span
                            className="text-sm font-bold"
                            style={{ color: "oklch(0.45 0.16 150)" }}
                          >
                            {formatDollars(chore.rewardCents)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {child && (
                          <div
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                            style={getColorStyle(child.colorTag)}
                          >
                            {child.name}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(completion.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        data-ocid={`approval.reject_button.${idx + 1}`}
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 font-semibold text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() =>
                          handleApprove(completion.completionId, false)
                        }
                        disabled={isPending}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reject</span>
                      </Button>
                      <Button
                        data-ocid={`approval.approve_button.${idx + 1}`}
                        size="sm"
                        className="rounded-xl gap-1.5 font-semibold"
                        style={{
                          background: "oklch(0.55 0.18 150)",
                          color: "white",
                        }}
                        onClick={() =>
                          handleApprove(completion.completionId, true)
                        }
                        disabled={isPending}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Approve</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
