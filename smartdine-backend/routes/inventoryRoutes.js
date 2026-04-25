const express = require('express');
const router = express.Router();
const Ingredient = require('../models/Ingredient');
const Supplier = require('../models/Supplier');
const verifyToken = require('../middleware/auth');

// --- Ingredients Routes ---

// GET: All ingredients
router.get('/ingredients', async (req, res) => {
    try {
        const ingredients = await Ingredient.find().populate('supplier');
        res.json(ingredients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Add new ingredient
router.post('/ingredients', verifyToken, async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.supplier === "") delete data.supplier; // Handle empty optional field

        const ingredient = new Ingredient(data);
        await ingredient.save();
        res.status(201).json(ingredient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH: Update ingredient
router.patch('/ingredients/:id', verifyToken, async (req, res) => {
    try {
        const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(ingredient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE: Remove ingredient
router.delete('/ingredients/:id', verifyToken, async (req, res) => {
    try {
        const result = await Ingredient.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Ingredient not found' });
        res.json({ message: 'Ingredient deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Suppliers Routes ---

// GET: All suppliers
router.get('/suppliers', async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Add new supplier
router.post('/suppliers', verifyToken, async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json(supplier);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
