// Customer profile + order history — shows the verified mobile and past orders
// linked to it (PRD §5.2 CUST-11). Lets the customer track or re-open an order
// and log out (clears session + cart).

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, UserRound } from "lucide-react";

import { requestJson, storeToken } from "@/api";
import { cn } from "@/lib/utils";
import CustomerLayout, { formatPrice } from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function statusTone(status) {
  if (status === "completed" || status === "served") return "bg-[#E8F5EC] text-brand-green";
  if (status === "ready") return "bg-[#E7F0FB] text-[#1565C0]";
  if (status === "cancelled" || status === "rejected") return "bg-[#FCE9E4] text-brand-maroon";
  return "bg-brand-orange/10 text-brand-orange";
}

function formatWhen(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { session, setSession, clearCart } = useCustomer();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson(`/customer/orders?mobile=${encodeURIComponent(session.mobile)}`)
      .then((payload) => setOrders(payload.data.orders))
      .catch((err) => setError(err.message));
  }, [session.mobile]);

  function logout() {
    storeToken(null);
    clearCart();
    setSession({ verified: false, mobile: "", name: "", tableNumber: "", orderType: "dine-in" });
    navigate("/order", { replace: true });
  }

  return (
    <CustomerLayout title="Account" showNav activeNav="Account">
      <div className="space-y-5 px-5 py-5">
        {/* Identity */}
        <div className="flex items-center gap-4 rounded-2xl border border-brand-cream/70 bg-white p-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white">
            <UserRound className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-lg font-bold">{session.name || "Guest"}</h2>
            <p className="text-sm text-muted-foreground">+91 {session.mobile}</p>
          </div>
        </div>

        {/* Order history */}
        <div>
          <h3 className="mb-3 text-base font-bold">Order History</h3>
          {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}
          {!orders ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-brand-cream/70 bg-white p-8 text-center text-sm text-muted-foreground">
              No orders yet. Your past orders will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => navigate(`/order/status/${order.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-brand-cream/70 bg-white p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">#{order.id.slice(-6)}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold capitalize",
                          statusTone(order.orderStatus),
                        )}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {order.items.map((i) => `${i.quantity}× ${i.title}`).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatWhen(order.time)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-brand-red">{formatPrice(orderTotal(order))}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-cream py-3.5 text-sm font-bold text-brand-maroon"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </CustomerLayout>
  );
}
