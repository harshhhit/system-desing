/* Per-page metadata — the single source of truth for page <title>,
   <h1> (data-page-title), the lead line (data-page-subtitle) and the
   breadcrumb trail. Read at runtime by assets/site-header.js via
   window.PAGE_CONFIG.id, and baked into static markup by
   scripts/regen-sidebars.js. Keys are the page id used in PAGE_CONFIG.

   Add a page:  give it  <script>window.PAGE_CONFIG={id:"my-id"}</script>
   then add a matching entry here (href relative to this sub-site root).
   'subtitle' is optional and may contain inline HTML. */
window.SITE_PAGES = {
  "00-login-steps": {
    href: "authentication/00-login-steps.html",
    section: "Authentication",
    title: "Secure Login Implementation Steps"
  },
  "01-introduction": {
    href: "authentication/01-authentication/01-introduction.html",
    section: "Authentication",
    title: "Authentication Schemes: An Introduction"
  },
  "03-hashing-process": {
    href: "authentication/01-authentication/03-hashing-process.html",
    section: "Authentication",
    title: "Secure Password Hashing Process"
  },
  "google-key-task": {
    href: "authentication/02-social-login/google-key-task.html",
    section: "Authentication",
    title: "Google Social Login Checklist"
  },
  "google-login": {
    href: "authentication/02-social-login/google-login.html",
    section: "Authentication",
    title: "Google Sign-In with Credential Manager"
  },
  "k8s-overview": {
    href: "kubernetes/00-index.html",
    section: "Kubernetes",
    title: "Kubernetes Control Plane: Overview",
    subtitle: "The brain of the cluster — architecture, the reconciliation loop, and how kube-apiserver, etcd, the scheduler, and the controller manager depend on each other."
  },
  "k8s-apiserver": {
    href: "kubernetes/01-kube-apiserver.html",
    section: "Kubernetes",
    title: "kube-apiserver Deep Dive",
    subtitle: "The front door of Kubernetes: every request — kubectl, Helm, controllers, kubelets — passes through here before it reaches etcd."
  },
  "k8s-etcd": {
    href: "kubernetes/02-etcd.html",
    section: "Kubernetes",
    title: "etcd Deep Dive",
    subtitle: "Kubernetes' distributed key-value store and single source of truth for cluster state."
  },
  "k8s-scheduler": {
    href: "kubernetes/03-kube-scheduler.html",
    section: "Kubernetes",
    title: "kube-scheduler Deep Dive",
    subtitle: "How Kubernetes decides which node an unscheduled Pod should run on."
  },
  "k8s-controller-manager": {
    href: "kubernetes/04-kube-controller-manager.html",
    section: "Kubernetes",
    title: "kube-controller-manager Deep Dive",
    subtitle: "The reconciliation loops that keep actual cluster state converging on desired state."
  },
  "k8s-api-request-flow": {
    href: "kubernetes/05-api-request-flow.html",
    section: "Kubernetes",
    title: "Kubernetes API Request Flow: Auth, AuthZ, Admission",
    subtitle: "Walking a single <code>kubectl get pods -n frontend</code> call through authentication, authorization, admission control, validation, and etcd &mdash; read vs. write paths."
  },
  "k8s-rbac-namespace-scope": {
    href: "kubernetes/06-rbac-namespace-scope.html",
    section: "Kubernetes",
    title: "RBAC: Scoping a Namespace-Only User",
    subtitle: "A worked example: give a user access to one namespace only, why RBAC can't restrict specific nodes, and where SSH/OS access takes over."
  },
  "k8s-persistent-storage": {
    href: "kubernetes/07-persistent-storage.html",
    section: "Kubernetes",
    title: "Persistent Storage & Distributed Databases on Kubernetes",
    subtitle: "PV/PVC/StorageClass, why each database instance gets its own volume, and where Kubernetes' job ends and the database's replication/failover job begins."
  },
  "k8s-configmap-secret": {
    href: "kubernetes/08-configmap-secret.html",
    section: "Kubernetes",
    title: "ConfigMap & Secret: Separating Config from Sensitive Data",
    subtitle: "Non-sensitive vs. sensitive configuration, why Base64 isn't encryption, and how Pods consume both without hardcoding values into the image."
  },
  "k8s-data-plane": {
    href: "kubernetes/09-data-plane.html",
    section: "Kubernetes",
    title: "Data Plane Deep Dive",
    subtitle: "Kubelet, CRI, CNI, CSI, and kube-proxy — the worker-node layer that actually runs containers, wires up networking and storage, and forwards Service traffic."
  },
  "k8s-request-lifecycle": {
    href: "kubernetes/10-api-request-lifecycle.html",
    section: "Kubernetes",
    title: "API Server Request Lifecycle: The Four Gates",
    subtitle: "Authentication, Authorization, Admission Control, and etcd — the four sequential security and validation gates every request must clear."
  },
  "k8s-leader-election": {
    href: "kubernetes/11-leader-election.html",
    section: "Kubernetes",
    title: "Leader Election: HA for Controller Manager & Scheduler",
    subtitle: "How Lease objects in etcd let multiple replicas of kube-controller-manager and kube-scheduler run without fighting over the same resources — election process, tuning, and failure scenarios."
  },
  "k8s-networking-roadmap": {
    href: "kubernetes/12-networking-roadmap.html",
    section: "Kubernetes",
    title: "Kubernetes Networking Roadmap",
    subtitle: "A concept-first map of Pod networking, Services, kube-proxy, cluster DNS, Ingress, and NetworkPolicy — the ideas, why they exist, and how they connect. Tick each stage as you cover it; progress is saved in this browser."
  },
  "k8s-control-plane-roadmap": {
    href: "kubernetes/13-control-plane-roadmap.html",
    section: "Kubernetes",
    title: "Kubernetes Control Plane Roadmap",
    subtitle: "A concept-first map of the four control-plane components — kube-apiserver, etcd, kube-scheduler, kube-controller-manager — how they fit together and why each one exists. Tick each stage as you cover it; progress is saved in this browser."
  },
  "k8s-request-access-roadmap": {
    href: "kubernetes/14-request-access-roadmap.html",
    section: "Kubernetes",
    title: "Request & Access Flow Roadmap",
    subtitle: "A concept-first map of how a request reaches the Kubernetes API and clears authentication, authorization, and admission control before it's allowed to change cluster state. Tick each stage as you cover it; progress is saved in this browser."
  },
  "k8s-workload-storage-roadmap": {
    href: "kubernetes/15-workload-storage-roadmap.html",
    section: "Kubernetes",
    title: "Workload Config & Storage Roadmap",
    subtitle: "A concept-first map of how workloads get configuration and storage without baking either into the container image — Volumes, PersistentVolumeClaims, ConfigMaps, and Secrets. Tick each stage as you cover it; progress is saved in this browser."
  },
  "k8s-ha-roadmap": {
    href: "kubernetes/16-high-availability-roadmap.html",
    section: "Kubernetes",
    title: "Control Plane High Availability Roadmap",
    subtitle: "A concept-first map of how the control plane itself survives failures — HA kube-apiserver, HA etcd, and Lease-based leader election for the scheduler and controller manager. Tick each stage as you cover it; progress is saved in this browser."
  },
  "k8s-data-plane-roadmap": {
    href: "kubernetes/17-data-plane-roadmap.html",
    section: "Kubernetes",
    title: "Kubernetes Data Plane Roadmap",
    subtitle: "A concept-first map of the worker-node layer that actually runs workloads — kubelet, CRI, CNI, CSI, kube-proxy, and how the control plane knows a Node is still healthy. Tick each stage as you cover it; progress is saved in this browser."
  },
  "frontend-roadmap": {
    href: "01-front-end/frontend-roadmap.html",
    section: "Front-End",
    title: "Front-End Development Roadmap (Concepts Only)",
    subtitle: "A concept-first map of what &ldquo;understanding front-end&rdquo; actually requires — the ideas, why they exist, and how they connect, from how the web works up to modern architecture and delivery. Tick each stage as you cover it; progress is saved in this browser."
  },
  "04-client-server-model": {
    href: "01-front-end/graphql/http/04-client-server-model.html",
    section: "Front-End",
    title: "Client-Server Model, End to End",
    subtitle: "Beginner to advanced: the restaurant-analogy mental model, DNS/TCP/TLS/HTTP request mechanics, HTTP/1.1 vs 2 vs 3 vs WebSockets, monolith &rarr; REST &rarr; microservices architecture, caching/load balancing/async workers/replication, security, and modern paradigms &mdash; ending in one summary request-flow diagram."
  },
  "04-2-request-flow-interactive": {
    href: "01-front-end/graphql/http/04.2-request-flow-interactive.html",
    section: "Front-End",
    title: "Interactive Request Flow",
    subtitle: "Every method from the Client-Server Model page, walked through as one guided, 13-step request: DNS &rarr; TCP/TLS &rarr; CDN &rarr; load balancer &rarr; security gate &rarr; API gateway &rarr; auth &rarr; cache/DB &rarr; queue &rarr; response &rarr; render."
  },
  "04-1-cookies-sessions-jwt": {
    href: "01-front-end/graphql/http/04.1-cookies-sessions-jwt.html",
    section: "Front-End",
    title: "Cookies, Sessions & JWT",
    subtitle: "State management deep dive: how cookies work, server-side sessions vs. stateless JWTs, the modern access/refresh hybrid, and the CSRF/XSS trade-offs behind each."
  },
  "01-02-rendering-types": {
    href: "01-front-end/graphql/http/01.02-rendering-types.html",
    section: "Front-End",
    title: "Web Rendering & Architecture"
  },
  "02-1-ssr-vs-csr": {
    href: "01-front-end/graphql/http/02.1-ssr-vs-csr.html",
    section: "Front-End",
    title: "SSR vs CSR"
  },
  "02-1ssr-vs-csr-v": {
    href: "01-front-end/graphql/http/02.1ssr-vs-csr-v.html",
    section: "Front-End",
    title: "SSR vs CSR (v2)"
  },
  "03-1graphql-vs-rest": {
    href: "01-front-end/graphql/http/03.1graphql-vs-rest.html",
    section: "Front-End",
    title: "GraphQL vs REST"
  },
  "system-design-roadmap": {
    href: "01-front-end/system-design-roadmap.html",
    section: "Front-End",
    title: "System Design Roadmap — DevOps/SRE → System Design Interviews",
    subtitle: "A sequenced prep path for infra-heavy engineers: move fast through the building blocks you already run in production, slow down on interview framing (requirements → capacity → API → HLD → deep dive → tradeoffs) and the few coding-adjacent pieces (consistent hashing, rate limiters, LRU, tries) that system design rounds lean on."
  },
  "00-learning-path-00-index": {
    href: "05-database/00-learning-path/00-index.html",
    section: "Database",
    title: "Database Index"
  },
  "mislanious-terms": {
    href: "05-database/01-foundations/mislanious-terms.html",
    section: "Database",
    title: "Miscellaneous Database Terms"
  },
  "01a-sql-and-relational-fundamentals-index": {
    href: "05-database/01a-sql-and-relational-fundamentals/index.html",
    section: "Database",
    title: "SQL and Relational Fundamentals",
    subtitle: "<strong>Study prompt:</strong> Learn tables, rows, columns, primary and foreign keys, normalization, CRUD, filtering, joins, aggregation, subqueries, and constraints. Practice by modeling a small order-management database and writing queries for it."
  },
  "how-to-choose-the-database": {
    href: "05-database/02-data-modeling-and-selection/how-to-choose-the-database.html",
    section: "Database",
    title: "How to Choose the Database"
  },
  "factors": {
    href: "05-database/02-data-modeling-and-selection/factors.html",
    section: "Database",
    title: "Database Performance Factors"
  },
  "scratch-note-polyglot-persistence": {
    href: "05-database/02-data-modeling-and-selection/scratch-note-polyglot-persistence.html",
    section: "Database",
    title: "Scratch Note: Polyglot Persistence"
  },
  "02a-schema-design-and-migrations-index": {
    href: "05-database/02a-schema-design-and-migrations/index.html",
    section: "Database",
    title: "Schema Design and Migrations",
    subtitle: "<strong>Study prompt:</strong> Learn how to design schemas from access patterns, choose data types and constraints, normalize or denormalize safely, version schema changes, and run backward-compatible migrations with rollback plans."
  },
  "01a-database-basic": {
    href: "05-database/03-querying-and-performance/01A-Database-basic.html",
    section: "Database",
    title: "PostgreSQL Views Explained"
  },
  "08-indxing": {
    href: "05-database/03-querying-and-performance/08-indxing.html",
    section: "Database",
    title: "Indexing"
  },
  "03a-transactions-and-concurrency-index": {
    href: "05-database/03a-transactions-and-concurrency/index.html",
    section: "Database",
    title: "Transactions and Concurrency",
    subtitle: "<strong>Study prompt:</strong> Learn ACID, isolation levels, locks, MVCC, deadlocks, lost updates, optimistic versus pessimistic concurrency, and how to make payment or inventory updates correct under concurrent requests."
  },
  "03b-query-plans-and-optimization-index": {
    href: "05-database/03b-query-plans-and-optimization/index.html",
    section: "Database",
    title: "Query Plans and Optimization",
    subtitle: "<strong>Study prompt:</strong> Learn to read EXPLAIN and EXPLAIN ANALYZE output, identify sequential scans and expensive joins, choose useful indexes, update statistics, avoid N+1 queries, and measure before and after every optimization."
  },
  "lecture-2": {
    href: "05-database/04-distributed-database-fundamentals/lecture-2.html",
    section: "Database",
    title: "Lecture 2"
  },
  "04-cap-theorem-questions": {
    href: "05-database/04-distributed-database-fundamentals/04-cap-theorem-questions.html",
    section: "Database",
    title: "CAP Theorem Questions"
  },
  "04a-database-security-and-access-control-index": {
    href: "05-database/04a-database-security-and-access-control/index.html",
    section: "Database",
    title: "Database Security and Access Control",
    subtitle: "<strong>Study prompt:</strong> Learn authentication, roles, least-privilege permissions, secrets management, TLS, encryption at rest, parameterized queries, SQL-injection prevention, auditing, and data masking for sensitive fields."
  },
  "01-database-basic": {
    href: "05-database/05-scaling-and-partitioning/01-Database-Basic.html",
    section: "Database",
    title: "Database Basics: Partitioning & Data Distribution"
  },
  "02-partiontion": {
    href: "05-database/05-scaling-and-partitioning/02-partiontion.html",
    section: "Database",
    title: "Partitioning"
  },
  "03-horizintal-scaling": {
    href: "05-database/05-scaling-and-partitioning/03-horizintal-scaling.html",
    section: "Database",
    title: "Horizontal Scaling"
  },
  "05a-connection-management-and-database-proxies-index": {
    href: "05-database/05a-connection-management-and-database-proxies/index.html",
    section: "Database",
    title: "Connection Management and Database Proxies",
    subtitle: "<strong>Study prompt:</strong> Learn connection pooling, pool sizing, timeouts, connection leaks, health checks, failover, and database proxies such as PgBouncer and ProxySQL. Understand when read/write routing is safe and how replication lag can return stale data."
  },
  "postgresql-connection-troubleshooting": {
    href: "05-database/05a-connection-management-and-database-proxies/postgresql-connection-troubleshooting.html",
    section: "Database",
    title: "PostgreSQL Connection & Query Troubleshooting Guide",
    subtitle: "Diagnostic queries against <code>pg_stat_activity</code> for connection usage, connection state, per-IP/user/application breakdowns, active and long-running queries, idle and idle-in-transaction sessions, and a step-by-step workflow for \"too many connections\" incidents."
  },
  "06a-backup-recovery-and-disaster-recovery-index": {
    href: "05-database/06a-backup-recovery-and-disaster-recovery/index.html",
    section: "Database",
    title: "Backup, Recovery, and Disaster Recovery",
    subtitle: "<strong>Study prompt:</strong> Learn full, incremental, and logical backups; restore drills; point-in-time recovery; RPO and RTO; replication versus backup; regional failures; and how to document and test a disaster-recovery runbook."
  },
  "07-observability-capacity-and-operations-index": {
    href: "05-database/07-observability-capacity-and-operations/index.html",
    section: "Database",
    title: "Observability, Capacity, and Operations",
    subtitle: "<strong>Study prompt:</strong> Learn database metrics, slow-query logs, tracing, alerting, capacity planning, load testing, maintenance tasks, upgrades, incident response, and how to turn production symptoms into an investigation plan."
  },
  "distributed-systems": {
    href: "distributed-system/distributed-systems.html",
    section: "Distributed Systems",
    title: "Distributed Systems"
  },
  "01-consensus-algorithms": {
    href: "distributed-system/01-consensus-algorithms.html",
    section: "Distributed Systems",
    title: "Consensus Algorithms: Raft & Paxos",
    subtitle: "Quorums, Paxos's prepare/accept phases, Raft's leader election and log replication, split-brain, and how etcd/ZooKeeper use this in practice."
  },
  "02-consistent-hashing": {
    href: "distributed-system/02-consistent-hashing.html",
    section: "Distributed Systems",
    title: "Consistent Hashing",
    subtitle: "Why mod-N hashing breaks on resize, the hash ring, virtual nodes, rebalancing cost, and where this shows up in databases, caches, load balancers, and CDNs."
  },
  "distributed-database-index": {
    href: "distributed-database/index.html",
    section: "Distributed Database",
    title: "Replication & Distributed Data — Solution Architect Roadmap (Part 1)",
    subtitle: "<strong>How to use this:</strong> each phase has a <em>Goal</em>, <em>Concepts to master</em>, and a <em>Todo</em> checklist. Do the phases in order — later phases assume the earlier ones are solid. Treat every unchecked box as your backlog. <strong>Part 2:</strong> <a href=\"02-replication-mechanism.html\">Replication Mechanism — The 4 Dimensions</a>."
  },
  "02-replication-mechanism": {
    href: "distributed-database/02-replication-mechanism.html",
    section: "Distributed Database",
    title: "Replication Mechanism — The 4 Dimensions (Part 2)",
    subtitle: "<strong>Part 2 of the Distributed Database track.</strong> Part 1 is the <a href=\"index.html\">Replication &amp; Distributed Data Roadmap</a>. This page breaks replication down as a pure mechanism, independent of any specific database:"
  },
  "03-pacelc-interview-masterclass": {
    href: "distributed-database/03-pacelc-interview-masterclass.html",
    section: "Distributed Database",
    title: "PACELC — Senior Interview Masterclass",
    subtitle: "A companion deep-dive to the <a href=\"index.html\">Distributed Data Roadmap</a> (Phase 0). To nail a PACELC question at a senior level you cannot just recite the acronym — you have to understand the <strong>psychology</strong> of why interviewers ask it."
  },
  "04-wal-vs-binlog": {
    href: "distributed-database/04-wal-vs-binlog.html",
    section: "Distributed Database",
    title: "WAL vs Binlog — Storage Engine vs Server Log",
    subtitle: "A companion deep-dive to the <a href=\"index.html\">Distributed Data Roadmap</a> (Phase 0). The junior answer — <em>\"WAL is for crash recovery, binlog is for replication\"</em> — passes. The principal-engineer answer explains the <strong>storage-engine level</strong> (physical vs logical), the <strong>timing of writes</strong>, and the <strong>replication topology</strong> implications."
  },
  "05-replication-lag": {
    href: "distributed-database/05-replication-lag.html",
    section: "Distributed Database",
    title: "Replication Lag — Causes, Measurement, Mitigation",
    subtitle: "A companion deep-dive to the <a href=\"index.html\">Distributed Data Roadmap</a> (Phase 1). Lag is the time difference between when a write commits on the leader and when it becomes visible on a follower. It is <strong>never just about network speed</strong>."
  },
  "01-sqs": {
    href: "sqs/01-sqs.html",
    section: "Messaging & Queues",
    title: "SQS Overview"
  },
  "02-queus-methord": {
    href: "sqs/02-queus-methord.html",
    section: "Messaging & Queues",
    title: "Queue Methods"
  },
  "use-case": {
    href: "sqs/use-case.html",
    section: "Messaging & Queues",
    title: "SQS Use Cases"
  },
  "03-kafka-fundamentals": {
    href: "sqs/03-kafka-fundamentals.html",
    section: "Messaging & Queues",
    title: "Kafka Fundamentals",
    subtitle: "Topics and partitions, consumer groups and offsets, delivery semantics, retention and log compaction, replication and acks — contrasted with SQS."
  },
  "04-event-sourcing-and-cqrs": {
    href: "sqs/04-event-sourcing-and-cqrs.html",
    section: "Messaging & Queues",
    title: "Event Sourcing & CQRS",
    subtitle: "Storing state as immutable events, snapshotting, splitting write and read models, projections and materialized views, and when this is (and isn't) worth the complexity."
  },
  "05-microservice-resilience-patterns": {
    href: "sqs/05-microservice-resilience-patterns.html",
    section: "Messaging & Queues",
    title: "Microservice Resilience Patterns",
    subtitle: "Circuit breaker, retries with backoff and idempotency, bulkhead isolation, the saga pattern, API gateway, and service mesh."
  },
  "project": {
    href: "sqs/project/project.html",
    section: "Messaging & Queues",
    title: "Multiprotocol Messaging Starter: Project Guide"
  },
  "storage-type": {
    href: "storage/storage-type.html",
    section: "Storage",
    title: "Storage Types"
  },
  "00-caching-and-cdn-fundamentals": {
    href: "caching/00-caching-and-cdn-fundamentals.html",
    section: "Caching & CDN",
    title: "Caching & CDN Fundamentals",
    subtitle: "Caching layers, cache-aside vs write-through vs write-behind, eviction and invalidation, cache stampede, Redis vs Memcached, and CDN edge caching."
  },
  "00-load-balancing": {
    href: "traffic/00-load-balancing.html",
    section: "Traffic Management",
    title: "Load Balancing",
    subtitle: "L4 vs L7, algorithms (round robin, least connections, consistent hashing), health checks, sticky sessions, and global vs local load balancing."
  },
  "01-rate-limiting-and-throttling": {
    href: "traffic/01-rate-limiting-and-throttling.html",
    section: "Traffic Management",
    title: "Rate Limiting & Throttling",
    subtitle: "Token bucket, leaky bucket, fixed and sliding window algorithms, distributed rate limiting with Redis, and the client contract (429, Retry-After)."
  },
  "00-networking-fundamentals": {
    href: "networking/00-networking-fundamentals.html",
    section: "Networking",
    title: "Networking Fundamentals",
    subtitle: "TCP vs UDP, the TCP handshake, DNS resolution end to end, the TLS handshake, HTTP/1.1 vs HTTP/2 vs HTTP/3, and WebSockets vs gRPC vs plain HTTP."
  },
  "00-observability-fundamentals": {
    href: "observability-security/00-observability-fundamentals.html",
    section: "Observability, Security & Ops",
    title: "Observability Fundamentals",
    subtitle: "The three pillars (metrics, logs, traces), Prometheus/Grafana, structured logging and correlation IDs, distributed tracing, SLI/SLO/SLA and error budgets, and alerting."
  },
  "01-application-security-fundamentals": {
    href: "observability-security/01-application-security-fundamentals.html",
    section: "Observability, Security & Ops",
    title: "Application Security Fundamentals",
    subtitle: "The OWASP Top 10, encryption in transit and at rest, secrets management, and threat modeling."
  },
  "02-cicd-and-deployment-strategies": {
    href: "observability-security/02-cicd-and-deployment-strategies.html",
    section: "Observability, Security & Ops",
    title: "CI/CD & Deployment Strategies",
    subtitle: "CI vs CD vs continuous deployment, a typical pipeline, blue-green vs canary vs rolling deploys, the testing pyramid, feature flags, and rollback strategy."
  },
  "server": {
    href: "web-servers/server.html",
    section: "Web Servers",
    title: "Web Servers"
  },
  "wsgi": {
    href: "web-servers/wsgi.html",
    section: "Web Servers",
    title: "WSGI Explained"
  },
  "01-sdp": {
    href: "software-development-principles/01-sdp.html",
    section: "Dev Principles",
    title: "Software Development Principles"
  },
  "00-system-desing": {
    href: "path/00-system-desing.html",
    section: "Planning & Roadmap",
    title: "System Design: EC2 Hosting Checklist"
  },
  "01-requirements-and-planning": {
    href: "path/01-requirements-and-planning.html",
    section: "Planning & Roadmap",
    title: "Requirements & Planning"
  },
  "01-b-mvp": {
    href: "path/01-b-MVP.html",
    section: "Planning & Roadmap",
    title: "MVP Planning"
  },
  "02-apis": {
    href: "path/02-apis.html",
    section: "Planning & Roadmap",
    title: "API Planning"
  },
  "03-coverage-gap-analysis": {
    href: "path/03-coverage-gap-analysis.html",
    section: "Planning & Roadmap",
    title: "Coverage Gap Analysis & Prompts",
    subtitle: "What the site is missing, grouped by topic, each with a ready-to-paste prompt to close the gap."
  },
  "200-images": {
    href: "project-explaintion/image-share-system/200-images.html",
    section: "Project Walkthroughs",
    title: "Image Share System (200 Images)"
  },
  "major-tools": {
    href: "project-explaintion/instagram/major-tools.html",
    section: "Project Walkthroughs",
    title: "Instagram: Major Tools"
  },
  "01-pubsub-and-pubnub": {
    href: "mislanious/01-pubsub-and-pubnub.html",
    section: "Miscellaneous",
    title: "Pub/Sub and PubNub"
  },
  "memory-profiling": {
    href: "mislanious/Memory-Profiling.html",
    section: "Miscellaneous",
    title: "Memory Profiling"
  },
  "query-string": {
    href: "mislanious/query-string.html",
    section: "Miscellaneous",
    title: "Query Strings"
  },
};
(window.SITE_PAGES_BY_SITE = window.SITE_PAGES_BY_SITE || {})["e1"] = window.SITE_PAGES;

