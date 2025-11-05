import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getGroupMessages, sendGroupMessage } from '../controllers/groupMessage.controller.js';

const router = express.Router();

router.get('/:groupId', protectRoute, getGroupMessages);
router.post('/send/:groupId', protectRoute, sendGroupMessage);

export default router;
