import mongoose from 'mongoose';
import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import spilloverService from '../services/spilloverService';
import bcrypt from 'bcryptjs';
import Package from '../models/Package';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    // Clear existing
    await User.deleteMany({});
    await Commission.deleteMany({});
    await Wallet.deleteMany({});
    await mongoose.connection.collection('packages').deleteMany({}); // Clear packages
    await mongoose.connection.collection('systemconfigs').deleteMany({}); // Clear config to reset defaults
    console.log('Cleared DB');

    // 0. Seed Packages
    const starterPkg = await new Package({
      name: 'Starter',
      price: 100,
      pv: 100,
      description: 'Basic entry package',
      bonuses: [
        { type: 'Direct', value: 10 }
      ]
    }).save();
    console.log('Created Starter Package (100 PV)');

    const password = await bcrypt.hash('password', 10);

    // 1. Create RootDistributor (TOP)
    const root = new User({
      username: 'root',
      email: 'root@demo.com',
      password,
      rank: 'Diamond',
      role: 'distributor',
      isActive: true,
      spilloverPreference: 'weaker_leg'
    });
    await root.save();
    console.log('Created Root Distributor');

    // Seed wallet for visual
    await new Wallet({ userId: root._id, balance: 5000 }).save();
    await new Commission({ userId: root._id, totalEarned: 12000 }).save();

    // 2. Create System Admin (Under Root)
    const admin = new User({
      username: 'admin',
      email: 'admin@demo.com',
      password,
      rank: 'Diamond',
      role: 'admin', // Explicit Admin Role
      isActive: true,
      sponsorId: root._id // <--- Linked to Root
    });
    // Place admin in the tree structure
    await spilloverService.placeUser(admin, root.id);
    console.log('Created Admin (admin@demo.com / password) under Root');

    console.log('Seeding Complete');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
