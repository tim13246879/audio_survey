from flask import Blueprint, request, jsonify, redirect, url_for
from google_auth import get_google_auth_url, exchange_code_for_token, verify_google_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET'])
def login():
    """
    Redirect user to Google login page
    """
    auth_url = get_google_auth_url()
    return jsonify({"auth_url": auth_url})

@auth_bp.route('/callback', methods=['GET'])
def callback():
    """
    Handle Google OAuth callback
    """
    # Get authorization code from query parameters
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "Authorization code missing"}), 400
    
    # Exchange authorization code for tokens
    token_response = exchange_code_for_token(code)
    if not token_response:
        return jsonify({"error": "Failed to exchange authorization code for token"}), 400
    
    # Extract ID token
    id_token = token_response.get('id_token')
    if not id_token:
        return jsonify({"error": "ID token missing from response"}), 400
    
    # Verify the ID token and get user info
    user_info = verify_google_token(id_token)
    if not user_info:
        return jsonify({"error": "Failed to verify ID token"}), 400
    
    # Return tokens and user info to the client
    return jsonify({
        "message": "Authentication successful",
        "id_token": id_token,
        "access_token": token_response.get('access_token'),
        "refresh_token": token_response.get('refresh_token'),
        "user": user_info,
        "status": "success"
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user with Google Auth 2.0
    Required data in json:
    - token: Google Auth token
    """
    data = request.get_json()
    
    if not data or 'token' not in data:
        return jsonify({"error": "Missing Google authentication token"}), 400

    # Verify the ID token and get user info
    google_token = data.get('token')
    user_info = verify_google_token(google_token)
    
    if not user_info:
        return jsonify({"error": "Invalid Google token"}), 400
    
    # In a real application, you would create or update a user in your database
    
    return jsonify({
        "message": "User registered successfully",
        "user_id": user_info["user_id"],
        "status": "success"
    }), 201 