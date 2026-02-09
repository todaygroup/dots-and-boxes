// Frontend Configuration
// This file configures the API endpoint for the frontend

const CONFIG = {
    // API server URL - change this for production deployment (Vercel Trigger)
    API_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://api-production-926a.up.railway.app',

    // WebSocket URL for real-time game features
    WS_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:4000'
        : 'wss://api-production-926a.up.railway.app',

    // App version
    VERSION: '1.0.0',

    // Debug mode
    DEBUG: window.location.hostname === 'localhost'
};

// Make config globally available
window.APP_CONFIG = CONFIG;

// Log config in debug mode
if (CONFIG.DEBUG) {
    console.log('[Config] API URL:', CONFIG.API_URL);
    console.log('[Config] WS URL:', CONFIG.WS_URL);
}
