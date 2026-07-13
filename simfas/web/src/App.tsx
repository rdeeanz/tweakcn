/**
 * Router SIMFAS — presentation layer entry.
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/presentation/hooks/use-auth";
import { ThemeProvider } from "@/presentation/hooks/use-theme";
import { AppLayout } from "@/presentation/layouts/AppLayout";
import { ProtectedRoute } from "@/presentation/pages/ProtectedRoute";
import { LoginPage } from "@/presentation/pages/LoginPage";
import { DashboardPage } from "@/presentation/pages/DashboardPage";
import { BranchReportPage } from "@/presentation/pages/BranchReportPage";
import { RegionalRecapPage } from "@/presentation/pages/RegionalRecapPage";
import { InspectionPage } from "@/presentation/pages/InspectionPage";
import { MasterDataPage } from "@/presentation/pages/MasterDataPage";
import { UsersPage } from "@/presentation/pages/UsersPage";
import { AuditPage } from "@/presentation/pages/AuditPage";
import { ThemePage } from "@/presentation/pages/ThemePage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="laporan" element={<BranchReportPage />} />
              <Route path="rekap" element={<RegionalRecapPage />} />
              <Route path="inspeksi" element={<InspectionPage />} />
              <Route path="master" element={<MasterDataPage />} />
              <Route path="pengguna" element={<UsersPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="tema" element={<ThemePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
