# Session Booking API

A REST API where teachers publish available sessions, users book them, and completed sessions appear in the user's history.

**Stack:** Node.js · TypeScript · Express 5 · MongoDB · Mongoose · Zod (request validation)

## Setup

**Prerequisites:** Node.js 18+ and a running MongoDB instance (local or Atlas).

```bash
git clone <repo-url>
cd session-booking-api
npm install
cp .env.example .env      # then edit values if needed
npm run dev               # development, auto-reload
```

Production build:

```bash
npm run build
npm start
```

### Environment variables

| Variable      | Description               | Example                                          |
| ------------- | ------------------------- | ------------------------------------------------ |
| `PORT`        | HTTP port                 | `5000`                                           |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/session_booking`      |
| `NODE_ENV`    | `development` / `production` (stack traces are included in 500 responses only in development) | `development` |

## Project structure

```
src/
├── config/        # env loading, DB connection
├── models/        # Mongoose schemas (User, Teacher, Session)
├── validators/    # Zod request schemas
├── middlewares/   # validate(), notFound + centralized error handler
├── services/      # business rules + aggregation pipelines
├── controllers/   # HTTP layer: read validated input, send response
├── routes/        # route definitions
├── app.ts         # Express app
└── server.ts      # bootstrap: connect DB, start server, graceful shutdown
postman/           # Postman collection
```

Each request goes **route → validate → controller → service → model**. Every error is thrown as an `ApiError` (or comes from Zod or Mongoose) and is handled in one place, `middlewares/errorHandler.ts`. Express 5 passes rejected `async` handlers to that error handler automatically, so the code needs no `try/catch` blocks or wrapper functions.

## API reference

All responses use this format: `{ "success": boolean, "message"?: string, "data"?: ..., "details"?: ... }`

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| - | POST | `/teachers` | Create a teacher (helper endpoint, needed to create sessions) |
| 1 | POST | `/users` | Create a user (email must be unique) |
| 2 | POST | `/sessions` | Create a session for a teacher (status defaults to `AVAILABLE`) |
| 3 | GET | `/sessions/available?dateTimestamp=` | AVAILABLE sessions on a date (**aggregation pipeline**) |
| 4 | POST | `/sessions/:id/book` | Book a session for a user |
| 5 | PATCH | `/sessions/:id/complete` | Mark a booked session completed |
| 6 | GET | `/users/:id/sessions` | User's sessions split into upcoming / completed (**aggregation pipeline**) |

### POST /teachers
```json
{ "fullName": "Anita Sharma", "email": "anita@example.com", "specialization": "Mathematics", "experience": 6 }
```

### 1. POST /users
```json
{ "fullName": "Rahul Verma", "email": "rahul@example.com", "phone": "+919876543210" }
```
- `201` created · `400` validation error · `409` email already exists

The email is checked by a unique index and also checked before inserting. If two requests race past the pre-check, the duplicate-key error is still returned as `409`.

### 2. POST /sessions
```json
{ "teacherId": "<teacherId>", "startTime": "2030-01-15T10:00:00.000Z", "endTime": "2030-01-15T11:00:00.000Z" }
```
- `201` created with `status: "AVAILABLE"`
- `400` invalid body, or `endTime` is not after `startTime`
- `404` teacher not found
- `409` the teacher already has a session overlapping this time slot (extra rule I added)

### 3. GET /sessions/available?dateTimestamp={timestamp}
- `dateTimestamp` is a Unix timestamp, in milliseconds or seconds, for **any moment** on the target date. The API returns the AVAILABLE sessions whose `startTime` falls on that **UTC calendar day**.
- Pipeline: `$match` (status + day range, using the `{status, startTime}` index) → `$sort` → `$lookup` teacher → `$unwind` → `$project` (adds `durationMinutes`).
- `200` `{ date, count, sessions[] }` · `400` missing or invalid timestamp

### 4. POST /sessions/:id/book
```json
{ "userId": "<userId>" }
```
- `200` booked (`status: "BOOKED"`, `userId` set)
- `400` invalid id · `404` user or session not found
- `409` session already booked, or not AVAILABLE

Booking uses a single **atomic conditional update**: `findOneAndUpdate({ _id, status: "AVAILABLE" }, …)`. If two users try to book the same session at once, only one succeeds and the other gets `409`. There's no read-then-write race.

### 5. PATCH /sessions/:id/complete
- `200` → `status: "COMPLETED"` and `completedAt` set
- `404` session not found · `409` session is not BOOKED

This uses the same atomic pattern, conditioned on `status: "BOOKED"`.

### 6. GET /users/:id/sessions
- Pipeline: `$match` (userId, status ∈ BOOKED/COMPLETED) → `$facet` with two branches:
  - `upcomingSessions`: BOOKED, sorted by `startTime` ascending
  - `completedSessions`: COMPLETED, sorted by `completedAt` descending

  Each branch joins the teacher details with `$lookup`.
- `200` `{ upcomingSessions[], completedSessions[], counts: { upcoming, completed } }` · `404` user not found

## HTTP status codes

| Code | When |
|------|------|
| 200 | Successful read / update |
| 201 | Resource created |
| 400 | Validation error, malformed JSON, invalid ObjectId |
| 404 | User / teacher / session / route not found |
| 409 | Duplicate email, overlapping session, invalid status transition |
| 500 | Unexpected error |

## Testing with Postman

Import `postman/Session-Booking-API.postman_collection.json`, make sure `baseUrl` matches your `PORT`, and run the collection top to bottom (or use the **Collection Runner**). The requests save the created IDs to collection variables, test both the success path and the error cases, and include assertions. Emails and session times are randomised on each run, so you can re-run the collection against the same database.

## Design decisions

- **Status transitions are enforced atomically** (`AVAILABLE → BOOKED → COMPLETED`) by putting the expected current status in the update filter.
- **Zod validation** parses, coerces and checks every request before it reaches a controller. Controllers read the parsed values from `res.locals`.
- **Indexes** match the query patterns: `{status, startTime}` for the available-sessions query, `{userId, status}` for the user's history, and `{teacherId, startTime, endTime}` for the overlap check.
- **Dates are in UTC.** "The supplied date" means the UTC calendar day that contains `dateTimestamp`.
