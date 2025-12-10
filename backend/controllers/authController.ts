import { Request, Response } from 'express';
import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import Package from '../models/Package';
import SystemConfig from '../models/SystemConfig';
import spilloverService from '../services/spilloverService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register Logic
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, sponsorUsername, packageName } = req.body;

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
      enrollmentPackage: pkg ? pkg._id : null
    });

    // Check Holding Tank Mode
    const config = await (SystemConfig as any).getLatest();
    const isHoldingTank = config.holdingTankMode;

    let savedUser;

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
      await CommissionEngine.distributeReferralBonus(sponsor.id, savedUser._id.toString());
      if (pkg && pkg.pv) {
        await CommissionEngine.updateUplinePV(savedUser._id.toString(), pkg.pv);
      }
    } else {
      newUser.isPlaced = true;
      savedUser = await newUser.save();
    }

    // Init Wallet & Commission
    await new Wallet({ userId: savedUser._id }).save();
    await new Commission({ userId: savedUser._id }).save();

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
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};