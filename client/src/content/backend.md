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

### A request's full journey, step by step

Say a user clicks "Show my orders" in your app. Here is everything that happens before the list appears:

1. The browser looks at the URL and uses DNS to turn the domain name into the server's IP address — a name becomes a street address.
2. The browser opens a connection to that server (with HTTPS, it also sets up encryption) and sends the HTTP request: method, path, headers, and sometimes a body. Example: `GET /orders` with the login token in the `Authorization` header.
3. Your Express app receives the request. Before any route sees it, the middleware chain runs — logging, JSON parsing, token verification (Sections 4 and 7).
4. The router matches method + path to a handler, like `GET /orders`. Route params and query values are pulled out of the URL here.
5. The handler (controller) runs your logic: "is this user allowed to see these orders? which user's orders are these?"
6. If data is needed, the server queries the database and waits — asynchronously, so other requests keep flowing (Section 2).
7. The database returns rows or documents. The controller shapes them into clean JSON, picking what the client may see (never the password hash).
8. The server sends the HTTP response: a status code plus the JSON body, for example `200` with the orders array.
9. The browser receives it. Your frontend code reads the JSON and updates the page. If the status was 401 or 500 instead, the frontend shows a login prompt or an error message.

> [!WARNING]
> **Common mistake:** describing this backwards — "the server sends the page to the user." The server never pushes anything on its own here; it only *answers*. Every step above starts because the client asked. That one correction makes the whole client-server model click.


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


```playground Playground: sync block vs async
// Watch the timestamps: the async callback waits its turn, the sync loop does not.
const start = Date.now();
const stamp = (label) => console.log(label, "at", Date.now() - start, "ms");

stamp("1. start");

setTimeout(() => stamp("2. async timer finished"), 0);

// TODO: write a heavy sync loop here (e.g. add up numbers from 1 to a few hundred million)
// then call stamp("3. heavy loop done") right after it.
// Predict BEFORE running: does line 2 or line 3 print first? Why?

stamp("4. end of script");
```


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


### Tracing one request through the middleware chain

Middleware is easiest to see as the `req` object slowly collecting luggage. Watch `GET /profile` travel through a typical chain:

| Step | Middleware | What it does to `req` | If it fails |
|---|---|---|---|
| Request arrives | — | `req` has method, URL, headers. Body is still raw text | — |
| Body parser (`express.json()`) | Parses the JSON text | `req.body` becomes a real object you can read | Bad JSON → error jumps to the error handler |
| Logger | Just observes | Nothing changes; it prints `GET /profile` and calls `next()` | — |
| Auth check | Verifies the token | On success it adds `req.user = { userId: "42", role: "student" }` | No/invalid token → responds 401 itself, chain stops |
| Route handler | Uses everything collected | Reads `req.user.userId`, fetches that user, sends the response | Handler throws → error handler |

Two lessons hide in this table. The route handler works *because* earlier middleware prepared `req` for it — and a middleware that responds (like auth returning 401) ends the journey; `next()` is never called, so nothing later runs.

> [!WARNING]
> **Common mistake:** putting the auth middleware *after* the routes it should protect, or adding it to only some routes and forgetting the rest. Express runs exactly what you registered, in order — protection that sits below a route never sees that route's requests at all.

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


```playground Playground: build a middleware chain
// A tiny fake Express: middlewares are functions (req, res, next). Run them in order.
const middlewares = [];
const use = (fn) => middlewares.push(fn);

function run(req) {
  const res = { sent: null, json(data) { this.sent = data; } };
  let index = 0;
  const next = () => {
    const fn = middlewares[index++];
    if (fn) fn(req, res, next);
  };
  next();
  return res.sent;
}

use((req, res, next) => { console.log("logger:", req.method, req.url); next(); });
use((req, res, next) => { req.requestTime = Date.now(); next(); });
// TODO: add an auth middleware — if req.headers.token is missing,
// call res.json({ error: "no token" }) and do NOT call next().
// Otherwise set req.user = "ayushi" and call next().
use((req, res, next) => { res.json({ hello: req.user || "stranger" }); });

console.log(run({ method: "GET", url: "/profile", headers: {} }));
console.log(run({ method: "GET", url: "/profile", headers: { token: "abc" } }));
```


---

## 🌐 5. REST APIs

### What is REST?

