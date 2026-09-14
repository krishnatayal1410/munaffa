"use client";

import { ChefHat, CircleAlert, ClipboardList, Minus, Plus, RefreshCw, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFoodOrder,
  createMenuCategory,
  createMenuItem,
  listFoodOrders,
  loadFoodServiceSnapshot,
  removeRecipeIngredient,
  setFoodOrderStatus,
  setMenuItemActive,
  upsertRecipeIngredient,
  type FoodOrderRecord,
  type FoodOrderStatus,
  type FoodServiceSnapshot,
  type FoodServiceType,
} from "@/lib/productionFoodServiceBackend";
import type { WorkspaceContext } from "@/lib/workspaceBackend";

type Tab = "orders" | "menu" | "recipes";

const serviceLabels: Record<FoodServiceType, string> = {
  dine_in: "Dine in",
  room_service: "Room service",
  counter: "Counter",
  takeaway: "Takeaway",
  delivery: "Delivery",
  other: "Other",
};

const statusLabels: Record<FoodOrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function ProductionFoodServiceWorkspace({ workspace }: { workspace: WorkspaceContext }) {
  const [tab, setTab] = useState<Tab>("orders");
  const [snapshot, setSnapshot] = useState<FoodServiceSnapshot>({ categories: [], menuItems: [], recipeLines: [], ingredients: [] });
  const [orders, setOrders] = useState<FoodOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState(0);
  const [itemCategoryId, setItemCategoryId] = useState("");

  const [recipeMenuItemId, setRecipeMenuItemId] = useState("");
  const [recipeIngredientId, setRecipeIngredientId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState(0.1);

  const [serviceType, setServiceType] = useState<FoodServiceType>("dine_in");
  const [serviceReference, setServiceReference] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const canManageMenu = ["owner", "manager"].includes(workspace.authorizationRole);
  const canManageRecipes = ["owner", "manager", "kitchen", "inventory"].includes(workspace.authorizationRole);
  const canCreateOrder = ["owner", "manager", "front-desk", "cashier", "waiter", "kitchen"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextSnapshot, nextOrders] = await Promise.all([
        loadFoodServiceSnapshot(workspace),
        listFoodOrders(workspace),
      ]);
      setSnapshot(nextSnapshot);
      setOrders(nextOrders);
      if (!recipeMenuItemId && nextSnapshot.menuItems[0]) setRecipeMenuItemId(nextSnapshot.menuItems[0].id);
      if (!recipeIngredientId && nextSnapshot.ingredients[0]) setRecipeIngredientId(nextSnapshot.ingredients[0].id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load food-service records.");
    } finally {
      setLoading(false);
    }
  }, [recipeIngredientId, recipeMenuItemId, workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeMenuItems = useMemo(() => snapshot.menuItems.filter((item) => item.active), [snapshot.menuItems]);
  const recipeItemIds = useMemo(() => new Set(snapshot.recipeLines.map((line) => line.menuItemId)), [snapshot.recipeLines]);
  const openOrders = useMemo(() => orders.filter((order) => !["completed", "cancelled"].includes(order.status)), [orders]);
  const selectedRecipeLines = useMemo(() => snapshot.recipeLines.filter((line) => line.menuItemId === recipeMenuItemId), [recipeMenuItemId, snapshot.recipeLines]);
  const ingredientById = useMemo(() => new Map(snapshot.ingredients.map((item) => [item.id, item])), [snapshot.ingredients]);
  const menuById = useMemo(() => new Map(snapshot.menuItems.map((item) => [item.id, item])), [snapshot.menuItems]);

  const selectedRecipeCost = useMemo(() => selectedRecipeLines.reduce((total, line) => {
    const ingredient = ingredientById.get(line.inventoryItemId);
    return ingredient?.unitCost === null || ingredient?.unitCost === undefined ? total : total + line.quantityPerItem * ingredient.unitCost;
  }, 0), [ingredientById, selectedRecipeLines]);

  const cartTotal = useMemo(() => Object.entries(cart).reduce((total, [id, quantity]) => {
    const item = menuById.get(id);
    return total + (item?.price || 0) * quantity;
  }, 0), [cart, menuById]);

  async function runMutation(action: () => Promise<unknown>, fallback: string) {
    setSaving(true);
    setError("");
    try {
      await action();
      await refresh();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : fallback);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    if (!categoryName.trim()) return;
    const ok = await runMutation(() => createMenuCategory(workspace, { name: categoryName }), "Could not create category.");
    if (ok) setCategoryName("");
  }

  async function addMenuItem() {
    if (!itemName.trim()) return;
    const ok = await runMutation(() => createMenuItem(workspace, {
      name: itemName,
      description: itemDescription,
      price: itemPrice,
      categoryId: itemCategoryId || null,
    }), "Could not create menu item.");
    if (ok) {
      setItemName(""); setItemDescription(""); setItemPrice(0); setItemCategoryId("");
    }
  }

  async function addRecipeLine() {
    if (!recipeMenuItemId || !recipeIngredientId) return;
    await runMutation(() => upsertRecipeIngredient(workspace, {
      menuItemId: recipeMenuItemId,
      inventoryItemId: recipeIngredientId,
      quantityPerItem: recipeQuantity,
    }), "Could not save recipe ingredient.");
  }

  async function createOrder() {
    const items = Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) return;
    const ok = await runMutation(() => createFoodOrder(workspace, { serviceType, serviceReference, notes: orderNotes, items }), "Could not create order.");
    if (ok) { setCart({}); setServiceReference(""); setOrderNotes(""); setTab("orders"); }
  }

  async function moveOrder(order: FoodOrderRecord, status: Exclude<FoodOrderStatus, "new">) {
    setUpdatingOrderId(order.id);
    setError("");
    try {
      await setFoodOrderStatus(workspace, order.id, status);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return <div className="module-page interactive-workspace food-service-workspace">
    <div className="module-heading"><UtensilsCrossed size={24}/><div><span className="kicker">Production F&B</span><h2>Menu, recipes and service in one operating loop.</h2><p>Completed orders create theoretical ingredient usage from recipes. Physical counts stay independent so Munaffa can surface variance without pretending every gram was measured at the plate.</p></div></div>

    <div className="workspace-kpis food-kpis"><Kpi label="Active menu items" value={String(activeMenuItems.length)}/><Kpi label="Recipe coverage" value={`${recipeItemIds.size}/${snapshot.menuItems.length}`}/><Kpi label="Open orders" value={String(openOrders.length)} warning={openOrders.length > 0}/><Kpi label="Current cart" value={formatMoney(cartTotal)}/></div>

    <div className="food-toolbar"><div className="food-tabs"><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><ClipboardList size={14}/>Orders / KDS</button><button className={tab === "menu" ? "active" : ""} onClick={() => setTab("menu")}><UtensilsCrossed size={14}/>Menu</button><button className={tab === "recipes" ? "active" : ""} onClick={() => setTab("recipes")}><ChefHat size={14}/>Recipes</button></div><button className="food-refresh" disabled={loading} onClick={() => void refresh()}><RefreshCw size={14}/>Refresh</button></div>

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    {tab === "menu" && <div className="food-two-column">
      <section className="food-panel"><header><div><small>Menu catalogue</small><h3>What guests can order</h3></div></header>{loading ? <div className="team-empty">Loading menu…</div> : snapshot.menuItems.length === 0 ? <div className="team-empty">No production menu items yet.</div> : <div className="food-menu-list">{snapshot.menuItems.map((item) => <article key={item.id} className={!item.active ? "inactive" : ""}><div><small>{snapshot.categories.find((category) => category.id === item.categoryId)?.name || "Uncategorized"}</small><b>{item.name}</b><span>{item.description || "No description"}</span></div><div><strong>{formatMoney(item.price)}</strong>{canManageMenu && <button disabled={saving} onClick={() => void runMutation(() => setMenuItemActive(workspace, item.id, !item.active), "Could not update menu item.")}>{item.active ? "Pause" : "Activate"}</button>}</div></article>)}</div>}</section>
      <section className="food-panel food-form-panel"><header><div><small>Menu setup</small><h3>Add categories and items</h3></div></header>{canManageMenu ? <><div className="food-inline-form"><input value={categoryName} maxLength={80} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category e.g. Starters"/><button disabled={saving || !categoryName.trim()} onClick={() => void addCategory()}><Plus size={13}/>Category</button></div><label>Category<select value={itemCategoryId} onChange={(event) => setItemCategoryId(event.target.value)}><option value="">Uncategorized</option>{snapshot.categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Item name<input value={itemName} maxLength={160} onChange={(event) => setItemName(event.target.value)} placeholder="Paneer Tikka"/></label><label>Description<textarea value={itemDescription} maxLength={1000} onChange={(event) => setItemDescription(event.target.value)} placeholder="Optional guest-facing description"/></label><label>Price (INR)<input type="number" min="0" step="0.01" value={itemPrice} onChange={(event) => setItemPrice(Math.max(0, Number(event.target.value)))}/></label><button className="primary-action food-primary" disabled={saving || !itemName.trim()} onClick={() => void addMenuItem()}><Plus size={14}/>Add menu item</button></> : <div className="settings-lock">Your role can view the menu but only owners and managers can change the menu catalogue.</div>}</section>
    </div>}

    {tab === "recipes" && <div className="food-two-column">
      <section className="food-panel"><header><div><small>Recipe costing</small><h3>Ingredient consumption per sold item</h3></div></header><label>Menu item<select value={recipeMenuItemId} onChange={(event) => setRecipeMenuItemId(event.target.value)}><option value="">Select menu item</option>{snapshot.menuItems.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>{recipeMenuItemId && <div className="recipe-summary"><span><small>Selling price</small><b>{formatMoney(menuById.get(recipeMenuItemId)?.price || 0)}</b></span><span><small>Known recipe cost</small><b>{formatMoney(selectedRecipeCost)}</b></span><span><small>Known contribution</small><b>{formatMoney((menuById.get(recipeMenuItemId)?.price || 0) - selectedRecipeCost)}</b></span></div>}{selectedRecipeLines.length === 0 ? <div className="team-empty">No recipe ingredients yet.</div> : <div className="recipe-lines">{selectedRecipeLines.map((line) => { const ingredient = ingredientById.get(line.inventoryItemId); return <article key={line.inventoryItemId}><div><b>{ingredient?.name || "Ingredient"}</b><small>{line.quantityPerItem}{ingredient?.unit || "unit"} per sold item{ingredient?.unitCost !== null && ingredient?.unitCost !== undefined ? ` · ${formatMoney(line.quantityPerItem * ingredient.unitCost)}` : " · unit cost not recorded"}</small></div>{canManageRecipes && <button onClick={() => void runMutation(() => removeRecipeIngredient(workspace, line.menuItemId, line.inventoryItemId), "Could not remove recipe line.")}><Minus size={13}/>Remove</button>}</article>; })}</div>}</section>
      <section className="food-panel food-form-panel"><header><div><small>Recipe editor</small><h3>Add or update an ingredient</h3></div></header>{canManageRecipes ? snapshot.ingredients.length === 0 ? <div className="settings-lock">Create inventory ingredients first, then return here to connect them to menu recipes.</div> : <><label>Menu item<select value={recipeMenuItemId} onChange={(event) => setRecipeMenuItemId(event.target.value)}>{snapshot.menuItems.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Inventory ingredient<select value={recipeIngredientId} onChange={(event) => setRecipeIngredientId(event.target.value)}>{snapshot.ingredients.map((item) => <option value={item.id} key={item.id}>{item.name} · {item.unit}</option>)}</select></label><label>Quantity per sold item<input type="number" min="0.001" step="0.001" value={recipeQuantity} onChange={(event) => setRecipeQuantity(Math.max(0.001, Number(event.target.value)))}/></label><button className="primary-action food-primary" disabled={saving || !recipeMenuItemId || !recipeIngredientId} onClick={() => void addRecipeLine()}><Plus size={14}/>Save ingredient</button><div className="privacy-hint"><CircleAlert size={14}/><span>Recipe quantities are theoretical standards. Munaffa deducts these standards only when an order is completed; it does not claim to measure the chef’s exact physical usage per plate.</span></div></> : <div className="settings-lock">Your role can view recipes but cannot edit recipe standards.</div>}</section>
    </div>}

    {tab === "orders" && <div className="food-two-column food-orders-layout">
      <section className="food-panel"><header><div><small>Kitchen / service queue</small><h3>Live orders for {workspace.propertyName}</h3></div></header>{loading ? <div className="team-empty">Loading orders…</div> : orders.length === 0 ? <div className="team-empty">No real orders yet.</div> : <div className="food-order-list">{orders.map((order) => <article key={order.id} className={`food-order status-${order.status}`}><header><div><small>{serviceLabels[order.serviceType]}{order.serviceReference ? ` · ${order.serviceReference}` : ""}</small><b>{formatMoney(order.subtotal)} · {statusLabels[order.status]}</b></div><time>{formatTime(order.createdAt)}</time></header><div className="food-order-items">{order.items.map((item) => <span key={item.id}><b>{item.quantity}×</b> {item.itemName}</span>)}</div>{order.notes && <p>{order.notes}</p>}<div className="food-order-actions">{allowedNextStatuses(order.status, workspace.authorizationRole).map((status) => <button key={status} disabled={updatingOrderId === order.id} className={status === "cancelled" ? "danger-action" : status === "completed" ? "primary-action" : ""} onClick={() => void moveOrder(order, status)}>{updatingOrderId === order.id ? "Saving…" : statusLabels[status]}</button>)}</div></article>)}</div>}</section>
      <section className="food-panel food-form-panel order-builder"><header><div><small>Staff order</small><h3>Create a real order</h3></div></header>{canCreateOrder ? <><div className="settings-two"><label>Service type<select value={serviceType} onChange={(event) => setServiceType(event.target.value as FoodServiceType)}>{Object.entries(serviceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Table / room / reference<input value={serviceReference} maxLength={120} onChange={(event) => setServiceReference(event.target.value)} placeholder="Table 08"/></label></div><div className="order-menu-picker">{activeMenuItems.length === 0 ? <div className="team-empty">Create and activate menu items before taking orders.</div> : activeMenuItems.map((item) => { const quantity = cart[item.id] || 0; return <article key={item.id}><div><b>{item.name}</b><small>{formatMoney(item.price)}</small></div><div className="qty-control"><button onClick={() => setCart((current) => ({ ...current, [item.id]: Math.max(0, quantity - 1) }))}><Minus size={12}/></button><span>{quantity}</span><button onClick={() => setCart((current) => ({ ...current, [item.id]: Math.min(50, quantity + 1) }))}><Plus size={12}/></button></div></article>; })}</div><label>Order notes<textarea value={orderNotes} maxLength={1000} onChange={(event) => setOrderNotes(event.target.value)} placeholder="Allergy note, service instruction, etc."/></label><div className="order-total"><span>Order subtotal</span><b>{formatMoney(cartTotal)}</b></div><button className="primary-action food-primary" disabled={saving || cartTotal <= 0} onClick={() => void createOrder()}>{saving ? "Creating…" : "Create order"}</button></> : <div className="settings-lock">Your role can view the service queue but cannot create orders.</div>}</section>
    </div>}

    <div className="demo-notice production-notice"><CircleAlert size={15}/><span>When an order reaches <b>Completed</b>, Munaffa writes one append-only theoretical `order_usage` movement per recipe ingredient. Cancelling an order never consumes theoretical stock.</span></div>
  </div>;
}

function Kpi({ label, value, warning }: { label: string; value: string; warning?: boolean }) {
  return <article className={warning ? "workspace-kpi warning" : "workspace-kpi"}><small>{label}</small><b>{value}</b></article>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

function allowedNextStatuses(status: FoodOrderStatus, role: string): Array<Exclude<FoodOrderStatus, "new">> {
  const candidates: Record<FoodOrderStatus, Array<Exclude<FoodOrderStatus, "new">>> = {
    new: ["accepted", "cancelled"],
    accepted: ["preparing", "ready", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["served", "completed"],
    served: ["completed"],
    completed: [],
    cancelled: [],
  };
  return candidates[status].filter((next) => {
    if (["accepted", "preparing", "ready"].includes(next)) return ["owner", "manager", "kitchen", "waiter"].includes(role);
    if (["served", "completed", "cancelled"].includes(next)) return ["owner", "manager", "front-desk", "cashier", "waiter"].includes(role);
    return false;
  });
}
