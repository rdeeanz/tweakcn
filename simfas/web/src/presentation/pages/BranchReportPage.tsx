/**
 * Tabel Laporan Cabang — layout kolom 1–18 identik Excel Lap. Cabang.
 * Desktop: tabel horizontal scroll; mobile: card view.
 */

import { useEffect, useState } from "react";
import { api, downloadBlob } from "@/infrastructure/api-client";
import { Button } from "@/presentation/components/ui/button";
import { Select } from "@/presentation/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { AvailabilityBadge } from "@/presentation/components/ui/badge";
import { formatAvailabilityPct, getAvailabilityStatus, type ReportRow } from "@simfas/shared";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { hasPermission } from "@simfas/shared";
import { useAuth } from "@/presentation/hooks/use-auth";
import { cn } from "@/presentation/lib/utils";

interface BranchReport {
  branchId: string;
  branchName: string;
  regionName: string;
  year: number;
  month: number;
  rows: ReportRow[];
  overall: number | null;
  overallStatus: ReturnType<typeof getAvailabilityStatus>;
  categoryAvails: Array<{ name: string; pct: number | null; status: string | null }>;
}

interface Branch {
  id: string;
  name: string;
  regionId: string;
}

function fmt(n: number | null | undefined) {
  if (n == null) return "";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function BranchReportPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("br-tpriok");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [report, setReport] = useState<BranchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canExport = user && hasPermission(user.role, "report:export");

  useEffect(() => {
    api<Branch[]>("/api/master/branches").then((list) => {
      setBranches(list);
      if (user?.branchId) setBranchId(user.branchId);
    });
  }, [user?.branchId]);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    api<BranchReport>(
      `/api/reports/branch?branchId=${branchId}&year=${year}&month=${month}`
    )
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [branchId, year, month]);

  const exportFile = async (type: "xlsx" | "pdf") => {
    const blob = await api<Blob>(
      `/api/reports/export/branch.${type}?branchId=${branchId}&year=${year}&month=${month}`
    );
    downloadBlob(blob, `laporan-cabang-${year}-${month}.${type}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Cabang</h1>
          <p className="text-sm text-muted-foreground">
            Struktur kolom 1–18 sesuai template Excel Lap. Cabang
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("id-ID", { month: "short" })}
              </option>
            ))}
          </Select>
          <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          {canExport && (
            <>
              <Button variant="outline" size="sm" onClick={() => void exportFile("xlsx")}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => void exportFile("pdf")}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {report && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <div className="text-xs text-muted-foreground">Pelabuhan</div>
            <div className="font-semibold">{report.branchName}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Regional</div>
            <div className="font-semibold">{report.regionName}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Availability Cabang</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatAvailabilityPct(report.overall)}
            </span>
            <AvailabilityBadge status={report.overallStatus} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Memuat laporan…</p>}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[1200px] border-collapse text-xs">
          <thead>
            <tr className="bg-muted/60">
              {[
                "No",
                "Fasilitas",
                "Nama Fasilitas",
                "Objek Fasilitas",
                "Panjang",
                "Lebar",
                "Luas",
                "Jumlah",
                "Konstruksi",
                "Tersedia",
                "R. Ringan",
                "R. Sedang",
                "R. Berat",
                "Siap Pakai",
                "Avail. Objek %",
                "Avail. Fasilitas %",
                "Operator",
                "Keterangan",
              ].map((h, i) => (
                <th
                  key={h}
                  className="border-b border-border px-2 py-2 text-left font-semibold whitespace-nowrap"
                  title={`Kolom ${i + 1}`}
                >
                  <span className="block text-[10px] text-muted-foreground">{i + 1}</span>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report?.rows.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b border-border/60",
                  row.rowType === "header" && "bg-emerald-500/10 font-semibold",
                  row.rowType === "subtotal" && "bg-amber-500/10 font-semibold",
                  row.rowType === "total" && "bg-primary/10 font-bold"
                )}
              >
                <td className="px-2 py-1.5">{row.no ?? ""}</td>
                <td className="px-2 py-1.5">{row.facilityCategory ?? ""}</td>
                <td className="px-2 py-1.5">{row.facilityName ?? ""}</td>
                <td className="px-2 py-1.5">{row.facilityObject ?? ""}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.length)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.width)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.area)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.quantity)}</td>
                <td className="px-2 py-1.5">{row.construction ?? ""}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.availableQty)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.minorDamage)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.moderateDamage)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.severeDamage)}</td>
                <td className="px-2 py-1.5 tabular-nums">{fmt(row.readyQty)}</td>
                <td className="px-2 py-1.5 tabular-nums">
                  {row.objectAvailabilityPct != null
                    ? row.objectAvailabilityPct.toFixed(2)
                    : ""}
                </td>
                <td className="px-2 py-1.5 tabular-nums">
                  {row.facilityAvailabilityPct != null
                    ? row.facilityAvailabilityPct.toFixed(2)
                    : ""}
                </td>
                <td className="px-2 py-1.5">{row.operator ?? ""}</td>
                <td className="px-2 py-1.5">{row.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-2 md:hidden">
        {report?.rows
          .filter((r) => r.rowType === "object" || r.rowType === "facility")
          .map((row, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {row.facilityObject ?? row.facilityName ?? row.facilityCategory}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-xs">
                {row.availableQty != null && (
                  <>
                    <span className="text-muted-foreground">Tersedia</span>
                    <span className="tabular-nums">{fmt(row.availableQty)}</span>
                  </>
                )}
                {row.readyQty != null && (
                  <>
                    <span className="text-muted-foreground">Siap pakai</span>
                    <span className="tabular-nums">{fmt(row.readyQty)}</span>
                  </>
                )}
                {(row.objectAvailabilityPct != null ||
                  row.facilityAvailabilityPct != null) && (
                  <>
                    <span className="text-muted-foreground">Availability</span>
                    <span className="tabular-nums font-semibold">
                      {formatAvailabilityPct(
                        row.objectAvailabilityPct ?? row.facilityAvailabilityPct
                      )}
                    </span>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {!canExport && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Download className="h-3 w-3" /> Ekspor tersedia untuk role Admin Cabang ke atas
        </p>
      )}
    </div>
  );
}
