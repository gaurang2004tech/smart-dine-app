const router = require('express').Router();
const Customer = require('../models/Customer');
const Ingredient = require('../models/Ingredient');
const MenuItem = require('../models/menuItems'); // 🆕 Ensure MenuItem model is registered for populate

const rewardPoints = async (phoneNumber, amount) => {
  if (!phoneNumber || isNaN(amount)) return;
  try {
    const customer = await Customer.findOne({ phoneNumber });
    if (customer) {
      const pointsToAdd = Math.floor(amount * 0.1);
      await customer.awardPoints(pointsToAdd);
      console.log(`✅ Awarded ${pointsToAdd} points to ${phoneNumber}. New total: ${customer.points}`);
    }
  } catch (err) {
    console.error('❌ Loyalty Error:', err);
  }
};

router.use((req, res, next) => {
  console.log(`📡 OrderRoute Request: ${req.method} ${req.url}`);
  next();
});

const Order = require('../models/order');
const verifyToken = require('../middleware/auth');

router.post('/place', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    const io = req.app.get('io');
    if (io) io.emit('newOrder', newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('items.menuItem');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = req.body.status;

    // 🏆 AUTO-PAY LOGIC: If order is served AND it was pre-paid (Wallet), move to 'paid' status
    if (order.status?.toLowerCase() === 'served' && order.isPaid) {
      order.status = 'paid';
    }

    const updatedOrder = await order.save();

    if (req.body.status?.toLowerCase() === 'served') {
      try {
        const fullOrder = await Order.findById(updatedOrder._id).populate('items.menuItem');
        for (const item of fullOrder.items) {
          if (item.menuItem && item.menuItem.recipe) {
            for (const recipeEntry of item.menuItem.recipe) {
              await Ingredient.findByIdAndUpdate(
                recipeEntry.ingredient,
                { $inc: { currentStock: -(recipeEntry.quantity * (item.quantity || 1)) } }
              );
            }
          }
        }
      } catch (err) {
        console.error('❌ Inventory Deduction Failed:', err);
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', updatedOrder);
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newOrder = new Order({
      tableNumber: req.body.tableNumber,
      customerPhone: req.body.customerPhone,
      items: req.body.items,
      totalAmount: req.body.totalAmount || 0,
      paymentMethod: req.body.paymentMethod || 'Cash',
      status: 'pending'
    });

    const savedOrder = await newOrder.save();
    const io = req.app.get('io');
    if (io) io.emit('newOrder', savedOrder);
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/table/:tableNumber/pay', async (req, res) => {
  try {
    const orders = await Order.find({ tableNumber: req.params.tableNumber, status: { $nin: ['paid', 'cancelled'] } }).populate('items.menuItem');

    for (const order of orders) {
      const total = order.items.reduce((sum, i) => sum + (i.menuItem?.price || 0) * (i.quantity || 1), 0);

      if (req.body.paymentMethod === 'Wallet') {
        const customer = await Customer.findOne({ phoneNumber: order.customerPhone });
        if (customer && customer.walletBalance >= total) {
          customer.walletBalance -= total;
          customer.transactions.unshift({
            txType: 'Debit',
            amount: total,
            reason: `Order at Table ${order.tableNumber}`,
            timestamp: new Date()
          });
          await customer.save();
          order.isPaid = true; // ✅ Secured but don't mark 'paid' status yet!
          await order.save();
        }
      }
      await rewardPoints(order.customerPhone, total);
    }

    // Only mark status 'paid' if NOT using Wallet (to keep kitchen visibility)
    // Or if Wallet used, we just update payment method
    let updateFields = { paymentMethod: req.body.paymentMethod || 'Cash' };
    if (req.body.paymentMethod !== 'Wallet') {
      updateFields.status = 'paid';
    }

    await Order.updateMany(
      { tableNumber: req.params.tableNumber, status: { $nin: ['paid', 'cancelled'] } },
      updateFields
    );

    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', { tableNumber: req.params.tableNumber });

    res.json({ success: true, message: `Processed payment for ${req.params.tableNumber}` });
  } catch (error) {
    console.error('❌ Table Pay Error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/pay', async (req, res) => {
  try {
    const updatedOrder = await Order.findById(req.params.id).populate('items.menuItem');
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

    const total = updatedOrder.items.reduce((sum, i) => sum + (i.menuItem?.price || 0) * (i.quantity || 1), 0);

    if (req.body.paymentMethod === 'Wallet') {
      const customer = await Customer.findOne({ phoneNumber: updatedOrder.customerPhone });
      if (!customer || customer.walletBalance < total) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      customer.walletBalance -= total;
      customer.transactions.unshift({
        txType: 'Debit',
        amount: total,
        reason: `Payment for Order ${updatedOrder._id}`,
        timestamp: new Date()
      });
      await customer.save();
      updatedOrder.isPaid = true;
    }

    // Only mark status 'paid' if it's Cash/Card, or if it was ALREADY served
    if (req.body.paymentMethod !== 'Wallet' || updatedOrder.status === 'served') {
      updatedOrder.status = 'paid';
    }

    updatedOrder.paymentMethod = req.body.paymentMethod || 'Cash';
    await updatedOrder.save();

    await rewardPoints(updatedOrder.customerPhone, total);

    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', updatedOrder);
    res.json(updatedOrder);
  } catch (error) {
    console.error('❌ Single Pay Error:', error);
    res.status(500).json({ message: error.message, stack: error.stack, location: 'router.patch("/:id/pay")' });
  }
});

router.get('/table/:tableNumber', async (req, res) => {
  try {
    const orders = await Order.find({ tableNumber: req.params.tableNumber, status: { $nin: ['paid', 'cancelled'] } }).populate('items.menuItem');
    res.json(orders);
  } catch (error) {
    console.error('❌ GET Table Orders Error:', error);
    res.status(500).json({ message: error.message, stack: error.stack, location: 'router.get("/table/:tableNumber")' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.menuItem');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('❌ GET Single Order Error:', error);
    res.status(500).json({ message: error.message, stack: error.stack, location: 'router.get("/:id")' });
  }
});

module.exports = router;