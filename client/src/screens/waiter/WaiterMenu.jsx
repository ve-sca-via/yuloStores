// Waiter Menu display (/waiter/menu) — Figma node 17:513. Category tabs and a
// dish list with Add buttons that build the running order for the active table
// (PRD §11 WAIT-06). Adds flow into the shared waiter cart shown on the dashboard.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { requestJson } from "@/api";
import { cn } from "@/lib/utils";
import { VegDot } from "@/screens/customer/CustomerLayout";
import WaiterLayout, { formatPrice } from "./WaiterLayout";
import { useWaiter } from "./WaiterApp";

export default function WaiterMenu() {
  const navigate = useNavigate();
  const { activeTable, cartCount, addToCart } = useWaiter();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    requestJson("/waiter/menu-display")
      .then((payload) => {
        setData(payload.data);
        setActiveCategory(payload.data.categories.find((c) => c !== "Recommended") ?? payload.data.categories[0]);
      })
      .catch((err) => setError(err.message));
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.items.filter((item) => {
      const inCategory = activeCategory === "Recommended" ? item.popular : item.category === activeCategory;
      const matchesSearch = !term || item.name.toLowerCase().includes(term);
      return inCategory && matchesSearch;
    });
  }, [data, activeCategory, search]);

  if (error && !data) {
    return (
      <WaiterLayout>
        <p className="text-sm text-muted-foreground">Failed to load: {error}</p>
      </WaiterLayout>
    );
  }
  if (!data) {
    return (
      <WaiterLayout>
        <p className="text-sm text-muted-foreground">Loading menu…</p>
      </WaiterLayout>
    );
  }

  return (
    <WaiterLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Menu</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-64 rounded-full border border-brand-cream/80 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-orange"
            />
          </div>
          <button
            type="button"
            onClick={() => navigate("/waiter")}
            className="rounded-full bg-brand-orange/10 px-4 py-2.5 text-sm font-bold text-brand-orange"
          >
            {activeTable} · {cartCount} item{cartCount === 1 ? "" : "s"}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mt-5 flex gap-6 overflow-x-auto border-b border-brand-cream/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              "shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors",
              activeCategory === category
                ? "border-brand-orange font-bold text-brand-orange"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Section */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-brand-cream/60 bg-white">
        <div className="flex items-center justify-between border-b border-brand-cream/60 bg-[#FAFAF8] px-5 py-4">
          <h2 className="text-lg font-bold">{activeCategory}</h2>
          <span className="text-sm text-muted-foreground">{items.length} items</span>
        </div>
        <div className="divide-y divide-brand-cream/60">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <VegDot type={item.foodType} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
              </div>
              {item.available ? (
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  className="rounded-full bg-brand-orange px-6 py-2 text-sm font-bold text-white hover:bg-brand-orange/90"
                >
                  Add
                </button>
              ) : (
                <span className="rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-bold text-muted-foreground">
                  Unavailable
                </span>
              )}
            </div>
          ))}
          {items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No dishes in this category.</p>
          ) : null}
        </div>
      </div>
    </WaiterLayout>
  );
}
