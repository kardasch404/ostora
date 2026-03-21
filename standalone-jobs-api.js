const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stellen',
  waitForConnections: true,
  connectionLimit: 10
});

// Middleware to decode HTML entities in query params
app.use((req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
      }
    });
  }
  next();
});

app.get('/api/v1/jobs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const location = (req.query.location || '').trim();
    const country = (req.query.country || '').trim();

    let sql = 'SELECT * FROM stellen WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (job_title LIKE ? OR company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ' AND category_name = ?';
      params.push(category);
    }

    if (location) {
      sql += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    if (country) {
      sql += ' AND country LIKE ?';
      params.push(`%${country}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);

    const countSql = 'SELECT COUNT(*) as total FROM stellen WHERE 1=1' + 
      (search ? ' AND (job_title LIKE ? OR company_name LIKE ?)' : '') +
      (category ? ' AND category_name = ?' : '') +
      (location ? ' AND location LIKE ?' : '') +
      (country ? ' AND country LIKE ?' : '');
    const countParams = params.slice(0, -2);
    const [countResult] = await pool.execute(countSql, countParams);
    const total = countResult[0]?.total || 0;

    res.json({
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

app.get('/api/v1/jobs/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT category_name FROM stellen ORDER BY category_name ASC'
    );
    res.json({ data: rows.map(r => r.category_name) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error', message: error.message });
  }
});

app.get('/api/v1/users/me', async (req, res) => {
  // Mock user endpoint - replace with real JWT validation
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Return mock user data
  res.json({
    id: '38c269a8-629d-4aa3-888d-bbe70a09b24b',
    email: 'zz2406143@gmail.com',
    role: 'USER',
    name: 'User',
    createdAt: new Date().toISOString()
  });
});

const PORT = 4717;
app.listen(PORT, () => {
  console.log(`✅ Jobs API running on http://localhost:${PORT}`);
  console.log(`📊 Connected to XAMPP MySQL (stellen database)`);
});
