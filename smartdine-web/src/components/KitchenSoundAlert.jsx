/**
* KitchenSoundAlert.jsx
* ---------------------
* A drop-in component that plays a "ding" sound AND shows a toast
* notification when a new order arrives via Socket.IO.
*
* HOW TO USE:
*   import KitchenSoundAlert from '../components/KitchenSoundAlert';
*
*   // Add inside KitchenDashboard's JSX (before or after <header>):
*   <KitchenSoundAlert apiUrl="https://smartdine-backend-ao8c.onrender.com" />
*
* No sound files or extra libraries needed — uses Web Audio API.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// ── Tone generator using Web Audio API ─────────────────────────────────────
function playDing(context) {
    const frequencies = [880, 1109.73, 1318.51]; // A5, C#6, E6 chord
    frequencies.forEach((freq, i) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;

        const startTime = context.currentTime + i * 0.06;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.9);
    });
}

// ── Toast item component ────────────────────────────────────────────────────
function Toast({ id, tableNumber, onDismiss }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss(id), 400);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                ...toastStyle,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(110%)',
                transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
        >
            <div style={toastIconStyle}>🔔</div>
            <div>
                <div style={toastTitleStyle}>New Order!</div>
                <div style={toastSubStyle}>{tableNumber || 'A table'} just placed a new order</div>
            </div>
            <button
                style={toastCloseStyle}
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onDismiss(id), 400);
                }}
            >
                ×
            </button>
        </div>
    );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function KitchenSoundAlert({ apiUrl }) {
    const [toasts, setToasts] = useState([]);
    const [muted, setMuted] = useState(false);
    const [enabled, setEnabled] = useState(false); // user must click once to unlock audio
    const audioCtxRef = useRef(null);
    const socketRef = useRef(null);

    // Unlock Audio Context (browsers require a user gesture first)
    const unlockAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        setEnabled(true);
    }, []);

    const addToast = useCallback((order) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, tableNumber: order?.tableNumber }]);

        if (!muted && audioCtxRef.current) {
            playDing(audioCtxRef.current);
        }
    }, [muted]);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Connect socket
    useEffect(() => {
        if (!apiUrl) return;
        const socket = io(apiUrl);
        socketRef.current = socket;

        socket.on('newOrder', (order) => {
            addToast(order);
        });

        return () => socket.disconnect();
    }, [apiUrl, addToast]);

    return (
        <>
            {/* Enable alerts banner (shows before user clicks) */}
            {!enabled && (
                <div style={bannerStyle}>
                    <span style={{ fontSize: 16 }}>🔔</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                        Click to enable sound alerts for new orders
                    </span>
                    <button style={enableBtnStyle} onClick={unlockAudio}>
                        Enable Alerts
                    </button>
                </div>
            )}

            {/* Mute toggle (after enabled) */}
            {enabled && (
                <button
                    style={{ ...muteBtnStyle, opacity: muted ? 0.6 : 1 }}
                    onClick={() => setMuted(m => !m)}
                    title={muted ? 'Unmute alerts' : 'Mute alerts'}
                >
                    {muted ? '🔇 Muted' : '🔊 Sound On'}
                </button>
            )}

            {/* Toast stack */}
            <div style={toastStackStyle}>
                {toasts.map(t => (
                    <Toast
                        key={t.id}
                        id={t.id}
                        tableNumber={t.tableNumber}
                        onDismiss={dismissToast}
                    />
                ))}
            </div>
        </>
    );
}

// ── Inline styles ───────────────────────────────────────────────────────────
const bannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E1B38',
    borderBottom: '1px solid #6C5CE7',
    padding: '12px 24px',
    color: '#A0AEC0',
};

const enableBtnStyle = {
    backgroundColor: '#6C5CE7',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
};

const muteBtnStyle = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    backgroundColor: '#1E1B38',
    color: '#A0AEC0',
    border: '1px solid #4A4580',
    padding: '10px 18px',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    zIndex: 9998,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    transition: 'opacity 0.2s',
};

const toastStackStyle = {
    position: 'fixed',
    top: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 9999,
    maxWidth: 340,
};

const toastStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1E1B38',
    border: '1px solid #6C5CE7',
    borderLeft: '4px solid #6C5CE7',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
    color: '#E2E8F0',
    minWidth: 280,
    position: 'relative',
};

const toastIconStyle = {
    fontSize: 26,
    flexShrink: 0,
};

const toastTitleStyle = {
    fontWeight: 800,
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
};

const toastSubStyle = {
    fontSize: 13,
    color: '#A0AEC0',
};

const toastCloseStyle = {
    background: 'none',
    border: 'none',
    color: '#718096',
    fontSize: 20,
    cursor: 'pointer',
    padding: '0 4px',
    marginLeft: 'auto',
    lineHeight: 1,
    flexShrink: 0,
};
