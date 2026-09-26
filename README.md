# Progress Tracker

A personal sprint and daily-task tracker for structured interview preparation. The app uses a Next.js and Tailwind CSS frontend, an Express API, and MongoDB Atlas for durable progress data.

## Features

- Eight-sprint preparation roadmap
- Daily task schedules with estimates and difficulty
- Completion tracking, time spent, progress, and days remaining
- Responsive dashboard, sprint, and task views
- MongoDB-backed live updates across open tabs
- Idempotent plan catalog synchronization that preserves task progress

## Stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS 4
- Node.js, Express, Zod, and Mongoose
- MongoDB Atlas, with an in-memory database fallback for local development

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`.

3. Optionally copy `frontend/.env.local.example` to `frontend/.env.local` when the API does not run at `http://localhost:4000`.

4. Start both applications:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

When `MONGODB_URI` is blank, the backend starts a temporary development database. With Atlas configured, the backend synchronizes missing plan entries into `MONGODB_DB` without overwriting completion state or time spent.

## Commands

```bash
npm run dev          # Start frontend and backend
npm run typecheck    # Check both TypeScript projects
npm test             # Validate the plan catalog
npm run build        # Create production builds
npm run format       # Format source and configuration files
npm run format:check # Verify formatting without changing files
```

## Repository safety

Real environment files, private keys, logs, compiler caches, dependencies, and build output are ignored. Commit only the provided `.env.example` templates and never place credentials in tracked files.
