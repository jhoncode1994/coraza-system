export function getApiBaseUrl(): string {
  // Detectar el entorno
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Si estamos en localhost o desarrollo
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
  }
  
  // En producción
  return '/api';
}
