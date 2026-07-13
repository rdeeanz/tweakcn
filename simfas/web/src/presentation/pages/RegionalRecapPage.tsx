/**
 * Rekap Regional — setara sheet "Rekap Regional" Excel.
 */

import { useEffect, useState } from "react";
import { api, downloadBlob } from "@/infrastructure/api-client";
import { Button } from "@/presentation/components/ui/button";
import { Select } from "@/presentation/components/ui/select";
import { AvailabilityBadge } from "@/presentation/components/ui/badge";
import {
  formatAvailabilityPct,
  type AvailabilityStatus,
  type RegionalRecapRow,
} from "@simfas/shared";
import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/presentation/lib/utils";
import { useAuth } from "@/presentation/hooks/use-auth";
import { hasPermission } from "@simfas/shared";

interface RegionalReport {
  regionId: string;
  regionName: string;
  year: number;
  month: number;
  rows: RegionalRecapRow[];
  overall: number | null;
  overallStatus: AvailabilityStatus | null;
  branches: Array<{
    branchId: string;
    branchName: string;
    overall: number | null;
    status: AvailabilityStatus | null;
  }>;
}

export function RegionalRecapPage() {
  const { user } = useAuth();
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);
  const [regionId, setRegionId] = useState("reg-2");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [report, setReport] = useState<RegionalReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Array<{ id: string; name: string }>>("/api/master/regions").then((r) => {
      setRegions(r);
      if (user?.regionId) setRegionId(user.regionId);
    });
  }, [user?.regionId]);

  useEffect(() => {
    api<RegionalReport>(
      `/api/reports/regional?regionId=${regionId}&year=${year}&month=${month}`
    )
      .then(setReport)
      .catch((e) => setError(e.message));
  }, [regionId, year, month]);

  const canExport = user && hasPermission(user.role, "report:export");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rekap Regional</h1>
          <p className="text-sm text-muted-foreground">
            REKAPITULASI LAPORAN AVAILABILITY — format template Excel
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("id-ID", { month: "long" })}
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
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const blob = await api<Blob>(
                  `/api/reports/export/regional.xlsx?regionId=${regionId}&year=${year}&month=${month}`
                );
                downloadBlob(blob, `rekap-regional-${year}-${month}.xlsx`);
              }}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            PT Pelabuhan Indonesia (Persero) {report.regionName}
          </div>
          <div className="mt-1 text-lg font-bold">
            Availability Regional: {formatAvailabilityPct(report.overall)}
          </div>
          <div className="mt-1 flex justify-center">
            <AvailabilityBadge status={report.overallStatus} />
          </div>
        </div>
      )}

      {/* Kartu cabang */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {report?.branches.map((b) => (
          <div
            key={b.branchId}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
          >
            <span className="font-medium text-sm">{b.branchName}</span>
            <AvailabilityBadge status={b.status} pct={b.overall} />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="px-3 py-2 text-left">No.</th>
              <th className="px-3 py-2 text-left">Fasilitas</th>
              <th className="px-3 py-2 text-left">Lokasi</th>
              <th className="px-3 py-2 text-right">Availability (%)</th>
            </tr>
            <tr className="text-xs text-muted-foreground">
              <th className="px-3 py-1">1</th>
              <th className="px-3 py-1">2</th>
              <th className="px-3 py-1">3</th>
              <th className="px-3 py-1 text-right">4</th>
            </tr>
          </thead>
          <tbody>
            {report?.rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-border",
                  row.rowType === "category" && "bg-emerald-500/10 font-semibold",
                  row.rowType === "subtotal" && "bg-amber-500/10 font-semibold",
                  row.rowType === "total" && "bg-primary/10 font-bold"
                )}
              >
                <td className="px-3 py-2">{row.no ?? ""}</td>
                <td className="px-3 py-2">{row.facilityName ?? ""}</td>
                <td className="px-3 py-2">{row.location ?? ""}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {row.availabilityPct != null
                    ? row.availabilityPct.toFixed(2)
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
