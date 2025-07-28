// DOM Elements
const emergencyStatusBar = document.getElementById('emergencyStatusBar');
const navbar = document.getElementById('navbar');
const profileMenu = document.getElementById('profileMenu');
const particlesContainer = document.getElementById('particles');
const safetyScoreElement = document.getElementById('safetyScore');
const safetyProgress = document.getElementById('safetyProgress');
const chatWidget = document.getElementById('chatWidget');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const quickResponses = document.getElementById('quickResponses');
const chatNotificationBadge = document.getElementById('chatNotification'); // Renamed for clarity
const emergencyContactsWidget = document.getElementById('emergencyContactsWidget');
const notification = document.getElementById('notification');
const settingsModal = document.getElementById('settingsModal');
const pwaInstallPrompt = document.getElementById('pwaInstallPrompt');

// App State
let appState = {
    emergencyMode: false,
    locationSharing: true,
    voiceGuardianActive: true,
    biometrics: {
        fingerprint: true,
        face: true,
        voice: false
    },
    fakeCallAutoTrigger: false,
    chatOpen: false,
    chatMessages: [
        {
            sender: 'bot',
            content: "Hi! I'm here to help 24/7. How are you feeling today? If you're in immediate danger, please use the panic button or call emergency services.",
            timestamp: new Date()
        }
    ],
    unreadMessages: 1, // This can remain as UI state
    emergencyContacts: [], // This will be populated from the API
    currentLocation: {
        lat: 40.7128,
        lng: -74.0060,
        area: 'Safe Zone'
    },
    safetyScore: 0, // Will be populated from the API
    wearableConnected: false, // Will be populated from the API
    wearableBattery: 0,
    heartRate: 0,
    stressLevel: '...',
    recordingEnabled: false, // UI setting
    isRecording: false, // UI state
    strobeActive: false, // UI state
    lastEmergencyAlert: null, // UI state
    // Added missing settings properties for toggles
    anonymous: true,
    alerts: true,
    tips: true,
    emergency: true
};

