"use client";

import { CheckCircle2, Minus, Plus, RefreshCw, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  resolveGuestOrderingPoint,
  submitGuestOrder,
  type GuestOrderReceipt,
  type GuestOrderingView,
} from "@/lib/guestOrderingBackend";

export function GuestOrderExperience({ token }: { token: string }) {
  const [view, setView] = useState<GuestOrderingView | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<GuestOrderReceipt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setView(await resolveGuestOrderingPoint(token));
    } catch (cause) {
      setView(null);
      setError(cause instanceof Error ? cause.message : "This ordering link is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const menuItems = useMemo(() => view?.menu.flatMap((category) => category.items) || [], [view]);
  const itemById = useMemo(() => new Map(menuItems.map((item) => [item.id, item])), [menuItems]);
  const cartLines = useMemo(() => Object.entries(cart).filter(([, quantity]) => quantity > 0), [cart]);
  const itemCount = useMemo(() => cartLines.reduce((total, [, quantity]) => total + quantity, 0), [cartLines]);
  const subtotal = useMemo(() => cartLines.reduce((total, [id, quantity]) => total + (itemById.get(id)?.price || 0) * quantity, 0), [cartLines, itemById]);

  function changeQuantity(itemId: string, delta: number) {
    setCart((current) => {
      const next = Math.min(20, Math.max(0, (current[itemId] || 0) + delta));
      return { ...current, [itemId]: next };
    });
  }

  async function placeOrder() {
    if (cartLines.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const next = await submitGuestOrder(token, {
        notes,
        items: cartLines.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
      });
      setReceipt(next);
      setCart({});
      setNotes("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your order could not be submitted. Please ask a staff member for help.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="guest-order-page"><div className="guest-order-state"><RefreshCw className="guest-spinner"/><b>Opening the live menu…</b><span>No app installation is required.</span></div></main>;

  if (!view) return <main className="guest-order-page"><div className="guest-order-state error"><UtensilsCrossed/><b>Ordering link unavailable</b><span>{error || "This QR code may have been disabled. Please ask a staff member for help."}</span><button onClick={() => void load()}>Try again</button></div></main>;

  if (receipt) return <main className="guest-order-page"><section className="guest-order-hero compact"><div className="guest-order-brand"><span>M</span><b>munaffa</b></div><small>{view.businessName} · {view.propertyName}</small></section><div className="guest-order-confirmation"><CheckCircle2 size={44}/><span>Order received</span><h1>Sent to the restaurant.</h1><p>Your order is now in the live service queue for <b>{view.orderingLabel}</b>. Staff will handle preparation, service and billing according to the venue’s normal process.</p><div><small>Order reference</small><b>{receipt.orderId.slice(0, 8).toUpperCase()}</b></div><div><small>Submitted subtotal</small><b>{formatMoney(receipt.subtotal)}</b></div><button onClick={() => setReceipt(null)}>Place another order</button><small className="guest-order-disclaimer">No payment was collected on this page. Pricing is the menu subtotal submitted to the venue and may be subject to its taxes, service charges or billing rules.</small></div></main>;

  return <main className="guest-order-page">
    <section className="guest-order-hero"><div className="guest-order-brand"><span>M</span><b>munaffa</b></div><small>{view.businessName}</small><h1>{view.propertyName}</h1><p>{view.orderingLabel} · {serviceLabel(view.serviceType)}</p></section>

    {error && <div className="guest-order-error" role="alert">{error}</div>}

    <div className="guest-menu-wrap">{view.menu.length === 0 ? <div className="guest-order-state"><ShoppingBag/><b>Menu is not available yet</b><span>Please ask a staff member for help.</span></div> : view.menu.map((category) => <section className="guest-menu-category" key={category.id || category.name}><header><small>Menu</small><h2>{category.name}</h2></header><div className="guest-menu-grid">{category.items.map((item) => { const quantity = cart[item.id] || 0; return <article key={item.id}><div className="guest-menu-copy"><b>{item.name}</b>{item.description && <p>{item.description}</p>}<strong>{formatMoney(item.price)}</strong></div><div className={quantity > 0 ? "guest-qty active" : "guest-qty"}>{quantity === 0 ? <button className="guest-add" onClick={() => changeQuantity(item.id, 1)}><Plus size={15}/> Add</button> : <><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Minus size={14}/></button><span>{quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}><Plus size={14}/></button></>}</div></article>; })}</div></section>)}</div>

    {itemCount > 0 && <section className="guest-cart"><div className="guest-cart-head"><div><small>{itemCount} item{itemCount === 1 ? "" : "s"}</small><b>{formatMoney(subtotal)}</b></div><span>Menu subtotal</span></div><label>Note for the team<textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)} placeholder="Allergy or service note (optional)"/></label><button disabled={submitting} onClick={() => void placeOrder()}>{submitting ? "Sending order…" : `Place order · ${formatMoney(subtotal)}`}</button><small>By placing this order you are sending a request to the venue’s live service queue. Payment is handled separately by the venue.</small></section>}

    <footer className="guest-order-footer"><div className="guest-order-brand small"><span>M</span><b>munaffa</b></div><p>App-free ordering · live menu · restaurant-controlled service</p></footer>
  </main>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}

function serviceLabel(value: string) {
  return ({ dine_in: "Dine in", room_service: "Room service", counter: "Counter order", takeaway: "Takeaway", other: "Guest order" } as Record<string, string>)[value] || "Guest order";
}
