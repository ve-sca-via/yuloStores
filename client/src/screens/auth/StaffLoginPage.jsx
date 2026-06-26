import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Search, UtensilsCrossed, X } from "lucide-react";
import { useStaffAuth } from "@/context/StaffAuthContext";
import client from "@/api/client";

// Search restaurants by name using the public ?q= endpoint
async function searchRestaurants(q) {
  if (!q.trim()) return [];
  const { data } = await client.get("/restaurants", { params: { q: q.trim() } });
  return data.data.restaurants ?? [];
}

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login } = useStaffAuth();

  // Step 1: restaurant search
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [selected, setSelected]     = useState(null); // { _id, name }
  const [showDrop, setShowDrop]     = useState(false);
  const debounceRef                 = useRef(null);

  // Step 2: Staff Code + PIN
  const [staffCode, setStaffCode] = useState("");
  const [pin, setPin]             = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  // Debounced search
  useEffect(() => {
    if (selected) return; // already selected, don't re-search
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await searchRestaurants(query);
        setResults(list);
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query, selected]);

  function pickRestaurant(r) {
    setSelected(r);
    setQuery(r.name);
    setShowDrop(false);
    setResults([]);
    setError("");
  }

  function clearRestaurant() {
    setSelected(null);
    setQuery("");
    setStaffCode("");
    setPin("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected)           { setError("Pehle restaurant select karo"); return; }
    if (!staffCode.trim())   { setError("Staff Code daalo (e.g. W01, C02)"); return; }
    if (pin.length < 4)      { setError("PIN kam se kam 4 digits ka hona chahiye"); return; }
    setError("");
    setLoading(true);
    try {
      const staff = await login({ restaurantId: selected._id, staffCode: staffCode.trim().toUpperCase(), pin });
      // Redirect based on role
      if (staff.role === "waiter") navigate("/waiter", { replace: true });
      else if (staff.role === "chef") navigate("/chef", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Yulo Stores</h1>
          <p className="mt-1 text-sm text-gray-400">Staff Login</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* ── Step 1: Restaurant Search ── */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                Restaurant
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                  placeholder="Restaurant ka naam likho…"
                  autoComplete="off"
                  disabled={!!selected}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-gray-500 disabled:opacity-70"
                />
                {selected && (
                  <button
                    type="button"
                    onClick={clearRestaurant}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {searching && !selected && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    …
                  </span>
                )}

                {/* Dropdown */}
                {showDrop && results.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-700 bg-gray-800 shadow-lg">
                    {results.map((r) => (
                      <li key={r._id}>
                        <button
                          type="button"
                          onClick={() => pickRestaurant(r)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-gray-700"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold">
                            {r.name?.[0]?.toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium">{r.name}</p>
                            {r.address?.city && (
                              <p className="text-xs text-gray-400">{r.address.city}</p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showDrop && results.length === 0 && !searching && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-400">
                    Koi restaurant nahi mila
                  </div>
                )}
              </div>

              {/* Selected badge */}
              {selected && (
                <p className="mt-2 text-xs text-green-400">
                  ✓ {selected.name} selected
                </p>
              )}
            </div>

            {/* ── Step 2: Staff Code + PIN (only after restaurant selected) ── */}
            {selected && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Staff Code
                  </label>
                  <input
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                    placeholder="W01 ya C02"
                    autoFocus
                    required
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-gray-500 outline-none focus:border-gray-500"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Waiter = W01, W02… · Chef = C01, C02…
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="4–8 digit PIN"
                    required
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-center text-lg tracking-[0.4em] text-white placeholder-gray-500 outline-none focus:border-gray-500"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="rounded-xl bg-red-950/60 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !selected}
              className="mt-2 w-full rounded-xl bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 disabled:opacity-40"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          {/* Role info */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-800 pt-5">
            <div className="flex items-center gap-2 rounded-xl bg-gray-800/60 px-3 py-2.5 text-xs text-gray-400">
              <ChefHat className="h-4 w-4 shrink-0 text-orange-400" />
              Chef → Kitchen Display
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-gray-800/60 px-3 py-2.5 text-xs text-gray-400">
              <UtensilsCrossed className="h-4 w-4 shrink-0 text-blue-400" />
              Waiter → Table Orders
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Owner?{" "}
          <a href="/owner/login" className="font-medium text-gray-400 hover:underline">
            Owner portal →
          </a>
        </p>
      </div>
    </div>
  );
}
