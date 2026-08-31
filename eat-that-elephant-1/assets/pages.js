/* Per-page metadata — the single source of truth for page <title>,
   <h1> (data-page-title), the lead line (data-page-subtitle) and the
   breadcrumb trail. Read at runtime by assets/site-header.js via
   window.PAGE_CONFIG.id, and baked into static markup by
   scripts/regen-sidebars.js. Keys are the page id used in PAGE_CONFIG.

   Add a page:  give it  <script>window.PAGE_CONFIG={id:"my-id"}</script>
   then add a matching entry here (href relative to this sub-site root).
   'subtitle' is optional and may contain inline HTML. */
window.SITE_PAGES = {
  "system-design-roadmap": {
    href: "01-front-end/system-design-roadmap.html",
    section: "Front-End",
    title: "System Design Roadmap — DevOps/SRE → System Design Interviews",
    subtitle: "A sequenced prep path for infra-heavy engineers: move fast through the building blocks you already run in production, slow down on interview framing (requirements → capacity → API → HLD → deep dive → tradeoffs) and the few coding-adjacent pieces (consistent hashing, rate limiters, LRU, tries) that system design rounds lean on."
  },
  "frontend-roadmap": {
    href: "01-front-end/frontend-roadmap.html",
    section: "Front-End",
    title: "Front-End Development Roadmap (Concepts Only)",
    subtitle: "A concept-first map of what &ldquo;understanding front-end&rdquo; actually requires — the ideas, why they exist, and how they connect, from how the web works up to modern architecture and delivery. Tick each stage as you cover it; progress is saved in this browser."
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

