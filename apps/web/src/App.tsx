import { Navigate, Route, Routes } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HousesPage from './pages/HousesPage';
import HouseDetailPage from './pages/HouseDetailPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import ManagementPage from './pages/ManagementPage';
import type { Role } from './types';

function ProtectedRoute({ children, roles }: PropsWithChildren<{ roles?: Role[] }>) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-base-content/70">
        <span className="loading loading-spinner" aria-hidden="true" />
        <span>Caricamento profilo…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/case" element={<HousesPage />} />
        <Route path="/case/:slug" element={<HouseDetailPage />} />
        <Route
          path="/prenota/:slug"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/area"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestione"
          element={
            <ProtectedRoute roles={['GESTORE', 'ADMIN']}>
              <ManagementPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
