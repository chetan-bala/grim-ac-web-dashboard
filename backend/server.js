const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  const { email, password, serverName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert({
      email, password_hash: passwordHash, server_name: serverName
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
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

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
  if (!playerUuid || !recordingData) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const { data, error } = await supabase.from('recordings').insert({
      user_id: req.user.userId,
      player_uuid: playerUuid,
      player_name: playerName,
      check_name: checkName,
      verbose,
      timestamp: new Date(timestamp).toISOString(),
      duration,
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
      .select('*').eq('user_id', req.user.userId).order('timestamp', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/recordings/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from('recordings')
      .select('*').eq('id', req.params.id).eq('user_id', req.user.userId).single();
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

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?id=${data.id}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Grim AC Dashboard Invitation',
      html: `<p>You've been invited to join a Grim AC Dashboard.</p><p><a href="${inviteLink}">Accept Invitation</a></p>`
    });

    res.json({ success: true, inviteId: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/link-grim', authenticateToken, async (req, res) => {
  const { serverUrl, apiKey } = req.body;
  try {
    const { error } = await supabase.from('users').update({
      grim_server_url: serverUrl,
      grim_api_key: apiKey
    }).eq('id', req.user.userId);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
