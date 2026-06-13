import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  generateSystemNotifications,
} from '../controllers/notificationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication and shop_owner role
router.use(protect);
router.use(authorize('shop_owner'));

// GET  /api/notifications               — list all notifications (paginated)
router.get('/', getNotifications);

// GET  /api/notifications/unread-count  — lightweight count for bell badge
router.get('/unread-count', getUnreadCount);

// POST /api/notifications/generate      — run system checks and create alerts
router.post('/generate', generateSystemNotifications);

// PATCH /api/notifications/read-all     — mark all as read
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read     — mark single as read
router.patch('/:id/read', validateObjectId, markAsRead);

// DELETE /api/notifications             — clear all notifications
router.delete('/', deleteAllNotifications);

// DELETE /api/notifications/:id         — delete single notification
router.delete('/:id', validateObjectId, deleteNotification);

export default router;
