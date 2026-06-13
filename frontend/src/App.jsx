import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Ledgers from './pages/Ledgers'
import Products from './pages/Products'
import Purchases from './pages/Purchases'
import Payments from './pages/Payments'
import LedgerDetails from './pages/LedgerDetails'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerLedger from './pages/CustomerLedger'
import CustomerProfile from './pages/CustomerProfile'
import CustomerNotifications from './pages/CustomerNotifications'
import SplashScreen from './components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [fadeOut, setFadeOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 800);
      return () => clearTimeout(removeTimer);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AppProvider>
        {showSplash && <SplashScreen fadeOut={fadeOut} />}
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            duration: 4000, 
            style: { 
              background: '#0f172a', 
              color: '#f8fafc', 
              border: '1px solid #334155',
              borderRadius: '16px',
              fontSize: '14px'
            } 
          }} 
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Customer portal routes */}
          <Route
            path="/my-ledger"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MainLayout>
                  <CustomerLedger />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MainLayout>
                  <CustomerProfile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-notifications"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MainLayout>
                  <CustomerNotifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledgers"
            element={
              <ProtectedRoute allowedRoles={['shop_owner']}>
                <MainLayout>
                  <Ledgers />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledger/:id"
            element={
              <ProtectedRoute allowedRoles={['shop_owner']}>
                <MainLayout>
                  <LedgerDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={['shop_owner']}>
                <MainLayout>
                  <Products />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <ProtectedRoute allowedRoles={['shop_owner']}>
                <MainLayout>
                  <Purchases />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['shop_owner']}>
                <MainLayout>
                  <Payments />
                </MainLayout>
              </ProtectedRoute>
            }
          />




          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['shop_owner']}>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </Router>
  )
}

export default App
