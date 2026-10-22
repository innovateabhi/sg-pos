import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Orders from './pages/Orders';
import MenuManagement from './pages/MenuManagement';
import Tables from './pages/Tables';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import Settings from './pages/Settings';

// Protected Route Wrapper
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F4] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600 mt-3">Connecting Saffron Grill POS Terminal...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Manager/Owner Guard
function ManagerRoute({ children }) {
  const { isManager, loading } = useAuth();

  if (loading) return null;
  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Public Route (redirects to dashboard if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/staff"
              element={
                <ManagerRoute>
                  <StaffManagement />
                </ManagerRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