**Definition:** REST (Representational State Transfer) is a set of conventions for designing APIs so they're predictable. The core idea: everything is a **resource** (a noun — users, products, orders), and you use standard HTTP methods to act on them.

### Resource naming rules

- ✅ Use nouns, plural: `/users`, `/products`, `/orders`
- ✅ Nest for relationships: `/users/5/orders` (orders belonging to user 5)
- ❌ Don't put verbs in the URL: ~~`/getUsers`~~, ~~`/deleteProduct`~~ — the HTTP method already says the action.


### REST design walkthrough — cleaning up a messy API

Beginners often write URLs like these. Each one "works," but the design fights you:

| Messy URL | Problem | Clean REST version | Why it is better |
|---|---|---|---|
| `GET /getUsers` | Verb in the URL | `GET /users` | The method already says "get" |
| `POST /createUser` | Verb again | `POST /users` | POST to the collection means "create one" |
| `GET /getUserById?id=5` | Action + id buried in query | `GET /users/5` | The id identifies one resource — it belongs in the path |
| `POST /deleteUser/5` | Wrong method doing the verb's job | `DELETE /users/5` | DELETE *is* the action |
| `GET /users/5/getOrders` | Verb glued onto a relationship | `GET /users/5/orders` | Nesting alone expresses "orders of user 5" |

The cleanup recipe, in order: name the **nouns** (users, orders), put identifiers in the path, let the HTTP method be the only verb, and nest only to show ownership. After this cleanup, a stranger can guess your URLs — that guessability is the entire point of REST.

> [!WARNING]
> **Common mistake:** mixing styles in one API — `/users` here, `/deleteUser` there. Interviewers notice instantly. Pick the resource style and apply it everywhere, even when a verb URL feels quicker to write.

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


```playground Playground: a tiny in-memory REST store
// A fake API with no server: handle(method, path, body) returns { status, body }.
const users = [
  { id: 1, name: "Ayushi" },
  { id: 2, name: "Rahul" },
];
let nextId = 3;

function handle(method, path, body) {
  const parts = path.split("/").filter(Boolean); // "/users/2" -> ["users", "2"]
  // TODO: GET /users        -> { status: 200, body: users }
  // TODO: GET /users/:id    -> the user, or { status: 404, body: { error: "not found" } }
  // TODO: POST /users       -> push { id: nextId++, name: body.name }, return status 201
  // TODO: DELETE /users/:id -> remove that user, return status 204 (or 404)
  return { status: 501, body: { error: "not implemented yet" } };
}

console.log(handle("GET", "/users"));
console.log(handle("POST", "/users", { name: "Ikra" }));
console.log(handle("GET", "/users/3"));
console.log(handle("DELETE", "/users/1"));
console.log(handle("GET", "/users"));
```


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

### Decoding a sample token, part by part

Here is a fake token made only for learning (never use it anywhere real):

`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MiIsInJvbGUiOiJzdHVkZW50IiwiZXhwIjoxNzM1Njg5NjAwfQ.fake-signature-for-learning-only`

Split it on the dots and decode each piece in plain words:

