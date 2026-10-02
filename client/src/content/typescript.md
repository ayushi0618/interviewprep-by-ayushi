# 🔷 TypeScript Essentials — Complete Interview Notes

TypeScript is the language freshers get asked about the moment they put "React" or "Node.js" on a resume — because almost every real team writes TypeScript, not plain JavaScript. This file covers it the way interviews actually test it: why it exists, the type system basics, generics and narrowing, how it looks inside React, and the traps (`any` vs `unknown`, `as`, interface myths) that separate "I have used it" from "I understand it."

> 📚 Part of **InterviewPrep by Ayushi Singh** — written for final-year CSE students and freshers preparing for full-stack interviews. Every concept here is explained the way you should explain it *out loud* in an interview: simple, correct, with one example ready.

## 📌 1. Why TypeScript over JavaScript?

**TypeScript is JavaScript with a type system added on top.** It compiles (transpiles) down to plain JavaScript — the browser and Node never run `.ts` files directly. JavaScript only complains when the code *runs*; TypeScript complains while you *write* it:

```ts
function add(a: number, b: number) { return a + b; }
add(2, "3"); // ❌ Error BEFORE running: string is not a number
```

> [!IMPORTANT]
> **The one-line pitch:** TypeScript catches a whole class of bugs at compile time — wrong argument types, typos in property names, `null` where a value was expected — that JavaScript would only reveal at runtime, usually in production.

Three more wins: **better autocomplete**, **self-documenting signatures** (`(user: User) => Promise<Order[]>`), and **safer refactoring**.

> [!WARNING]
> TypeScript does **not** check types at runtime — validate untrusted API data separately.

**🎤 What the interviewer actually asks:** *"Why TypeScript? What problem does it solve?"* and *"Does TypeScript run in the browser?"* (No — it compiles to JavaScript first.)

## 📌 2. Basic Types

| Type | Meaning | Example |
|---|---|---|
| `string` | Text | `let name: string = "Ayushi";` |
| `number` | All numbers (int + float, one type) | `let score: number = 42;` |
| `boolean` | `true` / `false` | `let done: boolean = false;` |
| `array` | List of one type | `let nums: number[] = [1, 2, 3];` |
| `tuple` | Fixed-length array, each position typed | `let pair: [string, number] = ["age", 21];` |
| `enum` | Named set of related constants | `enum Role { Admin, User }` |
| `any` | Opt OUT of type checking entirely | `let x: any = fetchData();` |
| `unknown` | "Could be anything — check before use" | `let input: unknown = getInput();` |
| `never` | Value that never occurs | A function that always throws |

```ts
let user: [string, number] = ["Ayushi", 21];
user = [21, "Ayushi"]; // ❌ wrong order = error (tuple)

enum Status { Pending, Approved, Rejected }
let s: Status = Status.Approved; // readable — better than remembering 1 = approved
```

> [!NOTE]
> **`any` vs `unknown` in one line:** both mean "I don't know the type" — but `any` lets you do *anything* with the value (no checks), while `unknown` forces you to *check first*. `unknown` is the safe one. Full breakdown in Section 12.

**🎤 What the interviewer actually asks:** *"What is a tuple?"*, *"What is an enum?"*, and the classic — *"Difference between `any` and `unknown`?"*

## 📌 3. Type Inference

TypeScript **figures out most types itself** — you only annotate where it cannot know.

```ts
let city = "Ghaziabad"; // inferred: string
city = 42;              // ❌ inference already locked it to string
let marks = [90, 85];   // inferred: number[]

function greet(name: string) {  // parameters MUST be annotated
  return `Hello, ${name}`;      // return type inferred: string
}
```

> [!IMPORTANT]
> **The rule:** annotate parameters and API boundaries; let inference handle obvious locals.

**🎤 What the interviewer actually asks:** *"Do you have to write types everywhere?"* — No. Inference covers locals; you write types at the boundaries.

## 📌 4. Interfaces vs Type Aliases

