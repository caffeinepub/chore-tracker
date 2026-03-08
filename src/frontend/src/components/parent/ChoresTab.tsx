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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  Clock,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { type Chore, Frequency } from "../../backend.d";
import {
  useCreateChore,
  useDeleteChore,
  useListChildren,
  useListChores,
  useUpdateChore,
} from "../../hooks/useQueries";
import {
  choreEmoji,
  formatDollars,
  formatFrequency,
  getColorStyle,
} from "../../utils/format";

const FREQ_ICONS = {
  [Frequency.unlimitedDaily]: Repeat,
  [Frequency.oncePerDay]: Clock,
  [Frequency.oncePerWeek]: CalendarCheck,
};

interface ChoreForm {
  name: string;
  rewardDollars: string;
  frequency: Frequency;
  assignedChildIds: bigint[];
}

const defaultForm: ChoreForm = {
  name: "",
  rewardDollars: "",
  frequency: Frequency.oncePerDay,
  assignedChildIds: [],
};

export default function ChoresTab() {
  const { data: chores, isLoading } = useListChores();
  const { data: children } = useListChildren();
  const createChore = useCreateChore();
  const updateChore = useUpdateChore();
  const deleteChore = useDeleteChore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editChore, setEditChore] = useState<Chore | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chore | null>(null);
  const [form, setForm] = useState<ChoreForm>(defaultForm);

  const openAdd = () => {
    setForm(defaultForm);
    setShowAddDialog(true);
  };

  const openEdit = (chore: Chore) => {
    setForm({
      name: chore.name,
      rewardDollars: (Number(chore.rewardCents) / 100).toFixed(2),
      frequency: chore.frequency,
      assignedChildIds: [...chore.assignedChildIds],
    });
    setEditChore(chore);
  };

  const toggleChild = (childId: bigint) => {
    setForm((f) => ({
      ...f,
      assignedChildIds: f.assignedChildIds.some((id) => id === childId)
        ? f.assignedChildIds.filter((id) => id !== childId)
        : [...f.assignedChildIds, childId],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const cents = Math.round(
      Number.parseFloat(form.rewardDollars || "0") * 100,
    );
    if (Number.isNaN(cents) || cents < 0) return;

    if (editChore) {
      await updateChore.mutateAsync({
        choreId: editChore.choreId,
        name: form.name.trim(),
        rewardCents: BigInt(cents),
        frequency: form.frequency,
        assignedChildIds: form.assignedChildIds,
      });
      setEditChore(null);
    } else {
      await createChore.mutateAsync({
        name: form.name.trim(),
        rewardCents: BigInt(cents),
        frequency: form.frequency,
        assignedChildIds: form.assignedChildIds,
      });
      setShowAddDialog(false);
    }
    setForm(defaultForm);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteChore.mutateAsync(deleteTarget.choreId);
    setDeleteTarget(null);
  };

  const getAssignedNames = (chore: Chore) => {
    if (!children) return [];
    return chore.assignedChildIds
      .map((id) => children.find((c) => c.childId === id))
      .filter(Boolean);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-foreground">
          Chores
        </h2>
        <Button
          data-ocid="chore.add_button"
          onClick={openAdd}
          className="rounded-xl gap-2 font-semibold"
          style={{
            background: "oklch(0.76 0.16 75)",
            color: "oklch(0.12 0.04 50)",
          }}
        >
          <Plus className="w-4 h-4" />
          Add Chore
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !chores?.length ? (
        <div
          data-ocid="chore.empty_state"
          className="text-center py-16 rounded-3xl border-2 border-dashed border-border"
        >
          <div className="text-4xl mb-3">📋</div>
          <p className="font-display font-bold text-lg text-foreground">
            No chores yet
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Create chores for your children to complete
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {chores.map((chore, idx) => {
              const FreqIcon = FREQ_ICONS[chore.frequency];
              const assignedKids = getAssignedNames(chore);
              return (
                <motion.div
                  key={chore.choreId.toString()}
                  data-ocid={`chore.item.${idx + 1}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card rounded-2xl border border-border px-5 py-4 flex items-center gap-4 hover:shadow-kid transition-shadow"
                >
                  <span className="text-2xl flex-shrink-0">
                    {choreEmoji(chore.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-foreground">
                        {chore.name}
                      </h3>
                      <span
                        className="text-sm font-bold"
                        style={{ color: "oklch(0.45 0.16 150)" }}
                      >
                        {formatDollars(chore.rewardCents)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FreqIcon className="w-3.5 h-3.5" />
                        <span>{formatFrequency(chore.frequency)}</span>
                      </div>
                      {assignedKids.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {assignedKids.map((child) => (
                            <div
                              key={child!.childId.toString()}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                              style={getColorStyle(child!.colorTag)}
                            >
                              {child!.name}
                            </div>
                          ))}
                        </div>
                      )}
                      {assignedKids.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          No children assigned
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      data-ocid={`chore.edit_button.${idx + 1}`}
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3"
                      onClick={() => openEdit(chore)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      data-ocid={`chore.delete_button.${idx + 1}`}
                      variant="outline"
                      size="sm"
                      className="rounded-xl px-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteTarget(chore)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || !!editChore}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditChore(null);
          }
        }}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editChore ? "Edit Chore" : "Add Chore"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-semibold">Chore Name</Label>
              <Input
                placeholder="e.g. Make your bed"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Reward Amount ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  placeholder="0.00"
                  value={form.rewardDollars}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rewardDollars: e.target.value }))
                  }
                  className="rounded-xl h-11 pl-7"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, frequency: val as Frequency }))
                }
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={Frequency.unlimitedDaily}>
                    Unlimited daily
                  </SelectItem>
                  <SelectItem value={Frequency.oncePerDay}>
                    Once a day
                  </SelectItem>
                  <SelectItem value={Frequency.oncePerWeek}>
                    Once a week
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {children && children.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">Assign to Children</Label>
                <div className="space-y-2">
                  {children.map((child) => (
                    <label
                      key={child.childId.toString()}
                      htmlFor={`child-assign-${child.childId}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={`child-assign-${child.childId}`}
                        checked={form.assignedChildIds.some(
                          (id) => id === child.childId,
                        )}
                        onCheckedChange={() => toggleChild(child.childId)}
                        className="rounded-md"
                      />
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0"
                        style={getColorStyle(child.colorTag)}
                      />
                      <span className="font-semibold text-foreground">
                        {child.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowAddDialog(false);
                setEditChore(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl font-bold"
              onClick={handleSave}
              disabled={
                !form.name.trim() ||
                createChore.isPending ||
                updateChore.isPending
              }
              style={{
                background: "oklch(0.76 0.16 75)",
                color: "oklch(0.12 0.04 50)",
              }}
            >
              {editChore ? "Save Changes" : "Add Chore"}
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
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This chore will be permanently removed. Children will no longer be
              able to complete it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="chore.cancel_button"
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="chore.confirm_button"
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
