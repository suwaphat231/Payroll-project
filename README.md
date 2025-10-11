# Payroll Project

This repository contains a demo payroll system with a Go backend, a React frontend, and a PostgreSQL database. The stack is wired together with Docker Compose so you can run the entire application locally with a single command.

## Prerequisites

* Docker and Docker Compose installed
* (Optional) Node.js 18+ if you want to run the frontend without containers
* (Optional) Go 1.23+ if you want to run the backend without containers

## Quick start with Docker Compose

```bash
cd infra
docker compose up --build
```

Compose starts three services:

| Service    | URL                      | Notes                                        |
|------------|--------------------------|----------------------------------------------|
| Frontend   | http://localhost:5173    | React SPA served via `serve`                 |
| Backend    | http://localhost:3000    | Go API (Gin)                                 |
| PostgreSQL | localhost:5432           | database `payroll`, user `payroll_user`      |
| pgAdmin    | http://localhost:8080    | Visual database client (default user `admin@payroll.local`) |

The backend exposes a `/health` endpoint and the authenticated API under `/api`. The frontend automatically points to the backend via the `REACT_APP_API_URL` environment variable configured in the compose file.

### Accessing PostgreSQL with pgAdmin

1. Visit [http://localhost:8080](http://localhost:8080) once Compose finishes starting.
2. Sign in with the default pgAdmin credentials:

   ```
   Email:    admin@payroll.local
   Password: admin123
   ```

3. Add a new server inside pgAdmin with the following connection information:

   | Field        | Value            |
   |--------------|------------------|
   | Name         | Payroll Database |
   | Host name    | db               |
   | Port         | 5432             |
   | Username     | payroll_user     |
   | Password     | secret           |
   | Maintenance DB | payroll        |

The hostname `db` resolves to the Postgres container on the internal Docker network, so pgAdmin can reach it without any additional setup.

### Default credentials

Use the following credentials to sign in from the frontend:

```
Email:    admin@example.com
Password: Admin@123
```

## Running locally without Docker

### Backend

```bash
cd backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/payroll?sslmode=disable"
export JWT_SECRET="dev_secret"
go run ./cmd
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Set `REACT_APP_API_URL=http://localhost:3000/api` in your shell (or a `.env` file) so the frontend proxies requests to the backend.

## Database migrations and seed data

The backend automatically applies schema migrations and seeds a handful of sample employees on startup. PostgreSQL migrations are defined in `backend/internal/db/migrate.go` and sample data in `backend/internal/db/seed.go`.

## Tests

The backend includes unit tests for services and repositories. Run them with:

```bash
cd backend
go test ./...
```

> **Note:** Running the tests requires downloading Go module dependencies. If your environment blocks outbound network access the command may fail when attempting to fetch modules.

