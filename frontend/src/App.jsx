import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [connected, setConnected] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => setServerStatus(data))
      .catch(err => console.error('Backend not reachable:', err));

    // Connect to WebSocket
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔐 FamChat</h1>
      <p>Encrypted Private Communication</p>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>System Status</h3>
        <p>
          WebSocket: {' '}
          <span style={{ color: connected ? 'green' : 'red', fontWeight: 'bold' }}>
            {connected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </p>
        <p>
          Backend: {' '}
          <span style={{ color: serverStatus ? 'green' : 'orange', fontWeight: 'bold' }}>
            {serverStatus ? '✅ Healthy' : '⏳ Checking...'}
          </span>
        </p>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
        <h3>✅ Development Environment Ready!</h3>
        <p>Frontend and backend are set up and communicating.</p>
        <p>Next steps: Implement authentication system</p>
      </div>
    </div>
  );
}

export default App;
