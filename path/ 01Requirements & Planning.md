

## **1. Requirements & Planning – System Designer’s Breakdown**

### **A. Business Goals**

> *Why the system exists and what it’s expected to achieve in the real world.*

1. **Purpose / Mission**

   * Understand the **core problem** your system solves.
   * Identify **primary user personas** and their goals.
   * Example: "Enable millions of users to stream short videos instantly."

2. **Traffic & Load Expectations**

   * Estimate **current daily active users (DAU)** and **peak concurrent users**.
   * Plan for **read/write ratios** — are you write-heavy (like social media posts) or read-heavy (like news sites)?
   * Factor in **seasonal spikes** (holidays, product launches, etc.).
   * **System design implication:** Dictates scaling architecture, caching strategy, and DB choice.

3. **Growth Rate & Scaling Plan**

   * Expected growth in **users, requests/sec, and data volume** over 6–12–24 months.
   * Consider **geo-expansion** — will you need multi-region data replication?
   * **System design implication:** Start with an architecture that can scale horizontally.

4. **Business Constraints**

   * **Budget** → Impacts cloud vendor choice, storage type (SSD vs. HDD), managed vs. self-hosted services.
   * **Time-to-market** → Can influence whether you build from scratch or leverage off-the-shelf solutions.

---

### **B. Functional Requirements**

> *What the system must do — the “features and capabilities” list.*

1. **Core Features**

   * Define the **MVP feature set** — what’s essential for launch vs. nice-to-have.
   * Break down **user flows** and **data flows**.
   * **System design implication:** Clear features help map API contracts, database schema, and message flows.

2. **API Endpoints**

   * REST, GraphQL, or gRPC? Choose based on use case.
   * Define **input/output schemas**, auth requirements, and error handling.
   * **Example:**

     * `POST /users` — Create new user
     * `GET /feed` — Fetch paginated list of recommended content
   * **System design implication:** API structure affects client development, caching strategy, and gateway design.

3. **Integrations**

   * Third-party APIs (payment gateways, analytics, notifications).
   * Internal service dependencies (authentication, recommendation engine).
   * **System design implication:** More integrations = more fault tolerance mechanisms (circuit breakers, retries, fallbacks).

4. **Data Requirements**

   * **What data is stored?** (User profiles, logs, analytics, files)
   * **Data lifecycle management** (retention, archival, GDPR deletion).
   * **System design implication:** Affects storage choice, backup strategy, and legal compliance.

---

### **C. Non-functional Requirements (NFRs)**

> *How the system should behave — the “quality attributes” of reliability, performance, and compliance.*

1. **Performance**

   * **Latency targets** → e.g., 95% of requests under 200ms.
   * **Throughput** → e.g., 10k requests/sec sustained.
   * **System design implication:** Choose data stores and caching layers that meet these SLAs.

2. **Scalability**

   * Horizontal vs. vertical scaling plan.
   * Elasticity — auto-scaling during peak hours.
   * **System design implication:** Use stateless services and distributed load balancers.

3. **Availability & Reliability**

   * Uptime SLA — e.g., **99.99%** uptime = \~52 minutes downtime/year.
   * Disaster recovery — RPO (Recovery Point Objective), RTO (Recovery Time Objective).
   * **System design implication:** Multi-AZ deployment, failover strategies.

4. **Security**

   * Authentication & authorization models.
   * Data encryption in transit (TLS 1.3) & at rest.
   * Secure API gateways, rate limiting, DDoS mitigation.

5. **Compliance & Legal**

   * GDPR, HIPAA, SOC 2, PCI DSS, etc.
   * Data residency laws — where data must physically reside.
   * **System design implication:** Impacts hosting regions, encryption, and audit logging.

6. **Observability**

   * Logging (structured logs), metrics (Prometheus), tracing (OpenTelemetry).
   * Alerting thresholds & escalation policies.
   * **System design implication:** Helps in proactive failure detection and debugging.

7. **Maintainability**

   * Modular architecture for easier feature updates.
   * CI/CD pipeline for fast, safe deployments.
   * Clear documentation for APIs and services.

---

### **D. How a System Designer Connects These Together**

* **Business goals** → dictate **functional requirements**.
* **Functional requirements** → drive **API, service, and DB choices**.
* **Non-functional requirements** → shape **architecture patterns** (microservices, event-driven, monolith).
* Reliability is a **cross-cutting concern** — every decision must consider resilience, scaling, and security.



###########################


MVP Feature Set – System Design Learning
1. Core Fundamentals

Understand client–server model

Learn latency vs throughput

Grasp vertical vs horizontal scaling

Basics of load balancing (Round Robin, Least Connections)

Basics of databases (SQL vs NoSQL, primary keys, indexes)

Understand DNS & CDN role

2. Foundational Design Patterns

CRUD service design

Read-heavy vs write-heavy architecture choices

Cache-aside pattern (Redis/Memcached)

Message queue basics (SQS/Kafka high-level)

3. AWS Core Services for MVP

S3 – File/object storage

RDS (MySQL/Postgres) – Relational DB

DynamoDB – NoSQL key-value store

Elastic Load Balancer – Distribute traffic

CloudFront – CDN for faster delivery

EC2 / Lambda – Compute basics

4. Hands-On MVP Projects

URL Shortener

DynamoDB or RDS

API Gateway + Lambda

Image Upload Service

S3 storage + signed URLs

CloudFront for delivery

Basic Notification Service

SQS for queue

Lambda to process messages

5. Minimal Tooling Knowledge

AWS CLI basics

Postman for API testing

Basic Terraform/CloudFormation for infra setup

GitHub for version control

6. MVP Learning Resources

Free:

System Design Primer GitHub

AWS Free Tier Labs

ByteByteGo YouTube

Paid (optional):

Alex Xu’s System Design Interview Vol 1 (Beginner-friendly)

A Cloud Guru AWS Certified Solutions Architect – Associate