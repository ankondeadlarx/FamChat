import db from '../utils/database.js';

class Contact {
  static add(userId, contactUsername) {
    // Find contact by username
    const contactStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const contact = contactStmt.get(contactUsername);
    
    if (!contact) {
      throw new Error('User not found');
    }

    if (contact.id === userId) {
      throw new Error('Cannot add yourself as a contact');
    }

    // Check if already exists
    const existingStmt = db.prepare(
      'SELECT * FROM contacts WHERE (user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?)'
    );
    const existing = existingStmt.get(userId, contact.id, contact.id, userId);

    if (existing) {
      throw new Error('Contact request already exists');
    }

    // Create contact request
    const stmt = db.prepare(
      'INSERT INTO contacts (user_id, contact_id, status) VALUES (?, ?, ?)'
    );
    stmt.run(userId, contact.id, 'pending');

    return { message: 'Contact request sent', contactId: contact.id };
  }

  static accept(userId, contactId) {
    const stmt = db.prepare(
      'UPDATE contacts SET status = ? WHERE contact_id = ? AND user_id = ? AND status = ?'
    );
    const result = stmt.run('accepted', userId, contactId, 'pending');

    if (result.changes === 0) {
      throw new Error('Contact request not found');
    }

    return { message: 'Contact request accepted' };
  }

  static reject(userId, contactId) {
    const stmt = db.prepare(
      'DELETE FROM contacts WHERE contact_id = ? AND user_id = ? AND status = ?'
    );
    const result = stmt.run(userId, contactId, 'pending');

    if (result.changes === 0) {
      throw new Error('Contact request not found');
    }

    return { message: 'Contact request rejected' };
  }

  static remove(userId, contactId) {
    const stmt = db.prepare(
      'DELETE FROM contacts WHERE (user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?)'
    );
    stmt.run(userId, contactId, contactId, userId);

    return { message: 'Contact removed' };
  }

  static getContacts(userId) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.last_seen, c.created_at
      FROM contacts c
      JOIN users u ON (c.contact_id = u.id OR c.user_id = u.id)
      WHERE (c.user_id = ? OR c.contact_id = ?)
        AND c.status = 'accepted'
        AND u.id != ?
      ORDER BY u.last_seen DESC
    `);
    return stmt.all(userId, userId, userId);
  }

  static getPendingRequests(userId) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, c.created_at
      FROM contacts c
      JOIN users u ON c.user_id = u.id
      WHERE c.contact_id = ? AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `);
    return stmt.all(userId);
  }

  static getSentRequests(userId) {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, c.created_at
      FROM contacts c
      JOIN users u ON c.contact_id = u.id
      WHERE c.user_id = ? AND c.status = 'pending'
      ORDER BY c.created_at DESC
    `);
    return stmt.all(userId);
  }

  static areConnected(userId, contactId) {
    const stmt = db.prepare(`
      SELECT * FROM contacts
      WHERE ((user_id = ? AND contact_id = ?) OR (user_id = ? AND contact_id = ?))
        AND status = 'accepted'
    `);
    const result = stmt.get(userId, contactId, contactId, userId);
    return !!result;
  }
}

export default Contact;
