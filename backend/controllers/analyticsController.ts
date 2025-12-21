import { Request, Response } from 'express';
import Commission from '../models/Commission';
import User from '../models/User';
import mongoose from 'mongoose';

// Formatting Helper
const formatCommissionType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export const getHypeTicker = async (req: Request, res: Response) => {
    try {
        // 1. Get New Members (Last 5)
        // Public data, so no auth check strictly needed, but route is likely protected.
        const newMembers = await User.find({ role: 'member' })
            .select('username enrollmentDate profileImage')
            .sort({ enrollmentDate: -1 })
            .limit(5)
            .lean();

        // 2. Get Recent Commissions (Last 5 across system)
        const recentCommissions = await Commission.aggregate([
            { $unwind: '$history' },
            { $match: { 'history.amount': { $gt: 0 } } },
            { $sort: { 'history.date': -1 } },
            { $limit: 5 },
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
                    date: '$history.date'
                }
            }
        ]);

        // 3. Normalize Events
        const events = [
            ...newMembers.map(m => ({
                id: m._id.toString(),
                type: 'NEW_MEMBER',
                username: m.username,
                message: `just joined the squad!`,
                timestamp: m.enrollmentDate,
                icon: '👋'
            })),
            ...recentCommissions.map((c, index) => ({
                id: `comm-${index}-${c.date}`,
                type: 'COMMISSION',
                username: c.username,
                message: `earned $${c.amount.toFixed(2)} from ${formatCommissionType(c.type)}`,
                timestamp: c.date,
                icon: '💰'
            }))
        ];

        // 4. Sort by Date Descending
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Return top 10 combined
        res.json(events.slice(0, 10));
    } catch (error) {
        console.error('Hype Ticker Error:', error);
        res.status(500).json({ message: 'Failed to fetch hype events' });
    }
};

export const getEarningsOverTime = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const matchStage = {
            $match: {
                userId: new mongoose.Types.ObjectId(userId)
            }
        };

        const unwindStage = { $unwind: '$history' };

        const dateFilterStage = {
            $match: {
                'history.date': { $gte: sevenDaysAgo }
            }
        };

        const groupStage = {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$history.date" } },
                amount: { $sum: '$history.amount' }
            }
        };

        const projectStage = {
            $project: {
                _id: 0,
                date: '$_id',
                amount: 1
            }
        };

        const results = await Commission.aggregate([
            matchStage,
            unwindStage,
            dateFilterStage,
            groupStage,
            projectStage,
            { $sort: { date: 1 } }
        ]);

        // Fill in missing days
        const filledData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const found = results.find((r: any) => r.date === dateStr);
            filledData.push({
                name: dayName,
                fullDate: dateStr,
                amount: found ? found.amount : 0
            });
        }

        res.json(filledData);
    } catch (error) {
        console.error('Earnings Analytics Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getRecruitGrowth = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;

        // Last 4 weeks
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const recruits = await User.aggregate([
            {
                $match: {
                    sponsorId: new mongoose.Types.ObjectId(userId),
                    enrollmentDate: { $gte: fourWeeksAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%U",
                            date: "$enrollmentDate"
                        }
                    },
                    count: { $sum: 1 },
                    minDate: { $min: "$enrollmentDate" }
                }
            },
            { $sort: { minDate: 1 } }
        ]);

        // Format for chart (Week 1, Week 2 etc is tricky if empty, lets just return the raw buckets for now or simplify)
        // Simplified: Just returning last 4 weeks fixed buckets is cleaner for UI

        // Let's do daily for growth too? Or just "Last 4 Weeks" buckets.
        // Let's map the results to "Week 1", "Week 2" etc relative to now?
        // Actually, simpler: Group by ISO Week.

        // To ensure we have 4 bars, let's manually build buckets
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - (i * 7) - 6);
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setDate(end.getDate() - (i * 7));
            end.setHours(23, 59, 59, 999);

            // Count recruits in this range from DB results? 
            // Easier to just query DB for this? Or processing in memory is fine for small scale.
            // Let's use memory filter on a simple fetch for now - safer/easier logic
        }

        // Simpler Approach: Just fetch all recruits from last 28 days and bucket in JS
        const recentRecruits = await User.find({
            sponsorId: userId,
            enrollmentDate: { $gte: fourWeeksAgo }
        }).select('enrollmentDate');

        const chartData = [
            { name: 'Week 1', recruits: 0 }, // Oldest
            { name: 'Week 2', recruits: 0 },
            { name: 'Week 3', recruits: 0 },
            { name: 'Week 4', recruits: 0 }, // Newest
        ];

        const today = new Date();

        recentRecruits.forEach((u) => {
            const diffTime = Math.abs(today.getTime() - new Date(u.enrollmentDate).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) chartData[3].recruits++;
            else if (diffDays <= 14) chartData[2].recruits++;
            else if (diffDays <= 21) chartData[1].recruits++;
            else if (diffDays <= 28) chartData[0].recruits++;
        });

        res.json(chartData);

    } catch (error) {
        console.error('Growth Analytics Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getFomoAlerts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const alerts = [];

        // Alert 1: Commission Risk (Inactive with Volume)
        if (!user.isActive && user.currentLeftPV > 0 && user.currentRightPV > 0) {
            const potentialPairs = Math.min(Math.floor(user.currentLeftPV / 100), Math.floor(user.currentRightPV / 100)); // 100 PV = 1 Pair
            const potentialLoss = potentialPairs * 10; // $10 per pair

            if (potentialPairs > 0) {
                alerts.push({
                    type: 'INACTIVE_LOSS',
                    severity: 'critical',
                    title: 'Commission Risk!',
                    message: `You are INACTIVE. Reactivate now to claim $${potentialLoss} in pending commissions!`,
                    actionLabel: 'Reactivate Now',
                    actionUrl: '/shop'
                });
            }
        }

        // Alert 2: Withdrawal Risk (High Volume, No KYC)
        if (user.kycStatus !== 'approved' && (user.currentLeftPV > 500 || user.currentRightPV > 500)) {
            alerts.push({
                type: 'KYC_PENDING',
                severity: 'warning',
                title: 'Verify Your Identity',
                message: 'High volume detected. Verify ID to ensure future withdrawals.',
                actionLabel: 'Upload ID',
                actionUrl: '/settings?tab=kyc'
            });
        }

        res.json(alerts);

    } catch (error) {
        console.error('FOMO Alerts Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const period = req.query.period || 'monthly'; // 'weekly' | 'monthly'
        const days = period === 'weekly' ? 7 : 30;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Top Recruiters
        const topRecruiters = await User.aggregate([
            {
                $match: {
                    enrollmentDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$sponsorId',
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    _id: { $ne: null } // Filter out root placement if any
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sponsor'
                }
            },
            {
                $unwind: '$sponsor'
            },
            {
                $project: {
                    _id: 1,
                    username: '$sponsor.username',
                    profileImage: '$sponsor.profileImage',
                    value: '$count'
                }
            }
        ]);

        // 2. Top Earners
        const topEarners = await Commission.aggregate([
            {
                $unwind: '$history'
            },
            {
                $match: {
                    'history.date': { $gte: startDate },
                    'history.amount': { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    total: { $sum: '$history.amount' }
                }
            },
            {
                $sort: { total: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    username: '$user.username',
                    profileImage: '$user.profileImage',
                    value: '$total'
                }
            }
        ]);

        res.json({
            period,
            recruiters: topRecruiters,
            earners: topEarners
        });

    } catch (error) {
        console.error('Leaderboard Error:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
};
