import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';

const ProtectedDashboard = () => {
  const role = localStorage.getItem('role');
  if (role === 'organizer' || role === 'admin') return <Dashboard />;
  return <Navigate to="/events" />;
};

const ProtectedAnalytics = () => {
  const role = localStorage.getItem('role');
  if (role === 'organizer' || role === 'admin') return <Analytics />;
  return <Navigate to="/events" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="/analytics" element={<ProtectedAnalytics />} />
      </Routes>
    </Router>
  );
}

export default App;