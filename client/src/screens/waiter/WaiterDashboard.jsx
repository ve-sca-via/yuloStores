import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, CheckCircle2, QrCode, UtensilsCrossed, XCircle } from "lucide-react";

import { requestJson } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import WaiterLayout from "./WaiterLayout";
import { useWaiter } from "./WaiterApp";

const FILTERS = ["All Orders", "Preparing", "Ready To Serve", "Served", "Bill Requested", "Completed"];

/* ── Derive batches from flat items array ── */
function toBatches(items, size = 3) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function batchStatus(batchIndex, batchCount, orderStatus) {
  const s = (orderStatus ?? "").toLowerCase();
  if (s === "cancelled") return "CANCELLED";
  if (s === "ready" || s === "served" || s === "completed") return "PREPARED";
  if (s === "preparing") return batchIndex < batchCount - 1 ? "PREPARED" : "PREPARING";
  return "PREPARING";
}

function BatchIcon({ status }) {
  if (status === "PREPARED")
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "CANCELLED")
    return <XCircle className="h-4 w-4 text-brand-maroon" />;
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-orange bg-white">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
    </span>
  );
}

function BatchStatusBadge({ status }) {
  if (status === "PREPARED")
    return <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">PREPARED</span>;
  if (status === "CANCELLED")
    return <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-maroon">CANCELLED</span>;
  return <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-orange">PREPARING</span>;
}

function orderStatusLabel(orderStatus, paymentStatus) {
  if (paymentStatus === "paid") return { label: "Completed", color: "text-muted-foreground" };
  const s = (orderStatus ?? "").toLowerCase();
  if (s === "ready") return { label: "Ready To Serve", color: "text-emerald-600" };
  if (s === "served") return { label: "Served", color: "text-emerald-600" };
  if (s === "cancelled") return { label: "Cancelled", color: "text-brand-maroon" };
  return { label: "Preparing", color: "text-brand-orange" };
}

function statusDot(color) {
  const map = {
    "text-emerald-600": "bg-emerald-500",
    "text-brand-orange": "bg-brand-orange",
    "text-brand-maroon": "bg-brand-maroon",
    "text-muted-foreground": "bg-gray-400",
  };
  return map[color] ?? "bg-gray-400";
}

function matchesFilter(order, filter) {
  if (filter === "All Orders") return true;
  const s = (order.orderStatus ?? "").toLowerCase();
  const p = (order.paymentStatus ?? "").toLowerCase();
  if (filter === "Preparing") return s === "new" || s === "preparing";
  if (filter === "Ready To Serve") return s === "ready";
  if (filter === "Served") return s === "served";
  if (filter === "Bill Requested") return p === "requested";
  if (filter === "Completed") return p === "paid" || s === "completed";
  return true;
}

