import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './Login';
import Dashboard from './Dashboard';
import Invite from './Invite';

function App() {
  const isAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch { return false; }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuth() ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={isAuth() ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/accept-invite" element={<Invite />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
