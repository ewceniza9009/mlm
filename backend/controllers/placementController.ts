import { Request, Response } from 'express';
import User from '../models/User';
import { CommissionEngine } from '../services/CommissionEngine';
import spilloverService from '../services/spilloverService';

export const getHoldingTank = async (req: Request, res: Response) => {
    try {
        // Find users sponsored by me, who are NOT placed yet
        // @ts-ignore
        const userId = req.user._id;
        const pendingUsers = await User.find({ sponsorId: userId, isPlaced: false, status: 'active' });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching holding tank' });
    }
};

export const placeUserManually = async (req: Request, res: Response) => {
    try {
        const { userId, targetParentId, position } = req.body;
        const sponsorId = (req as any).user._id;
        const cleanParentId = targetParentId && typeof targetParentId === 'string' ? targetParentId.trim() : targetParentId;

        const userToPlace = await User.findById(userId).populate('enrollmentPackage');
        if (!userToPlace || userToPlace.isPlaced) {
            return res.status(400).json({ message: 'User not valid for placement' });
        }

        // Check if user is active (paid)
        if (userToPlace.status !== 'active') {
            return res.status(400).json({ message: 'User is not active (unpaid) and cannot be placed.' });
        }

        // Security: Ensure logged in user is the sponsor
        if (userToPlace.sponsorId?.toString() !== sponsorId.toString()) {
            return res.status(403).json({ message: 'Not authorized to place this user' });
        }

        // Resolve Target Parent (by ID or Username)
        let parent;
        if (cleanParentId.match(/^[0-9a-fA-F]{24}$/)) {
            parent = await User.findById(cleanParentId);
        } else {
            parent = await User.findOne({ username: cleanParentId });
        }

        if (!parent) return res.status(404).json({ message: `Target parent '${cleanParentId}' not found` });

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
        await userToPlace.save();

        const pkg: any = userToPlace.enrollmentPackage;

        // Trigger Commissions (Bonuses delayed until placement)
        const pkgPrice = pkg ? pkg.price : 0;
        await CommissionEngine.distributeReferralBonus(sponsorId, userToPlace._id as any, pkgPrice);

        if (pkg && pkg.pv) {
            await CommissionEngine.updateUplinePV(userToPlace._id as any, pkg.pv);
        }

        res.json({ message: 'User placed successfully' });

    } catch (error: any) {
        console.error('Placement Error:', error);
        res.status(500).json({ message: 'Placement failed: ' + (error.message || 'Unknown error') });
    }
};
