import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ChildProfile,
  Chore,
  ChoreCompletion,
  Frequency,
  Transaction,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Children ───────────────────────────────────────────────

export function useListChildren() {
  const { actor, isFetching } = useActor();
  return useQuery<ChildProfile[]>({
    queryKey: ["children"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChildren();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateChild() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      colorTag,
    }: { name: string; colorTag: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createChild(name, colorTag);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      toast.success("Child added! 🎉");
    },
    onError: () => toast.error("Failed to add child"),
  });
}

export function useUpdateChild() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      name,
      colorTag,
    }: {
      childId: bigint;
      name: string;
      colorTag: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateChild(childId, name, colorTag);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      toast.success("Child updated!");
    },
    onError: () => toast.error("Failed to update child"),
  });
}

export function useDeleteChild() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (childId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteChild(childId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["chores"] });
      toast.success("Child removed");
    },
    onError: () => toast.error("Failed to delete child"),
  });
}

export function useChildTransactions(childId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", childId?.toString()],
    queryFn: async () => {
      if (!actor || childId === null) return [];
      return actor.getChildTransactions(childId);
    },
    enabled: !!actor && !isFetching && childId !== null,
  });
}

// ─── Chores ─────────────────────────────────────────────────

export function useListChores() {
  const { actor, isFetching } = useActor();
  return useQuery<Chore[]>({
    queryKey: ["chores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      rewardCents,
      frequency,
      assignedChildIds,
    }: {
      name: string;
      rewardCents: bigint;
      frequency: Frequency;
      assignedChildIds: bigint[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createChore(name, rewardCents, frequency, assignedChildIds);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chores"] });
      toast.success("Chore created! ✅");
    },
    onError: () => toast.error("Failed to create chore"),
  });
}

export function useUpdateChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      choreId,
      name,
      rewardCents,
      frequency,
      assignedChildIds,
    }: {
      choreId: bigint;
      name: string;
      rewardCents: bigint;
      frequency: Frequency;
      assignedChildIds: bigint[];
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateChore(
        choreId,
        name,
        rewardCents,
        frequency,
        assignedChildIds,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chores"] });
      toast.success("Chore updated!");
    },
    onError: () => toast.error("Failed to update chore"),
  });
}

export function useDeleteChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (choreId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteChore(choreId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chores"] });
      toast.success("Chore deleted");
    },
    onError: () => toast.error("Failed to delete chore"),
  });
}

// ─── Completions ─────────────────────────────────────────────

export function useListPendingCompletions() {
  const { actor, isFetching } = useActor();
  return useQuery<ChoreCompletion[]>({
    queryKey: ["completions", "pending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingCompletions();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useCompleteChore() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      choreId,
    }: {
      childId: bigint;
      choreId: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.completeChore(childId, choreId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      qc.invalidateQueries({ queryKey: ["children"] });
    },
    onError: () => toast.error("Couldn't mark chore complete"),
  });
}

export function useApproveCompletion() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      completionId,
      approve,
    }: {
      completionId: bigint;
      approve: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.approveCompletion(completionId, approve);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["completions"] });
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(vars.approve ? "Chore approved! 💰" : "Chore rejected");
    },
    onError: () => toast.error("Failed to process approval"),
  });
}

// ─── Deductions ──────────────────────────────────────────────

export function useApplyDeduction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      amountCents,
      note,
    }: {
      childId: bigint;
      amountCents: bigint;
      note: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.applyDeduction(childId, amountCents, note);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Deduction applied");
    },
    onError: () => toast.error("Failed to apply deduction"),
  });
}

// ─── PIN ─────────────────────────────────────────────────────

export function useSetParentPin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!actor) throw new Error("No actor");
      return actor.setParentPin(pin);
    },
    onSuccess: () => toast.success("PIN set successfully! 🔒"),
    onError: () => toast.error("Failed to set PIN"),
  });
}

export function useVerifyParentPin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!actor) throw new Error("No actor");
      return actor.verifyParentPin(pin);
    },
  });
}
