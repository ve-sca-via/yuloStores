// SideNavBar — Figma node 188:3080. Tailwind + lucide-react.
// Navigation is wired to react-router: active state derives from the URL.

import { useLocation, useNavigate } from "react-router-dom";
import {
  BookOpenText,
  LayoutDashboard,
  LogOut,
  QrCode,
  ReceiptText,
  Store,
  Tag,
  UserRound,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/qr", label: "QR Management", icon: QrCode },
  { to: "/offers", label: "Offers & coupons", icon: Tag },
];

const SECTIONS = [
  {
    title: "Orders",
    items: [
      { to: "/orders", label: "Manage Orders", icon: ReceiptText },
      { to: "/cancellations", label: "Cancellations", icon: XCircle },
    ],
  },
  {
    title: "Menu",
    items: [
      { to: "/menu-items", label: "Menu Items", icon: UtensilsCrossed },
      { to: "/menu-management", label: "Menu management", icon: BookOpenText },
    ],
  },
  {
    title: "Store",
    items: [{ to: "/store-settings", label: "Store Settings", icon: Store }],
  },
  {
    title: "Account",
    items: [{ to: "/profile", label: "Profile", icon: UserRound }],
  },
];

function isActive(pathname, to) {
  if (to === "/dashboard") return pathname === "/" || pathname === "/dashboard";
  return pathname === to;
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-lg px-4 py-2 text-left text-sm font-medium text-brand-cream transition-colors hover:bg-brand-cream/10",
        active && "bg-brand-gradient text-white hover:opacity-95",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
      <span>{label}</span>
    </button>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col justify-between overflow-y-auto bg-sidebar-gradient shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-3 px-6 pb-8 pt-6">
        <span className="h-10 w-10 shrink-0 rounded-full bg-brand-gradient" />
        <span className="text-xl text-brand-cream2">Yulo Stores</span>
      </div>

      <nav className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          {PRIMARY_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                type="button"
                onClick={() => navigate(link.to)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-bold transition",
                  isActive(pathname, link.to)
                    ? "bg-brand-gradient text-white hover:brightness-105"
                    : "bg-brand-gradient text-white hover:brightness-105",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <p className="px-4 text-[11px] uppercase tracking-wide text-brand-cream/50">
              {section.title}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(pathname, item.to)}
                  onClick={() => navigate(item.to)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-brand-cream/10 p-4">
        <NavItem icon={LogOut} label="Logout" onClick={() => navigate("/")} />
      </div>
    </aside>
  );
}
