import express from 'express';
import {
  sendMessage,
  getConversation,
  markAsRead
} from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

router.post('/send', sendMessage);
router.get('/conversation/:contactId', getConversation);
router.post('/read/:messageId', markAsRead);

export default router;
