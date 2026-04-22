import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance as queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Toaster } from '@/components/ui/toaster';

import Login from '@/pages/Login';
import AdminLayout from '@/components/AdminLayout';
import TenantLayout from '@/components/TenantLayout';

import Dashboard from '@/pages/admin/Dashboard';
import Tenants from '@/pages/admin/Tenants';
import Units from '@/pages/admin/Units';
import Payments from '@/pages/admin/Payments';
import Debts from '@/pages/admin/Debts';
import Contracts from '@/pages/admin/Contracts';
import Notifications from '@/pages/admin/Notifications';
import PendingTenants from '@/pages/admin/PendingTenants';
import Register from '@/pages/Register';

import MyStatus from '@/pages/tenant/MyStatus';
import MyPayments from '@/pages/tenant/MyPayments';
import MyContract from '@/pages/tenant/MyContract';
import MyNotifications from '@/pages/tenant/MyNotifications';

const ADMIN_EMAIL = 'matias.mf21@gmail.com';

function AppRoutes() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
     <Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="*" element={<Navigate to="/login" />} />
</Routes>
    );
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  if (isAdmin) {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/units" element={<Units />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/notifications" element={<Notifications />} />
<Route path="/pending" element={<PendingTenants />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<TenantLayout />}>
        <Route path="/" element={<MyStatus />} />
        <Route path="/my-payments" element={<MyPayments />} />
        <Route path="/my-contract" element={<MyContract />} />
        <Route path="/my-notifications" element={<MyNotifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}