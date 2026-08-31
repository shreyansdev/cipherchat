import { createClient, defineScript } from 'redis';
import logger from '../lib/logger.js';


const clientOptions = {
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with a cap at 3000ms
      return Math.min(retries * 100, 3000);
    }
  },
  scripts: {
    checkAndAddLimit: defineScript({
      NUMBER_OF_KEYS: 1,
      SCRIPT: `
        local count = redis.call('SCARD', KEYS[1])
        local max = tonumber(ARGV[1]) or 50
        if count >= max then return 0 end
        redis.call('SADD', KEYS[1], ARGV[2])
        return 1
      `,
      transformArguments(keys, args) {
        return [...keys, ...args];
      }
    }),

    removeUser: defineScript({
      NUMBER_OF_KEYS: 2,
      SCRIPT: `
        local usersKey = KEYS[1]
        local usersMapKey = KEYS[2]
        local userId = ARGV[1]

        -- Remove user
        if userId then
          redis.call('SREM', usersKey, userId)
          redis.call('HDEL', usersMapKey, userId)
        end

        -- Get remaining count
        local count = redis.call('SCARD', usersKey)
        if count == 0 then
            redis.call('DEL', usersKey, usersMapKey)
        end

        return count
      `,
      transformArguments(keys, args) {
        return [...keys, ...args];
      }
    }),
    storeMessage: defineScript({
      NUMBER_OF_KEYS: 2,
      SCRIPT: `
        local messagesKey = KEYS[1]
        local metaKey = KEYS[2]
        local messageData = ARGV[1]
        local maxHistory = tonumber(ARGV[2]) or 500

        -- Check if room exists
        local roomExists = redis.call('EXISTS', metaKey)
        if roomExists == 0 then
            return -1
        end

        -- Get room TTL
        local ttl = redis.call('TTL', metaKey)
        if ttl <= 0 then
            return -1
        end

        -- Push and trim
        redis.call('RPUSH', messagesKey, messageData)
        redis.call('LTRIM', messagesKey, -maxHistory, -1)

        -- Apply TTL
        redis.call('EXPIRE', messagesKey, ttl)
        return 1
      `,
      transformArguments(keys, args) {
        return [...keys, ...args];
      }
    }),
    storeFileMetadata: defineScript({
      NUMBER_OF_KEYS: 2,
      SCRIPT: `
        local fileKey = KEYS[1]
        local metaKey = KEYS[2]

        -- Check if args are present
        if #ARGV == 0 then
            return 0
        end

        -- Check if room exists
        local roomExists = redis.call('EXISTS', metaKey)
        if roomExists == 0 then
            return -1
        end

        -- Get room TTL
        local ttl = redis.call('TTL', metaKey)
        if ttl <= 0 then
            return -1
        end

        -- Store hash fields (passed as a flat list in ARGV)
        redis.call('HSET', fileKey, unpack(ARGV))
        redis.call('EXPIRE', fileKey, ttl)
        return 1
      `,
      transformArguments(keys, args) {
        return [...keys, ...args];
      }
    })
  }
};

if (process.env.REDIS_URL) {
  clientOptions.url = process.env.REDIS_URL;
} else {
  clientOptions.socket.host = process.env.REDIS_HOST || 'localhost';
  clientOptions.socket.port = parseInt(process.env.REDIS_PORT) || 6379;
  if (process.env.REDIS_PASSWORD) {
    clientOptions.password = process.env.REDIS_PASSWORD;
  }
}

const redisClient = createClient(clientOptions);

redisClient.on('error', (err) => {
  logger.error(err, 'Redis Client Error');
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error(error, 'Failed to connect to Redis');
    process.exit(1);
  }
};

export default redisClient;
