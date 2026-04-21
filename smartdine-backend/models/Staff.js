const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'kitchen'], default: 'kitchen' }
});

module.exports = mongoose.model('Staff', staffSchema);
