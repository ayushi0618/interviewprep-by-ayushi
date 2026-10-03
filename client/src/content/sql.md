# 🗄️ SQL Deep-Dive — Complete Interview Notes

SQL shows up in almost every fresher interview — full-stack or data. Most candidates know `SELECT *`; interviewers want JOINs, GROUP BY, and clear thinking. This file covers it all in plain language, with queries you can write on a whiteboard.

> 📚 Part of **InterviewPrep by Ayushi Singh** — my complete interview-preparation series for final-year students and freshers. Read one topic a day, say the answers out loud, and walk in ready.

---

## 📌 1. The Only Query Shape You Need

```sql
SELECT  columns          -- which columns to show
FROM    table_name       -- from which table
WHERE   condition        -- filter rows (before grouping)
GROUP BY column          -- bundle rows into groups
HAVING  condition        -- filter groups (after grouping)
ORDER BY column ASC/DESC -- sort the result
LIMIT   n                -- keep only n rows
```

> [!NOTE]
> **One-line interview answer:** "Logical order is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT — that's why a SELECT alias can't be used in WHERE but can in ORDER BY."

```sql
SELECT name, salary FROM employees
WHERE department = 'Engineering'
ORDER BY salary DESC LIMIT 5;   -- top 5 highest-paid in Engineering
```

🎤 What the interviewer actually asks: "Fetch the top 5 highest-paid employees in Engineering." — `ORDER BY ... DESC` + `LIMIT` is the pattern.

## 🔍 2. Filtering — WHERE in Depth

| Tool | Meaning | Example |
|---|---|---|
| `=` `!=` `>` `<` `>=` `<=` | Compare a value | `salary > 50000` |
| `AND` / `OR` / `NOT` | Combine conditions | `dept='HR' AND salary>30000` |
| `BETWEEN a AND b` | Range, **inclusive** | `salary BETWEEN 30000 AND 80000` |
| `IN (...)` | Match any in list | `city IN ('Delhi','Pune')` |
| `LIKE` | Pattern match | `name LIKE 'A%'` |
| `IS NULL` | Missing value | `manager_id IS NULL` |

```sql
name LIKE 'A%'   -- starts with A    → Ayushi, Aman
name LIKE '%a'   -- ends with a      → Priya, Sneha
name LIKE '%sh%' -- contains "sh"    → Ayushi, Ashish
name LIKE '_a%'  -- 2nd letter is a  → Rahul, Kabir
```

> [!WARNING]
> **NULL trap:** `NULL` means *unknown* — `salary = NULL` never matches. Always write `salary IS NULL`. Even `NULL != NULL` is unknown, not true.

```sql
SELECT DISTINCT city FROM employees;                 -- unique cities
SELECT DISTINCT department, city FROM employees;     -- pairs distinct together
SELECT COUNT(DISTINCT city) FROM employees;          -- "how many different cities" (ignores NULLs)
```

> [!TIP]
> `COUNT(*)` counts rows, `COUNT(col)` counts non-NULL values, `COUNT(DISTINCT col)` counts unique non-NULL values. Interviewers love this trio.

Try it live — this playground runs on a `students(id, name, city, course, marks)` table, so write against exactly those columns:

```sql-playground SQL playground: filter and sort students
SELECT name, marks FROM students WHERE marks >= 80 ORDER BY marks DESC;
-- Try next: change 80 to 60, add AND course = 'CS', or sort ASC instead.
```

---

## 🔗 3. JOINs — Combining Tables

Think with: **employees**(1 Ayushi dept 10, 2 Rahul dept 20, 3 Sneha dept NULL) and **departments**(10 Engineering, 20 Design, 30 Marketing).

| JOIN | What you get | On our tables |
|---|---|---|
| `INNER` | Only matches on **both** sides | Ayushi–Eng, Rahul–Design (2 rows) |
| `LEFT` | All left rows; NULLs where no match | All 3 employees; Sneha → NULL dept |
| `RIGHT` | All right rows; NULLs where no match | All 3 depts; Marketing → NULL name |
| `FULL OUTER` | Everything, gaps as NULL | All employees + all departments |

```sql
SELECT e.name, d.dept_name FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;   -- only matched pairs

SELECT e.name, d.dept_name FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;    -- everyone, dept if any
```

> [!IMPORTANT]
> **Classic question — "employees with NO department":** LEFT JOIN, then filter the gaps: `... LEFT JOIN departments d ON e.dept_id = d.id WHERE d.id IS NULL;`

🎤 What the interviewer actually asks: "INNER vs LEFT JOIN?" — "INNER returns only matching rows from both tables. LEFT returns every left-table row, with NULLs where the right table has no match."

> [!TIP]
> MySQL has no `FULL OUTER JOIN` — simulate with `LEFT JOIN ... UNION ... RIGHT JOIN ...`.

### A JOIN, joined by hand (row by row)

Don't memorise the table above — *watch* it happen. Take the two tiny tables from this section:

employees: `(1, Ayushi, dept 10)`, `(2, Rahul, dept 20)`, `(3, Sneha, dept NULL)` — departments: `(10, Engineering)`, `(20, Design)`, `(30, Marketing)`.

INNER JOIN walks each employee and keeps only exact matches:

- Ayushi (dept 10) → finds Engineering → keep `Ayushi | Engineering` ✅
- Rahul (dept 20) → finds Design → keep `Rahul | Design` ✅
- Sneha (dept NULL) → NULL never equals anything → dropped ❌

Result: exactly 2 rows. LEFT JOIN repeats the same walk but refuses to drop a left row:

- Ayushi → Engineering ✅, Rahul → Design ✅, Sneha → no match, so keep her anyway with `Sneha | NULL` ✅

Result: 3 rows. That single difference — "drop unmatched left rows vs keep them with NULLs" — *is* the INNER vs LEFT answer, and now you can re-derive it on any whiteboard instead of reciting it.

> [!WARNING]
> **Common mistake:** putting the right-table filter in `WHERE` after a LEFT JOIN (`WHERE d.dept_name = 'Engineering'`). That silently turns your LEFT JOIN back into an INNER JOIN, because the NULL rows fail the filter. Filter the right table inside the `ON` clause when you truly want to keep unmatched left rows.

This playground runs on `students` only (the live DB has no second table), so it uses a subquery — the same "compare each row against an aggregate" idea a JOIN often replaces:

```sql-playground SQL playground: students above the average
SELECT name, marks FROM students
WHERE marks > (SELECT AVG(marks) FROM students)
ORDER BY marks DESC;
-- TODO: also show students above the average in their own course.
-- Hint: correlate the inner query with the outer row's course.
```

---

---

## 📊 4. GROUP BY + Aggregates

| Function | Does what |
|---|---|
| `COUNT(*)` | Number of rows |
| `SUM(col)` | Total (ignores NULLs) |
| `AVG(col)` | Average (ignores NULLs) |
| `MIN(col)`/`MAX(col)` | Smallest / largest |

```sql
SELECT dept_id, COUNT(*) AS headcount, AVG(salary) AS avg_salary
FROM employees GROUP BY dept_id ORDER BY avg_salary DESC;
```

### HAVING vs WHERE

| | `WHERE` | `HAVING` |
|---|---|---|
| Filters | Individual **rows** | Whole **groups** |
| Runs | **Before** GROUP BY | **After** GROUP BY |
| Aggregates? | ❌ No | ✅ Yes |
| Example | `WHERE salary > 40000` | `HAVING AVG(salary) > 60000` |

```sql
SELECT dept_id, AVG(salary) AS avg_salary FROM employees
WHERE is_active = 1            -- row filter first (cheaper)
GROUP BY dept_id HAVING AVG(salary) > 60000;
```

> [!NOTE]
> **One-line interview answer:** "WHERE filters rows before grouping and can't see aggregates. HAVING filters groups after GROUP BY — aggregate conditions go there."

🎤 What the interviewer actually asks: "Can I put `AVG(salary) > 60000` in WHERE?" — No. Groups don't exist yet at WHERE time.

### GROUP BY + HAVING, traced on five rows

Watch the pipeline instead of memorising the slogan. Employees `(Engineering, 80k)`, `(Engineering, 60k)`, `(Design, 50k)`, `(Design, 40k)`, `(HR, 90k)`, query: average salary per department, only departments averaging above 55k.

First, WHERE would run (none here, so all 5 rows pass). Then GROUP BY bundles them: Engineering `{80k, 60k}`, Design `{50k, 40k}`, HR `{90k}`. Aggregates collapse each bundle to one row: Engineering → 70k, Design → 45k, HR → 90k. Only now does HAVING look at those *finished groups* and keep Engineering (70k) and HR (90k), dropping Design (45k). SELECT finally shows `dept, avg_salary`.

