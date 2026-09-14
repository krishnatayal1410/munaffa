"use client";

import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";

const items = [
  { id: "coffee", name: "House Espresso", note: "single origin · cocoa · caramel", price: 220 },
  { id: "pizza", name: "Fire-baked Margherita", note: "tomato · basil · fior di latte", price: 520 },
  { id: "salad", name: "Garden Plate", note: "greens · avocado · cucumber", price: 410 },
  { id: "dessert", name: "Dark Chocolate Tart", note: "70% cacao · sea salt", price: 360 }
] as const;

type Cart = Record<string, number>;

export function MenuExperience() {
  const [cart, setCart] = useState<Cart>({});
  const [sent, setSent] = useState(false);
  const count = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0), [cart]);

  function change(id: string, delta: number) {
    setSent(false);
    setCart((current) => {
      const next = Math.max(0, (current[id] || 0) + delta);
      return { ...current, [id]: next };
    });
  }

  return <div className="menu-demo" data-reveal>
    <header><div><span>LIVE INTERACTION</span><strong>Table 12</strong></div><ShoppingBag size={18}/></header>
    <div className="menu-list">
      {items.map((item) => {
        const qty = cart[item.id] || 0;
        return <article key={item.id}>
          <div><b>{item.name}</b><small>{item.note}</small><em>₹{item.price}</em></div>
          <div className="qty-control">
            <button type="button" onClick={() => change(item.id, -1)} aria-label={`Remove ${item.name}`} disabled={!qty}><Minus size={12}/></button>
            <span>{qty}</span>
            <button type="button" onClick={() => change(item.id, 1)} aria-label={`Add ${item.name}`}><Plus size={12}/></button>
          </div>
        </article>;
      })}
    </div>
    <footer>
      <div><small>{count} item{count === 1 ? "" : "s"}</small><b>₹{total.toLocaleString("en-IN")}</b></div>
      <button type="button" disabled={!count || sent} onClick={() => setSent(true)}>{sent ? <><Check size={14}/> Order queued</> : <>Send demo order</>}</button>
    </footer>
    {sent && <div className="order-confirm"><Check size={14}/><span>Demo order moved into the service flow. No payment was processed.</span><button type="button" onClick={() => setSent(false)} aria-label="Dismiss"><X size={12}/></button></div>}
  </div>;
}
