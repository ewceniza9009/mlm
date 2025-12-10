import mongoose from 'mongoose';
import Wallet from '../models/Wallet';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const fixHistory = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mlm';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ username: 'root' });
        if (!user) { console.log('User root not found'); process.exit(); }

        const wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) { console.log('Wallet not found'); process.exit(); }

        // Check if we already added it to avoid duplicates
        const exists = wallet.transactions.some((t: any) => t.description === 'Previous Payouts (Imported)');
        if (exists) {
            console.log('Fix already applied.');
            process.exit();
        }

        // Add the missing transaction
        const missingAmount = 7000;

        wallet.transactions.push({
            type: 'WITHDRAWAL',
            amount: -missingAmount,
            date: new Date(Date.now() - 86400000 * 30), // 30 days ago
            description: 'Previous Payouts (Imported)',
            status: 'COMPLETED'
        } as any);

        // Sort transactions by date (descending)
        wallet.transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        await wallet.save();
        console.log(`✅ Added missing transaction of -$${missingAmount}`);
        console.log('Refreshed Wallet History.');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixHistory();
