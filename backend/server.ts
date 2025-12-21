import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import genealogyRoutes from './routes/genealogyRoutes';
import adminRoutes from './routes/adminRoutes';
import packageRoutes from './routes/packageRoutes';
import walletRoutes from './routes/walletRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

import { seedDatabase } from './services/seederService';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    await seedDatabase();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('MLM Backend API Running (TS)');
});

import analyticsRoutes from './routes/analyticsRoutes';

import supportRoutes from './routes/supportRoutes';
import securityRoutes from './routes/securityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import settingsRoutes from './routes/settingsRoutes';

import taskRoutes from './routes/taskRoutes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/network', genealogyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/shop', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Serve uploads statically
app.use('/uploads', express.static('uploads'));