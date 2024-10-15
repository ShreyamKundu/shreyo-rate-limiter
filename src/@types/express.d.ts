import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      currentCount?: number;  // Optional property for current request count
    }
  }
}
