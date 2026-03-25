# BootWatch mascot — placements & AI prompts

Raccoon scout with binoculars. On-brand colors: charcoal background `#111827`, primary blue `#5B9CF6`, accent red `#EF4444` where needed, light text `#F9FAFB`.

---

## Final placement list (in-app)

| # | Placement | Screen / context | Priority | Notes |
|---|-----------|------------------|----------|--------|
| 1 | **App icon** | Home screen, stores | P0 | Square, readable at ~29px. Face + binoculars or bust only. |
| 2 | **Splash** | Cold start | P0 | Same character as icon or full-body centered; works on light + dark bg. |
| 3 | **Onboarding slide 1** | Welcome | P0 | Welcoming wave or confident stance — “meet BootWatch.” |
| 4 | **Onboarding slide 2** | How it works | P0 | Teaching / pointing — map, timer, feed (can be one pose beside abstract UI hints). |
| 5 | **Onboarding slide 3** | Get started | P0 | Open arms, thumbs up, or “let’s go” — community / trust. |
| 6 | **Auth screen** | Sign in / sign up | P1 | Small illustration above or beside logo — optional, don’t compete with OAuth buttons. |
| 7 | **Feed empty state** | No sightings yet | P1 | Peeking or binoculars up — “nothing spotted yet.” |
| 8 | **Feed error / offline** | Retry UI | P2 | Confused or shrugging — friendly, not alarming. |
| 9 | **Error boundary** | App crash | P2 | Same as #8 or “oops” pose — pairs with “Something went wrong.” |
| 10 | **Report success** | After submit (optional toast) | P3 | Quick nod or salute — “thanks for the report.” |
| 11 | **Timer running** (optional) | Timer tab | P3 | Small “on watch” / binoculars pose — reinforces lookout. |
| 12 | **Profile header** (optional) | Profile tab | P3 | Tiny avatar or sticker — consistent with icon. |

**Push notifications** use the **app icon** — no separate image required.

---

## Out of app (same character, same rules)

| Use | Notes |
|-----|--------|
| App Store / Play screenshots | Can reuse onboarding art. |
| Social / flyers / campus posters | Full-body or icon crop. |
| Merch later | Vector export from master character sheet. |

---

## Technical specs (give to designer or AI → export)

| Asset | Suggested size | Format | Background |
|-------|----------------|--------|------------|
| App icon | 1024×1024 | PNG | Solid `#111827` or transparent if store allows |
| Splash | 1284×2778 safe area / or vector | PNG | Match `app.json` splash bg |
| Onboarding | ~400×400 to 600×600 per slide | PNG | **Transparent** preferred |
| Empty / error / small UI | 200×320 to 320×400 | PNG | Transparent |
| Favicon / web | 32×32, 192×192 | PNG | Simple silhouette of icon |

- **No text** in generated images (AI adds gibberish).
- **Bold shapes**, high contrast — reads small.
- Keep **one consistent character**: same mask stripes, ear shape, binocular style across all poses.

---

## Master style prompt (prepend to every generation)

Use this block at the start of each prompt so poses stay on-model:

```
Character: BootWatch mascot — a clever raccoon with a mischievous but friendly expression, wearing or holding compact tactical binoculars around the neck. Same design as a mobile game mascot: bold outlines, flat vector illustration, no gradients, no 3D, no photorealism, no fur texture detail.

Style: Clean 2D vector, thick readable lines, expressive eyes, slightly oversized head for cuteness.

Colors: Charcoal gray and near-black for fur mask; warm gray body; binoculars and accents in bright blue #5B9CF6; optional small red #EF4444 detail on one lens. White or off-white #F9FAFB for eye highlights. Background as specified per asset.

Constraints: No text, no letters, no watermark. Single character, full body or bust as requested. Consistent proportions across series.
```

---

## Per-asset prompts (paste after the master block)

### 1 — App icon
```
Asset: Mobile app icon, square 1:1 composition, centered. Bust shot only: raccoon face and binoculars, slight 3/4 angle, alert confident expression. Minimal detail — must read clearly at tiny size. Background solid dark #111827. No full body.
```

### 2 — Splash
```
Asset: Splash screen hero. Full body raccoon standing centered, holding binoculars up to eyes as if scanning the parking lot, heroic but playful. Extra margin around character for safe area on phones. Background solid #111827 or very dark blue-gray gradient (subtle).
```

### 3 — Onboarding 1 (Welcome)
```
Asset: Full body raccoon, friendly welcoming pose — one paw raised in a wave, binoculars hanging on chest, big smile. Slight forward lean. Transparent background. Portrait-friendly composition.
```

### 4 — Onboarding 2 (How it works)
```
Asset: Full body raccoon in a “presenter” pose — one paw extended pointing to the side as if showing three imaginary cards (do not draw UI, just empty space beside him). Curious helpful expression. Binoculars visible. Transparent background.
```

### 5 — Onboarding 3 (Get started)
```
Asset: Full body raccoon, encouraging pose — both paws up in a small cheer or thumbs-up gesture, binoculars on chest, warm trustworthy smile. Transparent background.
```

### 6 — Auth (optional, small)
```
Asset: Small illustration, raccoon bust only, peeking from bottom edge as if behind a counter, friendly curious eyes, binoculars on chest. Transparent background. Leave top half mostly empty for UI.
```

### 7 — Feed empty
```
Asset: Full body raccoon crouched slightly, looking through binoculars into the distance, slightly comedic “nothing here yet” body language. Transparent background.
```

### 8 — Feed error / offline
```
Asset: Full body raccoon, confused or gentle shrug, one paw raised palm up, binoculars askew or hanging — sympathetic not scary. Transparent background.
```

### 9 — Error boundary (crash)
```
Asset: Same character as error/offline — apologetic awkward smile, slight sweat drop optional (cartoon style), binoculars in one paw. Transparent background. Slightly more “oops” than angry.
```

### 10 — Report success (optional)
```
Asset: Bust or half body, raccoon giving a crisp salute or confident nod, proud helpful expression, binoculars visible. Transparent background.
```

### 11 — Timer “on watch” (optional)
```
Asset: Compact composition, raccoon from waist up, binoculars raised to eyes, focused “on duty” expression. Transparent background. Feels like a lookout guard.
```

### 12 — Profile sticker (optional)
```
Asset: Circular crop friendly — raccoon face and binoculars only, same design DNA as app icon but slightly softer expression. Transparent background. Centered for circle mask.
```

---

## Workflow tips

1. Generate a **character sheet** first (front, side, expressions, color swatches). Use it as **reference image** for every follow-up pose in your AI tool.
2. If a pose drifts, regenerate with “same raccoon as reference image, only change pose to: …”
3. Export PNG; for icons, run through **Figma** or **Photopea** to clean edges and resize.
4. After files land in `assets/mascot/`, we can wire them into `OnboardingScreen`, `FeedScreen`, `ErrorBoundary`, etc.

---

*Last updated: BootWatch mascot planning*
