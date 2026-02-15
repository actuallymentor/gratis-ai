# Sensory Design Prescriptions for Software Development

> Actionable rules for building interfaces that work with the human nervous system. No theory — just what to do and why it matters. When a rule says "do X," it means the perceptual science is settled enough to treat it as engineering constraint, not opinion.

---

## Vision

### Edges & Boundaries
- To make a UI element register as a distinct object, give it a **sharp, well-defined boundary**. Blurred or gradient-only edges force the visual system to work harder before the user even reads content.
- To draw attention to something outside the user's current focus, use **one** of: color change, size change, motion, or orientation shift. Using one of these in isolation makes it pop out instantly. Combining multiple (e.g., small + red among large-red and small-blue) defeats the pop-out effect and forces slow scanning.
- To avoid overwhelming the pop-out system, limit yourself to **one pre-attentive channel per priority level**. If errors are red, don't also make warnings red-but-smaller — use a different channel entirely (e.g., shape or position).

### Layout & Grouping
- To make elements feel related, **put them closer together**. Proximity is the strongest grouping signal and overrides color and shape similarity. A form label equidistant between two fields belongs to neither.
- To create an unambiguous group, **enclose elements in a shared boundary** (card, box, highlighted region). This overrides all other grouping signals, including proximity.
- To establish a stable, trustworthy layout, **use symmetry as your default**. To then draw attention to a specific element, **break the symmetry deliberately** — an asymmetric call-to-action against a symmetric layout will pop.

### Peripheral Vision
- To ensure critical messages aren't missed, **place them within ~2.5cm of the user's current focus point** (at typical monitor distance). The eye can only resolve fine detail in a surprisingly small area.
- To alert users to events outside their focus, **use motion or color flash** — peripheral vision detects motion reliably but cannot read text. A pulsing icon at the screen edge works; a static text banner does not.

---

## Color

