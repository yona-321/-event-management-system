import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Events.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('events');
  const [showPopup, setShowPopup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [subEvent, setSubEvent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateEvents, setDateEvents] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('name');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
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

  const openPopup = (event) => {
    setSelectedEvent(event);
    setShowPopup(true);
    setMessage('');
    setName('');
    setDepartment('');
    setYear('');
    setWhatsapp('');
    setSubEvent('');
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedEvent(null);
  };

  // Builds a safe image URL whether `image` is a full Cloudinary URL
  // (new uploads) or an old relative /uploads/... path (legacy events)
  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    return `https://event-management-system-c0bz.onrender.com${image}`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('⏳ Submitting... the server may take up to a minute to wake up.');
    try {
      await axios.post(
        `https://event-management-system-c0bz.onrender.com/api/registrations/${selectedEvent._id}`,
        { name, department, year, whatsapp, subEvent },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 }
      );
      setMessage('✅ Registered successfully! Check your email for confirmation.');
      closePopup();
      fetchEvents();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const techEvents = events.filter(e =>
    ['hackathon','coding','web','tech','workshop','seminar','quiz'].some(k =>
      e.title.toLowerCase().includes(k) || e.description.toLowerCase().includes(k)
    )
  );
  const otherEvents = events.filter(e => !techEvents.includes(e));

  const getBannerColor = (index) => {
    const colors = ['#1a237e','#4a148c','#004d40','#bf360c','#1b5e20','#880e4f'];
    return colors[index % colors.length];
  };

  const getCategoryIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('hack')) return '💻';
    if (t.includes('web')) return '🌐';
    if (t.includes('draw') || t.includes('paint') || t.includes('art')) return '🎨';
    if (t.includes('sport') || t.includes('game')) return '⚽';
    if (t.includes('music') || t.includes('dance')) return '🎵';
    if (t.includes('quiz')) return '🧠';
    if (t.includes('seminar')) return '🎤';
    return '🎯';
  };

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const today = new Date();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const getEventsForDate = (day) => {
    return events.filter(ev => {
      const evDate = new Date(ev.date);
      return evDate.getDate() === day &&
        evDate.getMonth() === currentMonth &&
        evDate.getFullYear() === currentYear;
    });
  };

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setDateEvents(getEventsForDate(day));
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDate(null); setDateEvents([]);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDate(null); setDateEvents([]);
  };

  const isToday = (day) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const isPast = (day) =>
    new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const EventCard = ({ event, index }) => (
    <div className="ev-card">
      <div className="ev-card-banner" style={{ background: getBannerColor(index), position:'relative' }}>
        {event.image ? (
         <img src={getImageUrl(event.image)} alt={event.title} style={{width:'100%', height:'100%', objectFit:'cover', position:'absolute', top:0, left:0}} />
        ) : (
          <div className="ev-card-emoji">{getCategoryIcon(event.title)}</div>
        )}
        <div className="ev-card-seats">
          {event.capacity - event.registeredCount > 0
            ? `${event.capacity - event.registeredCount} seats left`
            : 'FULL'}
        </div>
      </div>
      <div className="ev-card-body">
        <h3 className="ev-card-title">{event.title}</h3>
        <p className="ev-card-desc">{event.description}</p>
        <div className="ev-card-meta">
         <span>📅 {new Date(event.date).toDateString()}{event.time ? ` ⏰ ${formatTime(event.time)}` : ''}</span>
          <span>📍 {event.location}</span>
        </div>
        <div className="ev-cap-wrap">
          <div className="ev-cap-bar">
            <div className="ev-cap-fill"
              style={{ width: `${Math.min((event.registeredCount / event.capacity) * 100, 100)}%` }}
            />
          </div>
          <span className="ev-cap-text">{event.registeredCount} / {event.capacity} registered</span>
        </div>
        {role === 'student' && (
          <button
            className="ev-reg-btn"
            onClick={() => openPopup(event)}
            disabled={event.registeredCount >= event.capacity}
          >
            {event.registeredCount >= event.capacity ? '❌ Event Full' : '✅ Register Now'}
          </button>
        )}
      </div>
    </div>
  );

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
};

  return (
    <div className="ev-page">
      {/* Navbar */}
      <div className="ev-nav">
        <h2 className="ev-logo">🎓 Event Management System</h2>
        <div className="ev-nav-right">
          <span className="ev-welcome">Welcome, {userName}!</span>
          {(role === 'organizer' || role === 'admin') && (
            <button className="ev-dash-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          )}
          <button className="ev-logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </div>

      {/* Hero */}
      <div className="ev-hero">
        <h1>🏆 College Events 2026</h1>
        <p>Register for exciting events happening at your college</p>
      </div>

      {/* Tabs */}
      <div className="ev-tabs">
        <button className={`ev-tab ${activeTab === 'events' ? 'ev-tab-active' : ''}`} onClick={() => setActiveTab('events')}>📋 Events</button>
        <button className={`ev-tab ${activeTab === 'calendar' ? 'ev-tab-active' : ''}`} onClick={() => setActiveTab('calendar')}>🗓️ Calendar</button>
      </div>

      {message && <div className="ev-message">{message}</div>}

      <div className="ev-content">
        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
            {events.length === 0 ? (
              <div className="ev-empty">No events available yet.</div>
            ) : (
              <>
                {techEvents.length > 0 && (
                  <div className="ev-section">
                    <div className="ev-section-title tech-title">⚡ TECHNICAL EVENTS</div>
                    <div className="ev-grid">
                      {techEvents.map((event, i) => <EventCard key={event._id} event={event} index={i} />)}
                    </div>
                  </div>
                )}
                {otherEvents.length > 0 && (
                  <div className="ev-section">
                    <div className="ev-section-title other-title">🎨 NON-TECHNICAL EVENTS</div>
                    <div className="ev-grid">
                      {otherEvents.map((event, i) => <EventCard key={event._id} event={event} index={i + 3} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="cal-section">
            <div className="cal-card">
              <div className="cal-header">
                <span className="cal-month">{monthNames[currentMonth]} {currentYear}</span>
                <div className="cal-nav-btns">
                  <button onClick={prevMonth}>◀️ Prev</button>
                  <button onClick={nextMonth}>Next ▶️</button>
                </div>
              </div>
              <div className="cal-grid">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="cal-day-name">{d}</div>
                ))}
                {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                {Array(daysInMonth).fill(null).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const hasEvents = dayEvents.length > 0;
                  const past = isPast(day);
                  const todayDay = isToday(day);
                  return (
                    <div
                      key={day}
                      className={`cal-day ${todayDay ? 'cal-today' : ''} ${selectedDate === day ? 'cal-selected' : ''} ${past ? 'cal-past-day' : ''}`}
                      onClick={() => hasEvents && handleDateClick(day)}
                      style={{ cursor: hasEvents ? 'pointer' : 'default' }}
                    >
                      <div className="cal-day-num">{day}</div>
                      {hasEvents && (
                        <div className={`cal-dot ${past ? 'dot-past' : 'dot-upcoming'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="cal-legend">
                <div className="leg-item"><div className="leg-dot" style={{background:'#bbb'}}></div> Past Event</div>
                <div className="leg-item"><div className="leg-dot" style={{background:'#1a73e8'}}></div> Upcoming</div>
                <div className="leg-item"><div className="leg-dot" style={{background:'#e53935'}}></div> Today</div>
              </div>
            </div>

            <div className="cal-detail">
              <h3>{selectedDate
                ? `📅 ${monthNames[currentMonth]} ${selectedDate}, ${currentYear}`
                : '📅 Click a highlighted date to see events'}</h3>
              {dateEvents.length === 0 && selectedDate && <p className="no-ev-text">No events on this date.</p>}
              {dateEvents.map(ev => {
                const past = new Date(ev.date) < today;
                return (
                  <div key={ev._id} className={`cal-ev-item ${past ? 'ev-past' : 'ev-upcoming'}`}>
                    <div className="cal-ev-emoji">{getCategoryIcon(ev.title)}</div>
                    <div className="cal-ev-info">
                      <h4>{ev.title}</h4>
                      <p>📍 {ev.location} &nbsp;|&nbsp; 👥 {ev.registeredCount}/{ev.capacity}</p>
                      <span className={`ev-badge ${past ? 'badge-past' : 'badge-upcoming'}`}>
                        {past ? '⚫ Completed' : '🔵 Upcoming'}
                      </span>
                    </div>
                    {!past && role === 'student' && (
  <button
    className="cal-reg-btn"
    onClick={() => openPopup(ev)}
    disabled={ev.registeredCount >= ev.capacity}
  >
    {ev.registeredCount >= ev.capacity ? '❌ Full' : 'Register'}
  </button>
)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Registration Popup - Google Form Style */}
      {showPopup && (
       <div className="popup-overlay" onClick={(e) => { if(e.target.className === 'popup-overlay') closePopup(); }}>
         <div className="popup-box">
           <div style={{position:'sticky', top:0, zIndex:10, textAlign:'right', padding:'10px 14px', background:'#1a73e8'}}>
             <button onClick={closePopup} style={{background:'white', color:'#1a73e8', border:'none', borderRadius:'50%', width:'34px', height:'34px', fontSize:'18px', fontWeight:'700', cursor:'pointer'}}>✕</button>
              </div>
            <div className="popup-header">
              <h2>📝 Event Registration</h2>
              <p>Fill in your details to register for this event</p>
            </div>
            <div className="popup-event-banner">
              <p className="popup-event-name">{selectedEvent?.title}</p>
              <p className="popup-event-meta">📅 {selectedEvent ? new Date(selectedEvent.date).toDateString() : ''} &nbsp; 📍 {selectedEvent?.location}</p>
            </div>
            <form onSubmit={handleRegister}>
              {selectedEvent?.subEvents?.length > 0 && (
                <div className="gform-field">
                  <label>Which competition are you joining? <span className="required">*</span></label>
                  <select value={subEvent} onChange={(e) => setSubEvent(e.target.value)} required>
                    <option value="">Select sub-event</option>
                    {selectedEvent.subEvents.map((se, i) => (
                      <option key={i} value={se}>{se}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="gform-field">
                <label>Full Name <span className="required">*</span></label>
                <input type="text" placeholder="Your answer" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="gform-field">
                <label>Department <span className="required">*</span></label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                  <option value="">Select your department</option>
                  <option>BSc Computer Science</option>
                  <option>BSc Information Technology</option>
                  <option>BSc Electronics</option>
                  <option>BCA</option>
                  <option>BCom</option>
                  <option>BA English</option>
                  <option>BSc Mathematics</option>
                  <option>BSc Physics</option>
                  <option>BSc Chemistry</option>
                  <option>MBA</option>
                  <option>MCA</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="gform-field">
                <label>Year of Study <span className="required">*</span></label>
                <select value={year} onChange={(e) => setYear(e.target.value)} required>
                  <option value="">Select your year</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </div>
              <div className="gform-field">
                <label>WhatsApp Number <span className="required">*</span></label>
                <input type="tel" placeholder="Your answer" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required />
              </div>
              <button type="submit" className="popup-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? '⏳ Submitting...' : '✅ Submit Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;