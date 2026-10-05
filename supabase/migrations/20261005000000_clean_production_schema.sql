-- ============================================================
-- BENADIR STORE — COMPLETE CLEAN PRODUCTION SUPABASE SCHEMA
-- Normalized PostgreSQL with RLS, Double-Entry Accounting,
-- Multi-Role Staff Access, and Secure Customer Order Portal.
-- ============================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'cashier', 'inventory', 'driver');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE fulfillment_type AS ENUM ('Pickup', 'Delivery', 'Cargo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_lifecycle_status AS ENUM (
    'DRAFT', 'CONFIRMED', 'PAYMENT_PENDING', 'PARTIALLY_PAID', 'PAID',
    'READY_FOR_FULFILLMENT', 'CONVERTED_TO_SALE', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_fulfillment_status AS ENUM (
    'UNASSIGNED', 'ASSIGNED', 'PREPARING', 'READY', 'IN_TRANSIT',
    'DELIVERED', 'READY_FOR_PICKUP', 'PICKED_UP', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('unpaid', 'partial_payment', 'full_paid', 'credit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM (
    'opening', 'purchase', 'sale', 'return_in', 'return_out',
    'adjustment', 'damage', 'loss', 'transfer'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_account_category AS ENUM ('cash', 'wallet', 'merchant', 'bank');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. PROFILES & STAFF ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_pin_security (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. PRODUCT CATALOG & INVENTORY
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.product_brands(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 5,
  image_url TEXT,
  shoe_ref TEXT,
  shoe_sizes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  movement_type movement_type NOT NULL,
  quantity_change INT NOT NULL,
  stock_after INT NOT NULL,
  cost_price NUMERIC(14, 2),
  reference_no TEXT,
  reason TEXT,
  actor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BRANCHES & BRANCH INVENTORY
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  manager_name TEXT NOT NULL,
  commission_per_item NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branch_stock (
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (branch_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.branch_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_commission NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branch_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_sale_id UUID NOT NULL REFERENCES public.branch_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  cost_price NUMERIC(14, 2) NOT NULL
);

-- 5. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  credit_limit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- positive = debt owed to store
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  email TEXT,
  supplier_type TEXT NOT NULL DEFAULT 'LOCAL',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Accounts Payable
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TREASURY & PAYMENT ACCOUNTS
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category payment_account_category NOT NULL DEFAULT 'cash',
  provider TEXT,
  account_number TEXT,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES public.payment_accounts(id),
  to_account_id UUID NOT NULL REFERENCES public.payment_accounts(id),
  amount NUMERIC(14, 2) NOT NULL,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PURCHASES & PROCUREMENT
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_no TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(14, 2) NOT NULL,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  supplier_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_account_id UUID REFERENCES public.payment_accounts(id),
  cargo_cost NUMERIC(14, 2) DEFAULT 0.00,
  direct_costs NUMERIC(14, 2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'Received',
  actor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  cost_price NUMERIC(14, 2) NOT NULL,
  landed_unit_cost NUMERIC(14, 2) NOT NULL,
  total NUMERIC(14, 2) NOT NULL
);

-- 8. DRIVERS, DELIVERIES & CARGO
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'motorcycle',
  license_plate TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  cash_held NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  deliveries_completed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ORDERS & CUSTOMER PORTAL
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  delivery_fee_payer TEXT NOT NULL DEFAULT 'Customer',
  cargo_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(14, 2) NOT NULL,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  advance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  fulfillment_type fulfillment_type NOT NULL DEFAULT 'Delivery',
  fulfillment_status order_fulfillment_status NOT NULL DEFAULT 'UNASSIGNED',
  delivery_address TEXT,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  portal_token TEXT UNIQUE,
  portal_token_expires_at TIMESTAMPTZ,
  portal_token_revoked BOOLEAN NOT NULL DEFAULT false,
  status order_lifecycle_status NOT NULL DEFAULT 'CONFIRMED',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  selling_price NUMERIC(14, 2) NOT NULL,
  cost_price NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.portal_payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'customer_confirmed',
  reference TEXT,
  rejection_reason TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. SALES & RETURNS
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  deposit_account_id UUID REFERENCES public.payment_accounts(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  delivery_fee NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  delivery_fee_payer TEXT NOT NULL DEFAULT 'Customer',
  grand_total NUMERIC(14, 2) NOT NULL,
  cost_of_goods NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  gross_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  remaining_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'full_paid',
  fulfillment_type fulfillment_type NOT NULL DEFAULT 'Pickup',
  cashier_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  cost_price NUMERIC(14, 2) NOT NULL,
  selling_price NUMERIC(14, 2) NOT NULL,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(14, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_no TEXT NOT NULL UNIQUE,
  original_sale_id UUID NOT NULL REFERENCES public.sales(id),
  total_refund NUMERIC(14, 2) NOT NULL,
  refund_account_id UUID REFERENCES public.payment_accounts(id),
  reason TEXT NOT NULL,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales_return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.sales_returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  refund_amount NUMERIC(14, 2) NOT NULL,
  restock BOOLEAN NOT NULL DEFAULT true
);

-- 11. EXPENSES & INCOME
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_from_account_id UUID NOT NULL REFERENCES public.payment_accounts(id),
  is_petty_cash BOOLEAN NOT NULL DEFAULT false,
  ad_product_id UUID REFERENCES public.products(id),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  deposited_to_account_id UUID NOT NULL REFERENCES public.payment_accounts(id),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. DOUBLE-ENTRY ACCOUNTING LEDGER
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  type account_type NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no TEXT NOT NULL UNIQUE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  memo TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  is_ai_proposal BOOLEAN NOT NULL DEFAULT false,
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  debit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  credit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit = 0 AND credit = 0))
);

-- Seed standard Chart of Accounts
INSERT INTO public.chart_of_accounts (code, name, type, description)
VALUES
  ('1000', 'Cash & Bank', 'Asset', 'Liquid cash, mobile money and bank balances'),
  ('1100', 'Accounts Receivable', 'Asset', 'Customer credit balances'),
  ('1200', 'Inventory', 'Asset', 'Cost of goods in stock'),
  ('2000', 'Accounts Payable', 'Liability', 'Owed to suppliers for credit purchases'),
  ('2100', 'Customer Deposits', 'Liability', 'Order advance payments pending fulfillment'),
  ('3000', 'Owner''s Equity', 'Equity', 'Initial capital and owner investments'),
  ('4000', 'Sales Revenue', 'Revenue', 'Income from product sales'),
  ('4100', 'Delivery Income', 'Revenue', 'Income collected from customer deliveries'),
  ('4200', 'Other Income', 'Revenue', 'Miscellaneous revenue streams'),
  ('5000', 'Cost of Goods Sold', 'Expense', 'Direct inventory acquisition costs of sold items'),
  ('5100', 'Sales Returns', 'Expense', 'Refunds and allowances given on returned goods'),
  ('5200', 'Delivery Expense', 'Expense', 'Delivery costs paid by the business'),
  ('6000', 'General Expenses', 'Expense', 'Rent, utilities, salaries and administrative costs')
ON CONFLICT (name) DO NOTHING;

-- 13. FINANCIAL ENGINE, TARGETS & RECONCILIATIONS
CREATE TABLE IF NOT EXISTS public.financial_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL UNIQUE,
  monthly_base_target NUMERIC(14, 2) NOT NULL DEFAULT 93.50,
  rent_amount NUMERIC(14, 2) NOT NULL DEFAULT 250.00,
  rent_start_date DATE NOT NULL DEFAULT '2027-02-01',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evc_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  account_id UUID NOT NULL REFERENCES public.payment_accounts(id),
  live_balance NUMERIC(14, 2) NOT NULL,
  ledger_balance NUMERIC(14, 2) NOT NULL,
  difference NUMERIC(14, 2) NOT NULL,
  reason TEXT NOT NULL,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_pin_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evc_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Helper function: get current authenticated user role
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Staff Policy: Authenticated staff can read public catalog and customers
CREATE POLICY "Staff read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage products" ON public.products FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'inventory'));

CREATE POLICY "Staff read categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage categories" ON public.product_categories FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'inventory'));

