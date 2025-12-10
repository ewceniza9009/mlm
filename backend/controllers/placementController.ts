import { Request, Response } from 'express';
import User from '../models/User';
import { CommissionEngine } from '../services/CommissionEngine';
import spilloverService from '../services/spilloverService';

export const getHoldingTank = async (req: Request, res: Response) => {
    try {
        // Find users sponsored by me, who are NOT placed yet
        // @ts-ignore
        const userId = req.user._id;
        const pendingUsers = await User.find({ sponsorId: userId, isPlaced: false });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching holding tank' });
    }
};

export const placeUserManually = async (req: Request, res: Response) => {
    try {
        const { userId, targetParentId, position } = req.body; // userId to place, where to put them
        const sponsorId = (req as any).user._id;

        const userToPlace = await User.findById(userId).populate('enrollmentPackage');
        if (!userToPlace || userToPlace.isPlaced) {
            return res.status(400).json({ message: 'User not valid for placement' });
        }

        // Security: Ensure logged in user is the sponsor
        if (userToPlace.sponsorId?.toString() !== sponsorId.toString()) {
            return res.status(403).json({ message: 'Not authorized to place this user' });
        }

        const parent = await User.findById(targetParentId);
        if (!parent) return res.status(404).json({ message: 'Target parent not found' });

        // Check if spot is empty
        if (position === 'left' && parent.leftChildId) return res.status(400).json({ message: 'Left spot occupied' });
        if (position === 'right' && parent.rightChildId) return res.status(400).json({ message: 'Right spot occupied' });

        // Update Links
        userToPlace.parentId = parent._id as any;
        userToPlace.position = position;
        userToPlace.isPlaced = true;

        if (position === 'left') parent.leftChildId = userToPlace._id as any;
        else parent.rightChildId = userToPlace._id as any;

        await parent.save();
        await userToPlace.save(); // pre-save hook handles path/level updates

        // Trigger Commissions (Bonuses delayed until placement)
        await CommissionEngine.distributeReferralBonus(sponsorId, userToPlace._id as any);

        const pkg: any = userToPlace.enrollmentPackage;
        if (pkg && pkg.pv) {
            await CommissionEngine.updateUplinePV(userToPlace._id as any, pkg.pv);
        }

        res.json({ message: 'User placed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Placement failed' });
    }
};
