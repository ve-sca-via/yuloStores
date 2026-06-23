// Cancellations (/cancellations) — review pending cancellation requests and
// view cancelled/rejected order history (PRD §9.3). Data from the mock layer:
// GET /restaurant_owner/cancellations, PATCH /restaurant_owner/cancellations/:id.

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

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

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status) {
  if (status === "approved") return "danger";
  if (status === "rejected") return "muted";
  return "warn";
}

export default function Cancellations() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  function load() {
    requestJson("/restaurant_owner/cancellations")
      .then((payload) => setList(payload.data.cancellations))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function resolve(entry, status) {
    setList((current) =>
      current.map((c) =>
        c.id === entry.id
          ? { ...c, status, type: status === "approved" ? "cancelled" : "rejected" }
          : c,
      ),
    );
    try {
      await requestJson(`/restaurant_owner/cancellations/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  const { pending, history } = useMemo(() => {
    const all = list ?? [];
    return {
      pending: all.filter((c) => c.status === "pending"),
      history: all.filter((c) => c.status !== "pending"),
    };
  }, [list]);

  if (error && !list) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Failed to load: {error}</p>
      </DashboardLayout>
    );
  }
  if (!list) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">Loading cancellations…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Cancellations</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject customer cancellation requests and review history.
        </p>
      </div>

      {/* Pending requests */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <h2 className="text-base font-bold">Pending Requests</h2>
          <Badge variant={pending.length ? "warn" : "muted"}>{pending.length} pending</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending cancellation requests.
            </p>
          ) : (
            pending.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border border-brand-cream/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold">#{entry.orderId.slice(-6)}</span>
                    <Badge variant="muted">Table {entry.table}</Badge>
                    <span className="text-sm font-semibold text-brand-red">
                      {formatPrice(entry.amount)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.reason} · requested by {entry.requestedBy} · {formatTime(entry.time)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => resolve(entry, "approved")}
                    className="gap-1.5 bg-brand-maroon text-white hover:bg-brand-maroon/90"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolve(entry, "rejected")}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-base font-bold">Cancellation History</h2>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-cream/60">
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>By</TableHead>
                <TableHead>When</TableHead>
                <TableHead className="pr-6">Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="pl-6 font-semibold">#{entry.orderId.slice(-6)}</TableCell>
                  <TableCell>{entry.table}</TableCell>
                  <TableCell className="max-w-[240px] text-muted-foreground">{entry.reason}</TableCell>
                  <TableCell className="font-semibold">{formatPrice(entry.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.requestedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{formatTime(entry.time)}</TableCell>
                  <TableCell className="pr-6">
                    <Badge variant={statusVariant(entry.status)} className="capitalize">
                      {entry.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No cancellation history yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
