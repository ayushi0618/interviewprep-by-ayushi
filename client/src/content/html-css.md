# 🎨 HTML/CSS — Quick Notes

> [!NOTE]
> These are **rapid-revision notes**. Every concept here is written as a 30-second interview answer — short, correct, and easy to say out loud. Revise this file the morning of your interview.

---

## Semantic HTML

Tags like `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>` describe the *meaning* of content, not just its look. They matter for **SEO**, **screen readers (accessibility)**, and code readability — a `<nav>` tells everyone "navigation lives here", a `<div>` tells nothing.

**Why it actually matters — say it like this:**

A browser, a search engine, and a screen reader all read your HTML before they ever see your CSS. If everything is a `<div>`, they see a pile of anonymous boxes and have to guess what is what. Semantic tags remove the guessing:

- **Accessibility:** a screen reader can jump straight to `<main>` or list all the links inside `<nav>` ("landmark navigation"). A `<div class="nav">` gives it nothing to announce.
- **SEO:** search engines weight headings and `<main>` content more heavily than footer boilerplate, because the tags tell them where the real content lives.
- **Readability:** you can skim semantic HTML and understand the page in ten seconds, without opening the stylesheet.

**The same header, two ways:**

```html
<!-- Div soup — works, but means nothing -->
<div class="header">
  <div class="nav">
    <div class="logo">MySite</div>
  </div>
  <div class="main-content">
    <div class="post">...</div>
  </div>
</div>

<!-- Semantic — same layout, now it describes itself -->
<header>
  <nav>
    <a class="logo" href="/">MySite</a>
  </nav>
</header>
<main>
  <article>...</article>
</main>
```

Both versions can look pixel-identical with CSS. The second one is the one you defend in an interview, because the markup now carries meaning even with the CSS stripped away.

**How to choose the right tag (quick mental test):**

- Is it the top banner or intro of the page/section? → `<header>`
- Is it a set of navigation links? → `<nav>`
- Is it the one main story of the page (only one per page)? → `<main>`
- Could this block be lifted out and still make sense alone (blog post, card, comment)? → `<article>`
- Is it a thematic chunk of a bigger page? → `<section>`
- Is it closing info — copyright, contact, small print? → `<footer>`

**Common mistakes interviewers love to catch:**

- Building the whole page from `<div>` and `<span>` and calling it done — valid HTML, zero semantics.
- Using more than one `<main>` on a page, or putting `<main>` inside a `<header>`/`<footer>` — there is exactly one main landmark.
- Choosing a tag for how it *looks* ("`<article>` makes it bold, right?") — tags carry meaning; CSS carries looks. If you pick by appearance, the semantics are already wrong.
- Skipping heading order (`<h1>` then jumping to `<h4>`) — screen readers build a document outline from headings, so a broken outline is a broken experience.

## The Box Model

Every element is a box of four layers:

