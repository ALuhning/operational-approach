const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OAI = sequelize.define('OAI', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    datasetId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'datasets',
        key: 'id'
      }
    },
    objective: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    objectiveId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    loe: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Line of Effort'
    },
    loeId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imo: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Intermediate Military Objective'
    },
    imoId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parentOaiId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subOaiId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false
    },
    oaiDescription: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Domain-specific activities
    land: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sea: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    air: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cyber: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    space: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Decision points (legacy - kept for backward compatibility)
    decisivePoint: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisionPoint: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Multiple decision points
    decisionPoint1Label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisionPoint1Date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    decisionPoint2Label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisionPoint2Date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    decisivePoint1Label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisivePoint1Date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    decisivePoint2Label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisivePoint2Date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    decisionPoint3Label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisionPoint3Date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    decisivePoint3Label: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    decisivePoint3Date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    dependsOn: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Semicolon-separated list of OAI IDs this depends on'
    },
    branchNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Timeline information
    startPhase: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    endPhase: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    // New time dimensions
    durationMonths: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in months'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Start date (YYYY-MM-DD)'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'End date (YYYY-MM-DD)'
    },
    dpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Decisive Point date (YYYY-MM-DD)'
    },
    decisionDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Decision Point date (YYYY-MM-DD)'
    },
    // Branch and contingency
    isBranch: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isContingency: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    triggeredBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'OAI ID that triggers this branch/contingency'
    },
    // Metadata
    priority: {
      type: DataTypes.ENUM('critical', 'high', 'medium', 'low'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'planned'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'oais',
    timestamps: true,
    indexes: [
      {
        fields: ['datasetId']
      },
      {
        fields: ['subOaiId']
      },
      {
        fields: ['loe']
      },
      {
        fields: ['imo']
      }
    ]
  });

  return OAI;
};
