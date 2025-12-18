import { useState, useEffect } from 'react';
import authService from './services/authService';
import Login from './components/Login';
import Register from './components/Register';
import ChatDashboard from './components/ChatDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <ChatDashboard onLogout={handleLogout} />;
  }

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

export default App;
