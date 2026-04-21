/**
 * Rating.js — Mongoose model for customer star ratings
 * ----------------------------------------------------
 * Stores one rating per order. Referenced by menuItem for avg display.
 */
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rating', ratingSchema);