If you had written that 55k condition in WHERE, the database would ask "is *this individual salary* above the department average?" — a question that doesn't exist yet, because no average has been computed. That's the failure, in plain words.

```sql-playground SQL playground: average marks per course
SELECT course, AVG(marks) AS avg_marks, COUNT(*) AS students_count
FROM students
GROUP BY course
HAVING AVG(marks) >= 70
ORDER BY avg_marks DESC;
-- TODO: change the HAVING threshold, then try COUNT(*) >= 3
-- to keep only courses with at least 3 students.
```

> [!WARNING]
> **Common mistake:** selecting a bare column that is neither grouped nor aggregated (`SELECT name, AVG(marks) ... GROUP BY course`). Which name would it show for a 30-student course? There is no honest answer, so strict databases error — group by every non-aggregated column you select.

## 🕳️ 5. Subqueries & DISTINCT

```sql
-- SCALAR (one value → =, >, <): above-average earners
SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);

-- IN (a list): employees in Delhi departments
SELECT name FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE city = 'Delhi');
```

> [!WARNING]
> A scalar subquery must return **exactly one row, one column** — or the query errors. Might return many? Use `IN`, not `=`.

> [!TIP]
> Most subqueries can be rewritten as JOINs (usually faster), but in interviews a correct subquery beats a broken JOIN.

### Same answer, two ways — subquery vs JOIN

Goal: names of employees who work in a Delhi department. Subquery way — ask for the Delhi department ids first, then filter employees against that list:

```sql
SELECT name FROM employees
WHERE dept_id IN (SELECT id FROM departments WHERE city = 'Delhi');
```

JOIN way — glue the tables together, then filter the combined rows:

```sql
SELECT e.name FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE d.city = 'Delhi';
```

Both return the identical names. The subquery reads like the English ("employees whose dept is in the Delhi list"); the JOIN reads like the mechanism ("combine, then filter") and usually scales better because the database can use indexes and join ordering. In an interview, write whichever you can write *correctly* first, then say "this could also be written as a JOIN" — naming the alternative is the senior signal.

> [!NOTE]
> **Under the hood:** modern optimisers often rewrite an `IN` subquery into a join internally anyway. Your job is clarity; the engine's job is the execution plan. Never claim one is *always* faster — say "usually the JOIN, and I'd check with EXPLAIN."

---

## ✍️ 18 Practice Queries

Schema for all 18 — say each answer aloud before opening the solution:
`employees(id, name, dept_id, salary, city, manager_id, is_active)` · `departments(id, dept_name, city)` · `orders(id, employee_id, amount, order_date)`

**Q1. Active employees, highest salary first, top 3.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT name, salary FROM employees
WHERE is_active = 1 ORDER BY salary DESC LIMIT 3;
```

</details>

**Q2. Names starting with 'A', salary between 40,000 and 90,000.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT name, salary FROM employees
WHERE name LIKE 'A%' AND salary BETWEEN 40000 AND 90000;
```

</details>

**Q3. Every employee with department name — even those with none.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT e.name, d.dept_name FROM employees e
LEFT JOIN departments d ON e.dept_id = d.id;
```

</details>

**Q4. Departments (by name) with more than 5 employees.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT d.dept_name, COUNT(*) AS headcount FROM employees e
JOIN departments d ON e.dept_id = d.id GROUP BY d.dept_name HAVING COUNT(*) > 5;
```

</details>

**Q5. Employees who never placed an order.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT e.name FROM employees e
LEFT JOIN orders o ON o.employee_id = e.id WHERE o.id IS NULL;
```

</details>

**Q6. Total order amount per employee, biggest first.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT e.name, SUM(o.amount) AS total_sales FROM employees e
JOIN orders o ON o.employee_id = e.id GROUP BY e.name ORDER BY total_sales DESC;
```

</details>

**Q7. Employees earning more than their own department's average.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT name, salary, dept_id FROM employees e
WHERE salary > (SELECT AVG(salary) FROM employees WHERE dept_id = e.dept_id);
```

</details>

**Q8. How many unique cities do active employees come from?**
<details>
<summary>💡 Solution</summary>

```sql
SELECT COUNT(DISTINCT city) AS city_count
FROM employees WHERE is_active = 1;
```

</details>

**Q9. Direct reports of manager id 4 (top-level staff have manager_id NULL).**
<details>
<summary>💡 Solution</summary>

```sql
SELECT name FROM employees WHERE manager_id = 4;
```

</details>

**Q10. Departments in Delhi/Pune with at least one order above 10,000.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT DISTINCT d.dept_name FROM departments d
JOIN employees e ON e.dept_id = d.id JOIN orders o ON o.employee_id = e.id
WHERE d.city IN ('Delhi','Pune') AND o.amount > 10000;
```

</details>

**Q11. Second-highest distinct salary across all employees.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT MAX(salary) AS second_highest_salary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

</details>

**Q12. Employees earning more than their manager.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

</details>

**Q13. Employee names that appear more than once.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT name, COUNT(*) AS copies
FROM employees
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY copies DESC;
```

</details>

**Q14. Monthly order totals with a running total.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
       SUM(amount) AS month_total,
       SUM(SUM(amount)) OVER (ORDER BY DATE_FORMAT(order_date, '%Y-%m')) AS running_total
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;
```

</details>

**Q15. Departments with active employees from both Delhi and Pune.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id
WHERE e.is_active = 1 AND e.city IN ('Delhi', 'Pune')
GROUP BY d.dept_name
HAVING COUNT(DISTINCT e.city) = 2;
```

</details>

**Q16. Highest-paid employee in each department.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT dept_name, name, salary
FROM (
  SELECT d.dept_name, e.name, e.salary,
         ROW_NUMBER() OVER (PARTITION BY d.dept_name ORDER BY e.salary DESC) AS rn
  FROM employees e
  JOIN departments d ON e.dept_id = d.id
) ranked
WHERE rn = 1
ORDER BY salary DESC;
```

</details>

**Q17. Employees who placed orders on two consecutive days.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT DISTINCT e.name
FROM orders o1
JOIN orders o2 ON o1.employee_id = o2.employee_id
  AND DATEDIFF(o2.order_date, o1.order_date) = 1
JOIN employees e ON e.id = o1.employee_id
ORDER BY e.name;
```

</details>

**Q18. Delete duplicate employee rows (same name and city), keeping the lowest id.**
<details>
<summary>💡 Solution</summary>

```sql
-- Run Q13 first to see which names would be affected.
DELETE e2
FROM employees e1
JOIN employees e2 ON e1.name = e2.name AND e1.city = e2.city AND e1.id < e2.id;
```

</details>

> [!TIP]
> **Narrate while you write** — interviewers grade your thinking, not just the final SQL.

## ⚡ 6. Indexes — Fast Reads, Costly Writes

An index is a sorted lookup structure (usually a B-tree) on a column — like a textbook's back index. Without it, the database scans every row.

```sql
CREATE INDEX idx_emp_dept ON employees(dept_id);
```

| | Effect |
|---|---|
| **Helps** | `WHERE`, `JOIN ON`, `ORDER BY`, `GROUP BY` on that column → fast lookups, not full scans |
| **Costs** | Extra disk; every INSERT/UPDATE/DELETE also updates the index → slower writes |
| **Rule** | Index columns you filter/join on often; never index everything "just in case" |

> [!NOTE]
> **One-line interview answer:** "An index trades write speed and disk space for much faster reads. The primary key gets a unique index automatically."

### Why an index is fast — the B-tree in plain words

Without an index, finding `dept_id = 20` means reading every row top to bottom (a full table scan) — like reading a whole textbook to find one mention of "photosynthesis." An index is the book's back index: entries sorted alphabetically, each pointing to a page. Sorted order is the entire trick — the database can binary-search instead of scanning.

That sorted structure is usually a **B-tree**: a shallow, wide tree where each node holds many sorted keys and points to the next level. With a million rows, a B-tree is only about 3–4 levels deep, so a lookup touches 3–4 pages instead of a million rows. That's the honest "why" behind "indexes make queries fast" — logarithmic hops versus a linear walk.

> [!NOTE]
> **Under the hood:** an index stores the indexed column(s) plus a pointer to the full row. A query that needs only indexed columns can answer from the index alone (a "covering index") and never touch the table at all — that's the fastest read a relational database can do.

> [!WARNING]
> **Common mistake:** indexing every column "for performance." Each index is a second sorted structure the database must maintain on every write, so inserts get steadily slower and the disk fills with redundant trees. Index what your WHERE, JOIN, and ORDER BY actually use.

## 🔒 6B. Transactions & ACID — all or nothing

A transaction bundles several statements so they succeed or fail *together*. Trace a ₹500 transfer from account A (₹2,000) to account B (₹1,000):

```sql
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 'A';  -- A: 1500
UPDATE accounts SET balance = balance + 500 WHERE id = 'B';  -- B: 1500
COMMIT;  -- both changes become permanent at once
```

If the server crashes *between* the two updates and you had no transaction, ₹500 vanishes — A is debited, B never credited. With a transaction, the crash triggers a rollback: both updates undo, balances return to 2000/1000, as if nothing happened. That all-or-nothing promise is **Atomicity**. The other three letters, one line each: **Consistency** (the database never lands in an invalid state — totals and constraints still hold), **Isolation** (concurrent transfers don't read each other's half-finished state), **Durability** (after COMMIT, the result survives a crash — it's written to durable log/storage).

Say it like this: "I wrap multi-step writes in a transaction so a failure mid-way rolls everything back — the database is never left half-updated."

### Each letter prevents one specific disaster

| Letter | Property | The disaster it prevents |
|---|---|---|
| **A** | Atomicity | The ₹500 leaves A but never reaches B — a transfer stranded half-way |
| **C** | Consistency | A rule breaking silently: a balance below zero, or two accounts whose total no longer adds up |
| **I** | Isolation | Two transfers reading the same half-updated balance at once and spending the same money twice |
| **D** | Durability | You saw "transfer successful," the server crashed a second later, and the money was gone anyway |

The two transfer lines again, with the safety net shown honestly this time — watch what happens when the *second* line fails:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 'A';  -- fine: A is now 1500
UPDATE accounts SET balance = balance + 500 WHERE id = 'B';  -- ERROR: account B was closed
ROLLBACK;  -- undo everything: A returns to 2000, as if you never started
```

