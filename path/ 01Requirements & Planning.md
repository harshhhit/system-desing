# Requirements & Planning – System Designer’s Breakdown

## **A. Business Goals**
> *Why the system exists and what it’s expected to achieve in the real world.*

**1. Purpose / Mission** ✅  
- Understand the **core problem** your system solves.  
- Identify **primary user personas** and their goals.  
- Example: "Enable millions of users to stream short videos instantly."  

**2. Traffic & Load Expectations** ✅  
- Estimate **current daily active users (DAU)** and **peak concurrent users**.  
- Plan for **read/write ratios** — are you write-heavy or read-heavy?  
- Factor in **seasonal spikes**.  
- **System design implication:** Dictates scaling architecture, caching strategy, and DB choice.  

**3. Growth Rate & Scaling Plan** ✅  
- Expected growth in **users, requests/sec, and data volume** over time.  
- Consider **geo-expansion** and **multi-region replication**.  
- **System design implication:** Architecture should scale horizontally.  

**4. Business Constraints** ✅  
- **Budget** → Impacts cloud vendor choice and infrastructure.  
- **Time-to-market** → Impacts build vs. buy decision.  

---

## **B. Functional Requirements**
> *What the system must do — the “features and capabilities” list.*

**1. Core Features** ✅  
- Define **MVP features** and **user flows**.  
- **System design implication:** Guides API contracts, DB schema, and messaging flows.  

**2. API Endpoints** ✅  
- Choose between **REST, GraphQL, or gRPC**.  
- Define **input/output schemas** and **error handling**.  
- Example: `POST /users` or `GET /feed`.  
- **System design implication:** Impacts caching and gateway design.  

**3. Integrations** ✅  
- Third-party APIs (payments, analytics, notifications).  
- Internal dependencies (auth, recommendations).  
- **System design implication:** Requires fault tolerance (circuit breakers, retries).  

**4. Data Requirements** ✅  
- **What data is stored** and **data lifecycle management**.  
- **System design implication:** Affects storage, backups, and compliance.  

---

## **C. Non-functional Requirements (NFRs)**
> *How the system should behave — the “quality attributes” of reliability, performance, and compliance.*

**1. Performance** ✅  
- **Latency targets** and **throughput goals**.  
- **System design implication:** Choose stores and caches that meet SLAs.  

**2. Scalability** ✅  
- Horizontal vs. vertical scaling.  
- Auto-scaling during peak hours.  
- **System design implication:** Stateless services, distributed load balancers.  

**3. Availability & Reliability** ✅  
- Uptime SLA (e.g., 99.99%).  
- Disaster recovery (RPO, RTO).  
- **System design implication:** Multi-AZ deployment, failover plans.  

**4. Security** ✅  
- Authentication & authorization.  
- Data encryption in transit and at rest.  
- Rate limiting, DDoS protection.  

**5. Compliance & Legal** ✅  
- GDPR, HIPAA, PCI DSS.  
- Data residency laws.  
- **System design implication:** Hosting regions, encryption, audit logging.  

**6. Observability** ✅  
- Logging, metrics, tracing.  
- Alerting policies.  
- **System design implication:** Enables proactive failure detection.  

**7. Maintainability** ✅  
- Modular architecture.  
- CI/CD pipelines.  
- Proper documentation.  

---

## **D. Connecting the Dots**
- **Business goals** → dictate **functional requirements**.  
- **Functional requirements** → drive **API, service, and DB choices**.  
- **Non-functional requirements** → shape **architecture patterns**.  
- **Reliability** is a **cross-cutting concern** in every decision.  