// Utility functions
const utils = {
    formatTime: (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    sanitizeInput: (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Initialize the app
function initApp() {
    console.log('SafeSpace App initializing...');

    try {
        // Check for PWA install prompt
        window.addEventListener('beforeinstallprompt', handlePWAInstall);
        
        // Fetch initial data from our Mock API
        fetchAndRenderInitialData();

        // Initialize particles
        initParticles();

        // Initialize scroll animations
        initScrollAnimations();

        // Intervals will be set up after data is fetched
        // to avoid running on empty data.
        setupIntervals();

        // Check for emergency mode in URL
        checkUrlForEmergency();

        // Load saved settings
        loadSettings();

        // Initialize chat
        initializeChat();

        // Set up event listeners
        setupEventListeners();

        console.log('SafeSpace App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('⚠️ Error initializing app. Please refresh the page.');
    }
}

// NEW: Function to fetch from mock API and update the UI
async function fetchAndRenderInitialData() {
    try {
        // Use the function from api.js
        const userProfile = await fetchUserProfile();

        // Populate appState with the fetched data
        appState.emergencyContacts = userProfile.emergencyContacts;
        appState.safetyScore = userProfile.safetyScore;
        appState.wearableConnected = userProfile.wearable.connected;
        appState.wearableBattery = userProfile.wearable.battery;
        appState.heartRate = userProfile.wearable.heartRate;
        appState.stressLevel = userProfile.wearable.stressLevel;

        // Update the UI with the new data
        const profileMenuInfo = document.querySelector('.profile-menu .profile-info');
        if (profileMenuInfo) {
            profileMenuInfo.querySelector('h3').textContent = userProfile.userName;
            profileMenuInfo.querySelector('p').textContent = userProfile.userStatus;
        }

        updateSafetyScoreUI();
        updateWearableUI();
        renderEmergencyContacts(); // Render contacts now that we have them
        
        console.log('Mock API data loaded and rendered successfully.');
        
    } catch(error) {
        console.error("Failed to fetch mock API data:", error);
        showNotification(
            `⚠️ Couldn't load profile data: ${error.message}`,
            5000
        );

        // Fallback profile data
        const fallbackProfile = {
            userName: 'Guest User',
            userStatus: 'Limited Access',
            safetyScore: 50,
            emergencyContacts: [
                { name: 'Mom', number: '+1 234 567 8901', avatar: '👩' },
                { name: 'Sister', number: '+1 234 567 8902', avatar: '👧' },
                { name: 'Best Friend', number: '+1 234 567 8903', avatar: '👭' }
            ],
            wearable: { connected: false, battery: 0, heartRate: 0, stressLevel: 'Unknown' }
        };

        // Use fallback data
        appState.emergencyContacts = fallbackProfile.emergencyContacts;
        appState.safetyScore = fallbackProfile.safetyScore;
        appState.wearableConnected = fallbackProfile.wearable.connected;
        appState.wearableBattery = fallbackProfile.wearable.battery;
        appState.heartRate = fallbackProfile.heartRate;
        appState.stressLevel = fallbackProfile.stressLevel;

        // Update the UI with fallback data
        const profileMenuInfo = document.querySelector('.profile-menu .profile-info');
        if (profileMenuInfo) {
            profileMenuInfo.querySelector('h3').textContent = fallbackProfile.userName;
            profileMenuInfo.querySelector('p').textContent = fallbackProfile.userStatus;
        }

        updateSafetyScoreUI();
        updateWearableUI();
        renderEmergencyContacts();

        showNotification("⚠️ Couldn't load profile data. Using default profile.", 5000);
    }
}

// Handle PWA install prompt
function handlePWAInstall(e) {
    e.preventDefault();
    window.deferredPrompt = e;
    if (pwaInstallPrompt) {
        pwaInstallPrompt.classList.add('active');
    }
}

// Initialize particle effects
function initParticles() {
    if (!particlesContainer) return;

    // Clear existing particles
    particlesContainer.innerHTML = '';

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 8 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDuration = `${Math.random() * 20 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particlesContainer.appendChild(particle);
    }
}

// Initialize scroll animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
}


// Setup intervals
function setupIntervals() {
    // Update safety score periodically
    setInterval(updateSafetyScore, 30000);

    // Simulate wearable data changes
    setInterval(updateWearableData, 15000);

    // Check for emergency timeout
    setInterval(checkEmergencyTimeout, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Navbar and Profile Menu
    document.getElementById('panicBtnMini')?.addEventListener('click', activatePanic);
    document.getElementById('profileAvatar')?.addEventListener('click', toggleProfileMenu);
    document.getElementById('showSettingsLink')?.addEventListener('click', showSettings);
    document.getElementById('showEmergencyContactsLink')?.addEventListener('click', showEmergencyContacts);
    document.getElementById('showSafetyTipsLink')?.addEventListener('click', showSafetyTips);
    document.getElementById('showHelpCenterLink')?.addEventListener('click', showHelpCenter);
    document.getElementById('logoutLink')?.addEventListener('click', logout);

    // Dashboard Toggles
    document.getElementById('toggleLocationSwitch')?.addEventListener('click', toggleLocation);
    document.getElementById('toggleVoiceGuardianSwitch')?.addEventListener('click', toggleVoiceGuardian);

    // Biometric Toggles (using event delegation)
    document.querySelectorAll('.biometric-options .toggle-switch').forEach(el => {
        el.addEventListener('click', (e) => {
            const type = e.currentTarget.dataset.biometricType;
            if (type) toggleBiometric(type);
        });
    });

    // Route Planning Buttons
    document.getElementById('planSafestRouteBtn')?.addEventListener('click', () => planRoute('safest'));
    document.getElementById('planFastestRouteBtn')?.addEventListener('click', () => planRoute('fastest'));
    document.getElementById('planWellLitRouteBtn')?.addEventListener('click', () => planRoute('well-lit'));

    // Fake Call Buttons
    document.getElementById('triggerMomCallBtn')?.addEventListener('click', () => triggerFakeCall('mom'));
    document.getElementById('triggerBossCallBtn')?.addEventListener('click', () => triggerFakeCall('boss'));
    document.getElementById('triggerEmergencyCallBtn')?.addEventListener('click', () => triggerFakeCall('emergency'));
    document.getElementById('toggleFakeCallAutoTrigger')?.addEventListener('click', toggleAutoFakeCall);

    // Emergency Panel Buttons
    document.getElementById('panicButton')?.addEventListener('click', activatePanic);
    document.getElementById('callEmergencyBtn')?.addEventListener('click', callEmergency);
    document.getElementById('sendAlertBtn')?.addEventListener('click', sendAlert);
    document.getElementById('startRecordingBtn')?.addEventListener('click', startRecording);
    document.getElementById('sendLocationBtn')?.addEventListener('click', sendLocation);
    document.getElementById('activateStrobeBtn')?.addEventListener('click', activateStrobe);

    // Chat Widget
    document.getElementById('chatInput')?.addEventListener('keypress', handleChatInput);
    document.getElementById('toggleChatLanguageBtn')?.addEventListener('click', toggleChatLanguage);
    document.getElementById('closeChatBtn')?.addEventListener('click', toggleChat);
    document.getElementById('showQuickResponsesBtn')?.addEventListener('click', showQuickResponses);
    document.getElementById('startVoiceMessageBtn')?.addEventListener('click', startVoiceMessage);
    document.getElementById('sendMessageBtn')?.addEventListener('click', sendMessage);
    document.getElementById('chatToggleBtn')?.addEventListener('click', toggleChat);

    // Quick Responses (using event delegation)
    quickResponses?.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-btn')) {
            sendQuickResponse(e.target.dataset.response);
        }
    });

    // Emergency Contacts Widget
    document.getElementById('closeEmergencyContactsBtn')?.addEventListener('click', closeEmergencyContacts);
    // Event delegation for call/message buttons within emergency contacts list
    document.querySelector('.emergency-contacts-list')?.addEventListener('click', (e) => {
        const contactItem = e.target.closest('.contact-item');
        if (!contactItem) return;

        const contactName = contactItem.querySelector('.contact-name').textContent;
        if (e.target.classList.contains('contact-btn')) {
            if (e.target.textContent.includes('📞')) {
                callContact(contactName);
            } else if (e.target.textContent.includes('💬')) {
                messageContact(contactName);
            }
        }
    });

    // Settings Modal
    document.getElementById('closeSettingsModalBtn')?.addEventListener('click', () => closeModal('settingsModal'));
    // Settings Toggles (using event delegation)
    document.querySelectorAll('#settingsModal .toggle-switch').forEach(el => {
        el.addEventListener('click', (e) => {
            const settingName = e.currentTarget.dataset.setting;
            if (settingName) toggleSetting(settingName);
        });
    });

    // PWA Install Prompt
    document.getElementById('installPWABtn')?.addEventListener('click', installPWA);
    document.getElementById('dismissPWABtn')?.addEventListener('click', dismissPWA);
    document.getElementById('showCommunityAlertsBtn')?.addEventListener('click', showCommunityAlerts);


    // Click outside to close menus
    document.addEventListener('click', (e) => {
        if (profileMenu && !profileMenu.contains(e.target) && !e.target.closest('#profileAvatar')) {
            profileMenu.classList.remove('active');
        }

        if (emergencyContactsWidget && !emergencyContactsWidget.contains(e.target) && !e.target.closest('#showEmergencyContactsLink')) {
            emergencyContactsWidget.classList.remove('active');
        }
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && appState.emergencyMode) {
            // Keep emergency mode active even when app is in background
            console.log('App hidden during emergency mode');
        }
    });
}

// Initialize chat
function initializeChat() {
    if (chatBody && appState.chatMessages.length > 0) {
        chatBody.innerHTML = ''; // Clear existing messages
        appState.chatMessages.forEach(message => {
             renderChatMessage(message);
        });
    }
    updateChatNotification();
}

// Update safety score based on various factors
function updateSafetyScore() {
    const hour = new Date().getHours();
    let newScore = appState.safetyScore;

    // Time-based adjustments
    if (hour > 22 || hour < 5) {
        newScore -= Math.floor(Math.random() * 8) + 2; // Night penalty
    } else if (hour > 6 && hour < 18) {
        newScore += Math.floor(Math.random() * 4) + 1; // Day bonus
    }

    // Stress level impact
    if (appState.stressLevel === 'High') {
        newScore -= Math.floor(Math.random() * 5) + 3;
    } else if (appState.stressLevel === 'Low') {
        newScore += Math.floor(Math.random() * 3) + 1;
    }

    // Location sharing bonus
    if (appState.locationSharing) {
        newScore += 2;
    }

    // Ensure score stays within bounds
    newScore = Math.max(30, Math.min(98, newScore));

    // Only update if there's a significant change
    if (Math.abs(newScore - appState.safetyScore) > 1) {
        appState.safetyScore = newScore;
        updateSafetyScoreUI();
    }
}

// Update safety score UI
function updateSafetyScoreUI() {
    if (!safetyScoreElement || !safetyProgress) return;

    const score = appState.safetyScore;

    safetyScoreElement.textContent = `${score}%`;
    safetyProgress.style.width = `${score}%`;

    // Update color based on score
    let color = '#06d6a0'; // Green (safe)
    if (score < 60) {
        color = '#ff6b6b'; // Red (danger)
    } else if (score < 80) {
        color = '#ffd166'; // Yellow (caution)
    }

    safetyScoreElement.style.color = color;
    safetyProgress.style.backgroundColor = color;

    // Show notification for significant changes
    if (score < 50) {
        showNotification('⚠️ Safety score is low. Consider extra precautions.');
    }
}

// Update wearable data
function updateWearableData() {
    if (!appState.wearableConnected) return;

    // Simulate realistic changes
    const heartRateChange = Math.floor(Math.random() * 8) - 4;
    appState.heartRate = Math.max(55, Math.min(130, appState.heartRate + heartRateChange));

    // Battery decreases gradually
    if (Math.random() < 0.3) { // 30% chance to decrease
        appState.wearableBattery = Math.max(0, appState.wearableBattery - 1);
    }

    // Update stress level based on heart rate
    if (appState.heartRate > 100) {
        appState.stressLevel = 'High';
    } else if (appState.heartRate > 85) {
        appState.stressLevel = 'Medium';
    } else {
        appState.stressLevel = 'Low';
    }

    // Update UI elements
    updateWearableUI();

    // Handle low battery warning
    if (appState.wearableBattery === 15) {
        showNotification('⚠️ Your SafeWatch Pro battery is low. Please charge soon.');
    } else if (appState.wearableBattery === 5) {
        showNotification('🔋 Critical: SafeWatch Pro battery very low!');
    }
}

// Update wearable UI
function updateWearableUI() {
    const heartRateEl = document.querySelector('.heart-rate');
    const stressLevelEl = document.querySelector('.stress-level');
    const deviceStatusEl = document.querySelector('.device-status');

    if (heartRateEl) {
        heartRateEl.textContent = `❤️ Heart Rate: ${appState.heartRate} BPM`;
    }

    if (stressLevelEl) {
        const stressEmoji = appState.stressLevel === 'High' ? '😰' :
                           appState.stressLevel === 'Medium' ? '😐' : '😌';
        stressLevelEl.textContent = `${stressEmoji} Stress Level: ${appState.stressLevel}`;
    }

    if (deviceStatusEl) {
        const batteryIcon = appState.wearableBattery > 50 ? '🔋' :
                           appState.wearableBattery > 20 ? '🪫' : '🔴';
        deviceStatusEl.textContent = `Connected ${batteryIcon} ${appState.wearableBattery}% Battery`;
    }
}

// Check for emergency timeout
function checkEmergencyTimeout() {
    if (appState.emergencyMode && appState.lastEmergencyAlert) {
        const timeDiff = Date.now() - appState.lastEmergencyAlert;

        // Auto-deactivate after 30 minutes if no interaction
        if (timeDiff > 1800000) { // 30 minutes
            showNotification('⏰ Emergency mode auto-deactivated after 30 minutes of inactivity.');
            deactivatePanic();
        }
    }
}

// Check URL for emergency mode
function checkUrlForEmergency() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('emergency') === 'true') {
        activatePanic();
    }
}

// Load settings from localStorage with error handling
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('safeSpaceSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            appState = { ...appState, ...parsed };

            // Update UI to reflect loaded settings
            updateSettingsUI();

            console.log('Settings loaded successfully');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('⚠️ Error loading saved settings. Using defaults.');
    }
}

// Update settings UI
function updateSettingsUI() {
    document.querySelectorAll('.toggle-switch[data-setting]').forEach(switchEl => {
        const settingName = switchEl.getAttribute('data-setting');
        if (appState[settingName] !== undefined) {
            if (appState[settingName]) {
                switchEl.classList.add('active');
            } else {
                switchEl.classList.remove('active');
            }
        }
    });

    // Update biometric toggles specifically
    document.querySelectorAll('.biometric-options .toggle-switch').forEach(switchEl => {
        const type = switchEl.dataset.biometricType;
        if (type && appState.biometrics[type] !== undefined) {
            if (appState.biometrics[type]) {
                switchEl.classList.add('active');
            } else {
                switchEl.classList.remove('active');
            }
        }
    });

    // Update location and voice guardian toggles
    const locationSwitch = document.getElementById('toggleLocationSwitch');
    if (locationSwitch) {
        if (appState.locationSharing) {
            locationSwitch.classList.add('active');
        } else {
            locationSwitch.classList.remove('active');
        }
    }

    const voiceGuardianSwitch = document.getElementById('toggleVoiceGuardianSwitch');
    if (voiceGuardianSwitch) {
        if (appState.voiceGuardianActive) {
            voiceGuardianSwitch.classList.add('active');
        } else {
            voiceGuardianSwitch.classList.remove('active');
        }
    }
}


// Save settings to localStorage with error handling
function saveSettings() {
    try {
        const settingsToSave = {
            locationSharing: appState.locationSharing,
            voiceGuardianActive: appState.voiceGuardianActive,
            biometrics: appState.biometrics,
            fakeCallAutoTrigger: appState.fakeCallAutoTrigger,
            recordingEnabled: appState.recordingEnabled,
            anonymous: appState.anonymous,
            alerts: appState.alerts,
            tips: appState.tips,
            emergency: appState.emergency
        };

        localStorage.setItem('safeSpaceSettings', JSON.stringify(settingsToSave));
        console.log('Settings saved successfully');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('⚠️ Error saving settings. Changes may not persist.');
    }
}

// Toggle profile menu
function toggleProfileMenu() {
    if (profileMenu) {
        profileMenu.classList.toggle('active');
        // Close other open menus
        if (emergencyContactsWidget) {
            emergencyContactsWidget.classList.remove('active');
        }
    }
}

// Show settings modal
function showSettings() {
    if (settingsModal) {
        settingsModal.classList.add('active');
    }
    if (profileMenu) {
        profileMenu.classList.remove('active');
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Toggle any setting with validation
function toggleSetting(settingName) {
    if (appState.hasOwnProperty(settingName)) {
        appState[settingName] = !appState[settingName];
        saveSettings();

        // Update UI
        const switchEl = document.querySelector(`.toggle-switch[data-setting="${settingName}"]`);
        if (switchEl) {
            switchEl.classList.toggle('active');
        }

        const displayName = settingName.replace(/([A-Z])/g, ' $1').toLowerCase();
        showNotification(`${displayName} ${appState[settingName] ? 'enabled' : 'disabled'}`);
    }
}


// Show emergency contacts
function showEmergencyContacts() {
    if (emergencyContactsWidget) {
        emergencyContactsWidget.classList.add('active');
        renderEmergencyContacts();
    }
    if (profileMenu) {
        profileMenu.classList.remove('active');
    }
}


// Close emergency contacts
function closeEmergencyContacts() {
    if (emergencyContactsWidget) {
        emergencyContactsWidget.classList.remove('active');
    }
}

// Call a contact with better error handling
function callContact(contactName) {
    const contact = appState.emergencyContacts.find(c =>
        c.name.toLowerCase().includes(contactName.toLowerCase())
    );

    if (contact) {
        showNotification(`📞 Calling ${contact.name}...`);

        // Log the call attempt
        console.log(`Attempting to call ${contact.name} at ${contact.number}`);

        // In a real app, this would use the device's phone capabilities
        // window.location.href = `tel:${contact.number}`;

        // Simulate call connection
        setTimeout(() => {
            showNotification(`📞 Connected to ${contact.name}`);
        }, 2000);
    } else {
        showNotification('❌ Contact not found');
    }
}

// Message a contact
function messageContact(contactName) {
    const contact = appState.emergencyContacts.find(c =>
        c.name.toLowerCase().includes(contactName.toLowerCase())
    );

    if (contact) {
        showNotification(`💬 Messaging ${contact.name}...`);

        // In a real app, this would use the device's SMS capabilities
        // window.location.href = `sms:${contact.number}`;

        // Simulate message sent
        setTimeout(() => {
            showNotification(`💬 Message sent to ${contact.name}`);
        }, 1000);
    } else {
        showNotification('❌ Contact not found');
    }
}

// Show safety tips
function showSafetyTips() {
    showNotification('🛡️ Loading safety tips...');
    if (profileMenu) {
        profileMenu.classList.remove('active');
    }
}

// Show help center
function showHelpCenter() {
    showNotification('❓ Loading help center...');
    if (profileMenu) {
        profileMenu.classList.remove('active');
    }
}

// Logout function
function logout() {
    showNotification('🚪 Logging out...');

    // Clear any ongoing processes
    if (appState.emergencyMode) {
        deactivatePanic();
    }

    // In a real app, this would clear authentication and redirect.
    // The login.html file was not provided.
    setTimeout(() => {
        // window.location.href = 'login.html';
        console.log("Redirecting to login page...");
    }, 1500);
}

// Toggle location sharing
function toggleLocation() {
    appState.locationSharing = !appState.locationSharing;
    saveSettings();

    const switchEl = document.getElementById('toggleLocationSwitch');
    if (switchEl) {
        switchEl.classList.toggle('active');
    }

    showNotification(`📍 Location sharing ${appState.locationSharing ? 'enabled' : 'disabled'}`);
}

// Toggle voice guardian
function toggleVoiceGuardian() {
    appState.voiceGuardianActive = !appState.voiceGuardianActive;
    saveSettings();

    const switchEl = document.getElementById('toggleVoiceGuardianSwitch');
    if (switchEl) {
        switchEl.classList.toggle('active');
    }

    const voiceModeEl = document.querySelector('.voice-mode');
    if (voiceModeEl) {
        voiceModeEl.textContent = `Listening Mode: ${appState.voiceGuardianActive ? 'ON' : 'OFF'}`;
    }

    showNotification(`🎤 Voice Guardian ${appState.voiceGuardianActive ? 'activated' : 'deactivated'}`);
}

// Toggle biometric setting
function toggleBiometric(type) {
    if (appState.biometrics.hasOwnProperty(type)) {
        appState.biometrics[type] = !appState.biometrics[type];
        saveSettings();

        const switchEl = document.querySelector(`.toggle-switch[data-biometric-type="${type}"]`);
        if (switchEl) {
            switchEl.classList.toggle('active');
        }

        const displayName = type.charAt(0).toUpperCase() + type.slice(1);
        showNotification(`${displayName} biometric ${appState.biometrics[type] ? 'enabled' : 'disabled'}`);
    }
}

// Plan a route
function planRoute(type) {
    const routeTypes = {
        'safest': 'Calculating safest route based on community reports and well-lit paths...',
        'fastest': 'Calculating fastest route with safety considerations...',
        'well-lit': 'Finding route with best lighting and visibility...'
    };

    const message = routeTypes[type] || 'Calculating route...';
    showNotification(`🗺️ ${message}`);

    // Simulate route calculation
    setTimeout(() => {
        const estimatedTime = Math.floor(Math.random() * 15) + 5;
        const safetyRating = (Math.random() * 3 + 7).toFixed(1);

        const routeDetail1 = document.querySelector('.route-detail:nth-child(1)');
        const routeDetail2 = document.querySelector('.route-detail:nth-child(2)');

        if (routeDetail1) {
            routeDetail1.textContent = `🚶‍♀️ Estimated time: ${estimatedTime} min`;
        }
        if (routeDetail2) {
            routeDetail2.textContent = `🛡️ Safety rating: ${safetyRating}/10`;
        }

        showNotification(`✅ Route calculated! ${estimatedTime} min, Safety: ${safetyRating}/10`);
    }, 2000);
}

// Trigger fake call
function triggerFakeCall(type) {
    const callTypes = {
        'mom': { caller: 'Mom', ringtone: 'family_ringtone.mp3' },
        'boss': { caller: 'Work', ringtone: 'professional_ringtone.mp3' },
        'emergency': { caller: 'Emergency Contact', ringtone: 'urgent_ringtone.mp3' }
    };

    const callInfo = callTypes[type] || { caller: 'Unknown', ringtone: 'default.mp3' };

    showNotification(`📞 Incoming call from ${callInfo.caller} (simulated)`);

    // In a real app, this would play a ringtone and show a fake call screen
    console.log(`Playing ringtone: ${callInfo.ringtone}`);

    // Simulate call screen
    setTimeout(() => {
        showNotification(`📞 Fake call from ${callInfo.caller} active`);
    }, 1000);
}

// Toggle auto fake call
function toggleAutoFakeCall() {
    appState.fakeCallAutoTrigger = !appState.fakeCallAutoTrigger;
    saveSettings();

    const switchEl = document.getElementById('toggleFakeCallAutoTrigger');
    if (switchEl) {
        switchEl.classList.toggle('active');
    }

    showNotification(`📞 Auto fake call ${appState.fakeCallAutoTrigger ? 'enabled' : 'disabled'}`);
}

// Center map on user
function centerOnUser() {
    showNotification('📍 Centering map on your location...');

    // Simulate GPS acquisition
    setTimeout(() => {
        showNotification(`📍 Location: ${appState.currentLocation.area}`);
    }, 1500);
}

// Show safe spaces on map
function showSafeSpaces() {
    showNotification('🏠 Loading safe spaces in your area...');

    // Simulate loading safe spaces
    setTimeout(() => {
        const count = Math.floor(Math.random() * 8) + 3;
        showNotification(`🏠 Found ${count} safe spaces nearby`);
    }, 2000);
}

// Show incidents on map
function showIncidents() {
    showNotification('⚠️ Loading recent incidents in your area...');

    // Simulate loading incidents
    setTimeout(() => {
        const count = Math.floor(Math.random() * 5) + 1;
        showNotification(`⚠️ ${count} incidents reported in the last 24 hours`);
    }, 2000);
}

// Activate panic mode with enhanced features
function activatePanic() {
    if (appState.emergencyMode) {
        // Confirm deactivation
        if (confirm('Are you sure you want to deactivate emergency mode?')) {
            deactivatePanic();
        }
        return;
    }

    console.log('Activating panic mode...');

    appState.emergencyMode = true;
    appState.lastEmergencyAlert = Date.now();

    // Update UI
    if (emergencyStatusBar) {
        emergencyStatusBar.classList.add('active');
    }
    document.body.classList.add('emergency-mode');

    // Execute emergency protocols
    executeEmergencyProtocols();

    // Main notification
    showNotification('🚨 Emergency mode activated! Help is on the way.', 5000);

    // Simulate emergency response
    setTimeout(() => {
        showNotification('👮 Emergency services have been notified');
        addChatMessage('bot', '🚨 Emergency services have been alerted and are being dispatched to your location.');
    }, 3000);

    setTimeout(() => {
        showNotification('📱 Emergency contacts have been notified');
        addChatMessage('bot', '📱 Your emergency contacts have been notified and are receiving your location updates.');
    }, 5000);
}

// Execute emergency protocols
function executeEmergencyProtocols() {
    // Send location
    sendLocation();

    // Send alert to contacts
    sendAlert();

    // Start recording if enabled
    if (appState.recordingEnabled) {
        startRecording();
    }

    // Log emergency activation
    console.log('Emergency protocols executed:', {
        timestamp: new Date().toISOString(),
        location: appState.currentLocation,
        contacts: appState.emergencyContacts.length,
        recording: appState.recordingEnabled
    });
}

// Deactivate panic mode
function deactivatePanic() {
    console.log('Deactivating panic mode...');

    appState.emergencyMode = false;
    appState.lastEmergencyAlert = null;

    // Update UI
    if (emergencyStatusBar) {
        emergencyStatusBar.classList.remove('active');
    }
    document.body.classList.remove('emergency-mode');

    // Stop any ongoing processes
    if (appState.isRecording) {
        stopRecording();
    }

    if (appState.strobeActive) {
        deactivateStrobe();
    }

    showNotification('🟢 Emergency mode deactivated');
    addChatMessage('bot', '🟢 Emergency mode has been deactivated. I hope you\'re safe now.');
}

// Call emergency services
function callEmergency() {
    showNotification('📞 Calling emergency services...');
    console.log('Calling emergency services');

    // In a real app: window.location.href = "tel:911";

    // Simulate call
    setTimeout(() => {
        showNotification('📞 Connected to emergency services');
    }, 2000);
}

// Send alert to contacts
function sendAlert() {
    const { lat, lng, area } = appState.currentLocation;
    const alertMessage = `🚨 EMERGENCY ALERT: I need help! My location: ${area} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    showNotification('📱 Sending alerts to emergency contacts...');

    // Log alert details
    console.log('Emergency alert sent:', {
        message: alertMessage,
        contacts: appState.emergencyContacts,
        timestamp: new Date().toISOString()
    });

    // Simulate sending to each contact
    appState.emergencyContacts.forEach((contact, index) => {
        setTimeout(() => {
            showNotification(`📱 Alert sent to ${contact.name}`);
        }, (index + 1) * 1000);
    });
}

// Start audio recording
function startRecording() {
    if (appState.isRecording) return;

    appState.isRecording = true;
    showNotification('🎤 Audio recording started - evidence being saved');

    // In a real app, this would use the MediaRecorder API
    console.log('Audio recording started');

    // Simulate recording
    setTimeout(() => {
        if (appState.isRecording) {
            showNotification('🎤 Recording continues... Evidence secured');
        }
    }, 30000);
}

// Stop audio recording
function stopRecording() {
    if (!appState.isRecording) return;

    appState.isRecording = false;
    showNotification('🎤 Audio recording stopped and saved');
    console.log('Audio recording stopped');
}

// Send location to contacts
function sendLocation() {
    const { lat, lng, area } = appState.currentLocation;
    const locationMessage = `📍 Location shared: ${area} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    showNotification(locationMessage);

    // Log location sharing
    console.log('Location shared:', {
        location: appState.currentLocation,
        timestamp: new Date().toISOString()
    });
}

// Activate strobe light
function activateStrobe() {
    if (appState.strobeActive) return;

    appState.strobeActive = true;
    showNotification('💡 Strobe light activated - look for flashing light');
    document.body.classList.add('strobe-light');

    // Turn off after 60 seconds
    setTimeout(() => {
        deactivateStrobe();
    }, 60000);
}

// Deactivate strobe light
function deactivateStrobe() {
    appState.strobeActive = false;
    document.body.classList.remove('strobe-light');
    showNotification('💡 Strobe light deactivated');
}

// Toggle chat
function toggleChat() {
    appState.chatOpen = !appState.chatOpen;

    if (chatWidget) {
        chatWidget.classList.toggle('active');
    }

    if (appState.chatOpen) {
        appState.unreadMessages = 0;
        updateChatNotification();

        // Focus input when opening
        if (chatInput) {
            setTimeout(() => chatInput.focus(), 100);
        }
    }
}

// Handle chat input
function handleChatInput(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Send chat message
function sendMessage() {
    if(!chatInput) return;
    const message = chatInput.value.trim();
    if (!message) return;

    // Clear input
    chatInput.value = '';

    // Add user message
    addChatMessage('user', message);

    // Simulate typing indicator
    setTimeout(() => {
        addChatMessage('bot', '...', true);

        // Generate bot response
        setTimeout(() => {
            const response = generateBotResponse(message);
            updateLastMessage(response);
        }, 1000 + Math.random() * 2000);
    }, 500);
}

// Add chat message
function addChatMessage(sender, content, isTyping = false) {
    const message = {
        id: utils.generateId(),
        sender,
        content,
        timestamp: new Date(),
        isTyping
    };

    if (isTyping) {
        // Check if last message was a typing indicator and replace it
        const lastMessage = appState.chatMessages[appState.chatMessages.length - 1];
        if (lastMessage && lastMessage.isTyping) {
            appState.chatMessages[appState.chatMessages.length - 1] = message;
        } else {
            appState.chatMessages.push(message);
        }
    } else {
         // If last message was a typing indicator, replace it. Otherwise, push a new message.
        const lastMessageIndex = appState.chatMessages.findIndex(m => m.isTyping);
        if (lastMessageIndex > -1) {
            appState.chatMessages[lastMessageIndex] = message;
        } else {
            appState.chatMessages.push(message);
        }
    }


    renderAllChatMessages();

    // Update unread count if chat is closed
    if (!appState.chatOpen && sender === 'bot' && !isTyping) {
        appState.unreadMessages++;
        updateChatNotification();
    }
}


// Update last message (for replacing typing indicator)
function updateLastMessage(content) {
    const lastMessageIndex = appState.chatMessages.findIndex(m => m.isTyping);

    if (lastMessageIndex !== -1) {
        appState.chatMessages[lastMessageIndex].content = content;
        appState.chatMessages[lastMessageIndex].isTyping = false;
        appState.chatMessages[lastMessageIndex].timestamp = new Date(); // Update timestamp
        renderAllChatMessages();
    }
}


// Render a single chat message
function renderChatMessage(message) {
    if (!chatBody) return;

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${message.sender}`;
    messageEl.setAttribute('data-id', message.id);

    const avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';
    avatarEl.textContent = message.sender === 'bot' ? '🤖' : '👤';


    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    if(message.isTyping){
        contentEl.innerHTML = '<span class="typing-indicator"><span>.</span><span>.</span><span>.</span></span>';
    } else {
        contentEl.textContent = message.content;
    }


    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);

    chatBody.appendChild(messageEl);
}

// Re-render all messages from state
function renderAllChatMessages() {
    if (!chatBody) return;
    chatBody.innerHTML = '';
    appState.chatMessages.forEach(msg => renderChatMessage(msg));
    chatBody.scrollTop = chatBody.scrollHeight;
}


// Generate bot response
function generateBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Emergency keywords
    if (lowerMessage.includes('help') || lowerMessage.includes('emergency') ||
        lowerMessage.includes('danger') || lowerMessage.includes('scared')) {
        return "I'm here to help! If you're in immediate danger, please use the panic button or call emergency services. Would you like me to guide you through the safety features?";
    }

    // Safety-related responses
    if (lowerMessage.includes('safe') || lowerMessage.includes('security')) {
        return "Your safety is my priority! I can help you with route planning, emergency contacts, or safety tips. What would you like to know about?";
    }

    // Location-related
    if (lowerMessage.includes('location') || lowerMessage.includes('where')) {
        return `You're currently in ${appState.currentLocation.area}. Your location sharing is ${appState.locationSharing ? 'enabled' : 'disabled'}. Would you like me to help you find safe spaces nearby?`;
    }

    // Stress/anxiety responses
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious') ||
        lowerMessage.includes('worried') || lowerMessage.includes('afraid')) {
        return "I understand you're feeling stressed. Try taking slow, deep breaths. Remember, you have safety tools available. Your current stress level is showing as " + appState.stressLevel + ". Would you like some calming techniques?";
    }

    // Device/wearable questions
    if (lowerMessage.includes('watch') || lowerMessage.includes('device') ||
        lowerMessage.includes('battery')) {
        return `Your SafeWatch Pro is ${appState.wearableConnected ? 'connected' : 'disconnected'} with ${appState.wearableBattery}% battery. Heart rate: ${appState.heartRate} BPM. Everything looks normal!`;
    }

    // General responses
    const responses = [
        "I'm here to support you 24/7. How can I help keep you safe today?",
        "Your safety score is currently " + appState.safetyScore + "%. Is there anything specific you'd like to discuss?",
        "I'm monitoring your wellbeing. Feel free to share anything that's concerning you.",
        "Remember, you're not alone. I'm here whenever you need support or safety assistance.",
        "Your safety network is active and ready. How are you feeling right now?",
        "I'm glad you reached out. What would you like to talk about or get help with?",
        "Your location is being monitored for safety. Is there anything specific you need help with today?",
        "I'm here to listen and help. Whether it's safety planning or just someone to talk to, I've got you covered."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

// Update chat notification
function updateChatNotification() {
    if (!chatNotificationBadge) return;

    if (appState.unreadMessages > 0) {
        chatNotificationBadge.textContent = appState.unreadMessages;
        chatNotificationBadge.style.display = 'flex';
    } else {
        chatNotificationBadge.style.display = 'none';
    }
}


// Send quick response
function sendQuickResponse(response) {
    addChatMessage('user', response);

    // Generate contextual bot response
    setTimeout(() => {
        let botResponse = "";

        switch (response) {
            case "I need help": // Changed from "Need help" to match HTML
                botResponse = "I'm here to help! I can assist with emergency contacts, route planning, safety tips, or activate emergency protocols. What kind of help do you need?";
                break;
            case "I feel unsafe":
                botResponse = "I'm sorry to hear that. Your safety is my priority. I can help you find the nearest safe space, contact emergency services, or reach out to your emergency contacts. What would help you feel safer right now?";
                break;
            case "Emergency":
                botResponse = "If you're in immediate danger, please activate the panic button. I can also alert your emergency contacts and emergency services. What action would you like to take?";
                break;
            case "I'm okay now": // Changed from "I'm okay" to match HTML
                botResponse = "I'm glad to hear you're okay! I'm still here monitoring your safety. Your current safety score is " + appState.safetyScore + "%. Is there anything I can help you with?";
                break;
            default:
                botResponse = "Thank you for letting me know. How else can I assist you today?";
        }

        addChatMessage('bot', botResponse);
    }, 800);
}

// Show notification
function showNotification(message, duration = 3000) {
    if (!notification) return;

    notification.textContent = message;
    notification.classList.add('active');

    // Auto-hide after duration
    setTimeout(() => {
        notification.classList.remove('active');
    }, duration);
}

// Install PWA
function installPWA() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('PWA installed');
                showNotification('✅ SafeSpace app installed successfully!');
            }
            window.deferredPrompt = null;
            if (pwaInstallPrompt) {
                pwaInstallPrompt.classList.remove('active');
            }
        });
    }
}

