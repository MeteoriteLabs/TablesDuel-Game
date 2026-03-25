# 🎯 Tables Duel

A fun, fast multiplayer + solo **times-table game** built with React, TypeScript, Express, and WebSockets.

> Practice multiplication in a way that feels like a real game: live lobbies, ready-up flow, score streaks, and instant feedback.

---

## ✨ Features

- **Solo Mode** with local question generation for instant play.
- **Multiplayer Rooms** (up to 10 players per room).
- **Three game modes**:
  - `time` (play until timer ends)
  - `target` (race to a target score)
  - `endless` (continuous practice)
- **Difficulty levels** (`easy`, `medium`, `hard`) with weighted scoring.
- **Question variants** for stronger recall:
  - `a × b = ?`
  - `? × b = c`
  - `a × ? = c`
- **Detailed results** including score, accuracy, streak, and question history.
- **Responsive modern UI** using Tailwind + Radix/Shadcn components.

---

## 🧠 How the game works

### 1) Start from the landing screen
You can:
- Play solo immediately.
- Create a multiplayer room.
- Join an existing room with a room code.

You can also configure settings before starting:
- Mode (`time`, `target`, `endless`)
- Time limit / target score
- Multiplication table range (`minTable` → `maxTable`)
- Difficulty

### 2) Multiplayer room lifecycle
1. Host creates room.
2. Other players join with room ID.
3. Players click **I'm Ready**.
4. When everyone is ready, the server starts the game and broadcasts the first question.

### 3) During the match
- Answer using keyboard or on-screen keypad.
- Correct answers increase score and streak.
- Every 5-correct streak gives a small bonus.
- Live updates are broadcast to all players in the room.

### 4) Results
At game end, players see:
- Final scores / leaderboard
- Accuracy and totals
- Full question history with correct solutions

---

## 🏗️ Tech stack

### Frontend
- React + TypeScript + Vite
- Zustand (client game state)
- Wouter (routing)
- Tailwind CSS + Radix/Shadcn UI

### Backend
- Express (HTTP server)
- `ws` WebSocket server on `/ws` for real-time gameplay
- In-memory storage adapter (`MemStorage`) for users, rooms, and participants

### Shared
- Zod + Drizzle schema definitions in `shared/schema.ts`

> Note: Drizzle config exists for PostgreSQL, but current runtime storage for game state is in-memory.

---

## 📦 Project structure

```text
.
├── client/                 # React app
│   └── src/
│       ├── pages/          # Home, lobby, game, results
│       ├── components/     # UI and game components
│       └── lib/            # Socket client, state store, question generator
├── server/                 # Express + WebSocket server
│   ├── index.ts            # App bootstrap
│   ├── routes.ts           # WebSocket event handling
│   ├── game-manager.ts     # Core game logic
│   └── storage.ts          # Storage abstraction + MemStorage
├── shared/
│   └── schema.ts           # Shared types + zod schemas
└── README.md
```

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Then open: `http://localhost:5000`

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm run start
```

---

## 🛠️ Available scripts

- `npm run dev` — start fullstack app in development mode (tsx server + Vite middleware).
- `npm run build` — build client with Vite and bundle server with esbuild.
- `npm run start` — run the production bundle.
- `npm run check` — run TypeScript type-checking.
- `npm run db:push` — push Drizzle schema to PostgreSQL (requires `DATABASE_URL`).

---

## 🔌 WebSocket message flow (multiplayer)

### Client → Server
- `room:create`
- `room:join`
- `player:ready`
- `answer:submit`

### Server → Client
- `room:created`
- `room:joined`
- `room:state`
- `game:start`
- `answer:result`
- `game:update`
- `game:end`
- `error`

---

## ⚙️ Configuration notes

- Server listens on `PORT` env var, defaulting to `5000`.
- WebSocket endpoint uses the same host as the app at path `/ws`.
- `drizzle.config.ts` requires `DATABASE_URL` when running Drizzle commands.

---

## 🤝 Contributing

Contributions are welcome.

If you open a PR, helpful things to include:
- What changed and why
- Before/after behavior
- Screenshots for UI updates
- Test/check commands you ran

---

## 📄 License

MIT (from `package.json`).