| Part | The raw text | What it actually says |
|---|---|---|
| Header | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` | "I was signed with the HS256 algorithm, and I am a JWT" |
| Payload | `eyJ1c2VySWQiOiI0MiIsInJvbGUiOiJzdHVkZW50IiwiZXhwIjoxNzM1Njg5NjAwfQ` | "This belongs to user 42, whose role is student, and I expire at the time stored in `exp`" |
| Signature | `fake-signature-for-learning-only` | In a real token this is the header + payload mixed with the server's secret. Change one character of the payload and this no longer matches |

Try the mental experiment: anyone holding this token can read the payload — user 42, student — in seconds, because base64 is an *encoding*, like writing in capital letters, not a lock. What they **cannot** do is change `"role"` to `"admin"` and produce a matching signature, because they do not know the secret. Reading is free; forging is what the signature prevents.

> [!NOTE]
> **Under the hood:** the `exp` value is a count of seconds since 1 January 1970 (Unix time). Verification is just two checks — "does the signature match what my secret produces?" and "is `exp` still in the future?" Both must pass.

> [!WARNING]
> **Common mistake:** trusting the payload because it *looks* official. A request arrives claiming to be an admin — that claim is worthless until `jwt.verify` has checked the signature with your secret. Decode-to-read on the client is fine for showing a name; authorize only after server-side verification.


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


### Same data, modelled both ways

Take one user, Ayushi, with two orders. Here is that single fact living in each world.

**In SQL — two tables, linked by an id:**

| users: id | name | email |
|---|---|---|
| 1 | Ayushi | a@b.com |

| orders: id | user_id | product | amount |
|---|---|---|---|
| 101 | 1 | Keyboard | 1499 |
| 102 | 1 | Mouse | 799 |

To answer "show Ayushi's orders," SQL **joins**: match `orders.user_id` to `users.id`. Her name is stored once; a hundred orders still point at that one row.

**In MongoDB — documents, with a choice to make:**

Option A, embed (orders live inside the user document): one user document holds `name`, `email`, and an `orders` array containing both orders. Reading her full profile takes a single fetch — but the document grows with every order, forever.

Option B, reference (separate `orders` collection, each order storing `userId: 1`): shaped almost exactly like the SQL version. Fetching her orders takes two queries, and Mongoose's `populate` stitches them together for you.

| Question to ask | Embed (Option A) | Reference (Option B) |
|---|---|---|
| Is the child data always read *with* the parent? | Yes — good fit | Not necessarily |
| Can the child list grow without limit? | Bad fit — document balloons | Good fit |
| Is the child shared or edited on its own? | Bad fit | Good fit |

> [!WARNING]
> **Common mistake:** embedding everything because "MongoDB means no joins." Embed data that is small, stable, and always read together (a user's address). Reference data that grows, is shared, or is queried alone (orders, products). Choosing wrong is not a syntax error — it is a slow pain that arrives months later.

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

### Env and config mistakes that bite everyone once

- Reading `process.env.SOMETHING` *before* the `dotenv.config()` line runs. Order in the file is execution order — the config call goes at the very top.
- A name mismatch: the code asks for `MONGO_URI` but the `.env` defines `MONGO_URL`. `process.env.MONGO_URI` quietly returns `undefined`, and the database connection fails three functions later, far from the real typo.
- Hardcoding a fallback secret "just for now," like a default JWT secret in code. If that code ships, anyone who reads it can forge tokens.
- Assuming deployment copies your `.env`. It does not — and must not. Production values get typed into the hosting platform's settings panel by hand, then the service needs a restart to see them.
- Printing secrets while debugging. A single `console.log(process.env)` in production writes every key into logs that may be broadly visible.

> [!NOTE]
> **Under the hood:** a professional touch is failing fast at startup — check the handful of required variables the moment the app boots, and if one is missing, stop immediately with a message naming the variable (never printing values). A crash in second one beats a mystery failure on the first real request.


---

## 🌍 10. CORS in 3 lines

1. Browsers block a web page from one origin (say `localhost:5173`) from calling an API on a different origin (`localhost:3000`) — this safety rule is the **Same-Origin Policy**.
2. **CORS** (Cross-Origin Resource Sharing) is how the *server* gives permission: "Yes, that frontend is allowed to talk to me."
3. In Express, one line fixes it: `app.use(cors())` (from the `cors` package) — or `cors({ origin: "https://myfrontend.com" })` to allow only your real frontend.

> [!WARNING]
> **Interviewer trap:** "Is CORS a security feature of the server?" — No. CORS is enforced by the **browser** to protect users; it doesn't stop Postman or other servers from calling your API. Authentication is what actually protects your API.

### Why the browser blocks at all — origin, in plain words

An **origin** is the trio of protocol + host + port: `http://localhost:5173` and `http://localhost:3000` differ only in port, yet they are *different origins*. The Same-Origin Policy exists because a page you trust should not silently read responses from a bank or a mailbox open in another tab — so the browser lets your page *send* many cross-origin requests, but refuses to let the page *read* the answer unless the server explicitly permits it. That permission slip is exactly what CORS headers are.

### Preflight — the browser asks permission first

For anything beyond a simple GET (custom headers like `Authorization`, a JSON body, PUT/DELETE), the browser quietly sends a tiny **OPTIONS** request first — the *preflight* — asking "may this origin use this method and these headers?" Your server answers with `Access-Control-Allow-Origin` (and friends); only then does the browser send the real request. That is why a blocked call often shows *two* entries in the Network tab, and why "the API works in Postman but not in the browser" almost always means preflight: Postman never asks permission, browsers always do.