Both describe the *shape* of an object — this is the most-asked TypeScript question, so have the table ready.

```ts
interface User { name: string; age: number; }
type Point = { x: number; y: number };
```

| Feature | `interface` | `type` |
|---|---|---|
| Describes object shapes | ✅ Yes | ✅ Yes |
| Extending | `extends` | Intersection `&` |
| Unions (`"a" \| "b"`) | ❌ No | ✅ Yes |
| Primitives / tuples / functions | ❌ No | ✅ Yes |
| Declaration merging (same name twice combines) | ✅ Yes | ❌ No |
| Best for | Object shapes, public APIs | Unions, helpers, computed types |

```ts
interface User { name: string; }
interface User { age: number; } // merges → User has BOTH (interfaces only)
type ID = string | number;      // union (type only)
```

> [!NOTE]
> **The honest answer:** for plain objects they are ~95% interchangeable — `interface` for shapes, `type` for unions/helpers.

**🎤 What the interviewer actually asks:** *"Interface vs type — which do you use and why?"* Anyone claiming one is "always better" is repeating a myth — see Section 12.

## 📌 5. Unions & Intersections

A **union** (`|`) means "this OR that." An **intersection** (`&`) means "this AND that combined."

```ts
type ID = string | number;        // union — either one
function printId(id: ID) { /* ... */ }
printId(101); printId("A101");    // both fine

interface Named { name: string }
interface Aged { age: number }
type Person = Named & Aged;       // intersection — must have BOTH
const p: Person = { name: "Ayushi", age: 21 };
```

**🎤 What the interviewer actually asks:** *"What is a union type?"* and *"How do you combine two types into one?"*

## 📌 6. Literal Types

A literal type is not "any string" — it is *one exact string* (or number). Literal unions give you a safe, autocomplete-friendly set of options:

```ts
type Size = "small" | "medium" | "large";
let tshirt: Size = "medium";
tshirt = "extra-large"; // ❌ not in the list
```

> [!IMPORTANT]
> Literal unions replace enums in a lot of modern code — `"small" | "large"` is lighter than an `enum` and reads well in API data. `enum` still wins when you want a named group with its own namespace.

## 📌 7. Generics Basics

Generics let one function or interface work with **many types while keeping type safety**. `<T>` is a placeholder: "whatever type you pass in, I keep track of it."

```ts
function firstItem<T>(arr: T[]): T { return arr[0]; }
firstItem([1, 2, 3]);   // T = number → returns number
firstItem(["a", "b"]);  // T = string → returns string

interface ApiResponse<T> { data: T; success: boolean; }
const res: ApiResponse<string[]> = { data: ["a", "b"], success: true };
```

> [!NOTE]
> **Why not just use `any`?** Because `any` forgets the type — the result comes back as `any` and you lose every check downstream. Generics *remember*: numbers in, number out, and the compiler proves it.

**🎤 What the interviewer actually asks:** *"What are generics? Why not just use `any`?"* — that comparison is the whole answer.

## 📌 8. Type Narrowing

When a value could be several types, TypeScript makes you **prove** which one it is before using type-specific features. That proof is narrowing.

```ts
function printId(id: string | number) {
  if (typeof id === "string") console.log(id.toUpperCase()); // string — safe
  else console.log(id.toFixed(2));                           // number — safe
}
```

| Guard | Narrows | Example |
|---|---|---|
| `typeof` | Primitives | `typeof x === "string"` |
| Truthiness | Removes `null` / `undefined` / `""` | `if (value) { ... }` |
| `in` operator | Objects by property | `if ("bark" in animal) { ... }` |
| `instanceof` | Class instances | `if (err instanceof Error) { ... }` |

> [!WARNING]
> Truthiness narrowing has a trap: `if (value)` also removes the perfectly valid `0` and `""`. When those are legal values, check `value != null` instead of relying on truthiness.

**🎤 What the interviewer actually asks:** *"What is type narrowing / a type guard?"* — name `typeof` and `instanceof` with one example each and you are done.

