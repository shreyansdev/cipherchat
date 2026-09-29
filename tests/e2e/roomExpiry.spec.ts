import { test, expect } from '@playwright/test';
import { createClient } from 'redis';

/**
 * Room Expiry E2E Tests
 *
 * Prerequisites:
 *   - Server env:  TEST_MIN_TTL=2        (adds 2s to ALLOWED_TTLS in rooms.js)
 *   - Vite env:    VITE_TEST_MIN_TTL=2   (shows the "2S" TTL button in the UI)
 *   - Redis must be reachable at REDIS_URL (default: redis://localhost:6379)
 */
test.describe('Room Expiry', () => {
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
  test('An expired room is inaccessible and shows the correct UI', async ({
    page,
    browser,
  }) => {
    // ── Step 1: Browser A creates a room with the minimum test TTL (2 s) ──
    await page.goto('/');
    await page.click('text=[CREATE SECURE ROOM]');
    const roomName = await page.inputValue('input[placeholder="enter-room-name"]');
    await page.fill('input[placeholder="anonymous-user"]', 'UserA');

    // Enable password protection (required to expose TTL selector)
    await page.click('#protected', { force: true });
    await page.fill('input[placeholder="••••••••"]', 'testPassword123');

    // Select the test-only 2-second TTL option
    await page.click('text=2S');
    await page.click('text=[INITIALIZE ROOM]');

    // ── Step 2: Assert the room is accessible immediately ──
    await expect(page).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(
      page.locator('text=UserA has joined the chat.'),
    ).toBeVisible({ timeout: 10_000 });

    // Capture the room URL while the room is still alive
    const roomUrl = page.url();

    // ── Step 3: Wait for the TTL to expire (2 s TTL + 1 s buffer) ──
    await page.waitForTimeout(3_000);

    // ── Step 4: Browser B attempts to navigate to the same room URL ──
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto(roomUrl);

    // Browser B fills the alias form and tries to connect
    await pageB.fill('input[placeholder="anonymous-user"]', 'UserB');
    await pageB.click('text=[CONNECT NOW]');

    // ── Step 5: Assert Browser B sees the expired / not-found error ──
    // ChatPage.tsx renders: [ERROR] This room has expired or does not exist
    // when checkRoomProtection returns 404 (ROOM_NOT_FOUND).
    await expect(
      pageB.getByText('[ERROR] This room has expired or does not exist'),
    ).toBeVisible({ timeout: 10_000 });

    // ── Step 6: Assert the URL does not expose any room metadata ──
    const errorUrl = new URL(pageB.url());

    // No query-string params or hash fragments that could leak metadata
    expect(errorUrl.search).toBe('');
    expect(errorUrl.hash).toBe('');

    // The visible page body must not contain internal room metadata fields
    const bodyText = await pageB.textContent('body');
    expect(bodyText).not.toContain('passwordHash');
    expect(bodyText).not.toContain('ttlSeconds');
    expect(bodyText).not.toContain('maxUsers');
    expect(bodyText).not.toContain('createdAt');
    expect(bodyText).not.toContain('bcrypt');

    // ── Redis assertions ──
    // Small extra buffer so Redis TTL has definitely fired
    await page.waitForTimeout(500);

    // Step 7: Confirm room:{slug}:meta no longer exists
    const metaExists = await redisClient.exists(`room:${roomName}:meta`);
    expect(metaExists).toBe(0);

    // Step 8: Confirm room:{slug}:messages no longer exists
    const messagesExists = await redisClient.exists(
      `room:${roomName}:messages`,
    );
    expect(messagesExists).toBe(0);

    // Bonus: Confirm room:{slug}:users is also gone
    const usersExists = await redisClient.exists(`room:${roomName}:users`);
    expect(usersExists).toBe(0);

    await contextB.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2
  // ───────────────────────────────────────────────────────────────────────────
  test('A user already in a room is gracefully disconnected when the room expires', async ({
    page,
  }) => {
    // ── Instrument console & page-error listeners ──
    // Any console.error() calls are captured so we can assert a clean disconnect.
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Uncaught exceptions / unhandled promise rejections in the page
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    // ── Step 1: User A creates + joins a room with 2 s TTL ──
    await page.goto('/');
    await page.click('text=[CREATE SECURE ROOM]');
    const roomName = await page.inputValue('input[placeholder="enter-room-name"]');
    await page.fill('input[placeholder="anonymous-user"]', 'UserA');
    await page.click('#protected', { force: true });
    await page.fill('input[placeholder="••••••••"]', 'testPassword123');
    await page.click('text=2S');
    await page.click('text=[INITIALIZE ROOM]');

    await expect(page).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(
      page.locator('text=UserA has joined the chat.'),
    ).toBeVisible({ timeout: 10_000 });

    // Record the wall-clock time immediately after the join system message appears.
    // The room-joined event carries remainingTtl (≤ 2 s) and the client schedules
    // a ROOM_EXPIRED dispatch at exactly remainingTtl × 1000 ms.
    const joinConfirmedAt = Date.now();

    // ── Step 2: Wait for TTL to fire ──
    // ── Step 3: Assert the expiry notification appears promptly ──
    await expect(page.locator('text=[CHANNEL EXPIRED]')).toBeVisible({
      timeout: 5_000,
    });

    const expiredVisibleAt = Date.now();

    // The full expiry copy must also be rendered
    await expect(
      page.locator(
        'text=This room has expired or does not exist. All data has been securely wiped.',
      ),
    ).toBeVisible();

    // Verify the notification appeared within a reasonable window of the TTL.
    // TTL = 2 s; remainingTtl ≤ 2 s at join. We allow ≤ 3 s from the join
    // confirmation (2 s TTL + ~500 ms tolerance for scheduling / rendering +
    // ~500 ms for the time between room creation and the join event).
    const elapsedMs = expiredVisibleAt - joinConfirmedAt;
    expect(elapsedMs).toBeLessThanOrEqual(3_000);

    // ── Step 4: Assert the socket disconnected cleanly ──
    // Give async callbacks a moment to settle
    await page.waitForTimeout(500);

    // Filter out *expected* socket lifecycle log lines that use console.error
    // (e.g., Socket.IO's internal transport close logs).
    const unexpectedErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('Disconnected from server') &&
        !msg.includes('WebSocket') &&
        !msg.includes('transport close'),
    );

    expect(unexpectedErrors).toHaveLength(0);

    // No uncaught exceptions should have been thrown in the page
    expect(pageErrors).toHaveLength(0);
  });
});
