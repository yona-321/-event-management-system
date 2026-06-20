import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import './Login.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(`https://event-management-system-c0bz.onrender.com/api/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="auth-wrapper">
      <div className="auth-brand">
        <h1>Event Management System</h1>
        <p>Verifying your account...</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          {status === 'loading' && <h2>Verifying your email...</h2>}

          {status === 'success' && (
            <>
              <div className="auth-success">{message}</div>
              <p className="auth-link"><Link to="/login">Go to Login</Link></p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="auth-error">{message}</div>
              <p className="auth-link"><Link to="/register">Back to Register</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;