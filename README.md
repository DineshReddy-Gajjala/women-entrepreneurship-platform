# Women Entrepreneurs Platform 🚀

A full-stack platform empowering women entrepreneurs with AI-driven insights, mentorship, and a digital marketplace.

## Features

- **Home Page** — Hero section, feature highlights, and footer
- **Login / Sign Up** — JWT-based authentication with tabbed form
- **Dashboard** — Profile, AI business recommendations, success predictor, and progress tracking
- **Mentorship** — Browse and connect with expert mentors
- **Marketplace** — Search and discover products from women-led businesses
- **AI Chatbot** — Floating chat window for instant business advice
- **AI Recommendations** — Personalised business ideas based on user interests
- **Success Prediction** — Evaluate your business ideas before investing

## Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Backend   | Python Flask              |
| Frontend  | HTML, CSS, Vanilla JS     |
| Database  | MongoDB (mocked for demo) |
| Auth      | JWT (Flask-JWT-Extended)   |
| AI/ML     | Rule-based logic          |

## Quick Start

```bash
# 1. Navigate to backend
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Run the server
python app.py
```

Open **http://localhost:5000** in your browser.

## Project Structure

```
women/
├── backend/
│   ├── app.py                 # Flask app + REST APIs + AI logic
│   ├── requirements.txt       # Python dependencies
│   ├── static/
│   │   ├── css/styles.css     # Premium design system
│   │   └── js/main.js         # Frontend logic (API calls, chatbot)
│   └── templates/
│       ├── index.html         # Home page
│       ├── login.html         # Login / Sign Up
│       ├── dashboard.html     # User Dashboard
│       ├── mentorship.html    # Mentors listing
│       └── marketplace.html   # Product marketplace
└── README.md
```

## API Endpoints

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| POST   | `/api/signup`         | Register a new user          |
| POST   | `/api/login`          | Login and receive JWT token  |
| GET    | `/api/profile`        | Get user profile (auth)      |
| GET    | `/api/mentors`        | List all mentors             |
| GET    | `/api/products`       | List all marketplace items   |
| GET    | `/api/recommendations`| AI business recommendations  |
| POST   | `/api/predict_success`| Predict business idea success|
| POST   | `/api/chatbot`        | Chat with AI assistant       |
