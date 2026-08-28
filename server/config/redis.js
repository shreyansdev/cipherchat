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
        local max = tonumber(ARGV[1])
        if count >= max then return 0 end
        redis.call('SADD', KEYS[1], ARGV[2])
        return 1
      `,
      transformArguments(keys, args) {
        return [...keys, ...args];
      }
    }),
    addUser: defineScript({
      NUMBER_OF_KEYS: 3,
      SCRIPT: `
        local metaKey = KEYS[1]
        local usersKey = KEYS[2]
        local usersMapKey = KEYS[3]
        local userId = ARGV[1]
        local userName = ARGV[2]
        local maxUsers = tonumber(ARGV[3])

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

        -- Check if user is already in room
        local isMember = redis.call('SISMEMBER', usersKey, userId)
        if isMember == 0 then
            local currentCount = redis.call('SCARD', usersKey)
            if currentCount >= maxUsers then
                return -2
            end
        end

        -- Add user and set name
        redis.call('SADD', usersKey, userId)
        redis.call('HSET', usersMapKey, userId, userName)

        -- Apply TTL to match room meta
        redis.call('EXPIRE', usersKey, ttl)
        redis.call('EXPIRE', usersMapKey, ttl)

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
        redis.call('SREM', usersKey, userId)
        redis.call('HDEL', usersMapKey, userId)

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
        local maxHistory = tonumber(ARGV[2])

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
