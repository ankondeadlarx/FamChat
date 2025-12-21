import db from '../setup/testDatabase.js';
import Message from '../../src/models/Message.js';
import User from '../../src/models/User.js';

describe('Message Model', () => {
  let user1, user2;

  beforeEach(() => {
    // Clean up tables
    db.prepare('DELETE FROM messages').run();
    db.prepare('DELETE FROM users').run();

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
    db.close();
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
      expect(messages[0].encrypted_content).toBe('msg1');
      expect(messages[2].encrypted_content).toBe('msg3');
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
