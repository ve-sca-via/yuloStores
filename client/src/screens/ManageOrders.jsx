// Manage Orders (/orders) — live order dashboard with status filters and
// workflow actions (PRD §9 Order Lifecycle, §13 OWN-03). Data from the mock
// layer: GET /restaurant_owner/orders, PATCH /restaurant_owner/orders/:id/status.

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Forward workflow: each status maps to the next action label + target status.
const NEXT_STEP = {
  new: { label: "Accept", to: "accepted" },
  accepted: { label: "Start Preparing", to: "preparing" },
  preparing: { label: "Mark Ready", to: "ready" },
  ready: { label: "Mark Served", to: "served" },
  served: { label: "Complete", to: "completed" },
};

const FILTERS = ["all", "new", "accepted", "preparing", "ready", "served", "completed"];

function statusVariant(status) {
  const key = (status ?? "").toLowerCase();
  if (key === "completed" || key === "served") return "ok";
  if (key === "ready") return "info";
  if (key === "preparing" || key === "accepted") return "warn";
  if (key === "new") return "muted";
  if (key === "cancelled" || key === "rejected") return "danger";
  return "muted";
}

function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatPill({ label, value, tone }) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <strong className={cn("mt-1.5 block text-2xl font-bold", tone)}>{value}</strong>
      </CardContent>
    </Card>
  );
}

export default function ManageOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  function load() {
    requestJson("/restaurant_owner/orders")
      .then((payload) => setOrders(payload.data.orders))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function advance(order) {
    const step = NEXT_STEP[order.orderStatus];
    if (!step) return;
    setOrders((current) =>
      current.map((o) => (o.id === order.id ? { ...o, orderStatus: step.to } : o)),
    );
    try {
      await requestJson(`/restaurant_owner/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: step.to }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const counts = useMemo(() => {
    const list = orders ?? [];
    return {
      total: list.length,
      new: list.filter((o) => o.orderStatus === "new").length,
      preparing: list.filter((o) => o.orderStatus === "preparing").length,
      ready: list.filter((o) => o.orderStatus === "ready").length,
      completed: list.filter((o) => o.orderStatus === "completed").length,
    };
  }, [orders]);

  const visible = useMemo(() => {
    const list = orders ?? [];
    return filter === "all" ? list : list.filter((o) => o.orderStatus === filter);
  }, [orders, filter]);

  if (error && !orders) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!orders) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading orders…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Orders</h1>
          <p className="text-sm text-muted-foreground">
            Monitor live orders and move them through the kitchen workflow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatPill label="Total Orders" value={counts.total} />
        <StatPill label="New" value={counts.new} tone="text-[#5F5F5F]" />
        <StatPill label="Preparing" value={counts.preparing} tone="text-brand-orange" />
        <StatPill label="Ready" value={counts.ready} tone="text-[#1565C0]" />
        <StatPill label="Completed" value={counts.completed} tone="text-brand-green" />
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
              filter === f
                ? "bg-brand-gradient text-white"
                : "border border-brand-cream bg-white text-[#5a403e] hover:bg-brand-cream/30",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((order) => {
                const step = NEXT_STEP[order.orderStatus];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6 font-semibold">
                      #{order.id.slice(-6)}
                    </TableCell>
                    <TableCell>{order.tableNumber}</TableCell>
                    <TableCell className="max-w-[260px] text-muted-foreground">
                      {order.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPrice(orderTotal(order))}</TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(order.time)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.orderStatus)} className="capitalize">
                        {order.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === "paid" ? "ok" : "muted"} className="capitalize">
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {step ? (
                        <Button
                          size="sm"
                          onClick={() => advance(order)}
                          className="bg-brand-orange text-white hover:bg-brand-orange/90"
                        >
                          {step.label}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No orders in this view.
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
