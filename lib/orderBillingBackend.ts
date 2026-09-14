"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type BillStatus = "open" | "partially_paid" | "paid" | "voided";
export type PaymentMethod = "cash" | "card" | "upi" | "bank" | "other";
export type PaymentStatus = "captured" | "voided";

export type BillableOrder = {
  id: string;
  serviceReference: string;
  serviceType: string;
  status: string;
  subtotal: number;
  createdAt: string;
};

export type OrderBill = {
  id: string;
  orderId: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: BillStatus;
  paidAt: string | null;
  createdAt: string;
};

export type OrderPayment = {
  id: string;
  billId: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  financialEntryId: string | null;
  createdAt: string;
};

export type BillingSnapshot = {
  orders: BillableOrder[];
  bills: OrderBill[];
  payments: OrderPayment[];
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) throw new Error("Active production property is missing.");
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

export async function loadBillingSnapshot(context: WorkspaceContext): Promise<BillingSnapshot> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const [orderResult, billResult] = await Promise.all([
    client
      .from("orders")
      .select("id,service_reference,service_type,status,subtotal,created_at")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("order_bills")
      .select("id,order_id,subtotal,tax_amount,service_charge_amount,discount_amount,total_amount,status,paid_at,created_at")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (orderResult.error) throw new Error(orderResult.error.message);
  if (billResult.error) throw new Error(`${billResult.error.message}. Apply Supabase migration 013 to enable order billing.`);

  const bills = (billResult.data || []).map((row) => mapBill(row as Record<string, unknown>));
  let payments: OrderPayment[] = [];
  if (bills.length > 0) {
    const { data, error } = await client
      .from("order_payments")
      .select("id,bill_id,order_id,amount,method,reference,status,financial_entry_id,created_at")
      .in("bill_id", bills.map((bill) => bill.id))
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    payments = (data || []).map((row) => mapPayment(row as Record<string, unknown>));
  }

  return {
    orders: (orderResult.data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        id: String(raw.id),
        serviceReference: String(raw.service_reference || ""),
        serviceType: String(raw.service_type || "other"),
        status: String(raw.status || "new"),
        subtotal: Number(raw.subtotal || 0),
        createdAt: String(raw.created_at || ""),
      };
    }),
    bills,
    payments,
  };
}

export async function saveOrderBill(context: WorkspaceContext, input: {
  orderId: string;
  taxAmount: number;
  serviceChargeAmount: number;
  discountAmount: number;
}): Promise<OrderBill> {
  const { client } = requireWorkspace(context);
  const { data, error } = await client.rpc("upsert_order_bill", {
    p_order_id: input.orderId,
    p_tax_amount: input.taxAmount,
    p_service_charge_amount: input.serviceChargeAmount,
    p_discount_amount: input.discountAmount,
  });
  if (error) throw new Error(error.message);
  return mapBill(data as Record<string, unknown>);
}

export async function recordOrderPayment(context: WorkspaceContext, input: {
  billId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
}) {
  const { client } = requireWorkspace(context);
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Payment amount must be greater than zero.");
  const { data, error } = await client.rpc("record_order_payment", {
    p_bill_id: input.billId,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference?.trim() || "",
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function voidOrderPayment(context: WorkspaceContext, paymentId: string) {
  const { client } = requireWorkspace(context);
  const { error } = await client.rpc("void_order_payment", { p_payment_id: paymentId });
  if (error) throw new Error(error.message);
}

export async function voidOrderBill(context: WorkspaceContext, billId: string) {
  const { client } = requireWorkspace(context);
  const { error } = await client.rpc("void_order_bill", { p_bill_id: billId });
  if (error) throw new Error(error.message);
}

function mapBill(raw: Record<string, unknown>): OrderBill {
  return {
    id: String(raw.id),
    orderId: String(raw.order_id),
    subtotal: Number(raw.subtotal || 0),
    taxAmount: Number(raw.tax_amount || 0),
    serviceChargeAmount: Number(raw.service_charge_amount || 0),
    discountAmount: Number(raw.discount_amount || 0),
    totalAmount: Number(raw.total_amount || 0),
    status: String(raw.status || "open") as BillStatus,
    paidAt: raw.paid_at ? String(raw.paid_at) : null,
    createdAt: String(raw.created_at || ""),
  };
}

function mapPayment(raw: Record<string, unknown>): OrderPayment {
  return {
    id: String(raw.id),
    billId: String(raw.bill_id),
    orderId: String(raw.order_id),
    amount: Number(raw.amount || 0),
    method: String(raw.method || "other") as PaymentMethod,
    reference: String(raw.reference || ""),
    status: String(raw.status || "captured") as PaymentStatus,
    financialEntryId: raw.financial_entry_id ? String(raw.financial_entry_id) : null,
    createdAt: String(raw.created_at || ""),
  };
}
