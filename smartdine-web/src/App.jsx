import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import Login from './pages/Login'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* 👇 2. Add the route right here! */}
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/kitchen" element={<KitchenDashboard />} />
        
        {/* Optional: Redirect the root URL to the login page automatically */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;