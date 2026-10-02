# DBMS

A database management system is the software that stands between your application and its stored data. Your code says "give me the customers who paid last month"; the DBMS figures out where those rows live, how to find them quickly, what happens when two users edit the same row at the same time, and how to keep everything consistent if the power dies mid-write. Understanding these ideas is what separates someone who can write a query from someone who can design a system.

## ER model & keys — modelling data

Before a single table exists, you model the domain. The **Entity–Relationship (ER) model** describes the world as:

- **Entities** — the things you care about, like `Customer`, `Order`, `Product`. Each entity becomes a table later.
- **Attributes** — the facts you store about an entity: a customer's name, email, city. Attributes become columns.
- **Relationships** — how entities connect: a customer *places* orders, an order *contains* products. Relationships become foreign keys or link tables.

Relationships come in three shapes. **One-to-one** (a user and their passport), **one-to-many** (a customer and their orders — the most common), and **many-to-many** (students and courses: each student takes many courses, each course has many students). A database cannot store a many-to-many directly; you resolve it with a junction table (say `Enrollments`) holding one row per pairing, plus any facts about the pairing itself, like the enrolment date.

### Keys — how rows earn their identity

| Key | Meaning |
|---|---|
| **Primary key** | The chosen identifier of a row. Unique, never NULL, one per table. It is the row's permanent name. |
| **Candidate key** | Any column (or set) that *could* be the primary key — also fully unique. Whatever you don't pick stays an alternate key. |
| **Super key** | Any superset of a candidate key — unique, but possibly padded with redundant columns. |
| **Foreign key** | A column in one table that points at the primary key of another. It enforces the relationship: you cannot record an order for a customer who does not exist. |
| **Composite key** | A key made of two or more columns together — each column alone may repeat, but the combination never does. |

### From ER diagram to tables

The mechanical mapping: every strong entity becomes a table with its attributes as columns; the primary key is underlined in the diagram and becomes the PK column. A one-to-many relationship is implemented by placing the "one" side's primary key as a foreign key in the "many" side's table (`orders.customer_id → customers.id`). A many-to-many becomes its own table whose composite key is the two foreign keys together. Doing this mapping consciously — instead of inventing tables on the fly — is what keeps a schema clean when requirements grow.

## SQL & normalization — 1NF to BCNF

SQL is the language; normalization is the design discipline that decides *which* tables should exist. The goal is simple: store every fact exactly once, so an update can never leave two copies disagreeing. Each normal form removes one class of redundancy.

- **1NF (First Normal Form):** Every cell holds a single, atomic value, and there are no repeating groups. No comma-separated lists inside a column, no `phone1`, `phone2`, `phone3` columns.
- **2NF:** 1NF plus: no non-key column depends on only *part* of a composite key. If the key is `(order_id, product_id)`, a column about the order (like `order_date`) cannot live here — it depends on `order_id` alone.
- **3NF:** 2NF plus: no non-key column depends on another non-key column. Facts about a customer (their city) belong in the customer table, not repeated on every order row.
- **BCNF (Boyce–Codd):** A stricter 3NF: for every functional dependency `X → Y`, X must be a candidate key. 3NF tolerates one rare exception (when Y is part of a key); BCNF does not. In practice, a design that reaches 3NF carefully is almost always already in BCNF.

### A worked example: one ugly table to 3NF

A shop first records orders like this (one row per order, products crammed into one cell):

| order_id | customer | customer_city | products |
|---|---|---|---|
| 101 | Asha | Pune | Pen, Notebook |
| 102 | Rohan | Delhi | Pen |

**Not 1NF** — `products` holds a list. Split rows so each cell is atomic:

| order_id | customer | customer_city | product |
|---|---|---|---|
| 101 | Asha | Pune | Pen |
| 101 | Asha | Pune | Notebook |
| 102 | Rohan | Delhi | Pen |

Still messy: a composite key `(order_id, product)` is needed, and now `customer` and `customer_city` repeat per product row — they depend on `order_id` alone, a **partial dependency** (violates 2NF). And `customer_city` really depends on `customer`, not on the order — a **transitive dependency** (violates 3NF). Fixing a customer's city means editing many rows, and deleting order 101's last product row would erase Asha entirely. Final design:

