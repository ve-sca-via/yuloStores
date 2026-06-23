import { useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";

import WaiterLayout, { WaiterPageHeader } from "./WaiterLayout";

export default function WaiterSettings() {
  const navigate = useNavigate();

  return (
    <WaiterLayout>
      <WaiterPageHeader title="Settings" subtitle="Manage your waiter session." />

      <div className="px-5 py-5">
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-brand-cream/60 bg-white p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-gradient text-white">
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-cream bg-white py-3.5 text-sm font-bold text-brand-maroon hover:bg-brand-cream/20"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </WaiterLayout>
  );
}
