# CipherChat - Node.js + Socket.IO + Redis Backend

Complete rewrite of CipherChat backend from Supabase to Node.js stack.

## Prerequisites

- Node.js 18+ installed
- Redis server running locally or accessible remotely

## Installation

### 1. Install Redis

**Windows (using Memurai):**
```bash
# Download and install Memurai from https://www.memurai.com/
# Or use Docker:
docker run -d -p 6379:6379 redis:latest
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
npm install
```

## Configuration

### Backend (.env)

Create `server/.env` file:
```
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
FRONTEND_URL=http://localhost:5173
ROOM_TTL=86400
MESSAGE_TTL=3600
```

### Frontend (.env)

Create `.env` file in root:
```
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## Running the Application

### Start Backend Server

```bash
cd server
npm start
```

Server will run on `http://localhost:3001`

### Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Architecture

### Backend Stack
- **Express** - HTTP server
- **Socket.IO** - Real-time WebSocket communication
- **Redis** - Ephemeral data storage
- **bcrypt** - Password hashing

### Frontend Stack
- **React + TypeScript** - UI framework
- **Socket.IO Client** - Real-time communication
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

### Data Flow

1. **Room Creation**: HTTP POST → bcrypt hash → Redis storage (24h TTL)
2. **Room Joining**: HTTP GET → Password verification → Socket.IO connection
3. **Real-time Chat**: Socket.IO events → Redis storage (1h TTL) → Broadcast to room
4. **User Presence**: Socket.IO presence tracking → Redis sets → Auto-cleanup on disconnect

## API Endpoints

### HTTP REST API

- `POST /api/rooms/create` - Create new room
- `GET /api/rooms/:name/protected` - Check if room is password-protected
- `POST /api/rooms/verify` - Verify room password

### Socket.IO Events

**Client → Server:**
- `join-room` - Join a chat room
- `send-message` - Send message to room

**Server → Client:**
- `users-updated` - User list changed
- `new-message` - New message received
- `error` - Error occurred

## Testing

Test the backend API:
```bash
# Create room
curl -X POST http://localhost:3001/api/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","password":"secret"}'

# Verify password
curl -X POST http://localhost:3001/api/rooms/verify \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test","password":"secret"}'
```

## Deployment

### Backend Deployment (e.g., Railway, Render)

1. Set environment variables
2. Ensure Redis is accessible
3. Deploy with `npm start`

### Frontend Deployment (Netlify)

1. Update `.env` with production backend URL
2. Build: `npm run build`
3. Deploy `dist` folder

## Changes from Supabase

- ✅ Removed Supabase dependency
- ✅ Custom Node.js backend with full control
- ✅ Redis for ephemeral data (auto-expiry)
- ✅ Socket.IO for real-time communication
- ✅ bcrypt for password hashing
- ✅ RESTful API for room operations

## Troubleshooting

**Redis connection failed:**
- Ensure Redis is running: `redis-cli ping` (should return PONG)
- Check Redis host/port in `.env`

**Socket.IO connection failed:**
- Check CORS settings in `server/server.js`
- Verify `VITE_SOCKET_URL` in frontend `.env`

**Module not found errors:**
- Run `npm install` in both root and `server` directories