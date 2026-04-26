const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// 1. GET: Fetch Wallet details
router.get('/:phone', async (req, res) => {
    try {
        const customer = await Customer.findOne({ phoneNumber: req.phone || req.params.phone });
        if (!customer) return res.status(404).json({ message: 'User not found' });
        res.json({
            balance: customer.walletBalance || 0,
            points: customer.points || 0,
            transactions: customer.transactions || []
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. POST: Add virtual cash (Simulated)
router.post('/add', async (req, res) => {
    const { phone, amount } = req.body;
    try {
        const customer = await Customer.findOne({ phoneNumber: phone });
        if (!customer) return res.status(404).json({ message: 'User not found' });

        customer.walletBalance += Number(amount);
        customer.transactions.unshift({
            txType: 'Credit',
            amount: Number(amount),
            reason: 'Manual Top-up',
            timestamp: new Date()
        });

        await customer.save();
        res.json({ message: 'Balance updated', balance: customer.walletBalance });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. POST: Convert Points to Wallet Balance
router.post('/convert-points', async (req, res) => {
    const { phone, pointsToConvert } = req.body;
    const rate = 10; // 10 Points = ₹1

    try {
        const customer = await Customer.findOne({ phoneNumber: phone });
        if (!customer) return res.status(404).json({ message: 'User not found' });

        if (customer.points < pointsToConvert) {
            return res.status(400).json({ message: 'Insufficient points' });
        }

        const cashAmount = Math.floor(pointsToConvert / rate);
        if (cashAmount <= 0) return res.status(400).json({ message: 'Minimum 10 points required' });

        customer.points -= pointsToConvert;
        customer.walletBalance += cashAmount;

        customer.transactions.unshift({
            txType: 'Credit',
            amount: cashAmount,
            reason: `Converted ${pointsToConvert} points`,
            timestamp: new Date()
        });

        await customer.save();
        res.json({
            message: 'Points converted successfully!',
            balance: customer.walletBalance,
            points: customer.points
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
