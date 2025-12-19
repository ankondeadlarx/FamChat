const API_URL = 'http://localhost:3000/api';

class MessageService {
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async sendMessage(receiverId, encryptedContent, iv) {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ receiverId, encryptedContent, iv })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');
    return data.message;
  }

  async getConversation(contactId) {
    const response = await fetch(`${API_URL}/messages/conversation/${contactId}`, {
      headers: this.getAuthHeader()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get conversation');
    return data.messages;
  }

  async markAsRead(messageId) {
    const response = await fetch(`${API_URL}/messages/read/${messageId}`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to mark as read');
    return data;
  }
}

export default new MessageService();
