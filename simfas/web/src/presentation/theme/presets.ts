/**
 * Preset tema CSS-variable ala tweakcn.
 * Pelindo brand + beberapa alternatif; light/dark per preset.
 */

export type ThemeMode = "light" | "dark";

export type ThemeStyles = Record<string, string>;

export interface ThemePreset {
  label: string;
  styles: { light: ThemeStyles; dark: ThemeStyles };
}

export const themePresets: Record<string, ThemePreset> = {
  pelindo: {
    label: "Pelindo",
    styles: {
      light: {
        background: "#f8fafc",
        foreground: "#0f172a",
        card: "#ffffff",
        "card-foreground": "#0f172a",
        popover: "#ffffff",
        "popover-foreground": "#0f172a",
        primary: "#0b3d91",
        "primary-foreground": "#ffffff",
        secondary: "#e2e8f0",
        "secondary-foreground": "#1e293b",
        muted: "#f1f5f9",
        "muted-foreground": "#64748b",
        accent: "#dbeafe",
        "accent-foreground": "#1e3a8a",
        destructive: "#dc2626",
        "destructive-foreground": "#ffffff",
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#0b3d91",
        "chart-1": "#0b3d91",
        "chart-2": "#0369a1",
        "chart-3": "#0d9488",
        "chart-4": "#ca8a04",
        "chart-5": "#dc2626",
        radius: "0.5rem",
        sidebar: "#0b3d91",
        "sidebar-foreground": "#f8fafc",
        "sidebar-primary": "#fbbf24",
        "sidebar-primary-foreground": "#0f172a",
        "sidebar-accent": "#1e40af",
        "sidebar-accent-foreground": "#f8fafc",
        "sidebar-border": "#1e3a8a",
        "sidebar-ring": "#fbbf24",
        "font-sans": "Inter, system-ui, sans-serif",
      },
      dark: {
        background: "#0b1220",
        foreground: "#e2e8f0",
        card: "#111827",
        "card-foreground": "#e2e8f0",
        popover: "#111827",
        "popover-foreground": "#e2e8f0",
        primary: "#3b82f6",
        "primary-foreground": "#ffffff",
        secondary: "#1e293b",
        "secondary-foreground": "#e2e8f0",
        muted: "#1e293b",
        "muted-foreground": "#94a3b8",
        accent: "#1e3a8a",
        "accent-foreground": "#bfdbfe",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#1e293b",
        input: "#1e293b",
        ring: "#3b82f6",
        "chart-1": "#60a5fa",
        "chart-2": "#38bdf8",
        "chart-3": "#2dd4bf",
        "chart-4": "#fbbf24",
        "chart-5": "#f87171",
        radius: "0.5rem",
        sidebar: "#020617",
        "sidebar-foreground": "#e2e8f0",
        "sidebar-primary": "#fbbf24",
        "sidebar-primary-foreground": "#0f172a",
        "sidebar-accent": "#1e3a8a",
        "sidebar-accent-foreground": "#e2e8f0",
        "sidebar-border": "#1e293b",
        "sidebar-ring": "#fbbf24",
        "font-sans": "Inter, system-ui, sans-serif",
      },
    },
  },
  "modern-minimal": {
    label: "Modern Minimal",
    styles: {
      light: {
        background: "#ffffff",
        foreground: "#333333",
        card: "#ffffff",
        "card-foreground": "#333333",
        popover: "#ffffff",
        "popover-foreground": "#333333",
        primary: "#3b82f6",
        "primary-foreground": "#ffffff",
        secondary: "#f3f4f6",
        "secondary-foreground": "#4b5563",
        muted: "#f9fafb",
        "muted-foreground": "#6b7280",
        accent: "#e0f2fe",
        "accent-foreground": "#1e3a8a",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#3b82f6",
        "chart-1": "#3b82f6",
        "chart-2": "#2563eb",
        "chart-3": "#1d4ed8",
        "chart-4": "#1e40af",
        "chart-5": "#1e3a8a",
        radius: "0.375rem",
        sidebar: "#f9fafb",
        "sidebar-foreground": "#333333",
        "sidebar-primary": "#3b82f6",
        "sidebar-primary-foreground": "#ffffff",
        "sidebar-accent": "#e0f2fe",
        "sidebar-accent-foreground": "#1e3a8a",
        "sidebar-border": "#e5e7eb",
        "sidebar-ring": "#3b82f6",
        "font-sans": "Inter, sans-serif",
      },
      dark: {
        background: "#171717",
        foreground: "#e5e5e5",
        card: "#262626",
        "card-foreground": "#e5e5e5",
        popover: "#262626",
        "popover-foreground": "#e5e5e5",
        primary: "#3b82f6",
        "primary-foreground": "#ffffff",
        secondary: "#262626",
        "secondary-foreground": "#e5e5e5",
        muted: "#1f1f1f",
        "muted-foreground": "#a3a3a3",
        accent: "#1e3a8a",
        "accent-foreground": "#bfdbfe",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: "#404040",
        input: "#404040",
        ring: "#3b82f6",
        "chart-1": "#60a5fa",
        "chart-2": "#3b82f6",
        "chart-3": "#2563eb",
        "chart-4": "#1d4ed8",
        "chart-5": "#1e40af",
        radius: "0.375rem",
        sidebar: "#171717",
        "sidebar-foreground": "#e5e5e5",
        "sidebar-primary": "#3b82f6",
        "sidebar-primary-foreground": "#ffffff",
        "sidebar-accent": "#1e3a8a",
        "sidebar-accent-foreground": "#bfdbfe",
        "sidebar-border": "#404040",
        "sidebar-ring": "#3b82f6",
        "font-sans": "Inter, sans-serif",
      },
    },
  },
  ocean: {
    label: "Ocean",
    styles: {
      light: {
        background: "#f0f9ff",
        foreground: "#0c4a6e",
        card: "#ffffff",
        "card-foreground": "#0c4a6e",
        popover: "#ffffff",
        "popover-foreground": "#0c4a6e",
        primary: "#0284c7",
        "primary-foreground": "#ffffff",
        secondary: "#e0f2fe",
        "secondary-foreground": "#075985",
        muted: "#e0f2fe",
        "muted-foreground": "#0369a1",
        accent: "#bae6fd",
        "accent-foreground": "#0c4a6e",
        destructive: "#dc2626",
        "destructive-foreground": "#ffffff",
        border: "#bae6fd",
        input: "#bae6fd",
        ring: "#0284c7",
        "chart-1": "#0284c7",
        "chart-2": "#0d9488",
        "chart-3": "#6366f1",
        "chart-4": "#f59e0b",
        "chart-5": "#ef4444",
        radius: "0.75rem",
        sidebar: "#0369a1",
        "sidebar-foreground": "#f0f9ff",
        "sidebar-primary": "#38bdf8",
        "sidebar-primary-foreground": "#0c4a6e",
        "sidebar-accent": "#0284c7",
        "sidebar-accent-foreground": "#f0f9ff",
        "sidebar-border": "#075985",
        "sidebar-ring": "#38bdf8",
        "font-sans": "Inter, sans-serif",
      },
      dark: {
        background: "#082f49",
        foreground: "#e0f2fe",
        card: "#0c4a6e",
        "card-foreground": "#e0f2fe",
        popover: "#0c4a6e",
        "popover-foreground": "#e0f2fe",
        primary: "#38bdf8",
        "primary-foreground": "#082f49",
        secondary: "#075985",
        "secondary-foreground": "#e0f2fe",
        muted: "#075985",
        "muted-foreground": "#7dd3fc",
        accent: "#0369a1",
        "accent-foreground": "#e0f2fe",
        destructive: "#f87171",
        "destructive-foreground": "#ffffff",
        border: "#075985",
        input: "#075985",
        ring: "#38bdf8",
        "chart-1": "#38bdf8",
        "chart-2": "#2dd4bf",
        "chart-3": "#a5b4fc",
        "chart-4": "#fbbf24",
        "chart-5": "#f87171",
        radius: "0.75rem",
        sidebar: "#082f49",
        "sidebar-foreground": "#e0f2fe",
        "sidebar-primary": "#38bdf8",
        "sidebar-primary-foreground": "#082f49",
        "sidebar-accent": "#0c4a6e",
        "sidebar-accent-foreground": "#e0f2fe",
        "sidebar-border": "#075985",
        "sidebar-ring": "#38bdf8",
        "font-sans": "Inter, sans-serif",
      },
    },
  },
};

/**
 * Terapkan preset + mode ke documentElement (tanpa reload).
 * Setiap key → CSS variable --{key}.
 */
export function applyTheme(presetId: string, mode: ThemeMode): void {
  const preset = themePresets[presetId] ?? themePresets.pelindo;
  const styles = preset.styles[mode];
  const root = document.documentElement;

  // Toggle class dark untuk variant Tailwind
  root.classList.toggle("dark", mode === "dark");

  for (const [key, value] of Object.entries(styles)) {
    root.style.setProperty(`--${key}`, value);
  }

  // Persist preferensi lokal
  localStorage.setItem("simfas-theme-preset", presetId);
  localStorage.setItem("simfas-theme-mode", mode);
}

export function loadStoredTheme(): { presetId: string; mode: ThemeMode } {
  const presetId = localStorage.getItem("simfas-theme-preset") ?? "pelindo";
  const mode = (localStorage.getItem("simfas-theme-mode") as ThemeMode) ?? "light";
  return { presetId, mode };
}