### Contrast
- To make any two elements visually separable, **ensure they differ in brightness, not just hue**. Two different colors at the same brightness will blur together for the edge-detection system. Luminance contrast is the primary driver of visual separation.
- To meet minimum accessibility for body text, achieve a **luminance contrast ratio of 4.5:1**. For large text (18pt+ or 14pt+ bold), **3:1** is sufficient. For enhanced accessibility, target **7:1**.
- To check your assumptions: pure red (#FF0000) on white is only 4:1. Pure green (#00FF00) on white is **1.4:1** — it fails everything. Pure blue (#0000FF) on white is 8.6:1. Test your actual palette; intuition is unreliable here.
- To account for light-on-dark vs. dark-on-light asymmetry, be aware that the same contrast ratio feels different depending on polarity. Light text on dark backgrounds needs slightly higher ratios to feel equivalent. The APCA algorithm (WCAG 3.0 draft) handles this — consider adopting it early.

### Blue
- To avoid fuzzy, vibrating text, **never use blue for fine detail, small text, or thin lines**. The eye has very few blue-sensitive receptors (none in the sharpest central region), and the lens refracts blue light differently, causing red and blue elements to appear at different depths.
- To use blue safely, **reserve it for fills, backgrounds, and large shapes** where spatial precision doesn't matter.

### Color Blindness
- To ensure ~8% of male users (and ~0.5% of female users) can use your interface, **never encode information in color alone**. Always pair color with a redundant signal: shape, pattern, icon, position, or text label.
- To specifically avoid the most common failure, **don't rely on red vs. green distinction** for status indicators, success/error states, or diff highlighting without a secondary cue. Red-green deficiency is the overwhelming majority of color blindness.

### Emotional Color Use
- To create a sense of urgency or alertness, use **red or warm, high-saturation colors** — these measurably increase physiological arousal.
- To create calm, use **blue or cool, low-saturation colors**.
- To avoid embarrassment, **stop there**. Claims beyond "red = arousing, blue = calming" are weakly supported and heavily culture-dependent. Don't over-index on color psychology charts.

---

## Typography

### Font Selection
- To choose between serif and sans-serif, **pick either** — there is no measurable legibility difference when other variables are controlled. The perceived serif advantage comes from the increased letter spacing serifs impose, not the serifs themselves.
- To maximize legibility, prioritize fonts with: **large x-height** (lowercase 'x' is tall relative to capitals), **clear differentiation of confusable characters** (1/I/l, 0/O/o, rn/m), and **consistent stroke width**.
- To avoid assuming user preference equals performance, note that roughly 1 in 4 people read slowest in their self-reported "preferred" font. Test with performance data, not preference surveys.

### Text Layout
- To prevent users from skipping lines or losing their place, keep body text at **45-75 characters per line** (~66 is ideal). Lines wider than 80 characters are skipped dramatically more often.
- To set comfortable line spacing, use **1.5× the font size** for body text. Tighter than 1.4× noticeably increases reading effort.
- To set comfortable letter spacing, use **≥0.12em**. To set word spacing, use **≥0.16em**. These are WCAG 1.4.12 minimums, and they benefit all users, not just those with accessibility needs.
- To set paragraph spacing, use **≥2× the font size** between paragraphs.

### Dyslexia (5-10% of users)
- To support dyslexic readers, **increase letter spacing** — this is the single most effective intervention, dramatically improving both speed and accuracy. It also has zero negative impact on non-dyslexic readers.
- To avoid harming dyslexic readers, **do not use italic text for body content**. Italics significantly impair dyslexic reading.
- To choose a dyslexia-friendly typeface, use **Helvetica, Arial, Verdana, or Courier**. Do not use "dyslexia fonts" like OpenDyslexic or Dyslexie — they do not improve reading performance and users generally prefer standard fonts.
- To provide a user-configurable reading experience, expose **font size, letter spacing, and line height as user settings**. This accommodates both dyslexic users and the significant individual variation in optimal reading parameters across all users.

---

## Sound

### Frequency Selection
- To make a sound noticeable but pleasant, target **300-1,500 Hz** for routine UI feedback (confirmations, selections, transitions).
- To make a sound urgent and unmissable, use **2,000-4,000 Hz** — but reserve this strictly for genuine warnings. This frequency range is maximally sensitive to the human ear *and* maximally annoying. Overuse causes users to mute your app entirely.

### Sound Design
- To make a sound intuitively meaningful, map it to a real-world analogue (crumple for delete, click for toggle, whoosh for send). Users learn these instantly.
- To create abstract sound categories (different alert levels, notification types), use **distinct musical timbres** rather than pitch changes alone. Timbre-based sounds achieve ~80% recognition; pitch-alone differences are much harder to learn.
- To maximize both recognition accuracy and reaction speed, prefer **short speech cues or sped-up speech** over abstract tones when the vocabulary is small enough (e.g., "sent," "error," "done").

### Notification Discipline
- To avoid degrading user concentration, understand that **merely receiving a notification sound — without responding — measurably increases error rates** on whatever the user was doing. Every notification has a cognitive cost.
- To avoid your notifications being tuned out, **keep them rare and meaningful**. The same desensitization that causes ICU nurses to ignore 95% of clinical alarms will cause your users to ignore yours.
- To respect user autonomy, **always make all sounds configurable and independently mutable**. Some users have strong negative reactions (misophonia) to sounds others find satisfying.

### Satisfying Audio Feedback
- To create a sound that feels "good" (toggle click, completion chime), use **short duration, crisp onset, harmonic consonance, and moderate volume**. These properties activate reward circuits similar to the response people have to ASMR triggers.
- To avoid the uncanny valley of sound, **don't add audio feedback to interactions where users don't expect it**. Sound on a toggle switch: satisfying. Sound on every scroll event: maddening.

---

## Haptics

### Vibration Design
- To create a satisfying "click" feeling, use **short, crisp taps in the 150-250 Hz range at moderate amplitude**. This is the peak sensitivity range for the skin's vibration receptors.
- To create a calm or gentle sensation, target **frequencies below 150 Hz**.
- To create an alert or urgent sensation, target **frequencies above 200 Hz with higher amplitude**.
- To reduce cognitive load on a visually demanding task, **add haptic feedback**. Touch uses a separate cognitive channel from vision — it supplements rather than competes.

### Platform-Specific Implementation
- On **iOS**: use `UIImpactFeedbackGenerator` for physical impacts (button presses, collisions), `UISelectionFeedbackGenerator` for picker/selection changes, `UINotificationFeedbackGenerator` for success/warning/error outcomes. Use Core Haptics for custom patterns. The Taptic Engine operates at ~110-130 Hz with a range of ~80-230 Hz.
- On **Android**: use `HapticFeedbackConstants` for cross-device consistency. Prefer the predefined constants over raw vibration patterns — hardware varies enormously across OEMs. Favor "rich and clear" over "buzzy."
- To avoid jarring platform inconsistency, **accept that Android haptics will feel different from iOS haptics** and design around the predefined system patterns rather than trying to match them cross-platform.

### Restraint
- To avoid phantom vibration syndrome (experienced by 78-89% of smartphone users), **use haptics sparingly**. Frequent vibrations condition the brain to hallucinate vibrations when none occur.
- To avoid haptic fatigue and desensitization, **reserve haptics for moments of meaningful state change**: successful actions, errors, selection confirmations, and boundary warnings. Do not use haptics for scrolling, hovering, or passive content loading.
- To support users with sensory processing sensitivities, **always provide a setting to disable haptics entirely**, independent of sound settings.

---

## Spatial Consistency & Animation

### Preserve the Mental Map
- To avoid disorienting users, **keep navigation elements, key actions, and structural landmarks in consistent positions across all screens**. Users build spatial memory of your interface and navigate by muscle memory. Moving things forces expensive cognitive remapping.
- To respect learned spatial behavior, **never rearrange a layout users have already internalized** without an extremely compelling reason and a clear migration path.

### Touch Targets
- To make targets easy to hit, follow Fitts's Law: **make frequent targets large and close to the user's current position**. A target twice as far away takes measurably longer to reach.
- To set minimum touch target sizes, use **44×44pt (iOS) or 48×48dp (Android)**.
- To exploit screen geometry, place the most common actions near **screen edges or corners** — the edge acts as an infinite boundary that prevents overshooting, making these the fastest possible targets.

### Animation Rules
- To maintain spatial continuity during transitions, **animate elements from their origin to their destination**. Without animation, layout changes feel like teleportation and break the user's sense of where they are.
- To choose the right transition type: use **container transforms** when an element expands into a new view, **shared axis** when navigating within a hierarchy, **fade through** for unrelated views, and simple **fades** for appearing/disappearing elements.
- To avoid wasting cognitive resources, **never use decorative animation**. Every animation should communicate spatial relationship, state change, or causal connection. Animations that serve no informational purpose measurably reduce retention of surrounding content.
- To make animations feel natural, bias toward **slightly slower than you think necessary**. The brain expects stimuli to move slowly, and animations that overshoot this expectation feel jarring.

---

## Cognitive Load

### Working Memory
- To avoid overwhelming users with choices, present **≤4 unchunked options** at once. This is the realistic capacity of focused attention for novel information. If you must present more, organize them into meaningful groups (chunks) first.
- To speed up decision-making, **reduce the number of visible options**. Doubling the options doesn't double decision time (it's logarithmic), but it does increase it. Moving from 16 options to 4 saves roughly 300ms of pure decision overhead — and far more in perceived complexity.

