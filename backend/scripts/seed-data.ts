import mongoose from 'mongoose';
import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import spilloverService from '../services/spilloverService';
import bcrypt from 'bcryptjs';
import Package from '../models/Package';
import SystemSetting from '../models/SystemSetting';
import Product from '../models/Product';
import SystemConfig from '../models/SystemConfig';
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
    await mongoose.connection.collection('systemsettings').deleteMany({}); // Clear settings
    await mongoose.connection.collection('products').deleteMany({}); // Clear products
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

    // 0.1 Seed System Settings (Shop First Config)
    await SystemSetting.create([
      { key: 'enableShop', value: true, description: 'Enable product shop' },
      { key: 'enablePublicShop', value: true, description: 'Enable public retail shop' },
      { key: 'shopFirstEnrollment', value: true, description: 'Enable Shop First flow' },
      { key: 'shopFirstHoldingTank', value: true, description: 'Enable Holding Tank for Shop First' }
    ]);
    console.log('Seeded System Settings (Shop First ENABLED)');

    // 0.2 Seed Legacy System Config (for Commission Engine)
    await SystemConfig.create({
      commissionType: 'FIXED_PAIR',
      pairRatio: '1:1',
      commissionValue: 10,
      pairUnit: 100,
      dailyCapAmount: 500,
      referralBonusPercentage: 10,
      matchingBonusGenerations: [10, 5, 2],
      flushCarryForward: false,
      holdingTankMode: true // Default enabled
    });
    console.log('Seeded System Config');

    // 0.3 Seed Products
    await Product.create([
      {
        name: "Starter Package",
        sku: "SKU1234567890",
        description: "Starter Package",
        price: 100,
        pv: 100,
        stock: 999,
        image: "https://www.wixysoap.com/cdn/shop/files/carrot-soap-making-class-cold-process-method-7829115.jpg",
        isActive: true,
        category: "Membership Package"
      },
      {
        name: "Makeup Kit",
        sku: "SKU1234509876",
        description: "For beautification",
        price: 50,
        pv: 50,
        stock: 999,
        image: "https://blog.nkgabc.com/wp-content/uploads/2023/06/Makeup-Kit-Registration-in-India-NKG-Step-by-Step-Guide-1.jpg",
        isActive: true,
        category: "Beauty Product"
      }
    ]);
    console.log('Seeded Products (Starter Package + Makeup Kit)');

    const password = await bcrypt.hash('password', 10);

    // 1. Create RootDistributor (TOP)
    const root = new User({
      username: 'root',
      email: 'root@demo.com',
      password,
      rank: 'Diamond',
      role: 'distributor',
      isActive: true, // Should be true
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
