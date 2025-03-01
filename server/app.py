from flask import Flask, request, jsonify
import os
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'default-secret-key')

# Configure CORS to allow requests from frontend
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:5000", "http://localhost:8000", "http://localhost:8080"]}})

# Import routes after app is defined to avoid circular imports
from routes.auth import auth_bp
from routes.survey import survey_bp
from routes.user import user_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(survey_bp, url_prefix='/api/survey')
app.register_blueprint(user_bp, url_prefix='/api/user')

if __name__ == '__main__':
    app.run(debug=True) 