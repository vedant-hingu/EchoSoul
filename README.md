# EchoSoul — Mental Health Companion

EchoSoul is a full‑stack mental wellness companion. It helps users track mood, chat with a supportive AI assistant, and manage their profile and preferences. The chatbot adapts tone to the user’s selected mood and lightly adjusts phrasing based on message sentiment.

## Features

- __Chatbot with mood adaptation__: AI replies tuned to moods like Calm, Happy, Sad, Angry, Anxious. Fallback local ML/rule-based tone.
- __Mood tracking and insights__: Save moods and view trends, distributions, and weekly activity.
- __Profile management__: Update username/email/phone/address with data migration for mood entries and chat history.
- __Local avatars__: Per‑user avatar stored in browser storage.

## Tech Stack

- __Frontend__: React (Create React App), Recharts, Fetch API
- __Backend__: Django + Django REST Framework
- __Database__: MongoDB (via a simple wrapper in `backend/mongo.py`)
- __AI__: Optional OpenAI API; fallback to `backend/api/chatbot.py` (TF‑IDF + LogisticRegression via scikit‑learn or rule‑based)

## Project Structure

```
.
├─ src/                 # React app (pages, components, services)
│  ├─ pages/            # Chatbot, Profile, etc.
│  ├─ components/       # Reusable UI components
│  └─ services/api.js   # API client (auth, chat, mood)
├─ public/              # Static assets
├─ backend/             # Django project
│  ├─ api/              # DRF views, models, chatbot
│  ├─ backend/          # Django settings/asgi/wsgi
│  └─ .env              # Backend environment variables
├─ requirements.txt     # Python dependencies
└─ package.json         # Frontend dependencies and scripts
```

## Key Endpoints

- `POST /api/signup/` — create account
- `POST /api/login/` — login, returns user info
- `POST /api/profile/update/` — update profile; migrates related records on username change
- `POST /api/chat/` — chatbot reply with `{ message, mood, username? }`
- `GET /api/chat/history/?username=` — chat history
- `DELETE /api/chat/history/?username=` — clear history (frontend also falls back to `POST /api/chat/history/` with `{ action: 'clear' }`)
- `GET /api/mood/?username=` — list mood entries
- `POST /api/mood/` — save mood entry

## Setup

1) Frontend
- Node 18+ recommended
- Install and start:
```
npm install
npm start
```
App runs at http://localhost:3000

2) Backend
- Python 3.10–3.12 recommended
- Create venv and install:
```
python -m venv backend-venv
backend-venv\\Scripts\\activate
pip install -r requirements.txt
```
- Configure `backend/.env` (example):
```
MONGO_URI=mongodb://localhost:27017/echosoul
OPENAI_API_KEY= # optional
OPENAI_MODEL=gpt-4o-mini
```
- Run server:
```
cd backend
python manage.py runserver 0.0.0.0:8000
```
API base: http://127.0.0.1:8000/api

## Chatbot Behavior

- Uses OpenAI if `OPENAI_API_KEY` is set; otherwise falls back to `backend/api/chatbot.py`.
- Fallback path applies sentiment cues using scikit‑learn if available; otherwise a rule‑based lexicon.
- Replies vary slightly to avoid repetition, especially in Calm mode.

## Notes & Troubleshooting

- After changing username, backend migrates `mood_entries` and `chat_messages` to keep data consistent.
- Clear history supports both DELETE and POST (for environments that block DELETE).
- If scikit‑learn fails to install, the chatbot works in rule‑based mode.

## Scripts

- Frontend:
  - `npm start` — dev server
  - `npm run build` — production build
- Backend:
  - `python manage.py runserver` — dev server

## License

Proprietary. For internal use during development.
