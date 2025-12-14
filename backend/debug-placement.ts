
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Commission from './models/Commission';
import spilloverService from './services/spilloverService';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlm';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');
        await User.deleteMany({ email: { $regex: '@testdebug.com' } });
        await Commission.deleteMany({ userId: { $exists: true } });

        // Test Weaker Leg Chaining
        console.log('\n--- Test: Weaker Leg Chaining (Zero PV) ---');
        const s = await createUser('s_chain', 'weaker_leg');
        await new Commission({ userId: s._id, leftLegPV: 0, rightLegPV: 0 }).save();

        const u1 = await createUser('u1', 'weaker_leg', s._id);
        const p1 = await spilloverService.placeUser(u1, s._id.toString());
        console.log(`1. Placed u1: ${p1.position} under ${await getUsername(p1.parentId)}`);

        const u2 = await createUser('u2', 'weaker_leg', s._id);
        const p2 = await spilloverService.placeUser(u2, s._id.toString());
        console.log(`2. Placed u2: ${p2.position} under ${await getUsername(p2.parentId)}`);

        const u3 = await createUser('u3', 'weaker_leg', s._id);
        const p3 = await spilloverService.placeUser(u3, s._id.toString());
        console.log(`3. Placed u3: ${p3.position} under ${await getUsername(p3.parentId)} (Start logic: Left <= Right -> Left Tree)`);

        const u4 = await createUser('u4', 'weaker_leg', s._id);
        const p4 = await spilloverService.placeUser(u4, s._id.toString());
        console.log(`4. Placed u4: ${p4.position} under ${await getUsername(p4.parentId)}`);

        // Check if u4 went to Right Leg (Balanced?) or Left Leg (Chained?)
        // If Chained: u3 is u1.Left. u4 is u3.Left. 
        // If Balanced: u3 is u1.Left. u4 is u2.Left (or u1.Right).

        const s_fresh = await User.findById(s._id);
        console.log(`\nSponsor LeftChild: ${await getUsername(s_fresh?.leftChildId)}`);
        console.log(`Sponsor RightChild: ${await getUsername(s_fresh?.rightChildId)}`);

        // Count descendants
        const leftCount = await User.countDocuments({ path: { $regex: `,${s_fresh?.leftChildId},` } });
        const rightCount = await User.countDocuments({ path: { $regex: `,${s_fresh?.rightChildId},` } });
        console.log(`Left Tree Count: ${leftCount + 1}`); // +1 for root of subtree
        console.log(`Right Tree Count: ${rightCount + 1}`);
        console.log(`Balance: ${leftCount + 1} vs ${rightCount + 1}`);

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

async function createUser(username: string, pref: string, sponsorId?: any) {
    const u = new User({
        username: username,
        email: `${username}@testdebug.com`,
        password: 'password',
        spilloverPreference: pref,
        sponsorId: sponsorId,
        isPlaced: !sponsorId,
        path: sponsorId ? '' : ',root,',
        level: sponsorId ? 0 : 1
    });
    return await u.save();
}

async function getUsername(id: any) {
    if (!id) return 'null';
    const u = await User.findById(id);
    return u ? u.username : id;
}

run();
