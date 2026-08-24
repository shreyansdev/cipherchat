import express from 'express';
import { createRoom, isRoomProtected, verifyRoomPassword } from '../services/roomService.js';
import logger from '../lib/logger.js';

const router = express.Router();

const ALLOWED_TTLS = [3600, 21600, 86400, 604800];
if (process.env.TEST_MIN_TTL) {
  ALLOWED_TTLS.push(Number(process.env.TEST_MIN_TTL));
}
const ROOM_NAME_REGEX = /^[a-z0-9_-]+$/;

/**
 * POST /api/rooms/create
 * Create a new room with optional password
 */
router.post('/create', async (req, res) => {
  try {
    let { roomName, password, ttl } = req.body;

    if (roomName !== undefined) {
      if (typeof roomName !== 'string') {
        return res.status(400).json({ error: 'Room name is required' });
      }

      roomName = roomName.trim().toLowerCase();

      if (roomName.length > 64) {
        return res.status(400).json({ error: 'Room name must be 64 characters or less' });
      }

      if (!ROOM_NAME_REGEX.test(roomName)) {
        return res.status(400).json({ error: 'Room name can only contain lowercase letters, numbers, hyphens, and underscores' });
      }
    }

    if (ttl !== undefined && !ALLOWED_TTLS.includes(Number(ttl))) {
      return res.status(400).json({ error: 'Invalid TTL value. Allowed values are: 1h, 6h, 24h, 7d' });
    }

    if (password && password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const result = await createRoom(roomName, password, ttl);
    logger.info({ roomName: result.roomName }, 'Room created via API');
    res.json({ success: true, roomName: result.roomName });
  } catch (error) {
    if (error.message === 'SLUG_GENERATION_FAILED') {
      logger.error(error, 'Slug generation failed after max retries');
      return res.status(503).json({ error: 'SLUG_GENERATION_FAILED' });
    }
    logger.error(error, 'Error creating room');
    res.status(500).json({ error: 'Failed to create room' });
  }
});

/**
 * GET /api/rooms/:name/protected
 * Check if a room is password protected
 */
router.get('/:name/protected', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Validate slug format exactly before touching Redis
    const SLUG_REGEX = /^[a-z]+-[a-z]+-[0-9]{4}$/;
    if (!SLUG_REGEX.test(name)) {
      logger.warn({ name }, 'Rejecting room protection check: Invalid slug format');
      return res.status(400).json({ error: 'Invalid room slug format' });
    }
    
    // Check if room exists
    const { getRoomData } = await import('../services/roomService.js');
    const roomData = await getRoomData(name);
    
    if (!roomData) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const isProtected = await isRoomProtected(name);
    
    res.json({ isProtected });
  } catch (error) {
    logger.error({ error, roomName: req.params.name }, 'Error checking room protection');
    res.status(500).json({ error: 'Failed to check room protection' });
  }
});

/**
 * POST /api/rooms/verify
 * Verify room password
 */
router.post('/verify', async (req, res) => {
  try {
    const { roomName, password } = req.body;

    if (!roomName || !password) {
      logger.warn('Verify password failed: Missing roomName or password');
      return res.status(400).json({ error: 'Room name and password are required' });
    }

    const isValid = await verifyRoomPassword(roomName, password);
    
    if (isValid) {
      res.json({ success: true, valid: true });
    } else {
      logger.warn({ roomName }, 'Verify password failed: Invalid password');
      res.status(401).json({ success: false, valid: false, error: 'Invalid password' });
    }
  } catch (error) {
    if (error.message === 'Room not found') {
      logger.warn({ roomName: req.body.roomName }, 'Verify password failed: Room not found');
      return res.status(404).json({ error: error.message });
    }
    logger.error({ error, roomName: req.body.roomName }, 'Error verifying password');
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

export default router;