### Multimodal Design
- To add feedback to a visually demanding task, **use a different sensory channel** (haptic or audio). Pairing information across separate channels improves performance. Pairing two pieces of visual information degrades it.
- To make cross-modal feedback effective, **ensure it aligns in time and space**. A button that produces a haptic click 200ms after the visual response feels broken, not enhanced. Simultaneity is essential.

### Reducing Extraneous Load
- To maximize comprehension and retention, **eliminate every visual element that doesn't serve the user's current task**. Auto-playing videos, decorative animations, and unnecessary modals all tax the same working memory pool the user needs for their actual goal.
- To avoid banner blindness, **do not place important content in banner-shaped containers, standard ad positions, or with banner-like styling** (bright background, horizontal strip at top or bottom, animated). Users have learned to actively suppress anything that pattern-matches to advertising, even if it contains critical information.

---

## Time Perception

### Response Time Targets
- To feel instantaneous (direct manipulation), respond in **<100ms**.
- To maintain conversational flow, respond in **<1 second**.
- To avoid losing the user entirely, never exceed **10 seconds** without feedback.

### Making Waits Feel Shorter
- To reduce perceived wait time during loading, **show a skeleton screen** (ghosted layout of expected content). This simultaneously occupies attention, reduces uncertainty, and implies progress — all of which shorten perceived duration.
- To make a progress bar feel faster, **animate it with backward-moving stripes in a decelerating pattern**. This creates a relative-motion illusion that reduces perceived wait by ~11%.
- To make any wait feel shorter, **give the user something to look at or interact with**. Occupied time is perceived as shorter than empty time. Known/finite waits are perceived as shorter than uncertain waits.
- To reduce frustration from uncertainty, **always communicate whether a wait is bounded**. Showing remaining time or a determinate progress bar costs almost nothing to implement and has roughly half the psychological impact of reducing the actual wait.

### Completion & Momentum
- To drive task completion (profile setup, onboarding flows), **show progress as a percentage or partial bar**. Incomplete tasks create cognitive tension that biases users toward finishing. "64% complete" is more motivating than "3 steps remaining."
- To build momentum in multi-step processes, **front-load the easy steps**. Early progress creates a sense of investment that carries users through harder steps later.

---

