const router = require('express').Router();
const Customer = require('../models/Customer');

// Helper to determine tier
const calculateTier = (points) => {
    if (points >= 2000) return 'Black Card';
    if (points >= 500) return 'Gold';
    return 'Silver';
};

// GET: Fetch user profile by phone number (simulated login)
router.get('/:phoneNumber', async (req, res) => {
    try {
        let customer = await Customer.findOne({ phoneNumber: req.params.phoneNumber });
        if (!customer) {
            // Auto-create customer if not found (for easy demo)
            customer = new Customer({ phoneNumber: req.params.phoneNumber, name: 'Guest User' });
            await customer.save();
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Add points manually (for testing)
router.post('/:phoneNumber/reward', async (req, res) => {
    try {
        const { pointsToAdd } = req.body;
        const customer = await Customer.findOne({ phoneNumber: req.params.phoneNumber });
        if (!customer) return res.status(404).json({ message: 'User not found' });

        await customer.awardPoints(pointsToAdd);

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Claim a Gourmet Gift (Black Card only)
router.post('/:phoneNumber/claim-gift', async (req, res) => {
    try {
        const customer = await Customer.findOne({ phoneNumber: req.params.phoneNumber });
        if (!customer) return res.status(404).json({ message: 'User not found' });
        if (customer.unclaimedGifts <= 0) {
            return res.status(400).json({ message: 'No gifts available to claim' });
        }

        customer.unclaimedGifts -= 1;
        await customer.save();

        // 🔔 Notify the Kitchen Dashboard!
        const io = req.app.get('io');
        if (io) {
            io.emit('callWaiter', {
                tableNumber: 'VIP Loyalty',
                timestamp: new Date(),
                isGift: true,
                customerName: customer.name || 'Elite Member'
            });
            console.log(`🎁 Gourmet Gift Claimed by ${customer.phoneNumber}`);
        }

        res.json({ success: true, customer });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

