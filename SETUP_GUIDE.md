# SmartDine — New Features Setup Guide

All **6 new files** have been created. Below are the **minimal one-line additions** you need to wire them up. These are your only manual steps.

---

## 1. 📊 Analytics Page → `src/App.jsx`

Add 2 lines (import + route):

```jsx
// Add this import at the top of App.jsx:
import Analytics from './pages/Analytics';

// Add this route inside <Routes>:
<Route path="/analytics" element={<Analytics />} />
```

Then visit: **http://localhost:5173/analytics**

---

## 2. 🔔 Kitchen Sound Alert → `src/pages/KitchenDashboard.jsx`

Add 2 lines:

```jsx
// Import at top:
import KitchenSoundAlert from '../components/KitchenSoundAlert';

// Place inside the JSX, right after <header ...>:
<KitchenSoundAlert apiUrl="http://192.168.1.4:3000" />
```

---

## 3. 🔴 Live Order Badge → `src/pages/KitchenDashboard.jsx`

Add 2 lines:

```jsx
// Import at top:
import LiveOrderBadge from '../components/LiveOrderBadge';

// Place inside <header>, next to the "⚡ SOCKET CONNECTED" div:
<LiveOrderBadge apiUrl="http://192.168.1.4:3000" />
```

---

## 4. ⚡ Analytics API → `smartdine-backend/server.js`

Add 1 line (anywhere after the other `app.use('/api/...')` lines):

```js
app.use('/api/analytics', require('./routes/analyticsRoutes'));
```

---

## 5. 📱 Order Status Timeline → `app/tracking.tsx`

Add 2 lines:

// Import at top:
import OrderStatusTimeline from '../components/OrderStatusTimeline';

// Replace (or add above) the current block:
<OrderStatusTimeline status={order.status} />

## 6. ✨ Splash Screen → `app/_layout.tsx` or root

```tsx
// Import:
import SplashScreen from '../components/SplashScreen';

// In your root component, wrap around children:
const [showSplash, setShowSplash] = useState(true);
if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
```
