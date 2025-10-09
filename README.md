# Payroll Project

## Running the backend Dockerfile

1. Build the backend image (run from the repository root):
   ```bash
   docker build -t payroll-backend -f backend/Dockerfile backend
   ```
2. Run a container from the image:
   ```bash
   docker run --rm -p 3000:3000 payroll-backend
   ```

The backend binary listens on port `3000`, so the example command maps it to the same
port on the host for local testing.
