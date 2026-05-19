# Student Exeat Management System

Full-stack web application with:
- **React + TypeScript + Tailwind CSS** (frontend)
- **Node.js + Express** (backend API)
- **MongoDB + Mongoose** (database)
- **JWT** authentication (no Supabase)

---

## Project Structure

```
exeat-app/
├── server/              ← Express + MongoDB backend
│   ├── src/
│   │   ├── index.js         ← Entry point
│   │   ├── models/          ← Mongoose models
│   │   ├── routes/          ← API routes
│   │   ├── middleware/      ← Auth & upload middleware
│   │   └── utils/           ← Helpers
│   ├── uploads/             ← Uploaded documents
│   ├── .env                 ← Backend env vars
│   └── package.json
│
├── src/                 ← React frontend
│   ├── context/AuthContext.tsx    ← JWT-based auth
│   ├── lib/api.ts                 ← Fetch wrapper
│   ├── services/requestService.ts ← API calls
│   ├── pages/                     ← All pages
│   └── ...
├── .env                 ← Frontend env vars
└── package.json
```

---

## Prerequisites

- Node.js v18+
- MongoDB (local or MongoDB Atlas)

---

## 1. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** — update `MONGODB_URI` in `server/.env`

---

## 2. Start the Backend

```bash
cd server
npm install
npm run dev
```

Server starts at: **http://localhost:5000**

Test it:
```bash
curl http://localhost:5000/api/health
```

---

## 3. Start the Frontend

```bash
# in the root exeat-app/ folder
npm install
npm run dev
```

Frontend starts at: **http://localhost:5173**

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → returns JWT |
| GET  | `/api/auth/me` | Get current user |

### Requests
| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/requests` | Student |
| GET  | `/api/requests/my` | Student |
| GET  | `/api/requests/my/stats` | Student |
| PUT  | `/api/requests/:id` | Student |
| DELETE | `/api/requests/:id` | Student |
| GET  | `/api/requests/all` | Admin/Dean/Security |
| GET  | `/api/requests/admin/stats` | Admin/Dean |
| GET  | `/api/requests/:id` | All |
| POST | `/api/requests/:id/hall-approve` | Hall Admin |
| POST | `/api/requests/:id/hall-reject` | Hall Admin |
| POST | `/api/requests/:id/dean-approve` | Dean |
| POST | `/api/requests/:id/dean-reject` | Dean |
| POST | `/api/requests/:id/checkout` | Security |
| POST | `/api/requests/:id/checkin` | Security |

### Audit
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/audit` | Admin/Dean |

---

## User Roles

| Role | Access |
|------|--------|
| `student` | Submit, view, edit, cancel own requests |
| `hall_admin` | Review all requests (stage 1 approval) |
| `dean` | Final approval (stage 2) |
| `security` | Check-out / check-in confirmation |

---

## Environment Variables

### server/.env
```
PORT=5000
MONGODB_URI=db://localhost:27017/exeat_management
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
```

### .env (frontend)
```
VITE_API_URL=http://localhost:5000/api
```
