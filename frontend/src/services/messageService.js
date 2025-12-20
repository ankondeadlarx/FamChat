const API_URL = 'http://localhost:3000/api';

class MessageService {
  getAuthHeader() {
    return {
      'Content-Type': 'application/json'
    };
  }

  async sendMessage(receiverId, encryptedContent, iv) {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      credentials: 'include', // Send cookie
      body: JSON.stringify({ receiverId, encryptedContent, iv })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');
    return data.message;
  }

  async getConversation(contactId) {
    const response = await fetch(`${API_URL}/messages/conversation/${contactId}`, {
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get conversation');
    return data.messages;
  }

  async markAsRead(messageId) {
    const response = await fetch(`${API_URL}/messages/read/${messageId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to mark as read');
    return data;
  }
}

export default new MessageService();