```
┌─────────────────────────────┐
│           MARGIN            │  space OUTSIDE the box (gap from neighbours)
│  ┌───────────────────────┐  │
│  │        BORDER         │  │  the visible edge
│  │  ┌─────────────────┐  │  │
│  │  │     PADDING     │  │  │  space INSIDE, around content
│  │  │  ┌───────────┐  │  │  │
│  │  │  │  CONTENT  │  │  │  │  text / image itself
│  │  │  └───────────┘  │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

> [!TIP]
> Set `box-sizing: border-box;` globally — then `width` includes padding and border, so layout math becomes predictable. This is the first thing interviewers expect you to know about the box model.

**Box model with real numbers (memorise this one example):**

Take a box with `width: 100px`, `padding: 10px` on each side, `border: 5px` on each side, `margin: 10px` on each side.

| Mode | Maths | Result |
|---|---|---|
| Default `content-box` | Content stays 100px; add padding 10+10 and border 5+5 → 100 + 20 + 10 | Box renders **130px wide** (150px footprint with margins) — your "100px" box surprises you |
| `border-box` | `width` means the *whole* box: 100px total; content shrinks to 100 − 20 − 10 | Box renders **exactly 100px** (120px footprint with margins) — padding/border eat *inwards* |

Say it like this: "With `content-box`, padding and border grow the box beyond `width`. With `border-box`, `width` is the final size and the content area shrinks. Margins always sit outside in both modes." That last line about margins is the follow-up trap — margins never join the width maths.

## Flexbox vs Grid (2 lines)

- **Flexbox** = one-dimensional layout — arrange items in a row *or* a column (navbars, button groups, centering).
- **Grid** = two-dimensional — rows *and* columns together (photo galleries, dashboards, page layouts).

**Flexbox traced — what each property does to 3 boxes:**

Picture a parent strip containing 3 small boxes in a row (like navbar links). Start: parent is a normal block, so the 3 boxes stack vertically, each full width. Now add properties one by one and watch:

1. You set `display: flex` on the parent → the 3 boxes jump into **one horizontal row**, shrink to fit their content, and line up at the left. Row is the default direction.
2. You add `justify-content: center` → the whole group slides to the **middle** of the strip (main axis = horizontal here). Change it to `space-between` → first box hugs the left edge, last box hugs the right edge, middle box sits centred in the leftover space.
3. You add `align-items: center` → the boxes align **vertically** (cross axis). If box 2 is taller, boxes 1 and 3 now centre against it instead of sitting on the top edge.
4. You add `gap: 12px` → clean 12px breathing space appears between boxes — no margin hacks on each child.
5. You set `flex: 1` on each box → each box **grows equally** to share all free space; the 3 boxes now fill the strip edge to edge.
6. You switch to `flex-direction: column` → the row becomes a **vertical stack** again, but now `justify-content` controls vertical spacing and `align-items` controls horizontal alignment — the axes swap.

> [!NOTE]
> The one sentence that unlocks every flexbox answer: "`justify-content` works along the main axis, `align-items` along the cross axis — and `flex-direction` decides which axis is which." Say that, and any follow-up (centering, spacing, wrapping) answers itself. Add `flex-wrap: wrap` when boxes should drop to the next line on narrow screens instead of crushing.

```visual flexbox
```

## `position` values

| Value | Behaviour |
|---|---|
| `static` | Default — normal document flow, top/left have no effect |
| `relative` | Offset from its own normal position; also the anchor for absolute children |
| `absolute` | Removed from flow; positioned relative to nearest positioned ancestor |
| `fixed` | Positioned relative to the viewport; stays put on scroll (sticky headers) |
| `sticky` | Scrolls normally until it hits a threshold, then sticks |

**Each value as a tiny scene (so you never mix them up):**

- `static` — a normal paragraph under a heading. You set `top: 50px` and *nothing happens* — static ignores offsets completely.
- `relative` — a "NEW" badge nudged with `top: -4px; left: 6px` from where it would normally sit. It moves, but its original empty space stays in the layout — neighbours don't shift.
- `absolute` — a red notification dot pinned to the top-right corner of a profile photo. The photo's wrapper is `relative` (the anchor); the dot is `absolute` and positions itself against that wrapper, completely out of the normal flow.
- `fixed` — the top navigation bar. You scroll 2,000px down a long article; the bar is still at the top of the screen because it's fixed to the viewport, not the page.
- `sticky` — a section heading with `top: 0`. It scrolls up normally, *sticks* at the top while you read its section, then scrolls away when the next section pushes it off. Fixed's polite cousin.

**Why positioning exists at all:**

Normal flow stacks boxes top-to-bottom, left-to-right. Positioning is your controlled way to *break* that flow — pull one element out, nudge it, pin it, or let it stick. Every positioning question is really asking: "taken out of the flow, and measured from *what*?"

| Value | In the flow? | Offset measured from |
|---|---|---|
| `static` | Yes | — (offsets ignored) |
| `relative` | Yes (space kept) | Its own normal spot |
| `absolute` | No (space gone) | Nearest ancestor with `position` set (not `static`) |
| `fixed` | No | The viewport |
| `sticky` | Yes, until it sticks | Its parent, switching at the threshold |

**A tiny example you can write from memory:**

```css
.card   { position: relative; }   /* the anchor */
.badge  { position: absolute;     /* pinned to .card, not the page */
          top: 8px; right: 8px; }
.navbar { position: fixed;        /* glued to the viewport */
          top: 0; left: 0; right: 0; }
