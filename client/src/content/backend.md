# 🖥️ Backend (Node.js + Express + APIs + Databases) — Complete Interview Notes

> Welcome! This file covers everything a fresher needs for backend interviews — how the web works, Node.js, Express, REST APIs, authentication, databases, and deployment. Written in simple language, with code you can actually run and answers you can actually say. Perfect for final-year students and freshers preparing for MERN / full-stack interviews.

---

## 📌 1. How the Web Works (in 6 lines)

1. **Client** = the browser or app on the user's device. It asks for things.
2. **Server** = a computer that is always on, waiting for requests. It gives answers.
3. **Request** = the client asks: "Give me the list of products" (with a URL + method + maybe some data).
4. **Response** = the server replies with data + a status code ("200, here you go" or "404, not found").
5. **JSON** = the common language of this conversation — data written as `{ "name": "Ayushi", "role": "developer" }`.
6. **Backend** = everything on the server side: receiving requests, applying logic, talking to the database, sending responses.

> [!NOTE]
> **One-line interview answer:** "The client sends an HTTP request, the server processes it, talks to the database if needed, and sends back an HTTP response — usually JSON."

---

## 🧠 2. Node.js

### What is Node.js?

**Definition:** Node.js is a runtime that lets you run JavaScript *outside* the browser — on a server. It uses Chrome's **V8 engine** to convert JavaScript into machine code.

> [!IMPORTANT]
> Node.js is **not a language** and **not a framework**. JavaScript is the language, Node.js is the environment that runs it on a server, and Express is a framework built on top of Node.

### Single-threaded event loop

Node has **one main thread**. It does not create a new thread for every request. Instead, it uses an **event loop**: it starts a task, and while that task is waiting (for a file, a database, a network call), it moves on and handles other requests. When the waiting task finishes, its callback runs.

### Why non-blocking I/O matters

**I/O** = input/output operations like reading a file, querying a database, calling another API. These are slow (milliseconds to seconds). In a blocking model, the server would sit idle during every wait. In Node's **non-blocking** model, the wait happens in the background, so one server can handle thousands of requests cheaply.

### ⚠️ Sync vs Async file read — the classic trap

```js
const fs = require("fs");

// ❌ BLOCKING — the whole server freezes until the file is fully read
const data = fs.readFileSync("bigfile.txt", "utf8");
console.log(data);
console.log("This line waits...");
```

While `readFileSync` runs, Node can do **nothing else** — every other user's request is stuck in a queue. On a busy server, one sync call slows down *all* endpoints.

```js
const fs = require("fs");

// ✅ NON-BLOCKING — Node starts the read, then keeps serving other requests
fs.readFile("bigfile.txt", "utf8", (err, data) => {
  if (err) return console.error(err);
  console.log(data); // runs later, when the file is ready
});
console.log("This line runs immediately");
```

Output order: `This line runs immediately` prints **first**, then the file content.

> [!WARNING]
> **Interviewer trap:** "Is Node.js single-threaded?" — Answer: "The JavaScript execution is single-threaded via the event loop, but Node uses a thread pool (libuv) in the background for file system and some other operations. So my one sync `readFileSync` blocks the main thread, but async I/O doesn't."

---

## 📌 3. npm & package.json (in brief)

- **npm** (Node Package Manager) = the tool that downloads and manages libraries ("packages") for your project.
- **package.json** = your project's ID card: name, version, scripts, and the list of packages it needs.

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

| Thing | Meaning |
|---|---|
| `dependencies` | Packages your app needs **to run** (express, mongoose). Installed in production. |
| `devDependencies` | Packages needed **only while developing** (nodemon, testing tools). Skipped in production installs. |
| `scripts` | Shortcuts. `npm run dev` runs whatever command you wrote. `npm start` is special — no `run` needed. |
| `^4.18.2` | The `^` (caret) means: "this version or any newer **minor/patch** version that doesn't break things" — 4.x.x where x can grow, but never 5.0.0. |

> [!TIP]
> `npm install` reads package.json and downloads everything into the `node_modules` folder. You never upload `node_modules` to GitHub — it's huge and can be rebuilt anytime with `npm install`. That's why `.gitignore` always contains `node_modules`.

---

## 📌 4. Express

### What is Express?

**Definition:** Express is a minimal framework on top of Node.js that makes building servers and APIs easy — routing, middleware, and request/response handling without boilerplate.