## Reward & Ethics

### Sensory Reward Done Right
- To make an interaction feel satisfying, **pair the moment of completion with brief, congruent, multimodal feedback**: a visual state change + a short haptic tap + a subtle audio cue, all simultaneous. This activates reward circuits and confirms the user's action.
- To confirm a destructive action, **make the feedback distinct and slightly heavier** (deeper haptic, lower-pitched sound, more prominent visual change). The user should feel the weight of the action.

### Avoiding Manipulation
- To determine if a design pattern is ethical, apply this test: **would the user regret the behavior your interface is optimizing for?** If yes, it's manipulation. If the sensory reward serves the user's own intent, it's good design.
- To avoid creating addictive loops, **do not combine variable/unpredictable reward with low-friction repetition**. Pull-to-refresh with unpredictable content + infinite scroll + notification badges = slot machine. Any one of these is fine; the combination is predatory.
- To respect user autonomy, **never auto-play content, auto-scroll, or remove natural stopping points** without the user explicitly opting in.
- To provide satisfying micro-interactions without manipulation, **tie every sensory reward to a user-initiated, goal-directed action**. A completion checkmark is satisfying and ethical. A notification badge engineered to trigger checking behavior serves engagement metrics, not the user.

---

## Cross-Modal Perception

### Visual-Taste Correspondences (useful for food, beverage, and lifestyle apps)
- To visually suggest sweetness, use **warm colors (red, pink, orange), rounded shapes, and rounded typefaces**.
- To visually suggest sourness or bitterness, use **angular shapes, cooler colors, and geometric/sharp typefaces**.
- To visually suggest lightness or freshness, use **higher-pitched audio cues and lighter visual weight**.
- These cross-modal mappings are consistent across populations — they're not cultural artifacts, they're wired into sensory processing.

---

## Web Implementation

This section translates the sensory prescriptions above into concrete CSS, HTML, and JavaScript patterns for web development. Where the earlier sections say *what* to achieve, this section says *how* to achieve it in a browser.

### The Root Font Size and the `rem` System

- To establish a predictable, scalable type system, **never change the root font size from the browser default**. Browsers default `html` to `16px` and users who have changed this have done so deliberately (e.g., low-vision users setting it to 20px or 24px). Overriding it with `html { font-size: 10px }` (the "62.5% trick") or any fixed value **silently breaks every accessibility setting the user has configured**.

```css
/* WRONG — overrides user preference */
html { font-size: 62.5%; }

/* WRONG — overrides user preference */
html { font-size: 14px; }

/* RIGHT — leave it alone, scale from there */
html { font-size: 100%; }
```

- To size all text, spacing, and layout relative to user preference, **use `rem` as your primary unit**. `1rem` = whatever the user's root font size is (typically 16px, but not your business). Body text at `1rem`, subtext at `0.875rem`, headings at `1.5rem`/`2rem`/etc.

- To size elements relative to their *parent's* text (e.g., padding inside a button that scales with button text, or an icon that should match adjacent text), **use `em`**. `em` is relative to the computed font size of the element itself. This is the correct unit for letter-spacing, word-spacing, and inline padding.

```css
/* Letter spacing in em — scales with whatever font-size the element has */
body { letter-spacing: 0.012em; }

/* Button padding relative to its own text size */
.button { padding: 0.5em 1em; }
```

- To size things that should **not** scale with text (borders, box shadows, hairline dividers), **use `px`**. A `1px` border should stay `1px` regardless of font size. This is the exception, not the rule — most things should be in `rem` or `em`.

- To size things relative to the viewport (full-bleed sections, hero heights), **use `vw`/`vh`/`dvh`**. But never use viewport units alone for text — see fluid typography below.

### Fluid Typography

- To scale text smoothly between viewport sizes without breakpoint jumps, **use `clamp()` with `rem` bounds and a `vw` growth rate**:

```css
/* Body text: 1rem at small screens, grows with viewport, caps at 1.25rem */
body {
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
}

/* Primary heading: 1.75rem to 3rem */
h1 {
  font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem);
}
```

- To understand the formula: `clamp(MIN, PREFERRED, MAX)`. The `PREFERRED` value is typically `[base rem] + [vw multiplier]`. The `rem` component inside `PREFERRED` ensures it still responds to the user's root font size setting — pure `vw` would ignore it.

- To calculate the preferred value precisely: if you want text to be `MIN` at viewport width `A` and `MAX` at viewport width `B`, solve for slope and intercept:
  - slope = `(MAX - MIN) / (B - A)` → express in `vw`
  - intercept = `MIN - (slope × A)` → express in `rem`
  - Tools like Utopia (utopia.fyi) generate these scales automatically.

