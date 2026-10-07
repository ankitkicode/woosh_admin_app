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
import { PassengerDetailsPage } from '../modules/passengers/pages/PassengerDetailsPage';
import { RidesView } from '../modules/rides/pages/RidesView';
import { RideDetailsPage } from '../modules/rides/pages/RideDetailsPage';
import { SettingsView } from '../modules/settings/pages/SettingsView';
import { CitiesPage } from '../modules/cities/pages/CitiesPage';
import { CityFormPage } from '../modules/cities/pages/CityFormPage';
import { SOSAlertsPage } from '../modules/sos/pages/SOSAlertsPage';
import { DisputesPage } from '../modules/disputes/pages/DisputesPage';
import { InsuranceClaimsPage } from '../modules/insurance/pages/InsuranceClaimsPage';
import { SupportPage } from '../modules/support/pages/SupportPage';
import { PayoutsView } from '../modules/payouts/pages/PayoutsView';
import { AnalyticsView } from '../modules/dashboard/pages/AnalyticsView';

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
        <Route path="/analytics" element={<AnalyticsView />} />
        <Route path="/rides" element={<RidesView />} />
        <Route path="/rides/:id" element={<RideDetailsPage />} />
        <Route path="/riders" element={<RidersListPage />} />
        <Route path="/riders/:id" element={<RiderDetailsPage />} />
        <Route path="/passengers" element={<PassengersView />} />
        <Route path="/passengers/:id" element={<PassengerDetailsPage />} />
        <Route path="/sos" element={<SOSAlertsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/disputes" element={<DisputesPage />} />
        <Route path="/insurance" element={<InsuranceClaimsPage />} />
        <Route path="/cities" element={<CitiesPage />} />
        <Route path="/cities/add" element={<CityFormPage />} />
        <Route path="/cities/:id/edit" element={<CityFormPage />} />
        <Route path="/payouts" element={<PayoutsView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
