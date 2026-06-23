// Store Settings (/store-settings) — Figma node 151:602. Restaurant profile,
// brand assets, weekly opening hours, delivery logistics, and legal/licensing
// details with a sticky unsaved-changes action bar (PRD §13.1 OWN-01).

import { useEffect, useState } from "react";
import { ChevronDown, ImagePlus, ImageUp, Plus } from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const LEGAL_ENTITY_TYPES = [
  "Sole proprietorship",
  "Partnership",
  "Private Limited",
  "Public Limited",
  "NGO",
  "AOP/BOI",
];

const CUISINES = [
  "Contemporary French",
  "North Indian",
  "South Indian",
  "Italian",
  "Chinese",
  "Continental",
];

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-brand-red">{label}</Label>
      {children}
    </div>
  );
}

function LegalEntitySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const display = value || "Select type";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className="font-medium uppercase tracking-wide">{display}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-brand-cream/70 bg-white shadow-lg">
          {LEGAL_ENTITY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => { onChange(type); setOpen(false); }}
              className={cn(
                "flex w-full items-center px-4 py-2.5 text-sm hover:bg-brand-cream/30",
                value === type && "font-semibold text-brand-orange",
              )}
            >
              {type}
            </button>
          ))}
          <button
            type="button"
            className="flex w-full items-center gap-1.5 border-t border-brand-cream/60 px-4 py-2.5 text-sm text-muted-foreground hover:bg-brand-cream/20"
          >
            <Plus className="h-3.5 w-3.5" /> Add Legal entity type
          </button>
        </div>
      )}
    </div>
  );
}

