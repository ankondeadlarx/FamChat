import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import messageService from '../services/messageService';
import encryptionService from '../services/encryptionService';
import authService from '../services/authService';

function ChatWindow({ contact }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = authService.getUser();

  useEffect(() => {
    initializeEncryption();
    initializeSocket();
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (contact && encryptionKey) {
      loadMessages();
    }
  }, [contact, encryptionKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeEncryption = async () => {
    const key = await encryptionService.initializeUserKey();
    setEncryptionKey(key);
  };

  const initializeSocket = () => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('authenticate', currentUser.id);
    });

    newSocket.on('new_message', (message) => {
      decryptAndAddMessage(message);
    });

    newSocket.on('user_typing', ({ userId, isTyping }) => {
      if (contact && userId === contact.id) {
        setIsTyping(isTyping);
      }
    });

    setSocket(newSocket);
  };

  const loadMessages = async () => {
    try {
      const data = await messageService.getConversation(contact.id);
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => ({
          ...msg,
          decrypted: await encryptionService.decrypt(msg.encrypted_content, msg.iv, encryptionKey)
        }))
      );
      setMessages(decryptedMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const decryptAndAddMessage = async (message) => {
    const decrypted = await encryptionService.decrypt(
      message.encrypted_content,
      message.iv,
      encryptionKey
    );
    setMessages(prev => [...prev, { ...message, decrypted }]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !encryptionKey) return;

    try {
      const { encrypted, iv } = await encryptionService.encrypt(newMessage, encryptionKey);
      
      const message = await messageService.sendMessage(contact.id, encrypted, iv);
      
      // Add to local state
      setMessages(prev => [...prev, { ...message, decrypted: newMessage }]);
      
      // Emit via socket for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          receiverId: contact.id,
          message: { ...message, decrypted: newMessage }
        });
      }

      setNewMessage('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    }
  };

  const handleTyping = () => {
    if (socket && contact) {
      socket.emit('typing', { receiverId: contact.id, isTyping: true });
      
      // Clear typing after 3 seconds
      setTimeout(() => {
        socket.emit('typing', { receiverId: contact.id, isTyping: false });
      }, 3000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!contact) {
    return (
      <div style={styles.emptyState}>
        <h2>👈 Select a contact to start chatting</h2>
        <p>Choose someone from your contacts list</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatar}>{(contact.display_name || contact.username)[0].toUpperCase()}</div>
        <div>
          <div style={styles.contactName}>{contact.display_name || contact.username}</div>
          <div style={styles.contactStatus}>@{contact.username}</div>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.noMessages}>
            No messages yet. Start the conversation! 🔐
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageWrapper,
                justifyContent: msg.sender_id === currentUser.id ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(msg.sender_id === currentUser.id ? styles.sentMessage : styles.receivedMessage)
                }}
              >
                <div style={styles.messageText}>{msg.decrypted}</div>
                <div style={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div style={styles.typingIndicator}>
            {contact.display_name || contact.username} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={styles.inputContainer}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button type="submit" style={styles.sendButton}>Send 🔐</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#6c757d',
  },
  header: {
    padding: '15px 20px',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2196F3',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '18px',
  },
  contactName: {
    fontWeight: '600',
    fontSize: '16px',
  },
  contactStatus: {
    fontSize: '12px',
    color: '#6c757d',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
  },
  noMessages: {
    textAlign: 'center',
    color: '#6c757d',
    padding: '40px 20px',
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '12px',
  },
  message: {
    maxWidth: '60%',
    padding: '10px 14px',
    borderRadius: '12px',
    wordWrap: 'break-word',
  },
  sentMessage: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  receivedMessage: {
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #dee2e6',
  },
  messageText: {
    marginBottom: '4px',
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.7,
    textAlign: 'right',
  },
  typingIndicator: {
    fontSize: '12px',
    color: '#6c757d',
    fontStyle: 'italic',
    padding: '5px 10px',
  },
  inputContainer: {
    padding: '15px 20px',
    borderTop: '1px solid #dee2e6',
    backgroundColor: 'white',
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #dee2e6',
    borderRadius: '20px',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    padding: '10px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '500',
  },
};

export default ChatWindow;
