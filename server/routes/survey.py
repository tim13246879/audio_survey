from flask import Blueprint, request, jsonify
from auth_helpers import auth_required

survey_bp = Blueprint('survey', __name__)

@survey_bp.route('/create', methods=['POST'])
@auth_required
def create_survey():
    """
    Create a new survey
    Requires authentication
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Missing survey data"}), 400
    
    # Mock response - would be replaced with actual database storage
    return jsonify({
        "message": "Survey created successfully",
        "survey_id": "mock-survey-id",
        "status": "success"
    }), 201

@survey_bp.route('/<survey_id>', methods=['GET'])
def get_survey(survey_id):
    """
    Get survey details by ID
    No authentication required
    """
    # Mock response - would be replaced with actual database lookup
    return jsonify({
        "survey_id": survey_id,
        "title": "Sample Survey",
        "description": "This is a sample survey",
        "questions": [
            {"id": 1, "text": "Sample question 1", "type": "multiple_choice"},
            {"id": 2, "text": "Sample question 2", "type": "text"}
        ],
        "status": "success"
    }), 200

@survey_bp.route('/<survey_id>', methods=['POST'])
@auth_required
def submit_survey(survey_id):
    """
    Submit responses to a survey
    Requires authentication
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Missing survey response data"}), 400
    
    # Mock response - would be replaced with actual database storage
    return jsonify({
        "message": "Survey responses submitted successfully",
        "survey_id": survey_id,
        "status": "success"
    }), 200

@survey_bp.route('/answers', methods=['GET'])
@auth_required
def get_survey_answers():
    """
    Get survey answers
    Requires authentication
    """
    # Mock response - would be replaced with actual database query
    return jsonify({
        "surveys": [
            {
                "survey_id": "mock-survey-id-1",
                "responses": [
                    {"question_id": 1, "answer": "Option A"},
                    {"question_id": 2, "answer": "Text response"}
                ]
            }
        ],
        "status": "success"
    }), 200 