```js
const express = require("express");
const app = express();

app.use(express.json()); // lets the server read JSON bodies from requests

app.get("/", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

- `app` = your whole server application.
- **Route** = a URL + method + the function that responds. `app.get("/users", ...)` means "when someone GETs /users, run this."
- `req` (request) = everything the client sent. `res` (response) = what you send back.

### Middleware — the heart of Express

**Definition:** Middleware is a function that sits **between** the request arriving and the final route handler. It can check, modify, or block the request, then pass it on.

Think of it as security-check counters at an airport: check-in → security → passport control → your gate (the route). Every counter can stop you or let you through.

```js
// A simple logger middleware
function logger(req, res, next) {
  console.log(req.method, req.url);
  next(); // ✅ "I'm done, go to the next step" — WITHOUT this, the request hangs forever
}

app.use(logger); // applies to every route below it
```

> [!IMPORTANT]
> **Order matters.** Middleware runs top-to-bottom, in the order you write `app.use(...)`. An auth middleware written *after* your routes will never protect them. Authentication/authorization middleware must come **before** the routes it protects.

> [!WARNING]
> **Interviewer trap:** "What happens if you forget `next()`?" — The request never reaches the route and never gets a response. The client just hangs until it times out. Every middleware must either call `next()` or end the response itself (`res.json(...)`, `res.status(...)`).

### Error-handling middleware

Normal middleware has 3 parameters `(req, res, next)`. **Error-handling middleware has 4** — that's how Express recognizes it:

```js
// Must be placed AFTER all routes
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});
```

When any route passes an error (`next(err)`) or throws inside an async handler (with a wrapper / Express 5), Express skips everything else and lands here. One central place = no repeated error code everywhere.

---

## 🌐 5. REST APIs

### What is REST?

**Definition:** REST (Representational State Transfer) is a set of conventions for designing APIs so they're predictable. The core idea: everything is a **resource** (a noun — users, products, orders), and you use standard HTTP methods to act on them.

### Resource naming rules

- ✅ Use nouns, plural: `/users`, `/products`, `/orders`
- ✅ Nest for relationships: `/users/5/orders` (orders belonging to user 5)
- ❌ Don't put verbs in the URL: ~~`/getUsers`~~, ~~`/deleteProduct`~~ — the HTTP method already says the action.

### The main methods

| Method | What it does | Example | Idempotent? |
|---|---|---|---|
| `GET` | Read data | `GET /users` — list all users | ✅ Yes |
| `POST` | Create new data | `POST /users` — create a user | ❌ No |
| `PUT` | Replace a whole resource | `PUT /users/5` — replace user 5 completely | ✅ Yes |
| `PATCH` | Update part of a resource | `PATCH /users/5` — change only the name | Not guaranteed |
| `DELETE` | Delete a resource | `DELETE /users/5` | ✅ Yes |

> [!NOTE]
> **Idempotency in one line each:** An operation is idempotent if doing it 1 time or 10 times gives the same final state. `DELETE /users/5` ten times = user 5 is gone (same result), so it's idempotent. `POST /users` ten times = 10 new users created, so it is **not** idempotent. `PUT` replaces the whole thing, so repeating it lands in the same state — idempotent. `GET` never changes anything, so it's idempotent (and "safe").

### How a request flows through your backend

```mermaid
flowchart LR
    A[Client<br/>Browser / App] -->|HTTP Request| B[Express App]
    B --> C[Middleware Chain<br/>logger → auth → validation]
    C --> D[Route<br/>e.g. GET /users/:id]
    D --> E[Controller<br/>business logic]
    E --> F[(Database<br/>MongoDB / SQL)]
    F -->|data| E
    E -->|HTTP Response<br/>JSON + status code| A
```

> [!TIP]
> **Interviewer gold:** Separating routes (where), controllers (what logic), and models (data shape) keeps the code clean and testable. If an interviewer asks "how do you structure your Express app?" — this diagram *is* the answer.

---

## 🔍 6. Request Anatomy — params vs query vs body vs headers

Every request carries data in up to 4 places. Mixing these up is the most common fresher mistake.

| Part | Where it lives | Used for | Example | In Express |
|---|---|---|---|---|
| **Route params** | In the URL path itself | Identifying *one specific* resource | `GET /users/42` | `req.params.id` → `"42"` |
| **Query string** | After `?` in the URL | Filtering, sorting, searching, pagination | `GET /products?category=shoes&page=2` | `req.query.category` → `"shoes"` |
| **Body** | Inside the request (not in URL) | Sending data to create/update | `POST /users` with `{"name":"Ayushi"}` | `req.body.name` (needs `express.json()`) |
| **Headers** | Metadata lines of the request | Auth tokens, content type, language | `Authorization: Bearer abc123` | `req.headers.authorization` |

```js
// GET /users/42?showOrders=true   with header  Authorization: Bearer xyz
app.get("/users/:id", (req, res) => {
  req.params.id;               // "42"        → WHICH user
  req.query.showOrders;        // "true"      → WHAT extra to include
  req.headers.authorization;   // "Bearer xyz" → WHO is asking (proof)
});

