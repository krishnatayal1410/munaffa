"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type ProductionInventoryRecord = {
  id: string;
  name: string;
  unit: string;
  openingTheoreticalQuantity: number;
  movementDelta: number;
  theoreticalQuantity: number;
  reorderQuantity: number;
  unitCost: number | null;
  physicalQuantity: number | null;
  countedAt: string | null;
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) {
    throw new Error("Production inventory is not initialized. Apply Supabase migrations through 010, then sign in again.");
  }
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

export async function listProductionInventory(context: WorkspaceContext): Promise<ProductionInventoryRecord[]> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const [itemResult, countResult, movementResult] = await Promise.all([
    client
      .from("inventory_items")
      .select("id,name,unit,theoretical_quantity,reorder_quantity,unit_cost")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .eq("active", true)
      .order("name", { ascending: true }),
    client
      .from("inventory_counts")
      .select("inventory_item_id,physical_quantity,counted_at")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .order("counted_at", { ascending: false })
      .limit(500),
    client
      .from("inventory_movements")
      .select("inventory_item_id,quantity_delta")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .limit(5000),
  ]);
  if (itemResult.error) throw new Error(itemResult.error.message);
  if (countResult.error) throw new Error(countResult.error.message);
  if (movementResult.error) throw new Error(`${movementResult.error.message}. Apply Supabase migration 010 to enable theoretical usage movements.`);

  const latest = new Map<string, { quantity: number; countedAt: string }>();
  for (const count of countResult.data || []) {
    const raw = count as Record<string, unknown>;
    const id = String(raw.inventory_item_id || "");
    if (!id || latest.has(id)) continue;
    latest.set(id, {
      quantity: Number(raw.physical_quantity || 0),
      countedAt: String(raw.counted_at || ""),
    });
  }

  const movementTotals = new Map<string, number>();
  for (const movement of movementResult.data || []) {
    const raw = movement as Record<string, unknown>;
    const id = String(raw.inventory_item_id || "");
    if (!id) continue;
    movementTotals.set(id, (movementTotals.get(id) || 0) + Number(raw.quantity_delta || 0));
  }

  return (itemResult.data || []).map((item) => {
    const raw = item as Record<string, unknown>;
    const id = String(raw.id);
    const count = latest.get(id);
    const openingTheoreticalQuantity = Number(raw.theoretical_quantity || 0);
    const movementDelta = Number((movementTotals.get(id) || 0).toFixed(3));
    return {
      id,
      name: String(raw.name || "Unnamed item"),
      unit: String(raw.unit || "unit"),
      openingTheoreticalQuantity,
      movementDelta,
      theoreticalQuantity: Number((openingTheoreticalQuantity + movementDelta).toFixed(3)),
      reorderQuantity: Number(raw.reorder_quantity || 0),
      unitCost: raw.unit_cost === null || raw.unit_cost === undefined ? null : Number(raw.unit_cost),
      physicalQuantity: count?.quantity ?? null,
      countedAt: count?.countedAt || null,
    };
  });
}

export async function createProductionInventoryItem(context: WorkspaceContext, input: {
  name: string;
  unit: string;
  theoreticalQuantity: number;
  reorderQuantity: number;
  unitCost?: number | null;
}): Promise<void> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const name = input.name.trim();
  const unit = input.unit.trim();
  if (!name || name.length > 160) throw new Error("Inventory name must be between 1 and 160 characters.");
  if (!unit || unit.length > 24) throw new Error("Unit must be between 1 and 24 characters.");
  if (input.theoreticalQuantity < 0 || input.reorderQuantity < 0) throw new Error("Inventory quantities cannot be negative.");

  const { error } = await client.from("inventory_items").insert({
    organization_id: organizationId,
    property_id: propertyId,
    name,
    unit,
    theoretical_quantity: input.theoreticalQuantity,
    reorder_quantity: input.reorderQuantity,
    unit_cost: input.unitCost ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function addProductionInventoryCount(context: WorkspaceContext, inventoryItemId: string, physicalQuantity: number, note = ""): Promise<void> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  if (!Number.isFinite(physicalQuantity) || physicalQuantity < 0) throw new Error("Physical quantity must be zero or greater.");

  const { error } = await client.from("inventory_counts").insert({
    organization_id: organizationId,
    property_id: propertyId,
    inventory_item_id: inventoryItemId,
    physical_quantity: physicalQuantity,
    note: note.trim().slice(0, 500),
  });
  if (error) throw new Error(error.message);
}