// Dismiss PWA install prompt
function dismissPWA() {
    if (pwaInstallPrompt) {
        pwaInstallPrompt.classList.remove('active');
    }
}

// Share location with specific contact
function shareLocationWith(contactName) {
    const contact = appState.emergencyContacts.find(c =>
        c.name.toLowerCase().includes(contactName.toLowerCase())
    );

    if (contact) {
        const locationMessage = `📍 Location shared with ${contact.name}: ${appState.currentLocation.area}`;
        showNotification(locationMessage);

        // In a real app, this would send the location via SMS or app notification
        console.log(`Location shared with ${contact.name}:`, appState.currentLocation);
    } else {
        showNotification('❌ Contact not found');
    }
}

// Add emergency contact
function addEmergencyContact(name, number) {
    const newContact = {
        name,
        number,
        avatar: '👤',
        id: utils.generateId()
    };

    // Corrected typo: appState.emergency-Contacts -> appState.emergencyContacts
    appState.emergencyContacts.push(newContact);
    saveSettings();

    showNotification(`✅ ${name} added to emergency contacts`);

    // Refresh emergency contacts UI if visible
    if (emergencyContactsWidget && emergencyContactsWidget.classList.contains('active')) {
        renderEmergencyContacts();
    }
}

// Remove emergency contact
function removeEmergencyContact(contactId) {
    // Corrected typo: appState.emergency-Contacts -> appState.emergencyContacts
    const index = appState.emergencyContacts.findIndex(c => c.id === contactId);
    if (index > -1) {
        const contact = appState.emergencyContacts[index];
        appState.emergencyContacts.splice(index, 1);
        saveSettings();

        showNotification(`🗑️ ${contact.name} removed from emergency contacts`);

        // Refresh emergency contacts UI if visible
        if (emergencyContactsWidget && emergencyContactsWidget.classList.contains('active')) {
            renderEmergencyContacts();
        }
    }
}