// POST /users  with body { "name": "Ayushi", "email": "a@b.com" }
app.post("/users", (req, res) => {
  req.body.name;               // "Ayushi"    → the DATA being created
});
```

> [!TIP]
> **Easy memory hook:** Params = *which one*, Query = *which many / how filtered*, Body = *the actual data*, Headers = *the envelope's labels* (who sent it, what format, the token stamp).

> [!WARNING]
> **Interviewer trap:** "Can a GET request have a body?" — Technically possible in raw HTTP, but it's against convention and many servers/proxies ignore it. Always use query params for GET data. Also: everything in `req.params` and `req.query` arrives as a **string** — convert with `Number(...)` before math or strict comparisons.

---

## 🔐 7. Authentication vs Authorization + JWT

### The two words everyone confuses

- **Authentication (AuthN)** = *Who are you?* Proving identity — login with email + password.
- **Authorization (AuthZ)** = *What are you allowed to do?* A logged-in student can't delete courses; an admin can. Identity first, permissions second.

> [!NOTE]
> **Memory hook:** Authenticatio**n** = **n**ame (who you are). Authorizatio**n** = **n**o-or-yes (what you may do). Login failing = 401. Logged in but not permitted = 403.

### JWT (JSON Web Token) — step by step

JWT is the most common way to keep a user "logged in" without the server remembering sessions.

**The flow:**
1. User logs in with email + password.
2. Server checks the password (see bcrypt below). If correct, the server creates a token and sends it to the client.
3. The client stores the token and sends it with every future request: `Authorization: Bearer <token>`.
4. The server verifies the token on each request. Valid → request proceeds. Invalid/expired → 401.

**Token structure — three parts joined by dots: `header.payload.signature`**

| Part | Contains | Example (decoded) |
|---|---|---|
| **Header** | The algorithm used | `{ "alg": "HS256", "typ": "JWT" }` |
| **Payload** | The claims — user id, role, expiry. ⚠️ Encoded, NOT encrypted — anyone can read it! | `{ "userId": "42", "role": "student", "exp": 1735689600 }` |
| **Signature** | Header + payload signed with a **secret key** only the server knows | Proves nobody tampered with the payload |

```js
const jwt = require("jsonwebtoken");

// 1️⃣ Create a token at login
const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

