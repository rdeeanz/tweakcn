/**
 * Theme provider — ganti preset/mode tanpa reload (CSS variables).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  loadStoredTheme,
  themePresets,
  type ThemeMode,
} from "@/presentation/theme/presets";
import { api, getToken } from "@/infrastructure/api-client";

interface ThemeContextValue {
  presetId: string;
  mode: ThemeMode;
  setPreset: (id: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  presets: typeof themePresets;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredTheme();
  const [presetId, setPresetId] = useState(stored.presetId);
  const [mode, setModeState] = useState<ThemeMode>(stored.mode);

  // Apply on mount & change
  useEffect(() => {
    applyTheme(presetId, mode);
  }, [presetId, mode]);

  const setPreset = useCallback((id: string) => {
    setPresetId(id);
    // Persist ke server jika login
    if (getToken()) {
      void api("/api/auth/theme", {
        method: "PATCH",
        body: JSON.stringify({ themePreset: id }),
      }).catch(() => undefined);
    }
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    if (getToken()) {
      void api("/api/auth/theme", {
        method: "PATCH",
        body: JSON.stringify({ themeMode: m }),
      }).catch(() => undefined);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      presetId,
      mode,
      setPreset,
      setMode,
      toggleMode,
      presets: themePresets,
    }),
    [presetId, mode, setPreset, setMode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
