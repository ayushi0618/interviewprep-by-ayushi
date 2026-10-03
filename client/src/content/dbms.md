# DBMS

A database management system is the software that stands between your application and its stored data. Your code says "give me the customers who paid last month"; the DBMS figures out where those rows live, how to find them quickly, what happens when two users edit the same row at the same time, and how to keep everything consistent if the power dies mid-write. Understanding these ideas is what separates someone who can write a query from someone who can design a system.

## ER model & keys — modelling data

Before a single table exists, you model the domain. The **Entity–Relationship (ER) model** describes the world as:

- **Entities** — the things you care about, like `Customer`, `Order`, `Product`. Each entity becomes a table later.
- **Attributes** — the facts you store about an entity: a customer's name, email, city. Attributes become columns.
- **Relationships** — how entities connect: a customer *places* orders, an order *contains* products. Relationships become foreign keys or link tables.

Relationships come in three shapes. **One-to-one** (a user and their passport), **one-to-many** (a customer and their orders — the most common), and **many-to-many** (students and courses: each student takes many courses, each course has many students). A database cannot store a many-to-many directly; you resolve it with a junction table (say `Enrollments`) holding one row per pairing, plus any facts about the pairing itself, like the enrolment date.

### Entities, attributes, and relationships in a little more detail

An **entity** is anything in the real world you need to remember facts about — a person, a place, a thing, or even an event like a payment. In an ER diagram it is drawn as a rectangle, and later it almost always becomes a table. One row of that table is a single *instance*: not "Customer" in the abstract, but one specific customer, Asha, who lives in Pune.

**Attributes** are the facts themselves, drawn as ovals in classic diagrams. They come in flavours interviewers ask about:

- **Simple vs composite:** a simple attribute is one value (`age`); a composite attribute is built from parts (`address` = street + city + PIN). In tables, you usually split composites into separate columns so you can search by city alone.
- **Single-valued vs multivalued:** a customer has one date of birth but possibly three phone numbers. Multivalued attributes are the troublemakers — they later become either a separate table or a 1NF violation (you will meet them again in normalization).
- **Derived:** a value you can compute from others, like `age` from `date_of_birth`. You generally do *not* store derived attributes — compute them when needed, so the stored copy can never drift out of date.
- **Key attribute:** the attribute (or set) that identifies the instance uniquely — underlined in the diagram, and the future primary key.

**Relationships** are the verbs: a customer *places* an order, a doctor *treats* a patient. Beyond the three shapes (1:1, 1:N, M:N), a relationship can carry facts of its own. "Student enrolled in Course" is not just a pairing — it has an enrolment date and a grade. Those facts belong to neither the student nor the course alone, which is exactly why the junction table exists and why it gets columns of its own.

### Cardinality — saying exactly how many

**Cardinality** is the precise "how many on each side" of a relationship, and stating it forces the fuzzy business rules into the open. Read it aloud like this: "One customer places *zero or many* orders; every order is placed by *exactly one* customer." Two extra ideas hide inside that sentence:

- **Total participation:** every order *must* have a customer (total on the order side), while a customer may exist before placing any order (partial on the customer side). In table terms, total participation becomes a `NOT NULL` foreign key.
- **Cardinality decides where the foreign key lives.** In a one-to-many, the key goes on the "many" side — `orders.customer_id`. Putting it the other way (a list of order ids inside the customer row) is the classic beginner mistake: lists inside cells cannot be queried, joined, or enforced.

A worked mini-example. A library system: `Member` borrows `Book`. One member can borrow many books over time, but one physical copy is with at most one member at a time — so `Member 1—N Borrowing`, and each borrowing has a `borrowed_on` and `due_date`. Those dates belong to the *borrowing event*, not to the member or the book, so they live in the borrowing table. Notice the modelling habit this builds: whenever you are unsure where a fact belongs, ask "is this a fact about A, about B, or about the *pairing* of A and B?"

### Weak entities — rows that cannot stand alone

A **strong entity** has its own primary key (`Customer` has `customer_id`). A **weak entity** cannot be identified by its own attributes alone — it borrows identity from a strong entity it depends on. Classic example: an order's line items. "Item number 2" means nothing by itself; it is only meaningful as "item 2 *of order 101*." So `OrderItem` is a weak entity: its key is the composite `(order_id, item_no)`, where `order_id` is inherited from its owner, the `Order`.

The relationship that ties a weak entity to its owner is called an **identifying relationship**, and the part of the key the weak entity contributes itself (the `item_no`) is the **partial key**. Interviewers ask about weak entities because they test whether you noticed that some real-world things only exist *inside* something else — deleting the order should delete its items, and the schema should say so (with `ON DELETE CASCADE` on that foreign key, which the modelling decision is what justifies).

### Keys — how rows earn their identity

| Key | Meaning |
|---|---|
| **Primary key** | The chosen identifier of a row. Unique, never NULL, one per table. It is the row's permanent name. |
| **Candidate key** | Any column (or set) that *could* be the primary key — also fully unique. Whatever you don't pick stays an alternate key. |
| **Super key** | Any superset of a candidate key — unique, but possibly padded with redundant columns. |
| **Foreign key** | A column in one table that points at the primary key of another. It enforces the relationship: you cannot record an order for a customer who does not exist. |
| **Composite key** | A key made of two or more columns together — each column alone may repeat, but the combination never does. |

### The key family, with one example that holds them all

Take a `students` table with columns: `roll_no`, `email`, `phone`, `name`, `aadhaar_no`. Suppose both `roll_no` and `email` are each unique, and so is `aadhaar_no`.

- **Candidate keys:** `roll_no`, `email`, and `aadhaar_no` — each could identify a row alone. Pick one, say `roll_no`, as the **primary key**. The others do not vanish; they remain **alternate keys**, and you still enforce them with `UNIQUE` constraints.
- **Super keys:** `roll_no`, but also `(roll_no, name)`, `(email, phone)` — any set that *contains* a candidate key. Super keys are a definition, not something you store: they matter because "X is a super key" is exactly the test BCNF uses later.
- **Composite key:** in `Enrollments`, neither `student_id` nor `course_id` is unique alone — the same student takes many courses. Together, `(student_id, course_id)` never repeats: a composite key.
- **Foreign key:** `Enrollments.student_id → students.roll_no`. The database now *guarantees* you cannot enrol a ghost student. This guarantee has a name — **referential integrity** — and it is the reason relationships in a DBMS are stronger than relationships you merely "keep in mind" in application code.

Choosing a primary key is a small decision with long shadows. Prefer keys that are stable (an email can change; a roll number rarely does), short (the key is copied into every index and every foreign key that points here), and meaningless (if the key encodes real information — like a roll number embedding the admission year — people eventually want to *change* it, and keys should never need to change). When no natural column qualifies, add a synthetic one (`id`), which is why so many schemas do exactly that.

