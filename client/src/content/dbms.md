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
