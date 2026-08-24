import { describe, it, expect } from 'vitest';
import pino from 'pino';
import { Writable } from 'stream';

describe('Logger Redaction', () => {
  const redactPaths = ['password', 'passwordHash', 'ciphertext', 'key', 'authorization', 'req.headers.authorization'];

  it('redacts sensitive fields like "password"', async () => {
    let logOutput = '';
    const stream = new Writable({
      write(chunk, encoding, callback) {
        logOutput += chunk.toString();
        callback();
      }
    });

    const testLogger = pino({
      redact: {
        paths: redactPaths,
        placeholder: '[Redacted]',
      }
    }, stream);

    const sensitiveData = {
      password: 'secret-password-123',
      message: 'Hello world'
    };

    testLogger.info(sensitiveData, 'Test log');

    const parsedLog = JSON.parse(logOutput.trim());
    
    expect(parsedLog.password).toBe('[Redacted]');
    expect(parsedLog.message).toBe('Hello world');
    expect(parsedLog.msg).toBe('Test log');
  });

  it('redacts nested fields in request headers', async () => {
    let logOutput = '';
    const stream = new Writable({
      write(chunk, encoding, callback) {
        logOutput += chunk.toString();
        callback();
      }
    });

    const testLogger = pino({
      redact: {
        paths: redactPaths,
        placeholder: '[Redacted]',
      }
    }, stream);

    testLogger.info({
      req: {
        headers: {
          authorization: 'Bearer token123',
          'content-type': 'application/json'
        }
      }
    }, 'Request log');

    const parsedLog = JSON.parse(logOutput.trim());
    expect(parsedLog.req.headers.authorization).toBe('[Redacted]');
    expect(parsedLog.req.headers['content-type']).toBe('application/json');
  });
});