### From ER diagram to tables

The mechanical mapping: every strong entity becomes a table with its attributes as columns; the primary key is underlined in the diagram and becomes the PK column. A one-to-many relationship is implemented by placing the "one" side's primary key as a foreign key in the "many" side's table (`orders.customer_id → customers.id`). A many-to-many becomes its own table whose composite key is the two foreign keys together. Doing this mapping consciously — instead of inventing tables on the fly — is what keeps a schema clean when requirements grow.

A small complete example, end to end. Domain: students enrol in courses; each course is taught by one instructor.

- `students(student_id PK, name, email UNIQUE)`
- `instructors(instructor_id PK, name, department)`
- `courses(course_id PK, title, instructor_id FK → instructors)` — the 1:N "instructor teaches courses" puts the foreign key on the courses side.
- `enrollments(student_id FK, course_id FK, enrolled_on, grade, PRIMARY KEY (student_id, course_id))` — the M:N became its own table, and the relationship's own facts (`enrolled_on`, `grade`) found their natural home in it.

Read that schema and you can answer real questions with plain joins: "Which courses is Asha taking?" follows `students → enrollments → courses`; "Who teaches the course Asha got an A in?" walks one hop further. That walkability is what good modelling buys.

**Common mistakes / interview traps**

- Modelling a many-to-many as a column ("course_ids: 3,7,9" inside the student row). Lists in cells break querying, joining, and integrity all at once.
- Storing derived data like `age` or `total_price` as columns without a reason — they silently disagree with their sources the first time an update forgets them.
- Choosing a mutable or meaningful value as the primary key, then discovering a year later that changing it means rewriting half the database.
- Forgetting that foreign keys are also how *deletion* behaves: without an explicit choice, "delete this customer who has orders" either fails (safe default) or cascades — and you should be able to say which you intended and why.

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

Now each fact lives in exactly one row: update a city once, add a product without inventing an order, and nothing disappears when an order is deleted.

### Functional dependencies — the one idea underneath all of it

Every normal form is a rule about **functional dependencies**, written `X → Y` and read "X determines Y": whenever two rows agree on X, they must agree on Y. In the ugly table, `order_id → customer` (an order belongs to one customer), `customer → customer_city`, and `(order_id, product) → quantity` would hold if quantity were a column. Normalization is nothing more than checking each dependency and asking: *"Does the left side deserve to determine this — is X a whole key, or only part of one, or not a key at all?"* Partial dependencies fail 2NF, transitive ones fail 3NF, and a non-key determinant fails BCNF. If you learn to spot `X → Y` in a table, the normal forms stop being memorised definitions and become one repeated question.

### The three anomalies normalization prevents

Interviewers often ask for these by name, because they are the *reason* the rules exist. All three are visible in the un-normalized table above:

- **Update anomaly:** Asha moves from Pune to Mumbai. Her city is stored on every order row — miss one, and the database now swears she lives in two cities at once. Two copies of a fact *will* eventually disagree.
- **Insert anomaly:** A brand-new customer, Meera, has registered but not ordered yet. In the one-big-table design there is *nowhere to put her* — a row demands an order. You cannot record a customer without inventing a fake order.
- **Delete anomaly:** Delete order 101's rows (say it was a test order) and Asha vanishes from the system entirely — deleting an order destroyed a customer. Unrelated facts were chained to each other's survival.

One sentence that lands well: *anomalies are what happens when two different facts share one row's lifetime.* Normalization separates facts with different lifetimes into different tables.

### When NOT to normalize — denormalization

Normalization optimises for correctness under updates. Sometimes reads matter more. A report that joins six tables millions of times a day may be deliberately **denormalized** — a calculated column copied on purpose, like storing `order_total` on the order row even though it can be computed from the items. The rules for doing this safely: do it *after* measuring that the normalized design is the bottleneck, denormalize narrowly (one hot query, not the whole schema), and have a plan for keeping the copy in step (compute it in the same transaction, or rebuild it from the source of truth). "We denormalized for read performance and maintain the copy transactionally" is a senior-sounding answer; "we just duplicated columns everywhere" is the fresher version of the same mistake the normal forms exist to prevent.

**Common mistakes / interview traps**

- Reciting definitions but failing the worked example. Interviewers hand you a messy table — practise *splitting one*, not quoting forms.
- Saying "3NF means no redundancy anywhere." It removes dependency-based redundancy; foreign keys themselves (like `customer_id` repeated on orders) are fine and necessary.
- Treating "atomic" as absolute. Atomic means "the database never needs to look inside the value" — a full name in one column is fine if you never search by surname alone.
- Forgetting that 2NF only bites when the key is composite. A table with a single-column key cannot have a partial dependency at all.

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

### Why the B-tree shape is the perfect database shape

Databases read data in **pages** — fixed-size blocks (often 16 KB) pulled from disk in one go. The expensive unit is the page read, not the comparison. So the winning data structure is the one that answers a query in the fewest page reads, and the B-tree is shaped precisely for that: each node is about one page, packed with hundreds of keys and pointers, so one page read eliminates an enormous slice of the search space. Four page reads for a billion-row table is not a slogan; it is the arithmetic of a fan-out of hundreds raised to the fourth power. The tree also stays **balanced** — every leaf sits at the same depth — because inserts split overflowing nodes instead of letting one branch grow long. Worst case and average case stay nearly identical, which is exactly what you want from infrastructure.

A phone-book analogy holds up surprisingly well: to find "Sharma," you do not read page one onward (full scan). You open the book near the end (root node), use the guide letters to narrow to a section (internal nodes), and land on the right page (leaf) — then, because the pages are in order, you can keep turning for a range query like "everyone from Shah to Sharma." That last trick — ordered leaf traversal — is why the *sortedness*, not just the tree shape, matters.

### Composite indexes — order is everything

An index on several columns, like `(city, name)`, is sorted by the first column, then by the second *within* each first-column value — exactly like a phone book sorted by surname, then first name. This gives **leftmost-prefix** behaviour:

- `WHERE city = 'Pune'` — usable. The index is sorted by city first.
- `WHERE city = 'Pune' AND name = 'Asha'` — fully usable, fastest case.
- `WHERE name = 'Asha'` — *not* usable on this index. Names are only sorted inside each city, the way first names are only sorted inside each surname. The database falls back to a full scan.

So column order is a design decision, and the working rule is: put the columns you filter by **equality** first, in an order matching your real queries, and a range column (`>`, `BETWEEN`, `ORDER BY`) last. Build indexes for the queries you actually run — interviewers would rather hear "I look at the slow queries, then design the index" than "I index every column."

### When indexes hurt — the honest other half

