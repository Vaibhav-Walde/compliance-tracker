# Compliance Tracker

> A full-stack web application to manage compliance tasks across multiple clients — built for LedgersCFO.

## Live Demo
https://compliance-tracker-frontend-nine.vercel.app

## GitHub Repository
https://github.com/Vaibhav-Walde/compliance-tracker

---

## Screenshots

### Client Dashboard
- Dark sidebar with client list
- Summary stats (Total, Pending, Completed, Overdue)
- Task list with filters and search

---

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18, Vite              |
| Backend    | Node.js, Express            |
| Database   | SQLite (better-sqlite3)     |
| Deployment | Vercel (FE) + Render (BE)   |

---

## Features

- View and manage multiple clients
- Add, edit, delete compliance tasks per client
- Update task status (Pending, In Progress, Completed, On Hold)
- Filter tasks by status and category
- Search tasks by title or description
- Sort by due date, priority, or title A-Z
- Overdue tasks highlighted in red with badge
- Summary stats per client
- Seed data pre-loaded on first run
- REST API with validation and error handling

---

## Project Structure
compliance-tracker/
├── backend/
│   ├── db/
│   │   └── database.js     # SQLite setup and seed data
│   ├── server.js           # Express API routes
│   └── package.json
│
└── frontend/
├── src/
│   ├── App.jsx          # Main React component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
└── package.json

---

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/clients                | Get all clients          |
| POST   | /api/clients                | Create a client          |
| DELETE | /api/clients/:id            | Delete a client          |
| GET    | /api/clients/:id/tasks      | Get tasks for a client   |
| POST   | /api/clients/:id/tasks      | Create a task            |
| PATCH  | /api/tasks/:id              | Update a task            |
| DELETE | /api/tasks/:id              | Delete a task            |

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repository
git clone https://github.com/Vaibhav-Walde/compliance-tracker.git
cd compliance-tracker

### 2. Run the backend
cd backend
npm install
npm start
API runs on http://localhost:4000

### 3. Run the frontend
cd frontend
npm install
npm run dev
App runs on http://localhost:5173

---

## Tradeoffs

- **SQLite over PostgreSQL**: Zero configuration, file-based storage, perfect for this scope. Can be swapped for Postgres by replacing better-sqlite3 with the pg package.
- **No authentication**: Not in scope per the assignment. Would add JWT-based middleware as the next step.
- **Single-file React component**: Kept intentionally simple. For larger scale, would split into separate components and pages folders.
- **Render free tier**: Backend may sleep after inactivity, causing a ~30 second cold start on the first request.

---

## Assumptions

- Tasks belong to exactly one client
- Overdue is defined as due_date before today AND status is not Completed
- No multi-user or authentication requirements for this scope
- SQLite file persists on the server filesystem

---

Built with by Vaibhav Walde