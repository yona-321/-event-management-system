import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState('Technical');
  const [subEvents, setSubEvents] = useState([]);
  const [subInput, setSubInput] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name');

  useEffect(() => {
    if (!token || role === 'student') { navigate('/events'); return; }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('https://event-management-system-c0bz.onrender.com/api/events');
      setEvents(res.data);
    } catch (err) {
      setMessage('Failed to load events');
    }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await axios.get(
        `https://event-management-system-c0bz.onrender.com/api/registrations/event/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventRegistrations(prev => ({ ...prev, [eventId]: res.data }));
    } catch (err) {
      console.error('Failed to load registrations');
    }
  };

  const handleToggleEvent = (eventId) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(eventId);
      if (!eventRegistrations[eventId]) {
        fetchRegistrations(eventId);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const addSubEvent = () => {
    if (!subInput.trim()) return;
    setSubEvents([...subEvents, subInput.trim()]);
    setSubInput('');
  };

  const removeSubEvent = (index) => {
    setSubEvents(subEvents.filter((_, i) => i !== index));
  };

  const handleEdit = (event) => {
    setEditMode(true);
    setEditingEventId(event._id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date ? event.date.split('T')[0] : '');
    setTime(event.time || '');
    setLocation(event.location);
    setCapacity(event.capacity);
    setCategory(event.category || 'Technical');
    setSubEvents(event.subEvents || []);
    setImagePreview(event.image || '');
    setImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMessage('✏️ Editing event — make your changes and click Update Event.');
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingEventId(null);
    setTitle(''); setDescription(''); setDate(''); setTime('');
    setLocation(''); setCapacity(''); setSubEvents([]);
    setImage(null); setImagePreview('');
    setMessage('');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('location', location);
      formData.append('capacity', capacity);
      formData.append('category', category);
      formData.append('subEvents', JSON.stringify(subEvents));
      if (image) formData.append('image', image);

      if (editMode) {
        await axios.put(`https://event-management-system-c0bz.onrender.com/api/events/${editingEventId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setMessage('✅ Event updated successfully!');
        setEditMode(false);
        setEditingEventId(null);
      } else {
        await axios.post('https://event-management-system-c0bz.onrender.com/api/events', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setMessage('✅ Event created successfully!');
      }

      setTitle(''); setDescription(''); setDate(''); setTime('');
      setLocation(''); setCapacity(''); setSubEvents([]);
      setImage(null); setImagePreview('');
      fetchEvents();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`https://event-management-system-c0bz.onrender.com/api/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('🗑️ Event deleted successfully!');
      fetchEvents();
    } catch (err) {
      setMessage('Failed to delete event');
    }
  };

  const getSubEventRegistrations = (eventId, subEvent) => {
    const regs = eventRegistrations[eventId] || [];
    return regs.filter(r => r.subEvent === subEvent);
  };

  const getCategoryIcon = (cat) => {
    if (cat === 'Technical') return '💻';
    if (cat === 'Non-Technical') return '🎨';
    if (cat === 'Sports') return '⚽';
    if (cat === 'Cultural') return '🎵';
    return '🎯';
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${m} ${ampm}`;
  };

  return (
    <div className="dash-page">
      <div className="dash-nav">
        <h2 className="dash-logo">🎓 Organizer Dashboard</h2>
        <div className="dash-nav-right">
          <span className="dash-welcome">👤 Welcome, {userName}!</span>
          <button className="dash-view-btn" onClick={() => navigate('/events')}>View Events</button>
          <button className="dash-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </div>

      <div className="dash-content">
        {/* LEFT - Create/Edit Event */}
        <div className="dash-form-card">
          <h3 className="dash-card-title">{editMode ? '✏️ Edit Event' : '➕ Create New Event'}</h3>
          {message && <div className="dash-message">{message}</div>}
          <form onSubmit={handleCreateEvent}>
            <div className="img-upload-box" onClick={() => document.getElementById('imgInput').click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="img-preview" />
              ) : (
                <>
                  <span className="img-icon">🖼️</span>
                  <p>Click to upload event poster / banner</p>
                  <p className="img-hint">JPG, PNG supported</p>
                </>
              )}
            </div>
            <input id="imgInput" type="file" accept="image/*" style={{display:'none'}} onChange={handleImageChange} />

            <div className="dash-field">
              <label>EVENT TITLE</label>
              <input type="text" placeholder="e.g. Technical Fest 2026" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>

            <div className="dash-field">
              <label>CATEGORY</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option>Technical</option>
                <option>Non-Technical</option>
                <option>Sports</option>
                <option>Cultural</option>
              </select>
            </div>

            <div className="dash-field">
              <label>DESCRIPTION</label>
              <textarea placeholder="Describe your event..." value={description} onChange={e => setDescription(e.target.value)} required />
            </div>

            <div className="dash-row3">
              <div className="dash-field">
                <label>DATE</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label>TIME</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
              </div>
              <div className="dash-field">
                <label>CAPACITY</label>
                <input type="number" placeholder="e.g. 200" value={capacity} onChange={e => setCapacity(e.target.value)} required />
              </div>
            </div>

            <div className="dash-field">
              <label>LOCATION</label>
              <input type="text" placeholder="e.g. Main Auditorium" value={location} onChange={e => setLocation(e.target.value)} required />
            </div>

            <div className="sub-events-box">
              <label>SUB-EVENTS / COMPETITIONS</label>
              <div className="sub-tags">
                {subEvents.map((se, i) => (
                  <span key={i} className="sub-tag">
                    {se} <button type="button" onClick={() => removeSubEvent(i)}>×</button>
                  </span>
                ))}
              </div>
              <div className="sub-add">
                <input type="text" placeholder="e.g. Web App, Drawing, Quiz" value={subInput}
                  onChange={e => setSubInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSubEvent())} />
                <button type="button" onClick={addSubEvent}>+ Add</button>
              </div>
            </div>

            <button type="submit" className="dash-create-btn">
              {editMode ? '✅ Update Event' : '✅ Create Event'}
            </button>
            {editMode && (
              <button type="button" className="dash-cancel-btn" onClick={handleCancelEdit}>
                ❌ Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* RIGHT - All Events */}
        <div className="dash-events-card">
          <div className="dash-events-header">
            <h3 className="dash-card-title">📋 All Events</h3>
            <span className="dash-ev-count">{events.length} Events</span>
          </div>
          {events.length === 0 && <p className="dash-no-events">No events created yet.</p>}
          {events.map(event => (
            <div key={event._id} className="dash-ev-item">
              <div className="dash-ev-header" onClick={() => handleToggleEvent(event._id)}>
                <div className="dash-ev-left">
                  <h4>{getCategoryIcon(event.category)} {event.title}</h4>
                  <p>📅 {new Date(event.date).toDateString()} {event.time ? `⏰ ${formatTime(event.time)}` : ''} &nbsp; 📍 {event.location} &nbsp; 👥 {event.registeredCount}/{event.capacity}</p>
                  {event.subEvents && event.subEvents.length > 0 && (
                    <div className="dash-sub-tags-view">
                      {event.subEvents.map((se, i) => (
                        <span key={i} className="dash-sub-badge">{se}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dash-ev-right">
                  <span className={`dash-cat-badge ${event.category === 'Technical' ? 'badge-tech' : event.category === 'Sports' ? 'badge-sports' : event.category === 'Cultural' ? 'badge-cultural' : 'badge-ntech'}`}>
                    {event.category}
                  </span>
                  <button className="dash-edit-btn" onClick={e => { e.stopPropagation(); handleEdit(event); }}>✏️ Edit</button>
                  <button className="dash-del-btn" onClick={e => { e.stopPropagation(); handleDelete(event._id); }}>🗑️ Delete</button>
                  <span className="dash-arrow">{expandedEvent === event._id ? '▲' : '▼'}</span>
                </div>
              </div>

              <div className="dash-cap-bar">
                <div className="dash-cap-fill" style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }} />
              </div>

              {expandedEvent === event._id && (
                <div className="dash-registrations">
                  {event.subEvents && event.subEvents.length > 0 ? (
                    event.subEvents.map((se, i) => {
                      const regs = getSubEventRegistrations(event._id, se);
                      return (
                        <div key={i} className="dash-sub-section">
                          <div className="dash-sub-title">
                            <span>🏆 {se}</span>
                            <span>{regs.length} registered</span>
                          </div>
                          {regs.length === 0 ? (
                            <p className="dash-no-reg">No registrations yet</p>
                          ) : (
                            <div className="dash-student-table">
                              <div className="dash-student-row dash-student-header">
                                <span>Name</span><span>Department</span><span>Year</span><span>WhatsApp</span>
                              </div>
                              {regs.map((r, j) => (
                                <div key={j} className="dash-student-row dash-student-data">
                                  <span>{r.name}</span><span>{r.department}</span><span>{r.year}</span><span>{r.whatsapp}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="dash-sub-section">
                      <div className="dash-sub-title">
                        <span>👥 All Registrations</span>
                        <span>{(eventRegistrations[event._id] || []).length} registered</span>
                      </div>
                      {(eventRegistrations[event._id] || []).length === 0 ? (
                        <p className="dash-no-reg">No registrations yet</p>
                      ) : (
                        <div className="dash-student-table">
                          <div className="dash-student-row dash-student-header">
                            <span>Name</span><span>Department</span><span>Year</span><span>WhatsApp</span>
                          </div>
                          {(eventRegistrations[event._id] || []).map((r, j) => (
                            <div key={j} className="dash-student-row dash-student-data">
                              <span>{r.name}</span><span>{r.department}</span><span>{r.year}</span><span>{r.whatsapp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;