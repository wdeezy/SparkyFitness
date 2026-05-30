import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import peptideService from '../services/peptideService.js';

const router = express.Router();

// ---- Levels (declared before /:id routes so they aren't shadowed) ----

// GET /api/peptides/levels  -> current estimated level for all peptides
router.get('/levels', authenticate, async (req, res, next) => {
  try {
    const levels = await peptideService.getCurrentLevels(req.userId);
    res.status(200).json(levels);
  } catch (error) {
    next(error);
  }
});

// GET /api/peptides/:id/series  -> decay time-series for charting
router.get('/:id/series', authenticate, async (req, res, next) => {
  try {
    const data = await peptideService.getLevelSeries(
      req.userId,
      req.params.id,
      req.query
    );
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});

// ---- Injections ----

// GET /api/peptides/:id/injections
router.get('/:id/injections', authenticate, async (req, res, next) => {
  try {
    const rows = await peptideService.getInjections(req.userId, req.params.id);
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/peptides/:id/injections
router.post('/:id/injections', authenticate, async (req, res, next) => {
  try {
    const injection = await peptideService.logInjection(req.userId, {
      ...req.body,
      peptide_id: req.params.id,
    });
    res.status(201).json(injection);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/peptides/injections/:injectionId
router.delete(
  '/injections/:injectionId',
  authenticate,
  async (req, res, next) => {
    try {
      const result = await peptideService.deleteInjection(
        req.params.injectionId,
        req.userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ---- Peptides CRUD ----

// GET /api/peptides
router.get('/', authenticate, async (req, res, next) => {
  try {
    const peptides = await peptideService.getPeptides(req.userId);
    res.status(200).json(peptides);
  } catch (error) {
    next(error);
  }
});

// POST /api/peptides
router.post('/', authenticate, async (req, res, next) => {
  try {
    const peptide = await peptideService.createPeptide(req.userId, req.body);
    res.status(201).json(peptide);
  } catch (error) {
    next(error);
  }
});

// PUT /api/peptides/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const peptide = await peptideService.updatePeptide(
      req.params.id,
      req.userId,
      req.body
    );
    if (!peptide) {
      return res.status(404).json({ error: 'Peptide not found.' });
    }
    res.status(200).json(peptide);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/peptides/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await peptideService.deletePeptide(
      req.params.id,
      req.userId
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
