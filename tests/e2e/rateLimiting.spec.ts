import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: Socket message rate limiting
  // ───────────────────────────────────────────────────────────────────────────
  test('Socket message rate limiting drops excess messages and notifies sender', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    // Set up dialog handler to catch the UI alert
    let alertMessage = '';
    pageA.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Monitor WebSocket frames for the rate_limited event
    let rateLimitedEventReceived = false;
    pageA.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        if (typeof frame.payload === 'string' && frame.payload.includes('rate_limited')) {
          rateLimitedEventReceived = true;
        }
      });
    });

    // 1. User A joins a room.
    await pageA.goto('/');
    await pageA.click('text=[CREATE SECURE ROOM]');
    const roomName = await pageA.inputValue('input[placeholder="enter-room-name"]');
    await pageA.fill('input[placeholder="anonymous-user"]', 'UserA');
    await pageA.click('text=[INITIALIZE ROOM]');

    // Wait for join success
    await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(pageA.locator('text=UserA has joined the chat.')).toBeVisible();

    // 2. Programmatically emit 20 message events within 1 second.
    // We achieve this by dispatching events directly on the React inputs to trigger the
    // onSubmit handler repeatedly, which fires socket.emit('send-message') rapidly.
    await pageA.evaluate(() => {
      const input = document.querySelector('input[placeholder="[ENCRYPTED MESSAGE]"]') as HTMLInputElement;
      const form = input.closest('form');
      if (!input || !form) throw new Error('Chat input form not found');
      
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      
      for (let i = 0; i < 20; i++) {
        // Bypass React's synthetic value tracking
        setter?.call(input, `Spam message ${i}`);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });

    // Wait a brief moment for all messages to process
    await pageA.waitForTimeout(1000);

    // 3. Assert that fewer than 20 messages appear in the chat (rate limiter dropped the excess).
    // The system message "UserA has joined" is 1 message. We count actual user messages.
    const messageBubbles = pageA.locator('.break-words'); // Message text container
    const count = await messageBubbles.count();
    
    // We should have significantly less than 20 if the default limit is 5/sec
    expect(count).toBeLessThan(20);

    // 4. Assert User A receives a rate_limited event from the server.
    expect(rateLimitedEventReceived).toBe(true);

    // 5. Assert a "Slow down" or "Too many messages" UI indicator appears for User A.
    // In our implementation, ack.error triggers an alert containing "Please slow down."
    expect(alertMessage).toContain('Please slow down');

    // 6. Assert other users in the room do NOT see the rate_limited notification.
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    
    let userBRateLimited = false;
    pageB.on('websocket', (ws) => {
      ws.on('framereceived', (frame) => {
        if (typeof frame.payload === 'string' && frame.payload.includes('rate_limited')) {
          userBRateLimited = true;
        }
      });
    });

    await pageB.goto(`/chat/${roomName}`);
    await pageB.fill('input[placeholder="anonymous-user"]', 'UserB');
    await pageB.click('text=[CONNECT NOW]');
    await expect(pageB.locator('text=UserB has joined the chat.')).toBeVisible();

    // The event is targeted only at UserA's socket, so B should definitely not receive it.
    expect(userBRateLimited).toBe(false);

    await contextA.close();
    await contextB.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: REST endpoint rate limiting
  // ───────────────────────────────────────────────────────────────────────────
  test('REST endpoint rate limiting returns 429 with Retry-After', async ({ request }) => {
    const requests: Promise<any>[] = [];
    
    // 1. Send 61 POST /api/rooms requests within the rate limit window
    // Firing them concurrently ensures they all hit within the shortest possible window.
    const testIp = '198.51.100.99';
    for (let i = 1; i <= 61; i++) {
      requests.push(
        request.post('/api/rooms/create', {
          headers: { 'x-forwarded-for': testIp },
          data: { roomName: `rest-rate-limit-${Date.now()}-${i}` }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // 2. Assert the 61st response has status 429.
    // (Depending on server config, it may trigger earlier, but 61st will definitely be 429)
    const response61 = responses[60];
    expect(response61.status()).toBe(429);

    // 3. Assert the response has a Retry-After header with a numeric value > 0.
    const headers = response61.headers();
    const retryAfter = headers['retry-after'];
    expect(retryAfter).toBeDefined();
    expect(Number(retryAfter)).toBeGreaterThan(0);

    // 4. Assert the response body does NOT expose internal server details.
    const body = await response61.text();
    const jsonBody = JSON.parse(body);
    
    // Ensure generic error message without stack traces or sensitive paths
    expect(jsonBody.error).toBeDefined();
    expect(body).not.toContain('stack');
    expect(body).not.toContain('node_modules');
    expect(body).not.toContain('file://');
  });

});
