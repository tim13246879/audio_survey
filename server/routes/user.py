from flask import Blueprint, jsonify
from auth_helpers import auth_required

user_bp = Blueprint('user', __name__)

@user_bp.route('', methods=['GET'])
@auth_required
def get_user_info():
    """
    Get user information
    Requires authentication
    """
    # Mock response - would be replaced with actual user lookup
    return jsonify({
        "user_id": "mock-user-id",
        "email": "user@example.com",
        "name": "Sample User",
        "created_at": "2023-01-01T00:00:00Z",
        "status": "success"
    }), 200 