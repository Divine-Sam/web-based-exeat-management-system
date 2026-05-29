import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewRequestPage } from './pages/student/NewRequestPage';
import { RequestHistoryPage } from './pages/student/RequestHistoryPage';
import { RequestDetailPage } from './pages/student/RequestDetailPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { SecurityDeskPage } from './pages/security/SecurityDeskPage';
import { AccountSettingsPage } from './pages/account/AccountSettingsPage';
import { PageLoader } from './components/LoadingSpinner';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { SuperAdminUsersPage } from './pages/superadmin/SuperAdminUsersPage';
import { SuperAdminAuditPage } from './pages/superadmin/SuperAdminAuditPage';
import { SuperAdminLoginPage } from './pages/superadmin/SuperAdminLoginPage';

// Add inside <Routes> before the * catch-all route:
<Route path="/superadmin/login" element={<SuperAdminLoginPage />} />

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="/requests/new" element={
              <ProtectedRoute allowedRoles={['student']}>
                <NewRequestPage />
              </ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute allowedRoles={['student']}>
                <RequestHistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/requests/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <RequestDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/requests" element={
              <ProtectedRoute allowedRoles={['hall_admin', 'dean']}>
                <AdminRequestsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/audit" element={
              <ProtectedRoute allowedRoles={['hall_admin', 'dean']}>
                <AuditLogPage />
              </ProtectedRoute>
            } />

            <Route path="/security/requests" element={
              <ProtectedRoute allowedRoles={['security']}>
                <SecurityDeskPage />
              </ProtectedRoute>
            } />

            <Route path="/account/settings" element={
              <ProtectedRoute>
                <AccountSettingsPage />
              </ProtectedRoute>
            } />

            {/* ✅ Super Admin routes — inside Routes where they belong */}
            <Route path="/superadmin" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/users" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminUsersPage />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/audit" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminAuditPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;