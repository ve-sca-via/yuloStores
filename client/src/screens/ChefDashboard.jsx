// Chef Kitchen Dashboard (/chef) — Figma node 15:2. A full-width kitchen-display
// layout (no sidebar) showing live order cards the chef advances through
// preparation (PRD §10). Status changes write back to the shared order store, so
// they flow to the customer's live tracker and the owner's order views.

import { useEffect, useRef, useState } from "react";
import {
  AlarmClock,
  Ban,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Utensils,
} from "lucide-react";

import { requestJson } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STAT_META = [
  { key: "pending", label: "Pending Orders", icon: AlarmClock, tint: "bg-brand-orange/10 text-brand-orange" },
  { key: "preparing", label: "Preparing", icon: Flame, tint: "bg-[#FFF3E0] text-[#D9480F]" },
  { key: "ready", label: "Ready", icon: BellRing, tint: "bg-[#E8F5EC] text-brand-green" },
  { key: "completed", label: "Completed", icon: CheckCircle2, tint: "bg-[#E7F0FB] text-[#1565C0]" },
];

// Card status pill → label + colours.
const STATUS_PILL = {
  pending: { label: "Pending", className: "bg-brand-orange/10 text-brand-orange" },
  preparing: { label: "Preparing", className: "bg-[#FFF3E0] text-[#D9480F]" },
  ready: { label: "Ready", className: "bg-[#E8F5EC] text-brand-green" },
};

// Dropdown value → orderStatus written back to the store.
const ACTIONS = [
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
];

// Orders still in the kitchen past this many minutes are flagged delayed.
const DELAY_THRESHOLD_MIN = 15;

function minsSince(value) {
  return Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
}

function isDelayed(order) {
  return ["pending", "preparing"].includes(order.status) && minsSince(order.time) > DELAY_THRESHOLD_MIN;
}

function timeAgo(value) {
  const stamp = new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `${stamp} (${minsSince(value)}m ago)`;
}

function StatCard({ meta, value }) {
  const Icon = meta.icon;
  return (
    <div className="rounded-2xl border border-brand-cream/60 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-10 w-10 place-items-center rounded-full", meta.tint)}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-muted-foreground">{meta.label}</span>
      </div>
      <strong className="mt-3 block text-4xl font-bold leading-none">{value}</strong>
    </div>
  );
}

export default function ChefDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const timer = useRef(null);

  function load() {
    requestJson("/chef/dashboard")
      .then((payload) => setData(payload.data))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
    timer.current = window.setInterval(load, 6000);
    return () => window.clearInterval(timer.current);
  }, []);

  async function reportUnavailable(order, title) {
    try {
      await requestJson("/chef/item-unavailable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, orderId: order.id, table: order.table }),
      });
      setNotice(`Reported “${title}” unavailable — manager notified.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function setStatus(orderId, orderStatus) {
    try {
      await requestJson(`/chef/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] font-sans text-[#24190f]">
      <header className="flex items-center justify-between border-b border-brand-cream/60 bg-white px-8 py-5">
        <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
        <Avatar>
          <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-white">
            CH
          </AvatarFallback>
        </Avatar>
      </header>

      <div className="mx-auto max-w-[1280px] px-8 py-8">
        <p className="text-sm text-muted-foreground">
          Manage incoming orders and update preparation status.
        </p>

        {notice ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FFF6F1] px-3 py-2 text-sm text-[#9a3412]">
            <Ban className="h-4 w-4" /> {notice}
          </p>
        ) : null}
        {error ? <p className="mt-4 text-sm text-brand-maroon">{error}</p> : null}

        {/* Stats */}
        <section className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {STAT_META.map((meta) => (
            <StatCard key={meta.key} meta={meta} value={data?.counts[meta.key] ?? "—"} />
          ))}
          <StatCard
            meta={{ label: "Delayed", icon: AlarmClock, tint: "bg-[#FCE9E4] text-brand-maroon" }}
            value={data ? data.orders.filter(isDelayed).length : "—"}
          />
        </section>

        <h2 className="mb-4 mt-9 text-xl font-bold">Incoming Orders</h2>

        {!data ? (
          <p className="text-sm text-muted-foreground">Loading kitchen orders…</p>
        ) : data.orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-cream/60 bg-white py-16 text-muted-foreground">
            <Utensils className="h-8 w-8" />
            No active orders in the kitchen.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {data.orders.map((order) => {
              const pill = STATUS_PILL[order.status] ?? STATUS_PILL.pending;
              const delayed = isDelayed(order);
              return (
                <article
                  key={order.id}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                    delayed ? "border-brand-maroon/40 ring-1 ring-brand-maroon/30" : "border-brand-cream/60",
                  )}
                >
                  <div className="border-b border-brand-cream/60 p-4">
                    <div className="flex items-start justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <Utensils className="h-4 w-4" />
                        {order.table === "—" ? order.orderType : `T-${order.table}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {delayed ? <Badge variant="danger">DELAYED</Badge> : null}
                        <Badge className={pill.className}>{pill.label}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-2xl font-bold">#{order.number}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {timeAgo(order.time)}
                    </p>
                  </div>

                  <div className="flex-1 space-y-2.5 p-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex gap-3">
                          <span className="font-bold text-brand-orange">{item.quantity}x</span>
                          <span>{item.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => reportUnavailable(order, item.title)}
                          title="Report item unavailable"
                          aria-label={`Report ${item.title} unavailable`}
                          className="text-muted-foreground transition-colors hover:text-brand-maroon"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {order.instructions ? (
                      <div className="mt-3 rounded-lg bg-[#FFF6F1] p-3 text-xs text-[#9a3412]">
                        <p className="font-bold">! Special Instructions:</p>
                        <p className="mt-0.5">{order.instructions}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-brand-cream/60 p-3">
                    <Select
                      value={order.status === "pending" ? "preparing" : order.status}
                      onValueChange={(v) => setStatus(order.id, v)}
                    >
                      <SelectTrigger className="h-9 w-[130px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIONS.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      className="flex items-center gap-0.5 text-[13px] font-semibold text-brand-orange"
                    >
                      View Details <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
