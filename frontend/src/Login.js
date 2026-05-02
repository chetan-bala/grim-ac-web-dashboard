import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'https://your-backend.onrender.com';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [serverName, setServerName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { email, password, serverName };
      const res = await axios.post(API + endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <div className="card">
          <h1 style={{ color: '#7c3aed', marginBottom: '20px' }}>Grim AC Dashboard</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Server Name</label>
                <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} placeholder="My Minecraft Server" />
              </div>
            )}
            <button type="submit" className="btn" style={{ width: '100%' }}>{isLogin ? 'Login' : 'Register'}</button>
          </form>
          {error && <div className="error">{error}</div>}
          <p style={{ marginTop: '15px', color: '#94a3b8' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <a href="#" onClick={e => { e.preventDefault(); setIsLogin(!isLogin); }} style={{ color: '#7c3aed' }}>
              {isLogin ? 'Register' : 'Login'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
