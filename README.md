# Saheli Connect

Full-stack web platform that connects working women (employers) with reliable house-help providers (helpers). This repository contains the server (Express + SQLite), frontend (vanilla HTML/CSS/JS), and initialization scripts with realistic sample data for testing.

## Key Features
- User roles: Employer and Helper
- Authentication with JWT and password hashing (bcryptjs)
- Employer dashboard & Seeker dashboard (profile, jobs, connections, messages)
- Job posting, searching and filtering
- Job applications and status workflow (pending → reviewed → shortlisted → accepted/rejected)
- Connections between employers and helpers (requests, active engagements)
- Real-time-like messaging (polling) and unread counts
- Reviews & ratings system
- Saved profiles and notifications
- Admin routes for moderation and analytics

## Tech Stack
- Node.js + Express
- SQLite3 (lightweight relational DB)
- Authentication: JWT (`jsonwebtoken`) + `bcryptjs`
- File uploads: `multer` (where used)
- Validation: `express-validator`
- Frontend: Plain HTML, CSS, JavaScript, Font Awesome icons
- Dev tools: `nodemon` for development

See `package.json` for exact dependency versions.

## Architecture & Files
- `server.js` — Express server and route mounting
- `routes/` — API route modules: `auth`, `users`, `connections`, `messages`, `jobs`, `admin`
- `database/` — DB connection and `init-db.js` for schema + sample data
- `public/` — static frontend files (HTML/CSS/JS)
- `middleware/` — auth middleware (JWT verification)

For a detailed architecture diagram and schema summary, see `ARCHITECTURE.md`.

## Quick start (Windows PowerShell)
1. Install dependencies:

```powershell
cd "c:\Users\pranj\OneDrive\Desktop\Saheli2.0\Saheli-Connect"
npm install
```

2. Initialize the database with sample data:

```powershell
npm run init-db
```

3. Start server:

```powershell
npm start
# or for development with auto-reload:
npm run dev
```

4. Open in browser:

- Employer dashboard: `http://localhost:3000/employer-dashboard`
- Seeker dashboard: `http://localhost:3000/seeker-dashboard`
- Admin: `http://localhost:3000/admin` (admin credentials in sample data)

## Important environment variables
- Create a `.env` in project root (not committed) with at least:

```
PORT=3000
JWT_SECRET=your_jwt_secret_here
DB_PATH=./database/saheli_connect.db
NODE_ENV=development
```

## API Overview (selected endpoints)
- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login, returns JWT
- `GET /api/users/profile` — get current user profile (auth)
- `GET /api/users/search` — search helpers / employers (auth)
- `GET /api/users/stats` — dashboard stats (auth)
- `GET /api/users/notifications` — notifications (auth)
- `GET /api/jobs` — list jobs with filters
- `POST /api/jobs` — create job (employer)
- `GET /api/jobs/:id/applications` — list applications for a job (employer)
- `POST /api/connections` — create connection request
- `GET /api/messages/conversations` — list conversations (auth)

Use the frontend JavaScript in `public/js` for examples of how to call these APIs and how auth headers / tokens are handled.

## Sample Credentials (from `database/init-db.js`)
- Employers: `priya@example.com`, `kavita@example.com`, `neha@example.com`, `ritu@example.com`, `divya@example.com` — password: `password123`
- Helpers: `meera@example.com`, `anjali@example.com`, `sunita@example.com`, `lakshmi@example.com`, `rekha@example.com`, `pooja@example.com`, `geeta@example.com` — password: `password123`
- Admin: `admin` / `admin123`

## Testing & Debugging
- Server logs output errors to console. Start server with `NODE_ENV=development` to see full error messages.
- If an endpoint returns 404/500, verify route ordering in `routes/` modules and check `server.js` mounts.
- Database can be inspected using any SQLite client against the `DB_PATH` file.

## Contribution & Next Steps
- Add unit and integration tests (Mocha/Jest) for API routes
- Add integration with a persistent storage or migrate to PostgreSQL for production
- Add real-time messaging via WebSockets (Socket.io)
- Add file upload handling for profile pictures (currently `multer` is included)

---
If you'd like, I can now commit these docs and push them to `origin`.