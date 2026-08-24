# CipherChat — Zero-Knowledge Ephemeral Chat

[![Version](https://img.shields.io/badge/version-2.4_LTS-00f0ff.svg?style=flat-square)](https://github.com/)
[![License](https://img.shields.io/badge/license-MIT-00ff66.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-20_LTS-339933.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?style=flat-square&logo=react)](https://react.dev/)
[![Encryption](https://img.shields.io/badge/E2EE-AES--256--GCM-blueviolet.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Storage](https://img.shields.io/badge/Data_Store-Redis_7_(RAM--Only)-DC382D.svg?style=flat-square&logo=redis)](https://redis.io/)

> **Audience:** Privacy-conscious general consumers & secure teams.  
> **Scale Target:** 10,000+ concurrent users.  
> **Core Promise:** Ephemeral, end-to-end encrypted chat with zero metadata leakage, zero persistent user accounts, and zero server-side plaintext.

---

## Table of Contents

- [1. Core Principles & Privacy Guarantees](#1-core-principles--privacy-guarantees)
- [2. Cryptographic Architecture](#2-cryptographic-architecture)
- [3. System Architecture](#3-system-architecture)
- [4. Key Features](#4-key-features)
- [5. Redis Ephemeral Data Model](#5-redis-ephemeral-data-model)
- [6. Project Structure](#6-project-structure)
- [7. Getting Started](#7-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [8. Testing & Quality Assurance](#8-testing--quality-assurance)
- [9. API & Socket.IO Specification](#9-api--socketio-specification)
- [10. Scaling & Deployment](#10-scaling--deployment)
- [11. Security Checklist](#11-security-checklist)

---

## 1. Core Principles & Privacy Guarantees

- **Zero-Knowledge by Default:** The server operates as a dumb relay; it never sees plaintext messages or room passwords.
- **In-Browser End-to-End Encryption (E2EE):** AES-256-GCM encryption/decryption occurs exclusively in the client's browser using the native Web Crypto API.
- **Ephemeral RAM-Only Storage:** All data lives in Redis memory with creator-configured hard TTLs. Nothing is persisted to disk or databases.
- **Empty-Room Grace Period Destruction:** When all participants leave a room, a 2-minute countdown begins. If no participant rejoins within the grace period, the room and all its cryptographic history are automatically purged from Redis.
- **Zero Identity & Metadata:** No user registration, no cookies, no tracking pixels, no telemetry databases. Nicknames and sessions are purely ephemeral.

---

## 2. Cryptographic Architecture

### Key Derivation Flow
```
roomPassword + roomSlug  ──►  PBKDF2 (SHA-256, 310,000 iterations)  ──►  AES-256-GCM 256-bit Key
```
- **Deterministic Salt:** `UTF-8(roomSlug)` ensures all members with the room password compute the identical symmetric encryption key locally.
- **Isolation:** The derived cryptographic key **never** leaves the browser memory.

### Message Encryption Flow
```
Plaintext ──► DOMPurify ──► AES-GCM Encrypt(Key, Random 96-bit IV) ──► { Ciphertext, IV } ──► Socket.IO ──► Redis
```
- A fresh, cryptographically secure 96-bit Initialization Vector (`IV`) is generated per message.
- Ciphertext and IV are transmitted over TLS and relayed via Socket.IO.
- Decryption occurs entirely inside the recipient's browser.

---

## 3. System Architecture

```
Browser Client (React 18 + Web Crypto API)
        │
        │  WebSocket / TLS (Socket.IO)
        ▼
Reverse Proxy / Load Balancer (TLS Termination: Nginx / Caddy)
        │
        ▼
Node.js Cluster (Express + Socket.IO + @socket.io/redis-adapter)
        │
        ▼
Redis 7 (RAM-Only Cluster Mode: Messages, Metadata, Presence)
```

---

## 4. Key Features

- **Isolated Rooms by Slug:** Auto-generated human-readable cryptographic slugs (e.g., `quantum-vault-6443`) with one-click re-roll and locked input fields during room creation.
- **Custom Room Lifespan:** Creator sets hard TTL expiration options: `1 Hour`, `6 Hours`, `24 Hours`, or `7 Days`.
- **Password Protection:** Optional password protection hashed server-side via `bcrypt` (cost factor 12).
- **Grace Period Auto-Deletion:** Automatically destroys empty rooms after a 2-minute countdown once the last participant leaves, while canceling deletion if someone rejoins.
- **Real-Time Presence & Typing Indicators:** Live participant roster and typing cues via Redis-backed presence sets.
- **Encrypted Media Sharing:** Client-side encrypted file/image uploads with strict MIME-type validation and room-lifetime expiration.
- **Airtight Message Deduplication:** Client-side optimistic rendering combined with payload and ID fingerprint deduplication.
- **Full-Width Modern Terminal UI:** Obsidian dark theme with cyber-cyan accents, responsive desktop/mobile layout, and autofill styling protection.
- **Multi-Tier Rate Limiting:** Per-IP HTTP rate limiting via `express-rate-limit` and per-socket sliding-window message throttling.

---

## 5. Redis Ephemeral Data Model

| Key Pattern | Redis Type | Expiration (TTL) | Purpose |
|---|---|---|---|
| `room:{slug}:meta` | Hash | Creator-set (or 2m grace) | Room configuration (`name`, `passwordHash`, `maxUsers`, `ttlSeconds`, `createdAt`) |
| `room:{slug}:messages` | List | Creator-set (or 2m grace) | Ciphertext payloads (capped at 500 messages via `LTRIM`) |
| `room:{slug}:users` | Set | Creator-set (or 2m grace) | Active socket/user IDs currently in the room |
| `room:{slug}:users_map` | Hash | Creator-set (or 2m grace) | Ephemeral mapping of user IDs to sanitized aliases |
| `session:{socketId}` | Hash | 24 Hours | Active socket session metadata for cleanup |

---

## 6. Project Structure

```
cipherchat/
├── server/                      # Node.js + Express + Socket.IO Backend
│   ├── config/
│   │   ├── redis.js             # Redis client setup & Lua script limits
│   │   └── socket.js            # Socket.IO handlers, presence, grace period
│   ├── lib/
│   │   ├── logger.js            # Structured Pino logger
│   │   └── wordlist.js          # Cryptographic slug dictionary
│   ├── routes/
│   │   ├── files.js             # Encrypted file upload endpoints
│   │   ├── health.js            # Health and readiness probes (/health, /ready)
│   │   └── rooms.js             # Room creation & verification REST API
│   ├── services/
│   │   ├── messageService.js    # Redis message list persistence & cap
│   │   ├── presenceService.js   # Presence set operations & session tracking
│   │   └── roomService.js       # Room lifecycle, bcrypt verify, slug generator
│   ├── package.json
│   └── server.js                # Server entry point & graceful shutdown
├── src/                         # React 18 + TypeScript Frontend
│   ├── components/
│   │   ├── chat/                # Header, MessageBubble, ChatInput, UserList, Modals
│   │   └── ui/                  # Button, Input, Card, Modal, UI primitives
│   ├── contexts/
│   │   └── ChatContext.tsx      # Global chat reducer, deduplication & key state
│   ├── hooks/
│   │   └── useSocketChat.ts     # Socket.IO client hook & encryption orchestration
│   ├── lib/
│   │   ├── api.ts               # REST API client
│   │   ├── crypto.ts            # Web Crypto API PBKDF2 & AES-256-GCM
│   │   ├── errors.ts            # Error codes and messages
│   │   └── utils.ts             # Tailwind class merging & slug generator
│   ├── pages/
│   │   ├── HomePage.tsx         # Full-width landing page & dispatcher terminal
│   │   └── ChatPage.tsx         # Real-time encrypted chat room interface
│   ├── types/                   # TypeScript interface definitions
│   ├── App.tsx                  # App router configuration
│   └── index.css                # Global styles, scanline animations & autofill overrides
├── tests/
│   ├── unit/                    # Vitest unit test suites
│   ├── integration/             # Vitest Redis integration tests
│   └── e2e/                     # Playwright end-to-end tests
├── vite.config.ts               # Vite configuration
└── package.json
```

---

## 7. Getting Started

### Prerequisites

- **Node.js**: `v18.0.0+` (Node.js 20 LTS recommended)
- **Redis Server**: `v6.2+` or `v7.0+`

#### Starting Redis:
- **Docker:**
  ```bash
  docker run -d --name cipherchat-redis -p 6379:6379 redis:7-alpine
  ```
- **macOS (Homebrew):**
  ```bash
  brew install redis && brew services start redis
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt install redis-server && sudo systemctl start redis
  ```
- **Windows:** Use Docker or Memurai.

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/cipherchat.git
   cd cipherchat
   ```

2. **Install frontend & root dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

---

### Environment Variables

#### Backend (`server/.env`):
```env
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
BCRYPT_COST=12
EMPTY_ROOM_GRACE_PERIOD_SECONDS=120
SOCKET_MSG_RATE_PER_SECOND=5
```

#### Frontend (`.env` in root):
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

---

### Running the Application

1. **Start the backend server (with auto-reload):**
   ```bash
   cd server
   npm run dev
   ```
   *Backend runs on `http://localhost:3001`.*

2. **Start the frontend application:**
   ```bash
   # In the project root directory:
   npm run dev
   ```
   *Frontend opens at `http://localhost:5173`.*

---

## 8. Testing & Quality Assurance

### Run Unit Tests (Vitest + Coverage)
```bash
npm test
```

### Run Redis Integration Tests
```bash
npm run test:integration
```

### Run End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

### Production Build
```bash
npm run build
```

---

## 9. API & Socket.IO Specification

### REST API

| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `GET` | `/health` | Liveness probe & uptime | None |
| `GET` | `/ready` | Readiness check (Redis connection) | None |
| `POST` | `/api/rooms/create` | Creates a new room | `{ "roomName": "slug", "password": "...", "ttl": 3600 }` |
| `GET` | `/api/rooms/:name/protected` | Checks if a room requires a password | None |
| `POST` | `/api/rooms/verify` | Validates password against bcrypt hash | `{ "roomName": "slug", "password": "..." }` |
| `POST` | `/api/files/upload` | Uploads encrypted attachment blob | Multipart `FormData` (`file`) |

### Socket.IO Real-Time Events

#### Client ➔ Server
- `join-room`: `{ roomName, userName, userId, password? }` — Join the target room.
- `send-message`: `{ roomName, message: { id, ciphertext, iv, timestamp, type, ... } }` — Send encrypted payload.
- `typing`: `{ roomName, userId, userName, isTyping }` — Broadcast typing indicator.

#### Server ➔ Client
- `room-joined`: `{ roomName, remainingTtl, maxUsers }` — Confirmation upon joining.
- `message-history`: `Message[]` — Bulk encrypted history sent to newcomer.
- `new-message`: `Message` — Real-time relayed encrypted message or system event.
- `users-updated`: `User[]` — Current participant list in room.
- `user-typing`: `{ userId, userName, isTyping }` — Typing status update.
- `join_error` / `error`: `{ code, message }` — Error notification (`ROOM_FULL`, `ROOM_NOT_FOUND`, etc.).

---

## 10. Scaling & Deployment

- **Node.js Clustering / Multi-Instance:** The backend uses `@socket.io/redis-adapter` to distribute WebSocket events seamlessly across multiple Node.js instances or Kubernetes pods.
- **Process Management:** In production, launch with PM2 cluster mode:
  ```bash
  cd server
  npm run start:cluster
  ```
- **TLS Termination:** Deploy behind Nginx or Caddy with WebSockets proxying and HTTP Strict Transport Security (HSTS) enabled.
- **Frontend Hosting:** Build artifacts (`npm run build`) can be deployed to any static edge provider (Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront).

---

## 11. Security Checklist

- [x] **No Plaintext Message Storage:** Ciphertext and IVs only in RAM.
- [x] **Client-Side Key Generation:** PBKDF2 (310,000 iterations) directly in browser memory.
- [x] **Strict Input Sanitization:** Dual-layer `DOMPurify` (client + server).
- [x] **Password Protection:** bcrypt hash cost factor ≥ 12.
- [x] **Rate Limiting:** IP-level on REST routes and sliding-window limits on Socket.IO messages.
- [x] **Auto-Expiry:** Mandatory TTL on all Redis keys + 2-minute empty room auto-destruction.
- [x] **Security Headers:** Comprehensive Helmet CSP, HSTS, and X-Content-Type-Options.

---

## License

This project is licensed under the [MIT License](LICENSE).