That `ROLLBACK` is Atomicity you can watch: either both updates land (you `COMMIT`) or neither does (you `ROLLBACK`) — there is no third outcome where only the debit survives. Run the debit alone in a practice database, roll back, and re-check the balance; seeing ₹2,000 come back makes the word permanent.


## 🪟 6C. Window Functions — rank without collapsing rows

GROUP BY collapses each group into one row; a window function keeps every row and *adds* a computed column. Simplest useful case: number students within each course by marks.

```sql
SELECT name, course, marks,
  ROW_NUMBER() OVER (PARTITION BY course ORDER BY marks DESC) AS rank_in_course
FROM students;
```

`PARTITION BY course` restarts the numbering per course; `ORDER BY marks DESC` puts the topper at 1. The output has the same row count as the input — you can now filter `WHERE rank_in_course <= 3` for "top 3 per course," a classic interview favourite that GROUP BY alone cannot express. Reach for window functions when the question says "per group, but keep the individual rows."

### Three ranking functions, one tiny table

The only real difference between them shows up on a **tie**, so watch for the tied row. One course, four students:

| name | marks |
|---|---|
| Ayushi | 92 |
| Rahul | 88 |
| Sneha | 88 |
| Kabir | 75 |

Run each function with `OVER (ORDER BY marks DESC)` and compare the column it adds:

| name | marks | ROW_NUMBER() | RANK() | DENSE_RANK() |
|---|---|---|---|---|
| Ayushi | 92 | 1 | 1 | 1 |
| Rahul | 88 | 2 | 2 | 2 |
| Sneha | 88 | 3 | 2 | 2 |
| Kabir | 75 | 4 | 4 | 3 |

- **ROW_NUMBER()** — every row gets its own number, tie or not (Rahul 2, Sneha 3, in whichever order). Pick it when exactly one winner is needed.
- **RANK()** — tied rows share a number, then the count *skips*: two students at rank 2 means nobody is rank 3, so Kabir is 4. Think shared medals.
- **DENSE_RANK()** — tied rows share a number, but nothing is skipped: Kabir is 3, and the ranks stay "dense" (1, 2, 2, 3).

> [!TIP]
> **Top-3-per-group, written safely:** a window column does not exist yet while `WHERE` runs, so wrap it once and filter outside: `SELECT * FROM (SELECT name, course, ROW_NUMBER() OVER (PARTITION BY course ORDER BY marks DESC) AS rn FROM students) ranked WHERE rn <= 3;` Swap in `RANK()` when two tied students should *both* count as rank 2.

Say it like this: "GROUP BY answers 'one row per group'; a window function answers 'every row, plus its rank inside its group' — that is why topper-per-class questions need windows, not groups."



## 🧱 7. Normalization Recap

Normalization = storing each fact **once**, so data can't contradict itself.

| Form | One-line rule | Violation |
|---|---|---|
| **1NF** | Atomic values, no lists in a cell | `skills='Java, Python'` in one column |
| **2NF** | Non-key columns depend on the **whole** key | `product_name` in `order_items` depends only on `product_id` |
| **3NF** | No column depends on another non-key column | `dept_name` inside `employees` (depends on `dept_id`) |

> [!IMPORTANT]
> Normalization kills redundancy but costs JOINs. Real systems sometimes **denormalise** deliberately for read speed — name it as a trade-off, not a mistake.

Worked fix, thirty seconds: a single table `orders(order_id, customer_name, customer_city, product, price)` stores Ayushi's name and city on *every* order — update her city once, miss one row, and the data contradicts itself. Normalising splits it into `customers(id, name, city)` and `orders(id, customer_id, product, price)`: the city now lives in exactly one row, and orders reach it by foreign key. You traded one table for two plus a JOIN — and bought the guarantee that a fact can never disagree with itself. That trade-off sentence is the whole normalization answer at fresher depth.

```sql
-- Before (city repeated on every order row):
-- orders: (1, 'Ayushi', 'Ghaziabad', 'Keyboard', 1999)
--         (2, 'Ayushi', 'Ghaziabad', 'Mouse',     799)

-- After (each fact stored once):
-- customers: (7, 'Ayushi', 'Ghaziabad')
-- orders:    (1, 7, 'Keyboard', 1999)
--            (2, 7, 'Mouse',     799)
SELECT o.id, c.name, c.city, o.product
FROM orders o JOIN customers c ON c.id = o.customer_id;
```

### The same fix, one normal form at a time

Start from one honest beginner table — enrollments with everything stuffed in:

`enrollments(student_id, student_name, course_id, course_title, skills)` — one row like `(1, 'Ayushi', 7, 'Databases', 'Java, Python')`.

- **To 1NF:** a cell holds a *list* (`'Java, Python'`), so split it — one row per skill (or a separate skills table). Now every cell holds one value.
- **To 2NF:** the key is `(student_id, course_id)`, but `student_name` depends on the student alone and `course_title` on the course alone — each repeats on every matching row. Move them out: `students(id, name)` and `courses(id, title)`; the enrollment keeps only the two ids.
- **To 3NF:** suppose the row also carries the course's department. That depends on the course, not on the enrollment — one more hop away from the key. It belongs inside `courses`, not here.

End state: `students`, `courses`, `enrollments(student_id, course_id)`, and skills stored one per row. Keep the old sentence in your pocket — it *is* the three forms in one breath: "every column depends on the key, the whole key, and nothing but the key."


## 🏷️ 8. Naming Trap: SQL vs MySQL

> [!WARNING]
> **SQL is a language; MySQL is a product.** SQL is the standard language for relational databases. MySQL, PostgreSQL, SQLite, SQL Server all *speak* SQL with small dialect differences (`LIMIT` vs `TOP`). "I know MySQL" = one dialect; the concepts transfer everywhere.

One line per name, so the two stop blurring:

- **SQL** — the *language*: the `SELECT … JOIN … GROUP BY` grammar every relational database shares.
- **MySQL** — a *product* that speaks SQL (free, very common; spells paging as `LIMIT`).
- **PostgreSQL** — another product speaking the same language, stricter about types and rich in features.
- **SQLite** — a tiny product that keeps the whole database in one file; what many apps and demos actually run.

> [!TIP]
> **What to say in interviews:** list **SQL** as the skill, and name the product you actually used next to the project ("Built with SQL (MySQL)"). If an interviewer works in a different dialect, say: "I write MySQL spelling — the concepts transfer, only small syntax differs." Naming the difference calmly scores better than claiming every product is identical.


---

## 🎤 Mock Interview Questions — SQL

