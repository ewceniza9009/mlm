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

        // Resolve Target Parent (by ID or Username) or Auto-Spillover
        let parent;
        let finalPosition = position; // Might be adjusted if we use spillover logic

        if (cleanParentId) {
            // Direct Parent Selection
            if (cleanParentId.match(/^[0-9a-fA-F]{24}$/)) {
                parent = await User.findById(cleanParentId);
            } else {
                parent = await User.findOne({ username: cleanParentId });
            }
            if (!parent) return res.status(404).json({ message: `Target parent '${cleanParentId}' not found` });

            // Check if spot is empty
            if (position === 'left' && parent.leftChildId) return res.status(400).json({ message: 'Left spot occupied' });
            if (position === 'right' && parent.rightChildId) return res.status(400).json({ message: 'Right spot occupied' });

            // Perform Placement Actions
            userToPlace.parentId = parent._id as any;
            userToPlace.position = position as 'left' | 'right';
            userToPlace.isPlaced = true;

            // Save user first (triggers path/level hooks)
            const savedUser = await userToPlace.save();

            // Link to Parent
            if (position === 'left') {
                parent.leftChildId = savedUser._id as any;
            } else {
                parent.rightChildId = savedUser._id as any;
            }
            await parent.save();

        } else {
            // Auto Spillover (No parent selected)
            // Use the selected leg ('left' or 'right') as the preference to find the extreme bottom.
            // spilloverService.placeUser handles finding the spot and linking the nodes structurally.
            // It does NOT trigger commissions, which is handled below in this controller.

            userToPlace.isPlaced = true;
            await spilloverService.placeUser(userToPlace as any, sponsorId, position);
        }

        const pkg: any = userToPlace.enrollmentPackage;

        // --- SHOP FIRST / HOLDING TANK FIX ---
        // 1. Determine Commission Base Amount (Referral Bonus)
        let commissionBase = 0;
        if (pkg) {
            commissionBase = pkg.price;
        } else {
            // No Package? Must be Shop First. Find the activation order.
            // We assume the first paid order is the activation order.
            // Need to import Order model. 
            // I'll assume I can use dynamic import or require if top-level import is hard, BUT I should add top level import.
            // Using require for minimal diff safety right now, ideally add "import Order" at top.
            const Order = require('../models/Order').default;
            const activationOrder = await Order.findOne({ userId: userToPlace._id, status: 'PAID' }).sort({ createdAt: 1 });
            if (activationOrder) {
                commissionBase = activationOrder.totalAmount;
                console.log(`[PlaceUser] Found Shop First Activation Order: $${commissionBase}`);
            }
        }

        // 2. Determine PV to Roll Up
        // If user was in Holding Tank, they likely already have Personal PV from the Order (via activateUser)
        // We must roll this UP the tree now that they are placed.
        // If Legacy (Package), PV is in pkg.pv
        let pvToRollUp = 0;

        // Check current personal PV first (most accurate for Shop First)
        if ((userToPlace as any).personalPV > 0) {
            pvToRollUp = (userToPlace as any).personalPV;
            console.log(`[PlaceUser] Rolling up existing Personal PV: ${pvToRollUp}`);
        } else if (pkg && pkg.pv) {
            pvToRollUp = pkg.pv;
            // Package Enrolled User: If coming from Holding Tank, they may not have Personal PV yet.
        }

        // Trigger Referral Bonus
        if (commissionBase > 0) {
            await CommissionEngine.distributeReferralBonus(sponsorId, userToPlace._id as any, commissionBase);
        }

        // Trigger PV Rollup
        if (pvToRollUp > 0) {
            await CommissionEngine.updateUplinePV(userToPlace._id as any, pvToRollUp);

            // Prevent double counting for users who already have Personal PV.
            // Only add Personal PV if the user currently has none (e.g., Package Enrollment via Holding Tank).
            const currentPersonalPV = (userToPlace as any).personalPV || 0;
            if (currentPersonalPV === 0 && pkg) {
                // Credit Personal PV for Package Enrollment
                await CommissionEngine.addPersonalPV(userToPlace._id as any, pvToRollUp);
            }
        }

        res.json({ message: 'User placed successfully' });

    } catch (error: any) {
        console.error('Placement Error:', error);
        res.status(500).json({ message: 'Placement failed: ' + (error.message || 'Unknown error') });
    }
};
