import testDb from '../setup/testDatabase.js';
import bcrypt from 'bcrypt';

// Create User model using test database
class User {
  static create({ username, email, password, displayName = null }) {
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const stmt = testDb.prepare(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(username, email, passwordHash, displayName);
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint')) {
        throw new Error('Username or email already exists');
      }
      throw error;
    }
  }

  static findById(id) {
    const stmt = testDb.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = testDb.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findByEmail(email) {
    const stmt = testDb.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
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

describe('User Model', () => {
  beforeEach(() => {
    // Clean up users table before each test
    testDb.prepare('DELETE FROM users').run();
  });

  afterAll(() => {
    testDb.close();
  });

  describe('create', () => {
    test('should create a new user with hashed password', () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const user = User.create(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.display_name).toBe('Test User');
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe('password123'); // Password should be hashed
    });

    test('should throw error for duplicate username', () => {
      const userData = {
        username: 'duplicate',
        email: 'user1@example.com',
        password: 'password123'
      };

      User.create(userData);

      expect(() => {
        User.create({
          username: 'duplicate',
          email: 'user2@example.com',
          password: 'password456'
        });
      }).toThrow('Username or email already exists');
    });

    test('should throw error for duplicate email', () => {
      const userData = {
        username: 'user1',
        email: 'same@example.com',
        password: 'password123'
      };

      User.create(userData);

      expect(() => {
        User.create({
          username: 'user2',
          email: 'same@example.com',
          password: 'password456'
        });
      }).toThrow('Username or email already exists');
    });
  });

  describe('findByUsername', () => {
    test('should find user by username', () => {
      User.create({
        username: 'findme',
        email: 'findme@example.com',
        password: 'password123'
      });

      const user = User.findByUsername('findme');
      expect(user).toBeDefined();
      expect(user.username).toBe('findme');
    });

    test('should return undefined for non-existent username', () => {
      const user = User.findByUsername('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', () => {
      const user = User.create({
        username: 'passtest',
        email: 'passtest@example.com',
        password: 'mypassword'
      });

      const isValid = User.verifyPassword(user, 'mypassword');
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', () => {
      const user = User.create({
        username: 'passtest2',
        email: 'passtest2@example.com',
        password: 'mypassword'
      });

      const isValid = User.verifyPassword(user, 'wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('sanitize', () => {
    test('should remove password_hash from user object', () => {
      const user = User.create({
        username: 'sanitizetest',
        email: 'sanitize@example.com',
        password: 'password123'
      });

      const sanitized = User.sanitize(user);
      expect(sanitized.password_hash).toBeUndefined();
      expect(sanitized.username).toBe('sanitizetest');
      expect(sanitized.email).toBe('sanitize@example.com');
    });

    test('should return null for null user', () => {
      const sanitized = User.sanitize(null);
      expect(sanitized).toBeNull();
    });
  });
});
