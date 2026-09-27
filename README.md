# Progress Tracker

A personal sprint and daily-task tracker for structured interview preparation. The app is a single Next.js application with Tailwind CSS and MongoDB Atlas, ready for Vercel.

## Features

- Eight-sprint preparation roadmap
- Daily task schedules with estimates and difficulty
- Completion tracking, time spent, progress, and days remaining
- Responsive dashboard, sprint, and task views
- MongoDB-backed progress that stays in sync across sessions
- Idempotent plan catalog synchronization that preserves task progress

## Stack

- Next.js 16 route handlers and pages, React 19, TypeScript, and Tailwind CSS 4
- Mongoose, Zod, and MongoDB Atlas

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `frontend/.env.local.example` to `frontend/.env.local` and set `MONGODB_URI`.

3. Start the application:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The Next.js API synchronizes missing plan entries into `MONGODB_DB` without overwriting completion state or time spent.

## Vercel

Import the repository, set the Root Directory to `frontend`, and add `MONGODB_URI` and `MONGODB_DB` as environment variables. No separate backend deployment is needed.

## Commands

```bash
npm run dev          # Start the Next.js app
npm run typecheck    # Check TypeScript
npm test             # Validate the plan catalog
npm run build        # Create production builds
npm run format       # Format source and configuration files
npm run format:check # Verify formatting without changing files
```

## Repository safety

Real environment files, private keys, logs, compiler caches, dependencies, and build output are ignored. Commit only the provided `.env.example` templates and never place credentials in tracked files.
