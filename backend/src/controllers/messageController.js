import Message from '../models/Message.js';
import Contact from '../models/Contact.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, encryptedContent, iv } = req.body;
    const senderId = req.user.userId;

    if (!receiverId || !encryptedContent || !iv) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if users are connected
    const areConnected = Contact.areConnected(senderId, receiverId);
    if (!areConnected) {
      return res.status(403).json({ error: 'Not connected with this user' });
    }

    const message = Message.create({
      senderId,
      receiverId,
      encryptedContent,
      iv
    });

    res.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.userId;

    // Check if users are connected
    const areConnected = Contact.areConnected(userId, parseInt(contactId));
    if (!areConnected) {
      return res.status(403).json({ error: 'Not connected with this user' });
    }

    const messages = Message.getConversation(userId, parseInt(contactId));
    res.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    Message.markAsRead(parseInt(messageId), userId);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};
