import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import AdminDashboard from './pages/AdminDashboard';
import AdminCommissions from './pages/AdminCommissions';
import AdminPackages from './pages/AdminPackages';
import SupportPage from './pages/SupportPage';
import AdminSupportPage from './pages/AdminSupportPage';
import AdminWithdrawalsPage from './pages/AdminWithdrawalsPage';
import AdminKYCPage from './pages/AdminKYCPage';
import EnrollMember from './pages/EnrollMember';
import Login from './pages/Login';
import Register from './pages/Register';
import WalletPage from './pages/Wallet';
import Settings from './pages/Settings';
import Network from './pages/Network';
import { useSelector } from 'react-redux';
import { RootState } from './store';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="network" element={<Network />} />
          <Route path="enroll" element={<EnrollMember />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<SupportPage />} />

          {/* Admin Routes */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/commissions" element={<AdminCommissions />} />
          <Route path="admin/packages" element={<AdminPackages />} />
          <Route path="admin/withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="admin/support" element={<AdminSupportPage />} />
          <Route path="admin/kyc" element={<AdminKYCPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;