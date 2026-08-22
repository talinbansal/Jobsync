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
