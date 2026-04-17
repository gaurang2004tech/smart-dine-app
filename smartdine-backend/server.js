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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allow your React/Mobile apps to connect
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

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


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));