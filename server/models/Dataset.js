const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Dataset = sequelize.define('Dataset', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    problemStatement: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    currentOE: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    desiredFutureState: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    objectiveDesiredConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    effects: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    coreCommunicationNarrative: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    objective: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'in_review', 'approved', 'archived'),
      defaultValue: 'draft'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'datasets',
    timestamps: true
  });

  return Dataset;
};
