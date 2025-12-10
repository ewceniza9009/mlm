import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const checkPaths = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/mlm');
        console.log('Connected to DB');

        const users = await User.find({}, 'username email path parentId sponsorId');
        console.log(`Found ${users.length} users:`);

        users.forEach(u => {
            console.log(`User: ${u.username} | ID: ${u._id} | Path: "${u.path}" | Parent: ${u.parentId}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkPaths();
