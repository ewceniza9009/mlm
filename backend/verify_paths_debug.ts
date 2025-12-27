
import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const verifyPaths = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'admin' }) || await User.findOne({ username: 'admin' }) || await User.findOne({ level: 0 });

        if (!admin) {
            console.log('Admin/Root user not found!');
            return;
        }

        console.log(`Target Root User: ${admin.username} (${admin._id})`);
        console.log(`Root Path: "${admin.path}"`);

        // Check exact match
        const directChildren = await User.find({ sponsorId: admin._id });
        console.log(`Direct Children (Sponsor): ${directChildren.length}`);

        // Check path regex
        const regex = new RegExp(`,${admin._id},`);
        const pathChildren = await User.find({ path: { $regex: `,${admin._id},` } });
        console.log(`Downline via Path Regex (,ID,): ${pathChildren.length}`);

        // Check loose regex
        const looseRegex = new RegExp(`${admin._id}`);
        const loosePathChildren = await User.find({ path: { $regex: `${admin._id}` } });
        console.log(`Downline via Loose Regex (ID): ${loosePathChildren.length}`);

        // Inspect sample users
        const sampleUsers = await User.find({}).limit(5);
        console.log('\n--- Sample Users Path Data ---');
        sampleUsers.forEach(u => {
            console.log(`User: ${u.username}, Path: "${u.path}", Sponsor: ${u.sponsorId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

verifyPaths();
