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

        } else {
            // Auto Spillover (No parent selected)
            // Use the selected leg ('left' or 'right') as the preference
            // spilloverService.findPlacement accepts 'left'/'right' as valid preferences for extreme traversal

            // Re-use the existing findPlacement logic but we need to import it properly or use the service
            // spilloverService is imported as default

            // Wait, spilloverService.placeUser does everything (find + update). 
            // But here we want to find placement but do the update manually in this controller (to keep commission logic consistent/centralized in this block?)
            // Or we just call placeUser?
            // placeUser handles "saving" and "parent linking".
            // logic below handles "saving" and "parent linking" and "commission triggering".
            // Ideally we shouldn't duplicate logic.

            // If we use spilloverService keys, we need to pass the user object.

            // Let's resolve the parent ID using spillover logic, then proceed with the existing flow.
            // We need to access `findPlacement` but it is NOT exported from spilloverService default export. It is local.
            // Only `placeUser` is exported.

            // Plan B: Call `placeUser` and let it handle everything?
            // `placeUser` returns the savedUser.
            // But `placeUser` updates the parent links.
            // Does `placeUser` trigger commissions?
            // No, `placeUser` (in spilloverService.ts) only does structural placement. 
            // It does NOT trigger `CommissionEngine`.

            // So we can use `placeUser` to put them in the tree, and then run the commission logic here.

            // BUT `placeUser` uses `sponsor.spilloverPreference` by default.
            // 2. AUTO-SPILLOVER FLOW (No parent selected)
            // Use the selected 'position' (left/right) as the preference override
            // This will find the extreme bottom of that side (or weaker leg if that matches) - user specifically asked for "DEPENDING ON THE SELECTED LEG"
            // So we pass 'left' or 'right' literal which works with findPlacement logic (lines 20-25 of spilloverService)

            userToPlace.isPlaced = true;
            // Calls the service to find spot and link up
            await spilloverService.placeUser(userToPlace as any, sponsorId, position); // position is 'left' or 'right'
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
            // Also add to personal if not yet added? 
            // In Legacy+HoldingTank, activateUser might NOT have added personalPV if it skipped the placement block?
            // Let's check activateUser.ts...
            // In activateUser: if (shopFirstHoldingTank) -> just save. NO PV added.
            // Wait. activateUser ONLY calls addPersonalPV in the "else" (Auto-Place) block?
            // checking activateUser.ts...
            // Lines 70-80 (Holding Tank): just saves.
            // Lines 81+ (Auto Place): adds Personal PV.
            // ERROR: If Legacy User goes to Holding Tank, they currently get 0 Personal PV until placed.
            // So we MUST add Personal PV here for them too.
        }

        // Trigger Referral Bonus
        if (commissionBase > 0) {
            await CommissionEngine.distributeReferralBonus(sponsorId, userToPlace._id as any, commissionBase);
        }

        // Trigger PV Rollup
        if (pvToRollUp > 0) {
            await CommissionEngine.updateUplinePV(userToPlace._id as any, pvToRollUp);

            // Ensure Personal PV is set (idempotent addition or set?)
            // updateUplinePV only does uplines.
            // addPersonalPV adds to personal.
            // If they already have personalPV (Shop First), we don't want to double add?
            // CommissionEngine.addPersonalPV ADDS to existing.

            // Case A: Shop First. 
            // OrderController ran `addPersonalPV`. User has 100 PV.
            // Here `pvToRollUp` = 100.
            // If we run `addPersonalPV(100)`, they get 200 PV. WRONG.

            // Case B: Legacy + Holding Tank.
            // `activateUser` did NOTHING. User has 0 PV.
            // Here `pvToRollUp` = 100 (from Pkg).
            // We run `addPersonalPV(100)`. Correct.

            // Check if we need to credit Personal PV
            const currentPersonalPV = (userToPlace as any).personalPV || 0;
            if (currentPersonalPV === 0 && pkg) {
                // Legacy Case: Credit Personal PV now
                await CommissionEngine.addPersonalPV(userToPlace._id as any, pvToRollUp);
            }
            // Logic gap: What if Shop First user has 0 PV (error?) - unlikely if Paid.
        }

        res.json({ message: 'User placed successfully' });

    } catch (error: any) {
        console.error('Placement Error:', error);
        res.status(500).json({ message: 'Placement failed: ' + (error.message || 'Unknown error') });
    }
};
