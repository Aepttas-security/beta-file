# Monorepo System Architecture

This document describes the design architecture of the Android Security Application monorepo, detailing the decoupling logic and routing configurations.

---

## High-Level Diagram

```
             Android Application
                    │
                    │ API Requests
                    ▼
             Backend/API Layer
                    │
 ┌──────────────────┼──────────────────┐
 │         │         │         │        │
 ▼         ▼         ▼         ▼        ▼
Parent     Call      Vulnerability  Geo    Malware
Control  Management       API       API      API
 │         │         │         │        │
 └─────────┴─────────┴─────────┴────────┘
 │
 Database / Services
```

---

## Architectural Principles

### 1. Independent Maintainability
Although all five backend services reside in the same physical Git repository (`SecurityApp/backend/`), they are designed as completely separate microservices.
* **No code sharing**: Each service defines its own models, endpoints, package configurations, and runtime dependencies.
* **Separation of deployment**: Each service contains its own virtual environments, dependencies manifest, and Docker configs. This ensures a bug in one service (e.g., Malware) cannot crash or interrupt the compilation of other systems (e.g., Geolocation).

### 2. Standardized Communication
* **JSON REST Gateways**: The Android UI client communicates via standard HTTP request structures.
* **Decoupled routing**: During development, each backend container binds to its own port. The frontend redirects traffic dynamically based on the requested telemetry category.
* **Independent databases**: Backend modules interact only with their own designated local or cloud tables to prevent database lock contention.
