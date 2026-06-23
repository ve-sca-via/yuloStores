// Offers & Coupons (/offers) — Figma node 149:7. Create coupon/automatic offers
// with a full discount configuration, a live coupon preview, and a managed list
// of active/scheduled/expired offers (PRD §17).

import { useEffect, useMemo, useState } from "react";
import { Copy, ImagePlus, Pencil, Trash2 } from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const DISCOUNT_TYPES = [
  { value: "percent", label: "Percentage" },
  { value: "flat", label: "Flat Amount" },
  { value: "free_item", label: "Free Item" },
  { value: "tableware", label: "Tableware offer" },
];

const APPLICABLE = [
  { value: "dine-in", label: "Dine-in" },
  { value: "delivery", label: "Delivery" },
  { value: "both", label: "Both" },
];

const STATUS_VARIANT = { active: "ok", scheduled: "info", expired: "muted" };

const EMPTY = {
  name: "",
  type: "coupon",
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  item: "",
  minOrder: "",
  applicableFor: "dine-in",
  validFrom: "",
  validTo: "",
};

function discountLabel(offer) {
  if (offer.discountType === "percent") return `${offer.discountValue}% Off`;
  if (offer.discountType === "flat") return `₹${offer.discountValue} Off`;
  if (offer.discountType === "free_item") return "Free Item";
  return "Tableware";
}

function validityLabel(offer) {
  if (!offer.validFrom && !offer.validTo) return "—";
  const fmt = (v) =>
    v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—";
  return `${fmt(offer.validFrom)} – ${fmt(offer.validTo)}`;
}

// Toggle chip used for offer type, discount type, and applicable-for.
function Pill({ active, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-brand-gradient text-white"
          : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
        className,
      )}
    >
      {children}
    </button>
  );
}

function RupeeInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        ₹
      </span>
      <Input value={value} onChange={onChange} placeholder={placeholder} className="pl-7" />
    </div>
  );
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    requestJson("/restaurant_owner/offers")
      .then((payload) => {
        setOffers(payload.data.offers);
        setItems(payload.data.items ?? []);
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function publish() {
    if (!form.name.trim()) {
      setError("Add an offer name before publishing");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await requestJson("/restaurant_owner/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    setOffers((current) => current.filter((o) => o.id !== id));
    try {
      await requestJson(`/restaurant_owner/offers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const visible = useMemo(
    () => offers.filter((o) => o.name.toLowerCase().includes(search.toLowerCase())),
    [offers, search],
  );

  if (!loaded && !error) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading offers…</p>
      </DashboardLayout>
    );
  }

  const showItemPicker = form.discountType === "free_item" || form.discountType === "tableware";

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Offers &amp; Coupons</h1>
        <p className="text-sm text-muted-foreground">
          Create promotions, reward loyal customers, and increase repeat purchases.
        </p>
      </div>

      {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* Builder */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Create Offer / Coupon</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Offer Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "coupon", title: "Coupon", note: "Requires code at checkout" },
                    { value: "automatic", title: "Automatic", note: "Applies to all eligible orders" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set({ type: opt.value })}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        form.type === opt.value
                          ? "border-brand-orange bg-brand-orange/5"
                          : "border-brand-cream bg-white hover:bg-brand-cream/20",
                      )}
                    >
                      <p className="text-sm font-bold">{opt.title}</p>
                      <p className="text-xs text-muted-foreground">{opt.note}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Offer Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Summer Sundae Special"
                />
              </div>

              {form.type === "coupon" ? (
                <div className="space-y-1.5">
                  <Label>Coupon Code</Label>
                  <div className="relative">
                    <Input
                      value={form.code}
                      onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                      placeholder="ICECREAMFREE"
                      className="pr-10 font-mono tracking-wide"
                    />
                    <Copy className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Offer Image</Label>
                <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#E2DFDE] bg-[#FCFAF7] text-center text-muted-foreground hover:border-brand-orange/50">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Click to upload or drag and drop</span>
                  <span className="text-xs">PNG, JPG up to 2MB</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Enjoy our signature gourmet sundae on the house with any ₹300 purchase."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <h2 className="text-base font-bold">Discount Configuration</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <div className="flex flex-wrap gap-2">
                  {DISCOUNT_TYPES.map((d) => (
                    <Pill key={d.value} active={form.discountType === d.value} onClick={() => set({ discountType: d.value })}>
                      {d.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {showItemPicker ? (
                  <div className="space-y-1.5">
                    <Label>Select Item</Label>
                    <Select value={form.item} onValueChange={(v) => set({ item: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it} value={it}>
                            {it}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>{form.discountType === "percent" ? "Discount (%)" : "Discount (₹)"}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.discountValue}
                      onChange={(e) => set({ discountValue: e.target.value })}
                      placeholder={form.discountType === "percent" ? "20" : "100"}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Minimum Order Value</Label>
                  <RupeeInput
                    value={form.minOrder}
                    onChange={(e) => set({ minOrder: e.target.value })}
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.validFrom} onChange={(e) => set({ validFrom: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={form.validTo} onChange={(e) => set({ validTo: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable For</Label>
                <div className="flex flex-wrap gap-2">
                  {APPLICABLE.map((a) => (
                    <Pill key={a.value} active={form.applicableFor === a.value} onClick={() => set({ applicableFor: a.value })}>
                      {a.label}
                    </Pill>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setForm(EMPTY)}>
                  Cancel
                </Button>
                <Button variant="outline">Save Draft</Button>
                <Button
                  onClick={publish}
                  disabled={saving}
                  className="bg-brand-gradient px-6 text-white hover:brightness-105"
                >
                  {saving ? "Publishing…" : "Publish Offer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div>
          <Card className="sticky top-6 overflow-hidden">
            <CardHeader className="pb-3">
              <h2 className="text-base font-bold">Live Preview</h2>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-dashed border-brand-orange/50">
                <div className="grid h-32 place-items-center bg-gradient-to-br from-brand-saffron to-brand-red text-white">
                  <ImagePlus className="h-7 w-7 opacity-80" />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-lg font-extrabold uppercase text-brand-red">
                    {form.name || "Your offer title"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {form.description || "Offer description appears here for customers."}
                  </p>
                  <div className="flex items-center justify-between border-t border-dashed border-brand-cream pt-2.5">
                    <span className="font-mono text-sm font-bold tracking-wider text-brand-orange">
                      {form.type === "coupon" ? form.code || "CODE" : "AUTO-APPLIED"}
                    </span>
                    {form.minOrder ? (
                      <span className="text-xs text-muted-foreground">Min. order ₹{form.minOrder}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {discountLabel({ discountType: form.discountType, discountValue: form.discountValue || 0 })} ·{" "}
                {APPLICABLE.find((a) => a.value === form.applicableFor)?.label}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active offers */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-base font-bold">Active Offers</h2>
            <p className="text-xs text-muted-foreground">Manage and track your ongoing restaurant promotions.</p>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search offers..."
            className="w-56"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Offer Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="pl-6">
                    <span className="font-semibold">{offer.name}</span>
                    {offer.code ? (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{offer.code}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{offer.type}</TableCell>
                  <TableCell className="font-medium">{discountLabel(offer)}</TableCell>
                  <TableCell className="text-muted-foreground">{validityLabel(offer)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[offer.status] ?? "muted"} className="uppercase">
                      {offer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" className="text-muted-foreground hover:text-brand-orange" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(offer.id)}
                        className="text-muted-foreground hover:text-brand-maroon"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No offers found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