- To prevent text from ever becoming unreadable on extremely small viewports, **never set a `clamp()` minimum below `1rem` for body text**. On a 320px-wide screen with the user's default font size, `1rem` is already small. Going below it violates the user's expressed minimum.

### Line Length Control

- To constrain body text to 45-75 characters per line, **use the `ch` unit**:

```css
.prose {
  max-width: 65ch;
}
```

- `1ch` equals the width of the `0` glyph in the current font. This means `65ch` automatically adapts to the active font's character width. If the user switches fonts (or you change fonts between design iterations), the line length stays perceptually correct.

- To prevent the container from being *too narrow* on small screens, pair with a min-width or let it collapse naturally:

```css
.prose {
  max-width: 65ch;
  width: 100%;
  padding-inline: 1rem;
}
```

### Spacing Scale

- To create a consistent, user-respecting spacing system, **build a scale in `rem`**:

```css
:root {
  --space-xs: 0.25rem;   /* 4px at default */
  --space-s:  0.5rem;     /* 8px */
  --space-m:  1rem;        /* 16px */
  --space-l:  1.5rem;      /* 24px */
  --space-xl: 2rem;        /* 32px */
  --space-2xl: 3rem;       /* 48px */
  --space-3xl: 4rem;       /* 64px */
}
```

- To make spacing fluid (like fluid typography), apply `clamp()` to spacing tokens:

```css
:root {
  --space-m: clamp(1rem, 0.8rem + 0.5vw, 1.5rem);
  --space-l: clamp(1.5rem, 1.2rem + 1vw, 2.5rem);
}
```

- To maintain the Gestalt proximity principle programmatically, **ensure the gap between related elements is always less than half the gap between unrelated groups**. Use your spacing scale to enforce this — if label-to-field gap is `--space-xs`, field-to-next-field gap should be `≥ --space-m`.

### User-Configurable Sensory Settings via Custom Properties

- To expose the typography knobs that matter most (font size, letter spacing, line height, font family), **use CSS custom properties as a settings layer**:

```css
:root {
  --user-font-size: 1rem;
  --user-letter-spacing: 0.012em;
  --user-line-height: 1.5;
  --user-word-spacing: 0.16em;
  --user-font-family: system-ui, sans-serif;
}

body {
  font-size: var(--user-font-size);
  letter-spacing: var(--user-letter-spacing);
  line-height: var(--user-line-height);
  word-spacing: var(--user-word-spacing);
  font-family: var(--user-font-family);
}
```

- To let the user adjust these at runtime, **update the custom properties on `:root` via JavaScript** and persist choices to `localStorage`:

```js
function applyUserSetting(prop, value) {
  document.documentElement.style.setProperty(prop, value);
  localStorage.setItem(prop, value);
}

// On page load, restore saved preferences
for (const prop of ['--user-font-size', '--user-letter-spacing', '--user-line-height']) {
  const saved = localStorage.getItem(prop);
  if (saved) document.documentElement.style.setProperty(prop, saved);
}
```

- To handle the WCAG 1.4.12 text spacing requirement, **ensure your layout does not break when a user applies**: line-height ≥1.5×, paragraph spacing ≥2× font size, letter-spacing ≥0.12em, word-spacing ≥0.16em. These values can be injected by browser extensions or assistive tools. Test with them. If your layout overflows, clips, or overlaps — that's a bug.

### Respecting OS-Level Sensory Preferences

- To respond to the user's motion sensitivity preference, **use `prefers-reduced-motion`**:

```css
/* Default: full animation */
.element {
  transition: transform 300ms ease, opacity 200ms ease;
}

/* User has asked for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .element {
    transition: opacity 200ms ease;
    /* Remove transform-based movement, keep opacity which is non-vestibular */
  }

  /* Disable all purely decorative animation */
  .decorative-animation {
    animation: none;
  }
}
```

- To make reduced-motion handling robust, **never just globally kill all transitions**. Opacity fades and color transitions are non-vestibular and generally safe. Remove spatial movement (translate, scale, rotate), parallax, and auto-scrolling. Keep state-communication transitions.

- To respond to the user's contrast preference, **use `prefers-contrast`**:

```css
@media (prefers-contrast: more) {
  :root {
    --border-color: #000;
    --text-color: #000;
    --bg-color: #fff;
    --focus-outline-width: 3px;
  }
}

@media (prefers-contrast: less) {
  :root {
    --border-color: #ccc;
    --text-color: #444;
  }
}
```

