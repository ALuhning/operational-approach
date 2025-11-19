const { sequelize, User, Dataset, OAI } = require('./models');

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Drop all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('✅ Database reset complete - all tables cleared');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();
