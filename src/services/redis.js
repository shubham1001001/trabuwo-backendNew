const { redis } = require("../config/redis");
const logger = require("../config/logger");

class RedisService {
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serializedValue);
      } else {
        await redis.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error("Redis SET error:", error);
      return false;
    }
  }

  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error("Redis DEL error:", error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await redis.exists(key);
    } catch (error) {
      logger.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async expire(key, ttl) {
    try {
      return await redis.expire(key, ttl);
    } catch (error) {
      logger.error("Redis EXPIRE error:", error);
      return false;
    }
  }

  async ttl(key) {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error("Redis TTL error:", error);
      return -1;
    }
  }

  async hget(hash, field) {
    try {
      const value = await redis.hget(hash, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis HGET error:", error);
      return null;
    }
  }

  async hset(hash, field, value) {
    try {
      const serializedValue = JSON.stringify(value);
      await redis.hset(hash, field, serializedValue);
      return true;
    } catch (error) {
      logger.error("Redis HSET error:", error);
      return false;
    }
  }

  async hgetall(hash) {
    try {
      const result = await redis.hgetall(hash);
      const parsed = {};
      for (const [key, value] of Object.entries(result)) {
        parsed[key] = JSON.parse(value);
      }
      return parsed;
    } catch (error) {
      logger.error("Redis HGETALL error:", error);
      return {};
    }
  }

  async hdel(hash, field) {
    try {
      await redis.hdel(hash, field);
      return true;
    } catch (error) {
      logger.error("Redis HDEL error:", error);
      return false;
    }
  }

  async lpush(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      return await redis.lpush(key, serializedValue);
    } catch (error) {
      logger.error("Redis LPUSH error:", error);
      return 0;
    }
  }

  async rpop(key) {
    try {
      const value = await redis.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis RPOP error:", error);
      return null;
    }
  }

  async lrange(key, start, stop) {
    try {
      const values = await redis.lrange(key, start, stop);
      return values.map((value) => JSON.parse(value));
    } catch (error) {
      logger.error("Redis LRANGE error:", error);
      return [];
    }
  }

  async sadd(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      return await redis.sadd(key, serializedValue);
    } catch (error) {
      logger.error("Redis SADD error:", error);
      return 0;
    }
  }

  async smembers(key) {
    try {
      const values = await redis.smembers(key);
      return values.map((value) => JSON.parse(value));
    } catch (error) {
      logger.error("Redis SMEMBERS error:", error);
      return [];
    }
  }

  async srem(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      return await redis.srem(key, serializedValue);
    } catch (error) {
      logger.error("Redis SREM error:", error);
      return 0;
    }
  }

  async flushdb() {
    try {
      await redis.flushdb();
      logger.info("Redis database flushed");
      return true;
    } catch (error) {
      logger.error("Redis FLUSHDB error:", error);
      return false;
    }
  }

  async keys(pattern) {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      logger.error("Redis KEYS error:", error);
      return [];
    }
  }

  async getOrSet(key, fetchFunction, ttl = 3600) {
    try {
      let value = await this.get(key);
      if (value === null) {
        value = await fetchFunction();
        if (value !== null && value !== undefined) {
          await this.set(key, value, ttl);
        }
      }
      return value;
    } catch (error) {
      logger.error("Redis GET_OR_SET error:", error);
      return await fetchFunction();
    }
  }

  async invalidatePattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(
          `Invalidated ${keys.length} keys matching pattern: ${pattern}`
        );
      }
      return keys.length;
    } catch (error) {
      logger.error("Redis INVALIDATE_PATTERN error:", error);
      return 0;
    }
  }

  async incrementRateLimit(key, window = 3600) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, window);
      }
      return current;
    } catch (error) {
      logger.error("Redis INCREMENT_RATE_LIMIT error:", error);
      return 0;
    }
  }

  async getRateLimit(key) {
    try {
      return (await redis.get(key)) || 0;
    } catch (error) {
      logger.error("Redis GET_RATE_LIMIT error:", error);
      return 0;
    }
  }

  async incrementProductView(productId) {
    try {
      const date = new Date().toISOString().split("T")[0];
      const key = `product:views:${productId}:${date}`;
      const result = await redis.incr(key);
      logger.info(
        `Incremented view count for product ${productId} on ${date}: ${result}`
      );
      return result;
    } catch (error) {
      logger.error("Redis INCREMENT_PRODUCT_VIEW error:", error);
      return 0;
    }
  }

  async getProductViewCount(productId, date) {
    try {
      const key = `product:views:${productId}:${date}`;
      const count = await redis.get(key);
      return count ? parseInt(count) : 0;
    } catch (error) {
      logger.error("Redis GET_PRODUCT_VIEW_COUNT error:", error);
      return 0;
    }
  }

  async getAllProductViews() {
    try {
      const keys = await redis.keys("product:views:*");
      const viewData = [];

      for (const key of keys) {
        const count = await redis.get(key);
        const [, , productId, date] = key.split(":");
        viewData.push({
          productId,
          viewDate: date,
          viewCount: parseInt(count) || 0,
        });
      }

      return viewData;
    } catch (error) {
      logger.error("Redis GET_ALL_PRODUCT_VIEWS error:", error);
      return [];
    }
  }

  async clearProductViews() {
    try {
      const keys = await redis.keys("product:views:*");
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Cleared ${keys.length} product view keys from Redis`);
      }
      return keys.length;
    } catch (error) {
      logger.error("Redis CLEAR_PRODUCT_VIEWS error:", error);
      return 0;
    }
  }
}

module.exports = new RedisService();
