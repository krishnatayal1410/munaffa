"use client";

import { Building2, CheckCircle2, Hotel, MapPin, Plus, RefreshCw, Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { HospitalityType } from "@/lib/domain";
import { createWorkspaceProperty, listWorkspaceProperties, setActiveWorkspaceProperty, type WorkspaceProperty } from "@/lib/propertyBackend";
import { loadWorkspaceContext, type WorkspaceContext } from "@/lib/workspaceBackend";

const hospitalityTypes: { value: HospitalityType; label: string }[] = [
  { value: "hotel", label: "Hotel" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "qsr", label: "QSR" },
  { value: "cloud-kitchen", label: "Cloud Kitchen" },
  { value: "resort", label: "Resort" },
  { value: "bar-lounge", label: "Bar / Lounge" },
  { value: "other", label: "Other hospitality" },
];

export function LocationsWorkspace({ workspace, onWorkspaceChange }: { workspace: WorkspaceContext; onWorkspaceChange: (context: WorkspaceContext) => void }) {
  const [properties, setProperties] = useState<WorkspaceProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<HospitalityType>(workspace.hospitalityType);
  const [creating, setCreating] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const canCreate = ["owner", "manager"].includes(workspace.authorizationRole);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProperties(await listWorkspaceProperties(workspace));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load properties.");
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function activate(propertyId: string) {
    if (propertyId === workspace.propertyId) return;
    setSwitchingId(propertyId);
    setError("");
    try {
      await setActiveWorkspaceProperty(workspace, propertyId);
      const context = await loadWorkspaceContext();
      if (!context) throw new Error("The selected property could not be loaded.");
      onWorkspaceChange(context);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not switch properties.");
    } finally {
      setSwitchingId(null);
    }
  }

  async function createProperty() {
    if (!canCreate || name.trim().length < 2 || city.trim().length < 2) return;
    setCreating(true);
    setError("");
    try {
      const propertyId = await createWorkspaceProperty(workspace, { name, city, hospitalityType: type });
      if (!propertyId) throw new Error("Property creation returned no identifier.");
      await setActiveWorkspaceProperty(workspace, propertyId);
      const context = await loadWorkspaceContext();
      if (!context) throw new Error("Property was created but the refreshed workspace could not be loaded.");
      onWorkspaceChange(context);
      setName("");
      setCity("");
      setFormOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this property.");
    } finally {
      setCreating(false);
    }
  }

  return <div className="module-page interactive-workspace locations-workspace">
    <div className="module-heading"><Building2 size={24}/><div><span className="kicker">Properties & outlets</span><h2>One organization. Every hospitality location.</h2><p>Switch the active property to scope Operations, Inventory, Guests, Profit and grounded intelligence to that location. The current authorization model is organization-wide; property-specific staff scopes are a separate control layer.</p></div></div>

    <div className="location-toolbar"><div><MapPin size={16}/><span><small>Active location</small><b>{workspace.propertyName} · {workspace.city}</b></span></div><div><button type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14}/>Refresh</button>{canCreate && <button className="primary-action" type="button" onClick={() => setFormOpen((open) => !open)}><Plus size={14}/>Add location</button>}</div></div>

    {formOpen && canCreate && <section className="location-create-form"><div className="settings-two"><label>Property / outlet name<input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Munaffa Central"/></label><label>City<input value={city} maxLength={120} onChange={(event) => setCity(event.target.value)} placeholder="New Delhi"/></label></div><label>Hospitality type<select value={type} onChange={(event) => setType(event.target.value as HospitalityType)}>{hospitalityTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div className="production-form-actions"><button type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="primary-action" type="button" disabled={creating || name.trim().length < 2 || city.trim().length < 2} onClick={() => void createProperty()}>{creating ? "Creating…" : "Create & switch"}</button></div></section>}

    {error && <div className="form-error production-error" role="alert">{error}</div>}

    {loading ? <div className="production-empty">Loading properties…</div> : <div className="location-grid">{properties.map((property) => {
      const active = property.id === workspace.propertyId;
      return <article key={property.id} className={active ? "active" : ""}><div className="location-card-icon">{property.hospitalityType === "hotel" || property.hospitalityType === "resort" ? <Hotel size={21}/> : <Store size={21}/>}</div><span className="location-type">{hospitalityTypes.find((item) => item.value === property.hospitalityType)?.label || property.hospitalityType}</span><h3>{property.name}</h3><p><MapPin size={12}/>{property.city}</p><small>Created {property.createdAt ? new Date(property.createdAt).toLocaleDateString("en-IN") : "in workspace"}</small>{active ? <div className="active-location"><CheckCircle2 size={14}/>Active location</div> : <button type="button" disabled={switchingId !== null} onClick={() => void activate(property.id)}>{switchingId === property.id ? "Switching…" : "Work in this location"}</button>}</article>;
    })}</div>}

    {!canCreate && <div className="settings-lock">Your authorization role is <b>{workspace.authorizationRole}</b>. You can switch between organization locations, but only owners and managers can add a new property/outlet.</div>}
    <div className="demo-notice production-notice"><Building2 size={15}/><span>Changing the active location changes the property scope used by production Operations, Inventory, Guest Recovery, Profit and grounded intelligence. Records from other locations are not merged into the current property view.</span></div>
  </div>;
}
