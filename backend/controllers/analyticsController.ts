import { Request, Response } from 'express';
import Commission from '../models/Commission';
import User from '../models/User';
import mongoose from 'mongoose';

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
