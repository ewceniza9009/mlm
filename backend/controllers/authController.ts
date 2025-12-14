import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import Package from '../models/Package';
import SystemConfig from '../models/SystemConfig';
import SystemSetting from '../models/SystemSetting';
import spilloverService from '../services/spilloverService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createNotification } from './notificationController';

// Helper to get setting
const getSetting = async (key: string): Promise<boolean> => {
  const setting = await SystemSetting.findOne({ key });
  return setting ? setting.value === true : false;
};

// Register Logic
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, sponsorUsername, packageName, firstName, middleName, lastName, occupation, phone, address } = req.body;

    // Check existing
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Resolve Sponsor
    let sponsor = null;
    if (sponsorUsername) {
      sponsor = await User.findOne({ username: { $regex: new RegExp(`^${sponsorUsername}$`, 'i') } });
      if (!sponsor && sponsorUsername.toLowerCase() !== 'root') {
        return res.status(404).json({ message: 'Sponsor not found' });
      }
    } else {
      // Allow first user without sponsor
      const count = await User.countDocuments();
      if (count > 0) return res.status(400).json({ message: 'Sponsor required' });
    }

    // Resolve Package
    const pkg = await Package.findOne({ name: packageName });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      enrollmentPackage: pkg ? pkg._id : null,
      firstName,
      middleName,
      lastName,
      occupation,
      phone,
      address
    });

    // Check Shop First Logic
    const shopFirstEnrollment = await getSetting('shopFirstEnrollment');
    let savedUser: any;

    if (shopFirstEnrollment) {
      // NEW FLOW: Shop First
      console.log('[Register] Shop First Enrollment: ENABLED');
      newUser.status = 'pending_payment';
      newUser.isActive = true; // Can login
      newUser.isPlaced = false;

      // Sponsor is attached but placement deferred
      if (sponsor) {
        newUser.sponsorId = sponsor._id as any;
      }

      savedUser = await newUser.save();
    } else {
      // LEGACY FLOW: Immediate Placement
      console.log('[Register] Shop First Enrollment: DISABLED (Using Legacy Flow)');

      // Check Hybrid Holding Tank Logic
      let isHoldingTank = false;

      if (sponsor) {
        // @ts-ignore
        const sponsorSetting = (sponsor as any).enableHoldingTank || 'system'; // Default to system if undefined
        console.log(`[Register] Sponsor: ${sponsor.username}, Preference: ${sponsorSetting}`);

        if (sponsorSetting === 'enabled') {
          isHoldingTank = true;
          console.log('[Register] Override: FORCE HOLDING TANK');
        } else if (sponsorSetting === 'disabled') {
          isHoldingTank = false;
          console.log('[Register] Override: FORCE DIRECT PLACEMENT');
        } else {
          // System Default
          const config = await (SystemConfig as any).getLatest();
          isHoldingTank = config.holdingTankMode;
          console.log(`[Register] Using System Default: ${isHoldingTank}`);
        }
      }

      if (isHoldingTank && sponsor) {
        // PARK USER
        newUser.isPlaced = false;
        newUser.sponsorId = sponsor._id as any;
        savedUser = await newUser.save();
        // Do NOT trigger PV or Commissions yet
      }
      else if (sponsor) {
        // AUTO PLACE
        newUser.isPlaced = true;
        savedUser = await spilloverService.placeUser(newUser, sponsor.id);

        // Trigger Bonuses (Lazy Load to avoid circular dependency issues)
        const { CommissionEngine } = require('../services/CommissionEngine');
        const pkgPrice = pkg ? pkg.price : 0;
        await CommissionEngine.distributeReferralBonus(sponsor.id, savedUser._id.toString(), pkgPrice);
        if (pkg && pkg.pv) {
          await CommissionEngine.updateUplinePV(savedUser._id.toString(), pkg.pv);
        }
      } else {
        newUser.isPlaced = true;
        savedUser = await newUser.save();
      }
    }

    // Init Wallet & Commission
    await new Wallet({ userId: savedUser._id }).save();
    await new Commission({ userId: savedUser._id }).save();

    // Trigger Notifications
    // 1. Notify New User
    await createNotification(
      savedUser._id.toString(),
      'success',
      'Welcome to GenMatrix!',
      `You have successfully enrolled with the ${packageName || 'Starter'} package.`
    );

    // 2. Notify Sponsor
    if (sponsor) {
      await createNotification(
        sponsor._id.toString(),
        'info',
        'New Team Member Enrolled',
        `${savedUser.username} has joined your downline.`
      );
    }

    res.status(201).json({ message: 'User registered', userId: savedUser._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// Login Logic
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        occupation: user.occupation,
        phone: user.phone,
        address: user.address,
        spilloverPreference: user.spilloverPreference,
        enableHoldingTank: user.enableHoldingTank,
        sponsorId: user.sponsorId,
        parentId: user.parentId,
        rank: user.rank,
        currentLeftPV: user.currentLeftPV,
        currentRightPV: user.currentRightPV,
        personalPV: user.personalPV
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Profile Logic
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    // @ts-ignore
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10);
      }

      // Profile updates
      if (req.body.firstName) user.firstName = req.body.firstName;
      if (req.body.middleName) user.middleName = req.body.middleName;
      if (req.body.lastName) user.lastName = req.body.lastName;
      if (req.body.occupation) user.occupation = req.body.occupation;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.address) {
        user.address = { ...user.address, ...req.body.address };
      }

      // Settings updates
      if (req.body.spilloverPreference) user.spilloverPreference = req.body.spilloverPreference;
      if (req.body.enableHoldingTank !== undefined) user.enableHoldingTank = req.body.enableHoldingTank;

      const updatedUser = await user.save();

      res.json({
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        status: updatedUser.status,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
        occupation: updatedUser.occupation,
        phone: updatedUser.phone,
        address: updatedUser.address,
        spilloverPreference: updatedUser.spilloverPreference,
        enableHoldingTank: updatedUser.enableHoldingTank,
        token: req.body.token // Optional: if we want to refresh token or just keep it
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};