**1. What is the difference between WHERE and HAVING?**
> WHERE filters individual rows before grouping, and it cannot use aggregate functions. HAVING filters groups after GROUP BY, so conditions like AVG(salary) > 60000 belong in HAVING. I use WHERE first because filtering early is cheaper.
**2. INNER JOIN vs LEFT JOIN — what's the difference?**
> INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table, filling NULLs where the right table has no match. I use LEFT JOIN when missing data should still show up — like listing all employees even if some have no department.
**3. How do you find employees with no matching record in another table?**
> I LEFT JOIN the two tables and then filter WHERE the right table's key IS NULL. For example, employees LEFT JOIN orders, then WHERE orders.id IS NULL gives me employees who never placed an order.
**4. What does COUNT(*) vs COUNT(column) vs COUNT(DISTINCT column) do?**
> COUNT(*) counts all rows. COUNT(column) counts only non-NULL values in that column. COUNT(DISTINCT column) counts unique non-NULL values — so COUNT(DISTINCT city) tells me how many different cities appear.
**5. What is a primary key, and can it be NULL?**
> A primary key uniquely identifies each row in a table, and there can be only one per table. It can never be NULL and never duplicate — the database enforces both. A foreign key, by contrast, can be NULL if the relationship is optional.
**6. Explain 1NF, 2NF, and 3NF in one line each.**
> 1NF means atomic values — no lists stuffed into one cell. 2NF means every non-key column depends on the whole primary key, not part of it. 3NF means no column depends on another non-key column, so each fact is stored exactly once.
**7. What is an index, and when does it hurt?**
> An index is a sorted lookup structure that makes WHERE, JOIN, and ORDER BY on that column fast instead of scanning the whole table. It hurts on writes, because every insert or update must also update the index, and it costs disk space — so I index columns I actually filter on.
**8. How do you fetch the second-highest salary?**
> One clean way is a subquery: SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees). Another is ORDER BY salary DESC LIMIT 1 OFFSET 1. I mention the subquery version first because it shows I understand nesting.
**9. LIKE vs IN vs BETWEEN — when do you use each?**
> LIKE is for text patterns with wildcards, like names starting with 'A'. IN matches a value against a fixed list, like city IN ('Delhi', 'Pune'). BETWEEN is an inclusive range, mainly for numbers and dates. Picking the right one keeps the query readable and index-friendly.
**10. SQL or MySQL — are they the same thing?**
> No — SQL is the language, MySQL is one database product that speaks it, like PostgreSQL or SQLite. The core syntax transfers, but dialects differ in small ways, like LIMIT in MySQL versus TOP in SQL Server. On my resume I write SQL for the skill and name the product separately.

---

## ✅ 60-Second Revision Checklist

- [ ] **Query order** — FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
- [ ] **WHERE vs HAVING** — rows before grouping vs groups after; aggregates only in HAVING
- [ ] **NULL** — never `= NULL`; use `IS NULL`; COUNT(column) skips NULLs
- [ ] **JOINs** — INNER = matches only; LEFT = all left + NULL gaps; "no match" = LEFT JOIN + `WHERE right.key IS NULL`
- [ ] **LIKE** — `%` = any run of characters, `_` = exactly one character
- [ ] **Aggregates** — COUNT, SUM, AVG, MIN, MAX ignore NULLs (except COUNT(*))
- [ ] **DISTINCT** — unique rows; `COUNT(DISTINCT col)` answers "how many different…"
- [ ] **Subqueries** — scalar (one value, use `=`) vs list (use `IN`); most can be JOINs
- [ ] **Indexes** — faster reads on filtered/joined columns; slower writes + disk cost
- [ ] **Normalization** — 1NF atomic, 2NF whole-key, 3NF no non-key dependencies
- [ ] **SQL ≠ MySQL** — SQL is the language; MySQL/PostgreSQL/SQLite are products
## 🪟 9. Window Functions Deep Dive

Chapter 6C gave you `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()`. That's the doorway. This chapter is the rest of the house — the functions interviewers use to test whether you can think *across* rows without collapsing them.

Remember the core idea: a window function looks at a "window" of related rows, computes something, and sticks the answer back on *every* row. No rows disappear.

```sql
-- employees(id, name, dept_id, salary, hire_date)
-- monthly_sales(month, revenue)
```

### LAG and LEAD — peeking at neighbours

`LAG(col, n)` reads the value from the row `n` steps *before* the current row (inside the same window). `LEAD(col, n)` reads `n` steps *after*. The default `n` is 1.

```sql
SELECT month, revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_month,
  LEAD(revenue) OVER (ORDER BY month) AS next_month
FROM monthly_sales;
```

| month | revenue | prev_month | next_month |
|---|---|---|---|
| 2026-01 | 100000 | NULL | 120000 |
| 2026-02 | 120000 | 100000 | 90000 |
| 2026-03 | 90000 | 120000 | NULL |

First row has no previous month, so `LAG` gives `NULL`. Last row has no next month, so `LEAD` gives `NULL`. That's not a bug — it's honest.

> [!TIP]
> `LAG(revenue, 1, 0)` — the third argument is the value to use when there is no previous row, instead of `NULL`. Handy for `revenue - prev` maths.

🎤 What the interviewer actually asks: "How do you compare this month's sales with last month's in one query?" — `LAG` in the same `SELECT`, no self-join needed.

### Worked example 1 — month-over-month growth

```sql
SELECT month, revenue,
  LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) AS change_amount,
  ROUND(
    100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
    / LAG(revenue) OVER (ORDER BY month), 1
  ) AS growth_pct
FROM monthly_sales
ORDER BY month;
```

| month | revenue | prev_revenue | change_amount | growth_pct |
|---|---|---|---|---|
| 2026-01 | 100000 | NULL | NULL | NULL |
| 2026-02 | 120000 | 100000 | 20000 | 20.0 |
| 2026-03 | 90000 | 120000 | -30000 | -25.0 |

Division by the previous month is why the first row stays `NULL` — dividing by `NULL` gives `NULL`, which is exactly what "no growth rate yet" means. Cleaner still, compute `LAG` once in a subquery or CTE (chapter 10) and reuse the alias — window results exist by the time an outer query reads them.

### Running totals — the frame is the whole game

A running total is just `SUM(...) OVER (ORDER BY ...)`, but the bit that controls *which* rows get summed is called the **frame**.

```sql
SELECT name, salary,
  SUM(salary) OVER (ORDER BY hire_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_payroll
FROM employees;
```

Read the frame out loud: "from the very first row (`UNBOUNDED PRECEDING`) up to and including me (`CURRENT ROW`)." That's a running total.

| Frame phrase | Means |
|---|---|
| `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | Start of partition → current row (running total) |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Previous 2 rows + current (3-row moving sum) |
| `ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING` | Current row → end of partition |
| `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` | Previous, current, next (centred window) |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` | Whole partition (same value on every row) |

```sql
-- 3-month moving average of revenue
SELECT month, revenue,
  ROUND(AVG(revenue) OVER (
    ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ), 0) AS moving_avg_3
FROM monthly_sales;
```

> [!WARNING]
> **`ROWS` vs `RANGE` trap.** The default frame (when you write `OVER (ORDER BY x)` with no frame) is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. With `RANGE`, rows that *tie* on the ORDER BY value are treated as one group — both get the same total. With `ROWS`, each physical row advances the sum. If two employees share a hire_date, a default-frame running total can "jump" by both salaries at once. In interviews, write the frame out explicitly: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Explicit beats default every time.

### Worked example 2 — running salary total, reset per department

`PARTITION BY` restarts the window per group, so the running total resets too:

```sql
SELECT dept_id, name, salary,
  SUM(salary) OVER (
    PARTITION BY dept_id
    ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_salary_in_dept
FROM employees
ORDER BY dept_id, salary DESC;
```

Each department starts again from its own top earner. "Cumulative cost until we have covered the top N earners in each department" is now a one-liner — that kind of question is precisely why frames exist.

🎤 What the interviewer actually asks: "Show each employee's salary and the total salary paid to everyone hired up to and including them." — `SUM(salary) OVER (ORDER BY hire_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`.

### NTILE — slicing a group into buckets

`NTILE(n)` chops the ordered window into `n` roughly equal buckets and labels them 1..n.

```sql
SELECT name, salary,
  NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
FROM employees;
```

Quartile 1 = top 25% earners. This is "split employees into salary bands", "top decile of customers" (`NTILE(10)`, keep bucket 1) — questions that are painful with plain `GROUP BY` and trivial here.

### FIRST_VALUE and LAST_VALUE

```sql
SELECT dept_id, name, salary,
  FIRST_VALUE(name) OVER (
    PARTITION BY dept_id ORDER BY salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS top_earner_in_dept
FROM employees;
```

Every row now carries its department's top earner's name — compare `salary` against the top in the same row, no join needed. `FIRST_VALUE` is safe with any frame because "first" never moves.

> [!WARNING]
> **`LAST_VALUE` needs the full frame.** With the default frame (start → current row), the "last" row of the frame *is* the current row, so `LAST_VALUE` just returns your own value — a famous gotcha. Always give `LAST_VALUE` the full frame: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. For "value at the other end", many people prefer `FIRST_VALUE(...) OVER (... ORDER BY x DESC)` — same result, no trap.

### Window function vs GROUP BY — when which