.section-title { position: sticky; /* scrolls, then sticks at 60px */
                 top: 60px; }
```

Read it out loud like this: "The card is `relative` so it becomes the anchor; the badge is `absolute` and positions against the card; the navbar is `fixed` to the viewport; the section title is `sticky` and sticks below the navbar."

**Common mistakes:**

- Setting `top`/`left` on a `static` element and wondering why nothing moves — `static` ignores offsets entirely; you need `relative` at minimum.
- Using `absolute` without giving any ancestor `position: relative` — the element then positions against the *page*, which is almost never what you wanted.
- Forgetting that `absolute` and `fixed` remove the element from flow, so following content slides up underneath it — plan the space, don't act surprised.
- Using `fixed` for a footer on mobile — it floats over your content and eats half the screen. `sticky` is usually the kinder choice.

## Specificity (one line)

When rules conflict, the winner is decided by weight: **inline styles > IDs > classes/attributes > elements** — and if still tied, the later rule in the file wins.

**Specificity scored — work these two by hand once:**

Every selector gets a score written as (IDs, classes, elements) — count what you see:

- Selector `.card p` → 0 IDs, 1 class (`.card`), 1 element (`p`) → score **(0, 1, 1)**
- Selector `div span` → 0 IDs, 0 classes, 2 elements (`div` + `span`) → score **(0, 0, 2)**

Head-to-head, **(0, 1, 1) wins** over (0, 0, 2). Compare left to right: IDs tie at 0, then classes decide it — 1 beats 0, so the elements column is never even reached. One class outweighs *any* number of elements.

More scores to recognise instantly:

- `p` alone → (0, 0, 1) — weakest common selector
- `.btn` alone → (0, 1, 0) — one class beats ten elements, e.g. (0, 0, 10) still loses
- `#header` alone → (1, 0, 0) — one ID beats ten classes; scores compare column-by-column, never added up like 11 > 1
- Inline `style` attribute → beats all of the above without a score fight

> [!WARNING]
> The classic trap: "Is `div div div p` stronger than `.title`?" No — (0, 0, 4) still loses to (0, 1, 0). And if two selectors score exactly equal, the one written **later** in the CSS file wins. Reach for `!important` only when you truly must — it breaks this whole system and interviewers know it.

**Why specificity exists — the 10-second version:**

Without a tie-breaker, two rules styling the same element would fight unpredictably. Specificity is the browser's referee: it always applies the same scoring, so the result is deterministic. Your job as the developer is to *predict* the referee — write selectors just specific enough to win where you mean to, and no more.

**See the fight happen:**

```css
p               { color: black; }  /* (0,0,1) */
.card p         { color: grey; }   /* (0,1,1) — wins over the line above */
#hero .card p   { color: maroon; } /* (1,1,1) — wins over both */
```

All three target the same paragraph inside the hero card. The browser scores each, and `maroon` wins — not because it is written last, but because it scores highest. Move the rules around in the file and the winner does not change; only the score matters, until two scores tie exactly — then file order breaks the tie.

**Common mistakes:**

- Trying to "add it up" — treating (0, 0, 11) as bigger than (0, 1, 0) because 11 > 1. Columns never roll over into each other; compare left to right and stop at the first difference.
- Reaching for `!important` to win a fight you're losing — it wins today and breaks every future override. Fix the selector instead.
- Using an ID selector for something that appears many times (`#card` on twenty cards) — IDs must be unique per page, and they paint you into a specificity corner you can't easily override.

## Responsive design

Design so the page works on every screen size — fluid widths (`%`, `fr`, `rem`), flexible images, and **media queries** that change layout at breakpoints:

```css
.card-container { display: grid; grid-template-columns: repeat(3, 1fr); }

@media (max-width: 768px) {
  .card-container { grid-template-columns: 1fr; } /* single column on mobile */
}
```

**Responsive walkthrough — shrink the window slowly and say what changes:**

