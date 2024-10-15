
import express from 'express';
import rateLimiter from './rateLimiter';  // Import your rate-limiting middleware

const app = express();
const port = 3000;

// Define rate-limiting options including method limits
const limiterOptions = {
  windowMs: 30 * 1000, // 30 seconds
  methodLimits: {
    GET: 5, // Allow 10 GET requests
    POST: 2,  // Allow 3 POST requests
  },
  logRequests: true, // Enable logging
  logFunction: (ip: string, count: number) => {
    console.log(`Custom Log: IP ${ip} has made ${count} requests.`);
  }
};

//Routes

// Apply rate limiter to different routes
app.get('/', rateLimiter(limiterOptions), (req, res) => {
  const currentCount = req.currentCount || 0;
  res.send(`Hello! You are within the request limit for GET. Your current request count is: ${currentCount}`);
});

app.post('/checkout', rateLimiter(limiterOptions), (req, res) => {
  const currentCount = req.currentCount || 0;
  res.send(`Checkout successful! You are within the request limit for POST. Your current request count is: ${currentCount}`);
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
