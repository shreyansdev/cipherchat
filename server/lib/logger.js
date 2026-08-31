import pino from 'pino';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'ciphertext',
      'key',
      'authorization',
      'req.headers.authorization',
      'req.headers["x-room-password"]',
      'req.headers.x-room-password',
      '*.password',
      '*.passwordHash',
      '*.ciphertext',
      '*.iv',
    ],
    placeholder: '[Redacted]',
  },
  base: {
    service: 'cipherchat',
    nodeEnv,
    pid: process.pid,
  },
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service,nodeEnv',
    },
  },
});

export default logger;
