import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react'; // The new package!
import './AdminDashboard.css'; // We will create this next

export default function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  
  // Form State
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Main Course' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QR Code State
  const [qrTable, setQrTable] = useState('Table-1');

  // ⚠️ Remember to use your actual backend IP!
  const API_URL = 'http://192.168.1.4:3000/api/menu';

  const fetchMenu = async () => {
    try {
      const res = await axios.get(API_URL);
      setMenuItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu", err);
    }
  };

 useEffect(() => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    // Wrap the call in a tiny async function to make the linter happy
    const loadData = async () => {
      await fetchMenu();
    };
    
    loadData();
  }, []);
  const handleAddFood = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(API_URL, {
        name: newItem.name,
        price: Number(newItem.price),
        category: newItem.category,
        inStock: true
      });
      setNewItem({ name: '', price: '', category: 'Main Course' }); // Reset form
      fetchMenu(); // Refresh the grid
   } catch (error) {
      console.error(error); // <-- Now the variable is being used!
      alert("Failed to perform action.");
    }
    setIsSubmitting(false);
  };

  const toggleStock = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/${id}`, { inStock: !currentStatus });
      fetchMenu(); // Refresh to show new status
   } catch (error) {
      console.error(error); // <-- Now the variable is being used!
      alert("Failed to perform action.");
    }
  };

  return (
    <div className="admin-layout">
      {/* Top Navigation */}
      <header className="admin-header">
        <div className="logo-section">
          <span className="logo-icon">💼</span>
          <h1>SmartDine Admin Console</h1>
        </div>
        <div className="admin-profile">Admin User</div>
      </header>

      <div className="admin-content">
        
        {/* LEFT COLUMN: Controls & Generators */}
        <div className="admin-sidebar">
          
          {/* Card 1: Add New Menu Item */}
          <div className="admin-card">
            <h2>➕ Add New Item</h2>
            <form onSubmit={handleAddFood} className="admin-form">
              <div className="input-group">
                <label>Item Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., Margherita Pizza"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Price (₹)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="e.g., 250"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                />
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
                onChange={(e) => setQrTable(e.target.value)}
              />
            </div>

            <div className="qr-display">
              {/* This generates a real, scannable QR code! */}
              <QRCodeSVG 
                value={`http://192.168.1.4:5173/menu?table=${qrTable}`} 
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
                      <td className="font-semibold">{item.name}</td>
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