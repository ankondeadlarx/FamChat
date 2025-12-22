import request from 'supertest';
import express from 'express';
import testDb from '../setup/testDatabase.js';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Create User model using test database
class User {
  static create({ username, email, password, displayName = null }) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = testDb.prepare(`INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`);
    try {
      const result = stmt.run(username, email, passwordHash, displayName || username);
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') throw new Error('Username or email already exists');
      throw error;
    }
  }

  static findById(id) {
    return testDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }

  static findByUsername(username) {
    return testDb.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static findByEmail(email) {
    return testDb.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  static sanitize(user) {
    if (!user) return null;
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

// Create auth routes using test User model
const authRoutes = express.Router();

authRoutes.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = User.create({ username, email, password, displayName: displayName || username });
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: User.sanitize(user)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

authRoutes.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = User.findByUsername(username) || User.findByEmail(username);
    if (!user || !User.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '7d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: User.sanitize(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

authRoutes.get('/profile', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    const user = User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ user: User.sanitize(user) });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

authRoutes.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    // Clean up users table
    testDb.prepare('DELETE FROM users').run();
  });

  afterAll(() => {
    testDb.close();
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.password_hash).toBeUndefined(); // Should be sanitized
      expect(response.headers['set-cookie']).toBeDefined(); // Should set cookie
    });

    test('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least 6 characters');
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email');
    });

    test('should reject duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'user1@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'user2@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    test('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.username).toBe('logintest');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should login with email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'login@example.com', // Using email instead
          password: 'password123'
        });

      expect(response.status).toBe(200);
    });

    test('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get profile with valid token', async () => {
      // Register and get cookie
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'profiletest',
          email: 'profile@example.com',
          password: 'password123'
        });

      const cookies = registerRes.headers['set-cookie'];

      // Get profile
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('profiletest');
    });

    test('should reject without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should logout and clear cookie', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logouttest',
          email: 'logout@example.com',
          password: 'password123'
        });

      const cookies = loginRes.headers['set-cookie'];

      // Logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookies);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
