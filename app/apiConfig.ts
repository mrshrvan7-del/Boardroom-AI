// app/apiConfig.ts
export const getApiUrl = (path: string): string => {
  if (typeof window === 'undefined') return path;

  // Check if running on localhost dev server
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://127.0.0.1:8000${path}`;
  }

  // Hardcoded to the HuggingFace Space backend for Cloudflare Pages
  return `https://shrutheesh-boardroom-backend.hf.space${path}`;
};
