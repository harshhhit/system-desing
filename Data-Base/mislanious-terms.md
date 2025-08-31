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