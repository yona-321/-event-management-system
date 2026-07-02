import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API = 'https://event-management-system-c0bz.onrender.com';

function Dashboard() {
  const [activeView, setActiveView] = useState('events'); // 'events' | 'create'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
      const res = await axios.get(`${API}/api/events`);
      setEvents(res.data);
    } catch (err) {
      setMessage('Failed to load events');
    }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await axios.get(`${API}/api/registrations/event/${eventId}`,
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
      if (!eventRegistrations[eventId]) fetchRegistrations(eventId);
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

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display}:${m} ${ampm}`;
  };

  const timeToParts = (t) => {
    if (!t) return { hour: '12', minute: '00', ampm: 'AM' };
    const [h, m] = t.split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return { hour: String(hour).padStart(2, '0'), minute: m, ampm };
  };

  const partsToTime = (hour, minute, ampm) => {
    let h = parseInt(hour);
    if (ampm === 'AM' && h === 12) h = 0;
    if (ampm === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  const renderTimePicker = (value, setValue) => {
    const { hour, minute, ampm } = timeToParts(value);
    return (
      <div className="time-picker-12hr">
        <select value={hour} onChange={e => setValue(partsToTime(e.target.value, minute, ampm))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <option key={h} value={String(h).padStart(2, '0')}>{h}</option>
          ))}
        </select>
        <select value={minute} onChange={e => setValue(partsToTime(hour, e.target.value, ampm))}>
          {Array.from({ length: 60 }, (_, i) => i).map(m => (
            <option key={m} value={String(m).padStart(2, '0')}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <select value={ampm} onChange={e => setValue(partsToTime(hour, minute, e.target.value))}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    );
  };

  const handleEdit = (event) => {
    setEditMode(true);
    setEditingEventId(event._id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date ? event.date.split('T')[0] : '');
    setStartTime(event.startTime || '');
    setEndTime(event.endTime || '');
    setLocation(event.location);
    setCapacity(event.capacity);
    setCategory(event.category || 'Technical');
    setSubEvents(event.subEvents || []);
    setImagePreview(event.image || '');
    setImage(null);
    setActiveView('create');
    setMessage('✏️ Editing event — make your changes and click Update Event.');
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingEventId(null);
    setTitle(''); setDescription(''); setDate('');
    setStartTime(''); setEndTime('');
    setLocation(''); setCapacity(''); setSubEvents([]);
    setImage(null); setImagePreview('');
    setMessage('');
    setActiveView('events');
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('date', date);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('location', location);
      formData.append('capacity', capacity);
      formData.append('category', category);
      formData.append('subEvents', JSON.stringify(subEvents));
      if (image) formData.append('image', image);

      if (editMode) {
        await axios.put(`${API}/api/events/${editingEventId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setMessage('✅ Event updated successfully!');
        setEditMode(false);
        setEditingEventId(null);
      } else {
        await axios.post(`${API}/api/events`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setMessage('✅ Event created successfully!');
      }

      setTitle(''); setDescription(''); setDate('');
      setStartTime(''); setEndTime('');
      setLocation(''); setCapacity(''); setSubEvents([]);
      setImage(null); setImagePreview('');
      fetchEvents();
      setActiveView('events');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await axios.delete(`${API}/api/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('🗑️ Event deleted successfully!');
      fetchEvents();
    } catch (err) {
      setMessage('Failed to delete event');
    }
  };

  const handleExportCSV = async (eventId, eventTitle) => {
    try {
      const res = await fetch(`${API}/api/registrations/event/${eventId}/export-csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_attendees.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('❌ Failed to export CSV. Try again.');
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

  return (
    <div className="dash-shell">
      {/* SIDEBAR */}
      <div className="dash-sidebar">
        <div className="sb-logo">🎓 Organizer</div>
        <div className="sb-welcome">👤 {userName}</div>

        <button
          className={`sb-item ${activeView === 'events' ? 'sb-active' : ''}`}
          onClick={() => setActiveView('events')}
        >
          📋 All Events
        </button>
        <button
          className={`sb-item ${activeView === 'create' ? 'sb-active' : ''}`}
          onClick={() => { if (!editMode) handleCancelEditFieldsOnly(); setActiveView('create'); }}
        >
          ➕ Create Event
        </button>
        <button className="sb-item" onClick={() => navigate('/events')}>
          🎫 View Events Page
        </button>
        <button className="sb-item" onClick={() => navigate('/analytics')}>
          📊 Analytics
        </button>

        <div className="sb-spacer" />
        <button className="sb-item sb-logout" onClick={() => { localStorage.clear(); navigate('/login'); }}>
          🚪 Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="dash-main">
        {message && <div className="dash-message">{message}</div>}

        {activeView === 'create' && (
          <div className="dash-form-card">
            <h3 className="dash-card-title">{editMode ? '✏️ Edit Event' : '➕ Create New Event'}</h3>
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

              <div className="dash-row2">
                <div className="dash-field">
                  <label>DATE</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="dash-field">
                  <label>CAPACITY</label>
                  <input type="number" placeholder="e.g. 200" value={capacity} onChange={e => setCapacity(e.target.value)} required />
                </div>
              </div>

              <div className="dash-row2">
                <div className="dash-field">
                  <label>START TIME</label>
                  {renderTimePicker(startTime, setStartTime)}
                </div>
                <div className="dash-field">
                  <label>END TIME</label>
                  {renderTimePicker(endTime, setEndTime)}
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
        )}

        {activeView === 'events' && (
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
                    <p>
                      📅 {new Date(event.date).toDateString()}
                      {event.startTime ? ` ⏰ ${formatTime(event.startTime)}${event.endTime ? ` - ${formatTime(event.endTime)}` : ''}` : ''}
                      &nbsp; 📍 {event.location} &nbsp; 👥 {event.registeredCount}/{event.capacity}
                    </p>
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
                    <button className="dash-export-btn" onClick={e => { e.stopPropagation(); handleExportCSV(event._id, event.title); }}>📥 Export</button>
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
        )}
      </div>
    </div>
  );

  function handleCancelEditFieldsOnly() {
    setTitle(''); setDescription(''); setDate('');
    setStartTime(''); setEndTime('');
    setLocation(''); setCapacity(''); setSubEvents([]);
    setImage(null); setImagePreview('');
  }
}

export default Dashboard;