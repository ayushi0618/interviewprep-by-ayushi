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

### Flexbox vs Grid (2 lines)

- **Flexbox** = one-dimensional layout — arrange items in a row *or* a column (navbars, button groups, centering).
- **Grid** = two-dimensional — rows *and* columns together (photo galleries, dashboards, page layouts).

### `position` values

| Value | Behaviour |
|---|---|
| `static` | Default — normal document flow, top/left have no effect |
| `relative` | Offset from its own normal position; also the anchor for absolute children |
| `absolute` | Removed from flow; positioned relative to nearest positioned ancestor |
| `fixed` | Positioned relative to the viewport; stays put on scroll (sticky headers) |
| `sticky` | Scrolls normally until it hits a threshold, then sticks |

### Specificity (one line)

When rules conflict, the winner is decided by weight: **inline styles > IDs > classes/attributes > elements** — and if still tied, the later rule in the file wins.

### Responsive design

Design so the page works on every screen size — fluid widths (`%`, `fr`, `rem`), flexible images, and **media queries** that change layout at breakpoints:

```css
.card-container { display: grid; grid-template-columns: repeat(3, 1fr); }

@media (max-width: 768px) {
  .card-container { grid-template-columns: 1fr; } /* single column on mobile */
}
```

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