- **Write-heavy tables:** every index is a structure that must be updated on every insert, update, and delete. Five indexes on a hot table means each row write does six write jobs. On an event-logging table that is written a million times a day and read twice, indexes are a pure tax.
- **Low-selectivity columns:** an index on a `gender` column or a boolean splits the table into two or three giant halves — the database still has to fetch half the table, so it usually ignores the index and scans anyway. Indexes pay off when a value narrows the search to a small slice.
- **Tiny tables:** scanning forty rows is faster than descending a tree. The query planner knows this and will cheerfully ignore your index — which confuses beginners who then assume the index is "broken."
- **Wrong column order in composites**, as above: an index the queries cannot use is storage and write cost for zero benefit.

The interview-ready summary: *an index is a bet that reads on this column outnumber writes to this table. Place the bet where the evidence — your query log — supports it.*

**Common mistakes / interview traps**

- "Just add an index" as the answer to every slow query, without naming the write cost or selectivity.
- Indexing each column separately when the real query filters two columns together — one composite index beats two single ones for that query.
- Believing a clustered index can exist per column. There is exactly one physical row order, so exactly one clustered index (in InnoDB it *is* the primary key).
- Confusing "the index exists" with "the index is used." The planner decides per query; an index on a low-selectivity column will often be ignored on purpose.

## Transactions & ACID

A **transaction** is a group of operations treated as one indivisible unit: either all of them take effect, or none of them do. "Transfer ₹500 from A to B" is two updates — debit and credit — that must never be seen separately.

- **Atomicity — all or nothing.** If the credit fails after the debit, the transaction rolls back and the debit is undone. Money is never half-transferred.
- **Consistency — rules always hold.** The transaction takes the database from one valid state to another: totals stay balanced, constraints (unique emails, balances never negative) remain satisfied. The DB enforces this; the application defines the rules.
- **Isolation — concurrent transactions don't see each other's half-finished work.** Two transfers touching the same account behave as if they ran one after another, even when they actually interleaved.
- **Durability — committed means committed.** Once the database confirms a transaction, it survives a crash or power cut — the write is safely in durable storage (typically via a write-ahead log flushed to disk) before the confirmation is sent.

### One transfer, four properties — what breaks without each

Keep one example and stress-test it four ways. The scene: Aarav sends ₹500 to Bina. The transaction is two updates — `Aarav.balance -= 500`, `Bina.balance += 500` — starting from ₹2,000 and ₹300 (total ₹2,300).

**Atomicity — what breaks without it:** The debit succeeds, then the server crashes before the credit. Without atomicity, ₹500 has evaporated: Aarav has ₹1,500, Bina still has ₹300, and the total is ₹1,800. Nobody stole it; the system simply stopped mid-sentence. Atomicity says the partial work is rolled back on recovery, so the database returns to "the transfer never started" — Aarav is whole again. The mechanism is the **undo log**: the database remembers the old values so it can reverse an unfinished transaction.

**Consistency — what breaks without it:** Suppose the credit is written twice by a retry bug, or a transfer is allowed to drive Aarav to ₹−100. Every individual write "worked," yet the *rules of the world* are broken: money was created from nothing, or an account went negative against the bank's rule. Consistency means a transaction only ever moves the database from one rule-abiding state to another — constraints like `CHECK (balance >= 0)`, unique keys, and foreign keys are the database's way of refusing to enter an illegal state, aborting the transaction instead. Notice the division of labour: the application *declares* the rules; the database *guarantees* them, even against buggy code paths — that is why "we check it in the app" is a weaker answer than "the database enforces it."

**Isolation — what breaks without it:** While Aarav's transfer is half-done (debited, not yet credited), a reporting query sums all balances and reads the total as ₹1,800 — a ₹500 dip that never really existed. Worse, a second transfer touching Aarav's account reads his mid-transaction balance and computes from a number that may be rolled back seconds later. Isolation promises that concurrent transactions behave *as if* each ran alone, in some order: the report sees ₹2,300 either before the transfer or after it, never the broken in-between. The next section is entirely about how strong that promise is at each level.

**Durability — what breaks without it:** The transfer commits, the app shows "Payment successful," and then the power fails. If the change lived only in memory, the restarted database has forgotten a transaction it already confirmed — Bina never got paid, and the bank's confirmation was a lie. Durability is the fix: before saying "committed," the database writes the change to a **write-ahead log (WAL)** on disk. The rule of WAL is simple and worth quoting: *the log record reaches durable storage before the data pages do.* After a crash, the database replays the log (**redo**) to restore every committed transaction, and uses its undo information to erase every uncommitted one. Committed survives; uncommitted vanishes. That pair of moves, performed automatically on startup, is called **crash recovery**.

### COMMIT, ROLLBACK, and the life of a transaction

In practice a transaction has a small lifecycle worth being able to narrate:

1. **BEGIN** — statements that follow are grouped; nothing is final yet.
2. **Work** — reads and writes happen. Other transactions are shielded from your half-finished state (how strongly depends on the isolation level).
3. **COMMIT** — you declare success. The changes become visible to everyone and, per durability, are already safe on disk. There is no undoing a commit; you can only write a *new* transaction that compensates (like a refund reversing a payment).
4. Or **ROLLBACK** — any failure (a violated constraint, a deadlock chosen as the victim, your own code deciding the payment looks fraudulent) ends the transaction and the database undoes every change it made, as if it never ran.

One fresher-friendly framing: a transaction is a *draft* the database lets you prepare privately. Commit publishes the draft; rollback bins it. ACID is the set of promises about how drafts behave.

**Common mistakes / interview traps**

- Defining ACID words without an example. Always anchor to a transfer: "Atomicity — the ₹500 debit and credit land together or not at all."
- Saying consistency is "the application's job." The application defines the rules, but the database *enforces* them via constraints — that partnership is the correct answer.
- Confusing durability with backups. Durability is about surviving a crash *immediately after commit*, via the write-ahead log — not about long-term backup copies.
- Thinking commit can be undone with rollback. After commit, only a compensating transaction can reverse the effect.

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

### The three anomalies, as tiny stories

Abstract definitions slide off the brain; two-transaction stories stick. In each tale, T1 and T2 overlap in time, and the anomaly is the moment reality stops making sense.

**Dirty read.** T1 updates Asha's salary from ₹50,000 to ₹60,000 but has not committed. T2, preparing a bonus report, reads ₹60,000 and uses it. Then T1 *rolls back* (the update was a mistake). T2 has now published a report based on a salary that never existed. Read Uncommitted allows this; every higher level forbids it, because committed-only reading is the minimum sane promise.

