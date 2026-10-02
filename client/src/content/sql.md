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
