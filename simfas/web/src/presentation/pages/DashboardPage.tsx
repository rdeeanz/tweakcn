/**
 * Dashboard ringkasan: kartu regional, tren, alert kritis.
 */

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/infrastructure/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { AvailabilityBadge } from "@/presentation/components/ui/badge";
import { Select } from "@/presentation/components/ui/select";
import { formatAvailabilityPct, type AvailabilityStatus } from "@simfas/shared";
import { AlertTriangle, TrendingUp } from "lucide-react";

interface DashboardData {
  year: number;
  month: number;
  regions: Array<{
    regionId: string;
    regionName: string;
    code: string;
    branchCount: number;
    overall: number | null;
    status: AvailabilityStatus | null;
  }>;
  alerts: Array<{
    scope: string;
    name: string;
    availability: number;
    status: string;
  }>;
  trend: Array<{
    year: number;
    month: number;
    label: string;
    overall: number | null;
    categories: Array<{ name: string; pct: number | null }>;
  }>;
}

export function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<DashboardData>(`/api/reports/dashboard?year=${year}&month=${month}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, month]);

  const chartData =
    data?.trend.map((t) => {
      const row: Record<string, string | number | null> = {
        label: t.label,
        Overall: t.overall != null ? Number(t.overall.toFixed(2)) : null,
      };
      for (const c of t.categories) {
        row[c.name] = c.pct != null ? Number(c.pct.toFixed(2)) : null;
      }
      return row;
    }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan availability fasilitas sipil pelabuhan
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
            aria-label="Bulan"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i, 1).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </Select>
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Tahun"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Memuat…</p>}

      {/* Kartu regional */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data?.regions.map((r) => (
          <Card key={r.regionId}>
            <CardHeader className="pb-2">
              <CardDescription>{r.code}</CardDescription>
              <CardTitle className="flex items-center justify-between gap-2 text-base">
                {r.regionName}
                <AvailabilityBadge status={r.status} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold tabular-nums">
                    {formatAvailabilityPct(r.overall)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.branchCount} cabang · rata-rata kategori
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Grafik tren */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tren Availability (6 bulan)</CardTitle>
            <CardDescription>
              Cabang contoh Tanjung Priok — dihitung otomatis berjenjang (bukan hardcode)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Overall"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data tren</p>
            )}
          </CardContent>
        </Card>

        {/* Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Peringatan
            </CardTitle>
            <CardDescription>Availability &lt; 95%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.alerts.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Tidak ada peringatan</p>
            )}
            {data?.alerts.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                className="flex items-center justify-between rounded-lg border border-border p-2 text-sm"
              >
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{a.scope}</div>
                </div>
                <AvailabilityBadge
                  status={a.status as AvailabilityStatus}
                  pct={a.availability}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Periode tampilan: {month}/{year} · Data seed demo · Server time ref {now.toLocaleDateString("id-ID")}
      </p>
    </div>
  );
}
