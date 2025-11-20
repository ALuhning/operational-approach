const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || 'sqlite::memory:';

const sequelize = new Sequelize(databaseUrl, {
  dialect: databaseUrl.startsWith('postgres') ? 'postgres' : 'sqlite',
  logging: console.log,
  dialectOptions: databaseUrl.startsWith('postgres') ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

async function convertLettersToNumbers() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Convert letter suffixes to numbers: .a -> .1, .b -> .2, .c -> .3
    const conversions = [
      { from: '.a', to: '.1' },
      { from: '.b', to: '.2' },
      { from: '.c', to: '.3' }
    ];

    for (const { from, to } of conversions) {
      const [results] = await sequelize.query(`
        UPDATE "OAIs" 
        SET "subOaiId" = REPLACE("subOaiId", '${from}', '${to}')
        WHERE "subOaiId" LIKE '%${from}'
      `);
      console.log(`Converted ${from} to ${to}:`, results);
    }

    console.log('Conversion complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

convertLettersToNumbers();
