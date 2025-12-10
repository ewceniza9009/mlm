import mongoose from 'mongoose';
import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const checkBalance = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mlm';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ username: 'root' });
        if (!user) { console.log('User not found'); process.exit(); }
        console.log(`User ID: ${user._id}`);

        const commission = await Commission.findOne({ userId: user._id });
        console.log('Commission Record:');
        console.log(`  Total Earned: $${commission?.totalEarned}`);

        const wallet = await Wallet.findOne({ userId: user._id });
        console.log('Wallet Record:');
        console.log(`  Balance: $${wallet?.balance}`);
        console.log('  Transactions:', wallet?.transactions.map(t => `${t.type}: ${t.amount}`).slice(0, 5));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkBalance();
