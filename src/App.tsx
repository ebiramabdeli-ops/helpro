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
// Problem-driven operational dashboard
import { AdminGuard } from './guards/AdminGuard';
import AdminLayout from './components/admin/AdminLayout';
import AdminProblemOverview from './pages/admin/AdminProblemOverview';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProviders from './pages/admin/AdminProviders';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminAI from './pages/admin/AdminAI';
import AdminSystem from './pages/admin/AdminSystem';

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
        {/* Problem-Resolution System                    */}
        {/* ============================================ */}
        
        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout>
                <Routes>
                  <Route index element={<AdminProblemOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="users/:userId" element={<AdminUserDetail />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="providers/:providerId" element={<AdminProviders />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="bookings/:bookingId" element={<AdminBookings />} />
                  <Route path="payments" element={<AdminPayments />} />
                  <Route path="payments/:paymentId" element={<AdminPayments />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="complaints/:complaintId" element={<AdminComplaints />} />
                  <Route path="ai" element={<AdminAI />} />
                  <Route path="system" element={<AdminSystem />} />
                  <Route path="logs" element={<AdminSystem />} />
                </Routes>
              </AdminLayout>
            </AdminGuard>
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
