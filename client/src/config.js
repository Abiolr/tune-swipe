// src/config.js
const isLocal = process.env.NODE_ENV === 'development';

export const FRONTEND_URL = isLocal 
  ? 'http://localhost:5173' 
  : 'https://your-production-domain.com';

export const BACKEND_URL = isLocal
  ? 'http://127.0.0.1:5000'
  : 'https://your-production-backend.com';