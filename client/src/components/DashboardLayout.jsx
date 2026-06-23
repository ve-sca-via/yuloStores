// Shared shell for the owner-facing screens: Sidebar + top app bar + content.
// The top app bar chrome is identical across screens (Figma header 88px).

import { Bell } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const DEFAULT_PROFILE = {
  restaurantName: "Saffron Kitchen",
  userName: "Alex Mercer",
  role: "Owner",
};

export function Topbar({ profile = DEFAULT_PROFILE }) {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-brand-cream/60 bg-[#FAFAF8] px-5 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-brand-dark2" />
        <span className="text-xl font-bold text-brand-red">
          {profile.restaurantName}
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-brand-cream/60 bg-white text-[#5f5f5f]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-orange" />
        </button>
        <Avatar>
          <AvatarFallback className="bg-brand-gradient text-xs font-semibold text-white">
            {profile.userName.split(" ").map((w) => w[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">{profile.userName}</span>
          <span className="text-xs text-muted-foreground">{profile.role}</span>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children, profile }) {
  return (
    <div className="flex min-h-screen bg-brand-page font-sans text-[#24190f]">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col gap-5 p-6 pb-12 lg:px-7">
        <Topbar profile={profile} />
        {children}
      </main>
    </div>
  );
}
