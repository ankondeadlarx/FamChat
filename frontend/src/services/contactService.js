const API_URL = 'http://localhost:3000/api';

class ContactService {
  getAuthHeader() {
    return {
      'Content-Type': 'application/json'
    };
  }

  async addContact(username) {
    const response = await fetch(`${API_URL}/contacts/add`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      credentials: 'include', // Send cookie
      body: JSON.stringify({ username })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to add contact');
    return data;
  }

  async getContacts() {
    const response = await fetch(`${API_URL}/contacts/list`, {
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get contacts');
    return data.contacts;
  }

  async getPendingRequests() {
    const response = await fetch(`${API_URL}/contacts/pending`, {
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get requests');
    return data.requests;
  }

  async acceptContact(contactId) {
    const response = await fetch(`${API_URL}/contacts/accept/${contactId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to accept contact');
    return data;
  }

  async rejectContact(contactId) {
    const response = await fetch(`${API_URL}/contacts/reject/${contactId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to reject contact');
    return data;
  }

  async removeContact(contactId) {
    const response = await fetch(`${API_URL}/contacts/remove/${contactId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to remove contact');
    return data;
  }
}

export default new ContactService();
