import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InventoryDashboard.css';

const InventoryDashboard = () => {
    const [ingredients, setIngredients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form States
    const [showIngModal, setShowIngModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSupModal, setShowSupModal] = useState(false);

    const [newIng, setNewIng] = useState({ name: '', category: 'Dry', unit: 'kg', currentStock: 0, minStockLevel: 5, supplier: '' });
    const [editingIng, setEditingIng] = useState(null);
    const [newSup, setNewSup] = useState({ name: '', phone: '', categories: '' });

    const API_URL = "https://smartdine-backend-ao8c.onrender.com/api/inventory";

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

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddIngredient = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...newIng };
            if (!payload.supplier) delete payload.supplier;

            await axios.post(`${API_URL}/ingredients`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowIngModal(false);
            setNewIng({ name: '', category: 'Dry', unit: 'kg', currentStock: 0, minStockLevel: 5, supplier: '' });
            fetchData();
        } catch (err) {
            alert("Failed to add ingredient.");
        }
    };

    const handleEditIngredient = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...editingIng };
            if (!payload.supplier) payload.supplier = null;

            await axios.patch(`${API_URL}/ingredients/${editingIng._id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowEditModal(false);
            setEditingIng(null);
            fetchData();
        } catch (err) {
            alert("Failed to update ingredient.");
        }
    };

    const handleDeleteIngredient = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ingredient?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/ingredients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert("Failed to delete ingredient.");
        }
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/suppliers`, {
                ...newSup,
                categories: typeof newSup.categories === 'string' ? newSup.categories.split(',').map(s => s.trim()) : newSup.categories
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowSupModal(false);
            setNewSup({ name: '', phone: '', categories: '' });
            fetchData();
        } catch (err) {
            alert("Failed to add supplier.");
        }
    };

    const lowStockCount = ingredients.filter(i => i.currentStock <= i.minStockLevel).length;

    if (loading) return <div className="inventory-container">Loading Asset Records...</div>;

    const units = ['kg', 'g', 'L', 'ml', 'Piece', 'Pack', 'Bottle', 'Box'];

    return (
        <div className="inventory-container">
            <header className="inventory-header">
                <div>
                    <h1>Inventory Management</h1>
                    <p style={{ color: '#64748b' }}>Track and manage your kitchen raw materials</p>
                </div>
                <button className="action-btn btn-primary" onClick={() => setShowIngModal(true)}>+ Add New Ingredient</button>
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
                                <th>Stock</th>
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
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className="action-btn"
                                                style={{ background: '#f1f5f9', color: '#475569' }}
                                                onClick={() => { setEditingIng(item); setShowEditModal(true); }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="action-btn"
                                                style={{ background: '#FEE2E2', color: '#991B1B' }}
                                                onClick={() => handleDeleteIngredient(item._id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
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
                            <p>📦 {Array.isArray(sup.categories) ? sup.categories.join(', ') : sup.categories}</p>
                        </div>
                    ))}
                    <button className="action-btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setShowSupModal(true)}>Manage Vendors</button>
                </div>
            </div>

            {/* --- Add Ingredient Modal --- */}
            {showIngModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ color: '#000000' }}>Add New Ingredient</h2>
                        <form onSubmit={handleAddIngredient}>
                            <div className="form-group">
                                <label>Ingredient Name</label>
                                <input type="text" required value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Category</label>
                                    <select value={newIng.category} onChange={e => setNewIng({ ...newIng, category: e.target.value })}>
                                        <option>Dry</option>
                                        <option>Fresh</option>
                                        <option>Frozen</option>
                                        <option>Beverage</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Unit (kg, L, etc.)</label>
                                    <select value={newIng.unit} onChange={e => setNewIng({ ...newIng, unit: e.target.value })}>
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Init Stock</label>
                                    <input type="number" value={newIng.currentStock} onChange={e => setNewIng({ ...newIng, currentStock: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Min Level</label>
                                    <input type="number" value={newIng.minStockLevel} onChange={e => setNewIng({ ...newIng, minStockLevel: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Supplier</label>
                                <select value={newIng.supplier} onChange={e => setNewIng({ ...newIng, supplier: e.target.value })}>
                                    <option value="">No Supplier</option>
                                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="action-btn" onClick={() => setShowIngModal(false)}>Cancel</button>
                                <button type="submit" className="action-btn btn-primary">Save Ingredient</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Edit Ingredient Modal --- */}
            {showEditModal && editingIng && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ color: '#000000' }}>Edit Ingredient: {editingIng.name}</h2>
                        <form onSubmit={handleEditIngredient}>
                            <div className="form-group">
                                <label>Ingredient Name</label>
                                <input type="text" required value={editingIng.name} onChange={e => setEditingIng({ ...editingIng, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Stock Level</label>
                                    <input type="number" required value={editingIng.currentStock} onChange={e => setEditingIng({ ...editingIng, currentStock: Number(e.target.value) })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Unit</label>
                                    <select value={editingIng.unit} onChange={e => setEditingIng({ ...editingIng, unit: e.target.value })}>
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={editingIng.category} onChange={e => setEditingIng({ ...editingIng, category: e.target.value })}>
                                    <option>Dry</option>
                                    <option>Fresh</option>
                                    <option>Frozen</option>
                                    <option>Beverage</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="action-btn" onClick={() => { setShowEditModal(false); setEditingIng(null); }}>Cancel</button>
                                <button type="submit" className="action-btn btn-primary">Update Details</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Add Supplier Modal --- */}
            {showSupModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ color: '#000000' }}>Add New Supplier</h2>
                        <form onSubmit={handleAddSupplier}>
                            <div className="form-group">
                                <label>Supplier Name</label>
                                <input type="text" required value={newSup.name} onChange={e => setNewSup({ ...newSup, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="text" value={newSup.phone} onChange={e => setNewSup({ ...newSup, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Categories (comma separated)</label>
                                <input type="text" placeholder="Dairy, Meat, Veggies" value={newSup.categories} onChange={e => setNewSup({ ...newSup, categories: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="action-btn" onClick={() => setShowSupModal(false)}>Cancel</button>
                                <button type="submit" className="action-btn btn-primary">Save Supplier</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryDashboard;
