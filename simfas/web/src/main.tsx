import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme, loadStoredTheme } from "./presentation/theme/presets";

// Apply tema sebelum paint pertama (hindari flash)
const { presetId, mode } = loadStoredTheme();
applyTheme(presetId, mode);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
