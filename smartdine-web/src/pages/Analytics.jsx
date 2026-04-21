/**
 * Analytics.jsx
 * -------------
 * A beautiful analytics dashboard for SmartDine admins.
 * Fetches from existing /api/orders — no backend changes needed.
 *
 * HOW TO USE:
 *   1. Import in App.jsx:
 *      import Analytics from './pages/Analytics';
 *   2. Add a route:
 *      <Route path="/analytics" element={<Analytics />} />
 *   3. Add a nav link in AdminDashboard header:
 *      <a href="/analytics">📊 Analytics</a>
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import './Analytics.css';

const API_URL = 'https://smartdine-backend-ao8c.onrender.com';

export default function Analytics() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        axios.get(`${API_URL}/api/orders`)
            .then(res => setOrders(res.data))
            .catch(err => console.error('Analytics fetch failed:', err))
            .finally(() => setLoading(false));
    }, []);

    // --- Computed metrics ---
    const paidOrders = orders.filter(o => o.status?.toLowerCase() === 'paid');

    const totalRevenue = paidOrders.reduce((sum, order) => {
        return sum + order.items.reduce((s, item) => {
            return s + ((item.menuItem?.price ?? 0) * (item.quantity ?? 1));
        }, 0);
    }, 0);

    const todayStr = new Date().toDateString();
    const ordersToday = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr).length;

    // Status breakdown
    const statusGroups = ['pending', 'preparing', 'ready', 'served', 'paid'].map(s => ({
        label: s,
        count: orders.filter(o => o.status?.toLowerCase() === s).length,
    }));

    // Top 5 items by frequency
    const itemFrequency = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const name = item.menuItem?.name ?? 'Unknown';
            itemFrequency[name] = (itemFrequency[name] || 0) + (item.quantity ?? 1);
        });
    });

    const topItems = Object.entries(itemFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const maxCount = topItems[0]?.[1] ?? 1;

    const statusColors = {
        pending: { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
        preparing: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
        ready: { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
        served: { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
        paid: { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
    };

    if (loading) {
        return (
            <div className="an-loading">
                <div className="an-spinner" />
                <p>Crunching the numbers...</p>
            </div>
        );
    }

    return (
        <div className="an-layout">

            {/* Header */}
            <header className="an-header">
                <div className="an-header-left">
                    <a href="/" className="an-back-link">← Back to Admin</a>
                    <h1 className="an-title">
                        <span className="an-title-accent">SmartDine</span> Analytics
                    </h1>
                    <p className="an-subtitle">All-time performance overview</p>
                </div>
                <div className="an-refresh-btn" onClick={() => window.location.reload()}>
                    ↺ Refresh
                </div>
            </header>

            {/* KPI Cards */}
            <div className="an-kpi-grid">
                <div className="an-kpi-card an-kpi-revenue">
                    <div className="an-kpi-icon">💰</div>
                    <div>
                        <div className="an-kpi-value">₹{totalRevenue.toLocaleString()}</div>
                        <div className="an-kpi-label">Total Revenue</div>
                    </div>
                </div>

                <div className="an-kpi-card an-kpi-orders">
                    <div className="an-kpi-icon">📦</div>
                    <div>
                        <div className="an-kpi-value">{orders.length}</div>
                        <div className="an-kpi-label">Total Orders</div>
                    </div>
                </div>

                <div className="an-kpi-card an-kpi-today">
                    <div className="an-kpi-icon">📅</div>
                    <div>
                        <div className="an-kpi-value">{ordersToday}</div>
                        <div className="an-kpi-label">Orders Today</div>
                    </div>
                </div>

                <div className="an-kpi-card an-kpi-paid">
                    <div className="an-kpi-icon">✅</div>
                    <div>
                        <div className="an-kpi-value">{paidOrders.length}</div>
                        <div className="an-kpi-label">Paid Orders</div>
                    </div>
                </div>
            </div>

            {/* Main content grid */}
            <div className="an-content-grid">

                {/* Top Items Chart */}
                <div className="an-card">
                    <div className="an-card-header">
                        <h2 className="an-card-title">🏆 Top Ordered Items</h2>
                        <span className="an-card-badge">Top 5</span>
                    </div>

                    {topItems.length === 0 ? (
                        <p className="an-empty">No orders yet — get those customers ordering!</p>
                    ) : (
                        <div className="an-chart">
                            {topItems.map(([name, count], i) => {
                                const pct = Math.round((count / maxCount) * 100);
                                const colors = ['#6C5CE7', '#F97316', '#10B981', '#3B82F6', '#F59E0B'];
                                return (
                                    <div key={name} className="an-bar-row">
                                        <div className="an-bar-rank">#{i + 1}</div>
                                        <div className="an-bar-name" title={name}>{name}</div>
                                        <div className="an-bar-track">
                                            <div
                                                className="an-bar-fill"
                                                style={{
                                                    width: `${pct}%`,
                                                    backgroundColor: colors[i],
                                                    animationDelay: `${i * 100}ms`,
                                                }}
                                            />
                                        </div>
                                        <div className="an-bar-count">{count}x</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Status Breakdown */}
                <div className="an-card">
                    <div className="an-card-header">
                        <h2 className="an-card-title">📊 Order Status Breakdown</h2>
                    </div>

                    <div className="an-status-grid">
                        {statusGroups.map(({ label, count }) => {
                            const color = statusColors[label];
                            return (
                                <div
                                    key={label}
                                    className="an-status-box"
                                    style={{ backgroundColor: color.bg }}
                                >
                                    <div className="an-status-dot" style={{ backgroundColor: color.dot }} />
                                    <div className="an-status-count" style={{ color: color.text }}>{count}</div>
                                    <div className="an-status-label" style={{ color: color.text }}>
                                        {label.charAt(0).toUpperCase() + label.slice(1)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Simple pie visualization — CSS only */}
                    <div className="an-pie-container">
                        {orders.length > 0 && statusGroups.filter(s => s.count > 0).map(({ label, count }, i, arr) => {
                            const color = statusColors[label];
                            return (
                                <div key={label} className="an-pie-legend-row">
                                    <span className="an-pie-dot" style={{ backgroundColor: color.dot }} />
                                    <span className="an-pie-name">{label.charAt(0).toUpperCase() + label.slice(1)}</span>
                                    <span className="an-pie-pct">
                                        {Math.round((count / orders.length) * 100)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Recent Orders Table */}
            <div className="an-card an-full-width">
                <div className="an-card-header">
                    <h2 className="an-card-title">🧾 Recent Orders</h2>
                    <span className="an-card-badge">{orders.length} Total</span>
                </div>

                <div className="an-table-wrap">
                    <table className="an-table">
                        <thead>
                            <tr>
                                <th>Table</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders
                                .slice()
                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                .slice(0, 15)
                                .map(order => {
                                    const sc = statusColors[order.status?.toLowerCase()] ?? statusColors.pending;
                                    return (
                                        <tr key={order._id}>
                                            <td className="an-td-bold">{order.tableNumber}</td>
                                            <td>
                                                {order.items.map((it, i) => (
                                                    <span key={i} className="an-item-chip">
                                                        {it.quantity}x {it.menuItem?.name ?? 'Item'}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                <span className="an-status-pill" style={{ backgroundColor: sc.bg, color: sc.text }}>
                                                    {order.status ?? 'pending'}
                                                </span>
                                            </td>
                                            <td className="an-td-time">
                                                {order.createdAt
                                                    ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
