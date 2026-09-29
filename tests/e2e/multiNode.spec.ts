import { test, expect } from '@playwright/test';

/**
 * Multi-Node E2E Tests
 *
 * Prerequisites:
 *   - docker-compose multi-instance setup running
 *   - Node 1 accessible at TEST_NODE1_URL (e.g. http://localhost:4000)
 *   - Node 2 accessible at TEST_NODE2_URL (e.g. http://localhost:4001)
 *   - Redis adapter correctly configured across both nodes
 */
test.describe('Multi-Node Messaging', () => {
  test('Messages are delivered across different Node.js instances', async ({ browser }) => {
    test.skip(!process.env.TEST_NODE1_URL, 'Requires multi-node docker environment with TEST_NODE1_URL');

    // Determine target URLs
    const node1Url = process.env.TEST_NODE1_URL || 'http://localhost:4000';
    const node2Url = process.env.TEST_NODE2_URL || 'http://localhost:4001';

    // ── Step 1: Browser A connects to app instance 1 (port 4000) and creates a room ──
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    
    await pageA.goto(node1Url);
    await pageA.click('text=[CREATE SECURE ROOM]');
    const roomName = await pageA.inputValue('input[placeholder="enter-room-name"]');
    await pageA.fill('input[placeholder="anonymous-user"]', 'BrowserA');
    await pageA.click('text=[INITIALIZE ROOM]');
    
    // Wait for the room to be joined
    await expect(pageA).toHaveURL(new RegExp(`/chat/${roomName}`));
    await expect(pageA.locator('text=BrowserA has joined the chat.')).toBeVisible();

    // ── Step 2: Browser B connects to app instance 2 (port 4001) and joins the same room ──
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    
    await pageB.goto(`${node2Url}/chat/${roomName}`);
    await pageB.fill('input[placeholder="anonymous-user"]', 'BrowserB');
    await pageB.click('text=[CONNECT NOW]');
    
    // Wait for Browser B to join
    await expect(pageB.locator('text=BrowserB has joined the chat.')).toBeVisible();
    
    // Wait for Browser A to see Browser B join (ensures presence synced across Redis)
    await expect(pageA.locator('text=BrowserB has joined the chat.')).toBeVisible();

    // ── Step 3: Browser A sends "cross-node message" ──
    await pageA.fill('input[placeholder="[ENCRYPTED MESSAGE]"]', 'cross-node message');
    await pageA.click('button:has(.lucide-send)');

    // ── Step 4: Assert Browser B (on the different instance) receives "cross-node message" ──
    await expect(pageB.locator('text=cross-node message')).toBeVisible();

    // ── Step 5: Repeat in reverse: Browser B sends "reply from B", assert Browser A receives it ──
    await pageB.fill('input[placeholder="[ENCRYPTED MESSAGE]"]', 'reply from B');
    await pageB.click('button:has(.lucide-send)');

    await expect(pageA.locator('text=reply from B')).toBeVisible();

    // Teardown
    await contextA.close();
    await contextB.close();
  });
});
