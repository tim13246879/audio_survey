// Server API endpoints
const API_BASE_URL = 'http://localhost:5000/api';
const AUTH_LOGIN_URL = `${API_BASE_URL}/auth/login`;
const CALLBACK_URL = `${API_BASE_URL}/auth/callback`;

// DOM elements
const loginButton = document.getElementById('loginButton');
const authFlow = document.getElementById('authFlow');
const authStatus = document.getElementById('authStatus');
const authUrlElement = document.getElementById('authUrl');
const userInfo = document.getElementById('userInfo');
const userInfoContent = document.getElementById('userInfoContent');
const tokenInfo = document.getElementById('tokenInfo');
const tokenInfoContent = document.getElementById('tokenInfoContent');
const authHeader = document.getElementById('authHeader');

// Store auth data
let idToken = localStorage.getItem('idToken');
let userData = JSON.parse(localStorage.getItem('userData') || 'null');

// Check if user is already logged in (token exists in localStorage)
function checkLoginStatus() {
    if (idToken && userData) {
        displayUserInfo();
    }
}

// Initialize the application
function init() {
    loginButton.addEventListener('click', initiateLogin);
    checkLoginStatus();
    
    // Check if we're returning from the OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        processCallback(code);
    }
}

// Start the login process
async function initiateLogin() {
    try {
        authStatus.textContent = 'Initiating login...';
        authFlow.classList.remove('hidden');
        
        // Get the auth URL from the server
        const response = await fetch(AUTH_LOGIN_URL);
        const data = await response.json();
        
        if (data.auth_url) {
            // Redirect to Google's auth URL
            window.location.href = data.auth_url;
        } else {
            authStatus.textContent = 'Error getting auth URL';
        }
    } catch (error) {
        console.error('Login initiation error:', error);
        authStatus.textContent = `Error: ${error.message}`;
    }
}

// Simulate a successful callback from Google
function simulateCallback() {
    authStatus.textContent = 'Simulating successful Google login...';
    
    // Mock token and user data
    const mockTokenResponse = {
        id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
            user_id: '123456789',
            email: 'user@example.com',
            name: 'Test User',
            picture: 'https://ui-avatars.com/api/?name=Test+User&background=random'
        }
    };
    
    // Save tokens and user data
    idToken = mockTokenResponse.id_token;
    userData = mockTokenResponse.user;
    
    // Store in localStorage (in a real app, you might use a more secure approach)
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Display the information
    displayTokenInfo(mockTokenResponse);
    displayUserInfo();
    
    authStatus.textContent = 'Authentication successful!';
}

// Process the callback from Google (with real auth code)
async function processCallback(code) {
    try {
        authStatus.textContent = 'Processing callback...';
        authFlow.classList.remove('hidden');
        
        const response = await fetch(CALLBACK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        const tokenData = await response.json();
        
        if (tokenData.status === 'success') {
            // Save tokens and user data
            idToken = tokenData.id_token;
            userData = tokenData.user;
            
            // Store in localStorage
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Display the information
            displayTokenInfo(tokenData);
            displayUserInfo();
            
            authStatus.textContent = 'Authentication successful!';
            
            // Clear the URL parameters
            window.history.replaceState({}, document.title, '/');
        } else {
            throw new Error(tokenData.message || 'Authentication failed');
        }
    } catch (error) {
        console.error('Callback processing error:', error);
        authStatus.textContent = `Error: ${error.message}`;
    }
}

// Display token information
function displayTokenInfo(tokenData) {
    tokenInfo.classList.remove('hidden');
    
    // Format and display token info
    const displayData = {
        id_token: `${tokenData.id_token.substring(0, 20)}...`,
        access_token: `${tokenData.access_token.substring(0, 10)}...`,
        refresh_token: tokenData.refresh_token ? `${tokenData.refresh_token.substring(0, 10)}...` : 'None'
    };
    
    tokenInfoContent.textContent = JSON.stringify(displayData, null, 2);
    authHeader.textContent = `Authorization: Bearer ${idToken.substring(0, 20)}...`;
}

// Display user information
function displayUserInfo() {
    loginButton.textContent = 'Already logged in';
    loginButton.disabled = true;
    
    userInfo.classList.remove('hidden');
    userInfoContent.textContent = JSON.stringify(userData, null, 2);
    
    // Add logout button if not already added
    if (!document.getElementById('logoutButton')) {
        const logoutButton = document.createElement('button');
        logoutButton.id = 'logoutButton';
        logoutButton.textContent = 'Logout';
        logoutButton.style.marginLeft = '10px';
        logoutButton.style.backgroundColor = '#db4437';
        logoutButton.addEventListener('click', logout);
        
        loginButton.parentNode.appendChild(logoutButton);
    }
}

// Handle logout
function logout() {
    // Clear tokens and user data
    localStorage.removeItem('idToken');
    localStorage.removeItem('userData');
    idToken = null;
    userData = null;
    
    // Reset UI
    loginButton.textContent = 'Login with Google';
    loginButton.disabled = false;
    
    userInfo.classList.add('hidden');
    tokenInfo.classList.add('hidden');
    authFlow.classList.add('hidden');
    
    // Remove logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.remove();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
