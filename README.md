# Compliance Tracker

A full-stack web app to track compliance tasks for multiple clients.

## Live Demo
https://compliance-tracker-frontend.vercel.app

## GitHub
https://github.com/Vaibhav-Walde/compliance-tracker

## Tech Stack
- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Database: SQLite
- Deployed: Render (backend) + Vercel (frontend)

## Run Locally

Backend:
cd backend
npm install
npm start

Frontend:
cd frontend
npm install
npm run dev

## API Endpoints
- GET /api/clients
- POST /api/clients
- GET /api/clients/:id/tasks
- POST /api/clients/:id/tasks
- PATCH /api/tasks/:id
- DELETE /api/tasks/:id

## Tradeoffs
- SQLite over PostgreSQL: zero config, perfect for this scope
- No auth: not in scope per assignment
- Single file React component: kept simple intentionally
- Render free tier: may have 30 second cold start on first request

## Assumptions
- Tasks belong to exactly one client
- Overdue means due_date is before today and status is not Completed
- No authentication required for this scope
