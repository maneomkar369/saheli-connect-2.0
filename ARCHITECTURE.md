# Saheli Connect — Architecture

This document describes the high-level architecture, data model, API surface, and deployment notes for the Saheli Connect web application.

## Overview
- Purpose: Match employers (working women) with trusted helpers (house-help) for jobs such as cooking, cleaning, elderly care, and childcare.
- Type: Full-stack monolithic app (Express server + SQLite DB + static frontend served from `public/`).

## High-level Components
- Server: Node.js + Express application (`server.js`) — exposes RESTful API routes and serves static frontend files.
- Database: SQLite (single-file DB) managed from `database/db.js` and initialized by `database/init-db.js`.
- Auth: JWT-based authentication; tokens issued on login and sent in `Authorization: Bearer <token>` headers.
- Frontend: Static HTML/CSS/JavaScript in `public/` with separate pages for landing, employer dashboard, seeker dashboard, and admin.
- Middleware: `middleware/auth.js` handles token verification and role checks.

## Directory Layout (important files)
- `server.js` — main Express app and route mounting
- `routes/` — API endpoints: `auth.js`, `users.js`, `connections.js`, `messages.js`, `jobs.js`, `admin.js`
- `database/` — `db.js` (SQLite connection) and `init-db.js` (schema + sample data)
- `public/` — static frontend files
  - `public/js/` — client JS (example API calls and UI logic)
  - `public/css/` — styles (including `dashboard.css`)
- `middleware/` — JWT auth middleware
- `package.json` — dependencies & scripts

## Data Model (summary)
Major tables and notable columns (see `database/init-db.js` for full schema):

- `users`
  - id, full_name, email, phone, password (hashed), user_type (employer|helper), city, about, profile_image, verified, status, rating, total_reviews, created_at

- `helper_profiles`
  - user_id (FK -> users.id), skills, experience, hourly_rate, availability, languages, certifications

- `employer_preferences`
  - user_id (FK -> users.id), services_needed, budget_range, preferred_experience, preferred_skills, work_schedule

- `connections`
  - employer_id, helper_id, status (pending|active|completed|cancelled), started_at, ended_at

- `messages`
  - sender_id, receiver_id, message, read, created_at

- `jobs`
  - employer_id, title, description, location, work_type, salary_range, requirements, status (active|closed|filled)

- `job_applications`
  - job_id, helper_id, cover_letter, status (pending|reviewed|shortlisted|accepted|rejected)

- `reviews`, `reports`, `saved_profiles`, `notifications`

## API Surface (selected)
Authentication:
- `POST /api/auth/register` — Register a new user (role-specific fields handled by frontend).
- `POST /api/auth/login` — Login, returns `{ token, user }`.

User & Profiles:
- `GET /api/users/profile` — current user profile (auth)
- `PUT /api/users/profile` — update profile
- `GET /api/users/search` — search users (filters: city, skills, rating, keywords)
- `GET /api/users/saved/list` — saved profiles
- `GET /api/users/stats` — simple dashboard statistics
- `GET /api/users/notifications` — notifications list

Jobs & Applications:
- `GET /api/jobs` — list jobs (filtering params supported)
- `POST /api/jobs` — create job (employer)
- `GET /api/jobs/:id/applications` — applications for a job (employer only)
- `POST /api/jobs/:id/apply` — apply for a job (helper)

Connections & Messages:
- `POST /api/connections` — request connection
- `PUT /api/connections/:id` — update connection status
- `GET /api/messages/conversations` — list conversation summaries
- `GET /api/messages/:userId` — get messages with a user
- `POST /api/messages` — send a message

Admin:
- `GET /api/admin/stats` — global metrics
- `GET /api/admin/users` — list/manage users

Security notes:
- Password hashing with `bcryptjs`.
- JWT tokens with a secret in `.env` (set `JWT_SECRET`).
- Protected routes use `authenticateToken` middleware.

## Typical Data Flows
1. User registers → `users` (plus role-specific table) → logs in → receives JWT
2. Employer posts job → insert into `jobs` → helpers query `/api/jobs` and apply → insert into `job_applications`
3. Employer views applications → `/api/jobs/:id/applications` → updates status → triggers notifications
4. Messaging → `messages` table used to store messages; frontend polls conversations/messages and shows unread counts

## Deployment & Operational Notes
- Environment variables: `PORT`, `JWT_SECRET`, `DB_PATH`, `NODE_ENV`.
- SQLite is fine for development and small data sets; consider PostgreSQL or MySQL for production.
- Add a proper logging mechanism (Winston) and central error handling for production.
- For real-time messaging, migrate to WebSockets (Socket.io) and a message queue for scale.

## Running Locally (quick)
```powershell
cd "c:\Users\pranj\OneDrive\Desktop\Saheli2.0\Saheli-Connect"
npm install
npm run init-db
npm start
```

## Next Improvements
- Add automated tests (Jest / Supertest) for API routes.
- Add CI pipeline that runs tests and linting.
- Implement file storage for images (S3 or similar) and serve CDN for static assets.

---
This file complements `README.md`. I will now commit these docs and push them to the `origin` remote unless you prefer otherwise.
