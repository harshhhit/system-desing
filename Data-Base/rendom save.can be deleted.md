1. How do you determine the right balance between relational and non-relational databases in a polyglot persistence architecture?

    Why it matters: Many modern architectures (microservices, data lakes) use more than one database type. Knowing when and why to mix is a mark of a senior architect.

    Key concepts: CAP theorem, ACID vs BASE, OLTP vs OLAP workloads, data modeling trade-offs.

    Refinements:

        Interview: “Describe a scenario where mixing RDBMS and NoSQL provided measurable benefits.”

        Design meeting: “What business metrics drove the decision to split data stores?”

        War room: “Is the bottleneck in transaction processing or in query flexibility?”