**Non-repeatable read.** T1 reads the account balance: ₹2,000. Meanwhile T2 completes a ₹500 payment and *commits*. T1 reads the same row again: ₹1,500. Nothing in T1 changed, yet its two reads disagree — any logic T1 built on the first value ("balance is enough to approve this") is now standing on sand. Read Committed still allows this; Repeatable Read forbids it by giving T1 one stable snapshot (or locking the row) for its whole lifetime.

**Phantom read.** T1 runs: "How many orders over ₹10,000 today?" Answer: 7. T2 inserts a new ₹12,000 order and commits. T1 runs the *identical* query: 8. No existing row was edited — a *new* row materialised inside T1's filter, like a phantom. That last word is the whole distinction: non-repeatable reads are about a row *changing*, phantoms are about rows *appearing or disappearing*. In the classic table only Serializable forbids phantoms outright — though InnoDB's Repeatable Read closes most of the gap with **gap locks**, locks on the *spaces between* index entries that stop inserts into a range you have read. That nuance ("InnoDB prevents most phantoms even at Repeatable Read") is a delightful thing to know in a MySQL shop's interview.

### Choosing a level like an engineer, not a textbook

Defaults exist for a reason, and the professional answer is rarely "always use Serializable":

- **Start at the default** (Read Committed on PostgreSQL/Oracle, Repeatable Read on MySQL/InnoDB). It prevents the genuinely dangerous anomaly — dirty reads — while letting the system breathe.
- **Fix specific races with narrower tools first.** "Balance must not go negative" is usually better solved with a constraint, or by locking the one row (`SELECT ... FOR UPDATE`), than by raising the isolation of the entire application.
- **Raise the level for genuinely order-sensitive work** — allocating the *last* seat on a flight, computing an account summary that must be internally consistent — where a non-repeatable read or phantom is a real business bug, not a theoretical one.
- **Remember the other direction exists too:** for analytics and reports that scan millions of rows, locking everything is catastrophic; a snapshot read (which MVCC gives almost for free) is the right tool, and a slightly stale answer is usually acceptable.

### Deadlocks — the price of locking, and how systems pay it

Wherever locks exist, this can happen: T1 locks row A, then wants row B. T2 locks row B, then wants row A. Neither can proceed; each waits for the other, forever. That is a **deadlock**. Databases do not prevent it perfectly — they *detect* it: a background check finds the cycle of waiting, picks a victim (usually the transaction that has done the least work), and rolls it back so the other can finish. The victim's application is expected to retry. Two habits minimise deadlocks in real code: always lock rows in the *same order* across your application (A before B, everywhere), and keep transactions short — a lock held across a user thinking, a network call, or a coffee break is a deadlock and a traffic jam waiting to happen.

Put together, the concurrency story of a modern database sounds like this: MVCC snapshots let readers and writers pass each other freely; row locks settle the genuine writer-versus-writer fights; the isolation level decides how fresh and stable each snapshot must be; and when locking still knots itself into a cycle, deadlock detection cuts the knot and one side retries. Concurrency is not one mechanism — it is these four cooperating.

**Common mistakes / interview traps**

- Defining phantoms as "a row changed value." Changed value in the same row is a non-repeatable read; phantoms are rows appearing/disappearing under a repeated filter.
- "Higher isolation is always better." It trades away concurrency; Serializable everywhere is a system that politely serialises its users into a queue.
- Naming only locking when asked how isolation is implemented. MVCC — snapshot reads where readers never block writers — is the modern headline answer.
- Forgetting the deadlock follow-through: detection picks a victim and rolls it back, so applications must be ready to retry a transaction.

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

## Query processing & EXPLAIN — how the database thinks

Your schema and indexes are designed; ACID keeps you safe. But between the SQL you type and the rows that come back, there's a piece of engineering most freshers never look at: the **optimizer**. When your query runs slowly, "add an index" is guessing — the optimizer already made a plan, and `EXPLAIN` shows it to you. Reading that plan is the difference between fixing queries and collecting superstitions.

### From SQL text to running plan — four steps

1. **Parsing:** The database checks syntax and names, and builds a parse tree — "this is a join of these tables, filtered by that predicate." Nothing clever yet.
2. **Rewriting:** It simplifies where it safely can — unfolding views, pushing filters down towards the tables, flattening subqueries into joins.
3. **Optimization:** The cost-based heart. For each table the optimizer guesses *how* to fetch rows (full scan? which index?); for joins, in what order and with which algorithm. It estimates each option's cost using **statistics** it maintains about your tables — rough row counts, how values are distributed — and picks the cheapest plan. The estimates are the whole game: bad statistics in, bad plan out.
4. **Execution:** The chosen plan runs as a tree of operators, each pulling rows from the one below it.

"Cost" is an abstract unit, roughly proportional to page reads plus CPU work. You never need the exact formula; you need to know it is a *guess computed from statistics*, because that explains the optimizer's occasional bad day.

### The three join algorithms (each SQL join is one of these underneath)

| Algorithm | How it works | Wins when |
|---|---|---|
| **Nested loop** | For each row of the outer table, look up matches in the inner — ideally via an index | The outer side is small (after filtering), and the inner has an index on the join column |
| **Hash join** | Build a hash table over the smaller input, then scan the larger probing it | Joining two big tables with no useful indexes — the general-purpose heavy lifter |
| **Merge join** | Sort both inputs (or read them sorted via indexes) and walk together like a zipper | Both inputs are already sorted on the join key, or an equijoin needs sorted output anyway |

A tiny cost intuition. `customers` has 10,000 rows; `orders` has 1,000,000. Join every order to its customer: a nested loop with an index on `customers.id` performs ~1,000,000 index probes — plausible, but a hash join (build a hash of 10,000 customers in memory, then one scan of `orders`) usually wins. Now filter to `city = 'Pune'` first — 100 customers survive: nested loop does 100 probes, and the hash join still has to build machinery. Small filtered side → nested loop. Big unfiltered sides → hash. That sentence predicts most plans you'll ever read.

### Reading an EXPLAIN — a worked plan

Say the filter-then-join query above produces this (simplified PostgreSQL-style output):

```
Hash Join  (cost=125.00..1245.00 rows=500 width=64)
  Hash Cond: (o.customer_id = c.id)
  ->  Seq Scan on orders o  (cost=0.00..1000.00 rows=1000000 width=32)
  ->  Hash  (cost=110.00..110.00 rows=100 width=32)
        ->  Index Scan using customers_city_idx on customers c
              (cost=0.29..110.00 rows=100 width=32)
              Index Cond: (city = 'Pune')
```

How to decode it:

- **Read inside-out, bottom-up:** the indented children run first. The `Index Scan` finds Pune customers; `Hash` builds a hash table of them; `Seq Scan` streams all of `orders`; the `Hash Join` probes each order against the hash.
- **`cost=110.00..110.00`:** first number is *startup* cost (work before the first row can emerge — building the hash), second is *total* cost to produce all rows. Top line: 125 to start, 1245 overall.
- **`rows=100`:** the optimizer's *estimate* of rows at that step. The plan is only as good as these numbers.
- **`Seq Scan on orders`** looks alarming but is fine here: we genuinely need to sweep all orders, and scanning 1M rows was budgeted at 1000 cost units.