- To respond to dark mode preference, **use `prefers-color-scheme`**, but remember the polarity asymmetry: light text on dark backgrounds needs a higher contrast ratio to feel equivalent. Bump your dark-mode contrast ratios up by ~0.5:1 over what you use in light mode.

```css
@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #e8e8e8;
    --bg-color: #1a1a1a;
    /* This is ~14:1. In light mode you might use #333 on #fff (~12.6:1). */
    /* The slightly higher dark-mode ratio compensates for polarity asymmetry. */
  }
}
```

- To handle Windows High Contrast Mode, **use `forced-colors`**:

```css
@media (forced-colors: active) {
  .button {
    border: 2px solid ButtonText;
    /* System colors: Canvas, CanvasText, LinkText, ButtonFace, ButtonText, etc. */
  }

  /* Decorative backgrounds and shadows are stripped. Ensure content is still legible. */
}
```

### Font Loading

- To prevent layout shift from font loading (FOUT — Flash of Unstyled Text), **use `font-display: swap` for body fonts and `font-display: optional` for decorative/heading fonts**:

```css
@font-face {
  font-family: 'BodyFont';
  src: url('body.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
}

@font-face {
  font-family: 'HeadingFont';
  src: url('heading.woff2') format('woff2');
  font-display: optional; /* Use only if cached/instant; don't swap mid-view */
}
```

- To minimize the visual disruption of font swap, **choose fallback fonts with similar metrics** (x-height, character width, weight). Use `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` in your `@font-face` to match the fallback's metrics:

```css
@font-face {
  font-family: 'BodyFont';
  src: url('body.woff2') format('woff2');
  font-display: swap;
  size-adjust: 105%;
  ascent-override: 92%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

- To eliminate font loading delay entirely for the majority of users, **preload your critical fonts**:

```html
<link rel="preload" href="/fonts/body.woff2" as="font" type="font/woff2" crossorigin>
```

- To avoid loading fonts the user won't see, **subset your font files** to the character ranges you actually use. A full Google Fonts weight with Latin Extended can be 80KB+. A Latin-only subset of the weights you use is typically 15-25KB.

### System Font Stack as Default

- To guarantee zero font-loading delay and native platform familiarity, **consider the system font stack as your default body font**:

```css
body {
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    'Noto Sans',
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji';
}
```

- This renders San Francisco on Apple, Segoe UI on Windows, Roboto on Android, and Noto on Linux — all of which are well-engineered, high-x-height, thoroughly hinted fonts. For apps prioritizing speed and readability over brand typography, this is the correct choice.

### Font Feature Settings

- To display tabular (monospaced) numbers in data tables, financial displays, and counters — preventing layout shift as digits change:

```css
.data-table td,
.price,
.counter {
  font-variant-numeric: tabular-nums;
}
```

- To enable proper fractions, ordinals, and ligatures where the font supports them:

```css
.prose {
  font-variant-ligatures: common-ligatures;
  /* Enable fi, fl, ffi ligatures in fonts that support them */
}

.fraction {
  font-variant-numeric: diagonal-fractions;
  /* Turns 1/2 into a proper stacked fraction glyph */
}
```

### Touch Targets on the Web

- To achieve minimum touch target sizing in CSS:

```css
/* Minimum 44px touch target (iOS guideline) */
.interactive {
  min-height: 44px;
  min-width: 44px;
}

/* For inline links and small buttons, expand the tap area without expanding the visual element */
.compact-link {
  position: relative;
}
.compact-link::after {
  content: '';
  position: absolute;
  inset: -8px; /* Expand tap area 8px in all directions */
}
```

- To make target sizing respond to user font size, **use `rem` for touch targets** rather than `px`:

```css
.button {
  min-height: 2.75rem; /* 44px at 16px root, scales up with user preference */
  padding: 0.5em 1em;
}
```

### Focus Indicators

- To make focus visible to keyboard and assistive technology users, **never remove the outline without replacing it**:

```css
/* WRONG */
*:focus { outline: none; }

