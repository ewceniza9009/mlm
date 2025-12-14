import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  email: string;
  enrollmentPackage?: string; // ID
  firstName?: string;
  middleName?: string;
  lastName?: string;
  occupation?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  isActive: boolean;
  status: 'pending_payment' | 'active' | 'suspended';
  role: 'admin' | 'distributor';
  kycStatus?: 'pending' | 'approved' | 'rejected';
  kycDocs?: string[];
  kycComment?: string;
  twoFactorSecret?: {
    temp?: string;
    secret?: string;
    enabled: boolean;
  };
  currentLeftPV: number;
  currentRightPV: number;
  personalPV: number;
  enrollmentDate: string;
  spilloverPreference?: string;
  enableHoldingTank?: 'system' | 'enabled' | 'disabled';
  sponsorId?: string;
  parentId?: string;
  rank?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

const initialState: AuthState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null,
  token: localStorage.getItem('token') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
