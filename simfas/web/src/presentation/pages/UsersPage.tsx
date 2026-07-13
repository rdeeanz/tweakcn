/**
 * Manajemen pengguna (Superadmin).
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
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { roleLabel, type UserRole } from "@simfas/shared";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  regionId: string | null;
  isActive: number;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "password123",
    role: "inspector" as UserRole,
    branchId: "br-tpriok",
  });
  const [msg, setMsg] = useState("");

  const load = () => api<UserRow[]>("/api/users").then(setUsers);
  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tambah Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole })
              }
            >
              {(
                [
                  "inspector",
                  "admin_branch",
                  "admin_region",
                  "management",
                  "superadmin",
                ] as UserRole[]
              ).map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={async () => {
                await api("/api/users", {
                  method: "POST",
                  body: JSON.stringify({
                    ...form,
                    branchId:
                      form.role === "inspector" || form.role === "admin_branch"
                        ? form.branchId
                        : null,
                    regionId:
                      form.role === "admin_region" ? "reg-2" : null,
                  }),
                });
                setMsg("Pengguna ditambahkan");
                setForm({
                  name: "",
                  email: "",
                  password: "password123",
                  role: "inspector",
                  branchId: "br-tpriok",
                });
                load();
              }}
            >
              Simpan
            </Button>
            {msg && <span className="ml-3 text-sm text-emerald-600">{msg}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2 text-left">Nama</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Aktif</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{roleLabel(u.role)}</td>
                <td className="px-3 py-2">{u.isActive ? "Ya" : "Tidak"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
