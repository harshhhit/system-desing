
# 📘 Database & Distributed Systems — Learning Roadmap

## Stage 1. Foundations (Single-Node Database Basics)

**Why?** Before scaling out, you must know how a single database works.

* **Relational (SQL) vs Non-relational (NoSQL)**

  * **What:** SQL (Postgres, MySQL) uses structured schema; NoSQL (MongoDB, Cassandra) stores flexible data.
  * **When to use:** SQL → banking, orders; NoSQL → social media, logs.
  * **Why:** Different workloads need different data models.

* **ACID Properties** (Atomicity, Consistency, Isolation, Durability)

  * **What:** Guarantees correctness in transactions.
  * **When:** Critical systems (banking, inventory).
  * **Why:** Prevents errors like “double withdrawal.”
  * **Isolation Levels:** Read Uncommitted → Serializable (trade-off between speed vs. strictness).

* **Indexes & Query Optimization**

  * **What:** Structures (B-Tree, Hash, Bitmap) that speed up reads.
  * **When:** Queries on large datasets.
  * **Why:** Without indexes, DB must scan everything.
  * **Tool:** `EXPLAIN` query plans.

* **Keys & Constraints**

  * **What:** Rules ensuring data integrity (Primary, Foreign, Composite keys).
  * **When:** Relational DB design.
  * **Why:** Avoids duplicates, ensures valid references.

---

## Stage 2. Distributed Database Theory

**Why?** Single servers can’t handle global scale → we distribute.

* **Why Distribution?**

  * **Scalability** → more users & data.
  * **Availability** → system keeps running despite failures.
  * **Disaster recovery** → backup across regions.

* **Vertical vs Horizontal Scaling**

  * **Vertical:** Bigger server → limited.
  * **Horizontal:** Many servers → scalable.

* **CAP Theorem** (Consistency, Availability, Partition tolerance → pick 2)

  * **CP:** Strong consistency, less availability (e.g., MongoDB strong mode).
  * **AP:** High availability, eventual consistency (e.g., Cassandra, DynamoDB).
  * **Why:** Network failures force trade-offs.

* **Consistency Models**

  * **Strong:** Always latest data.
  * **Eventual:** Updates propagate later.
  * **Causal, Read-Your-Own-Writes:** Middle ground.
  * **When:** Choose based on app needs (banking vs social media).

* **BASE (NoSQL Philosophy)**

  * **What:** Basically Available, Soft state, Eventually consistent.
  * **Why:** Sacrifices strictness for performance at scale.

---

## Stage 3. Data Distribution Techniques

**Why?** Large systems need splitting & copying data.

* **Partitioning (Sharding)**

  * **What:** Splitting data across servers.
  * **How:** Key-based, Range-based, Hash-based.
  * **Challenge:** Rebalancing when data grows.
  * **When:** Big data apps (e.g., MongoDB sharding).

* **Replication**

  * **What:** Copying data across nodes.
  * **Types:** Leader-follower, Multi-leader, Leaderless.
  * **Trade-off:** Sync (safe but slow) vs Async (fast but risk of lag).
  * **Why:** Improves fault tolerance.

* **Load Balancing**

  * **What:** Spread traffic across servers.
  * **How:** DNS (Route 53), ALB, Geo-routing.
  * **Why:** Reduces latency, avoids overload.

---

## Stage 4. Data Synchronization & Change Tracking

**Why?** In distributed DBs, data changes must stay in sync.

* **Change Data Capture (CDC)**

  * **What:** Track changes via logs.
  * **Tools:** Debezium, Kafka Connect, AWS DMS.
  * **Why:** Keeps downstream systems updated.

* **Full Load + Incremental Updates**

  * **When:** Initial migration (full) + real-time sync (incremental).
  * **Why:** Efficient for ongoing updates.

* **Conflict Resolution**

  * **What:** Resolve concurrent writes.
  * **How:** Last-write-wins, Vector clocks, CRDTs.
  * **Why:** Prevent data corruption.

* **Real-time vs Batch Sync**

  * **Trade-off:** Freshness vs performance.

---

## Stage 5. Search & Query Optimization

**Why?** Traditional DBs aren’t great for large-scale text or ranking queries.

* **Full-text Search**

  * **What:** Specialized indexing (Elasticsearch, OpenSearch).
  * **When:** Searching millions of documents.
  * **Why:** Normal indexes can’t handle it.

* **Ranking & Scores**

  * **What:** TF-IDF, BM25, Vector search.
  * **Why:** Needed for relevance-based search.

* **Hybrid DB + Search**

  * **Pattern:** Use DB for storage + search engine for queries.
  * **Example:** E-commerce → DB for orders, Elastic for product search.

---

## Stage 6. System Design Integration

**Why?** Combine everything for real-world architecture.

* **Scalable DB Design Choices**

  * ACID vs BASE → depends on app.
  * Choose consistency model.
  * Multi-AZ & Multi-region deployments.

* **Common Architectures**

  * **CQRS:** Separate read/write paths.
  * **Event Sourcing:** Store events instead of current state.
  * **Polyglot Persistence:** Different DBs for different needs.

* **Case Studies**

  * **Twitter feed:** Append-only, high write throughput.
  * **E-commerce:** Relational for orders, NoSQL cache for products.
  * **Analytics dashboard:** Real-time streaming DB.

---

## 🔑 Principles to Remember

* **ACID vs BASE** → strict vs scalable.
* **CAP Theorem** → can’t have it all.
* **Indexes** → fast reads, slower writes.
* **Replication & Sharding** → foundation of distributed DBs.
* **Consistency models** → choose per use case.
* **Scaling** → vertical is limited, horizontal is future.

---

## 🎯 Learning Strategy (6 Weeks)

* **Week 1–2:** Foundations + Theory (Stage 1–2)
* **Week 3–4:** Distribution + Sync (Stage 3–4)
* **Week 5:** Search & Optimization (Stage 5)
* **Week 6:** Integration & Case Studies (Stage 6)

---

✅ This roadmap explains **what → why → when** for each topic, making it beginner-friendly and shareable.
If you’d like, I can also create a **single-page “mental map” diagram (cheat sheet)** with all concepts visually connected (like library analogy + CAP triangle + scaling patterns).

Do you want me to generate that **visual cheat sheet diagram** for quick recall?
