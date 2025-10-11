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
