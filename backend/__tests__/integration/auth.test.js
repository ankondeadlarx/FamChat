import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth.js';
import db from '../setup/testDatabase.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    // Clean up users table
    db.prepare('DELETE FROM users').run();
  });

  afterAll(() => {
    db.close();
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
