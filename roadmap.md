# Roadmap

- [x] Mask balances (Dashboard + Accounts) behind PIN
- [x] Set PIN to 8125 (server-side)
- [x] Verify PIN unlock flow in browser
- [x] Settings: owner can change the balance PIN (verified end-to-end)

## October live launch and production hardening

- [x] Make the Financial Engine start on October 1 and redistribute monthly deficit/surplus across remaining days
- [x] Show target, achieved, remaining, and surplus for today/week/current month
- [x] Add Shoes-only product identity and image workflow without changing other categories
- [x] Expand Dashboard detail using existing real records only
- [x] Add distinct interaction and loading sounds with a user-accessible mute control
- [x] Add focused Dashboard animations with reduced-motion support
- [x] Strengthen mobile layouts and visual consistency on Dashboard and product entry
- [x] Verify engine tests, production build, and desktop/mobile browser flows

## Deymaha, sales targets, and cloud verification

- [x] Add a complete Deymaha section for customer credit, supplier balances, cash/EVC loans, and company borrowings
- [x] Add due dates, repayments, statuses, and reminders starting one day before due dates until paid
- [x] Change target achievement everywhere from net profit to sales
- [x] Verify October 4 cloud data can be restored and viewed on another clean device session
- [x] Verify the two-line target card and AI transaction notes on a mobile viewport
- [x] Combine Products, Inventory, and Purchases under one shared sidebar entry
- [x] Combine Local Delivery, Cargo, Tracking, and Drivers under one shared tabbed page
- [x] Combine Payments, Payment Accounts, and Petty Cash under one shared tabbed page
- [x] Combine Income and Expenses under one shared tabbed page
- [x] Add Stock Advisor as a separate tab inside Products & Stock
- [x] Combine Users & Roles and Settings under one shared tabbed page
- [x] Add EVC Reconciliation as a separate tab inside Payments & Accounts
- [x] Add Suppliers as a separate tab inside Products & Stock
- [x] Add Customers as a separate tab inside Sales / Orders
- [x] Add Targets as a separate tab inside Users & Settings
- [x] Quick Add Product from Sale/Order page (image, name, qty, unit, cost, sale price) saves product then adds to cart
- [x] Allow registering gifted stock (main + branch) with no cost price

## New tasks (14:23 UTC)

- [ ] PaymentAccountsPicker: show all saved accounts (wallets/merchants/banks) with per-account icons; default EVC Plus
- [ ] Orders & Sales: edit/delete/update after creation (e.g. change 1 product to 3)
- [ ] Icons across the system where appropriate; icons replaceable via upload
- [ ] URGENT: preview renders unstyled (plain HTML) — user screenshot 14:24; diagnose CSS/build
- [ ] Branch creation as professional popup modal (App.tsx:408 / BranchSalesPanel)
- [ ] DebtsView account select: hide balance (user asked why balance shows)
- [x] Mask ALL money figures (totals, values) behind PIN — not just the 3 header boxes
- [x] Move AI transaction notes panel from Dashboard to Accounting
