import express from 'express';
import {
  addContact,
  acceptContact,
  rejectContact,
  removeContact,
  getContacts,
  getPendingRequests
} from '../controllers/contactController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

router.post('/add', addContact);
router.post('/accept/:contactId', acceptContact);
router.post('/reject/:contactId', rejectContact);
router.delete('/remove/:contactId', removeContact);
router.get('/list', getContacts);
router.get('/pending', getPendingRequests);

export default router;
