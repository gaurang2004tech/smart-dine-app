const router = require('express').Router();
const Customer = require('../models/Customer');

const rewardPoints = async (phoneNumber, amount) => {
  if (!phoneNumber || !amount) return;
  try {
    const customer = await Customer.findOne({ phoneNumber });
    if (customer) {
      const pointsToAdd = Math.floor(amount * 0.1); // 10% of spend
      await customer.awardPoints(pointsToAdd);
      console.log(`✅ Awarded ${pointsToAdd} points to ${phoneNumber}. New total: ${customer.points}`);
    }
  } catch (err) {
    console.error('Loyalty Error:', err);
  }
};

router.use((req, res, next) => {
  console.log(`📡 OrderRoute Request: ${req.method} ${req.url}`);
  next();
});

const Order = require('../models/order');
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
      customerPhone: req.body.customerPhone,
      items: req.body.items,
      totalAmount: req.body.totalAmount || 0,
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
// 🆕 PATCH: Process Payment for an ENTIRE table (Used by Split & Pay)
router.patch('/table/:tableNumber/pay', async (req, res) => {
  try {
    // Award points to each order's customer in the table
    const orders = await Order.find({ tableNumber: req.params.tableNumber, status: { $nin: ['paid', 'cancelled'] } }).populate('items.menuItem');

    for (const order of orders) {
      // Calculate total if not set
      const total = order.items.reduce((sum, i) => sum + (i.menuItem?.price || 0) * (i.quantity || 1), 0);
      await rewardPoints(order.customerPhone, total);
    }

    const result = await Order.updateMany(
      { tableNumber: req.params.tableNumber, status: { $nin: ['paid', 'cancelled'] } },
      { status: 'paid' }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', { tableNumber: req.params.tableNumber, status: 'paid' });
    }

    res.json({ success: true, message: `Paid ${result.modifiedCount} orders for ${req.params.tableNumber}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH: Process Payment for a single order
router.patch('/:id/pay', async (req, res) => {
  try {
    const updatedOrder = await Order.findById(req.params.id).populate('items.menuItem');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    updatedOrder.status = 'paid';
    await updatedOrder.save();

    // Reward points
    const total = updatedOrder.items.reduce((sum, i) => sum + (i.menuItem?.price || 0) * (i.quantity || 1), 0);
    await rewardPoints(updatedOrder.customerPhone, total);

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// 4. GET: Fetch all active orders for a specific table (for bill splitting)
router.get('/table/:tableNumber', async (req, res) => {
  try {
    const orders = await Order.find({
      tableNumber: req.params.tableNumber,
      status: { $nin: ['paid', 'cancelled'] } // Only active orders
    }).populate('items.menuItem');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Fetch a single order by its ID (For the tracking screen!)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 