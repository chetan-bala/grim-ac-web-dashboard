const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// In-memory storage for local testing (no database needed)
const users = new Map();
const recordings = new Map();
const invites = new Map();
let idCounter = 1;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'local-testing' });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, serverName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  // Check if user exists
  for (let u of users.values()) {
    if (u.email === email) return res.status(409).json({ error: 'Email already registered' });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = 'user_' + idCounter++;
  users.set(userId, {
    id: userId,
    email,
    password_hash: passwordHash,
    server_name: serverName || null
  });
  
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: userId, email, serverName } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  let user = null;
  for (let u of users.values()) {
    if (u.email === email) { user = u; break; }
  }
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, serverName: user.server_name } });
});

app.post('/api/recordings', authenticateToken, (req, res) => {
  const { playerUuid, playerName, checkName, verbose, timestamp, duration, recordingData } = req.body;
  if (!playerUuid || !recordingData) return res.status(400).json({ error: 'Missing required fields' });
  
  const recordingId = 'rec_' + idCounter++;
  recordings.set(recordingId, {
    id: recordingId,
    user_id: req.user.userId,
    player_uuid: playerUuid,
    player_name: playerName || 'Unknown',
    check_name: checkName || 'Unknown',
    verbose: verbose || '',
    timestamp: new Date(timestamp || Date.now()).toISOString(),
    duration: duration || 30,
    recording_data: recordingData
  });
  
  res.json({ success: true, id: recordingId });
});

app.get('/api/recordings', authenticateToken, (req, res) => {
  const userRecordings = Array.from(recordings.values())
    .filter(r => r.user_id === req.user.userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(userRecordings);
});

app.get('/api/recordings/:id', authenticateToken, (req, res) => {
  const recording = recordings.get(req.params.id);
  if (!recording || recording.user_id !== req.user.userId) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  res.json(recording);
});

app.post('/api/invite', authenticateToken, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  const inviteId = 'inv_' + idCounter++;
  invites.set(inviteId, {
    id: inviteId,
    inviter_id: req.user.userId,
    invited_email: email,
    status: 'pending'
  });
  
  res.json({ success: true, inviteId });
});

app.post('/api/link-grim', authenticateToken, (req, res) => {
  const { serverUrl, apiKey } = req.body;
  const user = users.get(req.user.userId);
  if (user) {
    user.grim_server_url = serverUrl || null;
    user.grim_api_key = apiKey || null;
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (local testing mode - no database needed)`);
});