**customers**: `customer_id (PK), name, city` — one row per customer, city stored once.
**orders**: `order_id (PK), customer_id (FK), order_date`.
**order_items**: `(order_id, product_id) (PK), quantity, unit_price` — one row per product per order.

Now each fact lives in exactly one row: update a city once, add a product without inventing a customer, and nothing disappears when an order is deleted.

## Indexing — B-trees and why queries get fast

Without an index, finding one row means reading the whole table — a full scan that gets slower as data grows. An **index** is a separate, sorted lookup structure maintained by the database: you give it a value, it tells you exactly where the matching rows are. The price is written on the other side: every insert, update, or delete must also maintain the index, and the index consumes disk. Indexes are a read-for-write trade, not free magic.

Almost all relational indexes are **B-trees** (and their sibling, B+ trees). A B-tree is a balanced tree where each node holds many keys, not just one or two. Because a single node can hold hundreds of pointers, the tree stays astonishingly shallow: a tree over a billion rows is often only four levels deep, so a lookup costs a handful of page reads instead of millions.

### B-tree vs B+ tree

| | B-tree | B+ tree |
|---|---|---|
| Where data lives | Keys and row pointers in internal nodes and leaves | Row pointers only in the leaves; internal nodes hold keys purely for navigation |
| Leaf linkage | Leaves are not connected | Leaves are chained in sorted order, so range scans (`BETWEEN`, `ORDER BY`) walk leaf-to-leaf without re-climbing the tree |
| Typical use | General idea, some systems | The standard in MySQL/InnoDB and PostgreSQL-style indexes — most real databases |

### Clustered vs non-clustered

A **clustered index** decides the physical order of the table itself: rows are stored sorted by the clustered key (in InnoDB, the primary key is the clustered index). There can be only one, because rows can only be physically sorted one way. A **non-clustered (secondary) index** is a separate structure whose leaves store the indexed value plus a pointer — usually the primary key — back to the row. Finding a row through a secondary index may need a second hop through the clustered index; a *covering index* avoids that by including every column the query needs right in the index leaf.

## Transactions & ACID

A **transaction** is a group of operations treated as one indivisible unit: either all of them take effect, or none of them do. "Transfer ₹500 from A to B" is two updates — debit and credit — that must never be seen separately.

- **Atomicity — all or nothing.** If the credit fails after the debit, the transaction rolls back and the debit is undone. Money is never half-transferred.
- **Consistency — rules always hold.** The transaction takes the database from one valid state to another: totals stay balanced, constraints (unique emails, balances never negative) remain satisfied. The DB enforces this; the application defines the rules.
- **Isolation — concurrent transactions don't see each other's half-finished work.** Two transfers touching the same account behave as if they ran one after another, even when they actually interleaved.
- **Durability — committed means committed.** Once the database confirms a transaction, it survives a crash or power cut — the write is safely in durable storage (typically via a write-ahead log flushed to disk) before the confirmation is sent.

## Isolation levels & concurrency

Perfect isolation (running every transaction strictly one-at-a-time) is safe but slow. Databases let you choose how much isolation you buy, because looser levels allow more concurrency. The trade-off is defined by which **read anomalies** can sneak in:

- **Dirty read:** reading another transaction's *uncommitted* data — it might be rolled back, meaning you read something that never truly existed.
- **Non-repeatable read:** you read a row twice inside one transaction and get different values, because someone committed an update in between.
- **Phantom read:** you re-run a query with the same filter and new rows appear (or vanish), because someone committed an insert that also matches the filter.

| Isolation level | Dirty read | Non-repeatable read | Phantom read | Concurrency cost |
|---|---|---|---|---|
| **Read Uncommitted** | Possible | Possible | Possible | Cheapest — almost no locking |
| **Read Committed** | Prevented | Possible | Possible | The default in PostgreSQL and many systems |
| **Repeatable Read** | Prevented | Prevented | Possible in the classic definition | MySQL/InnoDB's default; InnoDB's gap locks stop most phantoms too |
| **Serializable** | Prevented | Prevented | Prevented | Safest and slowest — transactions effectively run in some serial order |