## 📌 9. Optional Chaining & Nullish in TS

Two operators you know from JavaScript — in TypeScript they also *narrow types* as they go:

```ts
interface Profile { name: string; address?: { city: string } }
function cityOf(p: Profile) {
  return p.address?.city ?? "City not provided"; // ?. stops safely, ?? falls back
}
const items = 0;
items || 10; // 10 — || treats 0 as missing (often wrong)
items ?? 10; // 0  — ?? knows 0 is a real value ✅
```

- `?.` — if the left side is `null`/`undefined`, stop and return `undefined` instead of crashing.
- `??` — fall back **only** for `null`/`undefined`. Unlike `||`, it keeps valid falsy values like `0` and `""`.

## 📌 10. TypeScript with React

Three patterns cover almost everything a fresher gets asked:

```tsx
// 1. Typing props with an interface
interface ButtonProps { label: string; onClick: () => void; disabled?: boolean }
function MyButton({ label, onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null); // logged-out = null

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setName(e.target.value);
}
```

> [!IMPORTANT]
> `useState<User | null>(null)` is the pattern interviewers probe: the generic says "a User *or* null," so TS forces a null check before `user.name` — exactly the runtime bug TS exists to prevent. With plain `useState(null)`, TS infers the state can *only* ever be null.

**🎤 What the interviewer actually asks:** *"How do you type props?"*, *"How do you type useState for an object that starts as null?"*, *"How do you type an onChange handler?"*

## 📌 11. Utility Types (the four you must know)

| Utility | Does what | Use it when |
|---|---|---|
| `Partial<T>` | Makes every property optional | Update forms / PATCH payloads |
| `Pick<T, K>` | Keeps only the listed properties | A card needs 2 fields of a big User |
| `Omit<T, K>` | Removes the listed properties | Form data = User without `id` |
| `Record<K, V>` | Object with keys K, values V | Lookup maps, dictionaries |

```ts
interface User { id: number; name: string; email: string; age: number }
type UserPatch = Partial<User>;            // all optional — send only what changed
type UserCard  = Pick<User, "name" | "age">;
type NewUser   = Omit<User, "id">;         // id comes from the DB, not the form
type Scores    = Record<string, number>;   // { "math": 90, "cs": 95 }
```

## 📌 12. Common Interview Traps

**Trap 1 — `any` vs `unknown`.** `any` switches the checker off: anything goes, errors return at runtime. `unknown` is "not yet known" — you must narrow it before using it. Reaching for `any` to silence an error defeats the point of TypeScript.

```ts
let a: any = getData();
a.whatever.you.want; // ✅ compiles, 💥 may crash at runtime
let u: unknown = getData();
u.whatever;          // ❌ error — check first. That's the point.
if (typeof u === "string") u.toUpperCase(); // ✅ safe after narrowing
```

**Trap 2 — the interface-vs-type myth.** Neither is "always better" — interviewers want trade-offs (Section 4), not a winner.

**Trap 3 — `as` assertions.** `as` tells the compiler "trust me, this is X." It performs **no check and no conversion** — if you are wrong, the code compiles and still crashes at runtime.

```ts
const el = document.getElementById("app") as HTMLInputElement; // if #app is a <div>, TS is now lying to you
```

> [!WARNING]
> Use `as` only when you genuinely know more than the compiler. Prefer narrowing or fixing the type. Saying "`as` doesn't convert anything, it just silences the compiler" is the exact sentence that wins this question.

**🎤 What the interviewer actually asks:** *"Is `as` the same as casting in other languages?"* — No. Nothing runs, nothing converts; it is a compile-time instruction to stop checking.

---

## 🎤 Mock Interview Questions — TypeScript

Practice saying these **out loud** — short, correct, then stop. Let them ask the follow-up.

**1. What is TypeScript, and why use it over JavaScript?**
> TypeScript is JavaScript with static types added — it compiles down to plain JavaScript before anything runs.
> I use it because it catches type errors while I write code instead of at runtime, and I get much better autocomplete and safer refactoring.

