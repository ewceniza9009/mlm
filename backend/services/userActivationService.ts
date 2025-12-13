import User from '../models/User';
import Wallet from '../models/Wallet';
import Commission from '../models/Commission';
import Package from '../models/Package';
import SystemConfig from '../models/SystemConfig';
import spilloverService from './spilloverService';
import { createNotification } from '../controllers/notificationController';
import { CommissionEngine } from './CommissionEngine';

/**
 * Activates a user, finalized their enrollment, and places them in the network
 * (unless Holding Tank is enabled).
 */
export const activateUser = async (userId: string, activatorOrderAmount: number = 0): Promise<void> => {
    try {
        const user = await User.findById(userId);
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

        const sponsor = await User.findById(user.sponsorId);
        let savedUser: any = user;
        let isHoldingTank = false;

        // 2. Resolve Holding Tank Logic (Copied from AuthController)
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

        // 3. FORCE PLACEMENT (Bypass Holding Tank for Shop First Activation)
        // User Requirement: "REGARDLESS IF THE HOLDING TANK SETTINGS IS ENABLED OR DISABLED... IT WILL AUTOMATICALLY MOVE THE MEMBER... TO THE GENEALOGY TREE"

        if (sponsor) {
            // force auto place logic

            console.log('[ActivateUser] Auto-placing in Network...');
            user.isPlaced = true;
            savedUser = await spilloverService.placeUser(user as any, sponsor.id);

            // Trigger Bonuses
            let baseAmount = 0;
            let pvAmount = 0;

            if (activatorOrderAmount) {
                // SHOP FIRST ACTIVATION
                // Triggered by Order Payment.
                // We use the Order Amount for the Referral Bonus.
                // We set PV to 0 here because the Order Controller handles the Product PV separately.
                console.log(`[ActivateUser] Shop First: Using Order Amount $${activatorOrderAmount} as base. Ignoring Package PV to prevent double-counting.`);
                baseAmount = activatorOrderAmount;
                pvAmount = 0;
            } else if (user.enrollmentPackage) {
                // PACKAGE INCLUDED ACTIVATION
                // Triggered by legacy registration with package
                const pkg = await Package.findById(user.enrollmentPackage);
                if (pkg) {
                    baseAmount = pkg.price;
                    pvAmount = pkg.pv;
                }
            } else {
                console.warn('[ActivateUser] No Package and No Order Amount. Activation might be incomplete.');
            }

            // Distribute Direct Referral Bonus
            if (baseAmount > 0) {
                await CommissionEngine.distributeReferralBonus(sponsor.id, savedUser._id.toString(), baseAmount);
            }

            // Distribute PV (Only if from Package - Product PV is handled by Order Controller)
            if (pvAmount > 0) {
                await CommissionEngine.updateUplinePV(savedUser._id.toString(), pvAmount);
            }
        } else {
            // No Sponsor (Root)
            user.isPlaced = true;
            savedUser = await user.save();
        }

        // 4. Ensure Wallet & Commission Records Exist (Idempotent)
        const walletExists = await Wallet.findOne({ userId: savedUser._id });
        if (!walletExists) {
            await new Wallet({ userId: savedUser._id }).save();
        }

        const commExists = await Commission.findOne({ userId: savedUser._id });
        if (!commExists) {
            await new Commission({ userId: savedUser._id }).save();
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
