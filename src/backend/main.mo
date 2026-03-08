import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization System
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile (required by frontend)
  public type UserProfile = {
    name : Text;
    role : Text; // "parent" or "child"
    linkedChildId : ?Nat; // If role is child, which child profile
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PIN System for Parent Mode
  var parentPin : ?Text = null;

  public shared ({ caller }) func setParentPin(pin : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set parent PIN");
    };
    if (pin.size() != 4) {
      Runtime.trap("PIN must be exactly 4 digits");
    };
    parentPin := ?pin;
  };

  public shared ({ caller }) func verifyParentPin(pin : Text) : async Bool {
    switch (parentPin) {
      case (null) { false };
      case (?storedPin) { pin == storedPin };
    };
  };

  // Chore Frequencies
  type Frequency = {
    #unlimitedDaily;
    #oncePerDay;
    #oncePerWeek;
  };

  module Frequency {
    public func compare(f1 : Frequency, f2 : Frequency) : { #greater; #less; #equal } {
      switch (f1, f2) {
        case (#unlimitedDaily, #unlimitedDaily) { #equal };
        case (#unlimitedDaily, _) { #less };
        case (#oncePerDay, #unlimitedDaily) { #greater };
        case (#oncePerDay, #oncePerDay) { #equal };
        case (#oncePerDay, #oncePerWeek) { #less };
        case (#oncePerWeek, _) { #greater };
      };
    };
  };

  // Child Profile
  type ChildProfile = {
    childId : Nat;
    name : Text;
    colorTag : Text;
    balanceCents : Int;
  };

  module ChildProfile {
    public func compare(p1 : ChildProfile, p2 : ChildProfile) : Order.Order {
      Nat.compare(p1.childId, p2.childId);
    };
  };

  // Chore
  type Chore = {
    choreId : Nat;
    name : Text;
    rewardCents : Nat;
    frequency : Frequency;
    assignedChildIds : [Nat];
  };

  module Chore {
    public func compare(c1 : Chore, c2 : Chore) : Order.Order {
      Nat.compare(c1.choreId, c2.choreId);
    };
  };

  // Transaction
  type TransactionType = { #choreComplete; #deduction };

  type Transaction = {
    transactionId : Nat;
    childId : Nat;
    amountCents : Int;
    transactionType : TransactionType;
    choreId : ?Nat;
    note : ?Text;
    timestamp : Int;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Int.compare(t1.timestamp, t2.timestamp);
    };
  };

  // Chore Completion
  type ChoreCompletion = {
    completionId : Nat;
    choreId : Nat;
    childId : Nat;
    timestamp : Int;
    status : { #pending; #approved; #rejected };
  };

  module ChoreCompletion {
    public func compare(c1 : ChoreCompletion, c2 : ChoreCompletion) : Order.Order {
      Int.compare(c1.timestamp, c2.timestamp);
    };
  };

  // State
  let children = Map.empty<Nat, ChildProfile>();
  let chores = Map.empty<Nat, Chore>();
  let transactions = Map.empty<Nat, Transaction>();
  let completions = Map.empty<Nat, ChoreCompletion>();

  var nextChildId = 1;
  var nextChoreId = 1;
  var nextTransactionId = 1;
  var nextCompletionId = 1;

  // Helper: Check if caller is authorized for child data
  func isAuthorizedForChild(caller : Principal, childId : Nat) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.linkedChildId) {
          case (null) { false };
          case (?linkedId) { linkedId == childId };
        };
      };
    };
  };

  // Frequency Check Helper
  func isFrequencyAllowed(frequency : Frequency, childId : Nat, choreId : Nat) : Bool {
    switch (frequency) {
      case (#unlimitedDaily) { true };
      case (#oncePerDay) {
        let filtered = completions.filter(
          func(_, c) {
            c.childId == childId and c.choreId == choreId and (c.status == #approved)
          }
        );
        let todayCompletions = filtered.filter(
          func(_, c) {
            let currentComponents = timestampToUtcComponents(Time.now());
            let completionComponents = timestampToUtcComponents(
              c.timestamp,
            );
            currentComponents.year == completionComponents.year
            and currentComponents.month == completionComponents.month
            and currentComponents.day == completionComponents.day;
          }
        );
        todayCompletions.size() == 0;
      };
      case (#oncePerWeek) {
        let filtered = completions.filter(
          func(_, c) {
            c.childId == childId and c.choreId == choreId and (c.status == #approved)
          }
        );
        let thisWeekCompletions = filtered.filter(
          func(_, c) {
            let currentComponents = timestampToUtcComponents(Time.now());
            let completionComponents = timestampToUtcComponents(
              c.timestamp,
            );
            currentComponents.year == completionComponents.year and currentComponents.week == completionComponents.week;
          }
        );
        thisWeekCompletions.size() == 0;
      };
    };
  };

  // Timestamp Helpers
  func timestampToUtcComponents(timestamp : Int) : {
    year : Nat;
    month : Nat;
    day : Nat;
    week : Nat;
  } {
    // Simplified UTC conversion
    let dayLength = 86400_000_000_000;
    let daysSinceEpoch = Int.abs(timestamp) / dayLength;
    let year = (daysSinceEpoch / 365) + 1970;
    let week = (daysSinceEpoch / 7) % 52;
    let month = ((daysSinceEpoch / 30) % 12) + 1;
    let day = (daysSinceEpoch % 30) + 1;
    {
      year;
      month;
      day;
      week;
    };
  };

  // Children Management (Admin only)
  public query ({ caller }) func getChild(childId : Nat) : async ?ChildProfile {
    // Anyone can view child profiles (family app)
    children.get(childId);
  };

  public query ({ caller }) func listChildren() : async [ChildProfile] {
    // Anyone can list children (family app)
    let childList = List.empty<ChildProfile>();
    children.values().forEach(func(c) { childList.add(c) });
    childList.toArray();
  };

  public shared ({ caller }) func createChild(name : Text, colorTag : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create children");
    };
    let childId = nextChildId;
    let child : ChildProfile = {
      childId;
      name;
      colorTag;
      balanceCents = 0;
    };
    children.add(childId, child);
    nextChildId += 1;
    childId;
  };

  public shared ({ caller }) func updateChild(childId : Nat, name : Text, colorTag : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update children");
    };
    switch (children.get(childId)) {
      case (null) { Runtime.trap("Child not found") };
      case (?child) {
        let updatedChild = {
          child with
          name = name;
          colorTag = colorTag;
        };
        children.add(childId, updatedChild);
      };
    };
  };

  public shared ({ caller }) func deleteChild(childId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete children");
    };
    children.remove(childId);
  };

  // Chores Management (Admin only for create/update/delete)
  public query ({ caller }) func getChore(choreId : Nat) : async ?Chore {
    // Anyone can view chores (family app)
    chores.get(choreId);
  };

  public query ({ caller }) func listChores() : async [Chore] {
    // Anyone can list chores (family app)
    let choreList = List.empty<Chore>();
    chores.values().forEach(func(c) { choreList.add(c) });
    choreList.toArray();
  };

  public shared ({ caller }) func createChore(
    name : Text,
    rewardCents : Nat,
    frequency : Frequency,
    assignedChildIds : [Nat],
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create chores");
    };
    let choreId = nextChoreId;
    let chore : Chore = {
      choreId;
      name;
      rewardCents;
      frequency;
      assignedChildIds;
    };
    chores.add(choreId, chore);
    nextChoreId += 1;
    choreId;
  };

  public shared ({ caller }) func updateChore(
    choreId : Nat,
    name : Text,
    rewardCents : Nat,
    frequency : Frequency,
    assignedChildIds : [Nat],
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update chores");
    };
    switch (chores.get(choreId)) {
      case (null) { Runtime.trap("Chore not found") };
      case (?chore) {
        let updatedChore = {
          chore with
          name = name;
          rewardCents = rewardCents;
          frequency = frequency;
          assignedChildIds = assignedChildIds;
        };
        chores.add(choreId, updatedChore);
      };
    };
  };

  public shared ({ caller }) func deleteChore(choreId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete chores");
    };
    chores.remove(choreId);
  };

  // Complete Chore (Users can complete chores for their linked child)
  public shared ({ caller }) func completeChore(childId : Nat, choreId : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can complete chores");
    };

    // Verify caller is authorized for this child
    if (not isAuthorizedForChild(caller, childId)) {
      Runtime.trap("Unauthorized: Can only complete chores for your own child profile");
    };

    // Verify child exists
    switch (children.get(childId)) {
      case (null) { Runtime.trap("Child not found") };
      case (?_) {};
    };

    switch (chores.get(choreId)) {
      case (null) { Runtime.trap("Chore not found") };
      case (?chore) {
        // Verify child is assigned to this chore
        let isAssigned = chore.assignedChildIds.find(func(id) { id == childId });
        switch (isAssigned) {
          case (null) { Runtime.trap("Child is not assigned to this chore") };
          case (?_) {};
        };

        if (not isFrequencyAllowed(chore.frequency, childId, choreId)) {
          Runtime.trap("Chore frequency limit reached");
        };

        let completionId = nextCompletionId;
        let completion : ChoreCompletion = {
          completionId;
          choreId;
          childId;
          timestamp = Time.now();
          status = #pending;
        };
        completions.add(completionId, completion);
        nextCompletionId += 1;
        completionId;
      };
    };
  };

  // List Pending Completions (Admin only)
  public query ({ caller }) func listPendingCompletions() : async [ChoreCompletion] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending completions");
    };
    let filtered = completions.filter(
      func(_, c) {
        c.status == #pending;
      }
    );
    let completionList = List.empty<ChoreCompletion>();
    filtered.values().forEach(func(c) { completionList.add(c) });
    completionList.toArray();
  };

  // Approve/Reject Completion (Admin only)
  public shared ({ caller }) func approveCompletion(completionId : Nat, approve : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve completions");
    };

    switch (completions.get(completionId)) {
      case (null) { Runtime.trap("Completion not found") };
      case (?completion) {
        if (completion.status != #pending) {
          Runtime.trap("Completion has already been processed");
        };

        completions.add(
          completionId,
          {
            completion with
            status = if approve { #approved } else { #rejected };
          },
        );

        // Update balance and log transaction if approved
        if (approve) {
          switch (chores.get(completion.choreId)) {
            case (null) { Runtime.trap("Chore not found") };
            case (?chore) {
              switch (children.get(completion.childId)) {
                case (null) { Runtime.trap("Child not found") };
                case (?child) {
                  let updatedChild = {
                    child with
                    balanceCents = child.balanceCents + chore.rewardCents;
                  };
                  children.add(completion.childId, updatedChild);

                  // Log transaction
                  let transactionId = nextTransactionId;
                  let transaction : Transaction = {
                    transactionId;
                    childId = completion.childId;
                    amountCents = chore.rewardCents;
                    transactionType = #choreComplete;
                    choreId = ?completion.choreId;
                    note = null;
                    timestamp = Time.now();
                  };
                  transactions.add(transactionId, transaction);
                  nextTransactionId += 1;
                };
              };
            };
          };
        };
      };
    };
  };

  // Apply Deduction (Admin only)
  public shared ({ caller }) func applyDeduction(childId : Nat, amountCents : Int, note : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can apply deductions");
    };

    if (amountCents >= 0) {
      Runtime.trap("Deduction amount must be negative");
    };

    switch (children.get(childId)) {
      case (null) { Runtime.trap("Child not found") };
      case (?child) {
        let updatedChild = {
          child with
          balanceCents = child.balanceCents + amountCents; // amountCents is negative
        };
        children.add(childId, updatedChild);

        // Log transaction
        let transactionId = nextTransactionId;
        let transaction : Transaction = {
          transactionId;
          childId;
          amountCents;
          transactionType = #deduction;
          choreId = null;
          note = ?note;
          timestamp = Time.now();
        };
        transactions.add(transactionId, transaction);
        nextTransactionId += 1;
        transactionId;
      };
    };
  };

  // Get Child Balance (Admin or linked child user)
  public query ({ caller }) func getChildBalance(childId : Nat) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balances");
    };

    if (not isAuthorizedForChild(caller, childId)) {
      Runtime.trap("Unauthorized: Can only view your own child's balance");
    };

    switch (children.get(childId)) {
      case (null) { Runtime.trap("Child not found") };
      case (?child) { child.balanceCents };
    };
  };

  // Get Transaction History for Child (Admin or linked child user)
  public query ({ caller }) func getChildTransactions(childId : Nat) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    if (not isAuthorizedForChild(caller, childId)) {
      Runtime.trap("Unauthorized: Can only view your own child's transactions");
    };

    let filtered = transactions.filter(
      func(_, t) {
        t.childId == childId;
      }
    );
    let transactionList = List.empty<Transaction>();
    filtered.values().forEach(func(t) { transactionList.add(t) });
    transactionList.toArray().sort();
  };
};
