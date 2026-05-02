const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Validate required env vars
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`ERROR: Missing required env var ${varName}`);
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

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
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, serverName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert({
      email,
      password_hash: passwordHash,
      server_name: serverName || null
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    const token = jwt.sign({ userId: data.id, email: data.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: data.id, email: data.email, serverName: data.server_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, serverName: user.server_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recordings', authenticateToken, async (req, res) => {
  const { playerUuid, playerName, checkName, verbose, timestamp, duration, recordingData } = req.body;
  if (!playerUuid || !recordingData) {
    return res.status(400).json({ error: 'Missing required fields: playerUuid, recordingData' });
  }
  try {
    const { data, error } = await supabase.from('recordings').insert({
      user_id: req.user.userId,
      player_uuid: playerUuid,
      player_name: playerName || 'Unknown',
      check_name: checkName || 'Unknown',
      verbose: verbose || '',
      timestamp: new Date(timestamp || Date.now()).toISOString(),
      duration: duration || 30,
      recording_data: recordingData
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recordings', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('recordings')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recordings/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('recordings')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.userId)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Recording not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invite', authenticateToken, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    const invitedUserId = existing ? existing.id : null;

    const { data, error } = await supabase.from('invites').insert({
      inviter_id: req.user.userId,
      invited_email: email,
      invited_user_id: invitedUserId,
      status: 'pending'
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?id=${data.id}`;
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Grim AC Dashboard Invitation',
          html: `<p>You've been invited to join a Grim AC Dashboard.</p><p><a href="${inviteLink}">Accept Invitation</a></p>`
        });
      } catch (emailErr) {
        console.error('Email error:', emailErr.message);
      }
    }

    res.json({ success: true, inviteId: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/link-grim', authenticateToken, async (req, res) => {
  const { serverUrl, apiKey } = req.body;
  try {
    const { error } = await supabase.from('users').update({
      grim_server_url: serverUrl || null,
      grim_api_key: apiKey || null
    }).eq('id', req.user.userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
