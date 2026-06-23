// Waiter Dashboard (/waiter) — Figma node 17:362. Table selection (manual/scan),
// a running order summary built on the Menu screen, and an active-tables billing
// list (PRD §11 WAIT-02/04/06). Placing the order writes to the shared store and
// flows into the kitchen + owner views.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, QrCode, Send } from "lucide-react";

import { requestJson } from "@/api";
import { cn } from "@/lib/utils";
import WaiterLayout, { formatPrice } from "./WaiterLayout";
import { useWaiter } from "./WaiterApp";

function statusTone(status) {
  if (status === "Ready to serve") return "bg-[#FFF3E0] text-[#D9480F]";
  if (status === "Preparing") return "bg-[#FFF3E0] text-[#D9480F]";
  if (status === "Paid & Clearing" || status === "Served") return "bg-[#E8F5EC] text-brand-green";
  return "bg-[#F3F4F6] text-[#5F5F5F]";
}

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const { activeTable, setActiveTable, cart, subtotal, setQuantity, clearCart } = useWaiter();
  const [tableInput, setTableInput] = useState("");
  const [tables, setTables] = useState([]);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [status, setStatus] = useState("");

  function loadTables() {
    requestJson("/waiter/tables")
      .then((payload) => setTables(payload.data.tables))
      .catch((err) => setError(err.message));
  }

  useEffect(loadTables, []);

  const taxes = Math.round(subtotal * 0.08);
  const total = subtotal + taxes;

  function applyTable(event) {
    event.preventDefault();
    if (!tableInput.trim()) return;
    setActiveTable(tableInput.trim().toUpperCase());
    setTableInput("");
  }

  async function placeOrder() {
    if (placing || cart.length === 0) return;
    setPlacing(true);
    setStatus("");
    try {
      await requestJson("/waiter/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: activeTable.replace(/^T-?/i, ""),
          items: cart.map((line) => ({ id: line.id, quantity: line.quantity })),
        }),
      });
      clearCart();
      loadTables();
      setStatus(`Order placed for ${activeTable}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <WaiterLayout>
      <div>
        <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Place orders on behalf of customers and generate bills.
        </p>
      </div>

      {/* Table selection */}
      <div className="mt-6 rounded-2xl border border-brand-cream/60 bg-white p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <div className="grid h-44 place-items-center rounded-xl border-2 border-dashed border-brand-orange/40 bg-[#F4F2F0]">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <QrCode className="h-9 w-9" />
              <span className="text-sm">Position QR Code within frame</span>
            </div>
          </div>

          <div>
            <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={applyTable}>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium">Manual Table Entry</label>
                <input
                  value={tableInput}
                  onChange={(e) => setTableInput(e.target.value)}
                  placeholder="e.g. T-12"
                  className="w-full rounded-xl border border-brand-cream/80 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-orange"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-orange/90"
              >
                Scan QR
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-brand-green/40 bg-[#EAF7EE] px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-brand-green">
                <CheckCircle2 className="h-4 w-4" />
                Table {activeTable} | Active Session
              </span>
              <button
                type="button"
                onClick={() => navigate("/waiter/menu")}
                className="text-sm font-semibold text-brand-green underline"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live order summary */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-brand-cream/60 bg-white">
        <div className="flex items-center justify-between border-b border-brand-cream/60 px-5 py-4">
          <h2 className="text-xl font-bold">Live Order Summary</h2>
          <span className="rounded-lg bg-[#FCE9E4] px-3 py-1 text-sm font-bold text-brand-red">
            {activeTable}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No items yet. Add dishes from the{" "}
            <button type="button" onClick={() => navigate("/waiter/menu")} className="font-semibold text-brand-orange">
              Menu
            </button>{" "}
            to build this order.
          </div>
        ) : (
          <>
            <div className="divide-y divide-brand-cream/60">
              {cart.map((line) => (
                <div key={line.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-brand-cream px-2 py-1">
                      <button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)} className="text-brand-orange">−</button>
                      <span className="w-5 text-center text-sm font-bold">{line.quantity}</span>
                      <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} className="text-brand-orange">+</button>
                    </div>
                    <div>
                      <p className="font-semibold">{line.name}</p>
                      <button type="button" className="text-xs text-muted-foreground">+ Add note</button>
                    </div>
                  </div>
                  <span className="font-semibold">{formatPrice(line.price * line.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 bg-[#FCFAF7] px-5 py-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes (8%)</span>
                <span className="text-foreground">{formatPrice(taxes)}</span>
              </div>
              <div className="flex justify-between border-t border-brand-cream/60 pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-brand-red">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="p-4">
              <button
                type="button"
                onClick={placeOrder}
                disabled={placing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {placing ? "Placing…" : "Place Order"}
              </button>
            </div>
          </>
        )}
      </div>

      {status ? <p className="mt-3 text-sm text-brand-green">{status}</p> : null}
      {error ? <p className="mt-3 text-sm text-brand-maroon">{error}</p> : null}

      {/* Active tables & billing */}
      <h2 className="mb-3 mt-9 text-xl font-bold">Active Tables &amp; Billing</h2>
      <div className="overflow-hidden rounded-2xl border border-brand-cream/60 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-cream/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Table</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Items</th>
              <th className="px-5 py-3 font-semibold">Total Amount</th>
              <th className="px-5 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/60">
            {tables.map((row) => (
              <tr key={row.table}>
                <td className="px-5 py-4 font-bold">{row.table === "—" ? "—" : `T-${row.table}`}</td>
                <td className="px-5 py-4">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusTone(row.status))}>
                    {row.status}
                  </span>
                </td>
                <td className="max-w-[260px] truncate px-5 py-4 text-muted-foreground">{row.items}</td>
                <td className="px-5 py-4 font-bold">{formatPrice(row.total)}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/waiter/orders")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-orange/90"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Bill
                  </button>
                </td>
              </tr>
            ))}
            {tables.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  No active tables.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </WaiterLayout>
  );
}
