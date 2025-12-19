import { useState, useEffect } from 'react';
import authService from './services/authService';
import Login from './components/Login';
import Register from './components/Register';
import ContactList from './components/ContactList';
import ChatWindow from './components/ChatWindow';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUser(authService.getUser());
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUser(authService.getUser());
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setUser(authService.getUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSelectedContact(null);
  };

  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 FamChat</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>Hello, {user?.display_name || user?.username}!</span>
          <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </div>
      <div style={styles.chatContainer}>
        <ContactList 
          onSelectContact={setSelectedContact}
          selectedContact={selectedContact}
        />
        <ChatWindow contact={selectedContact} />
      </div>
    </div>
  );
}

const styles = {
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '15px 25px',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  username: {
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
};

export default App;