// Render emergency contacts
function renderEmergencyContacts() {
    const contactsList = document.querySelector('.emergency-contacts-list');
    if (!contactsList) return;

    contactsList.innerHTML = '';

    appState.emergencyContacts.forEach(contact => {
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        // Added data attributes for easier event delegation for call/message
        contactEl.innerHTML = `
            <div class="contact-avatar">${contact.avatar}</div>
            <div class="contact-info">
                <div class="contact-name">${contact.name}</div>
                <div class="contact-number">${contact.number}</div>
            </div>
            <div class="contact-actions">
                <button class="contact-btn" data-action="call" data-contact-name="${contact.name}">📞</button>
                <button class="contact-btn" data-action="message" data-contact-name="${contact.name}">💬</button>
            </div>
        `;
        contactsList.appendChild(contactEl);
    });
}


// Check for threats based on various factors
function checkForThreats() {
    const threats = [];

    // Check time of day
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
        threats.push({ type: 'time', level: 'medium', message: 'Late night hours - increased vigilance recommended' });
    }

    // Check stress level
    if (appState.stressLevel === 'High') {
        threats.push({ type: 'stress', level: 'high', message: 'High stress detected - consider using calming techniques' });
    }

    // Check device battery
    if (appState.wearableBattery < 20) {
        threats.push({ type: 'battery', level: 'medium', message: 'Low device battery - charge soon' });
    }

    // Check safety score
    if (appState.safetyScore < 50) {
        threats.push({ type: 'safety', level: 'high', message: 'Low safety score - extra precautions advised' });
    }

    return threats;
}

