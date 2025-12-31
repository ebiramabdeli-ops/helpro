import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LanguageGate from './components/LanguageGate/LanguageGate';
import Layout from './components/Layout/Layout';
import { shouldShowLanguageGate } from './utils/storage';

// Public Pages
import LanguageSelection from './pages/LanguageSelection';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// User Pages
import Dashboard from './pages/Dashboard';
import Requests from './pages/Requests';
import Bookings from './pages/Bookings';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Booking Flow Pages (Phase 0-10 User Journey)
import ServiceSelection from './pages/ServiceSelection';
import BookingFlow from './pages/BookingFlow';
import BookingPricing from './pages/BookingPricing';
import TrustConfirmation from './pages/TrustConfirmation';
import OrderConfirmation from './pages/OrderConfirmation';
import BookingStatus from './pages/BookingStatus';
import ServiceSupport from './pages/ServiceSupport';
import FeedbackFlow from './pages/FeedbackFlow';

// Admin Pages (INTERNAL ONLY - NEVER IN PUBLIC NAVIGATION)
import { AdminGuard } from './guards/AdminGuard';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminForbidden from './pages/admin/AdminForbidden';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has selected language
    const hasLanguage = localStorage.getItem('helpro_language');
    setShowLanguageSelection(!hasLanguage);
    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  // Show language selection as first screen
  if (showLanguageSelection) {
    return <LanguageSelection />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* ============================================ */}
        {/* PUBLIC ROUTES (User App)                     */}
        {/* ============================================ */}
        <Route element={<Layout><Routes /></Layout>}>
          {/* Language Selection */}
          <Route path="/language" element={<LanguageSelection />} />
          
          {/* Marketing */}
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          
          {/* Booking Flow (Phase 0-10 User Journey) */}
          <Route path="/service/:serviceId" element={<ServiceSelection />} />
          <Route path="/booking/:serviceId/:subServiceId" element={<BookingFlow />} />
          <Route path="/booking/pricing" element={<BookingPricing />} />
          <Route path="/booking/trust" element={<TrustConfirmation />} />
          <Route path="/booking/confirm" element={<OrderConfirmation />} />
          <Route path="/booking/status" element={<BookingStatus />} />
          <Route path="/booking/support" element={<ServiceSupport />} />
          <Route path="/booking/feedback" element={<FeedbackFlow />} />
          
          {/* App */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* 404 */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>

        {/* ============================================ */}
        {/* ADMIN ROUTES (Internal Only)                 */}
        {/* CRITICAL: Never accessible from public UI    */}
        {/* ============================================ */}
        
        {/* Admin Login (No Guard) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/forbidden" element={<AdminForbidden />} />
        
        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<div>Admin Users Page (TODO)</div>} />
          <Route path="orders" element={<div>Admin Orders Page (TODO)</div>} />
          <Route path="payments" element={<div>Admin Payments Page (TODO)</div>} />
          <Route path="complaints" element={<div>Admin Complaints Page (TODO)</div>} />
          <Route path="ai" element={<div>Admin AI System Page (TODO)</div>} />
          <Route path="system" element={<div>Admin System Page (TODO)</div>} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
