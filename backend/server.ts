import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import Routes
import authRoutes from './routes/authRoutes';
import genealogyRoutes from './routes/genealogyRoutes';
import adminRoutes from './routes/adminRoutes';
import walletRoutes from './routes/walletRoutes'; // Ensure this exists from previous steps

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Base Route
app.get('/', (req, res) => {
  res.send('MLM Backend API Running (TS)');
});

// Mount API Routes
app.use('/api/v1/auth', authRoutes);       // <--- CRITICAL FOR LOGIN
app.use('/api/v1/network', genealogyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wallet', walletRoutes);

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});