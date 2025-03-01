# API Testing Commands

### Authentication Endpoints

1. Initiate Google OAuth Login (this will return a URL to visit in your browser):
```bash
curl http://localhost:5000/api/auth/login
```

2. Register a user (after getting ID token from Google OAuth):
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "token": "'$TOKEN'"
  }'

### Survey Endpoints

1. Create a new survey:
```bash
curl -X POST http://localhost:5000/api/survey/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Audio Test Survey",
    "description": "Testing audio preferences",
    "questions": [
      {
        "text": "How would you rate this audio sample?",
        "type": "rating",
        "options": ["1", "2", "3", "4", "5"]
      }
    ]
  }'

2. Get survey details (no auth required):
```bash
curl http://localhost:5000/api/survey/SURVEY_ID
```

3. Submit survey responses:
```bash
curl -X POST http://localhost:5000/api/survey/SURVEY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "answers": [
      {
        "question_id": "1",
        "answer": "4"
      }
    ]
  }'

4. Get survey answers:
```bash
curl http://localhost:5000/api/survey/answers \
  -H "Authorization: Bearer $TOKEN"
```

### User Endpoints

1. Get user information:
```bash
curl http://localhost:5000/api/user \
  -H "Authorization: Bearer $TOKEN"
```

**Note**: Replace these placeholder values:
- `YOUR_ID_TOKEN`: The ID token received after Google OAuth authentication
- `SURVEY_ID`: The ID of the survey you want to interact with

To make testing easier, you might want to:
1. Save your ID token as an environment variable:
```bash
export TOKEN="your_id_token_here"
```

2. Then use it in commands like:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/user
```
