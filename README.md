# 💼 JobSync – AI-Powered Job Application Dashboard

JobSync is a full-stack job application management platform that helps users discover, organize, and apply to jobs while automatically evaluating applications using AI.

It combines a Next.js frontend with a multi-process Go backend, PostgreSQL, AWS infrastructure, Redis pub/sub, WebSockets, and OpenAI to create an asynchronous application evaluation pipeline.

---

## 🚀 Features

- 🤖 **AI-Powered Application Evaluation** – Uses OpenAI to compare resumes and cover letters against job descriptions and produce a match score, decision, and feedback
- 📄 **Application Management** – Apply manually with custom documents or automatically using profile information
- ⚡ **Asynchronous Processing** – Applications are evaluated in the background using AWS SQS without blocking API requests
- 🔄 **Transactional Outbox** – PostgreSQL outbox + `LISTEN/NOTIFY` reliably bridges database transactions and SQS publishing
- 🔔 **Real-Time Notifications** – Redis pub/sub and WebSockets provide live application status updates
- 🗂️ **Job Organization** – Save jobs and organize them into custom folders
- 📊 **Application Tracking** – Track applications through `Applied → In Review → Interview / Rejected`
- 🔐 **Session Authentication** – Cookie-based authentication with bcrypt password hashing
- ☁️ **Cloud Storage** – AWS S3 stores resumes and cover letters
- 📑 **Cursor Pagination** – Efficient pagination for jobs, saved jobs, applications, and folders
- ✨ **Interactive UI** – Framer Motion animations, custom transitions, bookmark animations, and application success effects

---

## 🧠 Tech Stack

**Frontend:**

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Zustand
- React Context
- Framer Motion
- Lucide React
- Canvas Confetti

**Backend:**

- Go
- Fiber
- PostgreSQL
- Redis
- WebSockets
- AWS SQS
- AWS S3
- OpenAI API

**Infrastructure / Architecture:**

- PostgreSQL transactional outbox
- PostgreSQL `LISTEN/NOTIFY`
- AWS SQS long polling
- Redis pub/sub
- Concurrent Go workers
- Server-side cookie sessions

---

## 🏗️ Architecture

JobSync uses a **multi-process Go backend** with a synchronous REST API and asynchronous workers.

```text
                         ┌──────────────────────┐
                         │     Next.js App      │
                         │   React + TypeScript │
                         └──────────┬───────────┘
                                    │
                         HTTP + WebSocket
                                    │
                                    ▼
                    ┌───────────────────────────┐
                    │       Go API Server       │
                    │          Fiber            │
                    │                           │
                    │ REST API + Auth + S3      │
                    │ WebSocket Connections     │
                    │ Redis Subscriber          │
                    └─────────────┬─────────────┘
                                  │
                              PostgreSQL
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                 job_applications    outbox_messages
                         │                 │
                         │             NOTIFY
                         │                 │
                         │                 ▼
                         │          ┌──────────────┐
                         │          │ Outbox Worker│
                         │          └──────┬───────┘
                         │                 │
                         │              AWS SQS
                         │                 │
                         │                 ▼
                         │        ┌────────────────┐
                         │        │ Evaluation     │
                         │        │ Worker         │
                         │        └───────┬────────┘
                         │                │
                         │        ┌───────┴────────┐
                         │        │                │
                         │       S3              OpenAI
                         │        │                │
                         │        └───────┬────────┘
                         │                │
                         │             PostgreSQL
                         │                │
                         │             Redis
                         │                │
                         │                ▼
                         └────────► WebSocket
                                      │
                                      ▼
                                  Next.js UI
```

### Processes at Runtime

| Process | Entry point | Role |
|---------|-------------|------|
| **API Server** | `backend/main.go` | REST API, S3 uploads, session auth, WebSocket connections, Redis subscriber |
| **Worker Process** | `backend/worker/main.go` | Outbox worker (DB → SQS) + Evaluation worker (SQS → AI → Redis) |

The API server and worker process are started separately. The worker binary runs both background workers concurrently.

---

## ⚙️ Backend

### API Server (`backend/main.go`)

On startup, the API server:

1. Connects to PostgreSQL and Redis
2. Starts a background goroutine that subscribes to Redis `notifications` channel
3. Initializes the AWS S3 client
4. Registers all REST routes and listens on `:8080`

The API handles authentication, job discovery, saved jobs, folders, profile setup, application submission, and WebSocket upgrades at `/ws`.

