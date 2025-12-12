import mongoose, { Document, Schema } from 'mongoose';

export interface IWalletTransaction {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'COMMISSION' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'PURCHASE' | 'BONUS';
  amount: number;
  date: Date;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
  transactions: IWalletTransaction[];
}

const walletSchema = new Schema<IWallet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  transactions: [{
    type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'TRANSFER_IN', 'TRANSFER_OUT', 'PURCHASE', 'BONUS'] },
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    description: { type: String },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' }
  }]
});

export default mongoose.model<IWallet>('Wallet', walletSchema);
