const { sequelize, User, Dataset, OAI } = require('./models');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    // Load seed data
    const seedData = JSON.parse(fs.readFileSync(__dirname + '/seed-data.json', 'utf8'));
    console.log(`Loaded seed data: ${seedData.users.length} users, ${seedData.datasets.length} datasets, ${seedData.oais.length} OAIs`);

    // Seed Users (hash passwords)
    for (const userData of seedData.users) {
      // Add default password if missing (will be hashed by model hook)
      if (!userData.password) {
        userData.password = 'password123';
      }
      // Don't re-hash if already hashed
      else if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      await User.create(userData);
    }
    console.log('Users seeded');

    // Seed Datasets
    for (const datasetData of seedData.datasets) {
      await Dataset.create(datasetData);
    }
    console.log('Datasets seeded');

    // Seed OAIs
    for (const oaiData of seedData.oais) {
      await OAI.create(oaiData);
    }
    console.log('OAIs seeded');

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// If run directly, execute and exit
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Connected to database');
      await sequelize.sync({ force: false });
      console.log('Database synced');
      await seed();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = seed;
