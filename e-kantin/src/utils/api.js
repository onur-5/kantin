/**
 * E-Kantin API Helper Utility
 * Resolves base URL dynamically:
 * 1. Checks `import.meta.env.VITE_API_URL` (configured via env variables in Vercel or locally)
 * 2. If running locally (localhost/127.0.0.1) and VITE_API_URL is not set, falls back to http://localhost:5000
 * 3. In production (e.g. Vercel), defaults to the current origin (window.location.origin) to use serverless routes
 */
export const getApiUrl = (path) => {
  const envUrl = import.meta.env.VITE_API_URL;
  let baseUrl = '';

  if (envUrl) {
    baseUrl = envUrl;
  } else if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '[::1]')
  ) {
    baseUrl = 'http://localhost:5000';
  } else if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  }

  // Clean trailing slashes from base and leading slashes from path
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

/**
 * Enhanced error handler that prints a detailed, actionable debug report to the console
 * and returns a clear, localized message for the user.
 */
export const handleApiError = (error, url) => {
  console.group('🚨 E-Kantin API Bağlantı Hatası Detayları');
  console.error('Hata Mesajı:', error.message);
  console.error('İstek Yapılan URL:', url);
  console.error('Tarayıcı Çevrimiçi mi?:', navigator.onLine ? 'Evet (Online)' : 'Hayır (Offline)');
  console.error('Hata Objesi:', error);
  
  let userFriendlyMessage = 'Sunucuya bağlanırken beklenmedik bir hata oluştu.';
  
  if (!navigator.onLine) {
    userFriendlyMessage = 'İnternet bağlantınız bulunmamaktadır. Lütfen ağınızı kontrol edin.';
    console.error('Teşhis: İnternet bağlantısı kesik.');
  } else if (
    error.message.includes('Failed to fetch') || 
    error.message.includes('NetworkError') || 
    error.message.includes('fetch failed') ||
    error.message.includes('ERR_CONNECTION_REFUSED')
  ) {
    userFriendlyMessage = `Sunucuya (${url}) erişilemiyor. Sunucunun açık olduğundan, doğru URL/IP kullanıldığından ve CORS engeline takılmadığından emin olun.`;
    console.error('Teşhis: Sunucu kapalı veya erişilemez durumda (CORS engeli, DNS hatası veya URL/port uyuşmazlığı olabilir).');
  } else if (error.message.includes('timeout')) {
    userFriendlyMessage = 'İstek zaman aşımına uğradı. Sunucu yanıtı gecikiyor.';
    console.error('Teşhis: Zaman aşımı (Timeout).');
  } else {
    userFriendlyMessage = `Bağlantı Hatası: ${error.message}`;
  }
  
  console.groupEnd();
  return userFriendlyMessage;
};
