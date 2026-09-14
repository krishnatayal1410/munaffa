"use client";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type Status={kind:"idle"|"loading"|"success"|"error";message:string};
export function PilotRequest(){
 const [status,setStatus]=useState<Status>({kind:"idle",message:""});
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setStatus({kind:"loading",message:"Submitting…"});
  const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form.entries());
  try{const response=await fetch("/api/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error||"Unable to submit");setStatus({kind:"success",message:"Pilot request received."});event.currentTarget.reset()}catch(error){setStatus({kind:"error",message:error instanceof Error?error.message:"Unable to submit request"})}
 }
 return <main className="pilot-shell">
  <header className="pilot-nav"><a href="/" className="pilot-brand">MUNAFFA</a><a href="/meeting">Business brief</a></header>
  <section className="pilot-grid"><div className="pilot-copy"><span>DESIGN-PARTNER PILOT</span><h1>Prove one operating improvement in one location.</h1><p>Munaffa is in validation. The first pilot should focus on a real operational pain—order flow, recipe costing, stock variance, purchasing, manager closing or guest recovery—and measure the before/after.</p><div className="pilot-principles"><p><CheckCircle2 size={15}/> No forced full-stack replacement during discovery.</p><p><CheckCircle2 size={15}/> One measurable KPI before adding more modules.</p><p><CheckCircle2 size={15}/> No guaranteed savings before baseline measurement.</p></div></div>
  <form className="pilot-form" onSubmit={submit}><div><label>Your name<input name="name" minLength={2} maxLength={100} required/></label><label>Business<input name="business" minLength={2} maxLength={140} required/></label></div><div><label>Email<input name="email" type="email" required/></label><label>Phone<input name="phone" inputMode="tel" maxLength={30}/></label></div><label>Number of locations<input name="locations" type="number" min="1" max="5000" defaultValue="1" required/></label><label>What should Munaffa help improve first?<textarea name="note" maxLength={1000} rows={5}/></label><input className="pilot-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/><button disabled={status.kind==="loading"}>Request pilot conversation <ArrowRight size={15}/></button>{status.kind!=="idle"&&<p className={`pilot-status ${status.kind}`}>{status.message}{status.kind==="error"&&" If production storage is not configured yet, use the live meeting demo and capture contact details manually."}</p>}<small>Submitting real data requires production MongoDB configuration. This form will not pretend to store a lead when persistence is unavailable.</small></form></section>
 </main>
}
