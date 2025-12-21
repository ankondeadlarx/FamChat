import db from '../setup/testDatabase.js';
import Contact from '../../src/models/Contact.js';
import User from '../../src/models/User.js';

describe('Contact Model', () => {
  let user1, user2, user3;

  beforeEach(() => {
    // Clean up tables
    db.prepare('DELETE FROM contacts').run();
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

    user3 = User.create({
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'password123'
    });
  });

  afterAll(() => {
    db.close();
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
