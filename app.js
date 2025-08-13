require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        serial_number VARCHAR(255) UNIQUE NOT NULL,
        user_name VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Routes

// POST /register - Register a new device
app.post('/register', async (req, res) => {
  const { device_name, serial_number } = req.body;
  
  if (!device_name || !serial_number) {
    return res.status(400).json({ error: 'device_name and serial_number are required' });
  }

  try {
    // Check if device already exists
    const [existing] = await pool.execute(
      'SELECT serial_number FROM devices WHERE serial_number = ?',
      [serial_number]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Device already exists' });
    }

    // Register new device
    await pool.execute(
      'INSERT INTO devices (device_name, serial_number) VALUES (?, ?)',
      [device_name, serial_number]
    );

    res.status(200).json({ message: 'Device registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /devices - Get all devices
app.get('/devices', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT device_name, serial_number FROM devices');
    res.json(rows);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /take - Take device for usage
app.post('/take', async (req, res) => {
  const { user_name, serial_number } = req.body;
  
  if (!user_name || !serial_number) {
    return res.status(400).json({ error: 'user_name and serial_number are required' });
  }

  try {
    // Check if device exists
    const [device] = await pool.execute(
      'SELECT serial_number, user_name FROM devices WHERE serial_number = ?',
      [serial_number]
    );

    if (device.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if device is already taken
    if (device[0].user_name !== null) {
      return res.status(400).json({ error: 'Device is already taken' });
    }

    // Assign device to user
    await pool.execute(
      'UPDATE devices SET user_name = ? WHERE serial_number = ?',
      [user_name, serial_number]
    );

    res.status(200).json({ message: 'Device taken successfully' });
  } catch (error) {
    console.error('Take device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /devices/:serial_number - Get device info
app.get('/devices/:serial_number', async (req, res) => {
  const { serial_number } = req.params;

  try {
    const [device] = await pool.execute(
      'SELECT device_name, user_name FROM devices WHERE serial_number = ?',
      [serial_number]
    );

    if (device.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      device_name: device[0].device_name,
      user_name: device[0].user_name
    });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /return - Return device (bonus functionality)
app.post('/return', async (req, res) => {
  const { serial_number } = req.body;
  
  if (!serial_number) {
    return res.status(400).json({ error: 'serial_number is required' });
  }

  try {
    // Check if device exists
    const [device] = await pool.execute(
      'SELECT serial_number, user_name FROM devices WHERE serial_number = ?',
      [serial_number]
    );

    if (device.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if device is taken
    if (device[0].user_name === null) {
      return res.status(400).json({ error: 'Device is not taken' });
    }

    // Return device
    await pool.execute(
      'UPDATE devices SET user_name = NULL WHERE serial_number = ?',
      [serial_number]
    );

    res.status(200).json({ message: 'Device returned successfully' });
  } catch (error) {
    console.error('Return device error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
});