**`EXPLAIN ANALYZE`** goes further: it actually *executes* the query and prints real times plus the true row counts next to the estimates. The diagnostic gold is the gap between them: `rows=100` estimated but `actual rows=40000` means the statistics are stale or the columns are correlated — and the plan built on that estimate is probably wrong. The fix is often refreshing statistics (`ANALYZE <table>`), not adding an index.

### The plan-reading checklist

1. **Any `Seq Scan` on a large table *combined with* a selective filter?** Candidate for a missing index — or for low selectivity where the scan is honestly right.
2. **Estimated vs actual rows far apart?** Statistics problem; refresh them before redesigning anything.
3. **Nested loop with a huge `loops=` count?** Each loop is a probe; a million probes beats nothing. Consider whether a hash join was rejected due to a bad estimate.
4. **Sort steps on big inputs?** Might be avoidable with an index that already delivers the order.

**Common mistakes / interview traps**

- "The query is slow, add an index" without reading a plan. Optimizers ignore unnecessary indexes, and the real problem is often join order or stale statistics.
- Treating a `Seq Scan` as automatically bad. Fetching 40% of a table by index is *slower* than scanning it — the optimizer knows.
- Forgetting the estimates are estimates. When a plan looks insane, suspect the statistics first — that's why `EXPLAIN ANALYZE` exists.
- Thinking cost numbers are milliseconds. They are dimensionless planning units; only `EXPLAIN ANALYZE` shows real time.

### The 30-second interview answer

> "The database parses the SQL, then a cost-based optimizer chooses a plan — scan methods, join order, and a join algorithm — using table statistics. Nested loop wins when the filtered side is small and the other side is indexed; hash join wins for big unfiltered joins; merge join when inputs are already sorted. `EXPLAIN` shows the estimated plan, `EXPLAIN ANALYZE` runs it and shows real row counts, and a big gap between estimated and actual rows usually means stale statistics, not a missing index."

## Index internals — inside the B+ tree, plus hash and bitmap indexes

The indexing chapter explained *that* B+ trees make queries fast. This one opens the bonnet: watch a B+ tree being built insertion by insertion, and meet the two other index shapes — hash and bitmap — that win in their own niches and fail loudly outside them.

### Building a B+ tree, insertion by insertion

Simplify the world: each leaf holds at most **3 entries**, leaves are chained left-to-right in sorted order, and when a leaf overflows it splits and *copies* its smallest new key up to the parent as a signpost.

```
Insert 10:        [10]
Insert 20:        [10, 20]
Insert 5:         [5, 10, 20]            ← full
Insert 15:        overflow! split [5,10,15,20] into two leaves,
                  copy the separator 15 up into a new root:

                       [15]
                      /    \
                [5, 10] → [15, 20]
Insert 25:        [5, 10] → [15, 20, 25]
Insert 30:        second leaf overflows, splits, copies 25 up:

                       [15, 25]
                      /    |    \
            [5, 10] → [15, 20] → [25, 30]
Insert 12:        lands in the first leaf (sorted place): [5, 10, 12]
```

Three lessons live inside this little construction:

1. **The tree grows at the root, never at the leaves.** When the *root itself* splits, a new root is created above it and the tree gains a level — everywhere at once. That's why every leaf stays the same depth and the tree is balanced by construction, not by luck.
2. **Duplicates of separator keys are signposts, not data.** In a B+ tree the `15` and `25` in the root are copied-up guides; the real entries (with pointers to rows) live only in the leaves. That's the B/B+ difference from the earlier chapter, now visible.
3. **The leaf chain is the range machine.** "All keys between 12 and 28" descends once to leaf one, then walks the chain — no repeated trips through the root. Sorted order is preserved because every insert lands in its correct leaf.

Deletions mirror this: a leaf that empties below half can borrow a key from a sibling or merge with it, and if the root ends up with a single child the tree shrinks a level. Day-to-day you don't manage this — but knowing splits happen explains a real phenomenon: an insert that *usually* costs one page write occasionally triggers a cascade of splits, which is why bulk-loading sorted data (few splits) is so much faster than loading it shuffled.

### Hash indexes — the sprinter who can't run distance

A hash index hashes the key and stores the row pointer in a bucket: `bucket = hash(key)`. Lookup is one hash and one bucket read — true O(1), no tree descent. The catch is total: hashing *destroys order*. `hash('Asha')` and `hash('Ashok')` land in unrelated buckets, so:

| Operation | B+ tree | Hash index |
|---|---|---|
| `WHERE id = 42` | ~4 page reads (tree descent) | 1 bucket read |
| `WHERE price BETWEEN 100 AND 200` | Descend once, walk leaves | Useless — must scan everything |
| `ORDER BY name` | Already sorted, stream it out | Useless — output scrambles |
| `WHERE name LIKE 'Ash%'` | Range in disguise — works | Useless |

Hash indexes therefore appear where only equality exists — hash join internals, key-value lookups, some engines' in-memory tables — while the general-purpose crown stays with B+.

### Bitmap indexes — one bit per row

For a column with few distinct values, keep one **bitmap per value**: a string of bits, one per row, 1 = "this row has this value." Watch three filters collapse into bit operations on a `status` column over 8 orders:

```
status = 'paid':    1 0 1 1 0 1 0 1
status = 'pending': 0 1 0 0 1 0 1 0
city   = 'Pune':    1 1 0 1 0 0 1 0

paid AND Pune:      1 0 0 1 0 0 0 0   ← two rows, computed by AND-ing bit strings
```

A million-row table's bitmap is a million bits = 125 KB per value — tiny, cache-friendly, and AND/OR-ing dozens of filters costs almost nothing. That's why **data warehouses love bitmap indexes** for ad-hoc analytical filters (status × city × month × channel). And why OLTP systems avoid them: updating one row's status means rewriting chunks of several bitmaps under lock — a single-user analytics dream is a thousand-writers' traffic jam.

**Common mistakes / interview traps**

- "Hash index is O(1), so it's better than B+." Better at exactly one operation; helpless at ranges, ordering, and prefixes — which is most real querying.
- Believing inserts into a B+ tree can unbalance it. It balances on every split and grows only at the root; worst-case depth is guaranteed — that's its whole value proposition.
- Recommending bitmap indexes for a `user_id` column (millions of distinct values → millions of bitmaps). Bitmap is for *low* cardinality only.
- Forgetting write costs when proposing any index: every insert descends and updates each index; splits make the occasional insert expensive. More indexes is never free.

