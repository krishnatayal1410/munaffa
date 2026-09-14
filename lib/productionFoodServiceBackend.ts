"use client";

import { getSupabaseBrowserClient } from "./supabase";
import type { WorkspaceContext } from "./workspaceBackend";

export type FoodServiceType = "dine_in" | "room_service" | "counter" | "takeaway" | "delivery" | "other";
export type FoodOrderStatus = "new" | "accepted" | "preparing" | "ready" | "served" | "completed" | "cancelled";

export type MenuCategoryRecord = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type MenuItemRecord = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string;
  price: number;
  currency: string;
  active: boolean;
};

export type RecipeIngredientRecord = {
  menuItemId: string;
  inventoryItemId: string;
  quantityPerItem: number;
};

export type FoodIngredientRecord = {
  id: string;
  name: string;
  unit: string;
  unitCost: number | null;
};

export type FoodOrderItemRecord = {
  id: string;
  menuItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type FoodOrderRecord = {
  id: string;
  serviceType: FoodServiceType;
  serviceReference: string;
  notes: string;
  status: FoodOrderStatus;
  subtotal: number;
  currency: string;
  completedAt: string | null;
  createdAt: string;
  items: FoodOrderItemRecord[];
};

export type FoodServiceSnapshot = {
  categories: MenuCategoryRecord[];
  menuItems: MenuItemRecord[];
  recipeLines: RecipeIngredientRecord[];
  ingredients: FoodIngredientRecord[];
};

function requireWorkspace(context: WorkspaceContext) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  if (!context.organizationId || !context.propertyId) {
    throw new Error("Food service is not initialized. Apply Supabase migrations through 010, then sign in again.");
  }
  return { client, organizationId: context.organizationId, propertyId: context.propertyId };
}

export async function loadFoodServiceSnapshot(context: WorkspaceContext): Promise<FoodServiceSnapshot> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const [categoryResult, itemResult, ingredientResult] = await Promise.all([
    client
      .from("menu_categories")
      .select("id,name,sort_order,active")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    client
      .from("menu_items")
      .select("id,category_id,name,description,price,currency,active")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .order("name", { ascending: true }),
    client
      .from("inventory_items")
      .select("id,name,unit,unit_cost")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  if (categoryResult.error) throw new Error(categoryResult.error.message);
  if (itemResult.error) throw new Error(itemResult.error.message);
  if (ingredientResult.error) throw new Error(ingredientResult.error.message);

  const menuItems = (itemResult.data || []).map((row) => {
    const raw = row as Record<string, unknown>;
    return {
      id: String(raw.id),
      categoryId: raw.category_id ? String(raw.category_id) : null,
      name: String(raw.name || "Unnamed item"),
      description: String(raw.description || ""),
      price: Number(raw.price || 0),
      currency: String(raw.currency || "INR"),
      active: Boolean(raw.active),
    } satisfies MenuItemRecord;
  });

  let recipeLines: RecipeIngredientRecord[] = [];
  if (menuItems.length > 0) {
    const { data, error } = await client
      .from("recipe_lines")
      .select("menu_item_id,inventory_item_id,quantity_per_item")
      .in("menu_item_id", menuItems.map((item) => item.id));
    if (error) throw new Error(error.message);
    recipeLines = (data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        menuItemId: String(raw.menu_item_id),
        inventoryItemId: String(raw.inventory_item_id),
        quantityPerItem: Number(raw.quantity_per_item || 0),
      };
    });
  }

  return {
    categories: (categoryResult.data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        id: String(raw.id),
        name: String(raw.name || "Category"),
        sortOrder: Number(raw.sort_order || 0),
        active: Boolean(raw.active),
      };
    }),
    menuItems,
    recipeLines,
    ingredients: (ingredientResult.data || []).map((row) => {
      const raw = row as Record<string, unknown>;
      return {
        id: String(raw.id),
        name: String(raw.name || "Ingredient"),
        unit: String(raw.unit || "unit"),
        unitCost: raw.unit_cost === null || raw.unit_cost === undefined ? null : Number(raw.unit_cost),
      };
    }),
  };
}

export async function createMenuCategory(context: WorkspaceContext, input: { name: string; sortOrder?: number }) {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const name = input.name.trim();
  if (!name || name.length > 80) throw new Error("Category name must be between 1 and 80 characters.");
  const { error } = await client.from("menu_categories").insert({
    organization_id: organizationId,
    property_id: propertyId,
    name,
    sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
  });
  if (error) throw new Error(error.message);
}

