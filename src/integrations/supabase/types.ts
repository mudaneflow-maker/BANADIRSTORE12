export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          role: "owner" | "admin" | "cashier" | "inventory" | "driver";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone?: string | null;
          role?: "owner" | "admin" | "cashier" | "inventory" | "driver";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          role?: "owner" | "admin" | "cashier" | "inventory" | "driver";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          code: string;
          sku: string;
          barcode: string | null;
          name: string;
          category_id: string | null;
          brand_id: string | null;
          unit: string;
          cost_price: number;
          selling_price: number;
          stock: number;
          min_stock_level: number;
          image_url: string | null;
          shoe_ref: string | null;
          shoe_sizes: string | null;
          is_active: boolean;
          is_archived: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          sku: string;
          barcode?: string | null;
          name: string;
          category_id?: string | null;
          brand_id?: string | null;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          stock?: number;
          min_stock_level?: number;
          image_url?: string | null;
          shoe_ref?: string | null;
          shoe_sizes?: string | null;
          is_active?: boolean;
          is_archived?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          sku?: string;
          barcode?: string | null;
          name?: string;
          category_id?: string | null;
          brand_id?: string | null;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          stock?: number;
          min_stock_level?: number;
          image_url?: string | null;
          shoe_ref?: string | null;
          shoe_sizes?: string | null;
          is_active?: boolean;
          is_archived?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          code: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          credit_limit: number;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          credit_limit?: number;
          balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          credit_limit?: number;
          balance?: number;
          created_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          code: string;
          name: string;
          phone: string;
          company: string | null;
          email: string | null;
          supplier_type: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          phone: string;
          company?: string | null;
          email?: string | null;
          supplier_type?: string;
          balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          phone?: string;
          company?: string | null;
          email?: string | null;
          supplier_type?: string;
          balance?: number;
          created_at?: string;
        };
      };
      payment_accounts: {
        Row: {
          id: string;
          name: string;
          category: "cash" | "wallet" | "merchant" | "bank";
          provider: string | null;
          account_number: string | null;
          balance: number;
          currency: string;
          is_active: boolean;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: "cash" | "wallet" | "merchant" | "bank";
          provider?: string | null;
          account_number?: string | null;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: "cash" | "wallet" | "merchant" | "bank";
          provider?: string | null;
          account_number?: string | null;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          invoice_no: string;
          order_id: string | null;
          customer_id: string;
          deposit_account_id: string | null;
          date: string;
          subtotal: number;
          discount: number;
          delivery_fee: number;
          delivery_fee_payer: string;
          grand_total: number;
          cost_of_goods: number;
          gross_profit: number;
          amount_paid: number;
          remaining_balance: number;
          payment_method: string;
          payment_status: "unpaid" | "partial_payment" | "full_paid" | "credit";
          fulfillment_type: "Pickup" | "Delivery" | "Cargo";
          cashier_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_no: string;
          order_id?: string | null;
          customer_id: string;
          deposit_account_id?: string | null;
          date?: string;
          subtotal: number;
          discount?: number;
          delivery_fee?: number;
          delivery_fee_payer?: string;
          grand_total: number;
          cost_of_goods?: number;
          gross_profit?: number;
          amount_paid?: number;
          remaining_balance?: number;
          payment_method: string;
          payment_status?: "unpaid" | "partial_payment" | "full_paid" | "credit";
          fulfillment_type?: "Pickup" | "Delivery" | "Cargo";
          cashier_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_no?: string;
          order_id?: string | null;
          customer_id?: string;
          deposit_account_id?: string | null;
          date?: string;
          subtotal?: number;
          discount?: number;
          delivery_fee?: number;
          delivery_fee_payer?: string;
          grand_total?: number;
          cost_of_goods?: number;
          gross_profit?: number;
          amount_paid?: number;
          remaining_balance?: number;
          payment_method?: string;
          payment_status?: "unpaid" | "partial_payment" | "full_paid" | "credit";
          fulfillment_type?: "Pickup" | "Delivery" | "Cargo";
          cashier_id?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_no: string;
          customer_id: string;
          date: string;
          subtotal: number;
          discount: number;
          delivery_fee: number;
          delivery_fee_payer: string;
          cargo_fee: number;
          total: number;
          paid_amount: number;
          advance_amount: number;
          payment_status: string;
          fulfillment_type: "Pickup" | "Delivery" | "Cargo";
          fulfillment_status: string;
          delivery_address: string | null;
          driver_id: string | null;
          portal_token: string | null;
          portal_token_expires_at: string | null;
          portal_token_revoked: boolean;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_no: string;
          customer_id: string;
          date?: string;
          subtotal?: number;
          discount?: number;
          delivery_fee?: number;
          delivery_fee_payer?: string;
          cargo_fee?: number;
          total: number;
          paid_amount?: number;
          advance_amount?: number;
          payment_status?: string;
          fulfillment_type?: "Pickup" | "Delivery" | "Cargo";
          fulfillment_status?: string;
          delivery_address?: string | null;
          driver_id?: string | null;
          portal_token?: string | null;
          portal_token_expires_at?: string | null;
          portal_token_revoked?: boolean;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_no?: string;
          customer_id?: string;
          date?: string;
          subtotal?: number;
          discount?: number;
          delivery_fee?: number;
          delivery_fee_payer?: string;
          cargo_fee?: number;
          total?: number;
          paid_amount?: number;
          advance_amount?: number;
          payment_status?: string;
          fulfillment_type?: "Pickup" | "Delivery" | "Cargo";
          fulfillment_status?: string;
          delivery_address?: string | null;
          driver_id?: string | null;
          portal_token?: string | null;
          portal_token_expires_at?: string | null;
          portal_token_revoked?: boolean;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      chart_of_accounts: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
          description: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
          description?: string | null;
          is_active?: boolean;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          entry_no: string;
          date: string;
          memo: string;
          source_type: string;
          source_id: string | null;
          is_ai_proposal: boolean;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_no: string;
          date?: string;
          memo: string;
          source_type: string;
          source_id?: string | null;
          is_ai_proposal?: boolean;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_no?: string;
          date?: string;
          memo?: string;
          source_type?: string;
          source_id?: string | null;
          is_ai_proposal?: boolean;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
      };
      journal_lines: {
        Row: {
          id: string;
          journal_entry_id: string;
          account_id: string;
          debit: number;
          credit: number;
        };
        Insert: {
          id?: string;
          journal_entry_id: string;
          account_id: string;
          debit?: number;
          credit?: number;
        };
        Update: {
          id?: string;
          journal_entry_id?: string;
          account_id?: string;
          debit?: number;
          credit?: number;
        };
      };
      app_state: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
      };
    };
  };
};
