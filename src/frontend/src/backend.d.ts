import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    transactionType: TransactionType;
    note?: string;
    amountCents: bigint;
    childId: bigint;
    timestamp: bigint;
    choreId?: bigint;
    transactionId: bigint;
}
export interface ChildProfile {
    name: string;
    childId: bigint;
    colorTag: string;
    balanceCents: bigint;
}
export interface ChoreCompletion {
    status: Variant_pending_approved_rejected;
    completionId: bigint;
    childId: bigint;
    timestamp: bigint;
    choreId: bigint;
}
export interface UserProfile {
    name: string;
    role: string;
    linkedChildId?: bigint;
}
export interface Chore {
    name: string;
    rewardCents: bigint;
    frequency: Frequency;
    assignedChildIds: Array<bigint>;
    choreId: bigint;
}
export enum Frequency {
    unlimitedDaily = "unlimitedDaily",
    oncePerWeek = "oncePerWeek",
    oncePerDay = "oncePerDay"
}
export enum TransactionType {
    deduction = "deduction",
    choreComplete = "choreComplete"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    applyDeduction(childId: bigint, amountCents: bigint, note: string): Promise<bigint>;
    approveCompletion(completionId: bigint, approve: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeChore(childId: bigint, choreId: bigint): Promise<bigint>;
    createChild(name: string, colorTag: string): Promise<bigint>;
    createChore(name: string, rewardCents: bigint, frequency: Frequency, assignedChildIds: Array<bigint>): Promise<bigint>;
    deleteChild(childId: bigint): Promise<void>;
    deleteChore(choreId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChild(childId: bigint): Promise<ChildProfile | null>;
    getChildBalance(childId: bigint): Promise<bigint>;
    getChildTransactions(childId: bigint): Promise<Array<Transaction>>;
    getChore(choreId: bigint): Promise<Chore | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listChildren(): Promise<Array<ChildProfile>>;
    listChores(): Promise<Array<Chore>>;
    listPendingCompletions(): Promise<Array<ChoreCompletion>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setParentPin(pin: string): Promise<void>;
    updateChild(childId: bigint, name: string, colorTag: string): Promise<void>;
    updateChore(choreId: bigint, name: string, rewardCents: bigint, frequency: Frequency, assignedChildIds: Array<bigint>): Promise<void>;
    verifyParentPin(pin: string): Promise<boolean>;
}
