// Frontend Configuration
// This file configures the API endpoint for the frontend

const CONFIG = {
    // API server URL - change this for production deployment
    API_URL: window.location.hostname === 'localhost'
        ? 'https://api-production-926a.up.railway.app'
        : 'https://your-api.railway.app', // Replace with your Railway URL

    // WebSocket URL for real-time game features
    WS_URL: window.location.hostname === 'localhost'
        ? 'ws://localhost:4000'
        : 'wss://your-api.railway.app', // Replace with your Railway URL

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
