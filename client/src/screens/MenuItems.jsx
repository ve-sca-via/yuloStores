// Menu Items (/menu-items) — catalog view of all dishes with search, category
// and status filters, plus live availability toggle (PRD §8.1 MENU, §12 MGR-07).
// Data from the mock layer: GET /restaurant_owner/menu-items,
// PATCH /restaurant_owner/menu-items/:id.

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function MenuItems() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const navigate = useNavigate();

  function load() {
    requestJson("/restaurant_owner/menu-items")
      .then((payload) => setItems(payload.data.items))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function toggleAvailable(item) {
    setItems((current) =>
      current.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i)),
    );
    try {
      await requestJson(`/restaurant_owner/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !item.available }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const categories = useMemo(() => {
    const set = new Set((items ?? []).map((i) => i.category));
    return ["all", ...set];
  }, [items]);

  const visible = useMemo(() => {
    return (items ?? []).filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "all" || i.category === category;
      const matchesStatus =
        status === "all" ||
        (status === "available" && i.available) ||
        (status === "unavailable" && !i.available);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, category, status]);

  if (error && !items) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!items) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading menu items…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="text-sm text-muted-foreground">
            Browse the catalog and control item availability in real time.
          </p>
        </div>
        <Button
          onClick={() => navigate("/menu-management")}
          className="bg-brand-gradient text-white hover:brightness-105"
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes..."
            className="w-56 pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((mi) => (
          <Card key={mi.id} className="overflow-hidden">
            <div className="relative h-36">
              <img src={mi.image} alt={mi.name} className="h-full w-full object-cover" />
              <Badge
                className={cn(
                  "absolute left-3 top-3",
                  mi.foodType === "VEG"
                    ? "bg-[#E8F5EC] text-brand-green"
                    : "bg-[#FCE9E4] text-brand-maroon",
                )}
              >
                {mi.foodType}
              </Badge>
              {!mi.available ? (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-maroon">
                    UNAVAILABLE
                  </span>
                </div>
              ) : null}
            </div>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold leading-tight">{mi.name}</h3>
                  <p className="text-xs text-muted-foreground">{mi.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/menu-management")}
                  className="text-muted-foreground hover:text-brand-orange"
                  aria-label="Edit item"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-bold text-brand-red">{mi.price}</span>
                  <span className="text-xs text-muted-foreground">{mi.prep}</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] font-bold">
                  <span className={mi.available ? "text-brand-green" : "text-muted-foreground"}>
                    {mi.available ? "AVAILABLE" : "UNAVAILABLE"}
                  </span>
                  <Switch checked={mi.available} onCheckedChange={() => toggleAvailable(mi)} />
                </label>
              </div>
            </CardContent>
          </Card>
        ))}

        {visible.length === 0 ? (
          <Card className="sm:col-span-2 xl:col-span-3">
            <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <UtensilsCrossed className="h-8 w-8" />
              No items match your filters.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
