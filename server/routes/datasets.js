const express = require('express');
const { body, validationResult } = require('express-validator');
const { Dataset, OAI } = require('../models');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const csvParser = require('../services/csvParser');
const fs = require('fs').promises;

const router = express.Router();

// Get all datasets for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const datasets = await Dataset.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{
        model: OAI,
        as: 'oais',
        attributes: ['id']
      }]
    });

    const datasetsWithCount = datasets.map(ds => ({
      ...ds.toJSON(),
      oaiCount: ds.oais.length,
      oais: undefined
    }));

    res.json({ datasets: datasetsWithCount });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: { message: 'Failed to fetch datasets' } });
  }
});

// Get single dataset with OAIs
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [{
        model: OAI,
        as: 'oais'
      }]
    });

    if (!dataset) {
      return res.status(404).json({ error: { message: 'Dataset not found' } });
    }

    res.json({ dataset });
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: { message: 'Failed to fetch dataset' } });
  }
});

// Upload and parse CSV
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { name, description, problemStatement, currentOE, desiredFutureState, objectiveDesiredConditions, effects, coreCommunicationNarrative } = req.body;

    // Parse CSV
    const oais = await csvParser.parseCSV(req.file.path);

    // Create dataset
    const dataset = await Dataset.create({
      userId: req.user.id,
      name: name || req.file.originalname,
      description: description || '',
      problemStatement: problemStatement || '',
      currentOE: currentOE || '',
      desiredFutureState: desiredFutureState || '',
      objectiveDesiredConditions: objectiveDesiredConditions || '',
      effects: effects || '',
      coreCommunicationNarrative: coreCommunicationNarrative || '',
      fileName: req.file.originalname,
      filePath: req.file.path,
      metadata: {
        uploadedAt: new Date(),
        originalSize: req.file.size,
        rowCount: oais.length
      }
    });

    // Create OAIs
    const oaiRecords = oais.map(oai => ({
      ...oai,
      datasetId: dataset.id
    }));

    await OAI.bulkCreate(oaiRecords);

    // Fetch complete dataset
    const completeDataset = await Dataset.findByPk(dataset.id, {
      include: [{ model: OAI, as: 'oais' }]
    });

    res.status(201).json({ 
      dataset: completeDataset,
      message: `Successfully imported ${oais.length} OAIs`
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ 
      error: { message: error.message || 'Failed to upload and parse file' } 
    });
  }
});

// Update dataset
router.put('/:id', authenticate,
  [
    body('name').optional().trim(),
    body('description').optional().trim(),
    body('problemStatement').optional().trim(),
    body('currentOE').optional().trim(),
    body('desiredFutureState').optional().trim(),
    body('objectiveDesiredConditions').optional().trim(),
    body('effects').optional().trim(),
    body('coreCommunicationNarrative').optional().trim(),
    body('status').optional().isIn(['draft', 'in_review', 'approved', 'archived'])
  ],
  async (req, res) => {
    try {
      const dataset = await Dataset.findOne({
        where: { 
          id: req.params.id,
          userId: req.user.id 
        }
      });

      if (!dataset) {
        return res.status(404).json({ error: { message: 'Dataset not found' } });
      }

      const { name, description, problemStatement, currentOE, desiredFutureState, objectiveDesiredConditions, effects, coreCommunicationNarrative, status } = req.body;
      await dataset.update({ name, description, problemStatement, currentOE, desiredFutureState, objectiveDesiredConditions, effects, coreCommunicationNarrative, status });

      res.json({ dataset });
    } catch (error) {
      console.error('Error updating dataset:', error);
      res.status(500).json({ error: { message: 'Failed to update dataset' } });
    }
  }
);

// Delete dataset
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!dataset) {
      return res.status(404).json({ error: { message: 'Dataset not found' } });
    }

    // Delete associated OAIs first
    await OAI.destroy({
      where: { datasetId: dataset.id }
    });

    // Delete associated file
    if (dataset.filePath) {
      try {
        await fs.unlink(dataset.filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
        // Continue even if file deletion fails
      }
    }

    await dataset.destroy();

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: { message: 'Failed to delete dataset' } });
  }
});

// Create new OAI in dataset
router.post('/:id/oais', authenticate, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!dataset) {
      return res.status(404).json({ error: { message: 'Dataset not found' } });
    }

    const oai = await OAI.create({
      ...req.body,
      datasetId: dataset.id
    });

    res.status(201).json({ oai });
  } catch (error) {
    console.error('Error creating OAI:', error);
    res.status(500).json({ error: { message: 'Failed to create OAI' } });
  }
});

// Export dataset to CSV
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [{
        model: OAI,
        as: 'oais'
      }]
    });

    if (!dataset) {
      return res.status(404).json({ error: { message: 'Dataset not found' } });
    }

    const csv = csvParser.exportToCSV(dataset.oais);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dataset.name}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting dataset:', error);
    res.status(500).json({ error: { message: 'Failed to export dataset' } });
  }
});

module.exports = router;
