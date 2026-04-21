const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image: String,
  category: { type: String, required: true }, // e.g., 'Coffee', 'Dessert'
  dietaryType: {
    type: String,
    enum: ['Veg', 'Non-Veg', 'Vegan', 'None'],
    default: 'None'
  },
  sommelierNote: String,
  origin: String,
  vintage: String,
  isCellar: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  inStock: { type: Boolean, default: true }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);