from flask import Blueprint, request, jsonify
from auth_helpers import auth_required
from database import get_db_connection
import uuid

survey_bp = Blueprint('survey', __name__)

@survey_bp.route('', methods=['POST'])
@auth_required
def create_survey():
    """
    Create a new survey with questions
    Requires authentication
    """
    data = request.get_json()
    print("data", data)
    user_id = request.user['user_id']  # Added by auth_required decorator
    print("user_id", user_id)
    if not data:
        return jsonify({"error": "Missing survey data"}), 400
    
    required_fields = ['title', 'system_prompt', 'questions']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    if not data['questions']:
        return jsonify({"error": "Survey must have at least one question"}), 400
    
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Start transaction
        cursor.execute("START TRANSACTION")
        
        # Create survey
        survey_id = uuid.uuid4()
        cursor.execute(
            """
            INSERT INTO surveys (id, user_id, title, system_prompt)
            VALUES (UUID_TO_BIN(%s), %s, %s, %s)
            """,
            (str(survey_id), user_id, data['title'], data['system_prompt'])
        )
        
        # Create questions
        for question in data['questions']:
            question_id = uuid.uuid4()
            cursor.execute(
                """
                INSERT INTO questions (id, survey_id, question, elaborate)
                VALUES (UUID_TO_BIN(%s), UUID_TO_BIN(%s), %s, %s)
                """,
                (
                    str(question_id),
                    str(survey_id),
                    question['question'],
                    question['elaborate']
                )
            )
        
        # Commit transaction
        db.commit()
        
        return jsonify({
            "message": "Survey created successfully",
            "survey_id": str(survey_id),
            "status": "success"
        }), 201
        
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        return jsonify({
            "error": "Failed to create survey",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        db.close()

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
        db.close()

@survey_bp.route('/<survey_id>/responses', methods=['GET'])
@auth_required
def get_survey_responses(survey_id):
    """
    Get responses for a specific survey
    Requires authentication and survey ownership
    """
    user_id = request.user['user_id']
    
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # First check if the user owns this survey
        cursor.execute(
            """
            SELECT 1 FROM surveys 
            WHERE id = UUID_TO_BIN(%s) AND user_id = %s
            """,
            (survey_id, user_id)
        )
        
        if not cursor.fetchone():
            return jsonify({
                "error": "Survey not found or access denied"
            }), 404
        
        # Get all responses with their answers
        cursor.execute(
            """
            SELECT 
                BIN_TO_UUID(r.id) as response_id,
                r.created_at as response_date,
                BIN_TO_UUID(q.id) as question_id,
                q.question,
                a.answer
            FROM responses r
            JOIN answers a ON a.response_id = r.id
            JOIN questions q ON q.id = a.question_id
            WHERE r.survey_id = UUID_TO_BIN(%s)
            ORDER BY r.created_at DESC, q.created_at ASC
            """,
            (survey_id,)
        )
        
        rows = cursor.fetchall()
        
        # Group answers by response
        responses = {}
        for row in rows:
            response_id = row['response_id']
            if response_id not in responses:
                responses[response_id] = {
                    'id': response_id,
                    'created_at': row['response_date'],
                    'answers': []
                }
            
            responses[response_id]['answers'].append({
                'question_id': row['question_id'],
                'question': row['question'],
                'answer': row['answer']
            })
        
        return jsonify({
            "responses": list(responses.values()),
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to fetch survey responses",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        db.close()

@survey_bp.route('/<survey_id>', methods=['GET'])
def get_survey(survey_id):
    """
    Get details of a specific survey including owner's name and all questions
    Public endpoint - no authentication required
    """
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Get survey details with owner's name and questions
        cursor.execute(
            """
            SELECT 
                BIN_TO_UUID(s.id) as id,
                s.title,
                s.system_prompt,
                s.created_at,
                s.updated_at,
                u.name as owner_name,
                BIN_TO_UUID(q.id) as question_id,
                q.question,
                q.elaborate
            FROM surveys s
            JOIN users u ON u.google_user_id = s.user_id
            LEFT JOIN questions q ON q.survey_id = s.id
            WHERE s.id = UUID_TO_BIN(%s)
            ORDER BY q.created_at ASC
            """,
            (survey_id,)
        )
        
        rows = cursor.fetchall()
        
        if not rows:
            return jsonify({
                "error": "Survey not found"
            }), 404
            
        # Process the results to group questions under the survey
        survey = {
            'id': rows[0]['id'],
            'title': rows[0]['title'],
            'system_prompt': rows[0]['system_prompt'],
            'created_at': rows[0]['created_at'],
            'updated_at': rows[0]['updated_at'],
            'owner_name': rows[0]['owner_name'],
            'questions': []
        }
        
        # Add questions if they exist
        for row in rows:
            if row['question_id']:  # Check if there are questions
                survey['questions'].append({
                    'id': row['question_id'],
                    'question': row['question'],
                    'elaborate': row['elaborate']
                })
        
        return jsonify({
            "survey": survey,
            "status": "success"
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to fetch survey details",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        db.close()

@survey_bp.route('/<survey_id>', methods=['POST'])
def submit_survey_response(survey_id):
    """
    Submit a new response for a survey
    Public endpoint - no authentication required
    Expected JSON format:
    {
        "answers": {
            "question_id": "answer",
            ...
        }
    }
    """
    data = request.get_json()
    print("data", data)
    if not data or 'answers' not in data:
        return jsonify({"error": "Missing answers data"}), 400
    
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    
    try:
        # Start transaction
        cursor.execute("START TRANSACTION")
        
        # First verify the survey exists
        cursor.execute(
            "SELECT 1 FROM surveys WHERE id = UUID_TO_BIN(%s)",
            (survey_id,)
        )
        if not cursor.fetchone():
            return jsonify({"error": "Survey not found"}), 404
        
        # Create a new response
        response_id = uuid.uuid4()
        cursor.execute(
            """
            INSERT INTO responses (id, survey_id)
            VALUES (UUID_TO_BIN(%s), UUID_TO_BIN(%s))
            """,
            (str(response_id), survey_id)
        )
        
        # Get all valid question IDs for this survey
        cursor.execute(
            """
            SELECT BIN_TO_UUID(id) as id
            FROM questions
            WHERE survey_id = UUID_TO_BIN(%s)
            """,
            (survey_id,)
        )
        valid_questions = {row['id'] for row in cursor.fetchall()}
        print("valid_questions", valid_questions)
        
        answer_data = data['answers']
        print("answer_pairs", answer_data)
        # Insert answers
        for question_id, answer in answer_data.items():
            print("question_id", question_id)
            print("answer", answer)
            # Skip if question doesn't belong to this survey
            if question_id.strip() not in valid_questions:
                print("Question ID not in valid questions:", question_id)
                continue
                
            cursor.execute(
                """
                INSERT INTO answers (id, response_id, question_id, answer)
                VALUES (UUID_TO_BIN(%s), UUID_TO_BIN(%s), UUID_TO_BIN(%s), %s)
                """,
                (str(uuid.uuid4()), str(response_id), question_id, answer)
            )
        
        # Commit transaction
        db.commit()
        
        return jsonify({
            "message": "Response submitted successfully",
            "response_id": str(response_id),
            "status": "success"
        }), 201
        
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        return jsonify({
            "error": "Failed to submit response",
            "message": str(e)
        }), 500
    finally:
        cursor.close()
        db.close() 