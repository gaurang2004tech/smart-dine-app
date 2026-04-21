import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Reservations.css';

const API_URL = 'https://smartdine-backend-ao8c.onrender.com';

export default function Reservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReservations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/reservations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReservations(res.data);
        } catch (err) {
            console.error('Failed to fetch reservations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/api/reservations/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReservations();
        } catch (err) {
            console.error('Update failed', err);
        }
    };

    const assignTable = async (id, tableNumber) => {
        if (!tableNumber) return;
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/api/reservations/${id}`, { tableNumber }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReservations();
        } catch (err) {
            console.error('Table assignment failed', err);
        }
    };

    const deleteReservation = async (id) => {
        if (!window.confirm('Delete this reservation?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/reservations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReservations();
        } catch (err) {
            console.error('Deletion failed', err);
        }
    };

    if (loading) return <div className="res-loading">Loading Reservations...</div>;

    return (
        <div className="res-layout">
            <header className="res-header">
                <Link to="/admin" className="res-back">← Admin Dashboard</Link>
                <h1>📅 Reservation Management</h1>
                <div className="res-badge">{reservations.length} Bookings</div>
            </header>

            <div className="res-content">
                {reservations.length === 0 ? (
                    <div className="res-empty">No reservations found.</div>
                ) : (
                    <div className="res-grid">
                        {reservations.map(res => (
                            <div key={res._id} className={`res-card ${res.status}`}>
                                <div className="res-card-header">
                                    <h3>{res.customerName}</h3>
                                    <span className={`status-pill ${res.status}`}>{res.status.toUpperCase()}</span>
                                </div>

                                <div className="res-details">
                                    <p><strong>📞 Phone:</strong> {res.phoneNumber}</p>
                                    <p><strong>👥 Guests:</strong> {res.guestCount}</p>
                                    <p><strong>⏰ Time:</strong> {new Date(res.reservationTime).toLocaleString()}</p>
                                    <p><strong>🪑 Table:</strong> {res.tableNumber}</p>
                                    {res.specialRequests && <p className="res-requests"><strong>📝 Note:</strong> {res.specialRequests}</p>}
                                </div>

                                <div className="res-actions">
                                    {res.status === 'pending' && (
                                        <button className="confirm-btn" onClick={() => updateStatus(res._id, 'confirmed')}>Confirm</button>
                                    )}
                                    {res.status === 'confirmed' && (
                                        <button className="complete-btn" onClick={() => updateStatus(res._id, 'completed')}>Completed</button>
                                    )}
                                    <button className="cancel-btn" onClick={() => updateStatus(res._id, 'cancelled')}>Cancel</button>

                                    <div className="assign-group">
                                        <input
                                            type="text"
                                            placeholder="Table #"
                                            defaultValue={res.tableNumber !== 'TBD' ? res.tableNumber : ''}
                                            onBlur={(e) => assignTable(res._id, e.target.value)}
                                        />
                                        <button className="delete-icon" onClick={() => deleteReservation(res._id)}>🗑️</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
