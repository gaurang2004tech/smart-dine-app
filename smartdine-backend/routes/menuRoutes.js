const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// ⚠️ Check this line! Make sure it matches your actual model name and file path
const MenuItem = require('../models/menuItems');

// 1. GET: Fetch all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. POST: Add a new item to the menu
router.post('/', verifyToken, async (req, res) => {
  try {
    const newItem = new MenuItem({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      dietaryType: req.body.dietaryType || 'None',
      image: req.body.image || '',
      isSpicy: req.body.isSpicy !== undefined ? req.body.isSpicy : false,
      inStock: req.body.inStock !== undefined ? req.body.inStock : true
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 3. PATCH: Update an item's stock status
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// THIS MUST BE THE ABSOLUTE LAST LINE IN THE FILE! 👇
module.exports = router;