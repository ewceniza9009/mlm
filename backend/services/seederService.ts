// ---- File: backend/services/seederService.ts ----

import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import Package from '../models/Package';
import SystemSetting from '../models/SystemSetting';
import Product from '../models/Product';
import SystemConfig from '../models/SystemConfig';
import spilloverService from './spilloverService';
import { CommissionEngine } from './CommissionEngine';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  try {
    // 1. SAFETY CHECK: Do not seed if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⚡ Database users exist. Checking other collections...');

      // Check & Seed Settings if missing
      const settingsCount = await SystemSetting.countDocuments();
      if (settingsCount === 0) {
        console.log('⚙️ Settings missing. Seeding defaulted Shop First settings...');
        await seedSettings();
      }

      // Check & Seed Products if missing
      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log('🛍️ Products missing. Seeding default products...');
        await seedProducts();
      }

      // Check & Seed Legacy Config if missing
      const configCount = await SystemConfig.countDocuments();
      if (configCount === 0) {
        console.log('🔧 Config missing. Seeding default config...');
        await seedConfig();
      }

      return;
    }

    console.log('🌱 Database empty. Starting automated seed...');

    // 2. Clear related collections (just in case partial data exists)
    await Commission.deleteMany({});
    await Wallet.deleteMany({});
    await Package.deleteMany({});
    await SystemSetting.deleteMany({});
    await Product.deleteMany({});
    await SystemConfig.deleteMany({});

    // 3. Seed Packages
    const starterPkg = await new Package({
      name: 'Starter',
      price: 100,
      pv: 100,
      description: 'Basic entry package',
      bonuses: [
        { type: 'Direct', value: 10 }
      ]
    }).save();
    console.log('   - Created Starter Package');

    // Seed Settings, Products, Config
    await seedSettings();
    await seedProducts();
    await seedConfig();

    const password = await bcrypt.hash('password', 10);

    // 4. Create Root Distributor (TOP OF TREE)
    const root = new User({
      username: 'root',
      email: 'root@demo.com',
      password,
      rank: 'Diamond',
      role: 'distributor',
      isActive: true,
      spilloverPreference: 'weaker_leg',
      enrollmentPackage: starterPkg._id
    });
    await root.save();

    // Init Financials for Root
    await new Wallet({ userId: root._id, balance: 5000 }).save();
    await new Commission({ userId: root._id, totalEarned: 12000 }).save();
    console.log('   - Created Root Distributor');

    // 5. Create System Admin (Under Root)
    const admin = new User({
      username: 'admin',
      email: 'admin@demo.com',
      password,
      rank: 'Diamond',
      role: 'admin',
      isActive: true,
      sponsorId: root._id,
      enrollmentPackage: starterPkg._id
    });

    // Place Admin under Root
    await spilloverService.placeUser(admin, root.id);
    await new Wallet({ userId: admin._id }).save();
    await new Commission({ userId: admin._id }).save();
    console.log('   - Created Admin (Under Root)');

    console.log('✅ Automated Seeding Complete');

  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    // Don't exit process here, just log error so server keeps running
  }
};

const seedSettings = async () => {
  await SystemSetting.create([
    { key: 'enableShop', value: true, description: 'Enable product shop' },
    { key: 'enablePublicShop', value: true, description: 'Enable public retail shop' },
    { key: 'shopFirstEnrollment', value: true, description: 'Enable Shop First flow' },
    { key: 'shopFirstHoldingTank', value: true, description: 'Enable Holding Tank for Shop First' },
    {
      key: 'rankRequirements',
      value: {
        "Bronze": { "earnings": 0, "recruits": 0 },
        "Silver": { "earnings": 1000, "recruits": 2 },
        "Gold": { "earnings": 5000, "recruits": 5 },
        "Diamond": { "earnings": 20000, "recruits": 10 }
      },
      description: 'Requirements for each rank'
    }
  ]);
  console.log('   - Created System Settings');
};

const seedProducts = async () => {
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
  console.log('   - Created Products');
};

const seedConfig = async () => {
  await SystemConfig.create({
    commissionType: 'FIXED_PAIR',
    pairRatio: '1:1',
    commissionValue: 10,
    pairUnit: 100,
    dailyCapAmount: 500,
    referralBonusPercentage: 10,
    matchingBonusGenerations: [10, 5, 2],
    holdingTankMode: true // Default enabled
  });
  console.log('   - Created System Config');
};