### Authentication

- **Create account** – email + bcrypt-hashed password stored in `users`
- **Login** – bcrypt verification, session cookie with `email` stored in Fiber's in-memory session store
- **Protected routes** – handlers read `email` from session; return 401 if missing
- **WebSocket auth** – middleware on `/ws` validates the session before upgrading the connection

All API calls from the frontend use `credentials: "include"` to send the session cookie.

### REST API Surface

**Auth & profile**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/create_account` | POST | Register a new user |
| `/verify_login` | POST | Login and create session |
| `/check_session` | GET | Validate active session |
| `/upload_setup_data` | POST | Upload profile documents to S3, save setup JSON |
| `/fetch_profile_data` | GET | Get profile and job preferences |
| `/fetch_points` | GET | Profile completeness score |

**Jobs & organization**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/fetch_jobs` | GET | Browse jobs (cursor pagination) |
| `/view_job` | GET | Single job details |
| `/add_saved_jobs` | POST | Bookmark a job |
| `/fetch_saved_jobs` | GET | List saved jobs |
| `/delete_saved_jobs` | DELETE | Remove saved job |
| `/add_folders` | POST | Create folder |
| `/get_folders` | GET | List folders |
| `/update_folder` | PATCH | Rename folder |
| `/delete_folder` | DELETE | Delete folder |
| `/add_job_to_folder` | POST | Add job to folder |
| `/fetch_folder_jobs` | POST | Get jobs in folder (by job ID list) |

**Applications & notifications**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/submit_application` | POST | Manual apply with file uploads |
| `/auto_submit_application` | POST | One-click apply using profile URLs |
| `/fetch_applied_jobs` | GET | Paginated applied jobs list |
| `/fetch_applied_jobs_status` | GET | All application statuses |
| `/fetch_unread` | GET | Unread notification count |
| `/update_job_status` | PATCH | Mark notifications as read |
| `/ws` | GET | Authenticated WebSocket connection |

### Data Model

| Table | Purpose |
|-------|---------|
| `users` | Accounts, `setup_data` JSON, profile completeness points |
| `jobs` | Job listings (title, company, description, etc.) |
| `user_saved_jobs` | Bookmarked jobs per user |
| `folders` / folder-job joins | Custom job organization |
| `job_applications` | Submitted applications (S3 doc URLs, status, read flag) |
| `job_analysis` | AI pipeline state, match score, feedback |
| `outbox_messages` | Pending SQS publishes (`application_id`, `job_id`, `processed_at`) |

Application **status** lives on `job_applications`. **Analysis metadata** lives on `job_analysis`.

---

## 🔄 Transactional Outbox Pattern

Previously, the API committed application rows and then called SQS directly. If SQS failed after commit, work could be lost.

The outbox pattern solves this by keeping enqueue intent in the same database transaction as the application.

### Submit flow (`SubmitApp` / `AutoSubmitApp`)

All writes happen in a **single transaction**:

1. `INSERT job_applications` (status: `Applied`, with `ON CONFLICT` for duplicate applies → 409)
2. `INSERT job_analysis` (status: `Pending`)
3. `INSERT outbox_messages` (`application_id`, `job_id`)
4. `SELECT pg_notify('outbox_messages', outbox_id)` — wake the outbox worker
5. `COMMIT`

The API returns success immediately. **No AWS call in the request path.**

### Outbox Worker (`worker/outboxWorker.go`)

1. Opens a PostgreSQL `LISTEN` on channel `outbox_messages` (via `pq.NewListener`)
2. On `NOTIFY`, reads the `outboxID` from the notification payload
3. Fetches the row from `outbox_messages` where `processed_at IS NULL`
4. Marshals `{ applicationId, jobID }` and sends to SQS
5. Retries up to **6 times** with linear backoff
6. On success: `UPDATE outbox_messages SET processed_at = NOW()`

**Benefits:**

- **Atomicity** — outbox row only exists if the application was committed
- **Reliability** — SQS publish failures are retried without blocking the user
- **Decoupling** — API stays fast; queue publishing is async
- **Recoverability** — unprocessed outbox rows can be replayed if needed

---

## 🤖 Evaluation Worker (`worker/worker.go`)

The evaluation worker long-polls SQS and runs the AI pipeline. It runs as `go Start(db.DB)` inside the worker process.

**SQS consumer loop:**

1. Long-poll SQS (`WaitTimeSeconds: 20`)
2. **Idempotency check** — skip if already `Interview` or `Rejected`
3. Update status → `In Review` on `job_applications` + `job_analysis`
4. **Redis publish** → API pushes update to frontend via WebSocket
5. Fetch resume/cover URLs from DB
6. **Parallel goroutines** download and parse PDFs from S3 URLs
7. Load job description from PostgreSQL
8. **OpenAI** → `match_score`, `decision` (`Interview` / `Rejected`), `feedback`
9. Update `job_analysis` and `job_applications` with final verdict
10. **Redis publish** final status
11. **Delete SQS message** only after success

```
Outbox worker:  PostgreSQL NOTIFY → SQS enqueue
Eval worker:    SQS dequeue → process → Redis → WebSocket
```

---

## 🔔 Real-Time Notifications

The worker process cannot hold browser WebSocket connections. Redis pub/sub bridges the worker and API:

```
Evaluation worker → redis.Publish("notifications", payload)
        ↓
