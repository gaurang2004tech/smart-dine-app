import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import './KitchenDashboard.css';
import KitchenSoundAlert from '../components/KitchenSoundAlert';
import LiveOrderBadge from '../components/LiveOrderBadge';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]); // 🆕 Active service requests
  const navigate = useNavigate();

  // ⚠️ Ensure this IP exactly matches your backend IP!
  const API_URL = 'https://smartdine-backend-ao8c.onrender.com';

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);

      // We filter out 'paid' orders so they disappear from the kitchen once finished!
      const activeOrders = res.data.filter(order =>
        order.status && order.status.toLowerCase() !== 'paid'
      );
      setOrders(activeOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    // --- 1. SECURITY BOUNCER ---
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // Attach token to all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Load orders on first mount
    // Load orders on first mount safely
    const loadData = async () => {
      await fetchOrders();
    };
    loadData();

    // --- 2. REAL-TIME SOCKET CONNECTION ---
    const socket = io(API_URL);

    // Listen for status changes
    socket.on('orderUpdated', () => {
      fetchOrders();
    });

    // Listen for brand new orders
    socket.on('newOrder', () => {
      console.log("DING! New order arrived!");
      fetchOrders();
    });

    // 🛎️ Listen for waiter calls
    socket.on('callWaiter', (data) => {
      console.log("🛎️ Waiter called at table:", data.tableNumber);
      setWaiterCalls(prev => [...prev, { ...data, id: Date.now() }]);
      // Play a sound if possible (KitchenSoundAlert already handles broad alerts)
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  const updateStatus = async (orderId, currentStatus) => {
    // Map to strict lowercase for the Mongoose enum validation
    let nextStatus = '';
    const safeStatus = currentStatus ? currentStatus.toLowerCase() : '';

    if (safeStatus === 'pending') nextStatus = 'preparing';
    else if (safeStatus === 'preparing') nextStatus = 'ready';
    else if (safeStatus === 'ready') nextStatus = 'served';
    else return; // If it's already served, do nothing

    try {
      await axios.patch(`${API_URL}/api/orders/${orderId}/status`, {
        status: nextStatus
      });

      fetchOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating status. Check if your token expired and try logging in again.");
    }
  };

  // Helper function to color-code the tickets
  const getStatusColor = (status) => {
    if (!status) return '';
    const safeStatus = status.toLowerCase();

    if (safeStatus === 'pending') return 'pending';
    if (safeStatus === 'preparing') return 'preparing';
    if (safeStatus === 'ready') return 'ready';
    return '';
  };

  return (
    <div className="kitchen-layout">
      <header className="kitchen-header">
        <h1>👨‍🍳 Kitchen Command Center</h1>
        <div className="live-badge">⚡ SOCKET CONNECTED</div>
        <LiveOrderBadge apiUrl="https://smartdine-backend-ao8c.onrender.com" />
      </header>
      <KitchenSoundAlert apiUrl="https://smartdine-backend-ao8c.onrender.com" />

      {/* 🛎️ SERVICE REQUEST TOASTS */}
      <div className="service-calls-container">
        {waiterCalls.map(call => (
          <div key={call.id} className={`service-call-toast ${call.isGift ? 'gourmet-gift-toast' : ''}`}>
            <div className="service-call-content">
              <span className="bell-icon">{call.isGift ? '🎁' : '🛎️'}</span>
              <span className="service-call-text">
                {call.isGift ? (
                  <>Elite Reward for <strong>{call.customerName}</strong>!</>
                ) : (
                  <>Table <strong>{call.tableNumber}</strong> needs a waiter!</>
                )}
              </span>
            </div>
            <button
              className="service-call-dismiss"
              onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))}
            >
              {call.isGift ? 'SERVED' : 'DONE'}
            </button>
          </div>
        ))}
      </div>

      <div className="ticket-grid">
        {orders.length === 0 ? (
          <div className="empty-state">No active orders. Kitchen is clear! 🧹</div>
        ) : (
          orders.map(order => (
            <div key={order._id} className={`ticket-card ${getStatusColor(order.status)}`}>

              <div className="ticket-header">
                <h2>{order.tableNumber}</h2>
                <span className="time-badge">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="ticket-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <span className="item-qty">{item.quantity}x</span>
                    <span className="item-name">
                      {item.menuItem ? item.menuItem.name : 'Item'}
                      {item.instructions && (
                        <div className="item-instructions">📝 {item.instructions}</div>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`status-btn ${getStatusColor(order.status)}`}
                onClick={() => updateStatus(order._id, order.status)}
              >
                {order.status ? order.status.toUpperCase() : 'UNKNOWN'}
              </button>

            </div>
          ))
        )}
      </div>
    </div>
  );
}