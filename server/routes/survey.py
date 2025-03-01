from flask import Blueprint, request, jsonify
from auth_helpers import auth_required
from database import get_db_connection

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

@survey_bp.route('', methods=['GET'])
@auth_required
def get_user_surveys():
    """
    Get all surveys for the authenticated user
    Requires authentication
    """
    # Get user's google_id from the auth token (added by auth_required decorator)
    google_user_id = request.user['user_id']
    
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Query to get all surveys for the user
        cursor.execute(
            """
            SELECT 
                BIN_TO_UUID(s.id) as id,
                s.title,
                s.system_prompt,
                s.created_at,
                s.updated_at,
                BIN_TO_UUID(q.id) as question_id,
                q.question,
                q.elaborate
            FROM surveys s
            LEFT JOIN questions q ON q.survey_id = s.id
            WHERE s.user_id = %s 
            ORDER BY s.created_at DESC, q.created_at ASC
            """,
            (google_user_id,)
        )
        
        rows = cursor.fetchall()
        
        # Group questions by survey
        surveys = {}
        for row in rows:
            survey_id = row['id']
            if survey_id not in surveys:
                surveys[survey_id] = {
                    'id': survey_id,
                    'title': row['title'],
                    'system_prompt': row['system_prompt'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at'],
                    'questions': []
                }
            
            # Add question if it exists (handle surveys with no questions)
            if row['question_id']:
                surveys[survey_id]['questions'].append({
                    'id': row['question_id'],
                    'question': row['question'],
                    'elaborate': row['elaborate']
                })
        
        return jsonify({
            "surveys": list(surveys.values()),
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to fetch surveys",
            "message": str(e)
        }), 500
    finally:
        cursor.close() 