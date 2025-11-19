const { sequelize, User, Dataset, OAI } = require('./models');
const fs = require('fs');

async function exportData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Export Users - use raw: true to get all fields including password
    const users = await User.findAll({ raw: true });
    console.log(`Found ${users.length} users`);

    // Export Datasets
    const datasets = await Dataset.findAll({ raw: true });
    console.log(`Found ${datasets.length} datasets`);

    // Export OAIs
    const oais = await OAI.findAll({ 
      raw: true,
      order: [['datasetId', 'ASC'], ['id', 'ASC']]
    });
    console.log(`Found ${oais.length} OAIs`);

    const exportData = {
      users,
      datasets,
      oais
    };

    fs.writeFileSync('seed-data.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Data exported to seed-data.json');
    console.log(`   Users: ${users.length}`);
    console.log(`   Datasets: ${datasets.length}`);
    console.log(`   OAIs: ${oais.length}`);

    await sequelize.close();
  } catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  }
}

exportData();