CREATE POLICY "Staff read brands" ON public.product_brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage brands" ON public.product_brands FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'inventory'));

CREATE POLICY "Staff read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'cashier'));

CREATE POLICY "Staff sales view" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff sales create" ON public.sales FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'cashier'));

CREATE POLICY "Staff orders view" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff orders manage" ON public.orders FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'cashier'));

CREATE POLICY "Staff purchases view" ON public.purchases FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'inventory'));
CREATE POLICY "Staff purchases manage" ON public.purchases FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'inventory'));

CREATE POLICY "Staff accounts view" ON public.payment_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff accounts manage" ON public.payment_accounts FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY "Staff accounting view" ON public.chart_of_accounts FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'cashier'));
CREATE POLICY "Staff accounting manage" ON public.chart_of_accounts FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY "Staff journals view" ON public.journal_entries FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin'));
CREATE POLICY "Staff journals manage" ON public.journal_entries FOR ALL TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin'));

CREATE POLICY "Staff profiles read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff profiles update self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- First user claim owner function
CREATE OR REPLACE FUNCTION public.claim_first_owner() RETURNS JSON AS $$
DECLARE
  v_count INT;
  v_role user_role;
BEGIN
  SELECT count(*) INTO v_count FROM public.profiles;
  IF v_count = 0 THEN
    INSERT INTO public.profiles (id, name, role)
    VALUES (auth.uid(), coalesce(auth.jwt()->>'email', 'Owner'), 'owner')
    ON CONFLICT (id) DO UPDATE SET role = 'owner';
    RETURN json_build_object('staff', true, 'claimed_owner', true);
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NOT NULL THEN
    RETURN json_build_object('staff', true, 'role', v_role);
  END IF;

  RETURN json_build_object('staff', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Customer Order Portal RPCs (Public Security Definer)
CREATE OR REPLACE FUNCTION public.portal_get_order(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_items JSON;
  v_payments JSON;
BEGIN
  SELECT o.*, c.name AS customer_name, c.phone AS customer_phone
  INTO v_order
  FROM public.orders o
  JOIN public.customers c ON c.id = o.customer_id
  WHERE o.portal_token = p_token
    AND o.portal_token_revoked = false
    AND (o.portal_token_expires_at IS NULL OR o.portal_token_expires_at > now());

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  SELECT json_agg(json_build_object(
    'name', p.name,
    'imageUrl', p.image_url,
    'quantity', oi.quantity,
    'unitPrice', oi.selling_price,
    'discount', oi.discount,
    'total', oi.total
  )) INTO v_items
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = v_order.id;

  SELECT json_agg(json_build_object(
    'id', id,
    'amount', amount,
    'method', method,
    'status', status,
    'createdAt', created_at
  )) INTO v_payments
  FROM public.portal_payment_submissions
  WHERE order_id = v_order.id;

  RETURN json_build_object(
    'orderNo', v_order.order_no,
    'createdAt', v_order.created_at,
    'status', v_order.status,
    'fulfillmentStatus', v_order.fulfillment_status,
    'fulfillmentType', v_order.fulfillment_type,
    'customer', json_build_object('name', v_order.customer_name, 'phone', v_order.customer_phone),
    'deliveryAddress', coalesce(v_order.delivery_address, ''),
    'items', coalesce(v_items, '[]'::json),
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'deliveryFee', v_order.delivery_fee,
    'deliveryFeePayer', v_order.delivery_fee_payer,
    'total', v_order.total,
    'paidAmount', v_order.paid_amount,
    'advanceAmount', v_order.advance_amount,
    'remaining', (v_order.total - v_order.paid_amount),
    'advanceDue', CASE WHEN v_order.advance_amount > v_order.paid_amount THEN (v_order.advance_amount - v_order.paid_amount) ELSE 0 END,
    'fullDue', (v_order.total - v_order.paid_amount),
    'payments', coalesce(v_payments, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.portal_start_payment(
  p_token TEXT,
  p_mode TEXT,
  p_method TEXT,
  p_client_key TEXT
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_amount NUMERIC(14, 2);
  v_attempt_id UUID;
BEGIN
  SELECT * INTO v_order FROM public.orders
  WHERE portal_token = p_token AND portal_token_revoked = false;

  IF NOT FOUND THEN RETURN json_build_object('error', 'not_found'); END IF;

  IF p_mode = 'advance' THEN
    v_amount := v_order.advance_amount - v_order.paid_amount;
  ELSE
    v_amount := v_order.total - v_order.paid_amount;
  END IF;

  IF v_amount <= 0 THEN RETURN json_build_object('error', 'already_paid'); END IF;

  INSERT INTO public.portal_payment_submissions (order_id, client_key, amount, method, status)
  VALUES (v_order.id, p_client_key, v_amount, p_method, 'customer_confirmed')
  RETURNING id INTO v_attempt_id;

  RETURN json_build_object('attemptId', v_attempt_id, 'amount', v_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
