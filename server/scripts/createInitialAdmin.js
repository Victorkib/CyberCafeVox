import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { sendVerificationEmail } from '../utils/email.js';
import crypto from 'crypto';

dotenv.config();

const createInitialAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any super admin exists
    const superAdminExists = await User.findOne({ role: 'super_admin' });
    if (superAdminExists) {
      console.log('A super admin user already exists. This script can only be run once.');
      process.exit(1);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create super admin user
    const admin = await User.create({
      name: process.env.INITIAL_ADMIN_NAME,
      email: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD,
      role: 'super_admin',
      emailVerificationToken: verificationToken,
      emailVerificationExpire: verificationExpire,
      isEmailVerified: false
    });

    if (admin) {
      // Send verification email
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      await sendVerificationEmail(admin.email, admin.name, verificationUrl);

      console.log('Initial super admin user created successfully');
      console.log('Verification email sent to:', admin.email);
      console.log('Please verify the email address to activate the admin account');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating initial admin:', error);
    process.exit(1);
  }
};

createInitialAdmin(); 