```js
const cors = require("cors");

// ✅ Production shape: name your real frontend; allow credentials only if you use cookies
app.use(cors({ origin: "https://myfrontend.com", credentials: true }));
```

> [!WARNING]
> **Common mistake:** leaving `app.use(cors())` (allow everyone) in production "because it worked." Development-convenient is not production-safe — restrict `origin` to your deployed frontend, and register the middleware *before* your routes, or preflights will fail before your handlers ever see them.

> [!NOTE]
> **One-line interview answer:** "CORS is the browser asking the server for permission to let a different-origin page read a response; I grant it with the `cors` middleware in Express, restricted to my frontend's origin, and the OPTIONS preflight is the browser checking before the real request."


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


### Following an error from cause to response

Three different failures on the same `GET /users/:id` route should produce three different answers. Trace each one:

| What went wrong | Where it surfaces | Status sent | What the client sees | What you log on the server |
|---|---|---|---|---|
| Client requested id "abc" and lookup finds nothing | Your `if (!user)` check | 404 | "User not found" | Usually nothing — this is normal traffic |
| Client sent an invalid body on signup | Your validation, before any database call | 400 | "Email is required" (say which field) | Nothing needed |
| Database is down mid-request | The `catch` block / error middleware | 500 | "Server error" — generic, no details | The full error and stack, for you only |

Step by step for the third row: the `await` throws → `catch` receives the error → you log the real details where only developers can see them → the client gets a calm 500 with no internals. With a central error handler (Section 4), the same flow works by calling `next(err)` instead of responding in the route.

> [!WARNING]
> **Common mistake:** sending the raw error object to the client "for debugging." Error messages can expose table names, file paths, and library versions — a map for attackers. Debug from your server logs; the client gets a short, honest, generic message.

> [!NOTE]
> **Under the hood:** in Express, a plain `throw` inside an *async* handler does not automatically reach the error middleware in older versions — the promise rejects silently and the request hangs. That is why every async handler needs its own try/catch (or a wrapper, or Express 5, which forwards rejections for you).

> [!IMPORTANT]
> Frontend validation is for user experience. Backend validation is for **security and data integrity**. An interviewer asking "where do you validate?" wants to hear: "Both — but the backend validation is the one that actually protects the system."

---

## 🚀 12. Deployment Basics (in brief)

- Your code runs wherever `npm start` runs — on your laptop it's `localhost`, in production it's a server (Render, Railway, AWS, etc.).
- Production servers assign their own port, so always read it from the environment: `app.listen(process.env.PORT || 3000)` — never hardcode 3000.
- **`npm run build`** (for frontend/full-stack builds) converts your code into optimized files; **`npm start`** runs the production server. Build creates the dish, start serves it.
- All secrets (DB URL, JWT secret) go into the hosting platform's environment-variable settings — never into the code or GitHub.
- After deploying, check the logs first when something fails: 90% of beginner deployment errors are a missing env variable or a wrong port.

### One platform flow, start to finish (Render-style)

1. **Push code to GitHub** — the platform watches the repo; `node_modules` and `.env` stay out (both belong in `.gitignore`).
2. **Install** — the platform runs `npm install` from `package.json`, so every package your code imports must be listed there, not just installed on your laptop.
3. **Build (if any)** — full-stack apps run `npm run build` to produce the optimized frontend files; a plain Node API often has no build step at all.
4. **Start** — the platform runs your start command (`node server.js`) and hands your app *its* port through `process.env.PORT`. Hardcode 3000 here and the deploy "succeeds" while serving nobody.
5. **Set env vars in the dashboard** — database URL, JWT secret, API keys — typed into the platform's settings, never pasted into code. Changing one needs a restart to take effect.
6. **Read the logs** — first place to look, always. A missing env var, a failed database connection, and a wrong start command each announce themselves there in plain text.

```js
// The two lines that make a fresher app deployable almost anywhere:
const port = process.env.PORT || 3000;            // the host chooses the port; you just listen
app.get("/health", (req, res) => res.send("ok")); // lets you (and the host) prove the app is alive
```

> [!TIP]
> **Debugging order after any deploy:** env variables set? → listening on `process.env.PORT`? → logs read, top to bottom? In that order — it resolves nearly every "works on my laptop" mystery without touching code.


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


