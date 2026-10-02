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

---

## ✍️ 10 Practice Queries

Schema for all 10 — say each answer aloud before opening the solution:
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


## 🧱 7. Normalization Recap

Normalization = storing each fact **once**, so data can't contradict itself.

| Form | One-line rule | Violation |
|---|---|---|
| **1NF** | Atomic values, no lists in a cell | `skills='Java, Python'` in one column |
| **2NF** | Non-key columns depend on the **whole** key | `product_name` in `order_items` depends only on `product_id` |
| **3NF** | No column depends on another non-key column | `dept_name` inside `employees` (depends on `dept_id`) |

> [!IMPORTANT]
> Normalization kills redundancy but costs JOINs. Real systems sometimes **denormalise** deliberately for read speed — name it as a trade-off, not a mistake.

## 🏷️ 8. Naming Trap: SQL vs MySQL

> [!WARNING]
> **SQL is a language; MySQL is a product.** SQL is the standard language for relational databases. MySQL, PostgreSQL, SQLite, SQL Server all *speak* SQL with small dialect differences (`LIMIT` vs `TOP`). "I know MySQL" = one dialect; the concepts transfer everywhere.

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
