import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'https://grim-backend.onrender.com';

function Dashboard() {
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [grimUrl, setGrimUrl] = useState('');
  const [grimKey, setGrimKey] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { navigate('/login'); return; }
    if (userData) setUser(JSON.parse(userData));
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const res = await axios.get(API + '/api/recordings', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setRecordings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch recordings:', err.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post(API + '/api/invite', { email: inviteEmail }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setMessage('Invite sent to ' + inviteEmail);
      setInviteEmail('');
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || 'Failed to send invite'));
    }
  };

  const handleLinkGrim = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post(API + '/api/link-grim', { serverUrl: grimUrl, apiKey: grimKey }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      setMessage('Grim AC linked successfully!');
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || 'Failed to link'));
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const renderReplay = (recording) => {
    if (!recording || !recording.recording_data || !Array.isArray(recording.recording_data)) {
      return <p>No replay data available</p>;
    }
    const data = recording.recording_data;
    return (
      <div className="replay-container">
        <div style={{ padding: '20px' }}>
          <h3>{recording.player_name} - {recording.check_name}</h3>
          <p>Time: {new Date(recording.timestamp).toLocaleString()}</p>
          <p>Duration: {recording.duration}s | Data Points: {data.length}</p>
          <div style={{ marginTop: '20px', height: '250px', overflowY: 'auto', background: '#1a1f2e', padding: '10px', borderRadius: '6px' }}>
            {data.map((p, i) => (
              <div key={i} style={{ fontSize: '12px', marginBottom: '5px', color: '#94a3b8' }}>
                {i}s: ({Number(p.x).toFixed(2)}, {Number(p.y).toFixed(2)}, {Number(p.z).toFixed(2)}) Yaw: {Number(p.yw).toFixed(1)} Pitch: {Number(p.pt).toFixed(1)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Grim AC Dashboard</h1>
        <div className="nav">
          <span style={{ color: '#94a3b8' }}>{user?.email}</span>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {message && (
        <div className={message.includes('Error') ? 'error' : 'success'} style={{ marginTop: '10px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <div className="card">
            <h2>Flag Recordings</h2>
            <div className="recording-list">
              {recordings.length === 0 ? (
                <p style={{ color: '#64748b' }}>No recordings yet. Player flags will appear here when detected by Grim AC.</p>
              ) : (
                recordings.map(r => (
                  <div key={r.id} className="recording-item" onClick={() => setSelectedRecording(r)} style={{ cursor: 'pointer' }}>
                    <div>
                      <strong>{r.player_name}</strong> flagged <span style={{ color: '#7c3aed' }}>{r.check_name}</span>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                    <button className="btn" onClick={e => { e.stopPropagation(); setSelectedRecording(r); }}>View</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedRecording && (
            <div className="card" style={{ marginTop: '20px' }}>
              <h2>Replay Viewer</h2>
              {renderReplay(selectedRecording)}
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h3>Invite Friend</h3>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label>Friend's Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="friend@example.com" required />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }}>Send Invite</button>
            </form>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h3>Link Grim AC</h3>
            <form onSubmit={handleLinkGrim}>
              <div className="form-group">
                <label>Backend URL</label>
                <input type="text" value={grimUrl} onChange={e => setGrimUrl(e.target.value)} placeholder="https://your-backend.onrender.com" />
              </div>
              <div className="form-group">
                <label>API Key (Optional)</label>
                <input type="text" value={grimKey} onChange={e => setGrimKey(e.target.value)} placeholder="API Key" />
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }}>Link Server</button>
            </form>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
              Add to plugin config.yml: backend-url: {grimUrl || 'YOUR_BACKEND_URL'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
