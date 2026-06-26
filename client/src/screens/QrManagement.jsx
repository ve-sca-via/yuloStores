// QR Management (/qr) — Figma node 2:663. A generate panel (left) that creates a
// unique table ordering link + QR, and a grid of generated codes (right) with
// download / print / regenerate actions and active/void status (PRD §6, §16).

import { useState } from "react";
import { Download, Printer, QrCode, RotateCcw, Search } from "lucide-react";

import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useTables, useCreateTable, useGenerateQR, useVoidQR } from "@/hooks/owner/useTables";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function downloadQr(code) {
  const link = document.createElement("a");
  link.href = code.qrImageUrl;
  link.download = `qr-${code.label.replace(/\s+/g, "-").toLowerCase()}.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function printQr(code) {
  const win = window.open("", "_blank", "width=480,height=560");
  if (!win) return;
  win.document.write(
    `<html><head><title>${code.label}</title></head><body style="display:grid;place-items:center;height:100vh;margin:0;font-family:Inter,sans-serif">` +
      `<div style="text-align:center"><img src="${code.qrImageUrl}" width="280" height="280"/><p style="font-weight:700">${code.label}</p></div>` +
      `</body></html>`,
  );
  win.document.close();
  win.focus();
  win.print();
}

export default function QrManagement() {
  const { restaurantId } = useOwnerAuth();
  const { data: tables = [], isLoading } = useTables(restaurantId);
  const createTable = useCreateTable(restaurantId);
  const generateQR  = useGenerateQR(restaurantId);
  const voidQR      = useVoidQR(restaurantId);

  const [tableNumber, setTableNumber] = useState("14");
  const [search, setSearch]           = useState("");
  const [generated, setGenerated]     = useState(null);

  // Map tables to the code shape the UI expects
  const codes = tables.map((t) => ({
    id:          t._id,
    label:       `Table ${t.identifier}`,
    qrImageUrl:  t.qrCode?.imageUrl ?? "",
    link:        t.qrCode?.url ?? "",
    active:      t.qrCode?.status === "active",
    generatedAt: t.qrCode?.generatedAt ?? t.updatedAt,
  }));

  async function generate(event) {
    event.preventDefault();
    if (!tableNumber.trim()) return;
    try {
      // Find or create the table by identifier
      let table = tables.find((t) => String(t.identifier) === String(tableNumber.trim()));
      if (!table) {
        const res = await createTable.mutateAsync({ identifier: tableNumber.trim() });
        table = res.data?.data?.table;
      }
      if (!table?._id) return;

      const result = await generateQR.mutateAsync(table._id);
      const qr = result.data?.data?.qr;
      if (qr) {
        setGenerated({
          id:         table._id,
          label:      `Table ${table.identifier}`,
          qrImageUrl: qr.imageUrl,
          link:       qr.url,
        });
      }
    } catch {
      // error shown via generateQR.isError
    }
  }

  function regenerate(code) {
    // Always regenerate (generates a new QR, replacing the old one)
    generateQR.mutate(code.id);
  }

  // identifier alias for the form
  const identifier = tableNumber;
  const setIdentifier = setTableNumber;

  const visible = codes.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div>
        <h1 className="whitespace-nowrap text-2xl font-bold">Table QR Management</h1>
        <p className="text-sm text-muted-foreground">
          Generate and manage QR codes for restaurant tables.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables..."
          className="rounded-full pl-9"
        />
      </div>

      {generateQR.isError ? <p className="text-sm text-brand-maroon">Failed to generate QR</p> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        {/* Generate panel */}
        <Card className="self-start">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">Generate New Table QR</h2>
              <p className="text-xs text-muted-foreground">
                Enter a table identifier to create a unique ordering link.
              </p>
            </div>

            <form onSubmit={generate} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Table Number / Identifier</Label>
                <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="14" />
              </div>
              <Button
                type="submit"
                disabled={generateQR.isPending}
                className="w-full gap-2 bg-brand-gradient text-white hover:brightness-105"
              >
                <QrCode className="h-4 w-4" /> {generateQR.isPending ? "Generating…" : "Generate QR Code"}
              </Button>
            </form>

            {generated ? (
              <div className="space-y-3 border-t border-brand-cream/60 pt-4">
                <div className="grid place-items-center rounded-xl border border-brand-cream/70 bg-white p-4">
                  <img src={generated.qrImageUrl} alt={generated.label} className="h-40 w-40" />
                </div>
                <p className="text-center text-sm font-semibold">● {generated.label}</p>
                <p className="rounded-lg bg-[#E8F5EC] py-1.5 text-center text-xs font-semibold text-brand-green">
                  QR Code generated successfully
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => downloadQr(generated)}
                  >
                    <Download className="h-3.5 w-3.5" /> Save QR
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => printQr(generated)}>
                    <Printer className="h-3.5 w-3.5" /> Print QR
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Generated codes grid */}
        <div>
          <h2 className="mb-3 text-base font-bold">Generated QR Codes</h2>
          {!codes ? (
            <p className="text-sm text-muted-foreground">Loading QR codes…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((code) => (
                <Card key={code.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="grid place-items-center rounded-xl border border-brand-cream/70 bg-white p-3">
                      <img src={code.qrImageUrl} alt={code.label} className="h-24 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{code.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(code.createdAt)}</p>
                      </div>
                      <Badge variant={code.active ? "ok" : "danger"} className="uppercase">
                        {code.active ? "Active" : "Void"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-around border-t border-brand-cream/60 pt-2 text-muted-foreground">
                      <button type="button" onClick={() => downloadQr(code)} className="hover:text-brand-orange" aria-label="Download">
                        <Download className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => printQr(code)} className="hover:text-brand-orange" aria-label="Print">
                        <Printer className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => regenerate(code)} className="hover:text-brand-orange" aria-label="Toggle active">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {visible.length === 0 ? (
                <Card className="sm:col-span-2 xl:col-span-3">
                  <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
                    No QR codes match your search.
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
