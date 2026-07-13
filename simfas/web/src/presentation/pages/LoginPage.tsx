/**
 * Halaman login — demo accounts dari seed.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ship } from "lucide-react";
import { useAuth } from "@/presentation/hooks/use-auth";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";

const DEMO_ACCOUNTS = [
  { email: "superadmin@pelindo.co.id", role: "Superadmin" },
  { email: "admin.tpriok@pelindo.co.id", role: "Admin Cabang" },
  { email: "inspektor.tpriok@pelindo.co.id", role: "Inspektor" },
  { email: "admin.reg2@pelindo.co.id", role: "Admin Regional" },
  { email: "manajemen@pelindo.co.id", role: "Manajemen" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin.tpriok@pelindo.co.id");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6 flex items-center gap-3 text-primary">
        <Ship className="h-10 w-10" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SIMFAS</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring Availability Fasilitas Pelabuhan
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Masuk</CardTitle>
          <CardDescription>
            PT Pelabuhan Indonesia (Persero) — sistem digital pengganti form kertas & Excel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses…" : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs">
            <p className="mb-2 font-medium">Akun demo (password: password123)</p>
            <ul className="space-y-1 text-muted-foreground">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.email}>
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => {
                      setEmail(a.email);
                      setPassword("password123");
                    }}
                  >
                    {a.role}: {a.email}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