// 2️⃣ Verify it in auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // after "Bearer "
  if (!token) return res.status(401).json({ message: "No token, please log in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // now every route knows WHO is calling
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.get("/profile", auth, (req, res) => {
  res.json({ message: `Hello user ${req.user.userId}` });
});
```

> [!WARNING]
> **Interviewer traps, rapid-fire:**
> - "Can you hide a password inside a JWT payload?" — **Never.** The payload is just base64-encoded; anyone can decode and read it. Only put non-sensitive claims (id, role, expiry).
> - "Where do you store the token on the client?" — Two common answers: `localStorage` (simple, but readable by any JS on the page → XSS risk) or an **httpOnly cookie** (JS can't read it → safer from XSS, but needs CSRF care). Know both trade-offs.
> - "How do you log a user out with JWT?" — Honestly: JWTs are stateless, so the server can't easily cancel one before expiry. Common fixes: short expiry + refresh tokens, or a server-side blocklist. Saying this shows real understanding.

### Passwords — bcrypt, never plain text

**Rule: passwords are never stored as readable text. Ever.** If your database leaks, plain-text passwords compromise every user's every account.

**bcrypt** hashes passwords with a built-in random "salt":

```js
const bcrypt = require("bcrypt");

// At signup — hash before saving (10 = salt rounds, cost factor)
const hashedPassword = await bcrypt.hash(plainPassword, 10);
await User.create({ email, password: hashedPassword });

// At login — compare the typed password against the stored hash
const isMatch = await bcrypt.compare(typedPassword, user.password);
if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
```

Hashing is **one-way**: you can check a password, but you can never reverse a hash back into the password. The salt means two users with the same password still get different hashes.

---

## 🗄️ 8. Databases

### SQL vs NoSQL

| Feature | SQL (MySQL, PostgreSQL) | NoSQL (MongoDB) |
|---|---|---|
| Data stored as | Tables with rows & columns | Documents (JSON-like objects) in collections |
| Structure | Fixed schema — every row follows the same shape | Flexible schema — documents in one collection can differ |
| Relationships | Strong — JOINs connect tables | Stored inside documents or referenced by id |
| Scaling style | Vertical (bigger server) traditionally | Horizontal (more servers) traditionally |
| Best for | Banking, bookings, anything highly relational & consistent | Product catalogs, social feeds, rapidly changing data |
| Fresher one-liner | "Strict teacher — fixed timetable, everything linked." | "Flexible notebook — each page can look different." |

> [!NOTE]
> Neither is "better". Choose by data shape: heavy relationships + strict consistency → SQL. Flexible, document-shaped data + fast iteration → NoSQL. MERN uses MongoDB; many companies use PostgreSQL. Knowing both basics is the winning answer.

### MongoDB basics

- A **collection** = like a table (e.g., `users`). A **document** = like a row, but written as a JSON-like object.
- **Mongoose** = the library that lets Node talk to MongoDB with schemas and models.

```js
const mongoose = require("mongoose");

// Schema = the shape every user document should follow
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: Number,
});

const User = mongoose.model("User", userSchema);

// Create + read
await User.create({ name: "Ayushi", email: "a@b.com", age: 21 });
const users = await User.find({ age: { $gte: 18 } }); // age >= 18
```

### SQL basics — the three you must know

```sql
-- SELECT + WHERE: fetch specific columns, filtered
SELECT name, email FROM users WHERE age >= 18;

-- JOIN: combine two tables using a relationship (orders belong to users)
SELECT users.name, orders.product
FROM users
JOIN orders ON orders.user_id = users.id;
```

> [!WARNING]
> **Interviewer trap:** "What is a JOIN, simply?" — "It combines rows from two tables using a matching column — like matching `orders.user_id` with `users.id` to get the customer's name next to each order, instead of storing the name twice." Storing the same data twice is called duplication; databases avoid it via **normalization**.

---

## 🔑 9. Environment Variables & .env

**Definition:** Environment variables store configuration and secrets *outside* your code — database URLs, API keys, JWT secrets, ports.

```bash
# .env file (in project root)
PORT=3000
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/mydb
JWT_SECRET=some-long-random-secret
```

```js
require("dotenv").config(); // loads .env into process.env — put at the very top

