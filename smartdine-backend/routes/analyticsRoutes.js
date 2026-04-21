/**
 * analyticsRoutes.js
 * ------------------
 * Analytics API endpoints for SmartDine Admin.
 *
 * HOW TO ACTIVATE (one-line addition to server.js):
 *   app.use('/api/analytics', require('./routes/analyticsRoutes'));
 *
 * Endpoints:
 *   GET /api/analytics/summary    — revenue, total orders, today's orders
 *   GET /api/analytics/top-items  — top 5 menu items by order count
 */

const router = require('express').Router();
const Order = require('../models/order');
const verifyToken = require('../middleware/auth');

// ── GET /api/analytics/summary ──────────────────────────────────────────────
router.get('/summary', verifyToken, async (req, res) => {
    try {
        const allOrders = await Order.find().populate('items.menuItem');
        const paidOrders = allOrders.filter(o => o.status?.toLowerCase() === 'paid');

        // Total revenue from paid orders
        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + order.items.reduce((s, item) => {
                const price = item.menuItem?.price ?? 0;
                return s + price * (item.quantity ?? 1);
            }, 0);
        }, 0);

        // Today's orders
        const todayStr = new Date().toDateString();
        const ordersToday = allOrders.filter(
            o => o.createdAt && new Date(o.createdAt).toDateString() === todayStr
        ).length;

        // Status breakdown
        const statusBreakdown = {};
        allOrders.forEach(o => {
            const s = (o.status || 'pending').toLowerCase();
            statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
        });

        res.json({
            totalOrders: allOrders.length,
            paidOrders: paidOrders.length,
            totalRevenue,
            ordersToday,
            statusBreakdown,
        });
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ message: error.message });
    }
});

// ── GET /api/analytics/top-items ────────────────────────────────────────────
router.get('/top-items', verifyToken, async (req, res) => {
    try {
        const allOrders = await Order.find().populate('items.menuItem');

        // Count item frequency
        const frequency = {};
        allOrders.forEach(order => {
            order.items.forEach(item => {
                if (!item.menuItem) return;
                const key = item.menuItem._id.toString();
                const name = item.menuItem.name;
                if (!frequency[key]) frequency[key] = { name, count: 0 };
                frequency[key].count += (item.quantity ?? 1);
            });
        });

        const topItems = Object.values(frequency)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({ topItems });
    } catch (error) {
        console.error('Analytics top-items error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
