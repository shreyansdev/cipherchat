import { test, expect } from '@playwright/test';
import { createClient } from 'redis';

test('Two users can create a room, join it, and exchange encrypted messages', async ({ browser }) => {
  const password = 'securePass1!';
  
  // Create two separate browser contexts for User A and User B
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // 1. Browser A navigates to the app home page
  await pageA.goto('/');

  // 2. Browser A creates a room
  await pageA.click('text=[CREATE SECURE ROOM]');
  const roomName = await pageA.inputValue('input[placeholder="enter-room-name"]');
  await pageA.fill('input[placeholder="anonymous-user"]', 'User A');
  await pageA.click('#protected', { force: true });
  await pageA.fill('input[placeholder="••••••••"]', password);
  
  // Click initialize
  await pageA.click('text=[INITIALIZE ROOM]');

  // 3. Assert Browser A is redirected to the room URL and sees the chat interface
  await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
  await expect(pageA.locator('text=User A has joined the chat.')).toBeVisible({ timeout: 10000 });

  // 4. Copy the room URL from Browser A
  const roomUrl = pageA.url();

  // 5. Browser B opens the same room URL
  await pageB.goto(roomUrl);

  // 6. Browser B enters password and joins
  // Assuming we implement a join form on direct link, otherwise we need to handle redirect
  await pageB.fill('input[placeholder="anonymous-user"]', 'User B');
  await pageB.click('text=[CONNECT NOW]');
  
  // Password modal should appear if it's protected
  const passwordInput = pageB.locator('input[placeholder="••••••••"]');
  await passwordInput.fill(password);
  await pageB.click('text=[DECRYPT & JOIN]');

  // Assert B joined
  await expect(pageB.locator('text=User B has joined the chat.')).toBeVisible({ timeout: 10000 });
  await expect(pageA.locator('text=User B has joined the chat.')).toBeVisible({ timeout: 10000 });

  // 7. Browser A sends the message "Hello from A"
  const messageInputA = pageA.locator('input[placeholder="[ENCRYPTED MESSAGE]"]');
  await messageInputA.fill('Hello from A');
  await messageInputA.press('Enter');

  // 8. Assert Browser B receives and displays "Hello from A"
  await expect(pageB.locator('text=Hello from A')).toBeVisible();

  // 9. Browser B sends the message "Hello from B"
  const messageInputB = pageB.locator('input[placeholder="[ENCRYPTED MESSAGE]"]');
  await messageInputB.fill('Hello from B');
  await messageInputB.press('Enter');

  // 10. Assert Browser A receives and displays "Hello from B"
  await expect(pageA.locator('text=Hello from B')).toBeVisible();

  // Security assertions (run via a test Redis client)
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisClient = createClient({ url: redisUrl });
  await redisClient.connect();

  // 11. Connect to Redis and fetch the raw message payload from room:{slug}:messages
  const messagesKey = `room:${roomName}:messages`;
  const rawMessages = await redisClient.lRange(messagesKey, 0, -1);
  
  // 12. Assert the stored value does NOT contain the string "Hello from A" or "Hello from B"
  for (const rawMsg of rawMessages) {
    expect(rawMsg).not.toContain('Hello from A');
    expect(rawMsg).not.toContain('Hello from B');
    
    // 13. Assert the stored value contains ciphertext and iv fields (valid base64)
    const msgObj = JSON.parse(rawMsg);
    if (msgObj.type === 'user') {
      expect(msgObj.ciphertext).toBeDefined();
      expect(msgObj.iv).toBeDefined();
      // Base64 check
      expect(msgObj.ciphertext).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      expect(msgObj.iv).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    }
  }

  // Teardown: Delete the test room keys from Redis
  const metaKey = `room:${roomName}:meta`;
  const usersKey = `room:${roomName}:users`;
  await redisClient.del(metaKey);
  await redisClient.del(usersKey);
  await redisClient.del(messagesKey);
  await redisClient.quit();

  await contextA.close();
  await contextB.close();
});
