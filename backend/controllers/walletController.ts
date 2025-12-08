import { Request, Response } from 'express';
import Wallet from '../models/Wallet';

export const getMyWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ userId }).sort({ 'transactions.date': -1 });
    
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { amount, method, details } = req.body;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (amount < 10) {
      return res.status(400).json({ message: 'Minimum withdrawal is $10' });
    }

    // Deduct balance immediately to prevent double spend
    wallet.balance -= amount;
    
    wallet.transactions.unshift({
      type: 'WITHDRAWAL',
      amount: -amount,
      date: new Date(),
      description: `Payout Request via ${method} (${details})`,
      status: 'PENDING'
    } as any);

    await wallet.save();
    res.json({ message: 'Withdrawal requested successfully', balance: wallet.balance });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin only
export const processWithdrawal = async (req: Request, res: Response) => {
  try {
    const { userId, transactionId, action } = req.body; // action: 'APPROVE' | 'REJECT'
    
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    const tx = wallet.transactions.find((t: any) => t._id.toString() === transactionId);
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    if (tx.status !== 'PENDING') return res.status(400).json({ message: 'Transaction already processed' });

    if (action === 'APPROVE') {
      tx.status = 'COMPLETED';
      // Here you would integrate with Stripe/PayPal Payouts API
    } else if (action === 'REJECT') {
      tx.status = 'FAILED';
      // Refund balance
      wallet.balance += Math.abs(tx.amount);
      wallet.transactions.unshift({
        type: 'DEPOSIT',
        amount: Math.abs(tx.amount),
        date: new Date(),
        description: `Refund: Withdrawal Rejected`,
        status: 'COMPLETED'
      } as any);
    }

    await wallet.save();
    res.json({ message: `Withdrawal ${action.toLowerCase()}d` });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};