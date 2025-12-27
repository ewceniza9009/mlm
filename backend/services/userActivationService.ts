import User from '../models/User';
import Wallet from '../models/Wallet';
import Commission from '../models/Commission';
import Package from '../models/Package';
import SystemConfig from '../models/SystemConfig';
import spilloverService from './spilloverService';
import { createNotification } from '../controllers/notificationController';
import { CommissionEngine } from './CommissionEngine';
import mongoose from 'mongoose';

/**
 * Activates a user, finalized their enrollment, and places them in the network
 * (unless Holding Tank is enabled).
 */
export const activateUser = async (userId: string, amountPaid: number, session: mongoose.ClientSession | undefined = undefined): Promise<void> => {
    try {
        const user = await User.findById(userId).session(session || null);
        if (!user) throw new Error('User not found');

        // Idempotency check
        if (user.status === 'active' && user.isPlaced) {
            console.log(`[ActivateUser] User ${user.username} is already active and placed.`);
            return; // Already processed
        }

        console.log(`[ActivateUser] Activating user: ${user.username} (${userId})`);

        // 1. Update Status
        user.status = 'active';
        user.isActive = true;

        const sponsor = await User.findById(user.sponsorId).session(session || null);
        let savedUser: any = user;
        let isHoldingTank = false;

        // 2. Resolve Holding Tank Logic
        if (sponsor) {
            // @ts-ignore
            const sponsorSetting = (sponsor as any).enableHoldingTank || 'system';
            console.log(`[ActivateUser] Sponsor: ${sponsor.username}, Preference: ${sponsorSetting}`);

            if (sponsorSetting === 'enabled') {
                isHoldingTank = true;
            } else if (sponsorSetting === 'disabled') {
                isHoldingTank = false;
            } else {
                // System Default
                const config = await (SystemConfig as any).getLatest();
                isHoldingTank = config.holdingTankMode;
            }
        }

        // 3. Resolve Placement Strategy
        // Check if Shop First Holding Tank is enabled. If so, place in Holding Tank.
        // Otherwise, move directly to Genealogy Tree (Auto-Place).
        const { getSettingValue } = require('../controllers/settingsController');
        const shopFirstHoldingTank = await getSettingValue('shopFirstHoldingTank', false);

        if (sponsor) {
            if (shopFirstHoldingTank) {
                console.log(`[ActivateUser] Shop First Holding Tank Enabled. Placing ${user.username} in Holding Tank.`);
                user.isPlaced = false;
                // user.status and sponsorId are already set
                savedUser = await user.save({ session });
                // Bonuses are deferred until manual placement (see placeUserManually).
            } else {
                // force auto place logic
                console.log('[ActivateUser] Auto-placing in Network...');
                user.isPlaced = true;
                savedUser = await spilloverService.placeUser(user as any, sponsor.id, undefined, session);

                // Trigger Bonuses
                let baseAmount = 0;
                let pvAmount = 0;

                if (amountPaid) {
                    // SHOP FIRST ACTIVATION
                    // Triggered by Order Payment.
                    // Uses Order Amount as base; PV set to 0 as it's handled by Order Controller.
                    console.log(`[ActivateUser] Shop First: Using Order Amount $${amountPaid} as base. Ignoring Package PV to prevent double-counting.`);
                    baseAmount = amountPaid;
                    pvAmount = 0;
                } else if (user.enrollmentPackage) {
                    // PACKAGE INCLUDED ACTIVATION
                    // Triggered by legacy registration with package
                    const pkg = await Package.findById(user.enrollmentPackage).session(session || null);
                    if (pkg) {
                        baseAmount = pkg.price;
                        pvAmount = pkg.pv;
                    }
                } else {
                    console.warn('[ActivateUser] No Package and No Order Amount. Activation might be incomplete.');
                }

                // Distribute Direct Referral Bonus
                if (baseAmount > 0) {
                    await CommissionEngine.distributeReferralBonus(sponsor.id, savedUser._id.toString(), baseAmount, session);
                }

                if (amountPaid > 0) {
                    // 4a. Distribute Commission (Referral Bonus)
                    if (user.sponsorId) {
                        // Treating full order amount as commissionable basis for Referral Bonus.
                        // Production systems may require separate BV/CV values.
                        console.log(`Distributing Referral Bonus on $${amountPaid}`);
                        await CommissionEngine.distributeReferralBonus(user.sponsorId.toString(), user._id.toString(), amountPaid, session);
                    }
                }

                // Distribute PV
                if (pvAmount > 0) {
                    await CommissionEngine.updateUplinePV(savedUser._id.toString(), pvAmount, session);
                    await CommissionEngine.addPersonalPV(savedUser._id.toString(), pvAmount, session);
                }
            }
        } else {
            // No Sponsor (Root)
            user.isPlaced = true;
            savedUser = await user.save({ session });
        }

        // 4. Ensure Wallet & Commission Records Exist (Idempotent)
        const walletExists = await Wallet.findOne({ userId: savedUser._id }).session(session || null);
        if (!walletExists) {
            await new Wallet({ userId: savedUser._id }).save({ session });
        }

        const commExists = await Commission.findOne({ userId: savedUser._id }).session(session || null);
        if (!commExists) {
            await new Commission({ userId: savedUser._id }).save({ session });
        }

        // 5. Notifications
        await createNotification(
            savedUser._id.toString(),
            'success',
            'Account Activated',
            'Your account is now active and ready for business!'
        );

        if (sponsor) {
            await createNotification(
                sponsor._id.toString(),
                'info',
                'Team Member Activated',
                `${savedUser.username} has completed their purchase and is now active.`
            );
        }

    } catch (error) {
        console.error('[ActivateUser] Error:', error);
        throw error;
    }
};
