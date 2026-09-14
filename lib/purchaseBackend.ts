"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type SupplierRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  active: boolean;
};

export type PurchaseInventoryItem = {
  id: string;
  name: string;
  unit: string;
  unitCost: number | null;
};

export type PurchaseReceiptItem = {
  id: string;
  receiptId: string;
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type PurchaseReceiptRecord = {
  id: string;
  supplierId: string | null;
  invoiceReference: string;
  note: string;
  totalAmount: number;
  currency: string;
  status: "draft" | "received" | "voided";
  financialEntryId: string | null;
  receivedAt: string | null;
  createdAt: string;
};

export type PurchaseSnapshot = {
  suppliers: SupplierRecord[];
  inventoryItems: PurchaseInventoryItem[];
  receipts: PurchaseReceiptRecord[];
  receiptItems: PurchaseReceiptItem[];
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) throw new Error("Active production property is missing.");
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

export async function loadPurchaseSnapshot(context: WorkspaceContext): Promise<PurchaseSnapshot> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const [supplierResult, inventoryResult, receiptResult] = await Promise.all([
    client.from("suppliers").select("id,name,phone,email,note,active").eq("organization_id", organizationId).order("name", { ascending: true }),
    client.from("inventory_items").select("id,name,unit,unit_cost").eq("organization_id", organizationId).eq("property_id", propertyId).eq("active", true).order("name", { ascending: true }),
    client.from("purchase_receipts").select("id,supplier_id,invoice_reference,note,total_amount,currency,status,financial_entry_id,received_at,created_at").eq("organization_id", organizationId).eq("property_id", propertyId).order("created_at", { ascending: false }).limit(100),
  ]);
  if (supplierResult.error) throw new Error(`${supplierResult.error.message}. Apply Supabase migration 014 to enable supplier purchasing.`);
  if (inventoryResult.error) throw new Error(inventoryResult.error.message);
  if (receiptResult.error) throw new Error(`${receiptResult.error.message}. Apply Supabase migration 014 to enable supplier purchasing.`);

  const receipts = (receiptResult.data || []).map((row) => mapReceipt(row as Record<string, unknown>));
  let receiptItems: PurchaseReceiptItem[] = [];
  if (receipts.length > 0) {
    const { data, error } = await client
      .from("purchase_receipt_items")
      .select("id,purchase_receipt_id,inventory_item_id,quantity,unit_cost,line_total")
      .in("purchase_receipt_id", receipts.map((receipt) => receipt.id));
    if (error) throw new Error(error.message);
    receiptItems = (data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        id: String(raw.id),
        receiptId: String(raw.purchase_receipt_id),
        inventoryItemId: String(raw.inventory_item_id),
        quantity: Number(raw.quantity || 0),
        unitCost: Number(raw.unit_cost || 0),
        lineTotal: Number(raw.line_total || 0),
      };
    });
  }

  return {
    suppliers: (supplierResult.data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        id: String(raw.id),
        name: String(raw.name || "Supplier"),
        phone: String(raw.phone || ""),
        email: String(raw.email || ""),
        note: String(raw.note || ""),
        active: Boolean(raw.active),
      };
    }),
    inventoryItems: (inventoryResult.data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        id: String(raw.id),
        name: String(raw.name || "Ingredient"),
        unit: String(raw.unit || "unit"),
        unitCost: raw.unit_cost === null || raw.unit_cost === undefined ? null : Number(raw.unit_cost),
      };
    }),
    receipts,
    receiptItems,
  };
}

export async function createSupplier(context: WorkspaceContext, input: { name: string; phone?: string; email?: string; note?: string }) {
  const { client } = requireWorkspace(context);
  const { data, error } = await client.rpc("create_supplier", {
    p_name: input.name.trim(),
    p_phone: input.phone?.trim() || "",
    p_email: input.email?.trim() || "",
    p_note: input.note?.trim() || "",
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function createPurchaseReceipt(context: WorkspaceContext, input: {
  supplierId?: string | null;
  invoiceReference?: string;
  note?: string;
  items: Array<{ inventoryItemId: string; quantity: number; unitCost: number }>;
}) {
  const { client, propertyId } = requireWorkspace(context);
  const items = input.items.filter((item) => item.quantity > 0 && item.unitCost >= 0).map((item) => ({
    inventory_item_id: item.inventoryItemId,
    quantity: item.quantity,
    unit_cost: item.unitCost,
  }));
  if (items.length === 0) throw new Error("Add at least one inventory item to the purchase.");
  const { data, error } = await client.rpc("create_purchase_receipt", {
    p_property_id: propertyId,
    p_supplier_id: input.supplierId || null,
    p_invoice_reference: input.invoiceReference?.trim() || "",
    p_note: input.note?.trim() || "",
    p_items: items,
  });
  if (error) throw new Error(error.message);
  return String(data);
}

export async function receivePurchaseReceipt(context: WorkspaceContext, receiptId: string) {
  const { client } = requireWorkspace(context);
  const { data, error } = await client.rpc("receive_purchase_receipt", { p_purchase_receipt_id: receiptId });
  if (error) throw new Error(error.message);
  return data;
}

export async function voidPurchaseReceipt(context: WorkspaceContext, receiptId: string) {
  const { client } = requireWorkspace(context);
  const { error } = await client.rpc("void_purchase_receipt", { p_purchase_receipt_id: receiptId });
  if (error) throw new Error(error.message);
}

function mapReceipt(raw: Record<string, unknown>): PurchaseReceiptRecord {
  return {
    id: String(raw.id),
    supplierId: raw.supplier_id ? String(raw.supplier_id) : null,
    invoiceReference: String(raw.invoice_reference || ""),
    note: String(raw.note || ""),
    totalAmount: Number(raw.total_amount || 0),
    currency: String(raw.currency || "INR"),
    status: String(raw.status || "draft") as PurchaseReceiptRecord["status"],
    financialEntryId: raw.financial_entry_id ? String(raw.financial_entry_id) : null,
    receivedAt: raw.received_at ? String(raw.received_at) : null,
    createdAt: String(raw.created_at || ""),
  };
}
