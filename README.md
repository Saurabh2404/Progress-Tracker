# Progress Tracker

A personal sprint and daily-task tracker for structured interview preparation. The app uses Next.js, Tailwind CSS, Framer Motion, Express, and MongoDB Atlas.

## Features

- Eight-sprint preparation roadmap
- Daily task schedules with estimates and difficulty
- Completion tracking, time spent, progress, and days remaining
- Responsive light and dark dashboard with animated sprint and task views
- MongoDB-backed progress that stays in sync across sessions
- Idempotent plan catalog synchronization that preserves task progress

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Framer Motion
- Node.js and an optional Express host that serves the same Next application without duplicating APIs
- Mongoose, Zod, and MongoDB Atlas

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `frontend/.env.local.example` to `frontend/.env.local` and set the MongoDB and authentication variables. Generate a password hash with `npm run auth:hash -w frontend -- "your-password"`.

3. Start the application:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The Next.js API synchronizes missing plan entries into `MONGODB_DB` without overwriting completion state or time spent.

To run the same application through Express locally, use `npm run dev:express`. Vercel continues to use the native Next.js entry point.

## Vercel

Import the repository, set the Root Directory to `frontend`, and add `MONGODB_URI`, `MONGODB_DB`, `AUTH_EMAIL`, `AUTH_PASSWORD_HASH`, and `AUTH_SECRET`. Vercel uses the native Next.js route handlers; the Express host is available for traditional Node.js hosting.

## Commands

```bash
npm run dev          # Start the Next.js app
npm run typecheck    # Check TypeScript
npm test             # Validate the plan catalog
npm run build        # Create production builds
npm run dev:express  # Run the same Next.js app through Express
```

## Repository safety

Real environment files, private keys, logs, compiler caches, dependencies, and build output are ignored. Commit only the provided `.env.example` templates and never place credentials in tracked files.
