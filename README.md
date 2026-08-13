# DocFlow — Enterprise

[![CI/CD Pipeline](https://github.com/your-org/google-docs-clone/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/google-docs-clone/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-EKS-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)

A **production-grade, real-time collaborative document editor** inspired by Google Docs, built with a modern microservice-adjacent architecture on Java 21 + React 18. Supports simultaneous multi-user editing, fine-grained permissions, OAuth2 login, audit trails, and scales horizontally on Kubernetes.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Start — Docker Compose](#quick-start--docker-compose)
6. [Local Development Setup](#local-development-setup)
7. [Environment Variables](#environment-variables)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [WebSocket Events](#websocket-events)
11. [Kafka Topics](#kafka-topics)
12. [Testing](#testing)
13. [Docker Builds](#docker-builds)
14. [AWS / EKS Deployment](#aws--eks-deployment)
15. [Security](#security)
16. [Performance](#performance)
17. [Contributing](#contributing)
18. [License](#license)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          Clients                            │
│              (Browser  /  Mobile  /  API)                   │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTPS / WSS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                      │
│   /api/*  →  Backend   |  /ws/*  →  Backend WebSocket      │
│   /        →  Frontend (React SPA)                         │
└──────────┬──────────────────────────────────┬──────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────┐         ┌────────────────────────────┐
│   Spring Boot API    │         │    React + Vite SPA        │
│   (Java 21, 3 pods)  │         │    (2 pods, Nginx)         │
│                      │         └────────────────────────────┘
│  ┌────────────────┐  │
│  │ REST  API      │  │
│  │ WebSocket/STOMP│  │
│  │ OAuth2 / JWT   │  │
│  │ Kafka Producer │  │
│  └───────┬────────┘  │
└──────────┼───────────┘
           │
  ┌────────┼──────────────────────────────────┐
  │        │  Internal Services               │
  │  ┌─────▼──────┐  ┌────────┐  ┌─────────┐ │
  │  │  MySQL 8.0 │  │ Redis 7│  │  Kafka  │ │
  │  │  (Primary  │  │ (Cache │  │ (Event  │ │
  │  │   Store)   │  │  + WS  │  │  Bus)   │ │
  │  │            │  │  Sess) │  │         │ │
  │  └────────────┘  └────────┘  └─────────┘ │
  └──────────────────────────────────────────┘
```

**Data flows:**
- **REST requests** → Nginx → Spring Boot → MySQL / Redis
- **Real-time edits** → WebSocket (STOMP) → Spring Boot → Redis pub/sub → broadcast to room members
- **Async events** (notifications, audit) → Kafka topics → consumer workers
- **Session management** → Redis (Spring Session)
- **Caching** → Redis (document metadata, user info, permissions)

---

## Features

### Core Document Editing
- ✅ Rich-text collaborative editor (Quill.js / ProseMirror)
- ✅ Real-time multi-user cursor presence (names + color indicators)
- ✅ Operational-transform / CRDT-based conflict resolution
- ✅ Auto-save with debounce (saves every 2 seconds after inactivity)
- ✅ Document version history (snapshot per save, diff viewer)
- ✅ Undo / redo per user session

### Sharing & Collaboration
- ✅ Fine-grained permission roles: **Owner → Write → Comment → Read**
- ✅ Share via email invitation with role assignment
- ✅ Public link sharing (view-only)
- ✅ Real-time collaborator list panel with avatars
- ✅ In-document threaded comments with reply support
- ✅ Comment resolution workflow

### Authentication & Security
- ✅ JWT-based authentication (access + refresh token rotation)
- ✅ Google OAuth2 sign-in (extensible to GitHub, Microsoft)
- ✅ Role-based access control (RBAC): ROLE_USER, ROLE_EDITOR, ROLE_ADMIN
- ✅ CSRF protection
- ✅ Rate limiting per IP on API and auth endpoints
- ✅ Full audit log (who did what, when, from where)

### Infrastructure
- ✅ Docker Compose for local development (one command spin-up)
- ✅ Kubernetes manifests (EKS-ready) with HPA, PDB, NetworkPolicy
- ✅ GitHub Actions CI/CD: test → build → push → deploy
- ✅ Multi-arch Docker images (linux/amd64 + linux/arm64)
- ✅ Trivy image vulnerability scanning
- ✅ Prometheus metrics endpoint + JaCoCo coverage reporting

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Backend Framework** | Spring Boot | 3.x |
| **Language (Backend)** | Java | 21 LTS |
| **Build Tool** | Apache Maven | 3.9 |
| **Database** | MySQL | 8.0 |
| **Cache / Session** | Redis | 7 |
| **Message Broker** | Apache Kafka | 7.5.0 (Confluent) |
| **Real-time** | WebSocket (STOMP over SockJS) | — |
| **Security** | Spring Security + OAuth2 + JWT | — |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) | 2.x |
| **Frontend Framework** | React | 18 |
| **Language (Frontend)** | TypeScript | 5.x |
| **Build Tool (FE)** | Vite | 5.x |
| **State Management** | Zustand / React Query | — |
| **Rich Text Editor** | Quill.js | 2.x |
| **Styling** | Tailwind CSS | 3.x |
| **Reverse Proxy** | Nginx | 1.25-alpine |
| **Containerisation** | Docker + Docker Compose | 24+ |
| **Orchestration** | Kubernetes (AWS EKS) | 1.29+ |
| **CI/CD** | GitHub Actions | — |
| **Registry** | GitHub Container Registry | — |
| **Cloud** | AWS (EKS, EBS, Route53, ALB) | — |

---

## Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Docker Desktop | 24.0 | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.21 | bundled with Docker Desktop |
| Node.js | 20 LTS | https://nodejs.org/ |
| npm | 10 | bundled with Node 20 |
| Java (JDK) | 21 | https://adoptium.net/ |
| Apache Maven | 3.9 | https://maven.apache.org/ |
| kubectl | 1.29 | https://kubernetes.io/docs/tasks/tools/ |
| AWS CLI | 2.x | https://aws.amazon.com/cli/ |

---

## Quick Start — Docker Compose

The fastest way to run the entire stack locally:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/google-docs-clone.git
cd google-docs-clone

# 2. Start all services (MySQL, Redis, Kafka, Backend, Frontend, Nginx)
docker compose -f docker/docker-compose.yml up -d

# 3. Watch logs
docker compose -f docker/docker-compose.yml logs -f

# 4. Verify services are healthy
docker compose -f docker/docker-compose.yml ps
```

Once running, access:

| Service | URL |
|---|---|
| **App (via Nginx)** | http://localhost:80 |
| **Frontend direct** | http://localhost:3000 |
| **Backend API** | http://localhost:8080 |
| **Swagger UI** | http://localhost:8080/swagger-ui.html |
| **OpenAPI JSON** | http://localhost:8080/v3/api-docs |
| **Actuator Health** | http://localhost:8080/actuator/health |
| **Actuator Metrics** | http://localhost:8080/actuator/metrics |

### Stop & clean up

```bash
# Stop containers (preserve volumes)
docker compose -f docker/docker-compose.yml down

# Stop AND remove all volumes (full reset)
docker compose -f docker/docker-compose.yml down -v
```

---

## Local Development Setup

### Backend

```bash
cd backend

# Start only infrastructure dependencies
docker compose -f ../docker/docker-compose.yml up -d mysql redis kafka zookeeper

# Run with hot-reload (Spring DevTools)
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Or with explicit env vars
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/docdb \
SPRING_DATASOURCE_USERNAME=docuser \
SPRING_DATASOURCE_PASSWORD=docpass \
SPRING_DATA_REDIS_HOST=localhost \
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
JWT_SECRET=local-dev-secret-key-min-32-chars-long \
  mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Backend runs at **http://localhost:8080**

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run Vite dev server with HMR
npm run dev
```

Frontend dev server runs at **http://localhost:5173** (Vite default)

Configure `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `local` | Active Spring profile |
| `SPRING_DATASOURCE_URL` | — | JDBC URL for MySQL |
| `SPRING_DATASOURCE_USERNAME` | — | DB username |
| `SPRING_DATASOURCE_PASSWORD` | — | DB password |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_DATA_REDIS_PORT` | `6379` | Redis port |
| `SPRING_DATA_REDIS_PASSWORD` | `""` | Redis password (if set) |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka brokers |
| `JWT_SECRET` | — | ≥ 32 chars HMAC secret |
| `JWT_EXPIRATION_MS` | `86400000` | Access token TTL (ms) |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` | Refresh token TTL (ms) |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID` | — | Google OAuth2 client ID |
| `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET` | — | Google OAuth2 secret |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` | `health,info` | Actuator endpoints |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend REST base URL |
| `VITE_WS_URL` | WebSocket endpoint URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth2 client ID |

---

## Database Schema

The full DDL is in [`docker/mysql-init.sql`](docker/mysql-init.sql). Key tables:

| Table | Purpose |
|---|---|
| `users` | User accounts (local + OAuth2 providers) |
| `roles` | RBAC roles (ROLE_USER, ROLE_EDITOR, ROLE_ADMIN) |
| `user_roles` | Many-to-many join: users ↔ roles |
| `documents` | Document metadata + content (LONGTEXT) |
| `collaborators` | Per-document sharing: user + role (READ/COMMENT/WRITE/OWNER) |
| `document_versions` | Snapshot history per document |
| `comments` | Inline comments with text offsets |
| `replies` | Threaded replies on comments |
| `notifications` | In-app notification queue |
| `audit_logs` | Immutable audit trail (action, actor, IP, timestamp) |
| `refresh_tokens` | JWT refresh token store with revocation |
| `document_locks` | Optimistic lock tracker per active session |

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login, receive JWT pair | Public |
| `POST` | `/api/auth/refresh` | Refresh access token | Refresh token |
| `POST` | `/api/auth/logout` | Revoke refresh token | Bearer |
| `GET` | `/oauth2/authorization/google` | Start Google OAuth2 flow | Public |
| `GET` | `/oauth2/callback/google` | OAuth2 redirect callback | Public |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users/me` | Current user profile | Bearer |
| `PUT` | `/api/users/me` | Update profile | Bearer |
| `GET` | `/api/users/{id}` | Get user by ID | Bearer |
| `GET` | `/api/users/search?q={query}` | Search users (for sharing) | Bearer |

### Documents

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/documents` | List user's documents (owned + shared) | Bearer |
| `POST` | `/api/documents` | Create new document | Bearer |
| `GET` | `/api/documents/{id}` | Get document (metadata + content) | Bearer |
| `PUT` | `/api/documents/{id}` | Full update (title + content) | Bearer (Write) |
| `PATCH` | `/api/documents/{id}/title` | Update title only | Bearer (Write) |
| `PATCH` | `/api/documents/{id}/content` | Update content (auto-save) | Bearer (Write) |
| `DELETE` | `/api/documents/{id}` | Delete document | Bearer (Owner) |
| `GET` | `/api/documents/{id}/versions` | List version history | Bearer (Read) |
| `GET` | `/api/documents/{id}/versions/{vId}` | Get specific version | Bearer (Read) |
| `POST` | `/api/documents/{id}/versions/{vId}/restore` | Restore a version | Bearer (Write) |

### Collaborators

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/documents/{id}/collaborators` | List collaborators | Bearer |
| `POST` | `/api/documents/{id}/collaborators` | Add collaborator | Bearer (Owner) |
| `PUT` | `/api/documents/{id}/collaborators/{uid}` | Update role | Bearer (Owner) |
| `DELETE` | `/api/documents/{id}/collaborators/{uid}` | Remove collaborator | Bearer (Owner) |

### Comments

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/documents/{id}/comments` | List comments | Bearer (Read) |
| `POST` | `/api/documents/{id}/comments` | Add comment | Bearer (Comment) |
| `PUT` | `/api/documents/{id}/comments/{cid}` | Edit comment | Bearer (Owner of comment) |
| `DELETE` | `/api/documents/{id}/comments/{cid}` | Delete comment | Bearer |
| `POST` | `/api/documents/{id}/comments/{cid}/resolve` | Resolve comment | Bearer (Write) |
| `POST` | `/api/documents/{id}/comments/{cid}/replies` | Add reply | Bearer (Comment) |

### Notifications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/notifications` | List notifications | Bearer |
| `PATCH` | `/api/notifications/{id}/read` | Mark as read | Bearer |
| `PATCH` | `/api/notifications/read-all` | Mark all as read | Bearer |
| `DELETE` | `/api/notifications/{id}` | Delete notification | Bearer |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/users` | List all users | ROLE_ADMIN |
| `PUT` | `/api/admin/users/{id}/roles` | Update user roles | ROLE_ADMIN |
| `DELETE` | `/api/admin/users/{id}` | Delete user | ROLE_ADMIN |
| `GET` | `/api/admin/audit-logs` | View audit logs | ROLE_ADMIN |

---

## WebSocket Events

**Connect:** `ws://host/ws` (with STOMP protocol + SockJS fallback)

**Subscribe destinations:**

| Destination | Description |
|---|---|
| `/topic/document.{docId}` | Broadcast document edits to all room members |
| `/topic/document.{docId}.presence` | Cursor positions and active user list |
| `/topic/document.{docId}.comments` | New/updated/resolved comments |
| `/user/queue/notifications` | Private per-user notifications |
| `/user/queue/errors` | Error messages for the current user |

**Send destinations (client → server):**

| Destination | Payload | Description |
|---|---|---|
| `/app/document.{docId}.edit` | `{ delta, version, userId }` | Publish content delta |
| `/app/document.{docId}.cursor` | `{ position, userId, name, color }` | Broadcast cursor position |
| `/app/document.{docId}.join` | `{ userId, docId }` | Join document room |
| `/app/document.{docId}.leave` | `{ userId, docId }` | Leave document room |
| `/app/document.{docId}.save` | `{ content, version }` | Trigger explicit save |

---

## Kafka Topics

| Topic | Partitions | Replication | Consumers | Description |
|---|---|---|---|---|
| `document-events` | 3 | 1 | `DocumentEventConsumer` | Create, update, delete, share events |
| `notification-events` | 3 | 1 | `NotificationConsumer` | Fan-out notifications to users |
| `audit-events` | 3 | 1 | `AuditConsumer` | Write audit records to MySQL |

**Event payload schema (JSON):**

```json
{
  "eventId": "uuid",
  "eventType": "DOCUMENT_UPDATED | DOCUMENT_SHARED | COMMENT_ADDED | ...",
  "timestamp": "2024-07-15T10:00:00Z",
  "actorId": "user-uuid",
  "resourceId": "document-uuid",
  "resourceType": "document",
  "payload": { }
}
```

---

## Testing

### Backend

```bash
cd backend

# Run all unit + integration tests
mvn clean test

# Run with coverage report (HTML at target/site/jacoco/index.html)
mvn clean verify

# Run only unit tests
mvn test -Dgroups=unit

# Run only integration tests
mvn test -Dgroups=integration

# Check coverage threshold (70%)
mvn jacoco:check
```

### Frontend

```bash
cd frontend

# Run Vitest unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# E2E with Playwright
npm run test:e2e

# Type check (no emit)
npx tsc --noEmit

# Lint
npm run lint

# Lint + fix
npm run lint:fix
```

---

## Docker Builds

### Build images manually

```bash
# Backend
docker build \
  -t ghcr.io/your-org/google-docs-clone/backend:latest \
  ./backend

# Frontend
docker build \
  -t ghcr.io/your-org/google-docs-clone/frontend:latest \
  ./frontend

# Multi-arch build (requires Buildx)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/your-org/google-docs-clone/backend:latest \
  --push \
  ./backend
```

### Run individual containers

```bash
# Backend
docker run -d \
  --name docs-backend \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/docdb \
  -e SPRING_DATASOURCE_USERNAME=docuser \
  -e SPRING_DATASOURCE_PASSWORD=docpass \
  -e SPRING_DATA_REDIS_HOST=host.docker.internal \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092 \
  -e JWT_SECRET=local-dev-secret-key-min-32-chars-long \
  ghcr.io/your-org/google-docs-clone/backend:latest

# Frontend
docker run -d \
  --name docs-frontend \
  -p 3000:80 \
  ghcr.io/your-org/google-docs-clone/frontend:latest
```

---

## AWS / EKS Deployment

### 1. Prerequisites

```bash
# Configure AWS CLI
aws configure

# Install eksctl
brew install eksctl  # or equivalent

# Create EKS cluster (if not exists)
eksctl create cluster \
  --name google-docs-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

### 2. Install dependencies (once)

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm upgrade --install aws-load-balancer-controller \
  eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=google-docs-cluster

# Install cert-manager for TLS
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# Install nginx-ingress controller
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Install Prometheus + Grafana (optional)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install kube-prometheus-stack \
  prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
```

### 3. Deploy the application

```bash
# Update Secrets with real values first!
# base64 encode: echo -n 'your-secret' | base64

# Apply all manifests
kubectl apply -f kubernetes/deployment.yaml

# Verify rollout
kubectl get pods -n enterprise-docs
kubectl get ingress -n enterprise-docs

# Tail backend logs
kubectl logs -f deployment/backend -n enterprise-docs
```

### 4. Update a deployment (rolling update)

```bash
# Set new image (CI does this automatically)
kubectl set image deployment/backend \
  backend=ghcr.io/your-org/google-docs-clone/backend:sha-abc1234 \
  -n enterprise-docs

# Watch rollout
kubectl rollout status deployment/backend -n enterprise-docs

# Roll back if something goes wrong
kubectl rollout undo deployment/backend -n enterprise-docs
```

### 5. Scale manually

```bash
kubectl scale deployment/backend --replicas=5 -n enterprise-docs
```

---

## Security

### JWT Strategy
- Short-lived **access tokens** (15 min – 24 hours, configurable)
- Long-lived **refresh tokens** (7 days) stored in the `refresh_tokens` table
- Refresh tokens are rotated on every use and revocable
- Tokens are signed with HS512 HMAC

### Network Security
- Nginx: security headers (X-Frame-Options, CSP, HSTS), rate limiting
- Kubernetes NetworkPolicy: default-deny-all + explicit allow rules
- TLS enforced at ingress (cert-manager + Let's Encrypt)
- No secrets stored in Docker images or version control
- Kubernetes Secrets (use External Secrets Operator or AWS Secrets Manager for production)

### Input Validation
- All API inputs validated with Bean Validation (`@Valid`)
- SQL injection prevented by JPA/Hibernate parameterised queries
- XSS prevented by JSON serialisation + CSP headers
- File upload size limited to 50 MB

### Audit & Monitoring
- Every write action produces an `audit_log` record
- Prometheus metrics at `/actuator/prometheus`
- Trivy image scanning integrated in CI pipeline

---

## Performance

### Backend
- Redis caches document metadata, user permissions (TTL: 5 min)
- Spring Session stored in Redis (horizontal scaling of WebSocket sessions)
- MySQL: composite indexes on foreign keys + FULLTEXT on document titles
- HikariCP connection pool tuned for 500 concurrent connections
- JVM: G1GC + container-aware RAM percentage settings

### Frontend
- Vite code splitting: vendor / editor / app chunks
- Static assets served with immutable Cache-Control headers (1 year)
- React Query for server-state caching (stale-while-revalidate)
- WebSocket reconnection with exponential backoff
- Debounced auto-save (2-second inactivity window)

### Kafka
- Topics pre-partitioned (3 partitions each) for parallel consumption
- GZIP compression for large document payloads
- Consumer group offset commits every 5 seconds

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feature/your-feature-name`
3. Write **tests** for your changes (≥ 70% coverage required)
4. Run the full test suite: `mvn verify` (backend) + `npm run test` (frontend)
5. Ensure linting passes: `npm run lint`
6. **Commit** with conventional commits: `feat: add cursor color cycling`
7. **Push** to your fork and open a **Pull Request** against `develop`
8. CI pipeline must be green before merge
9. At least **1 code review approval** required

### Code Style
- **Java**: Google Java Style (enforced by Checkstyle in `mvn verify`)
- **TypeScript/React**: ESLint + Prettier (run `npm run lint:fix`)
- **SQL**: UPPER CASE keywords, snake_case identifiers

### Branch Strategy
| Branch | Purpose |
|---|---|
| `main` | Production-ready, auto-deploys to EKS prod |
| `develop` | Integration branch, auto-deploys to staging |
| `feature/*` | New features, PRs target `develop` |
| `hotfix/*` | Emergency fixes, PRs target both `main` + `develop` |

---

## License

```
MIT License

Copyright (c) 2024 Google Docs Clone Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