**2. What is the difference between `any` and `unknown`?**
> Both mean "I don't know the type yet," but `any` turns the checker off completely, so I can do anything and errors come back at runtime.
> `unknown` is the safe version — I have to narrow it with a check like `typeof` before I can use it.

**3. Interface vs type alias — which one do you pick?**
> For object shapes they're almost interchangeable, so I use `interface` there for clearer errors and declaration merging.
> I switch to `type` when I need unions, tuples, or helper transformations that interfaces can't express.

**4. What are generics? Why not just use `any`?**
> Generics let me write one function that works with many types while keeping the connection between input and output — numbers in, number out.
> With `any` that connection is lost and everything downstream becomes unchecked, so generics give me reuse *with* safety.

**5. What is type narrowing?**
> When a value could be a string or a number, I can't use string methods until I prove which one it is — that proof is narrowing.
> I usually do it with `typeof` for primitives, `instanceof` for classes, and the `in` operator to check an object has a property.

**6. How do you type props in a React component?**
> I define an interface with each prop and its type, mark optional props with a question mark, and destructure it in the function parameters.
> That way anyone using my component gets autocomplete and an error if they pass the wrong thing.

**7. How do you type `useState` when the value starts as `null`?**
> I pass the generic explicitly, like `useState<User | null>(null)`, so TypeScript knows the state will hold a User later.
> If I skip that, it infers the type as only `null` and complains when I set a real user — and it forces me to check for null before use, which is what I want.

**8. What does the `as` keyword do? Is it a cast?**
> It's not a cast — nothing is checked or converted at runtime. It's me telling the compiler "trust me, this is that type."
> I use it rarely, only when I genuinely know more than the compiler, because if I'm wrong the code compiles and still crashes.

**9. What is a union type? Give an example.**
> A union means a value can be one of several types, written with a pipe — like `type ID = string | number`.
> Before using it I narrow it down, so inside a `typeof id === "string"` block TypeScript knows it's definitely a string.

**10. Name two utility types and what you use them for.**
> `Partial` makes all properties optional, which I use for update payloads where only some fields change.
> `Pick` and `Omit` let me reuse one base type — like taking a big User type and picking just name and age for a small card component.

---

## ✅ 60-Second Revision Checklist

If you can say each line out loud the morning of an interview, you're ready.

- [ ] **TypeScript = JavaScript + types** — compiles to JS; checks at write-time, not runtime
- [ ] **Basic types** — `string`, `number`, `boolean`, arrays, tuple (fixed order/length), `enum` (named constants)
- [ ] **`any` vs `unknown`** — `any` disables checking; `unknown` forces a check before use. Prefer `unknown`
- [ ] **`never`** — value that never occurs: throwing functions, impossible narrowed branches
- [ ] **Inference** — locals are inferred; annotate parameters and boundaries, don't annotate everything
- [ ] **Interface vs type** — interface for object shapes + merging; type for unions/tuples/helpers. Neither "wins"
- [ ] **Union `|`** — this OR that • **Intersection `&`** — this AND that combined
- [ ] **Literal types** — `"small" | "medium" | "large"`: exact values as types, great enum alternative
- [ ] **Generics `<T>`** — reuse with safety; input/output type connection kept, unlike `any`
- [ ] **Narrowing** — `typeof`, `in`, `instanceof`, truthiness (careful: `if (x)` also drops valid `0` and `""`)
- [ ] **`?.` and `??`** — safe access + fallback only on `null`/`undefined` (keeps `0` and `""`, unlike `||`)
- [ ] **React trio** — props via `interface`, `useState<T>` (e.g. `useState<User | null>(null)`), events like `React.ChangeEvent<HTMLInputElement>`
- [ ] **Utility types** — `Partial` (all optional), `Pick` (keep some), `Omit` (drop some), `Record` (key→value map)
- [ ] **`as` assertion** — silences the compiler, converts nothing; prefer narrowing. Wrong `as` = compiles, then crashes
