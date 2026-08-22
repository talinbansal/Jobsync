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

## 🔄 Transactional Outbox Pattern

One of the main architectural decisions in JobSync is the use of a **transactional outbox pattern**.

The API does **not** send messages directly to SQS.

This prevents a failure scenario where the database transaction succeeds but the SQS request fails, leaving an application in the database with no corresponding evaluation job.

### Application Submission

```text
User submits application
        │
        ▼
   API Server
        │
        ├── Upload documents to S3
        │
        ▼
 PostgreSQL Transaction
        │
        ├── INSERT job_applications
        ├── INSERT job_analysis
        ├── INSERT outbox_messages
        └── NOTIFY outbox_messages
        │
        ▼
      COMMIT
        │
        ▼
 API returns immediately

The outbox worker then handles the queue operation asynchronously:

PostgreSQL NOTIFY
        │
        ▼
  Outbox Worker
        │
        ▼
Read outbox_messages
        │
        ▼
    Send to SQS
        │
        ├── Failure → Retry
        │
        └── Success
              │
              ▼
      processed_at = NOW()

Why Use an Outbox?
Atomicity – The outbox record is committed alongside the application.
Reliability – SQS failures can be retried independently.
Decoupling – API requests don't depend on AWS queue availability.
Fast responses – The user doesn't wait for SQS to accept the message.
Recoverability – Unprocessed outbox records can be replayed if necessary.
AI Evaluation Pipeline

Once an application reaches SQS, the evaluation worker processes it asynchronously.

SQS Message
     │
     ▼
Idempotency Check
     │
     ▼
Status → "In Review"
     │
     ├──────────────► Redis → WebSocket → Frontend
     │
     ▼
Fetch Resume + Cover Letter URLs
     │
     ▼
Download PDFs Concurrently
     │
     ▼
Extract Document Text
     │
     ▼
Fetch Job Description
     │
     ▼
OpenAI Evaluation
     │
     ▼
Match Score + Decision + Feedback
     │
     ├── Interview
     │
     └── Rejected
     │
     ▼
Update PostgreSQL
     │
     ▼
Redis Notification
     │
     ▼
WebSocket
     │
     ▼
Frontend

The worker uses goroutines to download and process the resume and cover letter concurrently.

SQS messages are only deleted after successful processing, preventing failed evaluations from being lost.

Real-Time Notifications

The evaluation worker is a separate process from the API server, so it cannot directly access browser WebSocket connections.

Redis Pub/Sub acts as the communication bridge.

Evaluation Worker
        │
        │ Redis Publish
        ▼
Redis "notifications"
        │
        ▼
API Redis Subscriber
        │
        ▼
WebSocket Manager
        │
        ▼
Browser WebSocket
        │
        ▼
WebSocketProvider
        │
        ▼
Notification UI

The frontend initially hydrates application statuses through REST and then receives live changes through WebSockets.

Application states include:

Applied
In Review
Interview
Rejected
Data Model
Table	Purpose
users	User accounts, profile data, and profile completeness
jobs	Job listings
user_saved_jobs	Saved/bookmarked jobs
folders	User-created job folders
job_folders	Jobs associated with folders
job_applications	Submitted applications and application status
job_analysis	AI evaluation state, score, feedback, and decision
outbox_messages	Pending SQS messages

Applications are protected against duplicate submissions using a unique constraint on:

(job_id, user_email)

This allows the backend to safely reject duplicate applications with a 409 Conflict response.

Architectural Characteristics
Strengths
Transactional outbox pattern prevents database/queue inconsistencies.
Asynchronous AI evaluation keeps application requests fast.
SQS long polling efficiently consumes evaluation jobs.
Idempotent evaluation protects against duplicate/replayed messages.
Concurrent PDF processing uses goroutines to reduce evaluation latency.
Redis Pub/Sub bridges the worker process and WebSocket layer.
REST + WebSocket hybrid provides initial state hydration and real-time updates.
Cursor-based pagination provides consistent pagination across job-related views.
Separation of concerns between API, queue publishing, and AI evaluation.
