
import mongoose from 'mongoose';
import User from '../models/User';
import Commission from '../models/Commission';
import SystemConfig from '../models/SystemConfig';
import { CommissionEngine } from '../services/CommissionEngine';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const runTest = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/mlm');
        console.log('Connected to DB');

        // 1. Setup Config (1:2 Ratio)
        await SystemConfig.deleteMany({});
        await SystemConfig.create({
            commissionType: 'FIXED_PAIR',
            pairRatio: '1:2',
            commissionValue: 10,
            pairUnit: 100,
            dailyCapAmount: 500
        });
        console.log('Config set to 1:2 Ratio');

        // 2. Mock User
        const mockUserId = new mongoose.Types.ObjectId();
        // Reset User
        await User.deleteMany({ username: 'testuser_comm' });
        await Commission.deleteMany({ userId: mockUserId });

        await User.create({
            _id: mockUserId,
            username: 'testuser_comm',
            email: 'test@comm.com',
            password: 'hashedpassword',
            currentLeftPV: 300,
            currentRightPV: 600, // Should be 3 pairs (300 left : 600 right) for 1:2
            isActive: true
        });

        // 3. Run Engine
        await CommissionEngine.runBinaryPairing(mockUserId.toString());

        // 4. Verify
        const comm = await Commission.findOne({ userId: mockUserId });
        const user = await User.findById(mockUserId);

        console.log(`User Remaining PV: Left ${user?.currentLeftPV} | Right ${user?.currentRightPV}`);
        console.log(`Total Earned: $${comm?.totalEarned}`);

        if (comm?.totalEarned === 30 && user?.currentLeftPV === 0 && user?.currentRightPV === 0) {
            console.log('✅ TEST PASSED: 3 Pairs matched correctly for 1:2 ratio.');
        } else {
            console.error('❌ TEST FAILED');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runTest();