| Question shape | Tool |
|---|---|
| "One summary row per department" | `GROUP BY` |
| "Each employee, plus their rank / dept average / previous row" | Window function |
| "Top 3 per group, keeping all columns" | Window + outer filter |
| "Compare each row with the row before/after" | `LAG` / `LEAD` |
| "Running / cumulative total" | `SUM() OVER (... ROWS BETWEEN ...)` |

> [!NOTE]
> **One-line interview answer:** "Window functions compute across related rows without collapsing them — `PARTITION BY` defines the group, `ORDER BY` the sequence inside it, and the frame (`ROWS BETWEEN ...`) defines exactly which rows each calculation can see."

> [!NOTE]
> **30-second interview answer:** "`LAG` and `LEAD` peek at neighbouring rows, so month-over-month growth is `revenue - LAG(revenue) OVER (ORDER BY month)` in one pass. A running total is `SUM(x) OVER (ORDER BY d ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` — the frame says which rows feed each sum, and `PARTITION BY` restarts it per group. `NTILE(4)` buckets rows into quartiles, and `FIRST_VALUE` stamps a group's top value onto every row. I always write the frame explicitly, because the default `RANGE` frame treats ORDER BY ties as one step."

## 🧩 10. CTEs & Recursive Queries

A **CTE** (Common Table Expression) is a named, temporary result set you define with `WITH` at the top of a query, then use like a table. It doesn't make anything faster by magic — it makes the query *readable in the order you think*.

### The basic shape

```sql
WITH high_earners AS (
  SELECT id, name, dept_id, salary
  FROM employees
  WHERE salary > 80000
)
SELECT * FROM high_earners
WHERE dept_id = 10;
```

Read it top to bottom: "First, define high earners. Then, filter them." Compare that with the nested-subquery version, which you have to read inside-out. Same result — very different debugging experience at 2 AM.

### Multi-step pipelines — where CTEs earn their keep

Mental model: each CTE is one step on a conveyor belt. Later CTEs can use earlier ones.

```sql
WITH dept_totals AS (
  -- Step 1: one row per department
  SELECT dept_id, COUNT(*) AS headcount, SUM(salary) AS total_salary
  FROM employees
  GROUP BY dept_id
),
dept_avg AS (
  -- Step 2: reuse step 1
  SELECT dept_id, headcount, total_salary,
         total_salary / headcount AS avg_salary
  FROM dept_totals
),
big_depts AS (
  -- Step 3: filter step 2
  SELECT dept_id, avg_salary
  FROM dept_avg
  WHERE headcount >= 5
)
-- Step 4: present it nicely
SELECT d.dept_name, b.avg_salary
FROM big_depts b
JOIN departments d ON d.id = b.dept_id
ORDER BY b.avg_salary DESC;
```

| Habit | Why it wins interviews |
|---|---|
| One job per CTE | Each step is checkable in isolation |
| Name steps like English | `high_earners`, not `cte1` |
| Filter early inside a CTE | Later steps carry fewer rows |
| Final SELECT only joins + presents | The thinking already happened above |

🎤 What the interviewer actually asks: "This query has three nested subqueries — clean it up." — Rewrite as a `WITH` pipeline, one named step at a time.

> [!TIP]
> **Debugging trick:** run the query with only the first CTE defined and `SELECT * FROM step_one`. Then add one step at a time. A CTE pipeline is debuggable in slices; a nested subquery is an onion you cry over.

### Recursive CTEs — querying a tree

Org charts, category trees, folder structures — data where a row points at its *parent* row (`manager_id`). A plain join gets you one level. A recursive CTE walks *all* levels.

It always has three parts:

1. **Anchor member** — the starting rows (the top of the tree), a normal `SELECT`.
2. `UNION ALL` — the glue.
3. **Recursive member** — a `SELECT` that joins the table back to the CTE itself, finding the *next* level. It stops when it finds no more rows.

```sql
-- employees(id, name, manager_id) — CEO has manager_id NULL
WITH RECURSIVE org AS (
  -- 1. Anchor: the CEO
  SELECT id, name, manager_id, 0 AS level
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- 3. Recursive: everyone who reports to someone already found
  SELECT e.id, e.name, e.manager_id, o.level + 1
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT * FROM org ORDER BY level, name;
```

Trace it on a tiny company — CEO Asha, managers Bala and Chitra under her, Dev and Esha under Bala:

| Round | What the recursive member finds |
|---|---|
| Anchor | Asha (level 0) |
| Round 1 | Bala, Chitra (level 1) — their manager Asha is now in `org` |
| Round 2 | Dev, Esha (level 2) — their manager Bala is in `org` |
| Round 3 | Nobody new → recursion stops |

Final result:

| id | name | manager_id | level |
|---|---|---|---|
| 1 | Asha | NULL | 0 |
| 2 | Bala | 1 | 1 |
| 3 | Chitra | 1 | 1 |
| 4 | Dev | 2 | 2 |
| 5 | Esha | 2 | 2 |

### Worked example — print the tree with indentation and path

Two classic upgrades: build the full reporting path, and indent by level.

```sql
WITH RECURSIVE org AS (
  SELECT id, name, manager_id, 0 AS level,
         CAST(name AS CHAR(1000)) AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  SELECT e.id, e.name, e.manager_id, o.level + 1,
         CONCAT(o.path, ' > ', e.name)
  FROM employees e
  JOIN org o ON e.manager_id = o.id
)
SELECT CONCAT(REPEAT('  ', level), name) AS org_chart, path
FROM org
ORDER BY path;
```

```
Asha
  Bala
    Dev
    Esha
  Chitra
```

The same pattern fits a category tree (`categories(id, name, parent_id)`): anchor on `parent_id IS NULL`, recurse on children. One shape, many costumes.

> [!WARNING]
> **Infinite recursion:** if the data has a cycle (A's manager is B, B's manager is A), the recursive member never runs dry. MySQL stops at `cte_max_recursion_depth` (default 1000) and errors. PostgreSQL behaves similarly. When you write one, add a depth guard while testing: `WHERE o.level < 20` inside the recursive member.

> [!NOTE]
> **One-line interview answer:** "A CTE names one step of a query so the final SELECT reads top-to-bottom; a recursive CTE adds a self-joining second SELECT that walks a parent–child tree level by level until no new rows appear."

> [!NOTE]
> **30-second interview answer:** "I use CTEs to turn nested subqueries into a named pipeline — define one step, reuse it in the next, and debug by running each step alone. Recursive CTEs handle trees like org charts: an anchor SELECT picks the root, `UNION ALL` glues on a recursive SELECT that joins the table back to the CTE on `manager_id = id`, adding one level per round until nothing new matches. The same pattern prints indented trees and full paths with a little `CONCAT` work."

## 🔍 11. Why a Query Ignores Your Index

You created the index. The query is still slow. This is the most practical chapter in this guide — interviewers at product companies ask it verbatim: *"The index exists, so why is MySQL not using it?"*

Usually the answer is one of five reasons.

### Reason 1 — Selectivity: the index doesn't narrow anything

An index helps when the condition *throws away most rows*. If `WHERE is_active = 1` matches 95% of the table, walking the index and then fetching 95% of the rows is *more* work than one full scan — so the optimiser skips the index **on purpose**. It's right to.

Rule of thumb: index conditions that select a small slice. Status flags, booleans, and gender columns are usually poor indexes on their own (but useful as part of a composite — see below).

### Reason 2 — Composite indexes and the leftmost prefix rule

A composite index on `(dept_id, salary)` is sorted first by `dept_id`, then by `salary` within each department — like a phone book sorted by last name, then first name.

```sql
CREATE INDEX idx_dept_salary ON employees(dept_id, salary);
```

| Query filter | Uses the index? | Why |
|---|---|---|
| `WHERE dept_id = 10` | ✅ Yes | Leftmost column present |
| `WHERE dept_id = 10 AND salary > 80000` | ✅ Yes, fully | Both columns, in order |
| `WHERE salary > 80000` | ❌ No | Skips `dept_id` — phone book can't help by first name alone |
| `WHERE dept_id = 10 AND salary > 80000 ORDER BY salary` | ✅ Bonus | Index order already *is* salary order inside the dept |

🎤 What the interviewer actually asks: "Index on `(a, b, c)` — will `WHERE b = ? AND c = ?` use it?" — No. Leftmost column `a` is missing, so the sorted order is unusable.

### Reason 3 — A function wrapped around the column

```sql
-- ❌ Index on join_date is useless here
SELECT * FROM employees WHERE YEAR(join_date) = 2026;

-- ✅ Rewrite so the bare column is compared to a range
SELECT * FROM employees
WHERE join_date >= '2026-01-01' AND join_date < '2027-01-01';
```