---

## 📌 13. API Design Deep Dive — Versioning, Pagination & Filtering

Section 5 taught the conventions. This chapter is the engineering layer real teams judge: how APIs survive growing users, big lists, and version two.

### Versioning — changing the API without breaking old apps

Mobile apps and other teams' frontends pin themselves to your API's current shape. When you must change it, version it — most commonly in the URL:

```bash
GET /api/v1/bills      # old clients keep working
GET /api/v2/bills      # new shape/behaviour lives here
```

The fresher version: add new fields freely (old clients ignore them), but renaming or removing a field is a breaking change — that earns a new version. (Header-based versioning exists; URL versioning is the one to describe.)

### Pagination — never return "everything"

A list endpoint that returns all 50,000 users will die in production. Two standard shapes:

**Offset pagination** (simple; fits most fresher apps):

```bash
GET /products?page=2&limit=20        # skip 20, take 20
```

```js
const page = Math.max(1, Number(req.query.page) || 1);
const limit = Math.min(50, Number(req.query.limit) || 10);   // cap it!
const skip = (page - 1) * limit;
const items = await Product.find().skip(skip).limit(limit);
const total = await Product.countDocuments();
res.json({ items, page, totalPages: Math.ceil(total / limit) });
```

Weakness worth naming: if rows are inserted while someone pages through, items can repeat or vanish between pages, and deep pages get slow (the database still scans the skipped rows).

**Cursor pagination** (what big feeds use): the response hands back an opaque cursor pointing at the last item seen — `GET /feed?cursor=abc123&limit=20` — and the server returns "the 20 after this." No skipped-row cost, immune to inserts shifting pages. Say: *"offset for admin tables and simple lists; cursor for infinite feeds and very large collections."*

### Filtering, sorting, searching — all in the query string

```bash
GET /products?category=shoes&minPrice=500&sort=-price&q=running
```

| Param | Meaning | Shape in code |
|---|---|---|
| `category=shoes` | Exact-match filter | `filter.category = "shoes"` |
| `minPrice=500` | Range filter | `filter.price = { $gte: 500 }` |
| `sort=-price` | Descending by price (`-` prefix) | `.sort("-price")` |
| `q=running` | Text search | A `$regex` / text index over name |

