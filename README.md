# AssetLens

**AssetLens** is a production pipeline tool for Unreal Engine 5 — concretely, it's ClickUp integrated directly inside UE5. Task management, asset tracking, statuses, all without leaving the engine.

It consists of a native UE5 C++ plugin coupled with a web interface (Next.js / TypeScript), backed by a PostgreSQL database.

---

## Features

- Task assignment and tracking per asset
- Asset status management
- Full-text search across assets
- Scene parser — scans the current level and syncs metadata to the backend
- Perforce integration for versioning
- Notification system
- Web interface accessible inside UE5 via embedded WebView panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| UE5 Plugin | C++, WebBrowser module |
| Frontend | Next.js, TypeScript, shadcn/ui, Tailwind CSS |
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL, Prisma ORM |
| DevOps | Docker, Docker Compose |
| Versioning | Perforce (P4) |

---

## Getting Started

### Prerequisites

- Unreal Engine 5.x
- Node.js 20+
- PostgreSQL 16+ (local or via Docker)
- (Optional) Docker & Docker Compose

---

## Running without Docker

### 1. Database

Make sure PostgreSQL is running locally and create the database:

```bash
psql -U postgres
CREATE DATABASE assetlens;
\q
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/assetlens
PORT=3001
```

Run Prisma migrations:

```bash
npx prisma migrate dev
```

Start the backend:

```bash
npx ts-node src/index.ts
```

The backend will be available at `http://localhost:3001`. You can verify it with:

```bash
curl http://localhost:3001/health
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

The web interface will be available at `http://localhost:3000`.

---

## Running with Docker

### Prerequisites

- Docker
- Docker Compose

### Start everything

From the root of the project:

```bash
docker-compose up --build
```

This will start three containers:
- `assetlens_db` — PostgreSQL on port 5432
- `assetlens_backend` — Node.js backend on port 3001
- `assetlens_frontend` — Next.js frontend on port 3000

### Stop

```bash
docker-compose down
```

### Reset everything (including database)

```bash
docker-compose down -v
```

> ⚠️ `-v` removes all volumes, including the database. All data will be lost.

---

## Unreal Engine 5 — Plugin Setup

### Installation

1. Copy the `plugin/AssetLens` folder into your project's `Plugins/` directory
2. Open your project in UE5
3. Enable the plugin: **Edit → Plugins → Search "AssetLens" → Enable**
4. Restart the editor

### Configuration

Go to **Edit → Project Settings → Plugins → AssetLens** and configure:

| Setting | Description |
|---|---|
| `BackendURL` | URL of the backend (default: `http://localhost:3001`) |
| `P4Server` | Perforce server address |
| `P4User` | Perforce username |
| `P4Client` | Perforce workspace name |
| `bP4SimulationMode` | Enable to simulate Perforce without a server (dev mode) |

### Usage

**WebView Panel**
- Open via **Window → AssetLens** in the editor toolbar
- The panel embeds the web interface directly inside UE5
- Navigates automatically to an asset's page when selected in the viewport

**Content Browser**
- Right-click any asset → **AssetLens → View** to open its page
- Right-click any asset → **AssetLens → Create** to create a new entry

**Scene Parser**
- Click the **Sync Scene** button in the AssetLens panel
- Scans all actors in the current level and sends metadata to the backend

---

## Database — Useful Commands

Connect to the database:

```bash
# Local
psql -U postgres -d assetlens

# Via Docker
docker exec -it assetlens_db psql -U postgres -d assetlens
```

List tables:

```sql
\dt
```

View table contents:

```sql
SELECT * FROM your_table LIMIT 10;
```

Delete a record by ID:

```sql
DELETE FROM your_table WHERE id = 'your-uuid-here';
```
