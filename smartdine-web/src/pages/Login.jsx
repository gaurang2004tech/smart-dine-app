import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // ⚠️ Replace with your Laptop's IP
      const res = await axios.post('https://smartdine-backend-ao8c.onrender.com/api/auth/login', {
        username,
        password
      });

      // 1. Save the VIP Pass (Token) to the browser's memory
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      // 2. Setup Axios to automatically use this token for all future requests!
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

      // 3. Send them to the right dashboard
      if (res.data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/kitchen');
      }

    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">🍽️</span>
          <h1>SmartDine OS</h1>
          <p>Sign in to your workspace</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}