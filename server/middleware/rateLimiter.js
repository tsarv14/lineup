/**
 * Rate Limiting Middleware
 * Phase D: Enforce rate limits for API keys
 * 
 * Note: For production, use Redis for distributed rate limiting.
 * This is a simple in-memory implementation.
 */

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map();

/**
 * Rate limiting middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
const rateLimiter = (req, res, next) => {
  // Only apply to public API routes
  if (!req.apiKey) {
    return next();
  }
  
  const apiKeyId = req.apiKey._id.toString();
  const now = Date.now();
  const limits = req.apiKey.rateLimit || {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000
  };
  
  // Get or create rate limit entry
  if (!rateLimitStore.has(apiKeyId)) {
    rateLimitStore.set(apiKeyId, {
      requests: [],
      lastCleanup: now
    });
  }
  
  const entry = rateLimitStore.get(apiKeyId);
  
  // Cleanup old requests (older than 24 hours)
  if (now - entry.lastCleanup > 24 * 60 * 60 * 1000) {
    entry.requests = entry.requests.filter(timestamp => now - timestamp < 24 * 60 * 60 * 1000);
    entry.lastCleanup = now;
  }
  
  // Add current request
  entry.requests.push(now);
  
  // Check limits
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const requestsLastMinute = entry.requests.filter(t => t > oneMinuteAgo).length;
  const requestsLastHour = entry.requests.filter(t => t > oneHourAgo).length;
  const requestsLastDay = entry.requests.filter(t => t > oneDayAgo).length;
  
  if (requestsLastMinute > limits.requestsPerMinute) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded: ${limits.requestsPerMinute} requests per minute`,
      retryAfter: 60
    });
  }
  
  if (requestsLastHour > limits.requestsPerHour) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded: ${limits.requestsPerHour} requests per hour`,
      retryAfter: 3600
    });
  }
  
  if (requestsLastDay > limits.requestsPerDay) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded: ${limits.requestsPerDay} requests per day`,
      retryAfter: 86400
    });
  }
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit-Minute', limits.requestsPerMinute);
  res.setHeader('X-RateLimit-Remaining-Minute', Math.max(0, limits.requestsPerMinute - requestsLastMinute));
  res.setHeader('X-RateLimit-Limit-Hour', limits.requestsPerHour);
  res.setHeader('X-RateLimit-Remaining-Hour', Math.max(0, limits.requestsPerHour - requestsLastHour));
  res.setHeader('X-RateLimit-Limit-Day', limits.requestsPerDay);
  res.setHeader('X-RateLimit-Remaining-Day', Math.max(0, limits.requestsPerDay - requestsLastDay));
  
  next();
};

module.exports = rateLimiter;

