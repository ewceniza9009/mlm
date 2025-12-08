import { Request, Response } from 'express';
import User from '../models/User';
import Commission from '../models/Commission';
import SystemLog from '../models/SystemLog';
import { CommissionEngine } from '../services/CommissionEngine';

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const commissions = await Commission.aggregate([
      { $group: { _id: null, total: { $sum: '$totalEarned' } } }
    ]);
    
    res.json({
      totalUsers,
      totalCommissions: commissions[0]?.total || 0,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const logs = await SystemLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

export const getCommissionsHistory = async (req: Request, res: Response) => {
  try {
    // Aggregate all history entries from all Commission documents
    const history = await Commission.aggregate([
      { $unwind: '$history' },
      { $sort: { 'history.date': -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          amount: '$history.amount',
          type: '$history.type',
          date: '$history.date',
          details: '$history.details'
        }
      }
    ]);

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching commission history' });
  }
};

export const runCommissionRun = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ isActive: true });
    
    await SystemLog.create({
        action: 'COMMISSION_RUN_START',
        details: `Started payout cycle for ${users.length} active users.`,
        type: 'INFO'
    });

    for (const user of users) {
      await CommissionEngine.runBinaryPairing(user._id as unknown as string);
    }
    
    await SystemLog.create({
        action: 'COMMISSION_RUN_COMPLETE',
        details: `Successfully processed binary pairing for ${users.length} users.`,
        type: 'SUCCESS'
    });

    res.json({ message: 'Commission Run Completed', usersProcessed: users.length });
  } catch (error) {
    await SystemLog.create({
        action: 'COMMISSION_RUN_FAILED',
        details: (error as Error).message,
        type: 'ERROR'
    });
    res.status(500).json({ message: 'Commission Run Failed' });
  }
};