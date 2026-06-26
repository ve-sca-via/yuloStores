// Store Settings (/store-settings) — Figma node 151:602. Restaurant profile,
// brand assets, weekly opening hours, delivery logistics, and legal/licensing
// details with a sticky unsaved-changes action bar (PRD §13.1 OWN-01).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ImagePlus, ImageUp, Plus } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useSettings, useUpdateSettings, useUpdateHours, useUpdateDelivery } from "@/hooks/owner/useSettings";
import { ownerApi } from "@/api/owner.api";
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
  const navigate = useNavigate();
  const { restaurantId, fetchRestaurants, user } = useOwnerAuth();
  const { data: serverSettings, isLoading, isError } = useSettings(restaurantId);
  const updateMutation        = useUpdateSettings(restaurantId);
  const updateHoursMutation   = useUpdateHours(restaurantId);
  const updateDeliveryMutation = useUpdateDelivery(restaurantId);

  const [settings, setSettings]     = useState(null);
  const [original, setOriginal]     = useState(null);
  const [savedNote, setSavedNote]   = useState("");
  // create-restaurant form (used when restaurantId is null)
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");
  const [newName, setNewName]       = useState("");
  const [newAddress, setNewAddress] = useState("");

  // Convert minutes-from-midnight number → "HH:MM" string for time inputs
  const minsToTime = (mins) => {
    if (mins == null) return "";
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };
  const timeToMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };

  const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

  // Seed form state from server restaurant document
  useEffect(() => {
    if (!serverSettings || settings) return;
    const r = serverSettings;
    const hoursMap = Object.fromEntries((r.operatingHours ?? []).map((h) => [h.day, h]));
    const seeded = {
      name:         r.name ?? "",
      description:  r.description ?? "",
      cuisineType:  (r.cuisineTypes ?? [])[0] ?? "",
      address:      r.address?.street ?? r.address?.city ?? "",
      email:        "",
      phone:        "",
      website:      "",
      establishedYear: "",
      hours: DAYS.map((day) => ({
        day:    day.charAt(0).toUpperCase() + day.slice(1),
        dayKey: day,
        closed: !(hoursMap[day]?.isOpen ?? true),
        open:   minsToTime(hoursMap[day]?.openTime ?? 540),
        close:  minsToTime(hoursMap[day]?.closeTime ?? 1320),
      })),
      delivery: {
        radiusKm:       r.delivery?.radiusKm ?? 5,
        baseCharge:     r.delivery?.baseCharge ?? 0,
        freeThreshold:  r.delivery?.freeThreshold ?? "",
        estimatedTime:  r.delivery?.estimatedMinutes ?? 30,
      },
      business: {
        legalEntityType: r.settings?.legalEntityType ?? "",
        ownerName:       "",
        panNumber:       "",
        gstNumber:       r.settings?.gstNumber ?? "",
      },
      licenses: { fssai: "", fssaiExpiry: "", tradeLicense: "", tradeLicenseExpiry: "" },
    };
    setSettings(seeded);
    setOriginal(JSON.stringify(seeded));
  }, [serverSettings]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));
  const setNested = (key, patch) =>
    setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  const setHour = (i, patch) =>
    setSettings((s) => ({ ...s, hours: (s.hours ?? []).map((h, idx) => (idx === i ? { ...h, ...patch } : h)) }));

  const dirty = settings && original && JSON.stringify(settings) !== original;
  const saving = updateMutation.isPending || updateHoursMutation.isPending || updateDeliveryMutation.isPending;

  async function save() {
    setSavedNote("");
    try {
      // Main settings
      await updateMutation.mutateAsync({
        name:        settings.name,
        description: settings.description,
        cuisineTypes: settings.cuisineType ? [settings.cuisineType] : [],
        address:     { street: settings.address },
        settings: {
          legalEntityType: settings.business?.legalEntityType,
          gstNumber:       settings.business?.gstNumber,
        },
      });
      // Operating hours
      await updateHoursMutation.mutateAsync({
        operatingHours: (settings.hours ?? []).map((h) => ({
          day:       h.dayKey,
          isOpen:    !h.closed,
          openTime:  timeToMins(h.open),
          closeTime: timeToMins(h.close),
        })),
      });
      // Delivery
      await updateDeliveryMutation.mutateAsync({
        radiusKm:         Number(settings.delivery?.radiusKm) || 5,
        baseCharge:       Number(settings.delivery?.baseCharge) || 0,
        freeThreshold:    Number(settings.delivery?.freeThreshold) || undefined,
        estimatedMinutes: Number(settings.delivery?.estimatedTime) || 30,
      });
      setOriginal(JSON.stringify(settings));
      setSavedNote("All changes saved");
    } catch (err) {
      setSavedNote(err.response?.data?.message ?? "Save failed");
    }
  }

  function discard() {
    setSettings(JSON.parse(original));
    setSavedNote("");
  }

  // ── No restaurant yet: show create form ──────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await ownerApi.createRestaurant({ name: newName.trim(), address: { full: newAddress.trim() } });
      await fetchRestaurants();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setCreateError(err.response?.data?.message ?? err.message ?? "Failed to create restaurant");
    } finally {
      setCreating(false);
    }
  }

  if (!restaurantId) {
    return (
      <DashboardLayout profile={user}>
        <div className="flex flex-col items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardHeader className="pb-4">
              <h2 className="text-lg font-bold">Create Your Restaurant</h2>
              <p className="text-sm text-muted-foreground">
                Set up your restaurant profile to get started.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <Field label="Restaurant Name *">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Saffron Kitchen"
                    required
                  />
                </Field>
                <Field label="Address">
                  <Input
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="123 Main St, City"
                  />
                </Field>
                {createError && (
                  <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{createError}</p>
                )}
                <Button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="w-full bg-brand-gradient text-white hover:brightness-105"
                >
                  {creating ? "Creating…" : "Create Restaurant"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout profile={user}>
        <p className="text-muted-foreground">Failed to load store settings.</p>
      </DashboardLayout>
    );
  }
  if (isLoading || !settings) {
    return (
      <DashboardLayout profile={user}>
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
            {(settings.hours ?? []).map((h, i) => (
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
