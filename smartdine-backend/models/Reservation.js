const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    guestCount: {
        type: Number,
        required: true,
        min: 1
    },
    reservationTime: {
        type: Date,
        required: true
    },
    tableNumber: {
        type: String,
        default: 'TBD'
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    specialRequests: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
