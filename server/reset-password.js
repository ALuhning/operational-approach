const { sequelize, User } = require('./models');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const email = 'aaronluhning@hotmail.com';
    const newPassword = 'password123'; // Change this to whatever you want

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    console.log('✅ Password reset successfully!');
    console.log('Email:', email);
    console.log('New Password:', newPassword);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
