import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Components
import DashboardLayout from './components/DashboardLayout';
import PendingPaymentGuard from './components/PendingPaymentGuard';

// Pages
// Pages
import DashboardHome from './pages/DashboardHome';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicShopPage from './pages/PublicShopPage';
import LandingPage from './pages/LandingPage'; // Import New Landing Page
import EnrollMember from './pages/EnrollMember';
import WalletPage from './pages/Wallet';
import ShopPage from './pages/ShopPage';
import Settings from './pages/Settings';
import Network from './pages/Network';
import SupportPage from './pages/SupportPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import WishlistPage from './pages/WishlistPage';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminCommissions from './pages/AdminCommissions';
import AdminPackages from './pages/AdminPackages';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import AdminSupportPage from './pages/AdminSupportPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminKYCPage from './pages/AdminKYCPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} /> {/* Root is now Landing */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/store" element={<PublicShopPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <PendingPaymentGuard>
                <DashboardLayout />
              </PendingPaymentGuard>
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="network" element={<Network />} />
          <Route path="enroll" element={<EnrollMember />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/orders" element={<OrderHistoryPage />} />
          <Route path="shop/wishlist" element={<WishlistPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<SupportPage />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/commissions" element={<AdminCommissions />} />
          <Route path="admin/packages" element={<AdminPackages />} />
          <Route path="admin/withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="admin/support" element={<AdminSupportPage />} />
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/kyc" element={<AdminKYCPage />} />
          <Route path="admin/settings" element={<AdminSettingsPage />} />
          <Route path="admin/products" element={<AdminProductsPage />} />
          <Route path="admin/orders" element={<AdminOrdersPage />} />
        </Route>

        {/* Redirect Legacy Routes */}
        <Route path="/network" element={<Navigate to="/dashboard/network" replace />} />
        <Route path="/enroll" element={<Navigate to="/dashboard/enroll" replace />} />
        <Route path="/wallet" element={<Navigate to="/dashboard/wallet" replace />} />
        <Route path="/shop" element={<Navigate to="/dashboard/shop" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
        <Route path="/support" element={<Navigate to="/dashboard/support" replace />} />
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;