# Survey API Server

This is a Flask-based API server for the Audio Survey application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up Google OAuth 2.0:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project or select an existing one.
   - Navigate to "APIs & Services" > "OAuth consent screen" and set up the consent screen.
   - Go to "APIs & Services" > "Credentials".
   - Click "Create Credentials" and select "OAuth client ID".
   - Choose "Web application" as the application type.
   - Add authorized redirect URIs:
     - For local development: `http://localhost:5000/api/auth/callback`
   - Copy the Client ID and Client Secret.

4. Create a `.env` file in the server directory with the following content:
```
FLASK_SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

## Running the Server

Start the server with:
```bash
python app.py
```

The server will run on `http://localhost:5000` by default.

## Authentication Flow

The Google OAuth 2.0 authentication flow works as follows:

1. Frontend directs user to `/api/auth/login` which returns an authentication URL.
2. User is redirected to the Google login page.
3. After login, Google redirects to `/api/auth/callback` with an authorization code.
4. The server exchanges this code for access and ID tokens.
5. The ID token is verified, and the user information is extracted.
6. The server returns the tokens and user information to the frontend.
7. For authenticated endpoints, include the ID token in the Authorization header as a Bearer token:
   ```
   Authorization: Bearer <id_token>
   ```

## API Endpoints

### Authentication
- `GET /api/auth/login` - Initiates the Google OAuth login flow
- `GET /api/auth/callback` - Handles the OAuth callback from Google
- `POST /api/auth/register` - Register a user with Google Auth 2.0

### Surveys
- `POST /api/survey/create` - Create a new survey (auth required)
- `GET /api/survey/{surveyId}` - Get survey details (no auth required)
- `POST /api/survey/{surveyId}` - Submit survey responses (auth required)
- `GET /api/survey/answers` - Get survey answers (auth required)

### User
- `GET /api/user` - Get user information (auth required) 