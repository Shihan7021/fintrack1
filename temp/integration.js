// Integration file for FinTrack Application
// This file loads all the minified components in the correct order

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        FIREBASE_CONFIG: {
            apiKey: "AIzaSyB2KjY3Kj4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9",
            authDomain: "fintrack-app.firebaseapp.com",
            projectId: "fintrack-app",
            storageBucket: "fintrack-app.appspot.com",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:abcdef1234567890"
        },
        APP_VERSION: "1.0.0",
        BUILD_DATE: new Date().toISOString()
    };
    
    // Load sequence
    const loadSequence = [
        'config.min.js',
        'auth.min.js',
        'app.min.js'
    ];
    
    // Load scripts in sequence
    function loadScripts() {
        loadSequence.forEach(script => {
            const scriptElement = document.createElement('script');
            scriptElement.src = script;
            scriptElement.async = false;
            document.head.appendChild(scriptElement);
        });
    }
    
    // Initialize application
    function initApp() {
        // Wait for all scripts to load
        window.addEventListener('load', function() {
            // Initialize Firebase
            if (window._init_fb) {
                window._init_fb().then(() => {
                    console.log('FinTrack App v' + CONFIG.APP_VERSION + ' initialized');
                    console.log('Build date:', CONFIG.BUILD_DATE);
                    
                    // Initialize app core
                    if (window._app_core && window._app_core.init) {
                        window._app_core.init();
                    }
                }).catch(error => {
                    console.error('Failed to initialize app:', error);
                });
            }
        });
    }
    
    // Start loading
    loadScripts();
    initApp();
    
    // Expose global objects
    window.FinTrack = {
        version: CONFIG.APP_VERSION,
        config: CONFIG
    };
    
})();
