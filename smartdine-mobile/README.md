# 📱 SmartDine Mobile Application

The **SmartDine Mobile App** is a high-performance customer interface built with **Expo** and **React Native**. It allows customers to browse the menu, place orders via table QR codes, and engage with the restaurant's loyalty program.

---

## ✨ Core Features

### 🔍 QR Table Discovery
- Uses `expo-camera` to instantly scan table-specific QR codes.
- Automates session management by linking orders to the correct physical table.

### 🍱 Interactive Gourmet Menu
- **Luxe UI**: High-fidelity menu presentation with smooth animations and haptic feedback.
- **Detailed Modals**: Full-screen item details with dietary indicators (Veg/Non-Veg/Spicy).
- **Smart Filtering**: Filter by category or dietary type (Veg only toggle).

### 🏆 Loyalty & Membership
- **Black Card System**: Track points and loyalty levels in real-time.
- **Gift Claims**: Celebratory confetti animations when claiming rewards.

### 🛵 Live Order Tracking
- Real-time status updates (Pending → Preparing → Ready → Served) via **Socket.IO**.
- Visual timeline for order progress.

---

## 🛠️ Project Structure

```text
smartdine-mobile/
├── app/               # Expo Router pages (index, menu, reservations, tracking)
├── components/        # Reusable UI components (Confetti, Modals, Timeline)
├── assets/            # Fonts, images, and brand assets
├── hooks/             # Custom React hooks
└── constants/         # Theme colors and configuration
```

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Update the `API_URL` in `app/menu.tsx` and other screens to point to your live backend.

### 3. Launch Development Server
```bash
npx expo start
```

### 4. Open on Physical Device
1.  Install **Expo Go** from the App Store or Play Store.
2.  Scan the QR code displayed in your terminal using your phone's camera.

---

## 🔌 Hardware Integrations
- **Camera**: For QR code table scanning.
- **Haptics**: Subtle vibrations for cart actions (`expo-haptics`).
- **Sound**: Notification alerts for service updates.

---

© 2026 SmartDine. All Systems Operational.
