import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InventoryDashboard.css';

const InventoryDashboard = () => {
    const [ingredients, setIngredients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🛠️ DEV TIP: Use localhost:3000 while testing locally, then swap to your Render URL for production
    const API_URL = "https://smartdine-backend-ao8c.onrender.com/api/inventory";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ingRes, supRes] = await Promise.all([
                    axios.get(`${API_URL}/ingredients`),
                    axios.get(`${API_URL}/suppliers`)
                ]);
                setIngredients(ingRes.data);
                setSuppliers(supRes.data);
            } catch (err) {
                console.error("Failed to fetch inventory data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStockLevel).length;

    if (loading) return <div className="inventory-container">Loading Asset Records...</div>;

    return (
        <div className="inventory-container">
            <header className="inventory-header">
                <div>
                    <h1>Inventory Management</h1>
                    <p style={{ color: '#64748b' }}>Track and manage your kitchen raw materials</p>
                </div>
                <button className="action-btn btn-primary">+ Add New Ingredient</button>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Ingredients</h3>
                    <div className="value">{ingredients.length}</div>
                </div>
                <div className={`stat-card ${lowStockCount > 0 ? 'alert' : ''}`}>
                    <h3>Low Stock Alerts</h3>
                    <div className="value">{lowStockCount}</div>
                </div>
                <div className="stat-card">
                    <h3>Active Suppliers</h3>
                    <div className="value">{suppliers.length}</div>
                </div>
            </div>

            <div className="inventory-grid">
                <div className="inventory-table-container">
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Unit</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ingredients.map(item => (
                                <tr key={item._id}>
                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                    <td>{item.category || 'General'}</td>
                                    <td>{item.currentStock}</td>
                                    <td>{item.unit}</td>
                                    <td>
                                        <span className={`stock-badge ${item.currentStock <= item.minStockLevel ? 'low' : 'good'}`}>
                                            {item.currentStock <= item.minStockLevel ? 'LOW STOCK' : 'IN STOCK'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-btn" style={{ background: '#f1f5f9', color: '#475569' }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="supplier-section">
                    <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Quick Supplier Guide</h2>
                    {suppliers.map(sup => (
                        <div key={sup._id} className="supplier-card">
                            <h4>{sup.name}</h4>
                            <p>📞 {sup.phone}</p>
                            <p>📦 {sup.categories.join(', ')}</p>
                        </div>
                    ))}
                    <button className="action-btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Manage Vendors</button>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
