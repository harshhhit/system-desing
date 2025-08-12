When you create an Aurora database, specifically in the context of AWS Aurora, the system typically creates both a read and a write endpoint. However, this behavior is more related to replication rather than partitioning or sharding.

Here’s a breakdown:

1. Replication (Most Relevant):
Aurora automatically handles replication behind the scenes to ensure high availability and durability. The write endpoint is associated with the primary instance (also known as the writer), where all database write operations occur. The read endpoint points to one or more replica instances, which are read-only copies of the primary database. These replicas can be used to offload read queries, improving performance and availability.

Write Endpoint: The primary node where all data-modifying operations (INSERT, UPDATE, DELETE) are performed.

Read Endpoint: The endpoint that routes read queries to one or more replicas.

This setup is generally about scaling read queries and providing fault tolerance, and it's not partitioning data or splitting it across different servers in the way sharding does.

2. Partitioning:
Partitioning typically involves dividing the data in a table into smaller chunks based on certain criteria (e.g., by range, hash, or list). This is not what Aurora does automatically. Instead, Aurora uses replication to distribute read traffic, but the data itself isn’t partitioned in a traditional sense at the application level.

In Aurora, you could manually partition your data within the database, but that’s a design choice, not something that happens automatically.

3. Sharding:
Sharding is when a database is divided into smaller, independent databases (called shards), each containing a subset of the data. Each shard typically has its own instance, and application logic must determine where to route queries for a particular piece of data.

Aurora doesn’t do automatic sharding. If you need to shard your data for horizontal scaling (to handle massive amounts of data or traffic), you would need to implement that manually or use other services like Amazon DynamoDB (for NoSQL), which is more suited to automatic sharding.

To Summarize:
Aurora read/write endpoints are about replication to scale reads and ensure availability.

Partitioning refers to breaking up data across different partitions, which Aurora does not do automatically.

Sharding involves splitting data across independent databases, which is also not automatically handled by Aurora.

If you're trying to optimize your database for read-heavy workloads, Aurora's replication is an effective solution, but if you're concerned about scaling horizontally (across multiple nodes or regions), you'd be looking more at sharding or other strategies.