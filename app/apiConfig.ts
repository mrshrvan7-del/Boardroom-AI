// app/apiConfig.ts
export const getApiUrl = (path: string): string => {
  if (typeof window === 'undefined') return path;

  // 1. Check local storage override
  const storageUrl = localStorage.getItem('BOARDROOM_API_URL');
  if (storageUrl) {
    return `${storageUrl.replace(/\/$/, '')}${path}`;
  }

  // 2. Check Next.js environment variable (built-in)
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}${path}`;
  }

  // 3. Check if running on localhost dev server
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://127.0.0.1:8000${path}`;
  }

  // 4. Default to relative path (assumes tunnel is mapped to same origin /api)
  return path;
};