How is any of this implemented? Two classical families. With **locking**, transactions take locks on rows they read or write (two-phase locking: acquire everything, then release); reads and writes to others wait or fail. With **MVCC (Multi-Version Concurrency Control)**, the database keeps multiple versions of a row and each transaction reads a consistent *snapshot* — readers never block writers and writers never block readers, which is why MVCC (used by PostgreSQL and InnoDB) is the one-liner worth remembering: *MVCC trades disk space for concurrency by giving every transaction its own time-travelling view.*

## Interview questions

**1. What is the difference between a primary key, a candidate key, and a foreign key?**
> A primary key is the chosen identifier of a row — unique, never NULL, one per table. Candidate keys are all the other column sets that could have been chosen because they are also fully unique. A foreign key is different in kind: it lives in another table and points back at a primary key, which is how the database enforces that a relationship actually refers to a real row.

**2. How do you convert a many-to-many relationship into tables?**
> You cannot store it directly in either table, so you create a junction table — say Enrollments for students and courses — with one row per pairing. Its primary key is typically the composite of the two foreign keys, and it is also the natural home for facts about the pairing itself, like the enrolment date or grade. That one extra table keeps both original tables clean and free of duplicated data.

**3. Explain normalization with a quick example of 1NF to 3NF.**
> First normal form means every cell is atomic — no lists inside a column, so an order holding "Pen, Notebook" splits into rows. Second normal form removes partial dependencies: with a composite key, a column like customer name that depends on only part of the key moves out. Third normal form removes transitive dependencies — if city depends on the customer rather than the order, it belongs in the customer table, so each fact is stored exactly once.

**4. What is an index, why does it make queries fast, and what's the catch?**
> An index is a sorted lookup structure, usually a B-tree, that the database maintains separately from the table, so a search can jump to the matching rows in a few page reads instead of scanning everything. The tree is shallow because each node fans out to hundreds of children. The catch is that writes get slower and storage grows, since every insert, update, and delete has to maintain the index too.

**5. B-tree vs B+ tree — what's the difference?**
> In a B-tree, keys and row pointers can live in any node, and the leaves are not connected to each other. In a B+ tree, all row pointers sit only in the leaves and the leaves are chained in sorted order, so range queries can scan leaf to leaf without climbing the tree. That is exactly why B+ trees are the standard choice in real database indexes.

**6. Clustered vs non-clustered index?**
> A clustered index defines the physical storage order of the rows themselves, so there can be only one — in InnoDB it is the primary key index. A non-clustered or secondary index is a separate sorted structure whose leaves hold the indexed value plus a pointer back to the row. If that second hop matters, I design a covering index that already contains the columns the query needs.

**7. Walk me through ACID with one example.**
> Take a ₹500 bank transfer. Atomicity means the debit and credit both happen or neither does. Consistency means the total money in the system stays valid and no rule like a negative balance is violated. Isolation means a transfer running at the same time on the same account does not see my half-finished work, and durability means that once it commits, a power cut cannot erase it because the change is already in durable storage.

**8. What are dirty reads, non-repeatable reads, and phantom reads?**
> A dirty read is reading someone else's uncommitted change, which may be rolled back and never really exist. A non-repeatable read is reading the same row twice in one transaction and getting different values because someone updated it in between. A phantom is re-running the same filter query and seeing rows appear or disappear because someone inserted a matching row — the row itself is new, not just changed.

**9. Which isolation level prevents what?**
> Read Uncommitted prevents nothing and allows even dirty reads, but it is the cheapest. Read Committed blocks dirty reads and is the default in many databases. Repeatable Read additionally guarantees the same row reads identically all through the transaction, and Serializable prevents phantoms as well by making the outcome equivalent to running transactions one after another — the safest, and the slowest.

**10. What is MVCC in one line?**
> MVCC, or multi-version concurrency control, keeps several versions of a row so each transaction reads a consistent snapshot from its own start time. The big win is that readers never block writers and writers never block readers, so concurrency goes way up. The price is extra storage for old versions plus periodic cleanup of versions nobody can see anymore.

---
