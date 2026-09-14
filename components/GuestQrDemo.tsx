"use client";

import { useEffect, useState } from "react";
import { ExternalLink, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function GuestQrDemo(){
 const [url,setUrl]=useState("");
 useEffect(()=>setUrl(`${window.location.origin}/order/demo`),[]);
 return <main className="qr-shell">
  <header className="qr-top"><a href="/" className="qr-brand">MUNAFFA</a><a href="/meeting">Meeting mode</a></header>
  <section className="qr-hero">
   <div className="qr-copy"><span>APP-FREE GUEST ENTRY</span><h1>Scan the table. Enter the experience.</h1><p>Use this QR in the business meeting to open Munaffa&apos;s guest-ordering flow on a phone. The QR is rendered locally in the browser—no third-party QR service receives the destination URL.</p><div className="qr-actions"><a href="/order/demo">Open guest demo <ExternalLink size={14}/></a><a href="/app">Open staff workspace <ExternalLink size={14}/></a></div></div>
   <div className="qr-card"><div className="qr-code-wrap">{url?<QRCodeSVG value={url} size={286} level="M" bgColor="#fffaf3" fgColor="#162016" includeMargin/>:<div className="qr-loading"><QrCode size={40}/><span>Preparing QR…</span></div>}</div><div className="qr-card-meta"><Smartphone size={18}/><div><b>Guest ordering demo</b><span>{url||"Preparing local URL…"}</span></div></div></div>
  </section>
  <section className="qr-notice"><b>Meeting demo behaviour</b><p>Two tabs in the same browser share the local demo state, so guest orders and KDS status can update between them. A separate phone has its own browser storage until production persistence is configured, so use the phone QR to demonstrate the guest UX and use same-browser tabs to demonstrate the live end-to-end state flow.</p></section>
  <section className="qr-steps"><article><span>01</span><h2>Scan</h2><p>Guest opens the ordering experience with no app install.</p></article><article><span>02</span><h2>Order</h2><p>Choose menu items and send a clearly labelled demo order.</p></article><article><span>03</span><h2>Operate</h2><p>In same-browser meeting mode, staff can advance the order through the KDS flow.</p></article></section>
 </main>
}
