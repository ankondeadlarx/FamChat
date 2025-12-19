import { useState, useEffect } from 'react';
import contactService from '../services/contactService';

function ContactList({ onSelectContact, selectedContact }) {
  const [contacts, setContacts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
    loadPendingRequests();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await contactService.getContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await contactService.getPendingRequests();
      setPendingRequests(data);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await contactService.addContact(newContactUsername);
      setNewContactUsername('');
      setShowAddContact(false);
      alert('Contact request sent!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAccept = async (contactId) => {
    try {
      await contactService.acceptContact(contactId);
      loadContacts();
      loadPendingRequests();
    } catch (err) {
      alert('Failed to accept contact: ' + err.message);
    }
  };

  const handleReject = async (contactId) => {
    try {
      await contactService.rejectContact(contactId);
      loadPendingRequests();
    } catch (err) {
      alert('Failed to reject contact: ' + err.message);
    }
  };

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Contacts</h3>
        <button onClick={() => setShowAddContact(!showAddContact)} style={styles.addButton}>
          {showAddContact ? '✕' : '+ Add'}
        </button>
      </div>

      {showAddContact && (
        <form onSubmit={handleAddContact} style={styles.addForm}>
          {error && <div style={styles.error}>{error}</div>}
          <input
            type="text"
            value={newContactUsername}
            onChange={(e) => setNewContactUsername(e.target.value)}
            placeholder="Enter username"
            style={styles.input}
            required
          />
          <button type="submit" style={styles.submitButton}>Send Request</button>
        </form>
      )}

      {pendingRequests.length > 0 && (
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</h4>
          {pendingRequests.map(request => (
            <div key={request.id} style={styles.requestItem}>
              <div>
                <div style={styles.contactName}>{request.display_name || request.username}</div>
                <div style={styles.contactUsername}>@{request.username}</div>
              </div>
              <div style={styles.requestButtons}>
                <button onClick={() => handleAccept(request.id)} style={styles.acceptButton}>✓</button>
                <button onClick={() => handleReject(request.id)} style={styles.rejectButton}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.contactsList}>
        {contacts.length === 0 ? (
          <div style={styles.emptyState}>
            No contacts yet. Add someone to start chatting!
          </div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              style={{
                ...styles.contactItem,
                ...(selectedContact?.id === contact.id ? styles.selectedContact : {})
              }}
            >
              <div style={styles.avatar}>{(contact.display_name || contact.username)[0].toUpperCase()}</div>
              <div style={styles.contactInfo}>
                <div style={styles.contactName}>{contact.display_name || contact.username}</div>
                <div style={styles.contactUsername}>@{contact.username}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '300px',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #dee2e6',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '15px',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  addForm: {
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderBottom: '1px solid #c8e6c9',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '8px',
    boxSizing: 'border-box',
  },
  submitButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    color: '#c33',
    fontSize: '12px',
    marginBottom: '8px',
  },
  section: {
    backgroundColor: '#fff3cd',
    borderBottom: '1px solid #ffeaa7',
  },
  sectionTitle: {
    padding: '10px 15px',
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#856404',
  },
  requestItem: {
    padding: '10px 15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #ffeaa7',
  },
  requestButtons: {
    display: 'flex',
    gap: '5px',
  },
  acceptButton: {
    padding: '5px 10px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rejectButton: {
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  contactsList: {
    flex: 1,
    overflowY: 'auto',
  },
  contactItem: {
    padding: '12px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: 'white',
    transition: 'background-color 0.2s',
  },
  selectedContact: {
    backgroundColor: '#e3f2fd',
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '500',
    fontSize: '14px',
    marginBottom: '2px',
  },
  contactUsername: {
    fontSize: '12px',
    color: '#6c757d',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#6c757d',
    fontSize: '14px',
  },
};

export default ContactList;
