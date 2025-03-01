from flask import Blueprint, request, jsonify, redirect, url_for
from google_auth import get_google_auth_url, exchange_code_for_token, verify_google_token
from database import get_db_connection
import mysql.connector
from uuid import UUID

auth_bp = Blueprint('auth', __name__)

def get_or_create_user(user_info):
    """
    Check if user exists in database, if not create them.
    Returns tuple (user_data, is_new_user)
    """
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Check if user exists
        cursor.execute(
            "SELECT BIN_TO_UUID(id) as id, email, name, google_user_id FROM users WHERE google_user_id = %s",
            (user_info['user_id'],)
        )
        existing_user = cursor.fetchone()
        
        if existing_user:
            return existing_user, False
            
        # Create new user if they don't exist
        cursor.execute(
            """
            INSERT INTO users (email, name, google_user_id)
            VALUES (%s, %s, %s)
            """,
            (user_info['email'], user_info['name'], user_info['user_id'])
        )
        db.commit()
        
        # Get the newly created user
        cursor.execute(
            "SELECT BIN_TO_UUID(id) as id, email, name, google_user_id FROM users WHERE google_user_id = %s",
            (user_info['user_id'],)
        )
        new_user = cursor.fetchone()
        return new_user, True
        
    finally:
        cursor.close()

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
    Required header:
    Authorization: Bearer <Google Auth token>
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid Authorization header. Must be 'Bearer <token>'"}), 401

    # Extract token from "Bearer <token>"
    google_token = auth_header.split(' ')[1]
    
    # Verify the ID token and get user info
    user_info = verify_google_token(google_token)
    
    if not user_info:
        return jsonify({"error": "Invalid Google token"}), 400
    

    try:
        # Get or create user in database
        get_or_create_user(user_info)
        
        return jsonify({
            "message": "User registered successfully",
            "status": "success"
        }), 200
        
    except mysql.connector.Error as err:
        return jsonify({
            "error": "Database error occurred",
            "message": str(err)
        }), 500