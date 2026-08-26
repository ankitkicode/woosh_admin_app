import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { AdminLayout } from '../common/layouts/AdminLayout';
import { AuthLayout } from '../common/layouts/AuthLayout';
import { LoginView } from '../modules/auth/pages/LoginView';
import { DashboardView } from '../modules/dashboard/pages/DashboardView';
import { RidersListPage } from '../modules/riders/pages/RidersListPage';
import { RiderDetailsPage } from '../modules/riders/pages/RiderDetailsPage';
import { PassengersView } from '../modules/passengers/pages/PassengersView';
import { RidesView } from '../modules/rides/pages/RidesView';
import { SettingsView } from '../modules/settings/pages/SettingsView';

export function AppRouter() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={!isAuthenticated ? <LoginView /> : <Navigate to="/dashboard" replace />} />
      </Route>

      {/* Protected Admin Routes */}
      <Route element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/rides" element={<RidesView />} />
        <Route path="/riders" element={<RidersListPage />} />
        <Route path="/riders/:id" element={<RiderDetailsPage />} />
        <Route path="/passengers" element={<PassengersView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
