import db from '../utils/database.js';
import bcrypt from 'bcrypt';

class User {
  static create({ username, email, password, displayName = null }) {
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `);
    
    try {
      const result = stmt.run(username, email, passwordHash, displayName);
      return this.findById(result.lastInsertRowid);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Username or email already exists');
      }
      throw error;
    }
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  }

  static updateLastSeen(userId) {
    const stmt = db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(userId);
  }

  static updatePublicKey(userId, publicKey) {
    const stmt = db.prepare('UPDATE users SET public_key = ? WHERE id = ?');
    stmt.run(publicKey, userId);
  }

  // Remove sensitive data before sending to client
  static sanitize(user) {
    if (!user) return null;
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

export default User;
