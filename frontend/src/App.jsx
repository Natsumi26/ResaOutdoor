import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Users from './pages/Users';
import Products from './pages/Products';
import GiftVouchers from './pages/GiftVouchers';
import Reservations from './pages/Reservations';
import Emails from './pages/Emails';
import Resellers from './pages/Resellers';
import Preferences from './pages/Preferences';
import PaymentPreferences from './pages/PaymentPreferences';
import SiteIntegration from './pages/SiteIntegration';
import Team from './pages/Team';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Pages client
import CanyonSearch from './pages/client/CanyonSearch';
import CanyonDetails from './pages/client/CanyonDetails';
import CalendarEmbed from './pages/client/CalendarEmbed';
import BookingForm from './pages/client/BookingForm';
import BookingPayment from './pages/client/BookingPayment';
import ClientPaymentSuccess from './pages/client/PaymentSuccess';
import BookingConfirmation from './pages/client/BookingConfirmation';
import MyBooking from './pages/client/MyBooking';
import GiftVoucherPurchase from './pages/client/GiftVoucherPurchase';
import GiftVoucherPayment from './pages/client/GiftVoucherPayment';
import GiftVoucherSuccess from './pages/client/GiftVoucherSuccess';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />

      {/* Pages de paiement - accessibles sans authentification */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Routes client - accessibles sans authentification (pour iframe WordPress) */}
      <Route path="/client/search" element={<CanyonSearch />} />
      <Route path="/client/canyon/:id" element={<CanyonDetails />} />
      <Route path="/client/embed/calendar/:id" element={<CalendarEmbed />} />
      <Route path="/client/book/:sessionId" element={<BookingForm />} />
      <Route path="/client/payment" element={<BookingPayment />} />
      <Route path="/client/payment-confirmation" element={<ClientPaymentSuccess />} />
      <Route path="/client/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
      <Route path="/client/my-booking/:bookingId" element={<MyBooking />} />
      <Route path="/client/gift-voucher" element={<GiftVoucherPurchase />} />
      <Route path="/client/gift-voucher/payment" element={<GiftVoucherPayment />} />
      <Route path="/client/gift-voucher/success" element={<GiftVoucherSuccess />} />
      <Route path="/gift-voucher/payment/success" element={<GiftVoucherSuccess />} />

      {/* Routes admin/guide - authentification requise */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      >
        <Route index element={<Calendar />} />
        <Route path="users" element={<Users />} />
        <Route path="team" element={<Team />} />
        <Route path="products" element={<Products />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="gift-vouchers" element={<GiftVouchers />} />
        <Route path="settings/emails" element={<Emails />} />
        <Route path="settings/online-sales" element={<Navigate to="/settings/preferences/payment-preferences?tab=online-sales" />} />
        <Route path="settings/resellers" element={<Resellers />} />
        <Route path="settings/newsletter" element={<Navigate to="/settings/emails?tab=newsletter" />} />
        <Route path="settings/preferences/personalization" element={<Preferences />} />
        <Route path="settings/preferences/payment-preferences" element={<PaymentPreferences />} />
        <Route path="settings/site-integration" element={<SiteIntegration />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
