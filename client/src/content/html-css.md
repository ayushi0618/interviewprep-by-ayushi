# 🎨 HTML/CSS — Quick Notes

> [!NOTE]
> These are **rapid-revision notes**. Every concept here is written as a 30-second interview answer — short, correct, and easy to say out loud. Revise this file the morning of your interview.

---

## 🎨 HTML/CSS Quick Notes

### Semantic HTML

Tags like `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>` describe the *meaning* of content, not just its look. They matter for **SEO**, **screen readers (accessibility)**, and code readability — a `<nav>` tells everyone "navigation lives here", a `<div>` tells nothing.

### The Box Model

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

### Flexbox vs Grid (2 lines)

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

### `position` values

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

### Specificity (one line)

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

### Responsive design

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

### 🎤 Quick Q&A — HTML/CSS

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
