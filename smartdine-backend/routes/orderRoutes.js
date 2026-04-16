const router = require('express').Router();
const Order = require('../models/order'); // Note: ensure your file is actually named order.js or Order.js to match this
const verifyToken = require('../middleware/auth');
// 1. PLACE NEW ORDER (Used by Mobile App)
router.post('/place', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();

    // Notify the Kitchen Dashboard immediately!
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', newOrder); 
    }

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET: Fetch ALL orders (Crucial for the Kitchen Dashboard!)
router.get('/', async (req, res) => {
  try {
    // We populate the menuItem so the kitchen sees the actual food names, not just IDs
    const orders = await Order.find().populate('items.menuItem');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
/// PATCH: Update Order Status (and broadcast it to the phone!)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // --- NEW REAL-TIME MAGIC ---
    // Grab the live socket connection from the Express app
    const io = req.app.get('io');
    
    // Broadcast the updated order to every connected device instantly
    if (io) {
      io.emit('orderUpdated', updatedOrder); 
    }
    // ---------------------------

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// POST: Place a new order (PUBLIC - Customers use this at checkout!)
router.post('/', async (req, res) => {
  try {
    const newOrder = new Order({
      tableNumber: req.body.tableNumber,
      items: req.body.items,
      status: 'pending' // All new orders start as Pending
    });

    const savedOrder = await newOrder.save();

    // 🔔 Ring the bell! Tell the Kitchen Dashboard a new order arrived
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', savedOrder); 
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// PATCH: Process Payment (PUBLIC - Customers don't have tokens!)
router.patch('/:id/pay', async (req, res) => {
  try {
    // Automatically set the status to 'Paid'
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'Paid' },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Broadcast the update so the Kitchen Dashboard clears the ticket!
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', updatedOrder); 
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET: Fetch a single order by its ID (For the tracking screen!)
router.get('/:id', async (req, res) => {
  try {
    // Find the order in the database
   const order = await Order.findById(req.params.id).populate('items.menuItem'); 
    // If it doesn't exist, say so
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Send the order back to the phone!
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 