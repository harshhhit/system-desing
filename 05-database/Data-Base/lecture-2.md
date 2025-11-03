Lecture 2 — Databases & Distributed Systems
1. CAP Theorem

Definition: In a distributed database, you can only guarantee two out of the following three at any given time:

    C – Consistency: Every read gets the latest write or an error.

    A – Availability: Every request gets a response, even if it’s not the latest.

    P – Partition Tolerance: The system continues operating despite network partitions.

Trade-offs:

    CP system: Prioritizes Consistency + Partition Tolerance → sacrifices Availability.

    AP system: Prioritizes Availability + Partition Tolerance → sacrifices strict Consistency.

    CA system: Possible only in non-partitioned single-node systems.

2. ACID Properties

    Atomicity: A transaction is all-or-nothing.

    Consistency: Only valid data (meeting constraints) is stored.

    Isolation: Transactions don’t affect each other during execution.

    Durability: Once committed, data is permanent.

Relational DBs: Typically provide full ACID.
Non-relational DBs: Often relax Isolation for performance and scalability.
3. Isolation in Non-Relational Databases

    Many NoSQL DBs (MongoDB, Cassandra) provide weaker isolation like Read Committed or Eventual Consistency.

    Isolation is often tuned via consistency levels:

        Read Concern / Write Concern in MongoDB.

        Quorum reads/writes in Cassandra.

4. Distributed Systems Concepts

Partition & Replication

    Partitioning (Sharding): Splitting data across nodes for scalability.

    Replication: Copying data to multiple nodes for availability and durability.

5. Database Replication Methods

    Synchronous Replication: Writes wait until all replicas confirm.

    Asynchronous Replication: Writes return immediately, replicas update later.

    Semi-Synchronous: Leader waits for at least one replica to confirm.

    Multi-master Replication: Multiple nodes can accept writes.

    Log-based Replication: Replicas replay the leader’s change logs.

6. Consistency Models in Databases

    Strong Consistency (Real-time): All nodes always return latest value.

    Near Real-time: Small replication delay (milliseconds–seconds).

    Eventual Consistency: Updates propagate eventually, reads may be stale.

    Periodic Consistency: Data syncs at fixed intervals.

7. CDC (Change Data Capture)

    Captures changes in real-time from DB logs or triggers.

    Useful for replication, streaming, analytics, and sync with search engines.

8. Full Load

    Initial bulk load of all data into a new system before incremental updates.

9. Search Optimization in Databases

    Full-text search engines like OpenSearch and Elasticsearch index data for fast keyword queries.

    Confidence score: Indicates relevance of results.

10. Occurrence in DB Terms

    "Occurrence" often refers to frequency of values in a column (used in statistics and indexing).

11. Keys in Databases

    Primary Key: Unique identifier for a row.

    Foreign Key: Enforces a link between tables.

    Enforces referential integrity in relational databases.

12. Load Balancer in Multi-AZ / Multi-Region

    Yes, load balancers (AWS ALB, GCP LB) can distribute traffic across:

        Multiple Availability Zones (for fault tolerance within a region)

        Multiple Regions (for disaster recovery & global latency reduction)

References to Learn More

    CAP Theorem:
    https://www.geeksforgeeks.org/cap-theorem-in-distributed-systems/
    https://aws.amazon.com/builders-library/cap-theorem-practical-approach/

    ACID vs BASE:
    https://www.mongodb.com/acid

    Replication:
    https://www.digitalocean.com/community/tutorials/replication-in-databases

    Consistency Models:
    https://jepsen.io/consistency

    Change Data Capture (CDC):
    https://debezium.io/

    OpenSearch:
    https://opensearch.org/

    AWS Load Balancing Multi-AZ:
    https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/availability-zones.html