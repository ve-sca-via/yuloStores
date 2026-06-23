// Restaurant Owner Dashboard — Figma node 113:2.
// Built on libraries: Recharts (charts), TanStack Table (queue), shadcn/ui
// (Card/Badge/Table/Button/Avatar/Dropdown), lucide-react (icons), Tailwind.
// Data comes from the mock layer (GET /restaurant_owner/dashboard).

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Flame,
  MoreHorizontal,
  Star,
  TrendingUp,
} from "lucide-react";

import { requestJson } from "@/api";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Maps a status string to a Badge variant (defined in ui/badge.jsx).
function statusVariant(status) {
  const key = status.toLowerCase();
  if (key.includes("paid") || key.includes("delivered")) return "ok";
  if (key.includes("ready")) return "info";
  if (key.includes("prepar") || key.includes("way")) return "warn";
  if (key.includes("pending")) return "muted";
  if (key.includes("cancel")) return "danger";
  return "muted";
}

function PeriodDropdown({ value = "Today" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg border-brand-cream/70 text-[13px] font-normal text-[#5f5f5f]"
        >
          {value}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Today</DropdownMenuItem>
        <DropdownMenuItem>This Week</DropdownMenuItem>
        <DropdownMenuItem>This Month</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatCard({ title, value, delta, caption, up, stars }) {
  return (
    <Card>
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">{title}</span>
          <span className="h-[22px] w-[22px] rounded-full bg-brand-orange/10" />
        </div>
        <strong className="mt-2.5 block text-[28px] font-bold leading-none">
          {value}
        </strong>
        {stars ? (
          <div className="mt-2 flex gap-0.5 text-brand-saffron">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
        ) : null}
        {delta ? (
          <div
            className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${
              up ? "text-brand-green" : "text-muted-foreground"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {delta}
          </div>
        ) : (
          <div className="mt-1.5 text-xs text-muted-foreground">{caption}</div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHead({ title, action }) {
  return (
    <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
      <h2 className="text-base font-bold">{title}</h2>
      {action}
    </CardHeader>
  );
}

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestJson("/restaurant_owner/dashboard")
      .then((payload) => setData(payload.data))
      .catch((err) => setError(err.message));
  }, []);

  const queue = data?.kitchen.queue ?? [];
  const columns = useMemo(
    () => [
      { accessorKey: "table", header: "Table", cell: (c) => <span className="font-semibold">{c.getValue()}</span> },
      { accessorKey: "items", header: "Order Items" },
      {
        accessorKey: "status",
        header: "Status",
        cell: (c) => <Badge variant={statusVariant(c.getValue())}>{c.getValue()}</Badge>,
      },
      { accessorKey: "time", header: "Time", cell: (c) => <span className="text-muted-foreground">{c.getValue()}</span> },
      {
        id: "actions",
        header: "Actions",
        cell: (c) =>
          c.row.original.action ? (
            <button type="button" className="text-[13px] font-semibold text-brand-orange">
              {c.row.original.action}
            </button>
          ) : (
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: queue,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-page text-muted-foreground">
        Failed to load: {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-page text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  const { profile, stats, salesOverview, orderBreakdown, kitchen, topSelling, recentOrders } = data;

  return (
    <DashboardLayout profile={profile}>
        {/* Stat cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Orders" value={stats.totalOrders.value} delta={stats.totalOrders.delta} up={stats.totalOrders.up} />
          <StatCard title="Revenue" value={stats.revenue.value} delta={stats.revenue.delta} up={stats.revenue.up} />
          <StatCard title="Live Monitoring" value={stats.liveMonitoring.value} caption={stats.liveMonitoring.caption} />
          <StatCard title="Average Rating" value={stats.averageRating.value} caption={stats.averageRating.caption} stars />
        </section>

        {/* Sales + breakdown */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <SectionHead title="Sales Overview" action={<PeriodDropdown />} />
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={salesOverview.bars} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D9480F" />
                      <stop offset="100%" stopColor="#A4161A" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#8a8a8a" }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#8a8a8a" }}
                    ticks={[0, 10000, 20000, 30000]}
                    tickFormatter={(v) => (v === 0 ? "0" : `${v / 1000}k`)}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(217,72,15,0.06)" }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #EFE7DD", fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <SectionHead title="Order Breakdown" action={<PeriodDropdown />} />
            <CardContent>
              <div className="relative mx-auto h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderBreakdown.segments}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                    >
                      {orderBreakdown.segments.map((s) => (
                        <Cell key={s.label} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v}`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-2xl font-bold">{orderBreakdown.total}</strong>
                  <span className="text-[11px] text-muted-foreground">Total Orders</span>
                </div>
              </div>

              <p className="mb-3 mt-1 text-[13px] font-semibold">Order Status Breakdown</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {orderBreakdown.segments.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="ml-auto font-semibold">{s.value} ({s.percent}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Live kitchen activity */}
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Flame className="h-4 w-4 text-brand-orange" /> Live Kitchen Activity
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Manage active orders and preparation queue
              </p>
            </div>
            <button type="button" className="text-[13px] font-semibold text-brand-orange">
              View Display →
            </button>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              {kitchen.pills.map((pill) => (
                <div key={pill.label} className="rounded-xl border border-brand-cream/60 bg-[#fffaf7] p-3.5">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pill.label}</span>
                    <span className="rounded-md bg-brand-orange/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-brand-orange">
                      {pill.tag}
                    </span>
                  </div>
                  <strong className="text-2xl font-bold">{pill.value}</strong>
                </div>
              ))}
            </div>

            <h3 className="mb-1 text-sm font-bold">Current Kitchen Queue</h3>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-brand-cream/60">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top selling + recent orders */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <SectionHead title="Top Selling Items" />
            <CardContent>
              {topSelling.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="flex items-center gap-3 border-b border-[#F6EFE9] py-3 last:border-0"
                >
                  <span className="h-11 w-11 shrink-0 rounded-[10px] bg-gradient-to-br from-brand-saffron to-brand-red" />
                  <div className="flex flex-col">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.orders}</span>
                  </div>
                  <span className="ml-auto font-bold text-brand-red">{item.price}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <SectionHead
              title="Recent Orders"
              action={
                <button type="button" className="text-[13px] font-semibold text-brand-orange">
                  View All Orders
                </button>
              }
            />
            <CardContent>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 border-b border-[#F6EFE9] py-3.5 last:border-0"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold">{order.id}</span>
                      <span className="text-xs text-muted-foreground">{order.time}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{order.items}</span>
                  </div>
                  <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
    </DashboardLayout>
  );
}
