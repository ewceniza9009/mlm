import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';

export const getConfig = async (req: Request, res: Response) => {
    try {
        const config = await (SystemConfig as any).getLatest();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching config' });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { pairRatio, commissionValue, dailyCapAmount, pairUnit } = req.body;

        // Create new revision for history tracking
        const config = await SystemConfig.create({
            pairRatio,
            commissionValue,
            dailyCapAmount,
            pairUnit
        });

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error updating config' });
    }
};
