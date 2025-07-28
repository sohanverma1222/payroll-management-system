const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('./models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find user with password
    const user = await User.findOne({ email: 'admin@company.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.email);
    console.log('Password exists:', !!user.password);
    console.log('Password length:', user.password?.length);
    
    if (user.password) {
      // Test password comparison
      const isValid = await user.comparePassword('admin123');
      console.log('✅ Password test result:', isValid);
    } else {
      console.log('❌ No password stored!');
      
      // Try to update the password
      user.password = 'admin123';
      await user.save();
      console.log('✅ Password updated');
      
      // Test again
      const updatedUser = await User.findOne({ email: 'admin@company.com' }).select('+password');
      const isValid = await updatedUser.comparePassword('admin123');
      console.log('✅ Password test after update:', isValid);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();