import Redis from 'ioredis';

interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  methodLimits: { [key: string]: number }; // Maximum allowed requests per method
  logRequests?: boolean;  // Whether to log requests or not
  logFunction?: (ip: string, count: number) => void; // Custom log function
}


interface RateLimitErrorResponse {
  status: number;
  message: string;
  maxRequests: number;
  currentCount: number;
  resetIn?: number; 
}


// Create a Redis client using ioredis
const redisClient = new Redis();

const defaultLogRequest = (ip: string, count: number) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] IP: ${ip}, Current Count: ${count}`);
};


const rateLimiter = (options: RateLimitOptions) => {
  return async (req: any, res: any, next: any) => {
    const { windowMs, methodLimits, logRequests,logFunction } = options;
    const clientIp = req.ip;
    const redisKey = `rate-limit:${clientIp}`;

    try {
      // Use Redis to increment the request count atomically
      const currentCount = await redisClient.incr(redisKey);

      // If this is the first request, set an expiration for the time window
      if (currentCount === 1) {
        await redisClient.expire(redisKey, windowMs / 1000);
      }

      // Get the max requests for the current method
      const maxRequests = methodLimits[req.method] || Infinity;  // Allow all unsupported methods

      // Check if the current count exceeds the max requests allowed
      if (currentCount > maxRequests) {
        const resetIn = await redisClient.ttl(redisKey); 
        const errorResponse: RateLimitErrorResponse = {
          status: 429,
          message: "Too many requests, please try again later.",
          maxRequests,
          currentCount,
          resetIn,
        };
        return res.status(429).json(errorResponse); // Return custom error response
      }

      // Store the current count in the request object for later use
      req.currentCount = currentCount;

      // Log the request details if logging is enabled
      if (logRequests) {
        const logFunc = logFunction || defaultLogRequest; // Use custom log function if provided
        logFunc(clientIp, currentCount);
      }

      next();
    } catch (error) {
      console.error('Redis error:', error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

export default rateLimiter;
