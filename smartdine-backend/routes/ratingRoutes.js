/**
 * ratingRoutes.js
 * ---------------
 * POST /api/ratings         — Submit star ratings for items in an order
 * GET  /api/ratings/:itemId — Get average rating for a menu item
 *
 * HOW TO ACTIVATE (add to server.js):
 *   app.use('/api/ratings', require('./routes/ratingRoutes'));
 */

const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// ── POST /api/ratings — Submit ratings for all items in an order ────────────
// Body: { orderId: "...", ratings: [{ menuItemId: "...", stars: 4 }, ...] }
router.post('/', async (req, res) => {
    try {
        const { orderId, ratings } = req.body;

        if (!orderId || !Array.isArray(ratings) || ratings.length === 0) {
            return res.status(400).json({ message: 'orderId and ratings array required' });
        }

        // Insert all ratings, skip if this order+item already rated (idempotent)
        const docs = ratings.map(r => ({
            orderId,
            menuItemId: r.menuItemId,
            stars: r.stars,
        }));

        await Rating.insertMany(docs, { ordered: false }); // ordered:false = skip dupes, continue
        res.status(201).json({ message: 'Ratings saved!' });
    } catch (error) {
        // Ignore duplicate key errors (code 11000) — already rated
        if (error.code === 11000) {
            return res.status(200).json({ message: 'Already rated' });
        }
        console.error('Rating error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ── GET /api/ratings/:itemId — Get average rating + count for a menu item ───
router.get('/:itemId', async (req, res) => {
    try {
        const ratings = await Rating.find({ menuItemId: req.params.itemId });

        if (ratings.length === 0) {
            return res.json({ average: 0, count: 0 });
        }

        const total = ratings.reduce((sum, r) => sum + r.stars, 0);
        const average = parseFloat((total / ratings.length).toFixed(1));

        res.json({ average, count: ratings.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── GET /api/ratings — Bulk average ratings for all items ───────────────────
// Returns: { "menuItemId1": { average: 4.3, count: 12 }, ... }
router.get('/', async (req, res) => {
    try {
        const allRatings = await Rating.find();

        const grouped = {};
        allRatings.forEach(r => {
            const key = r.menuItemId.toString();
            if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
            grouped[key].total += r.stars;
            grouped[key].count += 1;
        });

        const result = {};
        Object.entries(grouped).forEach(([id, { total, count }]) => {
            result[id] = { average: parseFloat((total / count).toFixed(1)), count };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
