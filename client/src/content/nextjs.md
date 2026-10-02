# ▲ Next.js Basics — Complete Interview Notes

Next.js is what interviewers bring up right after React — "Have you used Next.js?" is now a standard fresher question, because most production React apps run on it. This file keeps it at fresher depth on purpose: what Next.js is, file-based routing, the four rendering strategies, how data fetching changed between the Pages and App routers, API routes, and the honest answer to "why not just plain React?"

> 📚 Part of **InterviewPrep by Ayushi Singh** — written for final-year CSE students and freshers preparing for full-stack interviews. Every concept here is explained the way you should explain it *out loud* in an interview: simple, correct, with one example ready.

## 📌 1. What is Next.js, and Why?

**Next.js is a React framework** — React gives you the UI library; Next.js adds the structure a real app needs around it:

| React alone gives you | Next.js adds |
|---|---|
| Components and state | **File-based routing** (no router config) |
| Client-side rendering only | **Server rendering options** (SSR / SSG / ISR) for SEO and speed |
| A separate backend for APIs | **API routes** inside the same project |
| Manual image/font optimisation | Built-in `Image`, `Font`, and build optimisations |

> [!IMPORTANT]
> **The one-line definition:** Next.js is a full-stack React framework that handles routing, rendering strategy, and API endpoints for you — so a React app can be SEO-friendly, fast on first load, and full-stack without a separate server project.

**Why companies pick it:** plain React renders in the browser, so search engines and social-media previews see an almost-empty page first. Next.js can send ready-made HTML from the server — better SEO, faster first paint, and happier users on slow phones.

Keep the definitions honest: React decides *what* the UI is; Next decides *where and when* it renders, how URLs map to it, and where the API lives. That division of labour is the answer to give before any feature list.

**🎤 What the interviewer actually asks:** *"What is Next.js? Why not just React?"* — answer: React is the library, Next.js is the framework around it (routing + rendering + APIs).

## 📌 2. File-Based Routing

In Next.js, **the folder structure IS the route table.** No route config file, no `<Route>` list — create a file, get a URL.

```text
app/
  page.tsx            →  /
  about/page.tsx      →  /about
  blog/[id]/page.tsx  →  /blog/123   ([id] = dynamic segment)
  blog/page.tsx       →  /blog
```

```tsx
// app/blog/[id]/page.tsx — reads the dynamic segment
export default async function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <h1>Post {id}</h1>;
}
```

> [!NOTE]
> **Dynamic routes use square brackets:** `[id]` matches any single segment and hands it to you as a param. A file named `page.tsx` (App Router) or the file itself (Pages Router) becomes a publicly reachable page — anything you don't want public doesn't go in the routing folders.

Layout files (`layout.tsx`) wrap pages with shared UI like a navbar, so it doesn't re-render on every navigation — mention this if asked "how do you share a header across pages?"

### Trace a URL to its file (the 20-second whiteboard skill)

Interviewers love asking "where does `/dashboard/settings` live?" Walk it folder by folder:

```text
URL: /dashboard/settings            → app/dashboard/settings/page.tsx
URL: /shop/shoes/red-sneakers       → app/shop/[category]/[slug]/page.tsx
URL: /                              → app/page.tsx
URL: /login                         → app/login/page.tsx   (no layout from dashboard/)
```

Rules that make the trace work: each URL segment is one folder; `page.tsx` is the leaf that actually renders; a `layout.tsx` in any folder wraps everything beneath it (so `app/dashboard/layout.tsx` gives every dashboard page the same sidebar, while `/login` outside that folder never sees it); square brackets capture that segment as a param. If you can narrate one URL down the folder tree and name which layouts wrap it, you've answered 90% of routing follow-ups.

> [!WARNING]
> **Common mistake:** putting components you never want routed inside `app/`. In the App Router, *every* folder with a `page.tsx` is public. Keep private helpers in a separate `components/` folder outside the route tree.

**🎤 What the interviewer actually asks:** *"How does routing work in Next.js?"* and *"How do you make a dynamic route like /blog/5?"*

