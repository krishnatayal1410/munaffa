"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useDemoWorkspace } from "@/lib/demoWorkspace";

const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});

export function GuestOrderDemo(){
 const s=useDemoWorkspace();
 const locations=s.locations.filter(x=>s.menu.some(m=>m.locationId===x.id));
 const [locationId,setLocationId]=useState(locations[0]?.id??s.activeLocationId);
 const [qty,setQty]=useState<Record<string,number>>({});
 const [lastOrderId,setLastOrderId]=useState<string|null>(null);
 const menu=s.menu.filter(x=>x.locationId===locationId);
 const total=useMemo(()=>menu.reduce((sum,m)=>sum+(qty[m.id]??0)*m.price,0),[menu,qty]);
 const last=s.orders.find(x=>x.id===lastOrderId);
 function change(id:string,delta:number){setQty(q=>({...q,[id]:Math.max(0,(q[id]??0)+delta)}))}
 function submit(){const lines=Object.entries(qty).filter(([,n])=>n>0).map(([menuId,n])=>({menuId,qty:n}));if(!lines.length)return;const orderId=s.addOrder({locationId,serviceRef:"Guest QR · Table 21",channel:"guest-qr",lines});if(orderId){setLastOrderId(orderId);setQty({})}}
 return <main className="guest-order-shell">
  <header className="guest-order-top"><a href="/" className="guest-logo">M</a><div><span>APP-FREE ORDERING DEMO</span><b>Munaffa Guest</b></div><a href="/app">Staff view →</a></header>
  <section className="guest-hero"><span>SCAN → ORDER → KITCHEN</span><h1>Order without downloading an app.</h1><p>This is a functional browser demo. Orders placed here enter the same local workspace used by the staff/KDS demo on this device.</p></section>
  <section className="guest-card"><label>Choose venue<select value={locationId} onChange={e=>{setLocationId(e.target.value);setQty({});setLastOrderId(null)}}>{locations.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></label><div className="guest-menu">{menu.map(item=><article key={item.id}><div><span>{item.category}</span><h2>{item.name}</h2><b>{money.format(item.price)}</b></div><div className="guest-qty"><button onClick={()=>change(item.id,-1)} aria-label={`Remove ${item.name}`}><Minus size={15}/></button><strong>{qty[item.id]??0}</strong><button onClick={()=>change(item.id,1)} aria-label={`Add ${item.name}`}><Plus size={15}/></button></div></article>)}</div><footer><div><span>Total</span><strong>{money.format(total)}</strong></div><button disabled={total<=0} onClick={submit}><ShoppingBag size={16}/> Send order</button></footer></section>
  {last&&<section className="guest-status"><CheckCircle2 size={22}/><div><span>ORDER SENT</span><h2>{last.serviceRef}</h2><p>Live demo status: <b>{last.status}</b>. Open the staff workspace in another tab and advance this order to watch the status change here.</p></div></section>}
  <footer className="guest-disclaimer">Prototype ordering flow · no payment is processed · data stays in this browser demo.</footer>
 </main>
}