Build the filter object only from **whitelisted** params — never pour `req.query` straight into a database query (that's an injection hole; see Section 17).

### One consistent response shape

The professional touch: success and error bodies always look the same across the whole API, so the frontend can be written once.

```js
// ✅ envelope — same keys every time, plus a request-friendly error shape
res.status(200).json({ success: true, data: items, page, totalPages });
res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email is required", field: "email" } });
```

> [!WARNING]
> **The limit trap:** accept a `limit` from the client but always cap it server-side (`Math.min(50, ...)`) — otherwise `?limit=1000000` is a one-line denial-of-service against your own database.

> [!NOTE]
> **30-second interview answer:** "I version APIs in the URL so old clients keep working while v2 evolves. List endpoints always paginate — offset pagination with page/limit for simple lists, cursor pagination for large feeds — with the page size capped server-side. Filters, sorting, and search go in the query string, and I whitelist the parameters before they touch the database. Every response uses one consistent success/error envelope."



---

## 📌 14. Auth Deep Dive — Sessions, Refresh Tokens & Token Rotation

Section 7 built login with JWT. This chapter answers the follow-up every company asks: *"JWT or sessions — and how do you handle expiry and logout, really?"*

### Sessions vs JWT — the same job, two storage choices

Both answer "who is calling?" after login. They differ in **where the truth lives**:

| | Session-based | JWT-based |
|---|---|---|
| What the client holds | A random **session ID** (usually a cookie) | The **signed token itself** |
| Where the data lives | On the **server** (memory/DB/Redis) | **Inside the token** (id, role, expiry) |
| Each request | Server looks the ID up in its store | Server only checks signature + expiry — no lookup |
| Logout/revoke | ✅ Easy — delete the server record | ❌ Hard — token stays valid until expiry |
| Scaling | Needs a shared store once you run multiple servers | ✅ Naturally stateless |

The mature answer: JWT's statelessness scales beautifully and suits APIs/mobile apps; sessions give instant revocation and suit classic server-rendered apps. Neither is "more secure" in the abstract — the details below are where security is won or lost.

### The two-token pattern: short access + refresh

A JWT that lives for 30 days is a stolen-forever key; one that lives for 10 minutes logs users out mid-work. The standard compromise:

- **Access token** — the JWT from Section 7, short-lived (5–15 min), sent with every request.
- **Refresh token** — long-lived (days/weeks), sent **only** to one endpoint: `POST /auth/refresh`. It lives in an httpOnly cookie (JS can't read it → XSS can't steal it), and when presented, the server issues a fresh access token.

Expiry pain disappears (the app silently refreshes), and the damage window of a stolen access token stays small.

### Refresh token rotation — catching theft

Rotation upgrades this: **every refresh issues a new refresh token and kills the old one**, and the server remembers which refresh tokens belong to which user ("family"). If an *old* refresh token is ever presented again, somebody replayed a stolen copy — the server nukes the whole family and forces a real login. That theft-detection sentence scores heavily: *"I rotate refresh tokens on every use; reuse of an old one tells me it's stolen, so I revoke the whole chain."*

### The password layer — hashing, upgraded

Section 7 used bcrypt. The deeper facts:

- Hashing must be **slow on purpose** (bcrypt/scrypt/argon2) — attackers try billions of guesses, so each guess should cost real time. Fast hashes like SHA-256 are *wrong for passwords* precisely because they're fast.
- The **cost factor** (bcrypt rounds) is tuned so one check takes ~100–250ms — invisible at login, devastating to brute force.
- **Pepper** (a secret mixed in from the environment, never stored with the hashes) is the optional extra layer worth naming.

And the flows around it: password-reset tokens are single-use, short-lived, and stored hashed — exactly like refresh tokens, because a reset link *is* a temporary password.

> [!WARNING]
> **Three traps:** (1) "I'll store the JWT in localStorage" — readable by any script on the page; if the app has an XSS hole, tokens walk away. httpOnly cookies for refresh tokens is the defensive default. (2) Rolling your own crypto or token signing — always the vetted library. (3) Checking permissions only on the frontend (hiding the Delete button) — attackers call the API directly; authorization belongs in middleware, every route, every time.

> [!NOTE]
> **30-second interview answer:** "Sessions keep the state on the server and revoke instantly; JWTs carry signed claims so the server stays stateless but can't easily revoke. In practice I use a short-lived JWT access token plus a long-lived refresh token in an httpOnly cookie, rotated on every refresh — so a replayed old refresh token exposes theft and I can revoke the whole chain. Passwords are hashed with a deliberately slow algorithm like bcrypt with a tuned cost factor."



---

## 📌 15. MongoDB Schema Design — Indexes & Data Modelling Calls

Section 8 showed embed vs reference on one example. This chapter adds the rest of the craft: how the database *finds* documents fast, and the modelling calls you'll be judged on.

### Indexes — the book's table of contents

Without an index, MongoDB answers a query by **reading every document** (a collection scan). With an index on `email`, it jumps straight to matches — the same reason you don't read a whole textbook to find "photosynthesis."

```js
userSchema.index({ email: 1 });            // index on one field (1 = ascending)
userSchema.index({ city: 1, age: -1 });    // compound: city asc, then age desc
```

Facts that answer the follow-ups:

- Every collection already has an index on `_id`. `unique: true` (Section 8's email) *is* an index plus a duplicate-reject rule.
- Indexes cost: storage, and every insert/update must also update each index. Index what you query by; don't index everything "just in case."
- A query can only ride an index efficiently when the index's fields lead with what you filter on — `{ city: 1, age: -1 }` serves `find({ city })` and `find({ city, age })`, not `find({ age })` alone.
- `explain()` on a query shows whether it used an index (`IXSCAN`) or scanned everything (`COLLSCAN`) — the first tool to reach for when an endpoint is slow.

### The modelling calls, as decisions

| Situation | Call | Why |
|---|---|---|
| Profile info always shown with the user (address, preferences) | **Embed** | One fetch, read together, small and stable |
| Orders, comments, notifications | **Reference** | Grows forever, queried on its own, would balloon the document |
| A product's snapshot inside an order (name+price at purchase time) | **Embed a copy** | Must not change when the product is edited later — history shouldn't rewrite itself |
| Tags on a post (small, bounded) | **Embed array** | Few items, always read with the post |
| Students ↔ courses (both sides grow) | **Reference both ways** (join collection) | Many-to-many never fits inside either document |

The honest rule behind the table: **model for how the data is read, not how it is related on paper.** Document databases reward designing around your queries.

### The 16MB wall and unbounded arrays

A MongoDB document maxes out at 16MB — generous, until an embedded array grows without limit (comments, logs, messages inside one document): writes get slower, the document gets moved as it grows, and one day a write simply fails. "Can this list grow forever?" (Section 8's question) is really asking about this wall — unbounded growth always becomes a separate collection with a reference back.

### Two essentials to name

- **Aggregation pipeline** — MongoDB's filter/group/report engine, as stages: `$match` (filter) → `$group` (sum/count by field) → `$sort`. It's the NoSQL answer to SQL's `GROUP BY`, and "monthly totals" in a fresher project is built exactly like this.
- **Transactions** — MongoDB supports multi-document transactions, but they're the exception to reach for (money moving between two accounts), not the default; single-document writes are already atomic, which is one more reason embedding related-must-change-together data is attractive.

```js
// The monthly-totals shape — $match, then $group, then $sort
await Order.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$month", total: { $sum: "$amount" } } },
  { $sort: { _id: 1 } },
]);
```

> [!WARNING]
> **The classic trap:** designing MongoDB schemas exactly like SQL tables — a document per table-row, references everywhere — then paying for it with multi-query pages and manual stitching. Embed what's read together; MongoDB's whole point is shaped-for-the-query documents.

> [!NOTE]
> **30-second interview answer:** "Indexes make queries jump to matches instead of scanning every document — I index the fields I filter on and check with explain() whether a query is using one. For modelling, I embed data that's small, stable, and always read with its parent, and reference anything unbounded or independently queried — because one document caps at 16MB. Aggregation pipelines with $match, $group, and $sort handle reporting, and transactions exist but single-document writes are already atomic."



---

## 📌 16. Caching with Redis — Intuition & Cache-Aside

Your database is disk-and-network slow. A **cache** is a small, very fast storage layer in front of it: "we just answered this — keep the answer nearby for a while." Redis is the industry-standard cache: an in-memory key-value store that answers in well under a millisecond.

### Cache-aside — the pattern you'll actually implement

The application manages the cache by hand, in four steps:

```js
app.get("/products/:id", async (req, res) => {
  const key = `product:${req.params.id}`;

  const cached = await redis.get(key);            // 1. Ask the cache first
  if (cached) return res.json(JSON.parse(cached)); // 2. Hit → return, database untouched

  const product = await Product.findById(req.params.id);   // 3. Miss → go to the database
  if (!product) return res.status(404).json({ message: "Not found" });

  await redis.set(key, JSON.stringify(product), "EX", 300); // 4. Fill the cache (expire in 5 min)
  res.json(product);
});
```

Hit = fast. Miss = normal cost, once, then fast for everyone after. Cache-aside is honest about its contract: **the cache is a copy, never the source of truth** — losing Redis entirely must slow the app down, not break it.

### TTL — every cached answer is a promise with an expiry

`EX 300` above means the entry dies after 300 seconds. Choosing the TTL is the whole judgement call:

- Prices that change rarely, product details → minutes to hours.
- Anything users perceive as "live" (stock left, scores) → seconds, or don't cache at all.
- User-specific data → cache per user key (`user:42:profile`), never one shared blob.

### Invalidation — the genuinely hard part

The famous quip "the two hard things are cache invalidation and naming things" is real: when a product's price changes in the DB, the cache still serves the old price until its TTL dies. The standard answers, escalating in strength:

1. **Short TTLs** — accept seconds/minutes of staleness for data that tolerates it (most catalog data does).
2. **Delete-on-write** — whenever the code updates the product, it also `DEL`s `product:42` from Redis; the next read re-fills with fresh data. Simple, and the default fresher answer.
3. **Never cache what can't be stale** — wallet balances and permissions are read from the DB every time, or cached only with rule 2 firmly in place.

### What Redis is besides a cache (name-drop level)

Key-value pairs with an expiry is the core, but Redis also offers counters (`INCR` — perfect for rate limiting, Section 17), sorted sets (leaderboards), lists (simple queues), and pub/sub (live notifications between servers). Interviewers don't expect depth here; knowing it isn't "just a cache" is the signal.

> [!WARNING]
> **Traps:** (1) caching everything, including per-user sensitive responses under one shared key — users see each other's data; (2) no TTL at all ("we'll delete it when it changes" — you will forget a path); (3) caching at the wrong layer to hide a missing MongoDB index (Section 15) — cache the hot path *and* index the query, not one instead of the other.

> [!NOTE]
> **30-second interview answer:** "I use Redis as an in-memory cache in front of MongoDB with the cache-aside pattern: check Redis first, on a miss query the database and store the result with a TTL. When data changes, the write path deletes the cache key so the next read refills fresh. TTL choice is by staleness tolerance — minutes for catalog data, and never cache per-user data under a shared key."



---

## 📌 17. API Security Essentials — Rate Limiting, Uploads & Injection

Everything in this chapter follows from Section 11's law: **anyone can call your API with anything.** These are the attacks that law invites, and the standard defences.

### Rate limiting — a speed limit for your API

Without one, a script can try 100,000 passwords a minute against your login, or scrape your entire catalogue. The fix counts requests per client (usually per IP or per user) and refuses past a budget:

```js
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }); // 20 tries / 15 min
app.post("/login", loginLimiter, loginHandler);

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });       // general traffic
app.use("/api", apiLimiter);
```

Clients over the line get **429 Too Many Requests** (with a `Retry-After` header on good implementations). Two limits with two budgets is the professional shape: strict on sensitive endpoints (login, OTP, password reset), gentle elsewhere. On multiple servers the counter moves to Redis (`INCR` per key, Section 16) so all instances share one tally.

### Injection — user input reaching a query as *code*

**SQL injection:** string-built queries let input rewrite the query itself — the classic login bypass `' OR '1'='1`. The defence is never building queries by string concatenation; parameterized queries / ORMs treat input as *data*, always:

```js
// ❌ db.query("SELECT * FROM users WHERE email = '" + email + "'")
// ✅ db.query("SELECT * FROM users WHERE email = ?", [email])
```

**NoSQL injection (MongoDB's version):** JSON bodies mean an attacker can send an *object* where you expected a string:

```js
// Attacker sends: { "email": "a@b.com", "password": { "$gt": "" } }
// If req.body.password goes straight into findOne({ password }), $gt means "any non-empty password" 💥
```

Defences: validate types explicitly (Section 11 — password must be a `string` before it touches a query), and let Mongoose schema types do their casting. And **mass assignment**: spreading a raw body into `User.create({ ...req.body })` lets a caller add `"role": "admin"` to their own signup. Whitelist fields on every create/update — the same whitelist habit as Section 13's filter params.

### File uploads — trust nothing about a "file"

Five checks, in order, before an uploaded file touches your disk or DB:

1. **Type** — verify the actual content type (magic bytes / the upload library's MIME check), never just the filename's extension: `bill.exe` renames to `bill.jpg` in one keystroke.
2. **Size** — a hard cap (e.g., 5MB), enforced by the upload middleware, before the file lands anywhere.
3. **Name** — generate your own filename (`invoice-<random>.pdf`); never store under the user's original name (path traversal: `../../server.js`).
4. **Content** — images get re-encoded/resized by a library (which also strips anything weird hiding in them); documents in serious apps go through malware scanning.
5. **Serving** — serve uploads from a separate path/domain or object storage (S3), so an uploaded file can never be *executed* as part of your app, and store only its URL in the database.

Validation libraries (in Node-land: `express-validator` or a schema validator like Zod) centralise Section 11's hand-rolled `if (!email)` checks into declared rules — name one in interviews as "validation as middleware, so routes stay clean and every endpoint is guarded by the same rules."

> [!WARNING]
> **The trap answer:** "The frontend validates everything, so the API is safe." Frontend validation is a courtesy to honest users; the attacks above all bypass your frontend entirely with Postman/curl. Every defence here is server-side on purpose.

> [!NOTE]
> **30-second interview answer:** "I rate-limit sensitive endpoints like login to a small budget per window — 429 past it — and use looser limits elsewhere. Against injection I never build queries with string input: parameterized queries for SQL, explicit type validation and field whitelists for MongoDB, which also stops $gt operator injection and mass assignment. For uploads I check real content type and size, give files my own generated names, store only the URL, and serve them away from the app."

