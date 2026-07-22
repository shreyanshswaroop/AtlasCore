<div align="center">

# AtlasCore Cloud Platform

### Production-Ready AI Research Intelligence Platform

Containerized • Cloud Native • DevOps • Kubernetes • CI/CD • Infrastructure as Code

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

# Overview

AtlasCore is a production-grade AI research intelligence platform that aggregates, classifies, and serves the latest AI research, news, and infrastructure updates.

This repository demonstrates not only full-stack application development but also modern Cloud and DevOps engineering practices including containerization, CI/CD, Infrastructure as Code, Kubernetes, and production-ready deployment workflows.

---

# Features

- AI research aggregation
- AI news aggregation
- Semantic search
- JWT authentication
- Dockerized services
- Production-ready FastAPI backend
- Next.js frontend
- PostgreSQL database
- Health checks
- Environment-based configuration
- Production Docker images
- Docker Compose orchestration

Upcoming

- GitHub Actions CI/CD
- Terraform Infrastructure
- Kubernetes
- Helm Charts
- Prometheus
- Grafana
- Loki
- ArgoCD GitOps

---

# Architecture

```text
                           GitHub
                              │
                              │
                        Docker Compose
                              │
     ┌────────────────────────┼────────────────────────┐
     │                        │                        │
     ▼                        ▼                        ▼
 Next.js Frontend      FastAPI Backend          PostgreSQL
     │                        │
     └──────────────► REST API ◄───────────────┘
```

Future Production Architecture

```text
                           GitHub
                              │
                       GitHub Actions
                              │
                      Docker Image Build
                              │
                          AWS ECR
                              │
                      Kubernetes Cluster
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Frontend Pod     Backend Pods     Worker Pods
                             │
                             ▼
                     PostgreSQL / Neon
                             │
               Prometheus • Grafana • Loki
```

---

# Tech Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## Backend

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- JWT Authentication

## DevOps

- Docker
- Docker Compose
- GitHub Actions (Upcoming)
- Terraform (Upcoming)
- Kubernetes (Upcoming)
- Helm (Upcoming)
- Prometheus (Upcoming)
- Grafana (Upcoming)

---

# Repository Structure

```text
atlascore/

├── backend/
│   ├── app/
│   ├── alembic/
│   ├── workers/
│   ├── scripts/
│   ├── tests/
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── Dockerfile
│
├── infrastructure/
│   ├── terraform/
│   ├── kubernetes/
│   └── helm/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
└── README.md
```

---

# Running Locally

## Clone

```bash
git clone https://github.com/YOUR_USERNAME/atlascore.git
cd atlascore
```

---

## Start everything

```bash
docker compose up --build
```

Application

Frontend

```
http://localhost:3000
```

Backend

```
http://localhost:8000
```

Swagger

```
http://localhost:8000/docs
```

---

# Docker Services

| Service | Port |
|----------|------|
| Frontend | 3000 |
| Backend | 8000 |
| PostgreSQL | 5432 |

---

# Environment Variables

Create

```
backend/.env
```

Required

```env
DATABASE_URL=
SECRET_KEY=
OPENROUTER_API_KEY=
ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=
```

---

# Health Check

Backend

```
GET /api/health
```

Expected response

```json
{
  "status":"healthy",
  "service":"atlascore-api"
}
```

---

# Development Workflow

```text
Feature Development
        │
        ▼
Docker Compose
        │
        ▼
Testing
        │
        ▼
Git Commit
        │
        ▼
GitHub
        │
        ▼
CI/CD Pipeline (Upcoming)
```

---

# Roadmap

## Completed

- Dockerized Backend
- Dockerized Frontend
- PostgreSQL Container
- Docker Compose
- Health Checks
- Production Images

## In Progress

- GitHub Actions
- CI Pipeline

## Planned

- Terraform
- AWS
- Kubernetes
- Helm
- Prometheus
- Grafana
- Loki
- GitOps
- Auto Scaling

---

# Why this project?

Rather than deploying to a Platform-as-a-Service, AtlasCore is being evolved into a production-grade cloud-native application.

The goal is to demonstrate modern DevOps practices including containerization, continuous integration, Infrastructure as Code, orchestration, observability, and automated deployments using technologies commonly adopted in production environments.

---

# Author

**Shreyansh Swaroop**

Computer Science Undergraduate • Full Stack Developer • Cloud & DevOps Enthusiast
