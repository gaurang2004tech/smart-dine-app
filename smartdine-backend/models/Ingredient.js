const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    unit: { type: String, required: true, default: 'kg' }, // kg, l, pcs, g, ml
    currentStock: { type: Number, required: true, default: 0 },
    minStockLevel: { type: Number, required: true, default: 10 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    lastRestocked: Date,
    costPerUnit: Number,
    category: String // Dry, Frozen, Fresh, Beverage
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
