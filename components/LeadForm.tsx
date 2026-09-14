"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type LeadSource = "demo" | "contact";

type FormState = {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  businessType: "hotel" | "restaurant" | "cafe" | "qsr" | "cloud-kitchen" | "resort" | "bar-lounge" | "other";
  city: string;
  message: string;
  website: string;
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  businessName: "",
  businessType: "restaurant",
  city: "",
  message: "",
  website: "",
};

export function LeadForm({ source }: { source: LeadSource }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Unable to submit your request.");
      setStatus("success");
      setMessage(source === "demo" ? "Your demo request has been saved. We can now follow up about your hospitality setup." : "Your message has been saved. We can now follow up with you.");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  }

  if (status === "success") {
    return <section className="lead-success"><CheckCircle2 size={34}/><span className="kicker">Request received</span><h2>Thanks — we have the details.</h2><p>{message}</p><button className="pill ghost" onClick={() => { setStatus("idle"); setMessage(""); }}>Send another request</button></section>;
  }

  return <form className="lead-form" onSubmit={submit}>
    <div className="lead-form-head"><span className="kicker">{source === "demo" ? "Book a guided walkthrough" : "Talk to Munaffa"}</span><h2>{source === "demo" ? "Tell us what you operate." : "Tell us what you need."}</h2><p>{source === "demo" ? "We will use this context to focus the demo on the workflows that matter to your business." : "Share the hospitality problem, pilot idea or product question you want to discuss."}</p></div>
    <div className="lead-fields">
      <label>Full name<input required minLength={2} maxLength={100} value={form.name} onChange={(event) => field("name", event.target.value)} placeholder="Your name" autoComplete="name"/></label>
      <label>Work email<input required type="email" maxLength={200} value={form.email} onChange={(event) => field("email", event.target.value)} placeholder="you@business.com" autoComplete="email"/></label>
      <label>Phone / WhatsApp<input type="tel" maxLength={25} value={form.phone} onChange={(event) => field("phone", event.target.value)} placeholder="Optional" autoComplete="tel"/></label>
      <label>Business name<input required minLength={2} maxLength={150} value={form.businessName} onChange={(event) => field("businessName", event.target.value)} placeholder="Your hotel, restaurant or brand" autoComplete="organization"/></label>
      <label>Business type<select value={form.businessType} onChange={(event) => field("businessType", event.target.value as FormState["businessType"])}><option value="hotel">Hotel</option><option value="restaurant">Restaurant</option><option value="cafe">Café</option><option value="qsr">QSR</option><option value="cloud-kitchen">Cloud kitchen</option><option value="resort">Resort</option><option value="bar-lounge">Bar / lounge</option><option value="other">Other hospitality</option></select></label>
      <label>City<input required minLength={2} maxLength={120} value={form.city} onChange={(event) => field("city", event.target.value)} placeholder="e.g. Noida" autoComplete="address-level2"/></label>
      <label className="lead-message">What should we focus on?<textarea maxLength={1000} rows={5} value={form.message} onChange={(event) => field("message", event.target.value)} placeholder="Inventory control, food cost, rooms, service operations, guest CRM, multi-outlet visibility…"/></label>
      <label className="lead-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => field("website", event.target.value)}/></label>
    </div>
    {status === "error" && <div className="form-error">{message}</div>}
    <div className="lead-submit"><button className="pill primary" type="submit" disabled={status === "sending"}>{status === "sending" ? <><Loader2 size={15} className="spin"/>Saving request…</> : <>{source === "demo" ? "Request demo" : "Send message"}<ArrowRight size={15}/></>}</button><small>By submitting, you are asking Munaffa to contact you about the product. We do not claim your business is already integrated.</small></div>
  </form>;
}
