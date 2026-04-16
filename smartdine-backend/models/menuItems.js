const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  category: { type: String, required: true }, // e.g., 'Coffee', 'Dessert'
  inStock: { type: Boolean, default: true }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);