// Handle device orientation change
function handleOrientationChange() {
    // Recalculate particle positions
    setTimeout(() => {
        initParticles();
    }, 100);
}

// Handle online/offline status
function handleConnectionChange() {
    if (navigator.onLine) {
        showNotification('🌐 Connection restored');
    } else {
        showNotification('⚠️ Connection lost - some features may be limited');
    }
}

// Initialize service worker for PWA
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        // NOTE: The 'sw.js' file is required for PWA functionality.
        // This file was not provided and needs to be created for this to work.
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }
}

// Handle app lifecycle events
function handleAppLifecycle() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('App went to background');
        } else {
            console.log('App returned to foreground');
            // Refresh data when app returns
            updateSafetyScore();
            updateWearableData();
        }
    });

    // Handle online/offline
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);

    // Handle orientation change
    window.addEventListener('orientationchange', handleOrientationChange);
}

// ---- Functions for undefined handlers ----
function showCommunityAlerts() {
    showNotification('INFO: Community Alerts feature not implemented yet.');
    console.log('showCommunityAlerts called');
}

function toggleChatLanguage() {
    showNotification('INFO: Language toggle feature not implemented yet.');
    console.log('toggleChatLanguage called');
}

function startVoiceMessage() {
    showNotification('INFO: Voice message feature not implemented.');
    console.log('startVoiceMessage called');
}

