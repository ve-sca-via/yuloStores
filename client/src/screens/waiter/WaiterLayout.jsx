// Light-sidebar shell for the Waiter portal — Figma node 17:513. Distinct from
// the owner's dark sidebar: white surface, Home/Orders/Menu/Settings, and a
// "Quick Order" CTA that jumps to the menu.

import { useLocation, useNavigate } from "react-router-dom";
import { BellRing, Home, ReceiptText, Settings, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { to: "/waiter", label: "Home", icon: Home, exact: true },
  { to: "/waiter/orders", label: "Orders", icon: ReceiptText },
  { to: "/waiter/requests", label: "Requests", icon: BellRing },
  { to: "/waiter/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/waiter/settings", label: "Settings", icon: Settings },
];

export function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function WaiterLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <div className="flex min-h-screen bg-[#FAFAF8] font-sans text-[#24190f]">
      <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-brand-cream/60 bg-white px-4 py-6">
        <div className="flex items-center gap-3 px-2">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
            BE
          </span>
          <div>
            <p className="font-bold leading-tight">Bistro Elite</p>
            <p className="text-xs text-muted-foreground">Terminal 4</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-gradient text-white"
                    : "text-[#5a403e] hover:bg-brand-cream/30",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => navigate("/waiter/menu")}
          className="rounded-full bg-brand-gradient py-3 text-sm font-bold text-white transition hover:brightness-105"
        >
          Quick Order
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-7">{children}</main>
    </div>
  );
}
