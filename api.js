/**
 * Mock API
 * This file simulates a backend server by providing functions that
 * return data asynchronously, using Promises to mimic network requests.
 */

const mockDatabase = {
    userName: 'Sarah Johnson',
    userStatus: 'Premium User',
    safetyScore: 87,
    wearable: {
        connected: true,
        battery: 84,
        heartRate: 72,
        stressLevel: 'Low',
    },
    emergencyContacts: [
        { name: 'Mom', number: '+1 234 567 8901', avatar: '👩' },
        { name: 'Sister', number: '+1 234 567 8902', avatar: '👧' },
        { name: 'Best Friend', number: '+1 234 567 8903', avatar: '👭' }
    ]
};

function fetchUserProfile() {
    console.log('Mock API: Fetching user profile...');
    // We wrap the data in a Promise to simulate a network request.
    // The setTimeout mimics network latency.
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockDatabase);
        }, 800); // 800ms delay
    });
}
