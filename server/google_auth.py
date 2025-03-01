import os
from functools import wraps
from flask import request, jsonify, session, redirect, url_for
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import json

# Get Google OAuth credentials from environment variables
CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/auth/callback')

# This would typically be replaced by a database in production
user_database = {}

def get_google_auth_url():
    """Generate the Google OAuth URL for authorization"""
    # Authorization URL
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    
    # Parameters
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    # Build URL
    param_str = "&".join([f"{key}={value}" for key, value in params.items()])
    auth_url = f"{base_url}?{param_str}"
    
    return auth_url

def exchange_code_for_token(code):
    """Exchange authorization code for access token"""
    import requests
    
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        return None
    
    return response.json()

def verify_google_token(token):
    """Verify Google ID token and extract user information"""
    try:
        # Specify the CLIENT_ID of the app that accesses the backend
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        
        # ID token is valid, extract user information
        user_info = {
            "user_id": idinfo['sub'],
            "email": idinfo['email'],
            "name": idinfo.get('name', ''),
            "picture": idinfo.get('picture', '')
        }
        
        # In a real application, you would store/retrieve this user from your database
        user_database[idinfo['sub']] = user_info
        
        return user_info
    except ValueError:
        # Invalid token
        return None

def get_user_by_token(auth_header):
    """Get user information from token in authorization header"""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split('Bearer ')[1]
    return verify_google_token(token)

def verify_auth_token(f):
    """Decorator to verify authentication token for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        user = get_user_by_token(auth_header)
        
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        # Add user to request context for route handlers
        request.user = user
        return f(*args, **kwargs)
    return decorated_function 