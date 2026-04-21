# 🍽️ SmartDine OS

**SmartDine OS** is a premium, full-stack restaurant management and automated ordering ecosystem. It bridges the gap between digital convenience and gourmet excellence through a real-time backend, an executive web portal, and a high-fidelity mobile experience.

---

## 🚀 System Architecture

SmartDine is built as a three-tier system:
1.  **Backend (API)**: A robust Node.js & Express server with Socket.io for live updates and MongoDB for data persistence.
2.  **Web Portal (Admin & Kitchen)**: A professional React + Vite dashboard for restaurant owners and kitchen staff.
3.  **Mobile App (Customer)**: A sleek Expo/React Native application for customers to scan QRs, order, and track their food.

---

## ✨ Key Features

### 🏢 Executive Dashboard (Web)
- **Live Inventory Control**: Instantly mark items as "Out of Stock" or restock them.
- **QR Engine**: Generate unique, scannable QR codes for every table in the restaurant.
- **AI Consultant**: Get automated business tips and revenue insights based on real order data.
- **Kitchen Command Center**: Real-time ticket management with live status updates.

### 📱 Customer Excellence (Mobile)
- **QR-First Ordering**: Seamless table identification via ultra-fast scanning.
- **Loyalty & Rewards**: Integrated point system (Black Card Member levels) and gourmet gift claims.
- **Live Tracking**: Real-time order progress from "Pending" to "Served".
- **Waiter Summon**: A digital service bell that notifies staff instantly.

### 🤖 Intelligent Backend
- **Real-time Synchronization**: Socket.io ensures that the kitchen and customers are always in sync.
- **Automated Rewards**: Sophisticated algorithm for awarding points based on spending.
- **Secure Authentication**: JWT-protected admin routes.

---

## 🛠️ Tech Stack

- **Frontend**: React (Web), Expo / React Native (Mobile)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Real-time**: Socket.io
- **AI**: OpenAI GPT-3.5 API
- **Styling**: Vanilla CSS (Tailored Luxe UI)

---

## 🚦 Getting Started

### 1. Backend Setup
```bash
cd smartdine-backend
npm install
# Create .env with MONGO_URI and OPENAI_API_KEY
npm start
```

### 2. Web Portal Setup
```bash
cd smartdine-web
npm install
npm run dev
```

### 3. Mobile App Setup
```bash
cd smartdine-mobile
npm install
npx expo start
```

---

## ☁️ Deployment

The project is optimized for cloud deployment:
- **Backend**: Recommended for [Render.com](https://render.com) or Railway.
- **Web**: Can be hosted on Vercel, Netlify, or Render.
- **Mobile**: Deployable via the Expo EAS build system.

---

## 📄 License
This project is licensed under the ISC License.

© 2026 SmartDine. All Systems Operational.
