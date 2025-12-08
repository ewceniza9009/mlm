import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm';

const simulate = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB for simulation.');

    // Find Root User
    const root = await User.findOne({ username: 'root' });
    if (!root) {
        console.log('Root user not found. Please run seed-data.ts first.');
        process.exit(1);
    }

    console.log(`Current PV [${root.username}]: Left ${root.currentLeftPV} | Right ${root.currentRightPV}`);

    // Add 500 PV to both legs (Should equal 5 pairs = $50 commission)
    // In Mongoose, you update the document directly
    root.currentLeftPV = (root.currentLeftPV || 0) + 500;
    root.currentRightPV = (root.currentRightPV || 0) + 500;
    
    await root.save();

    console.log(`New PV [${root.username}]: Left ${root.currentLeftPV} | Right ${root.currentRightPV}`);
    console.log('----------------------------------------------------');
    console.log('PV Injected Successfully.');
    console.log('1. Go to the Admin Dashboard in the Frontend.');
    console.log('2. Click "Run Payout Cycle".');
    console.log('3. Check the Root user Wallet to see the commission.');
    console.log('----------------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

simulate();