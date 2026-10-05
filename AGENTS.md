# Benadir Store — Architecture & Operating Rules

- Order product images flow from the product record into order items and the payment portal; preserve this chain so customers see the exact ordered item.
- Admin data is offline-first: local database (IndexedDB) is the working cache, queued and synced to Supabase when online + staff signed in.
- Accounting books are real double-entry bookkeeping: every transaction creates balanced journal entries; the AI accountant only proposes actions that the user approves. Why: numbers stay deterministic; AI never writes silently.
- Tracking/alerts state and debt state maintain referential integrity without double-counting.
- No sample/demo data ever: store fallbacks are empty. Why: user data must never be replaced.
- The admin app opens behind StaffGate (src/components/auth/StaffGate.tsx): a signed-in account listed in staff members (first account auto-claims owner); offline use allowed with cached session or explicit offline choice.
- Server/data layer uses standard Supabase (PostgreSQL + Auth + Storage + RLS) with local IndexedDB offline sync.
- Staff roles (owner/admin/cashier/inventory) come from database profiles; section access is defined in src/lib/roles.ts and enforced via Supabase RLS and the UI.
- The AI Stock Advisor (insights.server.ts) and AI Accountant use Google Gemini with server-side validation; they only advise and propose, never mutate accounting records directly.
- Orders and Sales are unified in SalesOrdersView; walk-in sales are immediate sales while deliveries/cargo remain orders.
- Branch sales, per-branch stock and fixed per-sale commissions ($2 per item) live in normalized branch tables; moving stock to a branch updates main inventory.
- Delivery fee paid by the business is a sale expense: never added to customer total, deducted from net profit.
- Petty Cash Fund and EVC Reconciliation are engine-backed views storing transfers and reconciliations; differences are recorded, never silently altered.
- Balance PIN is hashed in a protected table, checked via security-definer RPC with lockout protection.
- The whole app sits inside AutoLock: leaving it 10s locks it until balance PIN is entered; revealed balances auto-hide after 5s.
