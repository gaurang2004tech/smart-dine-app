import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    const portalCards = [
        {
            title: 'Executive Suite',
            subtitle: 'Admin & Configuration',
            desc: 'The master control node for your restaurant. Manage the elite menu, secure QR protocols, and system-wide settings.',
            status: 'Secure Link Active',
            icon: (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
            ),
            path: '/login',
            color: '#A29BFE'
        },
        {
            title: 'Culinary Command',
            subtitle: 'Live Kitchen Ops',
            desc: 'Real-time orchestration of kitchen workflow. Monitor active tickets, service requests, and culinary timing.',
            status: 'Live Sync: Primary',
            icon: (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
            ),
            path: '/kitchen',
            color: '#55EFC4'
        },
        {
            title: 'Intelligence Engine',
            subtitle: 'Predictive Analytics',
            desc: 'Advanced data interpretation and revenue forecasting. Visualize trends and optimize your business trajectory.',
            status: 'Processing Data Stream',
            icon: (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            path: '/analytics',
            color: '#74B9FF'
        },
        {
            title: 'Supply Chain',
            subtitle: 'Inventory & Assets',
            desc: 'Real-time resource tracking and automated recipe deduction. Monitor ingredient levels and manage supplier relationships.',
            status: 'Monitoring Stock Levels',
            icon: (
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            ),
            path: '/inventory',
            color: '#FAB1A0'
        }
    ];

    return (
        <div className="home-portal">
            <div className="portal-grid-overlay"></div>
            <div className="portal-glow-orbs"></div>

            <header className="portal-header">
                <div className="portal-logo">
                    <div className="logo-icon">SD</div>
                    <h1>SmartDine<span>OS</span></h1>
                </div>
                <p className="portal-tagline">Executive Management & Operational Intelligence Hub</p>
            </header>

            <main className="portal-grid">
                {portalCards.map((card, index) => (
                    <div
                        key={index}
                        className="portal-card"
                        onClick={() => navigate(card.path)}
                        style={{ '--hover-color': card.color }}
                    >
                        <div className="card-status-badge">
                            <span className="pulse-dot"></span>
                            {card.status}
                        </div>

                        <div className="card-icon" style={{ color: card.color }}>
                            {card.icon}
                        </div>
                        <div className="card-titles">
                            <h3>{card.subtitle}</h3>
                            <h2>{card.title}</h2>
                        </div>
                        <p>{card.desc}</p>
                        <div className="card-action">
                            Initialize Command ➔
                        </div>
                    </div>
                ))}
            </main>

            <footer className="portal-footer">
                <p>&copy; 2026 SmartDine. All Systems Operational.</p>
            </footer>
        </div>
    );
};

export default Home;
