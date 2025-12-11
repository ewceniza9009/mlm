import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createNotification } from './notificationController';

// --- KYC ---

// Upload KYC Document
export const uploadKYC = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Multer stores file in req.file. 
        // We assume storage engine saves it to 'uploads/' and we store the path.
        // In a real app, use S3/Cloudinary. Here local.
        const filePath = req.file.path.replace(/\\/g, '/'); // Cross-platform path

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.kycDocs) user.kycDocs = [];
        user.kycDocs.push(filePath);
        user.kycStatus = 'pending'; // Reset to pending on new upload

        await user.save();

        res.json({ message: 'Document uploaded successfully', kycStatus: user.kycStatus, docs: user.kycDocs });
    } catch (error) {
        console.error('KYC Upload Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: Get Pending KYC
export const getPendingKYC = async (req: Request, res: Response) => {
    try {
        const users = await User.find({ kycStatus: 'pending', kycDocs: { $exists: true, $not: { $size: 0 } } })
            .select('username email kycStatus kycDocs enrollmentDate');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin: Approve/Reject KYC
export const updateKYCStatus = async (req: Request, res: Response) => {
    try {
        const { userId, status, comment } = req.body; // status: 'approved' | 'rejected'

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.kycStatus = status;
        if (comment) user.kycComment = comment;



        await user.save();

        // NOTIFY
        if (status === 'approved') {
            await createNotification(
                userId,
                'success',
                'KYC Verified',
                'Your identity verification documents have been approved.'
            );
        } else {
            await createNotification(
                userId,
                'error',
                'KYC Rejected',
                `Your identity verification was rejected. Reason: ${comment || 'Documents invalid'}`
            );
        }

        res.json({ message: `KYC ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- 2FA ---

// Generate 2FA Secret
export const generate2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const secret = speakeasy.generateSecret({ length: 20, name: `GenMatrix (${user.username})` });

        // Save temp secret (not enabled yet)
        user.twoFactorSecret = {
            temp: secret.base32,
            secret: user.twoFactorSecret?.secret, // Keep old if exists
            enabled: user.twoFactorSecret?.enabled || false
        };
        await user.save();

        // Generate QR Code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl
        });
    } catch (error) {
        console.error('2FA Generate Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Verify and Enable 2FA
export const verify2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { token } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user || !user.twoFactorSecret || !user.twoFactorSecret.temp) {
            return res.status(400).json({ message: '2FA setup not initiated' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret.temp,
            encoding: 'base32',
            token
        });

        if (verified) {
            user.twoFactorSecret.secret = user.twoFactorSecret.temp;
            user.twoFactorSecret.enabled = true;
            user.twoFactorSecret.temp = undefined; // Clear temp
            await user.save();
            res.json({ message: '2FA Enabled Successfully' });
        } else {
            res.status(400).json({ message: 'Invalid Token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Disable 2FA
export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { password, token } = req.body; // Require password + token to disable for security
        // For simplicity, just token or password. Let's use just token if they are logged in.

        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.twoFactorSecret?.enabled) return res.status(400).json({ message: '2FA not enabled' });

        // Verify token against ACTIVE secret
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret.secret!,
            encoding: 'base32',
            token
        });

        if (verified) {
            user.twoFactorSecret.enabled = false;
            user.twoFactorSecret.secret = undefined;
            await user.save();
            res.json({ message: '2FA Disabled' });
        } else {
            res.status(400).json({ message: 'Invalid Token' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Validate 2FA (for login/actions)
export const validate2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { token, userId } = req.body; // If passing userId explicitly (admin?) or req.user

        // If used during login, req.user might not be set yet if strictly following JWT flow.
        // Usually login happens in 2 steps: 1. User/Pass -> Returns "2FA Required" + Temp Token. 2. Send Temp Token + 2FA Code -> Real JWT.
        // For now, let's assume this is for POST-LOGIN actions (like Withdrawals).

        const currentUserId = (req as any).user._id;
        const user = await User.findById(currentUserId);

        if (!user || !user.twoFactorSecret?.enabled) {
            return res.json({ valid: true }); // If 2FA not enabled, it's valid? Or denial? Policy dependent. 
            // For withdrawals, maybe we ENFORCE 2FA. 
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret.secret!,
            encoding: 'base32',
            token
        });

        if (verified) {
            res.json({ valid: true });
        } else {
            res.status(400).json({ valid: false, message: 'Invalid 2FA Code' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
