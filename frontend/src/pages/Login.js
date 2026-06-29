import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API = 'https://event-management-system-c0bz.onrender.com/api/auth';

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API}/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('name', res.data.name);
      if (res.data.role === 'admin' || res.data.role === 'organizer') {
        navigate('/dashboard');
      } else {
        navigate('/events');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${API}/register`, { name, email, password });
      setSuccess(res.data.message || 'Registration successful! You can now log in.');
      setIsRegister(false);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🎓</span>
          <h1 className="login-title">Event Management System</h1>
          <p className="login-subtitle">
            {isRegister ? 'Create your account to get started.' : 'Welcome back! Log in to continue.'}
          </p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>

          {isRegister && (
            <div className="login-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="login-field">
            <label>Email address</label>
            <input
              type="email"
              placeholder="Enter your college email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="login-pw-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-show-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="login-toggle">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            className="login-toggle-btn"
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
          >
            {isRegister ? ' Login' : ' Register'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;