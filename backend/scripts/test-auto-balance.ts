import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import spilloverService from '../services/spilloverService';

dotenv.config();

const runTest = async () => {
    console.log('🧪 Starting Auto-Balance Logic Test...');

    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mlm');
        console.log('✅ Connected to MongoDB');

        // 1. Create Sponsor
        const sponsor = await User.create({
            username: 'test_sponsor_' + Date.now(),
            email: 'sponsor_' + Date.now() + '@test.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'Sponsor',
            role: 'distributor',
            status: 'active',
            isActive: true,
            currentLeftPV: 100, // Make Left heavy by PV
            currentRightPV: 0,
            enrollmentDate: new Date(),
            path: ',',
            level: 0
        });
        console.log(`👤 Created Sponsor: ${sponsor.username} (${sponsor._id})`);

        // 2. Create Left Child (Occupying Left)
        const leftChild = await User.create({
            username: 'test_left_' + Date.now(),
            email: 'left_' + Date.now() + '@test.com',
            password: 'password123',
            firstName: 'Left',
            lastName: 'Child',
            role: 'distributor',
            status: 'active',
            isActive: true,
            currentLeftPV: 0,
            currentRightPV: 0,
            enrollmentDate: new Date(),
            sponsorId: sponsor._id,
            parentId: sponsor._id,
            position: 'left',
            path: `,${sponsor._id},`,
            level: 1
        });

        sponsor.leftChildId = leftChild._id as any;
        await sponsor.save();
        console.log(`◀️ Created Left Child: ${leftChild.username} (Occupying Left Spot)`);

        // 3. Create New Recruit (To be placed)
        const recruit = await User.create({
            username: 'test_recruit_' + Date.now(),
            email: 'recruit_' + Date.now() + '@test.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'Recruit',
            role: 'distributor',
            status: 'active',
            isActive: true, // "Shop First" active
            isPlaced: false,
            currentLeftPV: 0,
            currentRightPV: 0,
            enrollmentDate: new Date(),
            sponsorId: sponsor._id
        });
        console.log(`🆕 Created New Recruit: ${recruit.username} (Waiting in Holding Tank)`);

        console.log('---------------------------------------------------');
        console.log('⚡ ACTION: Placing Recruit with preference "weaker_leg" (Auto Balance)...');

        // --- THE TEST ---
        // We explicitly ask for 'weaker_leg' which is what 'auto' maps to.
        const placedRecruit = await spilloverService.placeUser(recruit as any, sponsor._id.toString(), 'weaker_leg');

        console.log('---------------------------------------------------');
        console.log(`📍 Result: Recruit placed under ${placedRecruit.parentId} at position: [ ${placedRecruit.position?.toUpperCase()} ]`);

        // ASSERTIONS
        let passed = true;
        if (placedRecruit.position !== 'right') {
            console.error('❌ FAIL: Expected position to be RIGHT, but got ' + placedRecruit.position);
            passed = false;
        } else {
            console.log('✅ PASS: Position is RIGHT (Balanced Tree)');
        }

        if (placedRecruit.parentId?.toString() !== sponsor._id.toString()) {
            console.error('❌ FAIL: Expected parent to be Sponsor, but got ' + placedRecruit.parentId);
            passed = false;
        } else {
            console.log('✅ PASS: Parent is correct');
        }

        // Cleanup
        await User.deleteMany({ _id: { $in: [sponsor._id, leftChild._id, recruit._id] } });
        console.log('🧹 Cleanup done');

        if (passed) {
            console.log('🎉 TEST PASSED SUCCESSFULLY');
        } else {
            console.log('💀 TEST FAILED');
            process.exit(1);
        }

    } catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
