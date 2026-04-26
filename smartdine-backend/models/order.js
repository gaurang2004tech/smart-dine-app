const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true },
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
      },
      quantity: { type: Number, default: 1 },
      instructions: { type: String, default: '' } // 🆕 New field for customization
    }
  ],
  customerPhone: String,
  totalAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Wallet'],
    default: 'Cash'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);