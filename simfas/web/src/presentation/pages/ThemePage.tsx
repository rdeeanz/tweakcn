/**
 * Pengaturan tema — preset + light/dark tanpa reload.
 */

import { useTheme } from "@/presentation/hooks/use-theme";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { cn } from "@/presentation/lib/utils";
import { Moon, Sun } from "lucide-react";

export function ThemePage() {
  const { presetId, mode, setPreset, setMode, presets } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan Tema</h1>
        <p className="text-sm text-muted-foreground">
          Sistem token CSS variable ala tweakcn — ganti tema tanpa reload halaman
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mode</CardTitle>
          <CardDescription>Terang / gelap</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={mode === "light" ? "default" : "outline"}
            onClick={() => setMode("light")}
          >
            <Sun className="h-4 w-4" /> Terang
          </Button>
          <Button
            variant={mode === "dark" ? "default" : "outline"}
            onClick={() => setMode("dark")}
          >
            <Moon className="h-4 w-4" /> Gelap
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(presets).map(([id, preset]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPreset(id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              presetId === id
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="mb-3 flex gap-1">
              {["primary", "secondary", "accent", "muted"].map((k) => (
                <span
                  key={k}
                  className="h-8 flex-1 rounded-md border border-border"
                  style={{
                    background: preset.styles[mode][k] ?? "#ccc",
                  }}
                />
              ))}
            </div>
            <div className="font-semibold">{preset.label}</div>
            <div className="text-xs text-muted-foreground">{id}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview komponen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
            Card surface
          </div>
          <div className="rounded-lg bg-muted p-4 text-muted-foreground">
            Muted surface
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