const port = process.env.PORT;          // 3000
const secret = process.env.JWT_SECRET;  // your secret, not in code
```

> [!IMPORTANT]
> **Never commit `.env` to GitHub.** Add it to `.gitignore` from day one. Real-world leaks of API keys and database passwords on GitHub happen every single day — bots scan for them within minutes. Code gets shared; secrets must not.

> [!TIP]
> Commit a `.env.example` file instead — same variable names with empty/fake values — so other developers know what to set up. Interviewers love this small professional touch.

---

## 🌍 10. CORS in 3 lines

1. Browsers block a web page from one origin (say `localhost:5173`) from calling an API on a different origin (`localhost:3000`) — this safety rule is the **Same-Origin Policy**.
2. **CORS** (Cross-Origin Resource Sharing) is how the *server* gives permission: "Yes, that frontend is allowed to talk to me."
3. In Express, one line fixes it: `app.use(cors())` (from the `cors` package) — or `cors({ origin: "https://myfrontend.com" })` to allow only your real frontend.

> [!WARNING]
> **Interviewer trap:** "Is CORS a security feature of the server?" — No. CORS is enforced by the **browser** to protect users; it doesn't stop Postman or other servers from calling your API. Authentication is what actually protects your API.

---

## 🛡️ 11. Error Handling & Validation Basics

### try/catch — expect things to fail

Anything external can fail: database down, invalid id, network cut. Wrap risky code so one failure doesn't crash the whole server:

```js
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
```

### Never trust client input

Whatever the frontend sends can be faked — anyone can call your API with Postman and send anything. Always validate on the **server**:

```js
app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  // ✅ Validation BEFORE touching the database
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const user = await User.create({ name, email });
  res.status(201).json(user);
});
```

> [!IMPORTANT]
> Frontend validation is for user experience. Backend validation is for **security and data integrity**. An interviewer asking "where do you validate?" wants to hear: "Both — but the backend validation is the one that actually protects the system."

---

## 🚀 12. Deployment Basics (in brief)

- Your code runs wherever `npm start` runs — on your laptop it's `localhost`, in production it's a server (Render, Railway, AWS, etc.).
- Production servers assign their own port, so always read it from the environment: `app.listen(process.env.PORT || 3000)` — never hardcode 3000.
- **`npm run build`** (for frontend/full-stack builds) converts your code into optimized files; **`npm start`** runs the production server. Build creates the dish, start serves it.
- All secrets (DB URL, JWT secret) go into the hosting platform's environment-variable settings — never into the code or GitHub.
- After deploying, check the logs first when something fails: 90% of beginner deployment errors are a missing env variable or a wrong port.

---

## 🌐 HTTP Status Codes — Full Reference Table

Status codes are grouped by first digit: **2xx** = success, **4xx** = client's mistake, **5xx** = server's mistake.

| Code | Name | When to use it |
|---|---|---|
| **200** | OK | Successful GET, PUT, PATCH, or DELETE that returns data. The default happy answer. |
| **201** | Created | A POST successfully created something new (new user, new order). Return the created object with it. |
| **204** | No Content | Success, but there's nothing to send back — classic for DELETE. |
| **400** | Bad Request | Client sent invalid data — missing fields, wrong types, failed validation. |
| **401** | Unauthorized | Not logged in, or token missing/invalid/expired. Means: "I don't know who you are." |
| **403** | Forbidden | Logged in, but not allowed to do this (e.g., a student trying an admin action). Means: "I know who you are — no." |
| **404** | Not Found | The resource doesn't exist — wrong URL, or no user with that id. |
| **409** | Conflict | The request clashes with current state — e.g., signing up with an email that's already registered. |
| **500** | Internal Server Error | *Your* code broke — an unhandled exception, database down. Never the client's fault. |

> [!TIP]
> **401 vs 403 is asked in almost every interview series.** One line settles it: "401 = I don't know who you are (login first). 403 = I know who you are, and you're still not allowed."

---

## 🎤 Mock Interview Questions — Backend

**1. What exactly happens when I type a URL in the browser and press Enter?**
"The browser turns the domain into an IP address using DNS, opens a connection to that server, and sends an HTTP request. The server — in my case an Express app — processes it, talks to the database if needed, and sends back an HTTP response with a status code and usually JSON, which the browser then renders or uses."

**2. Is Node.js single-threaded? Then how does it handle many requests at once?**
"JavaScript execution in Node runs on one main thread with an event loop. When a request needs slow I/O — a file read or a database query — Node hands that wait to the background (libuv) and moves on to other requests. When the I/O finishes, the callback joins the queue and runs. That's why async code scales, and why one blocking call like `readFileSync` can freeze everything."

**3. What is middleware in Express? Give a real example.**
"Middleware is a function that runs between the request arriving and the route handler. It receives `req`, `res`, and `next`. I use it for logging every request, checking JWT tokens for authentication, and validating input. Calling `next()` passes control forward; forgetting it leaves the request hanging. Order matters — middleware runs in the order it's registered."

**4. GET vs POST — what's the difference?**
"GET only reads data and puts parameters in the URL as query strings, so it should never change anything on the server. POST sends data in the request body, usually to create something new. Also, POST is not idempotent — sending it twice creates two records, while repeating a GET changes nothing."

**5. What do 401 and 403 mean?**
"401 means the user isn't authenticated — no token, or an invalid or expired one; they need to log in. 403 means they *are* logged in but don't have permission for that action — like a normal user calling an admin-only route."

**6. How does JWT authentication work in your projects?**
"At login, after verifying the password with bcrypt, I sign a JWT containing the user id and role using a secret from my environment variables. The client sends it as `Authorization: Bearer <token>` on every request. My auth middleware verifies it — if it's valid, I attach the decoded user to `req` and continue; if not, I return 401. The token itself is just encoded, not encrypted, so I never put sensitive data in the payload."

**7. How do you store passwords safely?**
"Never in plain text. I hash them with bcrypt, which automatically adds a random salt, so even identical passwords produce different hashes. At login I use `bcrypt.compare` to check the entered password against the stored hash. Hashing is one-way, so even if the database leaks, the original passwords can't be recovered from it."

**8. SQL or NoSQL — how do you choose?**
"If the data is highly relational and needs strict consistency — like payments or bookings — I'd choose SQL with its fixed schema and JOINs. If the data is document-shaped, flexible, or changes shape often — like product catalogs or user content — I'd choose NoSQL like MongoDB. In my MERN projects I use MongoDB with Mongoose, but I can write basic SQL including JOINs when needed."

**9. What is CORS and why did you face it?**
"My frontend and backend run on different origins during development, and browsers block such cross-origin calls by default — that's the Same-Origin Policy. CORS is the server's way of saying which origins are allowed. I fix it with the `cors` package in Express, and in production I restrict it to my real frontend's domain instead of allowing everyone."

**10. What's the difference between authentication and authorization?**
"Authentication asks 'who are you?' — it's the login step. Authorization asks 'what can you do?' — it happens after login. For example, any logged-in user can view products (authorized for all users), but only an admin can delete them. In code, my auth middleware verifies the JWT first, then a role check handles authorization."

**11. What is the event loop, in simple words?**
"It's Node's system for juggling tasks on one thread. Synchronous code runs first; when an async operation like a database call is started, Node doesn't wait — it registers a callback and continues with other work. The event loop keeps checking: when the async work finishes, its callback gets a turn to run. That's how one thread serves thousands of requests."

**12. PUT vs PATCH?**
"PUT replaces the entire resource — I must send the complete object, and repeating it gives the same result, so it's idempotent. PATCH changes only the fields I send. If a client sends `{ "name": "New Name" }` with PATCH, only the name updates; with PUT, missing fields could be wiped or rejected."

**13. How do you handle errors in your Express APIs?**
"Every database call sits inside try/catch. Known problems get proper status codes — 400 for validation failures, 404 when a record doesn't exist — and unexpected errors return 500 with a generic message. I also use a central error-handling middleware with the four-argument signature `(err, req, res, next)` placed after all routes, so error responses stay consistent."

**14. What goes in your `.env` file, and what must never happen to it?**
"Secrets and configuration: the MongoDB connection URL, JWT secret, port, and any API keys. It must never be committed to GitHub — it goes in `.gitignore` immediately, because leaked keys get found by bots within minutes. Instead, I commit a `.env.example` with variable names and dummy values so other developers know what to configure."

**15. Your API works on your laptop but not after deployment. What do you check first?**
"Three things, in order: one, are all environment variables set on the hosting platform — a missing database URL is the most common cause. Two, is the app listening on `process.env.PORT` instead of a hardcoded port, because the host assigns its own port. Three, I read the deployment logs — the actual error is almost always printed right there."

---

## ✅ 60-Second Revision Checklist

- [ ] Web = client requests, server responds, usually JSON.
- [ ] Node.js = V8 runtime, single main thread + event loop; async I/O = non-blocking; `readFileSync` blocks **everyone**.
- [ ] `dependencies` run the app; `devDependencies` only help build it; `^` allows minor/patch updates.
- [ ] Middleware = functions in the middle; order matters; no `next()` = request hangs; 4 args `(err, req, res, next)` = error handler.
- [ ] REST = nouns for resources, HTTP methods for actions; GET/PUT/DELETE idempotent, POST is not.
- [ ] Params = which one, Query = filtering, Body = the data, Headers = the labels (auth token lives here).
- [ ] Authentication = who you are (401); Authorization = what you may do (403).
- [ ] JWT = header.payload.signature; payload is readable by anyone — no secrets inside; verify on every request.
- [ ] Passwords → bcrypt hash + salt, never plain text, never reversible.
- [ ] SQL = tables + JOINs + strict schema; NoSQL = documents + flexible schema. Pick by data shape.
- [ ] `.env` holds secrets; `.gitignore` it from day one; commit `.env.example` instead.
- [ ] CORS = the server permitting a different-origin frontend; enforced by the browser, fixed with the `cors` package.
- [ ] Validate on the backend — frontend validation is only for user experience.
- [ ] Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 login needed, 403 no permission, 404 missing, 409 conflict, 500 your fault.
- [ ] Deployment fails? Check env variables → the PORT → the logs, in that order.

> [!NOTE]
> 📚 **By Ayushi Singh** — part of the *Full-Stack Interview Notes* series. If these notes helped you, star the repo and share it with a friend who's also preparing. Good luck with your interview — you've got this! 🚀
