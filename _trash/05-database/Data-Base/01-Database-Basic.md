DATABSE 

---

## **Data Distribution Concepts**

These determine **how** data is split, stored, and accessed across systems.

1. **Partitioning**

   * Splitting a table into smaller, more manageable pieces (partitions).
   * Can be **horizontal** (rows) or **vertical** (columns).

2. **Horizontal Partitioning**

   * Rows are split based on some condition (e.g., customers by region).
   * Common in scaling large datasets.

3. **Vertical Partitioning**

   * Columns are split into different tables, often to separate frequently accessed from rarely accessed data.

4. **Sharding**

   * A type of horizontal partitioning across **different servers/nodes**.
   * Each shard holds a subset of the data; together they form the whole dataset.

5. **Range Partitioning**

   * Data split by value ranges (e.g., dates 2020–2021 in one partition, 2022–2023 in another).

6. **List Partitioning**

   * Data split based on a predefined list of values (e.g., partition by country codes).

7. **Hash Partitioning**

   * A hash function determines the partition location for each row.

8. **Composite Partitioning**

   * Combination of two methods (e.g., range + hash).

---

## **Replication Concepts**

These deal with **copying data** for performance, fault tolerance, and availability.

9. **Replication**

   * Keeping multiple copies of the same data on different servers.

10. **Master-Slave Replication**

    * One server handles writes (master), others handle reads (slaves).

11. **Multi-Master Replication**

    * Multiple servers can handle writes, requiring conflict resolution.

12. **Synchronous vs Asynchronous Replication**

    * Sync: Changes written to all replicas before confirming success.
    * Async: Primary confirms before replicas are updated.

---

## **Indexing & Storage Optimization**

These improve **data retrieval efficiency**.

13. **Indexing**

    * Data structures (like B-Trees, Hash indexes) to speed up queries.

14. **Covering Index**

    * Index that contains all required columns for a query.

15. **Clustered Index**

    * Table data is stored in the order of the index.

16. **Non-Clustered Index**

    * Separate index structure pointing to table rows.

17. **Materialized Views**

    * Precomputed query results stored for fast access.

---

## **Caching & Acceleration**

Reduce database load.

18. **Query Caching**

    * Storing results of queries to avoid recomputation.

19. **Result Set Caching**

    * Cache full query responses in memory.

20. **In-Memory Databases**

    * Keep all data in RAM for very fast access.

---

## **Scalability & Availability Patterns**

Architectural strategies for large systems.

21. **Federation**

    * Splitting database functionality into smaller, specialized databases.

22. **Data Warehousing**

    * Storing historical, analytical data separately from transactional systems.

23. **CQRS (Command Query Responsibility Segregation)**

    * Splitting read and write workloads into different models.

24. **Event Sourcing**

    * Storing all changes as events instead of just final state.

25. **Distributed Databases**

    * Data stored and processed across multiple nodes.

---

