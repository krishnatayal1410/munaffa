"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Building2, Check, ChefHat, Coffee, Hotel, Store, UtensilsCrossed, Wine } from "lucide-react";
import type { HospitalityType, Role } from "@/lib/domain";
import { saveWorkspaceSetup } from "@/lib/workspaceBackend";

const businessTypes: { key: HospitalityType; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { key: "hotel", label: "Hotel", icon: Hotel }, { key: "restaurant", label: "Restaurant", icon: UtensilsCrossed }, { key: "cafe", label: "Café", icon: Coffee }, { key: "qsr", label: "QSR", icon: Store }, { key: "cloud-kitchen", label: "Cloud Kitchen", icon: ChefHat }, { key: "resort", label: "Resort", icon: Building2 }, { key: "bar-lounge", label: "Bar / Lounge", icon: Wine }, { key: "other", label: "Other", icon: Building2 },
];
const roles: Role[] = ["owner", "manager", "front-desk", "cashier", "waiter", "kitchen", "inventory"];
const modules = ["Revenue & analytics", "Orders / bookings", "Inventory & cost", "Kitchen / service operations", "Guests & CRM", "AI insights"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [organizationName, setOrganizationName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<HospitalityType>("hotel");
  const [role, setRole] = useState<Role>("owner");
  const [enabled, setEnabled] = useState(modules.slice(0, 4));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canContinue = useMemo(() => step === 0 ? organizationName.trim().length > 1 : step === 2 ? propertyName.trim().length > 1 && city.trim().length > 1 : true, [city, organizationName, propertyName, step]);

  async function finish() {
    setSaving(true);
    setError("");
    try {
      await saveWorkspaceSetup({ organizationName: organizationName.trim(), hospitalityType: type, role, propertyName: propertyName.trim(), city: city.trim(), enabledModules: enabled });
      router.push("/app?tour=1");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your workspace. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="onboarding-page"><div className="onboarding-shell">
    <header className="onboarding-head"><div className="brand"><span className="brand-glyph">M</span><span><b>munaffa</b><small>Workspace setup</small></span></div><span>Step {step + 1} of 4</span></header>
    <div className="setup-progress"><i style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
    {step === 0 && <section className="setup-step"><span className="kicker">Your business</span><h1>What should we call your hospitality group?</h1><p>This can be your company, brand or independent business name.</p><label className="big-input">Business name<input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Meridian Hospitality" autoFocus /></label></section>}
    {step === 1 && <section className="setup-step"><span className="kicker">Business model</span><h1>What type of hospitality business are you running?</h1><p>Munaffa changes the workspace based on this choice.</p><div className="choice-grid">{businessTypes.map(({ key, label, icon: Icon }) => <button key={key} className={type === key ? "selected" : ""} onClick={() => setType(key)}><Icon size={22}/><b>{label}</b>{type === key && <Check size={16}/>}</button>)}</div><h3>Your primary role</h3><div className="role-row">{roles.map((item) => <button key={item} className={role === item ? "selected" : ""} onClick={() => setRole(item)}>{item.replace("-", " ")}</button>)}</div></section>}
    {step === 2 && <section className="setup-step"><span className="kicker">First property / outlet</span><h1>Create the location you want to operate first.</h1><div className="two-field"><label>Property / outlet name<input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Meridian Central" /></label><label>City<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="New Delhi" /></label></div></section>}
    {step === 3 && <section className="setup-step"><span className="kicker">Modules</span><h1>Choose what you want Munaffa to show first.</h1><p>You can turn everything on later.</p><div className="module-list">{modules.map((item) => { const active = enabled.includes(item); return <button key={item} className={active ? "selected" : ""} onClick={() => setEnabled((items) => active ? items.filter((x) => x !== item) : [...items, item])}><span>{active ? <Check size={15}/> : null}</span><b>{item}</b></button>; })}</div>{error && <div className="form-error">{error}</div>}</section>}
    <footer className="setup-actions"><button className="pill ghost" disabled={step === 0 || saving} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</button><button className="pill primary" disabled={!canContinue || saving} onClick={() => step === 3 ? void finish() : setStep((s) => s + 1)}>{saving ? "Creating workspace…" : step === 3 ? "Open workspace" : "Continue"}</button></footer>
  </div></main>;
}