export default function StoreSettings() {
  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    requestJson("/restaurant_owner/store-settings")
      .then((payload) => {
        setSettings(payload.data);
        setOriginal(JSON.stringify(payload.data));
      })
      .catch((err) => setError(err.message));
  }, []);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const setNested = (key, patch) =>
    setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  const setHour = (i, patch) =>
    setSettings((s) => ({ ...s, hours: s.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) }));

  const dirty = settings && original && JSON.stringify(settings) !== original;

  async function save() {
    setSaving(true);
    setSavedNote("");
    try {
      await requestJson("/restaurant_owner/store-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setOriginal(JSON.stringify(settings));
      setSavedNote("All changes saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setSettings(JSON.parse(original));
    setSavedNote("");
  }

  if (error && !settings) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!settings) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading store settings…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="pb-20">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant profile, hours, delivery, and compliance details.
          </p>
        </div>

        {/* Restaurant info + brand assets */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Restaurant Information</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Restaurant Name">
                <Input value={settings.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Cuisine Type">
                <select
                  value={settings.cuisineType}
                  onChange={(e) => set({ cuisineType: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  {CUISINES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Email Address">
                <Input type="email" value={settings.email} onChange={(e) => set({ email: e.target.value })} />
              </Field>
              <Field label="Phone Number">
                <Input value={settings.phone} onChange={(e) => set({ phone: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={settings.website} onChange={(e) => set({ website: e.target.value })} />
              </Field>
              <Field label="Established Year">
                <Input value={settings.establishedYear} onChange={(e) => set({ establishedYear: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Full Address">
                  <Input value={settings.address} onChange={(e) => set({ address: e.target.value })} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Brand Assets</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-brand-red">Store Logo</Label>
                <label className="mt-1.5 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E2DFDE] bg-[#FCFAF7] text-muted-foreground hover:border-brand-orange/50">
                  <ImageUp className="h-5 w-5" />
                  <span className="text-xs">Upload Image</span>
                </label>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-brand-red">Banner Image</Label>
                <label className="mt-1.5 flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#E2DFDE] bg-[#FCFAF7] text-muted-foreground hover:border-brand-orange/50">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">1920×1080 recommended</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opening hours */}
        <Card className="mt-5">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <h2 className="text-base font-bold">Opening Hours</h2>
            <Button variant="outline" size="sm" className="border-brand-orange/40 text-brand-orange">
              Manage Holidays
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] border-b border-brand-cream/60 px-6 py-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Day</span>
              <span>Status</span>
              <span>Opening Time</span>
              <span>Closing Time</span>
            </div>
            {settings.hours.map((h, i) => (
              <div
                key={h.day}
                className={cn(
                  "grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-b border-brand-cream/40 px-6 py-3 last:border-0",
                  h.closed && "opacity-60",
                )}
              >
                <span className="text-sm font-medium">{h.day}</span>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={!h.closed} onCheckedChange={(v) => setHour(i, { closed: !v })} />
                  <span className={h.closed ? "text-muted-foreground" : "text-brand-green"}>
                    {h.closed ? "Closed" : "Open"}
                  </span>
                </label>
                <Input
                  type="time"
                  value={h.open}
                  disabled={h.closed}
                  onChange={(e) => setHour(i, { open: e.target.value })}
                  className="h-8 w-32"
                />
                <Input
                  type="time"
                  value={h.close}
                  disabled={h.closed}
                  onChange={(e) => setHour(i, { close: e.target.value })}
                  className="h-8 w-32"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Delivery logistics */}
        <Card className="mt-5">
          <CardHeader className="pb-4">
            <h2 className="text-base font-bold">Delivery Logistics</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Radius (km)">
              <Input
                value={settings.delivery.radiusKm}
                onChange={(e) => setNested("delivery", { radiusKm: e.target.value })}
              />
            </Field>
            <Field label="Base Charge">
              <Input
                value={settings.delivery.baseCharge}
                onChange={(e) => setNested("delivery", { baseCharge: e.target.value })}
              />
            </Field>
            <Field label="Free Threshold">
              <Input
                value={settings.delivery.freeThreshold}
                onChange={(e) => setNested("delivery", { freeThreshold: e.target.value })}
              />
            </Field>
            <Field label="Estimated Time">
              <Input
                value={settings.delivery.estimatedTime}
                onChange={(e) => setNested("delivery", { estimatedTime: e.target.value })}
              />
            </Field>
          </CardContent>
        </Card>

        {/* Business details + licenses */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Business Details</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Legal Entity Type">
                <LegalEntitySelect
                  value={settings.business?.legalEntityType ?? ""}
                  onChange={(v) => setNested("business", { legalEntityType: v })}
                />
              </Field>
              <Field label="Owner Name">
                <Input
                  value={settings.business?.ownerName ?? ""}
                  onChange={(e) => setNested("business", { ownerName: e.target.value })}
                  placeholder="Full name"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tax Identifier (PAN)">
                  <Input
                    value={settings.business?.panNumber ?? ""}
                    onChange={(e) => setNested("business", { panNumber: e.target.value })}
                    placeholder="ABCDE1234F"
                    className="uppercase tracking-widest"
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Licenses &amp; Tax</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="GST Number">
                  <Input
                    value={settings.business?.gstNumber ?? ""}
                    onChange={(e) => setNested("business", { gstNumber: e.target.value })}
                    placeholder="27AACR1234F1Z1"
                    className="uppercase tracking-widest"
                  />
                </Field>
              </div>
              <Field label="FSSAI">
                <Input
                  value={settings.licenses?.fssai ?? ""}
                  onChange={(e) => setNested("licenses", { fssai: e.target.value })}
                  placeholder="H-992-B"
                />
              </Field>
              <Field label="FSSAI License Expiry">
                <Input
                  type="date"
                  value={settings.licenses?.fssaiExpiry ?? ""}
                  onChange={(e) => setNested("licenses", { fssaiExpiry: e.target.value })}
                />
              </Field>
              <Field label="Trade License">
                <Input
                  value={settings.licenses?.tradeLicense ?? ""}
                  onChange={(e) => setNested("licenses", { tradeLicense: e.target.value })}
                  placeholder="REG-9912002"
                />
              </Field>
              <Field label="Trade License Expiry">
                <Input
                  type="date"
                  value={settings.licenses?.tradeLicenseExpiry ?? ""}
                  onChange={(e) => setNested("licenses", { tradeLicenseExpiry: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-6 flex items-center justify-between border-t border-brand-cream/60 bg-[#FAFAF8]/95 px-6 py-3.5 backdrop-blur lg:-mx-7 lg:px-7">
        <span className={cn("text-sm", dirty ? "text-brand-orange" : "text-muted-foreground")}>
          {dirty ? "● You have unsaved changes" : savedNote || "All changes saved"}
        </span>
        <div className="flex gap-3">
          <Button variant="outline" onClick={discard} disabled={!dirty}>
            Discard Changes
          </Button>
          <Button
            onClick={save}
            disabled={!dirty || saving}
            className="bg-brand-gradient px-6 text-white hover:brightness-105"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
