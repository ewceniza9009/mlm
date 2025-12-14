import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting';
import { getShopProducts, getPublicProducts } from '../controllers/productController';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm';
console.log('Connecting to Mongo URI:', MONGO_URI);

// Mock Express Objects
const createMockReq = (user?: any) => ({
    user: user || undefined,
    body: {},
    params: {},
    query: {}
} as any);

const createMockRes = () => {
    const res: any = {};
    res.statusCode = 0;
    res.jsonData = null;
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.jsonData = data;
        return res;
    };
    return res;
};

const verifyToggles = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- TEST START: Commerce Settings Toggles ---');

        // Cleanup
        await SystemSetting.deleteMany({});

        // --- SCENARIO 1: ALL DISABLED ---
        console.log('\n[Scenario 1] ALL DISABLED (Default State)');
        // Ensure settings are false or missing
        await SystemSetting.create({ key: 'enableShop', value: false });
        await SystemSetting.create({ key: 'enablePublicShop', value: false });

        // Test Member Shop Access
        const resMem1 = createMockRes();
        await getShopProducts(createMockReq({ id: 'user1' }), resMem1);

        if (resMem1.statusCode === 403) {
            console.log('✅ PASS: Member Shop is CLOSED (403)');
        } else {
            console.error('❌ FAIL: Member Shop should be CLOSED but got:', resMem1.statusCode);
        }

        // Test Public Shop Access
        const resPub1 = createMockRes();
        await getPublicProducts(createMockReq(), resPub1);

        if (resPub1.statusCode === 403) {
            console.log('✅ PASS: Public Shop is CLOSED (403)');
        } else {
            console.error('❌ FAIL: Public Shop should be CLOSED but got:', resPub1.statusCode);
        }

        // --- SCENARIO 2: MEMBERS ONLY SHOP ---
        console.log('\n[Scenario 2] MEMBERS ONLY SHOP ENABLED');
        await SystemSetting.findOneAndUpdate({ key: 'enableShop' }, { value: true });
        // Public remains false

        // Test Member Shop Access
        const resMem2 = createMockRes();
        await getShopProducts(createMockReq({ id: 'user1' }), resMem2);

        if (resMem2.statusCode === 200 || Array.isArray(resMem2.jsonData)) {
            console.log('✅ PASS: Member Shop is OPEN (200)');
        } else {
            console.error('❌ FAIL: Member Shop should be OPEN but got:', resMem2.statusCode);
        }

        // Test Public Shop Access
        const resPub2 = createMockRes();
        await getPublicProducts(createMockReq(), resPub2);

        if (resPub2.statusCode === 403) {
            console.log('✅ PASS: Public Shop is CLOSED (403)');
        } else {
            console.error('❌ FAIL: Public Shop should be CLOSED but got:', resPub2.statusCode);
        }

        // --- SCENARIO 3: PUBLIC SHOP ENABLED ---
        console.log('\n[Scenario 3] PUBLIC SHOP ENABLED');
        await SystemSetting.findOneAndUpdate({ key: 'enablePublicShop' }, { value: true });

        // Test Public Shop Access
        const resPub3 = createMockRes();
        await getPublicProducts(createMockReq(), resPub3);

        if (resPub3.statusCode === 200 || Array.isArray(resPub3.jsonData)) {
            console.log('✅ PASS: Public Shop is OPEN (200)');
        } else {
            console.error('❌ FAIL: Public Shop should be OPEN but got:', resPub3.statusCode);
        }

        // --- SCENARIO 4: CONFLICT CHECK (Shop First ON, Shop OFF) ---
        console.log('\n[Scenario 4] CONFLICT: Shop First = ON, Enable Shop = OFF');
        await SystemSetting.findOneAndUpdate({ key: 'shopFirstEnrollment' }, { value: true });
        await SystemSetting.findOneAndUpdate({ key: 'enableShop' }, { value: false });
        // Note: Admin UI might link them, but we are testing backend resilience

        // A "pending_payment" user tries to view products to buy one
        const resConflict = createMockRes();
        // User logged in but pending
        await getShopProducts(createMockReq({ id: 'pendingUser', status: 'pending_payment' }), resConflict);

        if (resConflict.statusCode === 403) {
            console.log('✅ PASS (Safe): Shop is correctly CLOSED (403).');
            console.log('   -> NOTE: This confirms that if an Admin disables the Shop while "Shop First" is on, users will be STUCK.');
            console.log('   -> RECOMMENDATION: Frontend Admin UI should prevent this combination.');
        } else {
            console.error('❌ FAIL: Logic leak! Shop opened despite being validly disabled?', resConflict.statusCode);
        }

        // --- SCENARIO 5: SAFEGUARD CHECK (Auto-Disable) ---
        console.log('\n[Scenario 5] SAFEGUARD: Disabling Shop should auto-disable Shop First');

        // Setup: Enable Both
        await SystemSetting.findOneAndUpdate({ key: 'shopFirstEnrollment' }, { value: true }, { upsert: true });
        await SystemSetting.findOneAndUpdate({ key: 'enableShop' }, { value: true }, { upsert: true });

        // Call Controller to Disable Shop
        const { updateSetting } = require('../controllers/settingsController');
        const reqSafeguard = createMockReq();
        reqSafeguard.body = { key: 'enableShop', value: false };
        const resSafeguard = createMockRes();

        await updateSetting(reqSafeguard, resSafeguard);

        // Verify DB State
        const shopFirst = await SystemSetting.findOne({ key: 'shopFirstEnrollment' });
        const shopEnabled = await SystemSetting.findOne({ key: 'enableShop' });

        if (shopFirst?.value === false && shopEnabled?.value === false) {
            console.log('✅ PASS: Safeguard worked! Shop First was auto-disabled.');
        } else {
            console.error('❌ FAIL: Safeguard failed.', {
                shopFirst: shopFirst?.value,
                shopEnabled: shopEnabled?.value
            });
        }

        console.log('\n--- TESTS COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verifyToggles();
