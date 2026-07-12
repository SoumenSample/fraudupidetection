import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TransactionSimulator from './pages/TransactionSimulator';
import TransactionHistory from './pages/TransactionHistory';
import FraudAlerts from './pages/FraudAlerts';
import AdminDashboard from './pages/AdminDashboard';
import AdminTransactions from './pages/AdminTransactions';
import AdminFraudLogs from './pages/AdminFraudLogs';
import AdminUsers from './pages/AdminUsers';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <Layout>{children}</Layout> : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/transaction" element={<ProtectedRoute><TransactionSimulator /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><FraudAlerts /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
      <Route path="/admin/fraud-logs" element={<AdminRoute><AdminFraudLogs /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '16px' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
