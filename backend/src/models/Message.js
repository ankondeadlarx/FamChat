import db from '../utils/database.js';

class Message {
  static create({ senderId, receiverId, encryptedContent, iv }) {
    const stmt = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, encrypted_content, iv)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(senderId, receiverId, encryptedContent, iv);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    return stmt.get(id);
  }

  static getConversation(userId, contactId, limit = 50) {
    const stmt = db.prepare(`
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
    const stmt = db.prepare(`
      UPDATE messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND receiver_id = ? AND read_at IS NULL
    `);
    stmt.run(messageId, userId);
  }

  static getUnreadCount(userId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE receiver_id = ? AND read_at IS NULL
    `);
    return stmt.get(userId).count;
  }
}

export default Message;
