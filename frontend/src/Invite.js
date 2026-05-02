import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'https://your-backend.onrender.com';

function Invite() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get('id');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleAccept = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API + '/api/auth/register', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setMessage('Invite accepted! Redirecting...');
      setTimeout(() => window.location.href = '/dashboard', 1500);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || 'Failed'));
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <div className="card">
          <h1 style={{ color: '#7c3aed', marginBottom: '20px' }}>Accept Invitation</h1>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>You've been invited to join a Grim AC Dashboard</p>
          <form onSubmit={handleAccept}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn" style={{ width: '100%' }}>Accept & Register</button>
          </form>
          {message && <div style={{ marginTop: '15px', color: message.includes('Error') ? '#ef4444' : '#10b981' }}>{message}</div>}
        </div>
      </div>
    </div>
  );
}

export default Invite;
