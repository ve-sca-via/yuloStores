import { useEffect, useState } from "react";

import { requestJson } from "@/api";
import { cn } from "@/lib/utils";
import WaiterLayout, { WaiterPageHeader, formatPrice } from "./WaiterLayout";

function statusTone(status) {
  if (status === "Ready to serve" || status === "Preparing") return "bg-[#FFF3E0] text-[#D9480F]";
  if (status === "Paid & Clearing" || status === "Served") return "bg-[#E8F5EC] text-brand-green";
  return "bg-[#F3F4F6] text-[#5F5F5F]";
}

export default function WaiterOrders() {
  const [tables, setTables] = useState(null);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  function load() {
    requestJson("/waiter/tables")
      .then((payload) => setTables(payload.data.tables))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function markServed(orderId) {
    try {
      await requestJson(`/restaurant_owner/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "served" }),
      });
      setStatusMsg("Order marked served");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <WaiterLayout>
      <WaiterPageHeader
        title="Active Orders"
        subtitle="Track table orders and mark them served once delivered."
      />

      <div className="px-5 py-5">
        {statusMsg && <p className="mb-4 text-sm text-brand-green">{statusMsg}</p>}
        {error && <p className="mb-4 text-sm text-brand-maroon">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!tables ? (
            <p className="col-span-2 text-sm text-muted-foreground">Loading orders…</p>
          ) : tables.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-brand-cream/60 bg-white py-14 text-center text-sm text-muted-foreground">
              No active orders.
            </div>
          ) : (
            tables.map((row) => (
              <div key={row.table} className="rounded-2xl border border-brand-cream/60 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {row.table === "—" ? "Counter" : `Table T-${row.table}`}
                  </span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", statusTone(row.status))}>
                    {row.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{row.items}</p>
                <div className="mt-4 flex items-center justify-between border-t border-brand-cream/60 pt-3">
                  <span className="font-bold text-brand-red">{formatPrice(row.total)}</span>
                  <button
                    type="button"
                    onClick={() => markServed(row.orderId)}
                    className="rounded-full bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/90"
                  >
                    Mark Served
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WaiterLayout>
  );
}
