import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
    // Commission Rules
    commissionType: 'FIXED_PAIR' | 'WEAK_LEG_PERCENT';
    pairRatio: '1:1' | '1:2' | '2:1' | '2:3' | '3:2';
    commissionValue: number; // e.g. 10 (for $10) or 10 (for 10%)
    pairUnit: number; // e.g. 100 PV

    // Limits
    dailyCapAmount: number; // e.g. 500
    flushCarryForward: boolean; // if true, flush non-earning leg too? usually false
    referralBonusPercentage: number; // e.g. 10 for 10%
    matchingBonusGenerations: number[]; // e.g. [10, 5, 2] for Levels 1, 2, 3

    // Registration
    defaultSponsor: string; // 'root'
    holdingTankMode: boolean; // if true, new users go to holding tank
}

const systemConfigSchema = new Schema<ISystemConfig>({
    commissionType: {
        type: String,
        enum: ['FIXED_PAIR', 'WEAK_LEG_PERCENT'],
        default: 'FIXED_PAIR'
    },
    pairRatio: {
        type: String,
        enum: ['1:1', '1:2', '2:1', '2:3', '3:2'],
        default: '1:1'
    },
    commissionValue: { type: Number, default: 10 },
    pairUnit: { type: Number, default: 100 },
    dailyCapAmount: { type: Number, default: 500 },
    flushCarryForward: { type: Boolean, default: false },
    referralBonusPercentage: { type: Number, default: 10 },
    matchingBonusGenerations: { type: [Number], default: [10, 5, 2] },
    defaultSponsor: { type: String, default: 'root' },
    holdingTankMode: { type: Boolean, default: false }
}, { timestamps: true });

// Singleton helper
systemConfigSchema.statics.getLatest = async function () {
    const config = await this.findOne().sort({ createdAt: -1 });
    if (config) return config;
    // create default
    return await this.create({});
};

export default mongoose.model<ISystemConfig>('SystemConfig', systemConfigSchema);
