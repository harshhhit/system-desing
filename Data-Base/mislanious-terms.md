## integrity constraine in DB ##

A constraint in a database is a rule applied to a table's columns to limit the type of data that can be stored in them. Constraints ensure the accuracy and reliability of the data in the database. 🔒 They are used to enforce business rules and maintain the integrity of the data. If a data manipulation operation (like an INSERT, UPDATE, or DELETE) violates a constraint, the operation is automatically rolled back, preventing the invalid data from being saved.



## ** Common Types of Constraints

Here are some of the most common types of constraints used in databases:

NOT NULL: This constraint ensures that a column cannot have a NULL (empty or missing) value. For example, a NOT NULL constraint on a customer_name column ensures every customer record has a name.

UNIQUE: This constraint ensures that all values in a column or a set of columns are unique. For example, a UNIQUE constraint on an email column in a users table guarantees that no two users can have the same email address.

PRIMARY KEY: This is a unique identifier for a row in a table. It is a combination of the NOT NULL and UNIQUE constraints. A table can only have one primary key.  For example, a student_id column is often set as the primary key for a students table.

FOREIGN KEY: This constraint links two tables together by using a column (or a set of columns) from one table that refers to the primary key of another table. It is used to maintain referential integrity. 🤝 For example, an order_id in a products table might be a foreign key that references the order_id in an orders table.

CHECK: This constraint is used to enforce a condition that must be met for a value to be inserted into a column. For example, a CHECK constraint could ensure that an age column only accepts values greater than 18.

DEFAULT: This constraint provides a default value for a column when no value is specified during an INSERT operation. For example, a DEFAULT constraint on a status column could set its value to 'active' unless another value is provided


 **Referential integrity**

 Referential integrity is a fundamental concept in relational databases that ensures the consistency and validity of relationships between tables. 🤝 It prevents the creation of "orphan records"—data in a table that references a record that doesn't exist in another

 How It Works

Referential integrity is enforced by foreign key constraints. A foreign key in one table (the "child" or referencing table) must directly reference the primary key of another table (the "parent" or referenced table).

This relationship means:

    You can't insert a record into the child table if its foreign key value doesn't match an existing primary key value in the parent table. For example, you can't create an order for a customer who doesn't exist.

    You can't delete a record from the parent table if there are related records in the child table. For example, you can't delete a customer record if they have existing orders. This prevents the orders from becoming "orphaned."

    You can't update a primary key value in the parent table if there are dependent records in the child table.

Actions on Delete/Update

Most database systems provide options to handle what happens when you try to delete or update a record in the parent table that has related child records. These are called cascading actions:

    ON DELETE CASCADE: When a record in the parent table is deleted, all corresponding records in the child table are also automatically deleted.

    ON UPDATE CASCADE: When a primary key value in the parent table is updated, the corresponding foreign key values in the child table are automatically updated to match.

    NO ACTION or RESTRICT: This is the default behavior. The action (delete or update) is simply rejected if a child record exists.

    SET NULL: When a record in the parent table is deleted, the foreign key values in the child records are set to NULL. This only works if the foreign key column allows NULL values.





###                PRIMARY KEY


A primary key uniquely identifies each record in a table, while a foreign key creates a link between two tables by referencing the primary key of another table. They are essential for ensuring data integrity and building relationships in relational databases.

Primary Key

A primary key is like a unique identification number for each row in a table. It's a column or set of columns that guarantees every record is distinct.

    Uniqueness: A primary key value must be unique across all rows in a table. No two rows can have the same primary key.

    Not Null: A primary key cannot contain a null value. Every record must have a valid identifier.

    One per Table: A table can only have one primary key, although that key can consist of multiple columns (known as a composite key).

For example, in a Students table, StudentID is a perfect primary key because it uniquely identifies each student and is never null.





###                Foreign Key


A foreign key is a column (or columns) in one table that refers to the primary key of another table. It's the connector that establishes a relationship between two tables, ensuring that data is consistent and valid across them.


    Links Tables: It creates a parent-child relationship between tables. The table with the foreign key is the "child" table, and the table it references is the "parent" table.

    Referential Integrity: A foreign key ensures that a value in the child table corresponds to an existing value in the parent table's primary key. This prevents "orphan records" from being created (e.g., an order record that references a customer who doesn't exist).

    Can be Null or Duplicates: Unlike a primary key, a foreign key can contain duplicate values and can be null (if the relationship is optional).