## 📌 3. Pages Router vs App Router

Next.js has two router generations. You will see both in real codebases, so know the shape of each — keep it simple:

| | Pages Router (older) | App Router (current default) |
|---|---|---|
| Folder | `pages/` | `app/` |
| A route is | The file itself: `pages/about.tsx` | `page.tsx` inside a folder: `app/about/page.tsx` |
| Components default to | Client components | **Server Components** (render on server) |
| Data fetching | `getServerSideProps` / `getStaticProps` | Just `fetch` inside the component (`async` component) |
| Layouts | One `_app.tsx` wrapper | Nested `layout.tsx` per folder |
| Use it when | Maintaining an older project | Starting anything new |

> [!TIP]
> Interview-safe line: *"Pages Router is the original system in the `pages` folder; App Router in the `app` folder is the current default, built on Server Components. New projects use App Router, but plenty of production apps still run Pages Router."* That one sentence covers most follow-ups.

The mental model in one breath: Server Components run only on the server — they can `await` a database or `fetch` directly and ship zero JavaScript for themselves. Client Components (marked `"use client"`) run in the browser for interactivity like clicks and state. A real App Router page mixes both: a Server Component fetches the data, then hands it to a small Client Component that handles the buttons. Saying that sentence — server for data, client for interaction — answers most App Router follow-ups before they're asked.

**🎤 What the interviewer actually asks:** *"Pages Router or App Router — what's the difference?"* and *"What are Server Components in one line?"* (Components that run only on the server, so they can fetch data directly and ship zero JS to the browser.)

## 📌 4. Rendering Strategies — CSR vs SSR vs SSG vs ISR

The heart of Next.js. Every page picks *when* its HTML is made:

| Strategy | HTML is made | Freshness | Use it for |
|---|---|---|---|
| **CSR** — Client-Side Rendering | In the browser, after JS loads | Always live | Dashboards, logged-in pages (SEO doesn't matter) |
| **SSR** — Server-Side Rendering | On the server, **every request** | Always live | Personalised pages, feeds that change constantly |
| **SSG** — Static Site Generation | Once, at **build time** | Frozen until rebuild | Blogs, docs, marketing pages |
| **ISR** — Incremental Static Regeneration | At build, then **re-generated after a set interval** | Mostly fresh, still fast | Product pages, news, listings that update hourly |

```tsx
// ISR in one line — this page revalidates every 60 seconds
export const revalidate = 60;
```

> [!IMPORTANT]
> **How to choose in an interview:** ask two questions — "Does Google need to see this content?" and "How often does it change?" Rarely-changing + public → SSG. Public + changing → ISR. Personalised or always-live → SSR. Private/behind-login → CSR is fine.

> [!WARNING]
> SSR on *every* page is a common fresher mistake — it makes the server work on every visit and kills the speed benefit. Static wherever possible; server-render only what truly changes per user or per second.

### Same product page, three ways — what the user actually receives

Take one page, `/products/42`, and follow the HTML home in each mode:

With **CSR**, the server sends a nearly empty shell plus a JavaScript bundle. The browser downloads the JS, runs it, fires a fetch for product 42, and only then paints the product. First paint is a spinner; a search engine sees the shell. Fast to build, slow to *show*.

With **SSR**, the request itself triggers the work: the server fetches product 42, renders full HTML containing the real title, price, and image, and ships that. The user's first paint *is* the product; JavaScript then "hydrates" the static HTML so buttons become clickable. Every single visit repeats this server work, so it's always fresh but never free.

With **SSG**, the HTML was already built when you deployed — product 42's page is a finished file waiting on disk or a CDN. The request just serves that file, instantly, identically for everyone. Blazing fast, but if the price changed an hour ago, the page still shows the old one until the next build (or an ISR revalidation quietly rebuilds it).

Say it like this: "The strategies differ in *when* the HTML is made — browser after load, server per request, or once at build time — and that single timing choice decides freshness, speed, and SEO." Same page, three clocks. That sentence is the section.

**🎤 What the interviewer actually asks:** *"SSR vs SSG — what's the difference?"* and *"What is ISR?"* ISR is the one that impresses: "static speed, but the page quietly rebuilds itself after a time interval I set."

## 📌 5. Data Fetching — One Line Per Era

You don't need to memorise APIs, just the idea of each era:

- **Pages Router, per-request data:** `getServerSideProps` — runs on the server on every request, passes fresh data as props (that's SSR). Use for personalised/live pages.
- **Pages Router, build-time data:** `getStaticProps` — runs once at build, passes frozen data as props (that's SSG; add `revalidate` and it becomes ISR).
- **App Router (current):** no special functions — a Server Component is just `async` and can `await fetch(...)` directly, right inside the component.

```tsx
// App Router — this is the whole pattern
export default async function Products() {
  const res = await fetch("https://api.example.com/products");
  const products = await res.json();
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

> [!NOTE]
> Notice what's missing: no `useEffect`, no loading state juggling for the first render. Because the component runs on the server, the data is *already there* when the HTML ships. Client components still fetch the Pages-era way (hooks + fetch) when data depends on user interaction.

The same product list, fetched honestly in each world:

```tsx
// Pages Router — build time (SSG): runs once, result frozen into the page
export async function getStaticProps() {
  const products = await db.product.findMany();
  return { props: { products }, revalidate: 60 }; // + revalidate → ISR
}
// Pages Router — per request (SSR): runs on the server for *every* visit
export async function getServerSideProps() {
  const products = await db.product.findMany();
  return { props: { products } };
}
```

App Router collapses both into the component itself: plain `fetch` with default caching behaves like SSG, `fetch(url, { cache: "no-store" })` behaves like SSR, and adding `export const revalidate = 60` gives you ISR — the *intent* is identical, only the spelling changed. If an interviewer shows you the Pages spelling, translate it out loud ("that's build-time fetching, so SSG") and you've proven you understand the concepts, not just one syntax.

> [!WARNING]
> **Common mistake:** fetching initial page data in a Client Component with `useEffect` "because that's how React works." You re-create the CSR spinner problem inside a framework built to avoid it. Server-fetch the first paint; reserve client fetching for interactions (search-as-you-type, infinite scroll).

**🎤 What the interviewer actually asks:** *"How do you fetch data in Next.js?"* — name the era you're in: `getServerSideProps`/`getStaticProps` for Pages, plain `async` + `fetch` in Server Components for App Router.

## 📌 6. API Routes — A Backend in the Same Project

Next.js lets you write backend endpoints next to your frontend — no separate Express project for small backends:

```tsx
// app/api/users/route.ts (App Router "route handler")
export async function GET() {
  return Response.json([{ id: 1, name: "Ayushi" }]);
}
export async function POST(req: Request) {
  const body = await req.json();
  return Response.json({ created: body }, { status: 201 });
}
```

- Files under `app/api/.../route.ts` (or `pages/api/*.ts` in Pages Router) become endpoints: `GET`, `POST`, etc. are exported functions.
- They run **only on the server** — safe place for API keys, database calls, and secrets that must never reach the browser.
- Perfect for small backends, form handlers, webhooks, and BFF (backend-for-frontend) layers. A huge, separate API still deserves its own service.

**🎤 What the interviewer actually asks:** *"Can Next.js replace a backend?"* — for small-to-medium apps, yes: API routes are real server code in the same repo. You'd still split out a dedicated backend when the API outgrows the site.

Trace one request so the boundary is concrete:

```text
Browser → POST /api/users { name: "Ayushi" }
  → Next matches app/api/users/route.ts → runs POST() ON THE SERVER
  → Validate input → insert via DB client (password lives only in env)
  → Return Response.json({ id: 7 }, { status: 201 })
Browser receives JSON only — no SQL, no secrets, no server code
```

That round trip is why API routes are the safe home for secrets, validation, and database calls: the client requests, but never sees the machinery. Keep handlers thin (validate → service → respond) and a growing backend stays easy to lift into its own service later.

## 📌 7. `Link` and `Image` in One Line Each

- **`<Link>`** — client-side navigation without a full page reload (prefetches linked pages in the background, so clicks feel instant). Use it instead of `<a>` for internal pages.
- **`<Image>`** — Next's image component that auto-resizes, compresses, lazy-loads, and serves modern formats, so pages don't ship giant raw photos.

> [!TIP]
> These two are easy marks: if asked "what built-in optimisations does Next give you?", answering *"`<Link>` prefetches pages, `<Image>` optimises and lazy-loads images automatically"* is a complete fresher answer.

One concrete difference to keep in your pocket: a plain `<a href="/about">` throws the whole page away and reloads everything — HTML, CSS, JS, the navbar you already had. `<Link>` swaps only the page content, keeps shared layouts mounted, and quietly prefetches the target while the user is still reading. That's why Next navigations feel instant even on average networks.

```tsx
import Link from "next/link";
import Image from "next/image";

<Link href="/about">About</Link>                                    {/* internal navigation */}
<Image src="/profile.jpg" alt="Ayushi" width={400} height={300} />  {/* optimised image */}
```

Why not the plain tags you already know? A raw `<a>` reloads the whole document on every click — the browser fetches the page again, re-runs the shared layout, and repaints everything, so even a tiny navigation feels like arriving at a brand-new website. A raw `<img>` ships the file exactly as saved: a 4 MB phone photo goes to every visitor, at full size, the moment the page loads, whether they ever scroll down to it or not. `<Link>` and `<Image>` exist to remove those two specific costs — navigation that feels instant, and images sized, compressed, and lazy-loaded for the device asking.

> [!WARNING]
> **Common traps:** `<Image>` needs `width` and `height` (or `fill` inside a sized parent) — those numbers also reserve space on the page, so the layout does not jump while the image loads. And use `<Link>` for *internal* pages, where prefetching pays off; an external URL gets no prefetch benefit, so a plain link is fine there.


## 📌 8. When to Choose Next.js over Plain React (and When NOT To)

**Choose Next.js when:**

- The pages are **public and SEO matters** — landing pages, blogs, e-commerce, listings.
- You want **one project for frontend + small backend** (API routes) instead of two deployments.
- First-load speed matters — server-rendered or static HTML beats a blank loading spinner.
- You need a mix: static marketing pages + dynamic dashboard in one app.

**Stick to plain React (e.g. Vite) when:**

- It's a **fully private app** — admin panels, internal tools behind login. No SEO, no public pages; Next's server machinery is overhead you don't need.
- It's a tiny widget or a single interactive tool embedded in another site.
- Your team only needs a simple SPA and already has a separate backend API.

> [!IMPORTANT]
> **The balanced interview answer:** "Next.js when the site is public, content-driven, or needs a light backend in the same repo. Plain React when it's a private, app-like tool where SEO doesn't matter and a framework's server features would just be weight."

An honest side-by-side to say out loud — including where plain React genuinely wins:

| Question | Plain React (Vite) | Next.js |
|---|---|---|
| Who sees the first paint? | A spinner until JS + fetch finish | Real HTML immediately (SSR/SSG) |
| SEO / social previews | Poor — crawlers get an empty shell | Strong — content is in the HTML |
| Routing | You install and configure a router | Folders are routes, zero config |
| Backend | Separate project (Express, etc.) | API routes in the same repo |
| Cost of ownership | Tiny, fully client-side, cheap static hosting | Server rendering costs compute per request (SSR) |
| Best habitat | Private dashboards, internal tools, embedded widgets | Public sites, stores, blogs, mixed apps |

The fresher trap is claiming Next.js is "just better." Interviewers reward the conditional answer: reach for the framework when the public, content, or SEO requirements pay for its server — and happily ship plain React when they don't.

**🎤 What the interviewer actually asks:** *"Would you use Next.js for every project?"* — No, and the reason (private apps don't need server rendering) is exactly what they want to hear.

---

## 🎤 Mock Interview Questions — Next.js

Practice saying these **out loud** — short, correct, then stop. Let them ask the follow-up.

**1. What is Next.js, and why use it over plain React?**
> Next.js is a framework built on top of React — React gives me components, Next adds routing, server-side rendering options, and API routes in the same project.
> I use it when a site is public and SEO or first-load speed matters, because it can send ready-made HTML instead of an empty page that fills in later.

**2. How does routing work in Next.js?**
> It's file-based — the folder structure is the route table, so I don't write any route configuration.
> A folder with a page file becomes a URL, and a folder in square brackets like `[id]` becomes a dynamic route whose value I get as a param.

**3. Pages Router vs App Router — what's the difference?**
> Pages Router is the older system where each file in the `pages` folder is a route and I fetch data with functions like `getServerSideProps`.
> App Router is the current default — routes live in the `app` folder, components are Server Components by default, and I can just `await fetch` inside the component.

**4. What is the difference between SSR, SSG, and CSR?**
> CSR renders in the browser after the JavaScript loads — fine for logged-in dashboards, bad for SEO. SSR builds the HTML on the server for every request, so it's always fresh and search engines see real content.
> SSG builds the HTML once at build time — fastest, but frozen until I rebuild, so I use it for blogs and docs that rarely change.

**5. What is ISR?**
> ISR is SSG with a refresh timer — the page is static and fast, but Next quietly regenerates it after an interval I set, like every 60 seconds.
> I use it for pages that are public but change regularly, like product listings, where pure SSG would go stale and SSR would be slower than needed.

**6. How do you fetch data in the App Router?**
> In a Server Component I make the component `async` and `await fetch` directly inside it — no `useEffect` and no special Next functions.
> The data is fetched on the server, so the HTML that reaches the user already has the content in it.

**7. Can Next.js replace a backend? What are API routes?**
> For small to medium apps, yes — files under the api folder become real server endpoints where I export GET and POST handlers.
> They run only on the server, so that's where I keep secrets and database calls. I'd split out a separate backend only when the API grows big enough to need its own service.

**8. When would you NOT use Next.js?**
> When the app is fully private — like an internal admin tool behind a login — SEO and server rendering buy me nothing and the framework is just overhead.
> For that I'd use plain React with Vite; I save Next.js for public, content-driven sites or when I want a light backend in the same repo.

---

## ✅ 60-Second Revision Checklist

If you can say each line out loud the morning of an interview, you're ready.

- [ ] **Next.js = React framework** — routing + rendering choices + API routes around the React library
- [ ] **File-based routing** — folders are URLs; `[id]` = dynamic segment; `layout.tsx` = shared wrapper UI
- [ ] **Pages vs App Router** — `pages/` + `getServerSideProps`/`getStaticProps` vs `app/` + Server Components + direct `fetch`
- [ ] **CSR** — renders in browser; private/dashboards • **SSR** — HTML per request; always fresh
- [ ] **SSG** — HTML at build time; blogs/docs • **ISR** — SSG + `revalidate` timer; best of both for listings/news
- [ ] **Choosing a strategy** — public + rarely changes → SSG; public + changes → ISR; per-user/live → SSR; logged-in → CSR
- [ ] **Data fetching** — Pages era: `getServerSideProps` (per request) / `getStaticProps` (build time); App era: `async` component + `await fetch`
- [ ] **API routes / route handlers** — server-only endpoints in the same repo; export `GET`/`POST`; secrets live here
- [ ] **`<Link>`** — instant client-side navigation with prefetching • **`<Image>`** — auto-optimised, lazy-loaded images
- [ ] **When NOT Next** — fully private/internal apps and tiny widgets: plain React (Vite) is lighter

---

> ✍️ *Notes compiled by **Ayushi Singh** — from my own full-stack interview preparation. If these helped you, ⭐ the repo and share it with a friend who's preparing too.*