function showQuickResponses() {
    if(quickResponses) {
        quickResponses.classList.toggle('active');
    }
    console.log('showQuickResponses called');
}


// Cleanup function
function cleanup() {
    // Clear any ongoing intervals
    if (window.safetyScoreInterval) {
        clearInterval(window.safetyScoreInterval);
    }
    if (window.wearableDataInterval) {
        clearInterval(window.wearableDataInterval);
    }
    if (window.emergencyTimeoutInterval) {
        clearInterval(window.emergencyTimeoutInterval);
    }

    // Stop any recordings
    if (appState.isRecording) {
        stopRecording();
    }

    // Deactivate emergency mode
    if (appState.emergencyMode) {
        deactivatePanic();
    }

    console.log('App cleanup completed');
}

// Define the function fetchUserProfile somewhere before it is called
// This function is actually imported from api.js, but keeping a local definition
// for fallback or if api.js is not loaded.
// For this project, it's better to rely on the imported function.
// function fetchUserProfile() {
//     console.log('Mock API: Fetching user profile...');
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve(mockDatabase); // mockDatabase would need to be defined here or imported
//         }, 800);
//     });
// }


// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    handleAppLifecycle();
    initMap(); // <-- Add this line to call the map function
    initServiceWorker();

    // Set up cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
});

