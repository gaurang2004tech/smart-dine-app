import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Home from './pages/Home';
import Reservations from './pages/Reservations';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/kitchen" element={<KitchenDashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reservations" element={<Reservations />} />
        {/* Redirect unknown routes back to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;