/* RIGHT — visible, high-contrast, offset from the element */
:focus-visible {
  outline: 3px solid var(--focus-color, #2563eb);
  outline-offset: 2px;
}

/* Hide focus ring for mouse/touch users who don't need it */
:focus:not(:focus-visible) {
  outline: none;
}
```

- To ensure focus indicators meet contrast requirements, **the outline must have ≥3:1 contrast against both the background and the element it surrounds**. An offset of 2-3px helps the ring read clearly against the element's own border.

- To support high-contrast mode, use a double-ring technique:

```css
:focus-visible {
  outline: 3px solid var(--focus-color, #2563eb);
  outline-offset: 2px;
  box-shadow: 0 0 0 6px var(--bg-color, #fff);
  /* White halo + colored ring = visible on any background */
}
```

### Animation & Transitions in CSS

- To ensure animations serve spatial continuity (not decoration), **only animate `transform` and `opacity`** — these are GPU-composited and don't trigger layout recalculation:

```css
/* Performant */
.element {
  transition: transform 200ms ease-out, opacity 150ms ease-out;
  will-change: transform; /* hint to browser, use sparingly */
}

/* Expensive — triggers layout/paint */
.element-bad {
  transition: width 200ms, height 200ms, top 200ms, left 200ms;
}
```

- To set animation durations that feel natural: **100-200ms for micro-interactions** (button press, toggle, hover), **200-350ms for element transitions** (expand, slide, modal enter), **350-500ms for full-view transitions** (page change, large-area morph). Anything over 500ms feels sluggish. Anything under 100ms is imperceptible.

- To choose the right easing curve:
  - **Enter animations**: use `ease-out` (fast start, gentle landing). Elements arriving should feel like they're settling into place.
  - **Exit animations**: use `ease-in` (gentle start, fast departure). Elements leaving should feel like they're accelerating away.
  - **State changes** (color, opacity): use `ease` or `linear`. No spatial movement = no need for physical-feeling curves.
  - **Bouncing/springy effects**: use `cubic-bezier()` with an overshoot, e.g., `cubic-bezier(0.34, 1.56, 0.64, 1)`. Use for playful interactions only — not for navigation or data display.

- To implement the View Transitions API for page-level spatial continuity (supported in Chromium, progressive enhancement elsewhere):

```css
/* Opt elements into cross-document transitions */
.card {
  view-transition-name: card-hero;
}

/* Animate the transition */
::view-transition-old(card-hero) {
  animation: fade-out 200ms ease-out;
}
::view-transition-new(card-hero) {
  animation: fade-in 200ms ease-in;
}
```

```js
// Trigger a same-document view transition
document.startViewTransition(() => {
  // update the DOM
});
```

### Scroll Behavior

- To make scroll-to-anchor navigation feel smooth rather than teleporting:

```css
html {
  scroll-behavior: smooth;
}

/* But respect reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

- To create paginated or snapping experiences that preserve spatial consistency:

```css
.carousel {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain; /* prevent horizontal scroll from bubbling */
}

.carousel-item {
  scroll-snap-align: center;
}
```

- To prevent scroll-chaining (one scroll container's overflow triggering the parent's scroll), **use `overscroll-behavior: contain`** on modal overlays, sidebars, and embedded scroll regions.

### Web Haptics (Vibration API)

- To trigger haptic feedback on the web (Android Chrome only — iOS Safari does not support the Vibration API):

```js
// Simple tap — 15ms is crisp, not buzzy
navigator.vibrate?.(15);

// Success pattern: tap-pause-tap
navigator.vibrate?.([15, 50, 15]);

// Warning pattern: longer, more insistent
navigator.vibrate?.([30, 40, 30, 40, 60]);

// Cancel any ongoing vibration
navigator.vibrate?.(0);
```

- To avoid the platform trap, **feature-detect and degrade gracefully**. The `?.` optional chaining above prevents errors when the API is absent. Never design a flow that *requires* vibration — always pair it with visual and/or audio feedback.

- To avoid haptic fatigue on the web, **limit vibration to user-initiated actions** (form submission, destructive confirmation, toggle). Never vibrate on page load, scroll, or passive events.

### Web Audio for UI Sounds

- To play short UI sounds without the overhead and delay of `<audio>` elements, **use the Web Audio API**:

```js
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

async function playUISound(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(buffer);
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  source.start(0);
}
```

- To generate a simple tonal beep without any audio file (useful for confirmation/error tones):

```js
function playTone(frequency = 440, duration = 0.1, type = 'sine') {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = 0.15; // Quiet — UI sounds should never be loud

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

// Pleasant confirmation: 600Hz sine, 100ms
playTone(600, 0.1, 'sine');

// Gentle error: 300Hz triangle, 150ms
playTone(300, 0.15, 'triangle');
```

- To gate all audio behind user interaction: browsers block `AudioContext` until a user gesture. **Instantiate or resume your context inside a click/touch handler**, not on page load:

```js
let audioCtx;
document.addEventListener('click', () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });
```

- To respect user preference, **always provide a mute toggle** and persist the choice. Check it before playing any sound.

### Container Queries for Component-Level Sensory Adaptation

- To adjust a component's typography and density based on the space it's *given* (not the viewport), **use container queries**:

```css
.card-container {
  container-type: inline-size;
}

@container (max-width: 300px) {
  .card-title {
    font-size: clamp(0.875rem, 0.8rem + 0.5cqi, 1.125rem);
    /* cqi = container query inline unit */
  }

  .card-body {
    line-height: 1.4; /* tighter in small containers */
  }
}

@container (min-width: 600px) {
  .card-body {
    max-width: 65ch; /* enforce line length only when container is wide enough */
  }
}
```

- Container queries are the correct tool for component libraries and design systems where the same component renders in sidebars, modals, and full-width layouts. Media queries cannot handle this — they only know about the viewport.

### Logical Properties for Internationalization

- To support RTL languages without duplicating styles, **use logical properties everywhere you currently use physical ones**:

```css
/* PHYSICAL — breaks in RTL */
.element { margin-left: 1rem; padding-right: 0.5rem; }

/* LOGICAL — works in all directions */
.element { margin-inline-start: 1rem; padding-inline-end: 0.5rem; }

/* Block axis (top/bottom in horizontal writing) */
.element { margin-block-start: 1rem; }
```

- `inline` = the text flow direction (left-right in LTR, right-left in RTL). `block` = the perpendicular axis (top-bottom in horizontal writing). Using logical properties means your spacing, alignment, and sizing automatically flip for RTL without any additional CSS.

### Performance: Sensory Design That Doesn't Jank

- To ensure animations hit 60fps, **only animate `transform` and `opacity`**. These are handled by the compositor thread and do not trigger layout or paint. Animating `width`, `height`, `top`, `left`, `margin`, or `padding` triggers layout recalculation on every frame.

- To hint the browser about upcoming animations, **use `will-change` on elements that are about to animate** — but remove it after the animation completes:

```js
element.style.willChange = 'transform';
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```

- To avoid scroll-linked jank, **never attach heavy JavaScript to scroll events**. Use `IntersectionObserver` for visibility triggers and `CSS scroll-driven animations` (where supported) for scroll-linked effects:

```css
/* Scroll-driven animation — zero JS, compositor-only */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

- To load non-critical content without blocking the main thread, **use `content-visibility: auto`** on sections below the fold. This tells the browser to skip rendering until the element is near the viewport — dramatically reducing initial paint time without JavaScript.

```css
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* estimated height to prevent layout shift */
}
```

---

## Quick Reference

| Goal | Prescription |
|---|---|
| Text readable by all | ≥4.5:1 contrast, 45-75 char lines, 1.5× line height, ≥0.12em letter spacing |
| Dyslexia-friendly | Increase letter spacing, avoid italics, use Helvetica/Arial/Verdana, expose text settings |
| Color-blind safe | Never encode info in color alone; always add shape/pattern/text redundancy |
| Instant-feeling response | <100ms |
| Maintain user flow | <1 second |
| Don't lose the user | <10 seconds with feedback |
| Easy-to-hit targets | 44×44pt minimum; place frequent actions near edges/corners |
| Options without overwhelm | ≤4 unchunked items visible at once |
| Pleasant haptics | 150-250 Hz, short crisp taps, moderate amplitude |
| Pleasant routine sounds | 300-1,500 Hz |
| Warning sounds | 2,000-4,000 Hz (use sparingly) |
| Spatial consistency | Never move structural elements between screens/updates |
| Ethical reward | Tie all sensory feedback to user-initiated, goal-directed actions |
| Root font size | Never override — leave at `100%`, use `rem` for everything else |
| Body text sizing | `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)` — never below `1rem` minimum |
| Line length | `max-width: 65ch` on prose containers |
| Unit selection | `rem` for layout/text, `em` for component-internal spacing, `px` for borders only |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` — remove spatial animation, keep opacity |
| Dark mode contrast | Bump ratios ~0.5:1 higher than light mode to compensate for polarity asymmetry |
| Font loading | `font-display: swap` for body, `optional` for decorative; preload critical `.woff2` |
| Focus indicators | `:focus-visible` with 3px outline, 2px offset, ≥3:1 contrast; never `outline: none` |
| Performant animation | Only animate `transform` and `opacity`; 100-200ms micro, 200-350ms transitions |
| Touch targets (web) | `min-height: 2.75rem; min-width: 2.75rem` — scales with user font preference |
| Web haptics | `navigator.vibrate?.(15)` — Android only, always feature-detect, always optional |
| Container adaptation | Use container queries (`@container`) for component-level responsive typography |
