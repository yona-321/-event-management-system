import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Analytics.css';

const API = 'https://event-management-system-c0bz.onrender.com';

function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name');

  useEffect(() => {
    if (!token || role === 'student') { navigate('/events'); return; }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    Technical: '#1a73e8',
    'Non-Technical': '#e91e63',
    Sports: '#4caf50',
    Cultural: '#ff9800',
    Other: '#9c27b0'
  };

  return (
    <div className="analytics-page">
      {/* Navbar */}
      <div className="analytics-nav">
        <h2 className="analytics-logo">🎓 Event Management System</h2>
        <div className="analytics-nav-right">
          <span>👤 {userName}</span>
          <button onClick={() => navigate('/dashboard')}>📋 Dashboard</button>
          <button onClick={() => navigate('/events')}>🎯 Events</button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </div>

      <div className="analytics-content">
        <h2 className="analytics-title">📊 Admin Analytics</h2>

        {loading && <div className="analytics-loading">Loading stats...</div>}
        {error && <div className="analytics-error">{error}</div>}

        {stats && (
          <>
            {/* Top stat cards */}
            <div className="stat-cards">
              <div className="stat-card blue">
                <div className="stat-icon">🎯</div>
                <div className="stat-value">{stats.totalEvents}</div>
                <div className="stat-label">Total Events</div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon">👥</div>
                <div className="stat-value">{stats.totalRegistrations}</div>
                <div className="stat-label">Total Registrations</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-icon">📈</div>
                <div className="stat-value">{stats.fillRate}%</div>
                <div className="stat-label">Overall Fill Rate</div>
              </div>
              <div className="stat-card red">
                <div className="stat-icon">🔴</div>
                <div className="stat-value">{stats.fullyBooked}</div>
                <div className="stat-label">Fully Booked Events</div>
              </div>
            </div>

            {/* Most Popular Event */}
            {stats.mostPopular && (
              <div className="analytics-card">
                <h3>🏆 Most Popular Event</h3>
                <div className="popular-event">
                  <div className="popular-title">{stats.mostPopular.title}</div>
                  <div className="popular-meta">
                    {stats.mostPopular.registeredCount} / {stats.mostPopular.capacity} registered
                  </div>
                  <div className="popular-bar">
                    <div
                      className="popular-fill"
                      style={{ width: `${Math.min((stats.mostPopular.registeredCount / stats.mostPopular.capacity) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="popular-pct">
                    {((stats.mostPopular.registeredCount / stats.mostPopular.capacity) * 100).toFixed(1)}% full
                  </div>
                </div>
              </div>
            )}

            {/* By Category */}
            <div className="analytics-card">
              <h3>📂 Events by Category</h3>
              <div className="category-list">
                {Object.entries(stats.byCategory).map(([cat, data]) => (
                  <div key={cat} className="category-row">
                    <div className="category-name">
                      <span className="cat-dot" style={{ background: categoryColors[cat] || '#666' }} />
                      {cat}
                    </div>
                    <div className="category-bar-wrap">
                      <div className="category-bar">
                        <div
                          className="category-fill"
                          style={{
                            width: `${(data.count / stats.totalEvents) * 100}%`,
                            background: categoryColors[cat] || '#666'
                          }}
                        />
                      </div>
                    </div>
                    <div className="category-stats">{data.count} events · {data.registrations} registrations</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Events Table */}
            <div className="analytics-card">
              <h3>🕐 Recent Events</h3>
              <div className="recent-table">
                <div className="recent-header">
                  <span>Event</span>
                  <span>Category</span>
                  <span>Date</span>
                  <span>Fill Rate</span>
                  <span>Registered</span>
                </div>
                {stats.recentEvents.map((ev, i) => (
                  <div key={i} className="recent-row">
                    <span>{ev.title}</span>
                    <span>
                      <span className="cat-badge" style={{ background: categoryColors[ev.category] || '#666' }}>
                        {ev.category}
                      </span>
                    </span>
                    <span>{new Date(ev.date).toDateString()}</span>
                    <span>
                      <div className="mini-bar">
                        <div
                          className="mini-fill"
                          style={{ width: `${Math.min((ev.registeredCount / ev.capacity) * 100, 100)}%` }}
                        />
                      </div>
                      {((ev.registeredCount / ev.capacity) * 100).toFixed(0)}%
                    </span>
                    <span>{ev.registeredCount}/{ev.capacity}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;