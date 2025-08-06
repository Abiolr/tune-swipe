// src/config.js
console.log('[ENV DEBUG] import.meta.env:', import.meta.env);
console.log('[ENV DEBUG] IS_LOCAL:', import.meta.env.IS_LOCAL);

const isLocal = import.meta.env.IS_LOCAL === true;
console.log('[CONFIG DEBUG] isLocal:', isLocal);

export const FRONTEND_URL = isLocal 
  ? 'http://localhost:5173' 
  : 'https://tune-swipe.vercel.app';

export const BACKEND_URL = isLocal
  ? 'http://127.0.0.1:5000'
  : 'https://tune-swipe.onrender.com';

console.log('[CONFIG DEBUG] FRONTEND_URL:', FRONTEND_URL);
console.log('[CONFIG DEBUG] BACKEND_URL:', BACKEND_URL);
  