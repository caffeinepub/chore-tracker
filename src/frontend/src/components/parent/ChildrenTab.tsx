import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type ChildProfile, TransactionType } from "../../backend.d";
import {
  useChildTransactions,
  useCreateChild,
  useDeleteChild,
  useListChildren,
  useUpdateChild,
} from "../../hooks/useQueries";
import {
  AVAILABLE_COLORS,
  formatDollars,
  formatTimestamp,
  getColorStyle,
} from "../../utils/format";

const COLOR_LABELS: Record<string, string> = {
  coral: "Coral",
  sky: "Sky Blue",
  mint: "Mint",
  grape: "Grape",
  sun: "Sunshine",
  rose: "Rose",
  teal: "Teal",
  peach: "Peach",
};

export default function ChildrenTab() {
  const { data: children, isLoading } = useListChildren();
  const createChild = useCreateChild();
  const updateChild = useUpdateChild();
  const deleteChild = useDeleteChild();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editChild, setEditChild] = useState<ChildProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChildProfile | null>(null);
  const [historyChild, setHistoryChild] = useState<ChildProfile | null>(null);

  const [form, setForm] = useState({ name: "", colorTag: "coral" });

  const openAdd = () => {
    setForm({ name: "", colorTag: "coral" });
    setShowAddDialog(true);
  };

  const openEdit = (child: ChildProfile) => {
    setForm({ name: child.name, colorTag: child.colorTag });
    setEditChild(child);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editChild) {
      await updateChild.mutateAsync({
        childId: editChild.childId,
        name: form.name.trim(),
        colorTag: form.colorTag,
      });
      setEditChild(null);
    } else {
      await createChild.mutateAsync({
        name: form.name.trim(),
        colorTag: form.colorTag,
      });
      setShowAddDialog(false);
    }
    setForm({ name: "", colorTag: "coral" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteChild.mutateAsync(deleteTarget.childId);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-foreground">
          Children
        </h2>
        <Button
          data-ocid="child.add_button"
          onClick={openAdd}
          className="rounded-xl gap-2 font-semibold"
          style={{
            background: "oklch(0.76 0.16 75)",
            color: "oklch(0.12 0.04 50)",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Child
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : !children?.length ? (
        <div
          data-ocid="child.empty_state"
          className="text-center py-16 rounded-3xl border-2 border-dashed border-border"
        >
          <div className="text-4xl mb-3">👶</div>
          <p className="font-display font-bold text-lg text-foreground">
            No children yet
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first child to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {children.map((child, idx) => (
              <motion.div
                key={child.childId.toString()}
                data-ocid={`child.item.${idx + 1}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden hover:shadow-kid transition-shadow"
              >
                {/* Color header strip */}
                <div className="h-2" style={getColorStyle(child.colorTag)} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-xs flex-shrink-0"
                        style={getColorStyle(child.colorTag)}
                      >
                        {child.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground">
                          {child.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Number(child.balanceCents) >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-[oklch(0.55_0.18_150)]" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                          )}
                          <span
                            className="text-lg font-display font-black"
                            style={{
                              color:
                                Number(child.balanceCents) >= 0
                                  ? "oklch(0.45 0.16 150)"
                                  : "oklch(0.55 0.22 25)",
                            }}
                          >
                            {formatDollars(child.balanceCents)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-xl text-xs gap-1.5 font-semibold"
                      onClick={() => setHistoryChild(child)}
                    >
                      <History className="w-3.5 h-3.5" />
                      History
                    </Button>
                    <Button
                      data-ocid={`child.edit_button.${idx + 1}`}
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3"
                      onClick={() => openEdit(child)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-ocid={`child.delete_button.${idx + 1}`}
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteTarget(child)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || !!editChild}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditChild(null);
          }
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editChild ? "Edit Child" : "Add Child"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="child-name" className="font-semibold">
                Name
              </Label>
              <Input
                id="child-name"
                placeholder="Child's name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, colorTag: color }))}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all"
                    style={{
                      outline:
                        form.colorTag === color
                          ? "2px solid oklch(0.22 0.04 50)"
                          : "2px solid transparent",
                      background:
                        form.colorTag === color
                          ? "oklch(0.94 0.02 80)"
                          : "transparent",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full shadow-xs"
                      style={getColorStyle(color)}
                    />
                    <span className="text-xs text-muted-foreground font-medium">
                      {COLOR_LABELS[color]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowAddDialog(false);
                setEditChild(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl font-bold"
              onClick={handleSave}
              disabled={
                !form.name.trim() ||
                createChild.isPending ||
                updateChild.isPending
              }
              style={{
                background: "oklch(0.76 0.16 75)",
                color: "oklch(0.12 0.04 50)",
              }}
            >
              {editChild ? "Save Changes" : "Add Child"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name} and all their
              data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="child.cancel_button"
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="child.confirm_button"
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <TransactionHistoryDialog
        child={historyChild}
        onClose={() => setHistoryChild(null)}
      />
    </div>
  );
}

function TransactionHistoryDialog({
  child,
  onClose,
}: {
  child: ChildProfile | null;
  onClose: () => void;
}) {
  const { data: transactions, isLoading } = useChildTransactions(
    child?.childId ?? null,
  );

  return (
    <Dialog open={!!child} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {child?.name}'s Transaction History
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : !transactions?.length ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">💸</p>
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {[...transactions]
                .sort((a, b) => Number(b.timestamp - a.timestamp))
                .map((tx) => (
                  <div
                    key={tx.transactionId.toString()}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/60 gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">
                        {tx.transactionType === TransactionType.deduction
                          ? "💸"
                          : "💰"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {tx.transactionType === TransactionType.deduction
                            ? tx.note || "Deduction"
                            : "Chore completed"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="font-display font-bold text-sm flex-shrink-0"
                      style={{
                        color:
                          tx.transactionType === TransactionType.deduction
                            ? "oklch(0.55 0.22 25)"
                            : "oklch(0.45 0.16 150)",
                      }}
                    >
                      {tx.transactionType === TransactionType.deduction
                        ? "-"
                        : "+"}
                      {formatDollars(
                        tx.amountCents < 0n ? -tx.amountCents : tx.amountCents,
                      )}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
