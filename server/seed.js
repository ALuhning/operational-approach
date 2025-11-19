const { sequelize, User, Dataset, OAI } = require('./models');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('Database synced');

    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      process.exit(0);
    }

    // Load seed data
    const seedData = JSON.parse(fs.readFileSync(__dirname + '/seed-data.json', 'utf8'));
    console.log(`Loaded seed data: ${seedData.users.length} users, ${seedData.datasets.length} datasets, ${seedData.oais.length} OAIs`);

    // Seed Users (hash passwords)
    for (const userData of seedData.users) {
      // Don't re-hash if already hashed
      if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
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
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
