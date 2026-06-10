# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static multi-page site for the Twitch streamer **PawPau** (channel handle `pawpau`). No build step, no package manager, no framework — plain HTML/CSS/vanilla JS served as files. Deployed on Vercel. UI copy is Spanish; keep it Spanish.

Three pages:
- `index.html` — landing (hero carousel, bio, socials, sponsor, FAQ, FABs).
- `sorteo.html` — raffle/giveaway tool (pick N winners from a list, with reroll).
- `torneo.html` — bracket tournament tool (multi-round elimination with configurable match formats).

## Run / develop

No build, no tests, no lint. Open the files directly:
- `file://` works (no module imports, no fetch dependency for core tool logic).
- Or serve locally: `python3 -m http.server` then visit `http://localhost:8000`.

Deploy is automatic via Vercel on push. `vercel.json` only sets cache headers — HTML/CSS/JS are `must-revalidate` (always fresh), images/fonts are `immutable` 1-year.

## Architecture

**Script loading.** No bundler, no ES modules — scripts load as plain `<script>` tags and share state through one global `window.App` namespace.
- `js/utils.js` defines `window.App` and all shared helpers (`$`, `randomInt`/`shuffle` via `crypto.getRandomValues`, `escapeHtml`, `parseParticipantes`, `showErr`, `spawnConfetti`, `colorFromString`, `initials`, `mezclar`, `confettiVolley`, and `openModal`/`closeModal` which handle the `.hidden`/`aria-hidden`/body-scroll toggle plus focus trap + focus restoration). **Must load first** on any page that uses a tool. Both tools call `App.openModal`/`App.closeModal` for their result modals — don't reimplement the toggle inline.
- `js/sorteo.js` and `js/torneo.js` are page-specific IIFEs that destructure what they need off `App`. They run on their own page only.
- `js/landing.js` is a standalone IIFE that does **not** depend on `App` (defines its own `$`). It loads on **all three pages** — it powers the shared navbar, mobile menu, dropdown, Spotify FAB, photosensitivity modal, the Twitch live badge, and (on the landing) the Swiper hero carousel.

Load order matters: tool pages include `utils.js` → `<tool>.js` → `landing.js`.

**Live status.** `landing.js` polls `decapi.me` (Twitch proxy, no auth/key) every 60s for uptime/title/game/viewers and toggles `.live-badge` / `.live-info` / `#navLiveDot` across the page. Channel is hardcoded as `CHANNEL = 'pawpau'`. `fetchText` wraps each request in an `AbortController` 5s timeout with a single backoff retry, then falls back to `setOffline()`.

**Tool state model.** Each tool keeps a single in-memory state object (`draw` in sorteo, `state` in torneo) and re-renders the DOM imperatively from it — no reactive framework, no persistence (refresh = reset). Randomness always goes through `App.shuffle`/`App.randomInt` (crypto-backed), never `Math.random`, so draws are unbiased. `Math.random` is used only for cosmetic effects (confetti).
- **sorteo**: picks `n` unique winners (or with-repeats if `permitirRepetidos`), animates a vertical "tombola" reel per winner in a modal, supports rerolling any winner (moves it to `rerolled`/descartados and draws a replacement from the remaining pool).
- **torneo**: rounds of "matches" (`{contestants, winners:Set}`). Match formats are presets (`1v1`, `race4-2`, etc.) defining `matchSize`/`advance`. User checks winners per match (capped at `advance`), advances rounds until one champion remains; each round is archived to `history`.

**CSS.** Split by page, no preprocessor. `css/base.css` holds the shared chrome (design tokens, reset, navbar + dropdown, modal base, confetti, Redragon/Spotify FABs, `landing-body`/`paw-bg`, forms, buttons) and loads on **all three** pages. Each page then loads exactly one page sheet: `landing.css` (hero, Swiper carousel, socials/sponsor/FAQ/contact, photosensitivity modal), `sorteo.css` (tombola reel, winner cards, descartados), or `torneo.css` (match cards, history, champion board). When adding a selector, put it in the page sheet unless 2+ pages use it, then it belongs in `base.css`.

## Conventions

- All user-supplied names are run through `App.escapeHtml` before `innerHTML` — keep doing this when adding render code.
- Participant input is a `<textarea>`, one name per line, parsed by `App.parseParticipantes` (trims, drops blanks, dedupes unless repeats allowed).
- Commit messages in history are terse Spanish ("estream" = stream).