The index is sorted by `join_date`, not by `YEAR(join_date)`. Wrapping the column in a function means the database must compute the function on *every row* to check it — that's a full scan wearing a costume. Same trap: `LOWER(name) = 'ayushi'`, `salary + 1000 > 50000`, `DATE(created_at) = '2026-10-03'`. Always move the maths to the *other* side of the comparison.

### Reason 4 — LIKE with a leading wildcard

```sql
WHERE name LIKE 'Ay%'    -- ✅ can use index (sorted names, find the 'Ay' range)
WHERE name LIKE '%yushi' -- ❌ cannot (names aren't sorted by their endings)
```

A B-tree is sorted left to right. `'%yushi'` says "I don't know how it starts" — there's no sorted order to search, so it's a scan. (Real fix for suffix search is a different tool — full-text index or a trigram index — worth naming in an interview.)

### Reason 5 — Implicit type conversion

```sql
-- phone column is VARCHAR, but you compared a number:
SELECT * FROM users WHERE phone = 9876543210;   -- ❌
SELECT * FROM users WHERE phone = '9876543210'; -- ✅
```

Comparing a string column to a number forces the database to convert the *column* value row by row (in MySQL, string-to-number conversion happens on the column side) — and a converted column can't use its index. The fix is embarrassingly small: quote the literal so the types match.

### Reading EXPLAIN — the 30-second version

`EXPLAIN SELECT ...` shows *how* the database plans to run your query. Four fields carry most of the information:

```sql
EXPLAIN SELECT name FROM employees WHERE dept_id = 10;
```

| Field | What to check |
|---|---|
| `type` | Access method. From best to worst: `const` → `eq_ref` → `ref` → `range` → `index` → `ALL`. **`ALL` = full table scan** — the red flag. `ref`/`range` = index is being used. |
| `key` | Which index was actually chosen (`NULL` = none). |
| `rows` | Estimated rows examined per step. Watch this number drop after a fix. |
| `Extra` | `Using index` = covering index (good). `Using filesort` = extra sort pass. `Using temporary` = temp table for grouping (often worth a look). |

```text
-- Before:  type: ALL,  key: NULL,        rows: 500000
-- After:   type: ref,  key: idx_dept_id, rows: 42
```

That before/after pair *is* the answer to "how did you optimise it?" — you made `type` leave `ALL` and `rows` collapse.

> [!WARNING]
> **`EXPLAIN` shows estimates, not a stopwatch.** The optimiser guesses row counts from statistics; stale statistics can mean bad plans. Judge the fix by both the plan *and* the actual runtime.

### Putting it together — a 3-minute drill

Watch the five reasons work in sequence on one table. `employees(id, name, dept_id, salary, join_date, is_active)`, ~500,000 rows, indexes on `id` (PK) and `join_date`.

```sql
EXPLAIN SELECT name FROM employees
WHERE is_active = 1 AND YEAR(join_date) = 2026;
```

```text
type: ALL, key: NULL, rows: 500000, Extra: Using where
```

Two reasons are stacked: `YEAR()` hides the `join_date` index (reason 3), and `is_active = 1` matches 95% of rows so it wouldn't help anyway (reason 1). Peel them off one at a time:

```sql
-- Fix the function first (reason 3), keep the low-selectivity flag:
EXPLAIN SELECT name FROM employees
WHERE is_active = 1
  AND join_date >= '2026-01-01' AND join_date < '2027-01-01';
-- type: range, key: idx on join_date, rows: ~40,000 — the range now seeks.
```

```sql
-- Now check selectivity (reason 1): how many rows does each side really cut?
SELECT COUNT(*) FROM employees WHERE is_active = 1;                    -- ~475,000 (useless alone)
SELECT COUNT(*) FROM employees
WHERE join_date >= '2026-01-01' AND join_date < '2027-01-01';          -- ~40,000 (the real filter)
```

The lesson to say out loud: *"I fix function-wrapped columns by rewriting to ranges, and I check selectivity with a quick COUNT before blaming the index — sometimes the optimiser is right and the condition is just weak."*

### Quick-fire checks to run before blaming the database

| Check | Command / question |
|---|---|
| Is the index really there? | `SHOW INDEX FROM employees;` |
| Did the optimiser pick it? | `EXPLAIN ...` → is `key` NULL? |
| How selective is my filter? | `SELECT COUNT(*) ... WHERE <condition>` vs total rows |
| Is a function wrapping the column? | Scan the WHERE for `YEAR(`, `LOWER(`, `DATE(`, arithmetic on the column |
| Do the types match? | VARCHAR column vs unquoted number literal |

> [!NOTE]
> **One-line interview answer:** "An index gets ignored when it doesn't help — low selectivity, a missing leftmost column, a function wrapped around the column, a leading-wildcard LIKE, or a type mismatch that forces conversion. I confirm with EXPLAIN: `type: ALL` with `key: NULL` means the scan is real."

> [!NOTE]
> **30-second interview answer:** "First I check selectivity — an index matching 95% of rows is worse than a scan, so the optimiser ignoring it can be correct. Then the usual suspects: for composite indexes the leftmost column must be present; wrapping the column in a function like `YEAR(join_date)` makes the sorted index unusable, so I rewrite to a bare-column range; `LIKE '%x'` can't use a left-to-right B-tree; and comparing a VARCHAR column to a number forces per-row conversion. I read EXPLAIN for `type` (ALL is the red flag), `key`, estimated `rows`, and `Extra`."

## 🔒 12. Transactions & Locks in Practice

Chapter 6B covered ACID — the promises. This chapter is what those promises look like when *two* transactions run at the same time and start stepping on each other.

### Isolation levels — pick your poison

The weaker the isolation, the faster the system runs — and the stranger the things you can see mid-flight. Three classic anomalies:

- **Dirty read** — you read a value another transaction wrote but hasn't committed yet. It might roll back. You read a ghost.
- **Non-repeatable read** — you read the same row twice in one transaction and get *different* values, because someone committed an update in between.
- **Phantom read** — you run the same *range* query twice and a new row appears (someone inserted a row matching your WHERE). The row wasn't changed — it *arrived*.

| Isolation level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ UNCOMMITTED | ❌ possible | ❌ possible | ❌ possible |
| READ COMMITTED | ✅ prevented | ❌ possible | ❌ possible |
| REPEATABLE READ | ✅ prevented | ✅ prevented | mostly prevented* |
| SERIALIZABLE | ✅ prevented | ✅ prevented | ✅ prevented |

*MySQL's REPEATABLE READ also blocks phantoms in most real cases using gap locks — a detail worth mentioning, not memorising.

Defaults worth knowing: MySQL/InnoDB defaults to **REPEATABLE READ**; PostgreSQL defaults to **READ COMMITTED**. SERIALIZABLE is the safest and the slowest — transactions effectively queue up.

🎤 What the interviewer actually asks: "What isolation level would you use for a bank balance read inside a transfer?" — High enough that the balance can't change under you mid-transaction (REPEATABLE READ or SERIALIZABLE), and say *why*: you can't afford a non-repeatable read between checking and debiting.

### SELECT ... FOR UPDATE — "this row is mine for now"

Reading a row normally doesn't stop anyone else. `FOR UPDATE` takes a write lock on the rows you read, so the next transaction that wants them *waits* until you commit or roll back.

```sql
BEGIN;
-- Lock the account row while we check and debit it
SELECT balance FROM accounts WHERE id = 'A' FOR UPDATE;
-- balance is 2000; nobody else can update this row until we finish
UPDATE accounts SET balance = balance - 500 WHERE id = 'A';
COMMIT;  -- lock released here
```

The pattern is "read it locked, decide, update, commit" — it closes the gap where two transfers both read ₹2,000 and both happily debit. Use it inside a transaction, on as few rows as possible, and keep the transaction short: every millisecond you hold a lock, someone else is standing in a queue.

> [!WARNING]
> **`FOR UPDATE` outside a transaction does nothing useful** — with autocommit on, the lock is released the instant the SELECT finishes. And a vague `WHERE` (or no index on it) can lock far more rows than you intended — in the worst case, effectively the table. Lock narrow, commit fast.

### Lock waits — the traffic jam

If transaction T1 holds a lock and T2 asks for the same row, T2 *waits*. Waits chain: T2 holds row X while waiting for T1's row Y, and now T3 waits behind T2. The database will eventually time out a waiter (`lock wait timeout`) rather than wait forever — the user sees a slow-then-failed request, not a hang. The usual real-world causes: a long transaction holding locks (a report query inside a transaction, a developer's forgotten `BEGIN`), or an update with no index scanning and locking half the table.

### Deadlocks — the circular wait

A deadlock is a wait that can *never* resolve:

1. T1 locks account A, then reaches for account B.
2. At the same moment, T2 locks account B, then reaches for account A.
3. T1 waits for T2. T2 waits for T1. Neither can ever move.

```text
T1:  lock A ──► waits for B
                ▲          │
                └──────────┘
T2:  lock B ──► waits for A
```

The good news: databases detect this. InnoDB spots the cycle, picks one transaction as the victim, and rolls it back with a deadlock error. The application should **catch that error and retry the whole transaction** — a deadlock is normal under load, not a five-alarm fire.

Prevention beats detection:

| Habit | Why it works |
|---|---|
| Always lock rows in the **same order** (e.g. by id ASC) | Cycles need opposite orders; one global order makes circles impossible |
| Keep transactions short | Less time holding locks = smaller collision window |
| Touch fewer rows (use indexes) | Fewer locks held, fewer chances to collide |
| Retry on deadlock error | The database already picked a victim; just rerun that transaction |

### A lock-wait story — the forgotten BEGIN

A developer opens a MySQL session at 11:00, runs `BEGIN`, updates one account row… and goes to lunch. Autocommit is off, so the row lock just sits there. At 11:20 the payment service tries to debit that same account:

1. Payment transaction runs `SELECT ... FOR UPDATE` on the account → **waits**.
2. Its connection pool slowly fills with more waiting requests for the same hot rows.
3. After the lock-wait timeout (often ~50 s), requests start failing with a timeout error.
4. The fix is embarrassingly human: the developer commits at 12:05 and the "outage" evaporates.

Say the lesson plainly: *"Most lock waits I have seen are not exotic — they are a long or forgotten transaction holding locks. That's why I keep transactions short and never leave one open across a user think-time or an API call."*

### FOR UPDATE variants worth one sentence each

| Clause | Behaviour |
|---|---|
| `SELECT ... FOR UPDATE` | Lock matching rows for update; others wait |
| `SELECT ... FOR SHARE` (MySQL 8) / `LOCK IN SHARE MODE` | Shared lock — others may read-lock too, nobody may write |
| `... FOR UPDATE NOWAIT` | Error immediately instead of queueing if locked |
| `... FOR UPDATE SKIP LOCKED` | Skip locked rows entirely — perfect for job-queue workers |

`SKIP LOCKED` is the modern queue pattern: ten workers each grab the next *unlocked* pending job row, process it, and mark it done — no queue table drama, no two workers ever fighting over the same row:

```sql
BEGIN;
SELECT id, payload FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 1
FOR UPDATE SKIP LOCKED;
-- process the job…
UPDATE jobs SET status = 'done' WHERE id = ?;
COMMIT;
```

> [!TIP]
> If an interviewer asks "how do multiple workers safely pull from a jobs table?", `FOR UPDATE SKIP LOCKED` is the answer that sounds like you have actually built one.

> [!WARNING]
> **The gap-lock surprise:** under MySQL's default REPEATABLE READ, a range `SELECT ... FOR UPDATE` can also lock the *gaps* between rows — so another transaction can't even INSERT a new row inside your range, not just update existing ones. It's phantom protection doing its job, but it widens what you hold. If a "can't insert" mystery appears under load, this is the first suspect to name.

> [!NOTE]
> **One-line interview answer:** "Isolation levels trade speed for safety — weaker levels allow dirty, non-repeatable, and phantom reads. `SELECT ... FOR UPDATE` locks rows until commit, and deadlocks are circular lock waits the database breaks by rolling back one transaction; consistent lock ordering prevents them."

> [!NOTE]
> **30-second interview answer:** "Dirty reads see uncommitted data, non-repeatable reads see a row change between two reads, and phantom reads see new rows appear in a range — READ COMMITTED blocks only the first, REPEATABLE READ blocks the first two, SERIALIZABLE blocks all three at the cost of speed. For check-then-update flows I read with `SELECT ... FOR UPDATE` inside a short transaction to lock just those rows. Deadlocks happen when two transactions lock rows in opposite orders; the database detects the cycle and rolls one back, so the app retries — and locking in a consistent order stops it forming at all."

## 🐌 13. Fixing a Slow Query, Step by Step

Theory is done. Here's one realistic rescue, narrated in the order you'd actually do it — this doubles as your template for the interview question *"Tell me about a slow query you fixed."*

### The report that took 6 seconds

A support dashboard runs this every page load. `orders` has ~500,000 rows, `customers` ~80,000.

```sql
-- ❌ The slow version
SELECT *
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE YEAR(o.order_date) = 2026
  AND LOWER(c.city) = 'delhi'
ORDER BY o.order_date DESC;
```

It returns ~40,000 rows and takes 6 seconds. Let's fix it in stages.

### Step 1 — Measure: EXPLAIN before touching anything

```sql
EXPLAIN SELECT * FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE YEAR(o.order_date) = 2026 AND LOWER(c.city) = 'delhi'
ORDER BY o.order_date DESC;
```

```text
orders:    type: ALL,  key: NULL, rows: 500000, Extra: Using filesort
customers: type: eq_ref, key: PRIMARY, rows: 1
```

Diagnosis in plain words: `orders` gets a **full table scan** (`type: ALL`), then a **filesort** to order half a million rows — because `YEAR(order_date)` makes any date index invisible, exactly the chapter-11 trap. The join itself is fine (`eq_ref` on the primary key).

### Step 2 — Rewrite: bare columns, real ranges

```sql
SELECT *
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.order_date >= '2026-01-01' AND o.order_date < '2027-01-01'
  AND c.city = 'Delhi'
ORDER BY o.order_date DESC;
```

Two changes, both from chapter 11: the function came off `order_date` (now a plain range the index can seek into), and `LOWER(c.city)` became a direct comparison — store city consistently, or compare against the stored form. City data should be cleaned once at write time, not lowered per-row per-query forever.

### Step 3 — Index what the query actually does

The query filters `orders` by date range and sorts by the same column. One index serves both:

```sql
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_customers_city ON customers(city);
```

Re-run EXPLAIN:

```text
orders:    type: range, key: idx_orders_date, rows: 62000, Extra: (no filesort!)
customers: type: eq_ref, key: PRIMARY, rows: 1
```

`type` moved from `ALL` to `range`, rows examined fell from 500,000 to ~62,000, and the filesort vanished — rows now come out of the index already in date order. **~900 ms.** Better. Keep going.

### Step 4 — Stop fetching what you don't show

`SELECT *` drags every column of both tables across the wire — including a `notes` blob nobody renders. The dashboard shows six fields. Ask for six fields:

```sql
SELECT o.id, o.amount, o.order_date, c.name, c.city, c.email
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.order_date >= '2026-01-01' AND o.order_date < '2027-01-01'
  AND c.city = 'Delhi'
ORDER BY o.order_date DESC;
```

### Step 5 — Cover the query so it never touches the table

If the index itself contains every column the query needs from `orders`, the database answers from the index alone (`Extra: Using index`) and never fetches full rows:

```sql
-- Drop the old one; this wider index covers filter + sort + selected columns
DROP INDEX idx_orders_date ON orders;
CREATE INDEX idx_orders_cover ON orders(order_date, customer_id, amount);
```

```text
orders: type: range, key: idx_orders_cover, rows: 62000, Extra: Using index
```

**~120 ms.** One last honest question: does a dashboard need all 40,000 rows on screen? Add pagination (`LIMIT 50`) and you're at **~15 ms**. Knowing when *not* to fetch is also optimisation.

### The before/after story

| Stage | Change | Time | EXPLAIN signal |
|---|---|---|---|
| Original | `YEAR()` + `LOWER()` + `SELECT *` | 6,000 ms | `type: ALL`, filesort, 500k rows |
| Rewrite | Range on bare column, clean comparison | 3,800 ms | Still `ALL` — no usable index yet |
| Index | `idx_orders_date`, `idx_customers_city` | 900 ms | `type: range`, no filesort, 62k rows |
| Slim select | Only the 6 displayed columns | 400 ms | Less data moved per row |
| Covering index | `(order_date, customer_id, amount)` | 120 ms | `Extra: Using index` |
| Paginate | `LIMIT 50` | ~15 ms | Same plan, 50 rows returned |

> [!TIP]
> **Say the sequence out loud in interviews:** "EXPLAIN first — I found `type: ALL` with a filesort. The `YEAR()` wrapper was hiding the index, so I rewrote it as a date range, added an index on the filtered/sorted column, trimmed `SELECT *` to the displayed columns, and made it a covering index. Six seconds became ~120 ms, ~15 ms paginated." Diagnosis → evidence → fix → numbers. That's the whole genre.

> [!WARNING]
> **Don't index blind.** Each new index slows every insert into `orders`. On a write-heavy table, the covering index in step 5 is a deliberate trade — name it as one: "we paid a little write cost for a dashboard that runs 50× a day."

