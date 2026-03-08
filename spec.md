# Chore Tracker for Kids

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Parent/admin role that can manage children, chores, and approve completions
- Child profiles (name, avatar color)
- Chore management: create chores with name, reward amount (USD), frequency (unlimited daily / once a day / once a week), and assigned children (one or more)
- Children can mark chores as complete (pending approval)
- Parent approves or rejects chore completions before money is credited
- Parent can deduct money from a child for misbehavior (with a note/reason)
- Each child has a running balance displayed in USD
- Transaction history per child (earnings + deductions)
- Kid-friendly UI: large text, colorful, simple interactions
- Parent dashboard: manage children, manage chores, review pending approvals, apply deductions
- Child dashboard: see their chores for today/week, mark complete, see their balance

### Modify
N/A

### Remove
N/A

## Implementation Plan

**Backend (Motoko)**
- Data models: Child (id, name, colorTag, balance), Chore (id, name, rewardCents, frequency, assignedChildIds), ChoreCompletion (id, choreId, childId, timestamp, status: pending/approved/rejected), Transaction (id, childId, amountCents, type: credit/deduction, note, timestamp)
- Functions:
  - addChild, listChildren, removeChild
  - addChore, updateChore, removeChore, listChores
  - markChoreComplete (child action) -> creates pending ChoreCompletion
  - approveCompletion, rejectCompletion (parent action) -> updates completion, credits balance on approve
  - applyDeduction (parent action) -> deducts from child balance, creates transaction
  - getChildBalance, getTransactionHistory
  - Frequency enforcement: once-a-day completions checked by date, once-a-week by ISO week; unlimited always allowed

**Frontend**
- Two modes: Parent Mode and Child Mode (no login required, parent switches mode with a PIN or simple toggle)
- Parent Mode screens: Children list, Add/Edit Child, Chores list, Add/Edit Chore (assign to children, set frequency/reward), Pending Approvals, Child Detail (balance + transaction history), Apply Deduction form
- Child Mode screen: Child selector (big colorful cards), then child's chore list for today (with complete button), balance display
- Kid-friendly design: large buttons, bright colors, simple language, emoji icons for chores
