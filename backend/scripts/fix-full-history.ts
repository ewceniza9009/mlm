import mongoose from 'mongoose';
import Wallet from '../models/Wallet';
import Commission from '../models/Commission';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const fixFullHistory = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mlm';
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ username: 'root' });
        if (!user) { console.log('User root not found'); process.exit(); }

        const wallet = await Wallet.findOne({ userId: user._id });
        const commission = await Commission.findOne({ userId: user._id });

        if (!wallet || !commission) { console.log('Records not found'); process.exit(); }

        // 1. Backfill Commission History if empty but total exists
        const hasCommissionHistory = commission.history.some((h: any) => h.type === 'CUSTOM');
        if (!hasCommissionHistory && commission.totalEarned >= 12000) {
            commission.history.unshift({
                type: 'CUSTOM',
                amount: 12000,
                date: new Date(Date.now() - 86400000 * 60), // 60 days ago
                details: 'Legacy Earnings (Imported)'
            } as any);
            await commission.save();
            console.log('✅ Backfilled Commission History (+12,000)');
        }

        // 2. Backfill Wallet: Add Deposit +12000
        const hasWalletLegacyDeposit = wallet.transactions.some((t: any) => t.description === 'Legacy Earnings (Imported)');
        if (!hasWalletLegacyDeposit) {
            wallet.transactions.push({
                type: 'DEPOSIT',
                amount: 12000,
                date: new Date(Date.now() - 86400000 * 60),
                description: 'Legacy Earnings (Imported)',
                status: 'COMPLETED'
            } as any);
            console.log('✅ Backfilled Wallet Deposit (+12,000)');
        }

        // 3. Backfill Wallet: Add Withdrawal -7000
        const hasWalletLegacyWithdrawal = wallet.transactions.some((t: any) => t.description === 'Legacy Payouts (Imported)');
        if (!hasWalletLegacyWithdrawal) {
            wallet.transactions.push({
                type: 'WITHDRAWAL',
                amount: -7000,
                date: new Date(Date.now() - 86400000 * 30), // 30 days ago
                description: 'Legacy Payouts (Imported)',
                status: 'COMPLETED'
            } as any);
            console.log('✅ Backfilled Wallet Withdrawal (-7,000)');
        }

        // Sort valid transactions
        wallet.transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Recalculate balance just to be safe: 12000 - 7000 + 22 = 5022
        // We trust the current balance logic but this makes the history match.

        await wallet.save();
        console.log('✅ Wallet History Synced.');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixFullHistory();
