// Manager · Live Monitoring (/manager/live) — Figma node 173:544. A purchase-
// intent command center: real-time activity stats, active carts the manager can
// target with an offer, and repeat-customer loyalty (PRD §12, §17 instant offers).

import { useEffect, useState } from "react";
import {
  Eye,
  IndianRupee,
  QrCode,
  ShoppingBag,
  Upload,
  Users,
} from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const MANAGER_PROFILE = { restaurantName: "Saffron Kitchen", userName: "Alex Mercy", role: "Manager" };

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const STAT_META = [
  { key: "activeVisitors", label: "Active Visitors", icon: Users, fmt: (v) => v },
  { key: "itemsViewed", label: "Items Viewed", icon: Eye, fmt: (v) => v },
  { key: "ordersPlaced", label: "Orders Placed", icon: ShoppingBag, fmt: (v) => v },
  { key: "liveRevenue", label: "Live Revenue", icon: IndianRupee, fmt: formatPrice },
  { key: "qrScans", label: "QR Scans", icon: QrCode, fmt: (v) => v },
];

function IntentScore({ score }) {
  const tone = score >= 80 ? "bg-brand-green" : score >= 60 ? "bg-brand-saffron" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-brand-cream/70">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold">{score}%</span>
    </div>
  );
}

export default function ManagerLiveMonitoring() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson("/manager/live-monitoring")
      .then((payload) => setData(payload.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error && !data) {
    return (
      <DashboardLayout profile={MANAGER_PROFILE}>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!data) {
    return (
      <DashboardLayout profile={MANAGER_PROFILE}>
        <p className="text-muted-foreground">Loading live monitoring…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout profile={MANAGER_PROFILE}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time customer activity across your restaurant ecosystem.
          </p>
        </div>
        <Button className="gap-2 bg-brand-gradient text-white hover:brightness-105">
          <Upload className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STAT_META.map((meta) => {
          const Icon = meta.icon;
          return (
            <Card key={meta.key}>
              <CardContent className="p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-orange/10 text-brand-orange">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <strong className="mt-3 block text-2xl font-bold leading-none">
                  {meta.fmt(data.stats[meta.key])}
                </strong>
                <span className="mt-1 block text-[11px] uppercase tracking-wide text-muted-foreground">
                  {meta.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Active visitors */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-base font-bold">Active Visitors</h2>
            <p className="text-xs text-muted-foreground">
              Customers who added items to cart and are actively customizing a purchase.
            </p>
          </div>
          <Button size="sm" className="bg-brand-gradient text-white hover:brightness-105">
            Create Targeted Offer
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Interested In</TableHead>
                <TableHead>Cart Value</TableHead>
                <TableHead>Time Active</TableHead>
                <TableHead>Intent Score</TableHead>
                <TableHead className="pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activeVisitors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="pl-6 font-semibold">{v.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{v.phone}</div>
                    <div>{v.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {v.interestedIn.map((item) => (
                        <span key={item} className="rounded bg-brand-orange/10 px-1.5 py-0.5 text-[11px] font-medium text-brand-orange">
                          {item}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-brand-red">{formatPrice(v.cartValue)}</TableCell>
                  <TableCell className="text-muted-foreground">{v.timeActive} ago</TableCell>
                  <TableCell><IntentScore score={v.intentScore} /></TableCell>
                  <TableCell className="pr-6 text-right">
                    <button type="button" className="text-[13px] font-semibold text-brand-orange">
                      View Details
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Repeat visitors */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-base font-bold">Repeat Visitors</h2>
            <p className="text-xs text-muted-foreground">
              Reward your top repeat customers with a special “Thank You” discount to drive retention.
            </p>
          </div>
          <Button size="sm" className="bg-brand-gradient text-white hover:brightness-105">
            Create Targeted Offer
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Favorite Dishes</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-6 text-right">Lifetime Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.repeatVisitors.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="pl-6 font-semibold">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">{v.favoriteDishes.join(", ")}</TableCell>
                  <TableCell className="font-medium">{v.visits} visits</TableCell>
                  <TableCell className="text-muted-foreground">{v.lastVisit}</TableCell>
                  <TableCell>
                    <Badge variant={v.status === "VIP" ? "warn" : "muted"}>{v.status}</Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right font-bold text-brand-green">
                    {formatPrice(v.lifetimeValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
