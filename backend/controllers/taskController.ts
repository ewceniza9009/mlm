import { Request, Response } from 'express';
import Task, { ITask } from '../models/Task';
import Order from '../models/Order';
import User from '../models/User';

// Get Tasks (and generate new ones if needed)
export const getTasks = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user._id;

        // 1. Run "Bot" logic to generate new tasks (Idempotent)
        await generateAutomatedTasks(userId);

        // 2. Fetch pending tasks
        const tasks = await Task.find({
            userId,
            status: 'PENDING'
        }).sort({ priority: -1, createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        console.error('Get Tasks Error:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
};

// Mark Task as Completed/Dismissed
export const updateTaskStatus = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body; // 'COMPLETED' or 'DISMISSED'

        const task = await Task.findByIdAndUpdate(
            taskId,
            { status },
            { new: true }
        );

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task' });
    }
};

// --- Helper: Automated Task Generation Logic ---
const generateAutomatedTasks = async (userId: string) => {
    // Logic 1: Find Direct Recruits stuck in "pending_payment" for > 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const stuckRecruits = await User.find({
        sponsorId: userId,
        status: 'pending_payment',
        enrollmentDate: { $lt: oneDayAgo }
    });

    for (const recruit of stuckRecruits) {
        // Check if task already exists
        const existing = await Task.findOne({
            userId,
            type: 'ACTIVATION_REMINDER',
            relatedUserId: recruit._id,
            status: 'PENDING' // Only ensure we don't have a PENDING one
        });

        if (!existing) {
            await Task.create({
                userId,
                type: 'ACTIVATION_REMINDER',
                title: `Follow up with ${recruit.username}`,
                description: `${recruit.username} joined but hasn't bought a pack yet. Give them a call!`,
                relatedUserId: recruit._id,
                priority: 'HIGH'
            });
        }
    }

    // Logic 2: Re-order Reminders (Customers who bought > 25 days ago)
    // Find orders where referrer is this user, created between 25 and 35 days ago
    const startWindow = new Date();
    startWindow.setDate(startWindow.getDate() - 35);
    const endWindow = new Date();
    endWindow.setDate(endWindow.getDate() - 25);

    const expiringOrders = await Order.find({
        referrerId: userId,
        createdAt: { $gte: startWindow, $lt: endWindow },
        status: 'PAID'
    }).populate('userId');

    for (const order of expiringOrders) {
        if (!order.userId) continue; // Skip guest orders for now if no user link (or handle via Guest Details)

        // Check if task exists
        const existing = await Task.findOne({
            userId,
            type: 'REORDER_REMINDER',
            relatedUserId: order.userId,
            status: { $in: ['PENDING', 'COMPLETED', 'DISMISSED'] },
            // Dismissal Logic: Do not reshow if dismissed within 15 days.
            createdAt: { $gte: startWindow }
        });

        if (!existing) {
            // @ts-ignore
            const customerName = order.userId.username || order.guestDetails?.name || 'Customer';

            await Task.create({
                userId,
                type: 'REORDER_REMINDER',
                title: `Re-order Nudge: ${customerName}`,
                description: `It's been ~30 days since ${customerName}'s last order. Ask if they need a refill!`,
                relatedUserId: order.userId,
                priority: 'MEDIUM'
            });
        }
    }
};
