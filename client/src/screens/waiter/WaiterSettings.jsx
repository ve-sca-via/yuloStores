// Waiter Settings (/waiter/settings) — lightweight profile + session controls.

import { useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";

import WaiterLayout from "./WaiterLayout";

export default function WaiterSettings() {
  const navigate = useNavigate();

  return (
    <WaiterLayout>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your waiter session.</p>

      <div className="mt-6 max-w-lg space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-brand-cream/60 bg-white p-5">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-gradient text-white">
            <UserRound className="h-7 w-7" />
          </span>
          <div>
            <p className="text-lg font-bold">Sunil Verma</p>
            <p className="text-sm text-muted-foreground">Waiter · ID waiter01 · Terminal 4</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-cream py-3.5 text-sm font-bold text-brand-maroon"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </WaiterLayout>
  );
}
