// ---- File: backend/services/seederService.ts ----

import User from '../models/User';
import Commission from '../models/Commission';
import Wallet from '../models/Wallet';
import Package from '../models/Package';
import spilloverService from './spilloverService';
import { CommissionEngine } from './CommissionEngine';
import bcrypt from 'bcryptjs';

export const seedDatabase = async () => {
  try {
    // 1. SAFETY CHECK: Do not seed if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('⚡ Database already populated. Skipping seed.');
      return;
    }

    console.log('🌱 Database empty. Starting automated seed...');

    // 2. Clear related collections (just in case partial data exists)
    await Commission.deleteMany({});
    await Wallet.deleteMany({});
    await Package.deleteMany({});

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