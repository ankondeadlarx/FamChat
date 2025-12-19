import Contact from '../models/Contact.js';

export const addContact = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.userId;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const result = Contact.add(userId, username);
    res.json(result);
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const acceptContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.userId;

    const result = Contact.accept(userId, parseInt(contactId));
    res.json(result);
  } catch (error) {
    console.error('Accept contact error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const rejectContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.userId;

    const result = Contact.reject(userId, parseInt(contactId));
    res.json(result);
  } catch (error) {
    console.error('Reject contact error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const removeContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.userId;

    const result = Contact.remove(userId, parseInt(contactId));
    res.json(result);
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getContacts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const contacts = Contact.getContacts(userId);
    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = Contact.getPendingRequests(userId);
    res.json({ requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};