### The 30-second interview answer

> "A B+ tree keeps every leaf at the same depth by splitting overflowing nodes and growing only at the root, with all data in sorted, linked leaves — so equality and range lookups both take a few page reads. A hash index is faster for pure equality, one bucket read, but hashing destroys order so ranges and sorting get nothing. A bitmap index stores one bit-string per distinct value, brilliant for low-cardinality analytics filters via AND/OR, and avoided in write-heavy OLTP because updates rewrite bitmaps under lock."

## Serializability & locking — 2PL, timestamps, and snapshots

The isolation chapter told you *which anomalies each level allows*. This one answers the follow-up: *how does the database actually enforce any of this, and what does "serializable" formally mean?* The key idea is **serializability**: an interleaved execution of transactions is correct if its effect equals *some* one-at-a-time (serial) execution of the same transactions. Nobody runs them serially — the database just owes you a result indistinguishable from it.

### Conflict serializability — the checkable version

Two operations **conflict** if they belong to different transactions, touch the same data item, and at least one is a write (read–write, write–read, write–write). Reads commute with reads; everything else has an order that matters. A schedule is **conflict-serializable** if you can swap non-conflicting operations until it becomes a serial schedule.

The mechanical test is the **precedence graph**: one node per transaction, and an edge Ti → Tj whenever an operation of Ti conflicts with and comes before an operation of Tj. **Acyclic graph → conflict-serializable** (topological order gives the equivalent serial order). **A cycle → not.**

Try both. Schedule A:

```
R1(X)   W2(X)   R2(Y)   W1(Y)
```

- `R1(X)` before `W2(X)` → edge T1 → T2.
- `R2(Y)` before `W1(Y)` → edge T2 → T1.
- The graph has a cycle **T1 → T2 → T1** → **not conflict-serializable.** No serial order can reproduce it: serially, if T1 ran first, its read of X would precede T2's write *and* its write of Y would precede T2's read.

Schedule B:

```
R1(X)  W1(X)  R2(X)  W2(X)  C1  C2
```

- `W1(X)` before `R2(X)` and before `W2(X)` → both edges point T1 → T2. Acyclic → **equivalent to serial T1, T2.** Intuitively right: T2 reads the value T1 wrote, exactly as if T1 had run first.

(View serializability is a weaker, more permissive notion — equivalent in *what reads see and what the final writes are*, without requiring conflicts to line up. It accepts a few more schedules and is NP-hard to test, so conflict serializability is the one engineers and exams actually use.)

### Two-phase locking (2PL) — enforcing it with locks

**2PL** is the classic enforcement discipline: every transaction has a **growing phase** (it may acquire locks — shared for reads, exclusive for writes — but release none) followed by a **shrinking phase** (it may release locks but acquire none). Follow that rule and the resulting schedules are guaranteed conflict-serializable. Break it — release a lock, then grab another — and you've let someone observe a state from which no serial order explains the outcome.

Two production variants matter more than the textbook rule:

- **Strict 2PL:** a transaction holds its *exclusive* locks until it commits or aborts. Other transactions never see uncommitted writes — so no dirty reads, and an abort never forces *other* transactions to abort as well (no cascading rollback). This is what most lock-based systems actually ship.
- **Rigorous 2PL:** hold *all* locks (shared too) until the end. Even stricter, even simpler recovery.

The price of correctness via locks is the one you met in the concurrency chapter: deadlocks. Two transactions acquiring locks in opposite orders can wait forever; the database detects the cycle and sacrifices a victim. **Lock in a consistent order everywhere, keep transactions short** — the same advice as in the OS deadlock chapter, because locking is a cross-cutting disease.

### The other two roads: timestamps and snapshots

**Timestamp ordering** gives every transaction a start timestamp and orders conflicts by age — no locks at all. A read that arrives "too late" (a younger transaction already wrote a newer version) simply aborts and restarts. No deadlocks possible, but under heavy write contention the restart storms can be worse than waiting — which is why it survives mostly in textbooks and a few niches.

**MVCC / snapshot isolation** keeps multiple versions of each row (the mechanism the isolation chapter described); each transaction reads the snapshot as of its start and buffers its own writes. Readers never block writers — the massive concurrency win that made PostgreSQL and InnoDB famous. The subtle leak is **write skew**: snapshot isolation checks *write–write* conflicts but not *read–write* ones. Classic story: a hospital requires at least one doctor on call. T1 reads "two doctors on call (me and Dr. B)," and signs off. T2, simultaneously, reads the same "two on call" and signs off too. Neither *wrote* a row the other wrote — different rows entirely! Both commit. Result: nobody on call. No serial order explains it, yet plain snapshot isolation permits it — which is why PostgreSQL's Serializable level adds detection (SSI) on top of snapshots to catch exactly this shape.

| Mechanism | How it orders transactions | Deadlocks? | Signature weakness |
|---|---|---|---|
| Locking (Strict 2PL) | Blocks conflicting access until commit | **Yes** — detected, victim aborted | Waits and deadlock management |
| Timestamp ordering | Aborts whoever violates timestamp order | No | Restart storms under contention |
| MVCC snapshot isolation | Reads a start-time snapshot | No (for reads) | Write skew slips through without SSI |

**Common mistakes / interview traps**

- "Serializable means transactions run one at a time." No — it means the outcome *equals* some serial execution. Interleaving is happening constantly.
- Drawing precedence-graph edges from read–read pairs. Reads don't conflict with reads; no edge.
- Thinking 2PL prevents deadlocks. It prevents non-serializable schedules — deadlocks remain, and systems detect them separately.
- "MVCC means Serializable." Snapshots give Repeatable-Read-like behaviour; write skew proves snapshot ≠ serializable without extra machinery.

### The 30-second interview answer

> "Serializable means the interleaved execution equals some serial order. We test conflict serializability with a precedence graph — edge Ti to Tj for each conflicting operation in time order; acyclic means serializable. Strict two-phase locking enforces it in practice by holding write locks until commit, at the price of deadlocks the system must detect. MVCC takes the snapshot route instead — readers never block writers — but plain snapshot isolation lets write skew through, which is why true Serializable needs extra checks on top."

## BCNF, worked properly — the case 3NF lets through

The normalization chapter walked a messy shop table from 1NF to 3NF and stated BCNF's rule: for every functional dependency X → Y, X must be a candidate key. Fine — but why does BCNF exist at all if 3NF already "removes transitive dependencies"? Because there's a famous table that passes 3NF with full marks and *still* has anomalies. Here it is, worked completely.

### The setup

A tutoring centre records which teacher teaches each student a course:

**Enrolment(student, course, teacher)**

The business rules:

1. Each student–course pair is taught by exactly one teacher: **(student, course) → teacher**
2. Each teacher teaches exactly one course (Dr. Rao only ever teaches Physics): **teacher → course**

Find the candidate keys. Start with (student, course): its closure adds teacher via rule 1 — that's everything, so **(student, course) is a candidate key**. Try (student, teacher): rule 2 gives course, so (student, teacher) also determines everything — **a second candidate key**. (Student alone, course alone, teacher alone determine nothing fully.)

Now test the normal forms:

- **3NF?** For each FD, either the left side is a key, or the right side is part of some candidate key. Rule 2 (teacher → course) fails the first test — teacher is not a key — but *course is part of a candidate key*, so 3NF **permits it**. The table is in 3NF.
- **BCNF?** BCNF has no "part of a key" excuse. teacher → course with teacher not a candidate key: **violated**. The table is 3NF but **not BCNF**.

### The anomalies BCNF caught and 3NF missed

Some sample rows:

| student | course | teacher |
|---|---|---|
| Asha | Physics | Dr. Rao |
| Rohan | Physics | Dr. Rao |
| Meera | Chemistry | Dr. Iyer |
| Asha | Chemistry | Dr. Iyer |

- **Update anomaly:** The fact "Dr. Rao teaches Physics" is stored once per Physics student. Reassign Dr. Rao to Biology and you must find every one of his rows; miss one and the database believes he teaches two courses — exactly what rule 2 forbids.
- **Insert anomaly:** A new teacher, Dr. Bose, is hired to teach Maths — but no student has enrolled yet. There is nowhere to record "Dr. Bose teaches Maths," because a row demands a student.
- **Delete anomaly:** Meera is Dr. Iyer's last Chemistry student in the table. Delete just that row and the fact "Dr. Iyer teaches Chemistry" evaporates from the database.

Same three diseases as the un-normalized shop table, in a table that glows green under 3NF. That's why BCNF exists.

### The decomposition, step by step

The recipe is always the same: find the offending FD (determinant not a key), and split along it.

1. Offender: **teacher → course**. Pull it out into its own table: **Teaches(teacher, course)**, where teacher is now the primary key and the FD is enforced by that key.
2. What remains: drop the dependent column from the original: **Enrolment(student, teacher)**, key (student, teacher).

| Teaches | | Enrolment | |
|---|---|---|---|
| teacher | course | student | teacher |
| Dr. Rao | Physics | Asha | Dr. Rao |
| Dr. Iyer | Chemistry | Rohan | Dr. Rao |
| | | Meera | Dr. Iyer |
| | | Asha | Dr. Iyer |

Two checks every decomposition must pass:

- **Lossless join:** joining the two tables back must reproduce the original exactly, with no invented rows. The rule: the common attribute (teacher) must be a key of one side. teacher *is* the key of Teaches → **lossless ✓**. (Verify by eye: the join rebuilds all four original rows and nothing extra.)
- **Dependency preservation:** can every original FD be checked inside one table? teacher → course now lives happily inside Teaches. But **(student, course) → teacher cannot be checked without joining** — no single table holds all three columns anymore. So this decomposition is lossless but **not dependency-preserving**: the database can no longer enforce "one teacher per student–course pair" with a simple key constraint. That is the known, accepted price of BCNF in this classic case — and the reason practical designers sometimes stop at 3NF here with the trade-off made *knowingly*, not by accident.

General lesson: normalize to BCNF whenever dependencies allow it, but when a BCNF decomposition would destroy a constraint you care about, choosing 3NF *on purpose, eyes open* is an engineering decision. Choosing it by not knowing BCNF exists is just a fresher mistake.

**Common mistakes / interview traps**

- "3NF and BCNF are basically the same." This exact table is the counterexample — recite the difference: 3NF forgives a non-key determinant if the dependent column is part of a key; BCNF never forgives a non-key determinant.
- Decomposing along an FD whose left side *is* a key. That split is legal but pointless — you'd be separating a fact from its own key.
- Claiming the decomposition is done without the two checks. Lossless join (non-negotiable) and dependency preservation (desirable, sometimes sacrificed) — interviewers listen for both by name.
- Forgetting why the anomalies existed: the fact "teacher → course" had a different lifetime than "student studies" and was being stored at the wrong grain. Grain, as always, is the root cause.

### The 30-second interview answer

> "BCNF tightens 3NF: every determinant must be a candidate key, no exceptions. The classic gap case has (student, course) → teacher and teacher → course; the table passes 3NF because course is part of a key, yet 'teacher teaches course' repeats on every student row and can't be recorded until a student enrolls — update, insert, and delete anomalies. Splitting into Teaches(teacher, course) and Enrolment(student, teacher) is lossless since teacher keys the first table, but the (student, course) → teacher constraint can no longer be enforced without a join — the standard BCNF trade-off."

## Scaling up — partitioning, sharding, and replication

Every earlier chapter assumed one database server, growing ever more heroic. Real systems eventually meet three separate walls: the table is too big to manage, one machine can't take the writes, and reads outnumber what one box can serve. The three tools of this chapter attack those walls in order of escalating commitment — and the escalation ladder itself is interview material.

### Partitioning — one server, many smaller tables

**Partitioning** splits one logical table into physical pieces inside the same database, usually by a column value:

- **Range partitioning:** `orders_2026_01`, `orders_2026_02`, … by month. Old months can be archived or dropped in O(1) — delete a whole partition instead of a billion-row `DELETE`.
- **List partitioning:** by region or status — one partition per value.
- **Hash partitioning:** spread rows by `hash(user_id)` when no natural slicing exists, mainly to shrink each piece evenly.

The superpower is **partition pruning**: a query with `WHERE order_month = '2026-10'` touches *only* that partition — the optimizer skips the other 35 entirely. Same table name in your SQL, a fraction of the data under the hood. Partitioning buys manageability and pruning without any application changes, but the ceiling remains one machine's CPU, RAM, and write rate.

### Sharding — many servers, one logical database

**Sharding** splits data *across machines*: users 1–1M on server A, the rest on B… or better, `hash(user_id)` decides the shard. The application (or a proxy) routes each query to the right server.

Shard key choice is destiny:

- **Hash sharding** (say, on `user_id`): writes spread evenly, no hotspots — but range queries scatter to every shard.
- **Range sharding** (by date, by user-id ranges): range queries are beautiful, and the newest range absorbs *all* new inserts — a **hot shard** doing 100% of writes while its siblings nap. Timestamp keys have the same trap inside hash-less designs: everything "now" lands together.
- **The celebrity problem:** one shard key value (a superstar user, a viral product) can melt its shard even under hashing. Real systems detect and split hot keys specially.

