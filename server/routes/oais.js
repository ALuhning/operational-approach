const express = require('express');
const { body, validationResult } = require('express-validator');
const { OAI, Dataset } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get OAI by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const oai = await OAI.findByPk(req.params.id, {
      include: [{
        model: Dataset,
        as: 'dataset',
        where: { userId: req.user.id }
      }]
    });

    if (!oai) {
      return res.status(404).json({ error: { message: 'OAI not found' } });
    }

    res.json({ oai });
  } catch (error) {
    console.error('Error fetching OAI:', error);
    res.status(500).json({ error: { message: 'Failed to fetch OAI' } });
  }
});

// Update OAI
router.put('/:id', authenticate, async (req, res) => {
  try {
    const oai = await OAI.findByPk(req.params.id, {
      include: [{
        model: Dataset,
        as: 'dataset',
        where: { userId: req.user.id }
      }]
    });

    if (!oai) {
      return res.status(404).json({ error: { message: 'OAI not found' } });
    }

    const allowedFields = [
      'oaiDescription', 'land', 'sea', 'air', 'cyber', 'space',
      'decisivePoint', 'decisionPoint', 'startPhase', 'endPhase',
      'duration', 'isBranch', 'isContingency', 'triggeredBy',
      'priority', 'status', 'notes', 'metadata',
      'startDate', 'endDate', 'dpDate', 'decisionDate',
      'decisionPoint1Date', 'decisionPoint2Date', 'decisionPoint3Date',
      'decisivePoint1Date', 'decisivePoint2Date', 'decisivePoint3Date'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await oai.update(updates);

    res.json({ oai });
  } catch (error) {
    console.error('Error updating OAI:', error);
    res.status(500).json({ error: { message: 'Failed to update OAI' } });
  }
});

// Delete OAI
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const oai = await OAI.findByPk(req.params.id, {
      include: [{
        model: Dataset,
        as: 'dataset',
        where: { userId: req.user.id }
      }]
    });

    if (!oai) {
      return res.status(404).json({ error: { message: 'OAI not found' } });
    }

    await oai.destroy();

    res.json({ message: 'OAI deleted successfully' });
  } catch (error) {
    console.error('Error deleting OAI:', error);
    res.status(500).json({ error: { message: 'Failed to delete OAI' } });
  }
});

// Bulk update OAIs (for drag-and-drop timeline adjustments)
router.put('/bulk/update', authenticate, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, startPhase, endPhase, duration, subOaiId, etc. }

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: { message: 'Updates must be an array' } });
    }

    const results = [];

    for (const update of updates) {
      const oai = await OAI.findByPk(update.id, {
        include: [{
          model: Dataset,
          as: 'dataset',
          where: { userId: req.user.id }
        }]
      });

      if (oai) {
        // Build update object with only provided fields
        const updateData = {};
        if (update.startPhase !== undefined) updateData.startPhase = update.startPhase;
        if (update.endPhase !== undefined) updateData.endPhase = update.endPhase;
        if (update.duration !== undefined) updateData.duration = update.duration;
        if (update.subOaiId !== undefined) updateData.subOaiId = update.subOaiId;
        if (update.startDate !== undefined) updateData.startDate = update.startDate;
        if (update.endDate !== undefined) updateData.endDate = update.endDate;
        
        await oai.update(updateData);
        results.push(oai);
      }
    }

    res.json({ 
      oais: results,
      message: `Updated ${results.length} OAIs`
    });
  } catch (error) {
    console.error('Error bulk updating OAIs:', error);
    res.status(500).json({ error: { message: 'Failed to bulk update OAIs' } });
  }
});

module.exports = router;
