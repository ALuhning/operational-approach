const { sequelize, User, Dataset, OAI } = require('./models');
const fs = require('fs');

async function exportData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Export Users
    const users = await User.findAll();
    console.log(`Found ${users.length} users`);

    // Export Datasets
    const datasets = await Dataset.findAll();
    console.log(`Found ${datasets.length} datasets`);

    // Export OAIs
    const oais = await OAI.findAll();
    console.log(`Found ${oais.length} OAIs`);

    const exportData = {
      users: users.map(u => u.toJSON()),
      datasets: datasets.map(d => d.toJSON()),
      oais: oais.map(o => o.toJSON())
    };

    fs.writeFileSync('seed-data.json', JSON.stringify(exportData, null, 2));
    console.log('Data exported to seed-data.json');

    await sequelize.close();
  } catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  }
}

exportData();
