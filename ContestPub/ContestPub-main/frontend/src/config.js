// Central place for the backend API URL.
// In production (Vercel), set VITE_API_URL in the project's Environment Variables
// to your Render backend URL, e.g. https://contestpub-backend.onrender.com
// Locally, it falls back to your dev backend on localhost:5000.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
