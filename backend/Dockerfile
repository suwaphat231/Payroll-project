Build stage
FROM golang:1.22-alpine AS builder WORKDIR /app COPY go.mod ./ RUN go mod download COPY . . RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd

Run stage
FROM gcr.io/distroless/base-debian12 WORKDIR /app COPY --from=builder /app/server /app/server ENV PORT=3000 EXPOSE 3000 USER nonroot:nonroot ENTRYPOINT ["/app/server"]