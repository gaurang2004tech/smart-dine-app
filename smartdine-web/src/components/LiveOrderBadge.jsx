/**
 * LiveOrderBadge.jsx
 * ------------------
 * An animated pulsing badge showing the current count of active (non-paid) orders.
 * Connects to Socket.IO to update in real-time.
 *
 * HOW TO USE:
 *   import LiveOrderBadge from '../components/LiveOrderBadge';
 *
 *   // Inside KitchenDashboard's <header> JSX:
 *   <LiveOrderBadge apiUrl="http://192.168.1.4:3000" />
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function LiveOrderBadge({ apiUrl }) {
    const [count, setCount] = useState(0);
    const [bump, setBump] = useState(false); // triggers scale animation on update
    const socketRef = useRef(null);

    const fetchActiveCount = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/orders`);
            const active = res.data.filter(
                o => o.status && o.status.toLowerCase() !== 'paid'
            ).length;
            setCount(active);
        } catch (err) {
            console.error('LiveOrderBadge: fetch failed', err);
        }
    };

    useEffect(() => {
        fetchActiveCount();

        const socket = io(apiUrl);
        socketRef.current = socket;

        const onUpdate = () => {
            fetchActiveCount();
            // Bump animation
            setBump(true);
            setTimeout(() => setBump(false), 500);
        };

        socket.on('newOrder', onUpdate);
        socket.on('orderUpdated', onUpdate);

        return () => socket.disconnect();
    }, [apiUrl]);

    if (count === 0) return null;

    return (
        <div style={{ ...wrapStyle, transform: bump ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {/* Outer pulse ring */}
            <div style={pulseRingStyle} />
            {/* Badge body */}
            <div style={badgeStyle}>
                <span style={dotStyle} />
                <span style={countStyle}>{count}</span>
                <span style={labelStyle}>Active</span>
            </div>
        </div>
    );
}

const wrapStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
};

const pulseRingStyle = {
    position: 'absolute',
    inset: -4,
    borderRadius: 20,
    background: 'rgba(249, 115, 22, 0.25)',
    animation: 'lob-pulse 1.6s ease-out infinite',
};

const badgeStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '0 4px 14px rgba(249,115,22,0.45)',
    position: 'relative',
    zIndex: 1,
};

const dotStyle = {
    display: 'block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#fff',
    animation: 'lob-blink 1s step-start infinite',
};

const countStyle = {
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1,
};

const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    opacity: 0.85,
    textTransform: 'uppercase',
};

// Inject keyframes into document (once)
if (typeof document !== 'undefined') {
    const styleId = 'lob-keyframes';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
      @keyframes lob-pulse {
        0%   { transform: scale(1);   opacity: 0.7; }
        70%  { transform: scale(1.5); opacity: 0;   }
        100% { transform: scale(1.5); opacity: 0;   }
      }
      @keyframes lob-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }
}