For example, imagine a Courses table where you want to know which student is enrolled in which course. You would add a StudentID column to the Courses table as a foreign key that references the StudentID primary key in the Students table. This setup ensures that you can only assign a course to a student who already exists in the Students table.




##                            concurrency in DATABSE

Concurrency in a database means that multiple transactions are happening at the same time. The transactions can be either individual or interdependent, and the database must manage them all to prevent conflicts and maintain data integrity.


Individual Transactions

Individual, or independent, transactions are separate from one another and don't share any data. They can be executed concurrently without any risk of interfering with each other. For example:

    A user updates their personal information (name, address, etc.).

    Another user updates their profile picture.
    Since these operations affect different data, they are not interdependent. The database can handle them in parallel without needing special coordination.


    Interdependent Transactions

Interdependent transactions, also known as conflicting transactions, are those that try to access or modify the same piece of data at the same time. This is where concurrency becomes a problem that the database must solve. If not managed properly, these transactions can lead to issues like:

    Lost Updates: One transaction's changes are overwritten by another.

        Example: Two users simultaneously try to update the same bank account balance. If they both read the initial balance, perform their calculations, and then write their new balance back, one of their updates will be lost.

    Dirty Reads: A transaction reads data that has been modified by another transaction but has not yet been committed. If the first transaction then fails and rolls back, the data read by the second transaction is now invalid.

    Non-Repeatable Reads: A transaction reads the same data item twice and gets different values because another transaction has modified and committed changes in between the two reads.


    Concurrency Control

To prevent these problems, database management systems (DBMS) use concurrency control mechanisms. These are protocols and techniques designed to manage interdependent transactions and ensure that the database remains in a consistent state. The main goal is to achieve serializability, which means that even though transactions are executed concurrently, the final result is the same as if they had been executed one after another, in some sequential order.

Common concurrency control methods include:

    Locking: The most common approach. Transactions acquire locks on data they need to access. A shared (read) lock allows multiple transactions to read the data, while an exclusive (write) lock prevents others from reading or writing until the lock is released.

    Timestamping: Each transaction is assigned a unique timestamp. The DBMS uses these timestamps to determine the order of operations, ensuring that later transactions don't overwrite changes made by earlier ones.

    Multi-version Concurrency Control (MVCC): This method allows multiple versions of data to exist at once. When a transaction needs to read data, it gets a consistent snapshot of the data from when the transaction began, preventing it from being affected by concurrent writes. This reduces the need for locking and can improve performance.




##



Serializability is the highest level of isolation for concurrent transactions in a database. It ensures that even when multiple transactions are executed at the same time, the final state of the database is the same as if the transactions had been executed one after the other in some sequential order. 

### Why It's Important

Without serializability, concurrent transactions can lead to data inconsistencies and anomalies, such as:

* **Lost Updates**: The changes made by one transaction are overwritten by another.
* **Dirty Reads**: A transaction reads uncommitted changes from another transaction.
* **Non-Repeatable Reads**: A transaction reads the same data item twice and gets different values because another transaction has modified the data in between the two reads.

Serializability prevents these issues by enforcing strict rules on how concurrent transactions can interact with shared data.

### How It's Achieved

Database management systems use various concurrency control mechanisms to achieve serializability. The most common methods include:

* **Two-Phase Locking (2PL)**: This is a classic method where transactions acquire locks on data they need to access. It has two phases: a "growing" phase where the transaction can acquire new locks, and a "shrinking" phase where it can only release locks. This ensures that transactions don't release a lock and then try to acquire another one, which could lead to inconsistencies.
* **Timestamp-Based Protocols**: Each transaction is assigned a unique timestamp. The database uses these timestamps to determine the order of operations, ensuring that older transactions are always processed before newer ones when conflicts arise.
* **Serializable Snapshot Isolation (SSI)**: This is a more modern approach that combines the benefits of Snapshot Isolation (allowing transactions to operate on a consistent snapshot of the data) with additional checks to ensure that the final result is serializable.

These mechanisms ensure that even though transactions are interleaved to improve performance, their combined effect on the database is equivalent to a serial execution.

***