### What if it's still slow after all that?

Work the list in order — each step is cheaper to try than the next:

1. **Wrong rows estimated?** If EXPLAIN's `rows` is wildly off from reality, statistics may be stale — refresh them (`ANALYZE TABLE orders;`).
2. **Sorting a big result?** An `ORDER BY` on a column pair like `(city, order_date)` may want a composite index in exactly that order instead of filesorting.
3. **The join column types differ?** `orders.customer_id` as INT joining `customers.id` as BIGINT (or a string id) can force conversions per row — chapter 11's trap, join edition.
4. **Deep pagination?** `LIMIT 50 OFFSET 200000` reads and discards 200k rows. Keyset pagination (`WHERE id > last_seen_id ORDER BY id LIMIT 50`) stays fast at any depth.
5. **Still seconds?** The honest senior answer: precompute. A nightly summary table or a cache for a dashboard that tolerates slightly stale numbers beats heroic per-request SQL.

> [!NOTE]
> **30-second interview answer:** "I never guess — I run EXPLAIN and look for `type: ALL`. In this report, `YEAR(order_date)` defeated the date index and `SELECT *` dragged unused columns, so I rewrote the filter as a bare-column range, indexed `order_date`, selected only the displayed columns, and extended the index into a covering index until EXPLAIN showed `type: range` with `Using index`. Six seconds dropped to about 120 ms — and pagination took it to ~15 ms. The method is always: measure, rewrite, index, re-measure."

## 🏋️ 14. Hard Practice Set

Ten interview-grade queries. Same schema family as the 18 Practice Queries, harder teeth. Say each answer aloud before opening the solution.

`employees(id, name, dept_id, salary, manager_id)` · `departments(id, dept_name)` · `orders(id, employee_id, amount, order_date)` · `logins(user_id, login_date)`

**Q1. Third-highest distinct salary in each department.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT dept_id, salary
FROM (
  SELECT dept_id, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dr
  FROM (SELECT DISTINCT dept_id, salary FROM employees) s
) ranked
WHERE dr = 3;
```

Note the inner `DISTINCT` — ranking raw rows would count two people on the same salary as ranks 1 and 2. `DENSE_RANK` over distinct salaries asks the question that was actually meant: the third salary *level*.

</details>

**Q2. Employees who logged in on 3 or more consecutive days (streak detection).**
<details>
<summary>💡 Solution</summary>

```sql
SELECT DISTINCT user_id
FROM (
  SELECT user_id, login_date,
         DATE_SUB(login_date, INTERVAL
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY
         ) AS streak_group
  FROM (SELECT DISTINCT user_id, login_date FROM logins) d
) g
GROUP BY user_id, streak_group
HAVING COUNT(*) >= 3;
```

The trick: subtract the row number (in days) from the date. Consecutive dates collapse to the *same* `streak_group` value; a gap breaks it. Group, count, keep streaks of 3+.

</details>

**Q3. Median salary of all employees.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT AVG(salary) AS median_salary
FROM (
  SELECT salary,
         ROW_NUMBER() OVER (ORDER BY salary) AS rn,
         COUNT(*) OVER () AS total
  FROM employees
) ranked
WHERE rn IN (FLOOR((total + 1) / 2), FLOOR((total + 2) / 2));
```

Number every salary in order, then pick the middle row (odd count) or average the two middle rows (even count). The two `FLOOR` expressions elegantly return the same row twice when the count is odd.

</details>

**Q4. Monthly order counts pivoted — one column per month (Jan, Feb, Mar) for 2026.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT
  COUNT(CASE WHEN MONTH(order_date) = 1 THEN 1 END) AS jan,
  COUNT(CASE WHEN MONTH(order_date) = 2 THEN 1 END) AS feb,
  COUNT(CASE WHEN MONTH(order_date) = 3 THEN 1 END) AS mar
FROM orders
WHERE order_date >= '2026-01-01' AND order_date < '2026-04-01';
```

SQL has no real `PIVOT` in MySQL — the interview-grade idiom is conditional aggregation: a `CASE` that only "fires" for its month, wrapped in `COUNT`/`SUM`.

</details>

**Q5. Employees earning above their department's median salary.**
<details>
<summary>💡 Solution</summary>

```sql
WITH dept_median AS (
  SELECT dept_id, AVG(salary) AS median_salary
  FROM (
    SELECT dept_id, salary,
           ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary) AS rn,
           COUNT(*) OVER (PARTITION BY dept_id) AS total
    FROM employees
  ) r
  WHERE rn IN (FLOOR((total + 1) / 2), FLOOR((total + 2) / 2))
  GROUP BY dept_id
)
SELECT e.name, e.dept_id, e.salary, m.median_salary
FROM employees e
JOIN dept_median m ON m.dept_id = e.dept_id
WHERE e.salary > m.median_salary
ORDER BY e.dept_id, e.salary DESC;
```

Q3's median trick, once per department via `PARTITION BY`, packaged in a CTE (chapter 10) and joined back. Three chapters in one query — say so in the interview.

</details>

**Q6. Running total of order amounts, restarting every month.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT id, order_date, amount,
  SUM(amount) OVER (
    PARTITION BY DATE_FORMAT(order_date, '%Y-%m')
    ORDER BY order_date, id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total_this_month
FROM orders
ORDER BY order_date, id;
```

`PARTITION BY` the month expression and the running total resets on the 1st (chapter 9). Ties on `order_date` are broken by `id` so the total is deterministic.

</details>

**Q7. Top 2 earners per department, ties included.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT d.dept_name, e.name, e.salary
FROM (
  SELECT dept_id, name, salary,
         RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees
) e
JOIN departments d ON d.id = e.dept_id
WHERE e.rnk <= 2
ORDER BY d.dept_name, e.salary DESC;
```

`RANK`, not `ROW_NUMBER`: if two people tie for 2nd, both appear (chapter 6C's table is the whole explanation). If the interviewer wants *exactly* two people, swap in `ROW_NUMBER` and name the trade-off.

</details>

**Q8. Departments where the highest salary is at least double the lowest.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT d.dept_name, MIN(e.salary) AS lowest, MAX(e.salary) AS highest
FROM employees e
JOIN departments d ON d.id = e.dept_id
GROUP BY d.dept_name
HAVING MAX(e.salary) >= 2 * MIN(e.salary)
ORDER BY highest DESC;
```

Aggregate conditions live in `HAVING`, not `WHERE` (chapter 4) — both halves of the comparison are aggregates, so this is its natural home.

</details>

**Q9. Month-over-month revenue change, showing only months that grew.**
<details>
<summary>💡 Solution</summary>

```sql
WITH monthly AS (
  SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, SUM(amount) AS revenue
  FROM orders
  GROUP BY DATE_FORMAT(order_date, '%Y-%m')
),
with_prev AS (
  SELECT month, revenue,
         LAG(revenue) OVER (ORDER BY month) AS prev_revenue
  FROM monthly
)
SELECT month, revenue, prev_revenue,
       ROUND(100.0 * (revenue - prev_revenue) / prev_revenue, 1) AS growth_pct
FROM with_prev
WHERE prev_revenue IS NOT NULL AND revenue > prev_revenue
ORDER BY month;
```

Filtering on a window result can't happen in the same `WHERE` (chapter 6C), so `LAG` is computed in a CTE and filtered outside — the pipeline pattern from chapter 10 doing quiet work.

</details>

**Q10. Employees who earn more than every employee in department 20.**
<details>
<summary>💡 Solution</summary>

```sql
SELECT name, dept_id, salary
FROM employees
WHERE salary > (SELECT MAX(salary) FROM employees WHERE dept_id = 20)
ORDER BY salary DESC;
```

"Earn more than *every* X" always means "more than the MAX of X". (Standard SQL also spells it `> ALL (SELECT ...)`, which MySQL supports — the MAX version is the one interviewers reliably accept on a whiteboard.)

</details>

> [!TIP]
> **The meta-lesson of this set:** Q1, Q3, Q5, Q6, Q7, Q9 are all window functions wearing different costumes, and Q2 is a window function plus one clever subtraction. If you truly own chapters 6C and 9, most "hard SQL round" questions unfold into patterns you have already written.

> [!NOTE]
> **30-second interview answer:** "For hard SQL rounds I reach for a small kit: `DENSE_RANK` over distinct values for nth-highest-per-group, the row-number-minus-date trick to group consecutive-day streaks, `ROW_NUMBER` plus `COUNT(*) OVER ()` to pick median rows, conditional aggregation (`COUNT(CASE WHEN ...)`) to pivot, and window results wrapped in a CTE whenever I need to filter on them. Every one of those is a pattern, not a puzzle — recognise the shape, and the query writes itself."