export async function createMenuItem(context: WorkspaceContext, input: {
  categoryId?: string | null;
  name: string;
  description?: string;
  price: number;
}) {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const name = input.name.trim();
  if (!name || name.length > 160) throw new Error("Menu item name must be between 1 and 160 characters.");
  if (!Number.isFinite(input.price) || input.price < 0) throw new Error("Menu price must be zero or greater.");
  const { error } = await client.from("menu_items").insert({
    organization_id: organizationId,
    property_id: propertyId,
    category_id: input.categoryId || null,
    name,
    description: input.description?.trim().slice(0, 1000) || "",
    price: input.price,
    currency: "INR",
  });
  if (error) throw new Error(error.message);
}

export async function setMenuItemActive(context: WorkspaceContext, menuItemId: string, active: boolean) {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const { error } = await client
    .from("menu_items")
    .update({ active })
    .eq("id", menuItemId)
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId);
  if (error) throw new Error(error.message);
}

export async function upsertRecipeIngredient(context: WorkspaceContext, input: {
  menuItemId: string;
  inventoryItemId: string;
  quantityPerItem: number;
}) {
  requireWorkspace(context);
  if (!Number.isFinite(input.quantityPerItem) || input.quantityPerItem <= 0) {
    throw new Error("Recipe quantity must be greater than zero.");
  }
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  const { error } = await client.from("recipe_lines").upsert({
    menu_item_id: input.menuItemId,
    inventory_item_id: input.inventoryItemId,
    quantity_per_item: input.quantityPerItem,
  }, { onConflict: "menu_item_id,inventory_item_id" });
  if (error) throw new Error(error.message);
}

export async function removeRecipeIngredient(context: WorkspaceContext, menuItemId: string, inventoryItemId: string) {
  requireWorkspace(context);
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Production backend is not configured.");
  const { error } = await client
    .from("recipe_lines")
    .delete()
    .eq("menu_item_id", menuItemId)
    .eq("inventory_item_id", inventoryItemId);
  if (error) throw new Error(error.message);
}

export async function listFoodOrders(context: WorkspaceContext): Promise<FoodOrderRecord[]> {
  const { client, organizationId, propertyId } = requireWorkspace(context);
  const { data: orders, error: orderError } = await client
    .from("orders")
    .select("id,service_type,service_reference,notes,status,subtotal,currency,completed_at,created_at")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (orderError) throw new Error(orderError.message);
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((row) => String((row as Record<string, unknown>).id));
  const { data: items, error: itemError } = await client
    .from("order_items")
    .select("id,order_id,menu_item_id,item_name,quantity,unit_price,line_total")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });
  if (itemError) throw new Error(itemError.message);

  const byOrder = new Map<string, FoodOrderItemRecord[]>();
  for (const row of items || []) {
    const raw = row as Record<string, unknown>;
    const orderId = String(raw.order_id);
    const list = byOrder.get(orderId) || [];
    list.push({
      id: String(raw.id),
      menuItemId: String(raw.menu_item_id),
      itemName: String(raw.item_name || "Item"),
      quantity: Number(raw.quantity || 0),
      unitPrice: Number(raw.unit_price || 0),
      lineTotal: Number(raw.line_total || 0),
    });
    byOrder.set(orderId, list);
  }

  return orders.map((row) => {
    const raw = row as Record<string, unknown>;
    const id = String(raw.id);
    return {
      id,
      serviceType: String(raw.service_type || "other") as FoodServiceType,
      serviceReference: String(raw.service_reference || ""),
      notes: String(raw.notes || ""),
      status: String(raw.status || "new") as FoodOrderStatus,
      subtotal: Number(raw.subtotal || 0),
      currency: String(raw.currency || "INR"),
      completedAt: raw.completed_at ? String(raw.completed_at) : null,
      createdAt: String(raw.created_at || ""),
      items: byOrder.get(id) || [],
    };
  });
}

export async function createFoodOrder(context: WorkspaceContext, input: {
  serviceType: FoodServiceType;
  serviceReference?: string;
  notes?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}) {
  const { client, propertyId } = requireWorkspace(context);
  const items = input.items
    .filter((item) => item.quantity > 0)
    .map((item) => ({ menu_item_id: item.menuItemId, quantity: Math.trunc(item.quantity) }));
  if (items.length === 0) throw new Error("Add at least one menu item to the order.");
  const { data, error } = await client.rpc("create_staff_order", {
    p_property_id: propertyId,
    p_service_type: input.serviceType,
    p_service_reference: input.serviceReference?.trim() || "",
    p_notes: input.notes?.trim() || "",
    p_items: items,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function setFoodOrderStatus(context: WorkspaceContext, orderId: string, status: Exclude<FoodOrderStatus, "new">) {
  const { client } = requireWorkspace(context);
  const { data, error } = await client.rpc("set_staff_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  return data;
}
