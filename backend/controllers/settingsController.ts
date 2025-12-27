import { Request, Response } from 'express';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest } from '../middleware/authMiddleware';

// Retrieve all settings (Authenticated access required for general settings)
export const getSettings = async (req: Request, res: Response) => {
    try {
        const settings = await SystemSetting.find({});
        // Transform to simple object { key: value }
        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Public settings (safe for unauthenticated users)
export const getPublicSettings = async (req: Request, res: Response) => {
    try {
        const publicKeys = ['shopFirstEnrollment'];
        const settings = await SystemSetting.find({ key: { $in: publicKeys } });

        const settingsMap: Record<string, any> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin only: Update a setting
export const updateSetting = async (req: AuthRequest, res: Response) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ message: 'Key is required' });
        }

        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { key, value, updatedAt: new Date() },
            { new: true, upsert: true } // Create if doesn't exist
        );

        // SAFEGUARD: If disabling shop, also disable Shop First Enrollment & Holding Tank to prevent conflicts
        if (key === 'enableShop' && value === false) {
            await SystemSetting.updateMany(
                { key: { $in: ['shopFirstEnrollment', 'shopFirstHoldingTank'] } },
                { value: false, updatedAt: new Date() }
            );
        }

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper for other controllers to get a value quickly
export const getSettingValue = async (key: string, defaultValue: any = null) => {
    const setting = await SystemSetting.findOne({ key });
    return setting ? setting.value : defaultValue;
};
