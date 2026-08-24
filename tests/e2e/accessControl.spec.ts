import { test, expect } from '@playwright/test';
import { createClient } from 'redis';

/**
 * Access Control E2E Tests
 *
 * Prerequisites:
 *   - Server env: TEST_MAX_USERS=2
 *   - Redis must be reachable at REDIS_URL (default: redis://localhost:6379)
 */
test.describe('Access Control', () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let redisClient: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1
  // ───────────────────────────────────────────────────────────────────────────
  test('Wrong password shows error, does not join room', async ({ browser }) => {
    const roomName = `wrong-pwd-test-${Date.now()}`;
    const correctPassword = 'correctPassword1!';

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    // ── Step 1: Create a room with correct password ──
    await pageA.goto('/');
    await pageA.click('text=[CREATE SECURE ROOM]');
    await pageA.fill('input[placeholder="enter-room-name"]', roomName);
    await pageA.fill('input[placeholder="anonymous-user"]', 'UserA');

    await pageA.click('#protected', { force: true });
    await pageA.fill('input[placeholder="••••••••"]', correctPassword);
    await pageA.click('text=[INITIALIZE ROOM]');

    // Wait for creator to join
    await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(pageA.locator('text=UserA has joined the chat.')).toBeVisible();

    // ── Step 2: Second browser navigates and enters wrong password ──
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    let joinedRoomReceived = false;
    pageB.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        if (typeof frame.payload === 'string' && frame.payload.includes('room-joined')) {
          joinedRoomReceived = true;
        }
      });
    });

    await pageB.goto(`/chat/${roomName}`);
    await pageB.fill('input[placeholder="anonymous-user"]', 'UserB');
    await pageB.click('text=[CONNECT NOW]');

    // Enter wrong password
    const passwordInput = pageB.locator('input[placeholder="••••••••"]');
    await passwordInput.fill('wrongPassword');
    await pageB.click('text=[DECRYPT & JOIN]');

    // ── Step 3: Assert error message is visible ──
    await expect(pageB.locator('text=Incorrect room password')).toBeVisible();

    // ── Step 4: Assert chat interface is NOT visible ──
    await expect(pageB.locator('input[placeholder="[ENCRYPTED MESSAGE]"]')).not.toBeVisible();

    // ── Step 5: Assert the socket did NOT receive a joined_room event ──
    expect(joinedRoomReceived).toBe(false);

    // ── Step 6: Assert no session key for this socket appears in Redis ──
    const usersCount = await redisClient.sCard(`room:${roomName}:users`);
    // Only UserA should be in the room
    expect(usersCount).toBe(1);

    await contextA.close();
    await contextB.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2
  // ───────────────────────────────────────────────────────────────────────────
  test('Room at capacity rejects new joiners', async ({ browser }) => {
    const roomName = `capacity-test-${Date.now()}`;
    
    // Server must be run with TEST_MAX_USERS=2 for this to work
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    // 1 & 2: Create room and join 2 browser contexts successfully
    await page1.goto('/');
    await page1.click('text=[CREATE SECURE ROOM]');
    await page1.fill('input[placeholder="enter-room-name"]', roomName);
    await page1.fill('input[placeholder="anonymous-user"]', 'User1');
    await page1.click('text=[INITIALIZE ROOM]');

    await expect(page1).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(page1.locator('text=User1 has joined the chat.')).toBeVisible();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(`/chat/${roomName}`);
    await page2.fill('input[placeholder="anonymous-user"]', 'User2');
    await page2.click('text=[CONNECT NOW]');
    await expect(page2.locator('text=User2 has joined the chat.')).toBeVisible();

    // 3: 3rd browser context attempts to join
    const context3 = await browser.newContext();
    const page3 = await context3.newPage();
    await page3.goto(`/chat/${roomName}`);
    await page3.fill('input[placeholder="anonymous-user"]', 'User3');
    await page3.click('text=[CONNECT NOW]');

    // 4: Assert the 3rd browser sees "This room is full" UI state
    // We expect the inline banner from ChatPage.tsx to show up if ROOM_FULL is received
    await expect(page3.locator('text=This room is full')).toBeVisible({ timeout: 5000 });

    // 5: Assert the 3rd socket is not added to room:{slug}:users in Redis
    const usersCount = await redisClient.sCard(`room:${roomName}:users`);
    expect(usersCount).toBe(2);

    await context1.close();
    await context2.close();
    await context3.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3
  // ───────────────────────────────────────────────────────────────────────────
  test('Non-existent room slug shows correct error', async ({ page }) => {
    const roomName = 'this-room-does-not-exist-xyz';
    
    // 1: Navigate directly to /chat/this-room-does-not-exist-xyz
    await page.goto(`/chat/${roomName}`);
    
    // User tries to join direct link
    await page.fill('input[placeholder="anonymous-user"]', 'UserA');
    await page.click('text=[CONNECT NOW]');

    // 2: Assert the "Room not found" UI state is shown
    await expect(page.getByText('[ERROR] This room has expired or does not exist')).toBeVisible();

    // 3: Assert no Redis keys were created for this slug
    const metaExists = await redisClient.exists(`room:${roomName}:meta`);
    const usersExists = await redisClient.exists(`room:${roomName}:users`);
    const messagesExists = await redisClient.exists(`room:${roomName}:messages`);
    
    expect(metaExists).toBe(0);
    expect(usersExists).toBe(0);
    expect(messagesExists).toBe(0);
  });
});
