import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react'; // The new package!
import './AdminDashboard.css'; // We will create this next

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);

  // Form State
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Main Course', dietaryType: 'Veg', isSpicy: false, image: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code State
  const [qrTable, setQrTable] = useState(() => {
    return localStorage.getItem('savedQrTable') || 'Table-1';
  });
  const handleQrChange = (e) => {
    const newTable = e.target.value;
    setQrTable(newTable);
    localStorage.setItem('savedQrTable', newTable);
  };
  // AI Insights State
  const [insight, setInsight] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [waiterCalls, setWaiterCalls] = useState([]); // 🆕 Service requests
  // ⚠️ Remember to use your actual backend IP!
  const API_URL = 'https://smartdine-backend-ao8c.onrender.com/api/menu';

  const fetchMenu = async () => {
    try {
      const res = await axios.get(API_URL);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu", err);
    }
  };
  const generateInsight = async () => {
    setLoadingAi(true);
    try {
      // ⚠️ Note: We use /api/ai/insights here
      const res = await axios.get('https://smartdine-backend-ao8c.onrender.com/api/ai/insights', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInsight(res.data.insight);
    } catch (error) {
      console.error("AI Error:", error);
      setInsight("AI is currently offline. Ensure your OpenAI Key is set in the .env file.");
    } finally {
      setLoadingAi(false);
    }
  };
  useEffect(() => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    // Wrap the call in a tiny async function to make the linter happy
    const loadData = async () => {
      await fetchMenu();
    };

    loadData();

    // ── Real-time Waiter Calls ──
    const socket = io('https://smartdine-backend-ao8c.onrender.com');
    socket.on('callWaiter', (data) => {
      setWaiterCalls(prev => [...prev, { ...data, id: Date.now() }]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  const handleAddFood = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(API_URL, {
        name: newItem.name,
        price: Number(newItem.price),
        category: newItem.category,
        dietaryType: newItem.dietaryType,
        image: newItem.image,
        inStock: true
      });
      setNewItem({ name: '', price: '', category: 'Main Course', dietaryType: 'Veg', isSpicy: false, image: '' }); // Reset form
      fetchMenu(); // Refresh the grid
    } catch (error) {
      console.error(error); // <-- Now the variable is being used!
      alert("Failed to perform action.");
    }
    setIsSubmitting(false);
  };

  const toggleStock = async (id, currentStatus) => {
    const newStatus = !currentStatus;

    // 🌟 1. Grab the token from storage
    const token = localStorage.getItem('token');

    const finalUrl = API_URL.endsWith('/api/menu')
      ? `${API_URL}/${id}`
      : `${API_URL}/api/menu/${id}`;

    try {
      // 🌟 2. Send the token to the backend bouncer in the headers!
      const response = await axios.patch(finalUrl,
        { inStock: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        fetchMenu(); // Refresh the list
      }
    } catch (error) {
      console.error("Update failed:", error.response?.data || error);
    }
  };

  return (
    <div className="admin-layout">
      {/* Top Navigation */}
      <header className="admin-header">
        <div className="logo-section">
          <span className="logo-icon">💼</span>
          <h1 style={{ fontWeight: '800', fontSize: '24px', margin: 0, display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#6C5CE7' }}>SmartDine</span>
            <span style={{ color: '#2D3748', marginLeft: '8px' }}>Admin Console</span>
          </h1>
        </div>
        <div className="admin-profile">
          <Link to="/inventory" style={{ marginRight: '20px', color: '#6C5CE7', fontWeight: 'bold' }}>📦 Inventory</Link>
          <Link to="/reservations" style={{ marginRight: '20px', color: '#6C5CE7', fontWeight: 'bold' }}>📅 Reservations</Link>
          Admin User
        </div>
      </header>

      <div className="admin-content">

        {/* 🛎️ SERVICE REQUEST TOASTS (Matching Kitchen Dashboard style) */}
        {waiterCalls.length > 0 && (
          <div className="service-calls-container" style={{ gridColumn: '1 / -1', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {waiterCalls.map(call => (
              <div key={call.id} className="service-call-toast" style={{ backgroundColor: '#1A202C', color: 'white', padding: '15px 25px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderLeft: '6px solid #F6E05E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '20px' }}>🛎️</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Table {call.tableNumber} needs a waiter!</span>
                </div>
                <button
                  onClick={() => setWaiterCalls(prev => prev.filter(c => c.id !== call.id))}
                  style={{ backgroundColor: '#2D3748', color: '#F6E05E', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  DISMISS
                </button>
              </div>
            ))}
          </div>
        )}

        {/* LEFT COLUMN: Controls & Generators */}
        <div className="admin-sidebar">

          {/* Card 1: Add New Menu Item */}
          <div className="admin-card">
            {/* 🌟 AI INSIGHTS WIDGET 🌟 */}
            <div className="admin-card" style={{ backgroundColor: '#1E1E2F', border: '1px solid #6C5CE7', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#A0AEC0', margin: 0, fontSize: '18px' }}>✨ AI Consultant</h3>
                <button
                  onClick={generateInsight}
                  disabled={loadingAi}
                  style={{ backgroundColor: '#6C5CE7', color: 'white', padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {loadingAi ? 'Analyzing...' : 'Refresh'}
                </button>
              </div>

              {insight ? (
                <div style={{ backgroundColor: '#2D2D44', padding: '15px', borderRadius: '10px', color: '#FFF', fontSize: '14px', lineHeight: '1.4', fontStyle: 'italic', borderLeft: '4px solid #6C5CE7' }}>
                  "{insight}"
                </div>
              ) : (
                <p style={{ color: '#718096', fontSize: '13px', margin: 0 }}>Click refresh to get AI business tips based on your orders.</p>
              )}
            </div>
            <h2>➕ Add New Item</h2>
            <form onSubmit={handleAddFood} className="admin-form">
              <div className="input-group">
                <label>Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Margherita Pizza"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g., 250"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newItem.image}
                  onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                />
                {newItem.image && (
                  <img src={newItem.image} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8, border: '1px solid #E2E8F0' }} />
                )}
              </div>
              <div className="input-group">
                <label>Dietary Type</label>
                <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                  {['Veg', 'Non-Veg', 'Vegan'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#4A5568', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dietaryType"
                        value={type}
                        checked={newItem.dietaryType === type}
                        onChange={(e) => setNewItem({ ...newItem, dietaryType: e.target.value })}
                      />
                      <span>{type === 'Veg' ? '🟢 ' : type === 'Non-Veg' ? '🔴 ' : '🌿 '}{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newItem.isSpicy}
                    onChange={(e) => setNewItem({ ...newItem, isSpicy: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '15px', color: '#000', fontWeight: 'bold' }}>🌶️ Very Spicy?</span>
                </label>
              </div>
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Save to Menu'}
              </button>
            </form>
          </div>

          {/* Card 2: QR Code Generator */}
          <div className="admin-card qr-card">
            <h2>🖨️ Generate Table QR</h2>
            <p className="subtext">Print this for the physical tables.</p>

            <div className="input-group">
              <label>Table Number</label>
              <input
                type="text"
                value={qrTable}
                onChange={handleQrChange}
                placeholder="e.g., Table-2"
              />
            </div>

            <div className="qr-display">
              {/* This generates a real, scannable QR code! */}
              {/* This generates a real, scannable QR code! */}
              <QRCodeSVG
                value={qrTable}
                size={160}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"H"}
              />
              <span className="qr-label">{qrTable}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: The Data Grid */}
        <div className="admin-main">
          <div className="admin-card data-card">
            <div className="data-header">
              <h2>📋 Live Menu Database</h2>
              <span className="badge">{menuItems.length} Total Items</span>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map(item => (
                    <tr key={item._id} className={!item.inStock ? 'out-of-stock-row' : ''}>
                      <td className="font-semibold">
                        {item.isSpicy && <span style={{ marginRight: '6px' }} title="Spicy">🌶️</span>}
                        {item.name}
                        {item.dietaryType && item.dietaryType !== 'None' && (
                          <span style={{ fontSize: '10px', marginLeft: '10px', padding: '3px 8px', borderRadius: '6px', backgroundColor: item.dietaryType === 'Veg' ? '#DCFCE7' : item.dietaryType === 'Non-Veg' ? '#FEE2E2' : '#F3E8FF', color: item.dietaryType === 'Veg' ? '#166534' : item.dietaryType === 'Non-Veg' ? '#991B1B' : '#6B21A8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {item.dietaryType}
                          </span>
                        )}
                      </td>
                      <td>₹{item.price}</td>
                      <td>
                        <span className={`status-badge ${item.inStock ? 'active' : 'inactive'}`}>
                          {item.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleStock(item._id, item.inStock)}
                          className={`toggle-btn ${item.inStock ? 'btn-danger' : 'btn-success'}`}
                        >
                          {item.inStock ? 'Mark Out' : 'Restock'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}