API subscriber goroutine → websocket.SendToUser(email, message)
        ↓
Browser WebSocket (/ws)
```

Payload sent to clients: `{ status, jobId, jobName }` (email is stripped before delivery).

---

## 🖥️ Frontend

### Route Structure

Next.js App Router with **route groups** separating public and authenticated UI.

**Public routes** (no dashboard shell):

| Route | Purpose |
|-------|---------|
| `/` | Login |
| `/create-account` | Registration |
| `/profile-setup` | Multi-step onboarding wizard |

**Authenticated routes** (`(app)/` group):

| Route | Purpose |
|-------|---------|
| `/home-page` | Browse jobs, save/bookmark, paginate |
| `/saved-jobs` | Paginated saved job list |
| `/job-applications` | Paginated applied jobs history |
| `/jobs/[jobId]` | Job detail, apply, add-to-folder drawer |
| `/apply/[jobId]?mode=manual\|auto` | Submit application |
| `/profile` | Read-only profile overview |
| `/folders` | Create, rename, delete folders |
| `/folders/[folder_id]` | Jobs inside a folder |
| `/notifications` | Live application status board |

### Layout Hierarchy

```text
app/layout.tsx           → Root: metadata, globals.css
app/(app)/layout.tsx     → Dashboard shell + providers
  ├── TotalPointsProvider
  ├── WebSocketProvider
  ├── Navbar
  ├── Sidebar
  └── CheckSession → {children}
```

### State Management

**Zustand stores**

- `userStore` — profile/setup data (resume URL, cover letter, portfolio, GitHub, job preferences). Populated on home page load; used by profile and apply pages for auto-fill.
- `useFolderStore` — folder list with job IDs. Set on `/folders`; read on `/folders/[folder_id]`.

**React Context**

- `WebSocketProvider` — application statuses (`notifs[]`) and unread badge count. Hydrates from REST on mount, then merges live WebSocket updates by `jobId`.
- `TotalPointsProvider` — profile completeness % shown in sidebar until 100%.

**Local component state**

- Job lists and cursor pagination
- Form inputs, drawers, modals
- Bookmark toggles
- Loading/success animation state on apply page

### Real-Time Flow (Frontend)

1. User logs in → enters `(app)` layout
2. `WebSocketProvider` mounts: REST hydrate + WebSocket connect to `/ws`
3. Sidebar fetches unread count via `GET /fetch_unread`
4. Worker updates status → Redis → API → WebSocket message
5. Provider merges update into `notifs[]`, increments unread
6. User opens `/notifications` → color-coded status badges
7. On notifications page mount → `PATCH /update_job_status` marks applications as read

Status badges: **In Review** (yellow), **Interview** (green), **Rejected** (red).

---

## 🔁 End-to-End Application Workflow

```text
User submits application (manual or auto)
    ↓
API: upload files to S3 (if manual)
    ↓
API: BEGIN transaction
      - INSERT job_applications
      - INSERT job_analysis (Pending)
      - INSERT outbox_messages
      - pg_notify('outbox_messages', outbox_id)
    COMMIT
    ↓
API returns 200 immediately
    ↓
PostgreSQL NOTIFY → Outbox worker wakes
    ↓
Outbox worker: read outbox row → SendMessage to SQS (retry on failure)
    ↓
Outbox worker: mark outbox processed_at
    ↓
Evaluation worker: ReceiveMessage from SQS
    ↓
Status → "In Review" → Redis → WebSocket → UI updates
    ↓
