# 🚀 SOCIAL-MEDIA-MICROSERVICES

A **production-oriented social media backend** built using **Microservices Architecture**.  
This project demonstrates **real-world backend engineering practices** such as service isolation, API Gateway patterns, reverse proxying, distributed rate limiting, authentication enforcement, asynchronous communication, and scalable system design.

The focus of this project is not just functionality, but **clean architecture, security, and maintainability**—similar to systems used in large-scale applications.

---

## 📌 Project Overview

Traditional monolithic applications tightly couple all features, making them difficult to scale and maintain.  
This project addresses those limitations by splitting the system into **independent microservices**, each responsible for a single business capability.

Each service:
- Has a clearly defined responsibility
- Can be developed and scaled independently
- Communicates using APIs and events
- Remains isolated from failures in other services

---

## 🏗️ System Architecture

The system follows a **microservices architecture** with a centralized **API Gateway** and **event-driven communication**.

### 🔹 Services Overview

| Service | Responsibility |
|------|----------------|
| **API Gateway** | Reverse proxy, authentication, rate limiting |
| **Identity Service** | User authentication and token issuance |
| **Post Service** | Create, fetch, and delete posts |
| **Media Service** | Handle media uploads and deletions |
| **Search Service** | Indexing and searching posts |
| **Message Broker** | Asynchronous communication between services |

Clients interact **only** with the API Gateway.  
Internal services are never exposed directly.

---

## 🚪 API Gateway (Reverse Proxy)

A dedicated API Gateway acts as the **single entry point** for all client requests.

### Responsibilities
- Reverse proxy routing
- JWT authentication validation
- Redis-backed rate limiting
- Centralized logging
- Security headers
- Request forwarding and transformation
- Safe handling of file uploads

This design mirrors **real production API gateway implementations**.

---

## 🔁 Reverse Proxy Routing

The API Gateway routes requests based on URL prefixes:

| Public Route | Target Service |
|------------|----------------|
| `/v1/auth` | Identity Service |
| `/v1/posts` | Post Service |
| `/v1/media` | Media Service |
| `/v1/search` | Search Service |

Routes are rewritten internally, allowing:
- Clean external APIs
- Hidden internal service URLs
- Independent service scaling and replacement

---

## 🔐 Authentication & Authorization

Authentication is **mandatory** for protected operations such as creating posts, uploading media, and searching content.

### Authentication Flow
1. User authenticates via Identity Service
2. A JWT token is issued
3. Client includes the token in requests
4. API Gateway validates the token
5. User identity is forwarded to services via headers

---

## 🧱 Defense-in-Depth Security Model

Authentication is enforced at **multiple layers**:

### API Gateway
- Blocks unauthenticated requests early
- Acts as the first security boundary

### Service Level
- Post, Media, and Search services independently verify authentication
- Prevents unauthorized access even if the gateway is bypassed

This **defense-in-depth approach** ensures strong security and fault tolerance.

---

## ✍️ Post Creation – Authentication Required

Creating a post is a protected operation:
- Requests must include a valid JWT
- Unauthorized requests are rejected
- Post Service trusts the gateway-verified user context

This prevents anonymous content creation and enforces system integrity.

---

## 🚦 Rate Limiting (Redis-Backed)

To protect the system from abuse and traffic spikes, rate limiting is implemented at the **API Gateway level**.

### Key Characteristics
- Distributed rate limiting using Redis
- Shared state across gateway instances
- Automatic throttling with HTTP 429 responses
- Production-ready scalability

---

## 📁 File Upload Safety

The API Gateway **does not parse multipart/form-data** requests.

### Why?
- File parsing at the gateway increases memory usage
- Media handling is delegated to the Media Service

Multipart requests are forwarded as-is, allowing the Media Service to:
- Handle Multer
- Upload to Cloudinary
- Maintain clean separation of concerns

---

## 🔁 Asynchronous Communication (RabbitMQ)

The system uses **event-driven communication** for cross-service operations.

### Example: Post Deletion Flow
1. Post Service deletes a post
2. An event is published
3. Media Service deletes related media
4. Search Service updates its index

### Benefits
- Loose coupling
- Fault isolation
- Easy extensibility
- Non-blocking workflows

---

## ⚡ Performance & Scalability Considerations

- Redis caching to reduce database load
- MongoDB indexing for faster queries
- Asynchronous background processing
- Independent service scaling

---

## 🧠 Engineering Concepts Demonstrated

- Microservices Architecture
- API Gateway Pattern
- Reverse Proxy
- Distributed Rate Limiting
- JWT Authentication
- Defense-in-Depth Security
- Event-Driven Architecture
- Service Isolation
- Scalable Backend Design

---

## 📈 Future Enhancements

- Role-based access control (RBAC)
- Kubernetes orchestration
- CI/CD pipelines

---

## 👨‍💻 Built By

**Bangaru SaiGanesh**  
B.Tech CSE, IIIT Sri City

---

## ⭐ Final Note

This project focuses on **architecture and engineering quality**, not just features.  
Every design decision prioritizes **scalability, security, and maintainability**, reflecting real-world backend systems.
