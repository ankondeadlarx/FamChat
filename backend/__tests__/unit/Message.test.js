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

// Create Message model using test database
class Message {
  static create({ senderId, receiverId, encryptedContent, iv }) {
    const stmt = testDb.prepare(`
      INSERT INTO messages (sender_id, receiver_id, encrypted_content, iv)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(senderId, receiverId, encryptedContent, iv);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = testDb.prepare('SELECT * FROM messages WHERE id = ?');
    return stmt.get(id);
  }

  static getConversation(userId, contactId, limit = 50) {
    const stmt = testDb.prepare(`
      SELECT m.*, 
        sender.username as sender_username,
        receiver.username as receiver_username
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(userId, contactId, contactId, userId, limit).reverse();
  }

  static markAsRead(messageId, userId) {
    const stmt = testDb.prepare(`
      UPDATE messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND receiver_id = ? AND read_at IS NULL
    `);
    stmt.run(messageId, userId);
  }

  static getUnreadCount(userId) {
    const stmt = testDb.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND read_at IS NULL
    `);
    return stmt.get(userId).count;
  }
}

describe('Message Model', () => {
  let user1, user2;

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
  });

  afterAll(() => {
    testDb.close();
  });

  describe('create', () => {
    test('should create a new message', () => {
      const messageData = {
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'encrypted_test_message',
        iv: 'test_iv'
      };

      const message = Message.create(messageData);

      expect(message).toBeDefined();
      expect(message.sender_id).toBe(user1.id);
      expect(message.receiver_id).toBe(user2.id);
      expect(message.encrypted_content).toBe('encrypted_test_message');
      expect(message.iv).toBe('test_iv');
    });
  });

  describe('getConversation', () => {
    test('should retrieve messages between two users', () => {
      // Create messages
      Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'msg1',
        iv: 'iv1'
      });

      Message.create({
        senderId: user2.id,
        receiverId: user1.id,
        encryptedContent: 'msg2',
        iv: 'iv2'
      });

      Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'msg3',
        iv: 'iv3'
      });

      const messages = Message.getConversation(user1.id, user2.id);

      expect(messages.length).toBe(3);
      // Check that all messages are present (order may vary with same timestamp)
      const contents = messages.map(m => m.encrypted_content).sort();
      expect(contents).toEqual(['msg1', 'msg2', 'msg3']);
    });

    test('should limit messages by limit parameter', () => {
      // Create 10 messages
      for (let i = 0; i < 10; i++) {
        Message.create({
          senderId: user1.id,
          receiverId: user2.id,
          encryptedContent: `msg${i}`,
          iv: `iv${i}`
        });
      }

      const messages = Message.getConversation(user1.id, user2.id, 5);
      expect(messages.length).toBe(5);
    });

    test('should return empty array when no messages', () => {
      const messages = Message.getConversation(user1.id, user2.id);
      expect(messages).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    test('should mark message as read', () => {
      const message = Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'test',
        iv: 'iv'
      });

      expect(message.read_at).toBeNull();

      Message.markAsRead(message.id, user2.id);

      const updatedMessage = Message.findById(message.id);
      expect(updatedMessage.read_at).not.toBeNull();
    });

    test('should not mark message as read if wrong receiver', () => {
      const message = Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'test',
        iv: 'iv'
      });

      Message.markAsRead(message.id, user1.id); // Wrong user

      const updatedMessage = Message.findById(message.id);
      expect(updatedMessage.read_at).toBeNull();
    });
  });

  describe('getUnreadCount', () => {
    test('should return count of unread messages', () => {
      // Create 3 messages for user2
      Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'msg1',
        iv: 'iv1'
      });

      Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'msg2',
        iv: 'iv2'
      });

      const msg3 = Message.create({
        senderId: user1.id,
        receiverId: user2.id,
        encryptedContent: 'msg3',
        iv: 'iv3'
      });

      // Mark one as read
      Message.markAsRead(msg3.id, user2.id);

      const unreadCount = Message.getUnreadCount(user2.id);
      expect(unreadCount).toBe(2);
    });

    test('should return 0 when no unread messages', () => {
      const unreadCount = Message.getUnreadCount(user1.id);
      expect(unreadCount).toBe(0);
    });
  });
});