Fetch PDFs (goroutines) → OpenAI evaluation
    ↓
Status → "Interview" or "Rejected" → Redis → WebSocket → UI updates
    ↓
Delete SQS message
```

### Apply Modes

| Mode | Route | API | Payload |
|------|-------|-----|---------|
| Manual | `/apply/[jobId]?mode=manual` | `POST /submit_application` | multipart FormData (files + links) |
| Auto | `/apply/[jobId]?mode=auto` | `POST /auto_submit_application` | JSON with profile S3 URLs |

On submit success, the apply page shows a Framer Motion loading overlay, confetti animation, then redirects to `/home-page`. Evaluation runs asynchronously on the backend.

---

## 📁 Project Structure

```text
dashboard/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated routes
│   │   ├── layout.tsx            # Dashboard shell + providers
│   │   ├── providers/
│   │   │   ├── WebSocketProvider.tsx
│   │   │   └── TotalPointsProvider.tsx
│   │   ├── home-page/
│   │   ├── saved-jobs/
│   │   ├── job-applications/
│   │   ├── jobs/[jobId]/
│   │   ├── apply/[jobId]/
│   │   ├── profile/
│   │   ├── folders/
│   │   ├── folders/[folder_id]/
│   │   └── notifications/
│   ├── create-account/
│   ├── profile-setup/
│   ├── reusable-components/      # Navbar, Sidebar, CheckSession
│   ├── store/                    # Zustand stores
│   ├── layout.tsx
│   ├── page.tsx                  # Login
│   └── globals.css
│
└── backend/
    ├── main.go                   # API server entry point
    ├── routes/routes.go
    ├── handlers/                 # REST handlers
    ├── db/connection.go
    ├── redis/client.go
    ├── storage/s3.go
    ├── websocket/                # WebSocket handler, manager, subscriber
    ├── sessions/store.go
    ├── middleware/cors.go
    └── worker/
        ├── main.go               # Worker process entry point
        ├── outboxWorker.go       # Outbox → SQS publisher
        ├── worker.go             # SQS → AI evaluation consumer
        ├── processor.go
        ├── openai.go
        └── readfiles.go
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- Go 1.26+
- PostgreSQL (with `LISTEN/NOTIFY` support)
- Redis
- AWS account (S3 bucket + SQS queue)
- OpenAI API key

### Environment Variables

Create `backend/.env`:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=

S3_BUCKET=
SQS_URL=

REDIS_ADDR=

OPENAI_API_KEY=
```

AWS credentials are loaded via the default AWS SDK config chain (e.g. environment variables or IAM role on EC2).

### Database Setup

Ensure PostgreSQL has the required tables (`users`, `jobs`, `job_applications`, `job_analysis`, `outbox_messages`, `user_saved_jobs`, folders, etc.) and a unique constraint on `(job_id, user_email)` on `job_applications`.

### Run Locally

**1. Start the API server**

```bash
cd backend
go run main.go
```

API listens on `http://localhost:8080`.

**2. Start the worker process**

```bash
cd backend/worker
go run .
```

This runs both the outbox worker and evaluation worker.

**3. Start the frontend**

```bash
cd dashboard
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## 🎨 UI Patterns

- **Design** — Slate palette, white rounded cards (`rounded-3xl`), consistent panel layout across pages
- **Pagination** — Cursor-based (not offset) with `cursor`, `nextCursor`, and history stack for back/next navigation
- **Micro-interactions** — Bookmark save/remove animations, folder created toast, apply success confetti, profile setup completion steps
- **Responsive** — Sidebar hidden on mobile (`hidden md:flex`)

---

## 📌 Design Decisions

| Decision | Rationale |
|----------|-----------|
| Transactional outbox | Guarantees SQS messages only enqueue after DB commit; retries failures without blocking users |
| Separate worker process | Keeps API responsive; evaluation and outbox work run outside the HTTP server |
| Redis pub/sub | Worker and API are separate processes; pub/sub bridges them without shared memory |
| SQS long polling | Efficient queue consumption without tight DB polling for pending jobs |
| Idempotency in evaluation worker | SQS at-least-once delivery and outbox retries require safe duplicate handling |
| Cookie sessions | Simple auth for a dashboard app; WebSocket auth reuses the same session |
| Client-side fetching | Direct API calls with `credentials: "include"`; no Next.js API routes |

---

## 📄 License

This project is for educational and portfolio use.
