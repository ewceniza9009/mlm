import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from '../store';

const PendingPaymentGuard = ({ children }: { children: JSX.Element }) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    if (user?.status === 'pending_payment') {
        // If pending payment, only allow access to Shop or Wallet (to fund wallet)
        if (!location.pathname.includes('/shop') && !location.pathname.includes('/wallet')) {
            return <Navigate to="/shop?activation_required=true" replace />;
        }
    }

    return children;
};

export default PendingPaymentGuard;