What sharding costs, honestly stated: cross-shard JOINs move into application code; multi-shard transactions need coordination protocols (two-phase commit) or are simply refused; unique constraints go global or go home; and **resharding** — moving data when the shard count changes — is surgery on a running system. This is why sharding sits *last* on the ladder: it scales writes nearly linearly and complexity faster than that. (These costs echo the ordering trade-offs of hash vs range indexes — same physics, bigger stage.)

### Replication — copies for reads and survival

**Replication** keeps copies of the *same* data on multiple servers: one **leader** accepts writes and streams them to **followers**. Followers then absorb read traffic — the classic read-replica scaling move — and if the leader dies, a follower can be promoted (failover).

The honest catch is **replication lag**: followers trail the leader by milliseconds to (on a bad day) seconds. So a user updates their profile on the leader, instantly refreshes, and the read lands on a lagging follower showing the *old* profile — the **read-your-own-write** problem. Fixes: route a user's reads to the leader briefly after their writes, or accept eventual consistency where it doesn't matter (like counts, feeds). Synchronous replication (leader waits for follower acknowledgment) kills lag and kills write performance in the same stroke — it's always a dial, never a free upgrade.

### The escalation ladder — the actual interview answer

When asked "your database is struggling, what do you do?", resist jumping to sharding. The professional sequence:

1. **Fix queries and indexes** (the EXPLAIN chapter — most "scaling problems" are one missing composite index).
2. **Cache** hot reads (even a 90% cache hit rate divides database load by ten).
3. **Read replicas** for read-heavy load.
4. **Partition** giant tables for manageability and pruning.
5. **Shard** only when one machine's *writes* are truly the wall — knowing the application complexity you're signing for.

**Common mistakes / interview traps**

- "We'll shard by timestamp." Everything current lands on one shard — you've built a very expensive single server with extra steps.
- Presenting replication as a *write*-scaling tool. Followers multiply reads; writes still funnel through one leader (until sharding).
- Ignoring read-your-own-write. Any design with read replicas must answer it, even if the answer is "we accept staleness for feeds, never for balances."
- Treating sharding as step one. It's the highest-complexity move on the ladder; reaching it first signals pattern-matching, not engineering.

### The 30-second interview answer

> "I scale in order of complexity. First fix slow queries and indexes, then cache hot reads, then add read replicas — one leader writes, followers serve reads, accepting replication lag and handling read-your-own-write carefully. Partitioning splits a huge table into pruned pieces on one server for manageability. Sharding comes last: spread rows across servers by a well-chosen shard key, hashed to avoid hot shards, knowing cross-shard joins and transactions become application problems."

## NoSQL vs SQL — a decision guide, not a holy war

Sooner or later an interviewer asks: "SQL or NoSQL for this app?" The wrong answers are tribal ("NoSQL scales better") and lazy ("always SQL"). The right answer is a decision procedure. NoSQL is not one thing — it's four different data models that share only a marketing label, and each is brilliant exactly where the relational model creaks.

### The four NoSQL families

| Family | Think of it as | Examples | Sweet spot |
|---|---|---|---|
| **Key-value** | A giant dictionary / locker room | Redis, DynamoDB | Sessions, caches, carts — look up one value by one key, extremely fast |
| **Document** | A folder of JSON files | MongoDB, Firestore | Product catalogues, user profiles — self-contained records with varying fields |
| **Wide-column** | A sparse spreadsheet sorted by row key, billions of rows | Cassandra, HBase | Write firehoses: events, logs, time-series, IoT feeds |
| **Graph** | The relationships *are* the storage | Neo4j | Friend-of-friend, fraud rings, recommendations — traversals SQL joins dread |

### The forces that actually decide

- **Data shape & relationships.** If your questions constantly combine entities ("orders with their customers and their payments"), joins are your native language — SQL. If records are self-contained aggregates (a product with all its attributes), documents shine.
- **Access patterns.** NoSQL stores are designed *backwards from known queries*: you shape data to the questions, and unanticipated questions are painful. SQL tolerates new questions gracefully — ad-hoc queries are its home turf.
- **Consistency stakes.** Money, inventory, seats: you want ACID transactions. Likes counts and activity feeds tolerate **eventual consistency** — NoSQL's usual deal, where replicas converge shortly after a write.
- **Scale shape.** A single SQL server (especially with read replicas) carries most products further than founders expect. NoSQL's horizontal-write scaling wins when writes genuinely exceed one machine — and not before.

### CAP theorem, in plain words

When a network **partition** splits your servers into groups that can't talk to each other (a cable cut, a cloud region isolated), you must choose, *for the duration*: keep answering with possibly-stale data (**Availability**) or refuse/diverge-safely until the partition heals (**Consistency**). You can't fully have both while partitioned — that's the theorem. A bank balance check chooses CP; a "likes" counter chooses AP. Partitions are rare, so CAP matters for minutes a year — but those minutes decide whether you lost money or just showed a stale number. (No partition → no dilemma; the trade-off only wakes up during failures.)

### The decision, worked on three products

- **A payments ledger:** relational shape, joins everywhere, consistency is the business. **SQL**, full ACID — no contest.
- **A food app's product catalogue:** each dish is a self-contained document with varying attributes (some have combos, some have allergens list); reads vastly outnumber writes; access pattern is "fetch by id / by restaurant." **Document store** fits naturally — though a JSON column in PostgreSQL also does this job, which is the sophisticated answer to volunteer.
- **A sensor network writing 100k readings/second:** append-only, queried by (device, time window), no joins, losing one reading is harmless. **Wide-column** — this is literally the workload it was born for.

Notice what none of these did: choose by hype, or by "SQL doesn't scale" — the modern answer often being that **you start relational, and adopt a NoSQL store per-workload** when a specific force (write volume, document shape, traversal depth) demands it. Polyglot persistence, chosen on evidence.

**Common mistakes / interview traps**

- "NoSQL has no schema." It has schema-on-read: the structure moves into application code, where it's enforced by discipline instead of the engine. Say what enforces integrity in your design.
- Choosing a document store, then JOIN-ing in application code with a loop of queries (the N+1 disaster). If you must join constantly, that *was* the signal for SQL.
- "NoSQL scales better" as a complete sentence. Scales *what* — writes across machines — at the price of joins, transactions, and ad-hoc queries. Name the trade.
- Forgetting PostgreSQL's JSONB: document flexibility inside an ACID relational engine is a legitimate middle path and shows current knowledge.

### The 30-second interview answer

> "I decide from data shape, access patterns, and consistency stakes — not fashion. Heavily relational data with joins and money at stake: SQL with ACID. Self-contained records like catalogues: document store. Append-only write firehoses like sensor events: wide-column. Relationship traversals: graph. Social feeds and counters tolerate eventual consistency, so availability-first stores fit. And my default is relational until a specific force — write scale, document shape, traversal depth — justifies adding a NoSQL store for that workload."

---
