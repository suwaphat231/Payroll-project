# --- build stage ---
FROM golang:1.24.5-alpine AS builder
WORKDIR /app

# ติดตั้ง dependency
COPY go.mod go.sum ./
RUN go mod download

# คัดลอกโค้ดทั้งหมด
COPY . .
RUN go mod tidy

# สร้าง binary แบบ static
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/main.go

# --- run stage ---
FROM gcr.io/distroless/base-debian12:latest
WORKDIR /app

COPY --from=builder /app/server .

EXPOSE 3000
ENV PORT=3000

USER nonroot:nonroot
ENTRYPOINT ["./server"]