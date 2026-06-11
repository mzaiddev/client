import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ReportsPage } from "./features/reports/ReportsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { TransactionsPage } from "./features/transactions/TransactionsPage";
import { UsersPage } from "./features/users/UsersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
