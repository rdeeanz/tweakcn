/**
 * Form inspeksi digital — pengganti template-output-inspeksi.pdf.
 * Kondisi 1–4, foto (kompres), approval Cabang & Mitra.
 */

import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { api, downloadBlob, getToken } from "@/infrastructure/api-client";
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
import {
  inspectionConditionLabel,
  type InspectionConditionCode,
  hasPermission,
} from "@simfas/shared";
import { useAuth } from "@/presentation/hooks/use-auth";
import { Plus, Trash2, FileDown, Check } from "lucide-react";

interface InspectionListItem {
  id: string;
  branchName: string;
  facilityName: string | null;
  inspectionDate: string;
  status: string;
  location: string | null;
}

interface ItemRow {
  itemName: string;
  conditionCode: InspectionConditionCode;
  notes: string;
  photoFile?: File | null;
}

const DEFAULT_ITEMS: ItemRow[] = [
  { itemName: "Pelat Lantai", conditionCode: 1, notes: "" },
  { itemName: "Fender", conditionCode: 1, notes: "" },
  { itemName: "Bolder", conditionCode: 1, notes: "" },
  { itemName: "Kanstin", conditionCode: 1, notes: "" },
  { itemName: "Rel Crane", conditionCode: 1, notes: "" },
];

export function InspectionPage() {
  const { user } = useAuth();
  const [list, setList] = useState<InspectionListItem[]>([]);
  const [facilities, setFacilities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [branchId, setBranchId] = useState(user?.branchId ?? "br-tpriok");
  const [facilityId, setFacilityId] = useState("");
  const [location, setLocation] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>(DEFAULT_ITEMS);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canCreate = user && hasPermission(user.role, "inspection:create");
  const canApprove =
    user &&
    (hasPermission(user.role, "inspection:approve_branch") ||
      hasPermission(user.role, "inspection:approve_partner"));

  const reload = () => {
    api<InspectionListItem[]>(
      `/api/inspections?branchId=${branchId}`
    ).then(setList);
  };

  useEffect(() => {
    reload();
    api<Array<{ id: string; name: string }>>(
      `/api/master/facilities?branchId=${branchId}`
    ).then((f) => {
      setFacilities(f);
      if (f[0]) setFacilityId(f[0].id);
    });
  }, [branchId]);

  const updateItem = (idx: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const onSubmit = async (submit: boolean) => {
    if (!canCreate) return;
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const created = await api<{ id: string }>("/api/inspections", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          facilityId: facilityId || null,
          location,
          inspectionDate,
          notes,
          items: items.map((it) => ({
            itemName: it.itemName,
            conditionCode: it.conditionCode,
            notes: it.notes || undefined,
          })),
        }),
      });

      // Upload foto terkompresi per item (Free Tier R2)
      for (let i = 0; i < items.length; i++) {
        const file = items[i].photoFile;
        if (!file) continue;
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.4,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        });
        const form = new FormData();
        form.append("file", compressed, file.name);
        await fetch(`/api/inspections/${created.id}/photo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: form,
        });
      }

      if (submit) {
        await api(`/api/inspections/${created.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "submitted" }),
        });
      }

      setMsg(
        submit
          ? "Inspeksi disimpan & diajukan untuk approval"
          : "Draft inspeksi tersimpan"
      );
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form Inspeksi Lapangan</h1>
        <p className="text-sm text-muted-foreground">
          Digitalisasi form kertas — kondisi 1–4, foto, persetujuan dua pihak
        </p>
      </div>

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Buat Inspeksi Baru</CardTitle>
            <CardDescription>
              Header: Pelabuhan, Fasilitas, Lokasi, Tanggal · Baris item dinamis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Cabang / Pelabuhan</Label>
                <Select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="br-tpriok">Tanjung Priok</option>
                  <option value="br-panjang">Panjang</option>
                  <option value="br-banten">Banten</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fasilitas</Label>
                <Select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Lokasi / Area</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="mis. Area Nusantara I"
                />
              </div>
              <div className="space-y-1">
                <Label>Tanggal Inspeksi</Label>
                <Input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Keterangan kode */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <p className="font-medium">Keterangan kondisi:</p>
              {([1, 2, 3, 4] as InspectionConditionCode[]).map((c) => (
                <p key={c}>
                  {c}. {inspectionConditionLabel(c)}
                </p>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Item</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) =>
                        updateItem(idx, { itemName: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Kondisi</Label>
                    <Select
                      value={String(item.conditionCode)}
                      onChange={(e) =>
                        updateItem(idx, {
                          conditionCode: Number(
                            e.target.value
                          ) as InspectionConditionCode,
                        })
                      }
                    >
                      {([1, 2, 3, 4] as const).map((c) => (
                        <option key={c} value={c}>
                          {c} — {inspectionConditionLabel(c).slice(0, 40)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Catatan</Label>
                    <Input
                      value={item.notes}
                      onChange={(e) =>
                        updateItem(idx, { notes: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Foto</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="text-xs"
                      onChange={(e) =>
                        updateItem(idx, {
                          photoFile: e.target.files?.[0] ?? null,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label="Hapus baris"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { itemName: "", conditionCode: 1, notes: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4" /> Tambah baris
              </Button>
            </div>

            <div className="space-y-1">
              <Label>Catatan umum</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={saving}
                onClick={() => void onSubmit(false)}
              >
                Simpan Draft
              </Button>
              <Button disabled={saving} onClick={() => void onSubmit(true)}>
                Ajukan Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daftar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Inspeksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">Belum ada inspeksi</p>
          )}
          {list.map((insp) => (
            <div
              key={insp.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium text-sm">
                  {insp.facilityName ?? "—"} · {insp.location ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {insp.inspectionDate} · status:{" "}
                  <span className="font-medium">{insp.status}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const blob = await api<Blob>(
                      `/api/inspections/${insp.id}/export.pdf`
                    );
                    downloadBlob(blob, `inspeksi-${insp.id}.pdf`);
                  }}
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                {canApprove &&
                  (insp.status === "submitted" ||
                    insp.status === "approved_branch") && (
                    <>
                      {hasPermission(user!.role, "inspection:approve_branch") && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            await api(`/api/inspections/${insp.id}/approve`, {
                              method: "POST",
                              body: JSON.stringify({ party: "branch" }),
                            });
                            reload();
                          }}
                        >
                          <Check className="h-4 w-4" /> Setuju Cabang
                        </Button>
                      )}
                      {hasPermission(user!.role, "inspection:approve_partner") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            await api(`/api/inspections/${insp.id}/approve`, {
                              method: "POST",
                              body: JSON.stringify({ party: "partner" }),
                            });
                            reload();
                          }}
                        >
                          <Check className="h-4 w-4" /> Setuju Mitra
                        </Button>
                      )}
                    </>
                  )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
