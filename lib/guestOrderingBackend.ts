"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type OrderingPointServiceType = "dine_in" | "room_service" | "counter" | "takeaway" | "other";

export type OrderingPointRecord = {
  id: string;
  label: string;
  serviceType: OrderingPointServiceType;
  active: boolean;
  maxOpenOrders: number;
  createdAt: string;
};

export type CreatedOrderingPoint = OrderingPointRecord & { token: string };

export type GuestMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
};

export type GuestMenuCategory = {
  id: string | null;
  name: string;
  items: GuestMenuItem[];
};

export type GuestOrderingView = {
  businessName: string;
  propertyName: string;
  orderingLabel: string;
  serviceType: OrderingPointServiceType;
  menu: GuestMenuCategory[];
};

export type GuestOrderReceipt = {
  orderId: string;
  status: string;
  lineCount: number;
  subtotal: number;
  currency: string;
};

function requireProductionClient() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production ordering is not configured on this deployment.");
  return client;
}

function requireWorkspace(context: WorkspaceContext) {
  const client = requireProductionClient();
  if (!context.organizationId || !context.propertyId) throw new Error("Active production property is missing.");
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

export async function listOrderingPoints(context: WorkspaceContext): Promise<OrderingPointRecord[]> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const { data, error } = await client
    .from("ordering_points")
    .select("id,label,service_type,active,max_open_orders,created_at")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`${error.message}. Apply Supabase migration 011 to enable guest QR ordering.`);
  return (data || []).map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      id: String(raw.id),
      label: String(raw.label || "Ordering point"),
      serviceType: String(raw.service_type || "other") as OrderingPointServiceType,
      active: Boolean(raw.active),
      maxOpenOrders: Number(raw.max_open_orders || 5),
      createdAt: String(raw.created_at || ""),
    };
  });
}

export async function createOrderingPoint(context: WorkspaceContext, input: {
  label: string;
  serviceType: OrderingPointServiceType;
  maxOpenOrders: number;
}): Promise<CreatedOrderingPoint> {
  const { client, propertyId } = requireWorkspace(context);
  const label = input.label.trim();
  if (!label || label.length > 120) throw new Error("Ordering-point label must be between 1 and 120 characters.");
  const { data, error } = await client.rpc("create_ordering_point", {
    p_property_id: propertyId,
    p_label: label,
    p_service_type: input.serviceType,
    p_max_open_orders: input.maxOpenOrders,
  });
  if (error) throw new Error(error.message);
  const raw = data as Record<string, unknown>;
  return {
    id: String(raw.id),
    token: String(raw.token),
    label: String(raw.label || label),
    serviceType: String(raw.service_type || input.serviceType) as OrderingPointServiceType,
    active: true,
    maxOpenOrders: Number(raw.max_open_orders || input.maxOpenOrders),
    createdAt: new Date().toISOString(),
  };
}

export async function setOrderingPointActive(context: WorkspaceContext, orderingPointId: string, active: boolean) {
  const { client } = requireWorkspace(context);
  const { error } = await client.rpc("set_ordering_point_active", {
    p_ordering_point_id: orderingPointId,
    p_active: active,
  });
  if (error) throw new Error(error.message);
}

export async function resolveGuestOrderingPoint(token: string): Promise<GuestOrderingView> {
  const client = requireProductionClient();
  const { data, error } = await client.rpc("resolve_guest_ordering_point", { p_token: token });
  if (error) throw new Error(error.message);
  const raw = data as Record<string, unknown>;
  const menu = Array.isArray(raw.menu) ? raw.menu : [];
  return {
    businessName: String(raw.business_name || "Munaffa Hospitality"),
    propertyName: String(raw.property_name || "Property"),
    orderingLabel: String(raw.ordering_label || "Order here"),
    serviceType: String(raw.service_type || "other") as OrderingPointServiceType,
    menu: menu.map((category) => {
      const record = category as Record<string, unknown>;
      const items = Array.isArray(record.items) ? record.items : [];
      return {
        id: record.id ? String(record.id) : null,
        name: String(record.name || "Menu"),
        items: items.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            id: String(row.id),
            name: String(row.name || "Item"),
            description: String(row.description || ""),
            price: Number(row.price || 0),
            currency: String(row.currency || "INR"),
          };
        }),
      };
    }),
  };
}

export async function submitGuestOrder(token: string, input: {
  notes?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}): Promise<GuestOrderReceipt> {
  const client = requireProductionClient();
  const payload = input.items.filter((item) => item.quantity > 0).map((item) => ({
    menu_item_id: item.menuItemId,
    quantity: Math.min(20, Math.max(1, Math.trunc(item.quantity))),
  }));
  if (payload.length === 0) throw new Error("Add at least one item before placing the order.");
  const { data, error } = await client.rpc("create_guest_order", {
    p_token: token,
    p_notes: input.notes?.trim() || "",
    p_items: payload,
  });
  if (error) throw new Error(error.message);
  const raw = data as Record<string, unknown>;
  return {
    orderId: String(raw.order_id),
    status: String(raw.status || "new"),
    lineCount: Number(raw.line_count || payload.length),
    subtotal: Number(raw.subtotal || 0),
    currency: String(raw.currency || "INR"),
  };
}
