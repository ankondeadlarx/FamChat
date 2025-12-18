import { useState, useEffect } from 'react';
import authService from '../services/authService';

function ChatDashboard({ onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 FamChat Dashboard</h1>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>

      {user && (
        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>Welcome, {user.display_name || user.username}! 👋</h2>
          <div style={styles.userInfo}>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      <div style={styles.statusCard}>
        <h3 style={styles.cardTitle}>✅ Authentication System Active</h3>
        <p>You're successfully logged in with JWT authentication.</p>
        <div style={styles.nextSteps}>
          <h4>Next Steps in Development:</h4>
          <ul style={styles.list}>
            <li>Implement contact management</li>
            <li>Build chat interface</li>
            <li>Add end-to-end encryption</li>
            <li>Set up real-time messaging</li>
          </ul>
        </div>
      </div>

      <div style={styles.infoCard}>
        <h4>🔒 Security Features Active:</h4>
        <ul style={styles.list}>
          <li>✓ Password hashing (bcrypt)</li>
          <li>✓ JWT token authentication</li>
          <li>✓ Secure HTTP headers (helmet)</li>
          <li>✓ Rate limiting</li>
          <li>✓ CORS protection</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  welcomeCard: {
    backgroundColor: '#e8f5e9',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  welcomeTitle: {
    color: '#2e7d32',
    marginBottom: '15px',
  },
  userInfo: {
    color: '#555',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
  },
  cardTitle: {
    color: '#4CAF50',
    marginBottom: '10px',
  },
  nextSteps: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  infoCard: {
    backgroundColor: '#fff3cd',
    padding: '20px',
    borderRadius: '12px',
  },
  list: {
    marginTop: '10px',
    lineHeight: '1.8',
  },
};

export default ChatDashboard;
