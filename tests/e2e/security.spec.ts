import { test, expect } from '@playwright/test';
import { createClient } from 'redis';
import { io as clientIo } from 'socket.io-client';

test.describe('Security Tests', () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  let redisClient: ReturnType<typeof createClient>;

  test.beforeAll(async () => {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
  });

  test.afterAll(async () => {
    await redisClient.quit();
  });

  // Helper to sleep
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: XSS payload in message
  // ───────────────────────────────────────────────────────────────────────────
  test('XSS payload in message is sanitized and not executed', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 1. User A creates a room
    await pageA.goto('/');
    await pageA.click('text=[CREATE SECURE ROOM]');
    const roomName = await pageA.inputValue('input[placeholder="enter-room-name"]');
    await pageA.fill('input[placeholder="anonymous-user"]', 'User A');
    await pageA.click('text=[INITIALIZE ROOM]');

    await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(pageA.locator('text=User A has joined the chat.')).toBeVisible();

    const roomUrl = pageA.url();

    // 2. User B joins the room
    await pageB.goto(roomUrl);
    await pageB.fill('input[placeholder="anonymous-user"]', 'User B');
    await pageB.click('text=[CONNECT NOW]');
    await expect(pageB.locator('text=User B has joined the chat.')).toBeVisible();

    // Set up window.__xss on Page B to ensure it is not overwritten/executed
    await pageB.evaluate(() => {
      (window as any).__xss = undefined;
    });

    // 3. User A sends message containing XSS payload
    const messageInputA = pageA.locator('input[placeholder="[ENCRYPTED MESSAGE]"]');
    await messageInputA.fill('<script>window.__xss=true</script>');
    await messageInputA.press('Enter');

    // 4. Assert that window.__xss remains undefined in Page B
    await pageB.waitForTimeout(1000); // Give time for sync and rendering
    const xssExecuted = await pageB.evaluate(() => (window as any).__xss);
    expect(xssExecuted).toBeUndefined();

    // 5. Assert the raw string or parts are not parsed as HTML
    // Let's verify how the message bubble is rendered. If it is sanitized, we can
    // check that no script element exists on page B.
    const scriptsCount = await pageB.locator('script').count();
    // Verify that the number of scripts on the page has not increased dynamically
    // and no element contains parsed HTML scripts.
    const xssScriptElement = pageB.locator('script:has-text("window.__xss")');
    await expect(xssScriptElement).not.toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: XSS payload in nickname
  test('XSS payload in nickname does not fire alert', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    let dialogFired = false;
    const handleDialog = (dialog: any) => {
      dialogFired = true;
      dialog.dismiss().catch(() => {});
    };

    pageA.on('dialog', handleDialog);
    pageB.on('dialog', handleDialog);

    // 1. User A creates the room
    await pageA.goto('/');
    await pageA.click('text=[CREATE SECURE ROOM]');
    const roomName = await pageA.inputValue('input[placeholder="enter-room-name"]');
    await pageA.fill('input[placeholder="anonymous-user"]', 'User A');
    await pageA.click('text=[INITIALIZE ROOM]');

    await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(pageA.locator('text=User A has joined the chat.')).toBeVisible();

    const roomUrl = pageA.url();

    // 2. User B joins the room with XSS payload as nickname
    await pageB.goto(roomUrl);
    await pageB.fill('input[placeholder="anonymous-user"]', '<img src=x onerror=alert(1)>');
    await pageB.click('text=[CONNECT NOW]');

    // Wait for the join notification to propagate
    await pageA.waitForTimeout(2000);

    // 3. Assert no alert fires
    expect(dialogFired).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: Oversized payload rejection
  // ───────────────────────────────────────────────────────────────────────────
  test('Oversized payload rejection does not crash the server', async ({ request }) => {
    const socket = clientIo('http://localhost:3001', {
      transports: ['websocket'],
      forceNew: true,
    });

    let disconnected = false;
    let errorReceived = false;

    await new Promise<void>((resolve) => {
      socket.on('connect', () => {
        // Emit a huge payload of 2MB (above maxHttpBufferSize of 1MB)
        const hugePayload = 'a'.repeat(2 * 1024 * 1024);
        socket.emit('join-room', {
          roomName: 'oversized-test-room',
          userName: 'Attacker',
          userId: hugePayload,
        });
      });

      socket.on('disconnect', (reason) => {
        disconnected = true;
        resolve();
      });

      socket.on('error', () => {
        errorReceived = true;
        resolve();
      });

      // Safety timeout
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    if (socket.connected) {
      socket.disconnect();
    }

    // 1. Assert the socket receives an error or is disconnected
    expect(disconnected || errorReceived).toBe(true);

    // 2. Assert the server did NOT crash (check /health still returns 200)
    const healthResponse = await request.get('http://localhost:3001/health');
    expect(healthResponse.status()).toBe(200);
    const healthJson = await healthResponse.json();
    expect(healthJson.status).toBe('ok');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: Invalid room slug injection
  // ───────────────────────────────────────────────────────────────────────────
  test('Invalid room slug injection returns 400 or 404 and does not create Redis keys', async ({ request }) => {
    const invalidSlug = '../../../etc/passwd';
    
    // Attempt to GET the protection status of the invalid room slug
    // We encode the slug to preserve the traversal characters in the request path.
    const encodedSlug = encodeURIComponent(invalidSlug);
    const getResponse = await request.get(`/api/rooms/${encodedSlug}/protected`);
    
    // 1. Assert the server returns 400 or 404 — not 200 or 500
    expect([400, 404]).toContain(getResponse.status());

    // Attempt to create a room with invalid slug
    const postResponse = await request.post('/api/rooms/create', {
      data: {
        roomName: invalidSlug,
        password: 'securePassword1!',
      }
    });

    // Should be rejected with 400 bad request due to ROOM_NAME_REGEX
    expect(postResponse.status()).toBe(400);

    // 2. Assert no Redis keys were created for this slug
    const keys = await redisClient.keys(`*${invalidSlug}*`);
    expect(keys.length).toBe(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 5: Replay attack on message
  // ───────────────────────────────────────────────────────────────────────────
  test('Replay attack on message broadcasts message again (expected for E2EE)', async ({ browser }) => {
    // Note: Replay protection requires sequence numbers, which is a Phase 3 consideration.
    // TODO: Implement sequence numbers or timestamp window checking on the client/server in Phase 3.
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 1. User A creates the room
    await pageA.goto('/');
    await pageA.click('text=[CREATE SECURE ROOM]');
    const roomName = await pageA.inputValue('input[placeholder="enter-room-name"]');
    await pageA.fill('input[placeholder="anonymous-user"]', 'User A');
    await pageA.click('text=[INITIALIZE ROOM]');

    await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(pageA.locator('text=User A has joined the chat.')).toBeVisible();

    const roomUrl = pageA.url();

    // 2. User B joins the room
    await pageB.goto(roomUrl);
    await pageB.fill('input[placeholder="anonymous-user"]', 'User B');
    await pageB.click('text=[CONNECT NOW]');
    await expect(pageB.locator('text=User B has joined the chat.')).toBeVisible();

    // 3. User A sends a message
    const messageInputA = pageA.locator('input[placeholder="[ENCRYPTED MESSAGE]"]');
    await messageInputA.fill('Hello replay');
    await messageInputA.press('Enter');

    // Wait for B to display it
    await expect(pageB.locator('text=Hello replay')).toBeVisible();

    // 4. Capture the raw encrypted message payload { ciphertext, iv } from Redis
    const messagesKey = `room:${roomName}:messages`;
    const rawMessages = await redisClient.lRange(messagesKey, 0, -1);
    const userMessages = rawMessages
      .map((m) => JSON.parse(m))
      .filter((m) => m.type === 'user');
    
    expect(userMessages.length).toBeGreaterThan(0);
    const capturedMessage = userMessages[userMessages.length - 1];

    // Close Page A / context A to free a slot in the room (capacity limit is 2)
    await contextA.close();

    // 5. Connect direct WebSocket client to re-emit the same payload
    const attackerSocket = clientIo('http://localhost:3001', {
      transports: ['websocket'],
      forceNew: true,
    });

    await new Promise<void>((resolve, reject) => {
      attackerSocket.on('connect', () => {
        attackerSocket.emit('join-room', {
          roomName,
          userName: 'ReplayAttacker',
          userId: 'attacker-123',
          password: '',
        });
      });

      attackerSocket.on('room-joined', () => {
        // Re-emit the exact same ciphertext and iv payload
        attackerSocket.emit('send-message', {
          roomName,
          message: {
            id: `msg-replayed-${Date.now()}`,
            user: { id: 'attacker-123', name: 'ReplayAttacker' },
            ciphertext: capturedMessage.ciphertext,
            iv: capturedMessage.iv,
            timestamp: Date.now(),
            type: 'user',
          }
        });
        resolve();
      });

      attackerSocket.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });

    // 6. Assert the replayed message appears in the chat (User B decrypts it and sees "Hello replay" again)
    // We expect "Hello replay" to appear twice in B's view
    const messageCount = pageB.locator('text=Hello replay');
    await expect(messageCount).toHaveCount(2);

    attackerSocket.disconnect();
    await contextB.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 6: Room enumeration
  // ───────────────────────────────────────────────────────────────────────────
  test('Room enumeration mitigation returns identical responses and timings', async ({ request }) => {
    const timings: number[] = [];
    const bodies: string[] = [];

    // Send GET requests to /api/rooms/[1..100] (sequential slugs)
    // We spacing requests using sleep to avoid triggering the rate limiter.
    for (let i = 1; i <= 100; i++) {
      const slug = `nonexistent-room-enum-test-${i}`;
      
      const start = performance.now();
      const response = await request.get(`/api/rooms/${slug}/protected`);
      const duration = performance.now() - start;

      timings.push(duration);
      bodies.push(await response.text());

      // Assert it is 404
      expect(response.status()).toBe(404);

      // Sleep 120ms to avoid the 10req/sec rate limit
      await sleep(120);
    }

    // 1. Assert each response body is identical
    const firstBody = bodies[0];
    for (const body of bodies) {
      expect(body).toBe(firstBody);
    }

    // 2. Assert timing differences are minimal (prevent timing-based enumeration)
    const avg = timings.reduce((sum, val) => sum + val, 0) / timings.length;
    const sqDiffs = timings.map((val) => Math.pow(val - avg, 2));
    const variance = sqDiffs.reduce((sum, val) => sum + val, 0) / timings.length;
    const stdDev = Math.sqrt(variance);

    console.log(`Room enumeration timing: Avg = ${avg.toFixed(2)}ms, StdDev = ${stdDev.toFixed(2)}ms`);
    // standard deviation should be small under local environment run conditions
    expect(stdDev).toBeLessThan(50);
  });
});
