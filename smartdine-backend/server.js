const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/auth');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const walletRoutes = require('./routes/walletRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allow your React/Mobile apps to connect
});

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 🖼️ Serve gourmet menu images
app.use('/api/auth', authRoutes);
app.use('/api/analytics', require('./routes/analyticsRoutes'));
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ SmartDine DB Connected"))
  .catch(err => console.error("❌ Connection Error:", err));

// Real-time logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Pass 'io' to routes so we can trigger real-time updates
app.set('io', io);

// Basic Route for testing
app.get('/', (req, res) => res.send("SmartDine API is Running"));
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ratings', require('./routes/ratingRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/inventory', inventoryRoutes);
app.use('/api/wallet', walletRoutes);

// 🛎️ SERVICE CALLS (Call Waiter)
app.post('/api/notifications/call-waiter', (req, res) => {
  const { tableNumber } = req.body;
  const io = req.app.get('io');
  if (io) {
    io.emit('callWaiter', { tableNumber, timestamp: new Date() });
    console.log(`🛎️ Service requested at Table: ${tableNumber}`);
  }
  res.status(200).json({ success: true, message: "Waiter is on the way!" });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));