/* ── Single order card ── */
function OrderCard({ order, onAction }) {
  const navigate = useNavigate();
  const { setActiveTable, clearCart, addToCart, setQuantity } = useWaiter();
  const batches = toBatches(order.items);

  function handleModify() {
    clearCart();
    setActiveTable(`T-${order.tableNumber}`);
    for (const item of order.items) {
      addToCart({ id: item.id, name: item.title, price: item.price ?? 0, foodType: "veg" });
      if (item.quantity > 1) setQuantity(item.id, item.quantity);
    }
    navigate("/waiter/menu");
  }

  function handleAddItems() {
    setActiveTable(`T-${order.tableNumber}`);
    navigate("/waiter/menu");
  }
  const { label, color } = orderStatusLabel(order.orderStatus, order.paymentStatus);
  const total = order.items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const billRequested = (order.paymentStatus ?? "") === "requested";
  const paid = (order.paymentStatus ?? "") === "paid";

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-cream/60 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-brand-cream/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="rounded-lg bg-[#FFF0E6] px-3 py-1.5 text-sm font-bold text-brand-orange">
            T-{order.tableNumber}
          </span>
          <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-brand-orange">
            Dine-In
          </span>
          <span className={cn("flex items-center gap-1.5 text-sm font-semibold", color)}>
            <span className={cn("h-2 w-2 rounded-full", statusDot(color))} />
            {label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {batches.length} Batches Total
          </p>
          <p className="text-base font-bold text-[#24190f]">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Batches */}
      <div className="divide-y divide-brand-cream/40 px-5">
        {batches.map((batch, bIdx) => {
          const bStatus = batchStatus(bIdx, batches.length, order.orderStatus);
          const cancelled = bStatus === "CANCELLED";
          return (
            <div key={bIdx} className="py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BatchIcon status={bStatus} />
                  <span className={cn("text-sm font-bold uppercase tracking-wide", cancelled ? "text-muted-foreground" : "")}>
                    Batch {String(bIdx + 1).padStart(2, "0")}
                  </span>
                </div>
                <BatchStatusBadge status={bStatus} />
              </div>
              <div className="space-y-2">
                {batch.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className={cn(
                      "flex items-center justify-between text-sm",
                      cancelled && "opacity-50",
                    )}
                  >
                    <span className="text-[#24190f]">
                      {item.quantity}x {item.title}
                    </span>
                    {item.price != null && (
                      <span className="font-medium text-[#24190f]">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-px border-t border-brand-cream/50 bg-brand-cream/30">
        <button
          type="button"
          onClick={handleAddItems}
          className="bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20 first:rounded-bl-2xl"
        >
          Add Items
        </button>
        <button
          type="button"
          onClick={handleModify}
          className="bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20"
        >
          Modify Order
        </button>
        <button
          type="button"
          onClick={() => onAction(order.id, "served")}
          className="flex items-center justify-center gap-1.5 bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20"
        >
          <CheckCheck className="h-4 w-4" /> Mark As Served
        </button>
        {paid ? (
          <button
            type="button"
            disabled
            className="rounded-br-2xl bg-white px-3 py-3.5 text-sm font-semibold text-muted-foreground"
          >
            Paid
          </button>
        ) : billRequested ? (
          <button
            type="button"
            onClick={() => navigate("/waiter/orders")}
            className="rounded-br-2xl border border-brand-maroon bg-white px-3 py-3.5 text-sm font-bold text-brand-maroon transition hover:bg-brand-maroon/5"
          >
            View Bill
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction(order.id, "requested", true)}
            className="rounded-br-2xl bg-white px-3 py-3.5 text-sm font-semibold text-[#24190f] transition hover:bg-brand-cream/20"
          >
            Request Bill
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function WaiterDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTable, setActiveTable] = useState("T-12");
  const [filter, setFilter] = useState("All Orders");
  const [error, setError] = useState("");

  function load() {
    requestJson("/restaurant_owner/orders")
      .then((payload) => {
        const active = (payload.data?.orders ?? []).filter(
          (o) => o.tableNumber && o.paymentStatus !== "paid",
        );
        setOrders(active);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => { load(); }, []);

  async function handleAction(orderId, status, isPayment = false) {
    try {
      if (isPayment) {
        await requestJson(`/waiter/orders/${orderId}/payment`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: status }),
        });
      } else {
        await requestJson(`/chef/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderStatus: status }),
        });
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = orders.filter((o) => matchesFilter(o, filter));

  return (
    <WaiterLayout>
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-brand-cream/60 bg-[#FAFAF8] px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-brand-red">Saffron Kitchen</p>
            <p className="text-xs text-muted-foreground">Waiter Dashboard</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand-gradient text-xs font-bold text-white">AM</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Alen Mercy</span>
              <span className="text-[10px] text-muted-foreground">Waiter</span>
            </div>
          </div>
        </div>
      </header>

      {/* Table context bar */}
      <div className="flex items-center justify-between border-b border-brand-cream/50 bg-[#FAFAF8] px-6 py-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4" />
          Table {activeTable}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2 text-sm font-bold text-white hover:brightness-105"
          >
            <QrCode className="h-4 w-4" /> Scan QR
          </button>
          <button
            type="button"
            className="rounded-xl border border-brand-cream/80 bg-white px-3.5 py-2 text-sm font-semibold text-[#24190f] hover:bg-brand-cream/20"
          >
            Select Table
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] px-5 py-5">
        {/* Filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                filter === f
                  ? "border-brand-maroon bg-white text-brand-maroon"
                  : "border-brand-cream/70 bg-white text-[#5a403e] hover:border-brand-maroon/40 hover:text-brand-maroon",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-brand-maroon">{error}</p>
        )}

        {/* Order cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-brand-cream/60 bg-white py-14 text-center text-sm text-muted-foreground">
            No orders for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </WaiterLayout>
  );
}
