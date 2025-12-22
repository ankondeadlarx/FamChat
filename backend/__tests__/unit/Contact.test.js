import testDb from '../setup/testDatabase.js';
import bcrypt from 'bcrypt';

// Create User model using test database
class User {
  static create({ username, email, password, displayName = null }) {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = testDb.prepare(`INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`);
    try {
      const result = stmt.run(username, email, passwordHash, displayName);
      return testDb.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint')) throw new Error('Username or email already exists');
      throw error;
    }
  }
}

// Create Contact model using test database
class Contact {
  static add(userId, contactUsername) {
    const contactUser = testDb.prepare('SELECT * FROM users WHERE username = ?').get(contactUsername);
    if (!contactUser) throw new Error('User not found');
    if (userId === contactUser.id) throw new Error('Cannot add yourself as a contact');
    
    const stmt = testDb.prepare(`INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, 'pending')`);
    try {
      const result = stmt.run(userId, contactUser.id);
      return {
        message: 'Contact request sent',
        contactId: contactUser.id,
        requestId: result.lastInsertRowid
      };
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint')) throw new Error('Contact request already exists');
      throw error;
    }
  }

  static getByUserId(userId) {
    const stmt = testDb.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM contacts c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = ? AND c.status = 'accepted'
    `);
    return stmt.all(userId);
  }

  static getPendingRequests(userId) {
    const stmt = testDb.prepare(`
      SELECT c.*, u.username, u.display_name
      FROM contacts c
      JOIN users u ON c.user_id = u.id
      WHERE c.contact_id = ? AND c.status = 'pending'
    `);
    return stmt.all(userId);
  }

  static acceptRequest(requestId) {
    const stmt = testDb.prepare(`UPDATE contacts SET status = 'accepted' WHERE id = ?`);
    stmt.run(requestId);
    return testDb.prepare('SELECT * FROM contacts WHERE id = ?').get(requestId);
  }

  static accept(receiverId, senderId) {
    // Find the contact request
    const request = testDb.prepare(`
      SELECT * FROM contacts 
      WHERE user_id = ? AND contact_id = ? AND status = 'pending'
    `).get(senderId, receiverId);
    
    if (!request) {
      throw new Error('Contact request not found');
    }
    
    this.acceptRequest(request.id);
    return { message: 'Contact request accepted' };
  }

  static getContacts(userId) {
    return this.getByUserId(userId);
  }

  static rejectRequest(requestId) {
    const stmt = testDb.prepare(`DELETE FROM contacts WHERE id = ?`);
    stmt.run(requestId);
  }

  static remove(userId, contactId) {
    const stmt = testDb.prepare(`DELETE FROM contacts WHERE user_id = ? AND contact_id = ?`);
    stmt.run(userId, contactId);
    return { message: 'Contact removed' };
  }

  static areConnected(userId1, userId2) {
    const stmt = testDb.prepare(`
      SELECT * FROM contacts 
      WHERE ((user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?))
      AND status = 'accepted'
    `);
    return stmt.get(userId1, userId2, userId2, userId1) !== undefined;
  }
}

describe('Contact Model', () => {
  let user1, user2, user3;

  beforeEach(() => {
    // Clean up tables in correct order (foreign key constraints)
    testDb.prepare('DELETE FROM messages').run();
    testDb.prepare('DELETE FROM contacts').run();
    testDb.prepare('DELETE FROM users').run();

    // Create test users
    user1 = User.create({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123'
    });

    user2 = User.create({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123'
    });

    user3 = User.create({
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'password123'
    });
  });

  afterAll(() => {
    testDb.close();
  });

  describe('add', () => {
    test('should add contact successfully', () => {
      const result = Contact.add(user1.id, 'bob');
      expect(result.message).toBe('Contact request sent');
      expect(result.contactId).toBe(user2.id);
    });

    test('should throw error when adding non-existent user', () => {
      expect(() => {
        Contact.add(user1.id, 'nonexistent');
      }).toThrow('User not found');
    });

    test('should throw error when adding self', () => {
      expect(() => {
        Contact.add(user1.id, 'alice');
      }).toThrow('Cannot add yourself as a contact');
    });

    test('should throw error for duplicate contact request', () => {
      Contact.add(user1.id, 'bob');
      
      expect(() => {
        Contact.add(user1.id, 'bob');
      }).toThrow('Contact request already exists');
    });
  });

  describe('accept', () => {
    test('should accept pending contact request', () => {
      Contact.add(user1.id, 'bob');
      const result = Contact.accept(user2.id, user1.id);
      
      expect(result.message).toBe('Contact request accepted');
    });

    test('should throw error for non-existent request', () => {
      expect(() => {
        Contact.accept(user2.id, user1.id);
      }).toThrow('Contact request not found');
    });
  });

  describe('getContacts', () => {
    test('should return accepted contacts', () => {
      Contact.add(user1.id, 'bob');
      Contact.accept(user2.id, user1.id);

      const contacts = Contact.getContacts(user1.id);
      expect(contacts.length).toBe(1);
      expect(contacts[0].username).toBe('bob');
    });

    test('should not return pending contacts', () => {
      Contact.add(user1.id, 'bob');

      const contacts = Contact.getContacts(user1.id);
      expect(contacts.length).toBe(0);
    });

    test('should return empty array when no contacts', () => {
      const contacts = Contact.getContacts(user1.id);
      expect(contacts).toEqual([]);
    });
  });

  describe('getPendingRequests', () => {
    test('should return pending contact requests', () => {
      Contact.add(user1.id, 'bob');
      
      const requests = Contact.getPendingRequests(user2.id);
      expect(requests.length).toBe(1);
      expect(requests[0].username).toBe('alice');
    });

    test('should return empty array when no pending requests', () => {
      const requests = Contact.getPendingRequests(user1.id);
      expect(requests).toEqual([]);
    });
  });

  describe('areConnected', () => {
    test('should return true for accepted contacts', () => {
      Contact.add(user1.id, 'bob');
      Contact.accept(user2.id, user1.id);

      const connected = Contact.areConnected(user1.id, user2.id);
      expect(connected).toBe(true);
    });

    test('should return false for pending contacts', () => {
      Contact.add(user1.id, 'bob');

      const connected = Contact.areConnected(user1.id, user2.id);
      expect(connected).toBe(false);
    });

    test('should return false when not connected', () => {
      const connected = Contact.areConnected(user1.id, user2.id);
      expect(connected).toBe(false);
    });
  });

  describe('remove', () => {
    test('should remove contact', () => {
      Contact.add(user1.id, 'bob');
      Contact.accept(user2.id, user1.id);

      const result = Contact.remove(user1.id, user2.id);
      expect(result.message).toBe('Contact removed');

      const connected = Contact.areConnected(user1.id, user2.id);
      expect(connected).toBe(false);
    });
  });
});
