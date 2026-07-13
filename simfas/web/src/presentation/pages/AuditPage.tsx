/**
 * Log audit perubahan data.
 */

import { useEffect, useState } from "react";
import { api } from "@/infrastructure/api-client";

interface AuditRow {
  id: string;
  userName: string;
  entity: string;
  entityId: string;
  action: string;
  createdAt: string;
}

export function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AuditRow[]>("/api/users/audit-logs?limit=100")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Siapa mengubah data apa, kapan (PRD §7.5)
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left">Waktu</th>
              <th className="px-3 py-2 text-left">Pengguna</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">Aksi</th>
              <th className="px-3 py-2 text-left">ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {r.createdAt}
                </td>
                <td className="px-3 py-2">{r.userName ?? "—"}</td>
                <td className="px-3 py-2">{r.entity}</td>
                <td className="px-3 py-2 font-medium">{r.action}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {r.entityId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
