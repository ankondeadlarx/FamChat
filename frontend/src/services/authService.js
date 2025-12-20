const API_URL = 'http://localhost:3000/api';

class AuthService {
  async register(username, email, password, displayName) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies
      body: JSON.stringify({ username, email, password, displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store user info (token is in httpOnly cookie)
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  async login(username, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store user info (token is in httpOnly cookie)
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  }

  async logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
    }
  }

  getToken() {
    // Token is in httpOnly cookie, not accessible from JavaScript
    return null;
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    // Check if user info exists (token is in cookie)
    return !!this.getUser();
  }

  async getProfile() {
    const response = await fetch(`${API_URL}/auth/profile`, {
      credentials: 'include' // Send cookie
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get profile');
    }

    return data.user;
  }
}

export default new AuthService();