// Leaflet Map Initialization
function initMap() {
    try {
        // Check if the map container exists
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            // 1. Center the map on Kolkata with a good zoom level
            const map = L.map('map').setView([22.5726, 88.3639], 5); // Centered on Kolkata

            // 2. Add the tile layer from OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // 3. Add a "Safe Space" marker in Kolkata
            //    We are using the default red marker for now to ensure it works.
            L.marker([22.5726, 88.3639]).addTo(map)
                .bindPopup('<b>Community Safe Space</b><br>Park Street Area, Kolkata.');

            // 4. Add markers for the demo locations in New York City
            L.marker([40.73, -74.00]).addTo(map)
                .bindPopup('<b>Safe Space (NYC)</b><br>Demo location.');

            L.marker([40.71, -74.01]).addTo(map)
                .bindPopup('<b>Incident Reported (NYC)</b><br>Demo location.');
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        showNotification('⚠️ Failed to initialize map. Some features may be unavailable.');
    }
}

// Export for testing (if needed)
// This block is typically for Node.js environments or module bundlers.
// For a browser-only project, it might not be strictly necessary unless
// you're using a build step that processes modules.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        appState,
        utils,
        initApp,
        activatePanic,
        deactivatePanic,
        updateSafetyScore,
        sendMessage,
        addChatMessage
    };
}
