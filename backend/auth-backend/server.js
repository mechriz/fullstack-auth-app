const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Use a connection pool instead of single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Secret key
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware to verify token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Create Tables
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255)
  )
`);
pool.query(`
  CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(255)
  )
`);
pool.query(`
  CREATE TABLE IF NOT EXISTS designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    designation_name VARCHAR(255)
  )
`);
pool.query(`
  CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    employee_id VARCHAR(255),
    name VARCHAR(255),
    department_id INT,
    designation_id INT,
    date_joined DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (designation_id) REFERENCES designations(id)
  )
`);

// Seed static data
pool.query(`
  INSERT IGNORE INTO departments (id, department_name) VALUES
  (1, 'Human Resources'),
  (2, 'Engineering'),
  (3, 'Marketing'),
  (4, 'Sales'),
  (5, 'Finance')
`);
pool.query(`
  INSERT IGNORE INTO designations (id, designation_name) VALUES
  (1, 'Intern'),
  (2, 'Software Engineer'),
  (3, 'Project Manager'),
  (4, 'HR Officer'),
  (5, 'Sales Executive')
`);

// ✅ Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields required' });

  try {
    pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('🔴 Error checking email existence:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (insertErr) => {
          if (insertErr) {
            console.error('🔴 Error inserting user:', insertErr);
            return res.status(500).json({ message: 'Server error' });
          }

          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  } catch (err) {
    console.error('🔴 Unexpected error:', err);
    res.status(500).json({ message: 'Unexpected error' });
  }
});

// ✅ Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'All fields required' });

  pool.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username });
  });
});

// ✅ Dashboard route
app.get('/api/dashboard', verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, welcome back to your dashboard.` });
});

// ✅ Save employee profile
app.post('/api/employee-profile', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { employee_id, name, department_id, designation_id, date_joined } = req.body;

  if (!employee_id || !name || !department_id || !designation_id || !date_joined) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const query = `
    INSERT INTO employees (user_id, employee_id, name, department_id, designation_id, date_joined)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  pool.query(query, [userId, employee_id, name, department_id, designation_id, date_joined], (err) => {
    if (err) {
      console.error('❌ Error saving profile:', err);
      return res.status(500).json({ message: 'Error saving profile' });
    }
    res.json({ message: 'Profile saved successfully' });
  });
});

// ✅ View profile
app.get('/api/view-profile', verifyToken, (req, res) => {
  const userId = req.user.id;
const query = `
  SELECT e.employee_id, e.name, d.name AS department_name, g.name AS designation_name, e.date_joined
  FROM employees e
  JOIN departments d ON e.department_id = d.id
  JOIN designations g ON e.designation_id = g.id
  WHERE e.user_id = ?
`;

  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error('🔴 View profile error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(results[0]);
  });
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
