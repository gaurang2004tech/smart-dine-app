const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true },
  items: [
    {
      menuItem: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MenuItem' 
      },
      quantity: { type: Number, default: 1 }
    }
  ],
  totalAmount: Number,
  status: { 
    type: String, 
    enum: ['pending', 'preparing', 'ready', 'paid'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);