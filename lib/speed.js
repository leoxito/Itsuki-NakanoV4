const NodeCache = require('node-cache');
const chalk = require('chalk');

const performanceCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const commandMetrics = new Map();

function trackCommand(commandName, startTime) {
  const duration = Date.now() - startTime;

  if (!commandMetrics.has(commandName)) {
    commandMetrics.set(commandName, {
      calls: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0
    });
  }

  const metrics = commandMetrics.get(commandName);
  metrics.calls++;
  metrics.totalTime += duration;
  metrics.avgTime = metrics.totalTime / metrics.calls;
  metrics.minTime = Math.min(metrics.minTime, duration);
  metrics.maxTime = Math.max(metrics.maxTime, duration);

  if (duration > 5000) {
    console.log(chalk.yellow(`⚠️  Slow command: ${commandName} took ${duration}ms`));
  }

  return metrics;
}

function getMetrics(commandName) {
  return commandMetrics.get(commandName);
}

function getAllMetrics() {
  return Object.fromEntries(commandMetrics);
}

function clearMetrics() {
  commandMetrics.clear();
}

function cacheResult(key, value, ttl = 300) {
  return performanceCache.set(key, value, ttl);
}

function getCached(key) {
  return performanceCache.get(key);
}

function clearCache(pattern) {
  const keys = performanceCache.keys();
  keys.forEach(key => {
    if (key.includes(pattern)) {
      performanceCache.del(key);
    }
  });
}

function getCacheStats() {
  const stats = performanceCache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
    hitRate: stats.hits / (stats.hits + stats.misses) * 100 || 0
  };
}

async function withCache(key, fn, ttl = 300) {
  const cached = performanceCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const result = await fn();
  performanceCache.set(key, result, ttl);
  return result;
}

function measurePerformance(label, fn) {
  return async (...args) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.log(chalk.gray(`⏱️  ${label}: ${duration}ms`));
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(chalk.red(`❌ ${label} failed after ${duration}ms:`), error.message);
      throw error;
    }
  };
}

const fastFetch = measurePerformance('fetch', async (url, options = {}) => {
  const axios = require('axios');
  const response = await axios({
    url,
    method: options.method || 'GET',
    headers: options.headers || {},
    data: options.data,
    timeout: options.timeout || 30000,
    maxRedirects: 3
  });
  return response.data;
});

module.exports = {
  trackCommand,
  getMetrics,
  getAllMetrics,
  clearMetrics,
  cacheResult,
  getCached,
  clearCache,
  getCacheStats,
  withCache,
  measurePerformance,
  fastFetch
};
