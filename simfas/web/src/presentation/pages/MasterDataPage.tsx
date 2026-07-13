/**
 * Master data: lihat hierarki Regional → Cabang → Kategori → Fasilitas → Objek.
 * Input data periodik bulanan untuk Admin Cabang.
 */

import { useEffect, useState } from "react";
import { api } from "@/infrastructure/api-client";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select } from "@/presentation/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { calcObjectAvailability, formatAvailabilityPct } from "@simfas/shared";
import { useAuth } from "@/presentation/hooks/use-auth";
import { hasPermission } from "@simfas/shared";

interface RecordRow {
  id: string;
  objectId: string;
  objectName: string;
  facilityName: string;
  categoryName: string;
  availableQty: number;
  readyQty: number;
  minorDamage: number;
  moderateDamage: number;
  severeDamage: number;
  length: number | null;
  width: number | null;
  area: number | null;
  quantity: number | null;
  operator: string | null;
  notes: string | null;
  objectAvailabilityPct: number | null;
}

export function MasterDataPage() {
  const { user } = useAuth();
  const [branchId, setBranchId] = useState(user?.branchId ?? "br-tpriok");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [editing, setEditing] = useState<RecordRow | null>(null);
  const [msg, setMsg] = useState("");

  const canEdit = user && hasPermission(user.role, "record:edit");

  const load = () => {
    api<RecordRow[]>(
      `/api/records?branchId=${branchId}&year=${year}&month=${month}`
    ).then(setRecords);
  };

  useEffect(() => {
    load();
  }, [branchId, year, month]);

  const liveAvail =
    editing &&
    calcObjectAvailability(Number(editing.readyQty), Number(editing.availableQty));

  const save = async () => {
    if (!editing || !canEdit) return;
    await api("/api/records", {
      method: "PUT",
      body: JSON.stringify({
        objectId: editing.objectId,
        year,
        month,
        length: editing.length,
        width: editing.width,
        area: editing.area,
        quantity: editing.quantity,
        availableQty: Number(editing.availableQty),
        minorDamage: Number(editing.minorDamage),
        moderateDamage: Number(editing.moderateDamage),
        severeDamage: Number(editing.severeDamage),
        readyQty: Number(editing.readyQty),
        operator: editing.operator,
        notes: editing.notes,
      }),
    });
    setMsg("Data tersimpan — availability dihitung otomatis");
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Master Data & Input Bulanan</h1>
        <p className="text-sm text-muted-foreground">
          Hierarki fasilitas + input kuantitatif periodik (siap pakai / tersedia)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="br-tpriok">Tanjung Priok</option>
          <option value="br-panjang">Panjang</option>
          <option value="br-banten">Banten</option>
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
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const r = await api<{ copied: number }>("/api/records/copy-previous", {
                method: "POST",
                body: JSON.stringify({ branchId, year, month }),
              });
              setMsg(`Disalin ${r.copied} baris dari bulan sebelumnya`);
              load();
            }}
          >
            Salin bulan sebelumnya
          </Button>
        )}
      </div>

      {msg && <p className="text-sm text-emerald-600">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[800px] text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-2 py-2 text-left">Kategori</th>
              <th className="px-2 py-2 text-left">Fasilitas</th>
              <th className="px-2 py-2 text-left">Objek</th>
              <th className="px-2 py-2 text-right">Tersedia</th>
              <th className="px-2 py-2 text-right">Siap Pakai</th>
              <th className="px-2 py-2 text-right">Avail %</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id || r.objectId} className="border-t border-border">
                <td className="px-2 py-1.5">{r.categoryName}</td>
                <td className="px-2 py-1.5">{r.facilityName}</td>
                <td className="px-2 py-1.5 font-medium">{r.objectName}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {r.availableQty}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {r.readyQty}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                  {formatAvailabilityPct(r.objectAvailabilityPct)}
                </td>
                <td className="px-2 py-1.5">
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing({ ...r })}
                    >
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Edit: {editing.objectName} ({editing.facilityName})
            </CardTitle>
            <CardDescription>
              Availability real-time:{" "}
              <strong>{formatAvailabilityPct(liveAvail)}</strong> = siap pakai ÷
              tersedia × 100
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["availableQty", "Fasilitas Tersedia"],
                ["readyQty", "Fasilitas Siap Pakai"],
                ["minorDamage", "Rusak Ringan"],
                ["moderateDamage", "Rusak Sedang"],
                ["severeDamage", "Rusak Berat"],
                ["length", "Panjang (m)"],
                ["width", "Lebar (m)"],
                ["area", "Luas (m²)"],
                ["quantity", "Jumlah"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="any"
                  value={editing[key] ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      [key]:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
            ))}
            <div className="space-y-1 sm:col-span-2">
              <Label>Operator</Label>
              <Input
                value={editing.operator ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, operator: e.target.value })
                }
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <Label>Keterangan</Label>
              <Input
                value={editing.notes ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, notes: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 sm:col-span-3">
              <Button onClick={() => void save()}>Simpan</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