1. **Desktop, 1200px wide:** the base rule applies — 3 equal cards in one row, each `1fr` of the container. Plenty of room, nothing special happens.
2. **Tablet, around 800px:** still 3 columns (the media query hasn't fired yet), but each `1fr` is narrower, so cards squeeze and text wraps to more lines. Layout holds; breathing room shrinks.
3. **The breakpoint hits at 768px:** the moment width drops to 768px or below, the `@media (max-width: 768px)` block switches on and overrides the columns to a single `1fr` column.
4. **Phone, 375px wide:** cards now stack vertically, each full width — big tap targets, no horizontal scrolling, no pinching to read. One thumb-scroll replaces the row.

That is the whole responsive story in an interview: "Base styles for large screens, fluid units like `fr` and `%` so things shrink gracefully, then a media query at a breakpoint (768px is the common tablet/phone split) that restacks the layout for small screens — and I test by actually resizing the browser and on a real phone." Never say "I use Bootstrap" as your responsive answer; describe the mechanism.

**Why this matters — the interview framing:**

More than half your users are on a phone. A layout fixed at 1200px doesn't just look bad on a 375px screen — it forces sideways scrolling, tiny tap targets, and unreadable text, and people leave. Responsive design is not a polish step; it is the default way you build, so one codebase serves every screen.

**How it works — three layers, in order:**

1. **Fluid by default:** sizes in `%`, `fr`, `rem`, and `max-width` (instead of fixed `px`) so boxes shrink and grow with their container instead of overflowing it. Images get `max-width: 100%` so they never spill out.
2. **Flexible layout:** Flexbox and Grid reflow content automatically — a Grid with `1fr` columns squeezes gracefully long before anything breaks.
3. **Breakpoints where the design *breaks*:** a media query like `@media (max-width: 768px)` is not "for tablets" — it's "below this width, this layout stops working, so switch to this one." You add a breakpoint where you *see* the layout fail, not at a device name.

**One more example — a navbar that becomes a stack:**

```css
.navbar { display: flex; gap: 20px; }          /* row on wide screens */

@media (max-width: 600px) {
  .navbar { flex-direction: column;            /* stack on narrow screens */
            gap: 8px; }
}
```

Same elements, no duplicated markup — only the arrangement changes at the breakpoint.

**Common mistakes:**

- Designing desktop-first, then squeezing a broken mobile view in at the end — start from the small screen (mobile-first: base styles for narrow, `min-width` queries to enhance) and the wide view becomes the easy part.
- Using fixed pixel widths everywhere (`width: 1100px`) so the page overflows the moment the window is smaller — fluid units first, pixels only where a size must never change.
- Forgetting the viewport meta tag (`<meta name="viewport" content="width=device-width, initial-scale=1">`) — without it, phones render the page zoomed-out as if it were 980px wide and your media queries never get a fair chance.
- Testing only by dragging the browser window — resize tests catch a lot, but text scaling, touch targets, and real device widths only show up on an actual phone or device emulation.

## 🎤 Quick Q&A — HTML/CSS

**Q1. Block vs inline elements?**
Block elements (`div`, `p`, `h1`) start on a new line and take full width; inline elements (`span`, `a`) sit in the flow and only take the width they need. `inline-block` is the middle ground — inline placement, but width/height apply.

**Q2. How do you center a div?**
With flexbox on the parent: `display: flex; justify-content: center; align-items: center;` — the modern standard answer.

**Q3. `display: none` vs `visibility: hidden`?**
`display: none` removes the element from layout entirely; `visibility: hidden` hides it but keeps its space.

**Q4. What is z-index?**
It controls stacking order of overlapping elements — higher value sits on top. It only works on positioned elements (`relative`/`absolute`/`fixed`/`sticky`).

**Q5. `<div>` vs `<section>` vs `<article>`?**
`<div>` is a generic container with no meaning; `<section>` groups related content; `<article>` is standalone, self-contained content like a blog post or card that makes sense on its own.

---

---

## ✅ 60-Second Revision Checklist

Before you walk in, be able to say each of these without pausing:

- [ ] Box model: margin → border → padding → content; `border-box` makes width predictable
- [ ] Flexbox = 1D, Grid = 2D; center with flex `justify-content` + `align-items`

> [!TIP]
> Interviewers don't expect textbook depth in extras — they expect *confidence*. Answer in one or two lines, then stop. If they want more, they'll ask.
