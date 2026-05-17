# Edyra — Enterprise Academic Learning Management System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-00684A?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-blue?style=for-the-badge&logo=vercel" alt="Vercel" />
</div>

<br />

An advanced AI-powered Academic Ecosystem combining Learning Management System (LMS), Academic ERP, Proctored Examination Portal, AI tools, analytics, and collaboration tools into a single enterprise-grade platform.

---

## 🌐 Live Production Demo

- **Frontend Application:** [https://edyra.vercel.app](https://edyra.vercel.app)
- **Backend API Server:** [https://edyrabackend.vercel.app](https://edyrabackend.vercel.app)

### 🔑 Demo Credentials

| Portal Role | Login Method | Verification Credentials |
| :--- | :--- | :--- |
| **🛡️ Administrator** | Email + Password | `admin@edyra.com` / `Admin@123` |
| **👨‍🏫 Teacher / Proctor** | Email + Password | `teacher@edyra.com` / `Teacher@123` |
| **🎓 Student** | Student ID + DOB | `EDY001` / `01012000` *(Format: DDMMYYYY)* |

---

## 🏗 System Architecture

```mermaid
graph TD
    Client[Client Browser / Next.js 14] -->|HTTPS REST API| Gateway[Express.js Backend API]
    Client -->|Socket.IO Telemetry| Socket[WebSocket Server / Proctor Hub]
    
    Gateway -->|Mongoose lean queries| DB[(MongoDB Atlas Cloud)]
    Socket -->|Direct Event Sync| ProctorUI[Live Teacher Monitor]
    
    subgraph Security Layer
        SEB[Safe Exam Browser Overlay]
        Events[Key/Tab/Focus Interceptors]
        FP[FingerprintJS Verification]
    end
    
    Client --> Security Layer
```

---

## ⚡ Core Enterprise Features

### 🛡️ Safe Exam Browser (SEB-Like) Lockdown & Proctoring
- **Fullscreen Enforcement Overlay**: Active monitoring forces students into an unbreakable fullscreen lockdown. Exiting fullscreen instantly pauses the exam and alerts proctors.
- **Advanced Event Interception**: Completely blocks `Alt+Tab`, `Ctrl+C`, `Ctrl+V`, `Cmd+C`, `Cmd+V`, `PrintScreen`, `F12`, and right-click context menus.
- **Live Telemetry & Auditing**: Tracks window blur, tab switching, and focus loss in real time with immutable audit logging.
- **Network Resiliency**: Generates a fast fallback browser fingerprint in under 1 second, guaranteeing smooth exam initialization on any connection.

### 🎓 Student Examination Portal
- **Instant DOB Verification**: Frictionless, secure login using Student ID + Date of Birth.
- **Dynamic Question Palette**: Color-coded grid showing Answered, Unanswered, Flagged for Review, and Visited states.
- **Zero-Lag Timer**: Synchronized countdown interval immune to React re-render loops.
- **Auto-Save Infrastructure**: Periodic 30-second background snapshots ensure zero data loss during power or network outages.

### 👨‍🏫 Teacher & Controller Dashboard
- **Debounced Live Monitoring**: Real-time Socket.IO event listeners mutate local React state instantly, while background HTTP syncs are throttled to 30s to prevent server polling storms.
- **Comprehensive Exam Engine**: Support for MCQ (Single/Multi-correct), True/False, question shuffling, option shuffling, and negative marking.
- **Granular Session Controls**: Immediate proctor interventions allowing Force Submit or Session Termination for suspicious candidates.

### 🏢 Administrative & Institutional Management
- **Infrastructure Health Center**: Live diagnostic dashboard monitoring Database Latency, RSS Memory allocation, System Load averages, and API uptime.
- **Batch CSV Onboarding**: Instantaneous bulk student and question bank imports.
- **Global Audit Logging**: Complete visibility into every administrative action, user login, and security event across the platform.

---

## 💻 Tech Stack & Performance Optimizations

| Layer | Technology | Performance / Security Enhancement |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Zustand | Functional state updaters prevent timer re-renders; debounced Socket listeners eliminate UI stutter. |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose) | Mongoose `.lean()` bypasses Document hydration, delivering up to 5x faster JSON serialization. |
| **Real-time** | Socket.IO (Direct Sync) + Throttled HTTP Polling | Dual-namespace architecture (`/exam-session`, `/exam-monitor`) ensures sub-millisecond proctor alerts. |
| **Deployment** | Vercel Serverless Cloud | Fully containerized, serverless-ready APIs with strict CORS and Rate Limiting protection. |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance (v6+) or MongoDB Atlas cloud cluster

### 1. Backend API Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/edyra
JWT_SECRET=super-secure-enterprise-jwt-secret-key-32-chars
JWT_EXPIRES_IN=24h
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

```bash
npm run dev    # Starts API server on http://localhost:5000
```
> *Note: On first run, the backend automatically seeds demo admin, teacher, and student accounts.*

### 2. Frontend Application Setup
```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Edyra
```

```bash
npm run dev    # Starts frontend application on http://localhost:3000
```

---

## 📦 Vercel Production Deployment

### Backend Deployment
1. Navigate to [Vercel Dashboard](https://vercel.com) → **Add New Project**.
2. Import the repository and select `backend` as the **Root Directory**.
3. Set **Framework Preset** to `Other`.
4. Configure Environment Variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN=https://edyra.vercel.app`.
5. Click **Deploy**.

### Frontend Deployment
1. Import the repository and select `frontend` as the **Root Directory**.
2. Set **Framework Preset** to `Next.js`.
3. Configure Environment Variables: `NEXT_PUBLIC_API_URL=/api`, `NEXT_PUBLIC_BACKEND_URL=https://edyrabackend.vercel.app/api`, `NEXT_PUBLIC_WS_URL=https://edyrabackend.vercel.app`.
4. Click **Deploy**.

---

## 📜 API Route Directory

### Authentication & Sessions
- `POST /api/auth/login` — Staff Authentication (Email/Password)
- `POST /api/auth/dob-login` — Student Authentication (ID/DOB)
- `GET /api/auth/me` — Current User Profile & Permissions
- `POST /api/auth/logout` — Secure Session Invalidation

### Examination Engine (`/api/exam-engine/*`)
- `POST /sessions/init` — Secure Session Handshake & Fingerprint Binding
- `POST /sessions/:id/answers` — Incremental Background Answer Auto-Save
- `POST /sessions/:id/violations` — Real-time SEB Lockdown Violation Telemetry
- `POST /sessions/:id/submit` — Final Exam Grading & Submission

### Institutional Management (`/api/admin/*` & `/api/teacher/*`)
- `GET /monitor/sessions` — Active Live Exam Monitoring Feeds
- `POST /monitor/sessions/:id/force-submit` — Proctor Intervention Force Submit
- `POST /monitor/sessions/:id/terminate` — Proctor Intervention Session Termination
- `GET /system/health` — Subsystem Diagnostics & Latency Metrics

---

## 📄 License

This enterprise project is licensed under the **MIT License**.
