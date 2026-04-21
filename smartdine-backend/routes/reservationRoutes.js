const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

// @route   POST /api/reservations
// @desc    Create a new reservation
// @access  Public (for mobile users)
router.post('/', async (req, res) => {
    try {
        const { customerName, phoneNumber, guestCount, reservationTime, specialRequests } = req.body;

        const newReservation = new Reservation({
            customerName,
            phoneNumber,
            guestCount,
            reservationTime,
            specialRequests
        });

        await newReservation.save();
        res.status(201).json(newReservation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/reservations
// @desc    Get all reservations
// @access  Private (Admin)
// For simplicity in this demo, we'll assume the admin token check is handled via middleware in server.js or here
router.get('/', async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ reservationTime: 1 });
        res.json(reservations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/reservations/:id
// @desc    Update reservation status or assigned table
// @access  Private (Admin)
router.patch('/:id', async (req, res) => {
    try {
        const { status, tableNumber } = req.body;
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found' });
        }

        if (status) reservation.status = status;
        if (tableNumber) reservation.tableNumber = tableNumber;

        await reservation.save();
        res.json(reservation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/reservations/:id
// @desc    Delete a reservation
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found' });
        }

        await reservation.deleteOne();
        res.json({ msg: 'Reservation removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
