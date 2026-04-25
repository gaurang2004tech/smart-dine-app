const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
    categories: [String], // Array of what they supply
    rating: { type: Number, default: 5 }
});

module.exports = mongoose.model('Supplier', supplierSchema);
