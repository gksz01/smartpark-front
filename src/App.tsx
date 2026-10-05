import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './core/gates'
import { AccessPage, ConfigurationPage, DashboardPage, MedicalAgreementPage, SpacesPage } from './features/admin/AdminPages'
import { HomePage, ParkingDetailPage, ParkingSearchPage, PaymentsPage, ReservationPage } from './features/parking/PortalPages'
import { SelectionPage } from './features/selection/SelectionPage'
import { TariffsPage } from './features/tariffs/TariffsPage'
import { UsersPage } from './features/users/UsersPage'
import { VehiclesPage } from './features/vehicles/VehiclesPage'
import { AdminLayout, PortalLayout } from './shared/layout'

const portal = (page: React.ReactNode, permission: 'portal' | 'vehicles' = 'portal', features: Parameters<typeof ProtectedRoute>[0]['features'] = []) => (
  <ProtectedRoute permission={permission} features={features}><PortalLayout>{page}</PortalLayout></ProtectedRoute>
)

const admin = (page: React.ReactNode, permission: 'dashboard' | 'spaces' | 'access' | 'configuration' | 'medicalAgreement' | 'users', features: Parameters<typeof ProtectedRoute>[0]['features'] = []) => (
  <ProtectedRoute permission={permission} features={features}><AdminLayout>{page}</AdminLayout></ProtectedRoute>
)

export default function App() {
  return <Routes>
    <Route path="/" element={<SelectionPage />} />
    <Route path="/app/home" element={portal(<HomePage />)} />
    <Route path="/app/parking" element={portal(<ParkingSearchPage />)} />
    <Route path="/app/parking/:id" element={portal(<ParkingDetailPage />)} />
    <Route path="/app/reservations" element={portal(<ReservationPage />, 'portal', ['reservation'])} />
    {/* Rota antiga mantida como alias: mesma página */}
    <Route path="/app/reservations/new" element={portal(<ReservationPage />, 'portal', ['reservation'])} />
    <Route path="/app/vehicles" element={portal(<VehiclesPage />, 'vehicles')} />
    <Route path="/app/payments" element={portal(<PaymentsPage />, 'portal', ['payments', 'billing'])} />
    <Route path="/admin/dashboard" element={admin(<DashboardPage />, 'dashboard')} />
    <Route path="/admin/spaces" element={admin(<SpacesPage />, 'spaces')} />
    <Route path="/admin/access" element={admin(<AccessPage />, 'access')} />
    <Route path="/admin/users" element={admin(<UsersPage />, 'users')} />
    <Route path="/admin/tariffs" element={admin(<TariffsPage />, 'configuration', ['billing'])} />
    <Route path="/admin/configuration" element={admin(<ConfigurationPage />, 'configuration')} />
    <Route path="/admin/medical-agreement" element={admin(<MedicalAgreementPage />, 'medicalAgreement', ['medicalAgreement'])} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
