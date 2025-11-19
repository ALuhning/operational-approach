const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'sqlite:./database.sqlite',
  {
    dialect: process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    storage: './database.sqlite', // Only used for SQLite
  }
);

const User = require('./User')(sequelize);
const Dataset = require('./Dataset')(sequelize);
const OAI = require('./OAI')(sequelize);

// Define associations
User.hasMany(Dataset, { foreignKey: 'userId', as: 'datasets' });
Dataset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Dataset.hasMany(OAI, { foreignKey: 'datasetId', as: 'oais', onDelete: 'CASCADE' });
OAI.belongsTo(Dataset, { foreignKey: 'datasetId', as: 'dataset' });

module.exports = {
  sequelize,
  User,
  Dataset,
  OAI
};
