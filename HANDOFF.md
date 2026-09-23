# HANDOFF.md: Project Engineering Handoff & Architecture Dossier

**Target Project:** *Ink & Iron: Sketch Warfare*  
**Repository:** `https://github.com/MerajMahmoudifar/ink-and-iron-sketch-warfare.git`  
**Deployment Target:** Cloudflare Pages (`ink-and-iron-sketch-warfare.pages.dev`) + Cloudflare D1 (`ink-and-iron-db`) + Firebase  
**Timestamp of Handoff:** 2026-09-23  

---

# 1. Current State of the Build

### Mission Accomplished
The following features, modules, and bug fixes are complete, syntax-validated, committed to git, and pushed to `origin/main`:

* **3-Tier AI Difficulty Rebalance (`CommanderAI.js` & `src/game.js`):**
  * **Recruit (Beginner / Casual):** Hard unit cap of 3 units, 45% chance to skip recruitment phases, recruits only baseline Riflemen/Scouts, strictly 0 tactical abilities, no retreat logic, and a 35% hesitation/idle wander chance per turn. Default difficulty set to Recruit across all menus.
  * **Veteran (Balanced Opponent):** Counter-recruitment reactive matrix (Anti-Tank vs Armor, Snipers vs Infantry), tactical retreat triggered when below 25% HP to capture depots, Artillery strikes queued against clusters of 2+ enemy units, and forest ambush stance enabled.
  * **General (Tactical Master):** Proactive superunit rush (Faction Heavy Siege Tanks / Blitz Recon), forward deployment depot spawn bias, tactical artillery scoring evaluating splash value ($\ge 25$), smart smoke screen deployment covering critically wounded allies ($< 50\%$ HP), focus-firing lowest-HP / counterable targets, and retreat triggered at 35% HP.
* **Custom Dieselpunk Select Dropdown Replacement (`initCustomSelects`):**
  * Completely replaced native OS browser dropdowns with custom themed `.diesel-select-wrapper` and `.diesel-select-menu` components matching the blueprint/sketch aesthetic.
  * Solved CSS parent clipping: The menu was previously clipped by `.menu-paper-card` (`overflow: hidden`) and `.tab-pane` (`overflow-y: auto`). Re-architected `.diesel-select-menu` to `position: fixed` with dynamic coordinate calculation via `getBoundingClientRect()` in `openMenu()`, accompanied by passive scroll repositioning and window resize listeners.
  * Fixed dropdown re-trigger bug: Updated `selectOption(val)` in `src/game.js` so selecting `'CUSTOM'` always fires the `change` event and opens the modal even if `'CUSTOM'` is already the active value.
* **Settings Menu Cleanup & Custom Game Speed Modal:**
  * Cleaned up redundant rows: Removed the standalone "Planning Phase Duration" and "Action / Playback Duration" dropdown rows from the Settings tab (`#tab-pane-settings` in `index.html`), unifying tempo under the "Gaming Speed Preset" selector.
  * Implemented Custom Speed Modal (`#custom-speed-modal`):
    * Planning duration input (10–300s) with quick-pick chips (`20s Blitz`, `40s Standard`, `60s Relaxed`, `90s Extended`).
    * Playback duration input (1–30s) with quick-pick chips (`3s Fast`, `5s Normal`, `10s Slow`).
    * Real-time preview summary bar showing active settings (`40s Planning • 3s Playback`).
    * Equalized action buttons: Cleaned up mismatched layout padding; implemented equal-height matching buttons (Cancel ghost button and Blue gradient Apply button with play icon).
    * Modal stacking: Elevated `#custom-speed-modal` to `z-index: 10000` to sit above the blurred `.main-menu-overlay` (`z-index: 700`).
* **Tactical Blueprint UI & Officer Bootcamp:**
  * Segmented drafting pips and tactical HP gauge renderer (`SketchRenderer.js`).
  * Officer Bootcamp interactive tutorial lessons 1 through 7 with exploit fixes (preventing auto-kills and invalid spawn bypasses).
* **Cloudflare Pages Backend & OpenAPI Documentation:**
  * Serverless functions in `/functions` handling player profile synchronization, admin authentication, moderation, announcement broadcasts, and statistics aggregation.
  * Complete OpenAPI 3.1 specification (`openapi.json`) documenting all backend endpoints.

---

### Active / Halted Work
* **Exact File & Function at Handoff:**
  * `functions/api/user/sync.js` (lines 79–80) and `package.json` / Cloudflare Pages deployment pipeline.
* **Broken / Half-Implemented State:**
  1. **Sync Parameter Clamping Bug:** The front-end Custom Speed modal allows planning durations up to 300s and playback durations up to 30s. However, `functions/api/user/sync.js` contains legacy hardcoded clamping:
     ```javascript
     const planDur = typeof planning_duration === "number" ? Math.max(5, Math.min(60, planning_duration)) : ...
     const playSpd = typeof playback_speed === "number" ? Math.max(1, Math.min(10, playback_speed)) : ...
     ```
     When a player sets a custom 90s planning duration, the backend clamps it down to 60s in the D1 database upon sync.
  2. **Cloudflare Deployment Disconnect:** The git repository on GitHub (`MerajMahmoudifar/ink-and-iron-sketch-warfare`) has all recent commits pushed on `main`. However, Cloudflare Pages may not be auto-deploying from git webhooks (or the build output directory is set incorrectly in the Pages dashboard). In commit `fa31165`, a manual npm script was added (`"deploy": "npx wrangler@3 pages deploy . --project-name=ink-and-iron-sketch-warfare"`), indicating direct deployment via Wrangler CLI is required.
  3. **Dual Codebase Divergence:** The application currently runs exclusively off `src/game.js` (a 6,638-line monolith loaded by `index.html`). The modular files in `src/engine/`, `src/render/`, `src/ui/`, and `src/ai/` are not imported by `index.html` (except `src/ui/UnitIcons.js`). Code edits made to `src/game.js` must currently be manually duplicated into the modular files.

---

### Next Immediate Steps
1. **Trigger Manual Cloudflare Edge Deployment:** Run `npm run deploy` using the Cloudflare API token or credentials to force the latest build to Cloudflare Pages:
   ```bash
   npx wrangler@3 pages deploy . --project-name=ink-and-iron-sketch-warfare
   ```
2. **Synchronize Server Clamping in `functions/api/user/sync.js`:** Update the clamp bounds to allow `planning_duration` up to 300 and `playback_speed` up to 30 to match the client modal:
   ```javascript
   const planDur = typeof planning_duration === "number" ? Math.max(5, Math.min(300, planning_duration)) : (existing ? existing.planning_duration : 40);
   const playSpd = typeof playback_speed === "number" ? Math.max(1, Math.min(30, playback_speed)) : (existing ? existing.playback_speed : 3);
   ```
3. **Run D1 Migration for Missing Tables and Columns:** Execute migration SQL on the live D1 database (`ink-and-iron-db`) to create the `announcements` table and add `email` and `last_online` columns to `users`.

---

# 2. Architectural Decisions & Patterns

### Structural Choices
* **Zero-Build Vanilla Stack:**
  * *Rationale:* The project avoids Node-based bundlers (Vite, Webpack, Rollup) for client code. All HTML, CSS, and JS files are served directly as static assets. This eliminates compile steps, speeds up edge asset distribution, and allows instant debugging in dev tools.
  * *Trade-off:* All major event handlers (`onclick`, `onchange`) rely on global functions exposed on `window` (`window.updateGameSpeedPreset`, `window.openCustomSpeedModal`, etc.).
* **Fixed-Position Dropdown Engine vs Native Selects:**
  * *Rationale:* Native browser select elements cannot be styled to fit the hand-drawn dieselpunk aesthetic, and native OS popup menus break layout boundaries unpredictably on mobile and high-DPI displays.
  * *Clipping Workaround:* Ancestor containers `.menu-paper-card` and `.tab-pane` enforce `overflow: hidden` and `overflow-y: auto`. An absolutely-positioned child is clipped regardless of `z-index`. Rather than stripping overflow protection from cards (which breaks card borders and tab scrolling), `.diesel-select-menu` was refactored to `position: fixed`. JavaScript calculates coordinates relative to the viewport using `trigger.getBoundingClientRect()`.
* **Layered Z-Index Stacking Strategy:**
  * Elements with CSS `backdrop-filter` (such as `.main-menu-overlay`) form their own stacking context in modern Chromium/WebKit engines.
  * Stacking tiers:
    * In-Game Battlefield HUD: `z-index: 100` – `400`
    * General Modals: `z-index: 500`
    * Main Menu Overlay (`.main-menu-overlay`): `z-index: 700`
    * Custom Speed Modal (`#custom-speed-modal`): `z-index: 10000`
    * Banned Account Modal (`#banned-account-modal`): `z-index: 100000`
    * Active Dropdown Menus (`.diesel-select-menu`): `z-index: 999999`

---

### Cross-Boundary Communication
* **Client-to-D1 Persistence:**
  * **Dual-Tier Storage:** State changes (volume, speed, username) are committed immediately to `localStorage` (`sketch_user_profile_v1`) to prevent UI lag. Asynchronously, `D1Service.syncSettings()` issues an HTTP POST to `/api/user/sync`.
  * **Offline Resilience:** If `/api/user/sync` fails due to network outage or missing D1 bindings, the client silently catches the error and marks the profile as offline, ensuring uninterrupted gameplay.
* **Firebase Authentication:**
  * `src/firebase-config.js` dynamically loads Firebase v10 modular scripts from `https://www.gstatic.com/firebasejs/10.8.0/` via browser-native dynamic imports (`import(...)`).
  * If Firebase credentials or connections fail, the system falls back to a mock `GUEST_PROFILE` with local state.
* **Admin API Authorization:**
  * Admin endpoints (`/api/admin/*`) expect an HTTP header: `Authorization: Bearer <ADMIN_PASSCODE>` or `Authorization: Bearer admin_authenticated_session`.
  * The client stores this session token in `sessionStorage` (`sketch_admin_token_v1`).

---

### Complex Logic
* **Simultaneous Turn Resolution Model (`GameEngine.js` / `src/game.js`):**
  * Both player and AI plan their actions concurrently during the planning countdown.
  * Once submitted, the game transitions to the Action Playback Phase where actions are processed in deterministic sequential order:
    1. Movement phase (detecting collision points and ambush interrupts).
    2. Ability deployment (Smoke screens deployed, Recon flares illuminating fog-of-war).
    3. Ballistics and artillery impacts.
    4. Unit-to-unit attacks with simultaneous counter-fire.
    5. Neutral/enemy capture depot scoring.
* **Levenshtein Typo-Detection Middleware (`functions/_middleware.js`):**
  * Intercepts all 404 responses under `/api/`.
  * Runs a matrix-based Levenshtein distance algorithm comparing the requested URL against registered endpoints (`VALID_ENDPOINTS`). If the edit distance is $\le 5$, it returns a 404 JSON response suggesting the correct endpoint.

---

# 3. Data & Infrastructure

### Schema Changes
The database is Cloudflare D1 (`ink-and-iron-db`, ID `7bf95994-ae9d-4c56-a672-d58c8cea72b4`).

#### Current Migration File (`migrations/0000_init.sql`):
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'Commander',
    master_volume INTEGER NOT NULL DEFAULT 80,
    sfx_volume INTEGER NOT NULL DEFAULT 100,
    audio_muted INTEGER NOT NULL DEFAULT 0,
    planning_duration INTEGER NOT NULL DEFAULT 20,
    playback_speed INTEGER NOT NULL DEFAULT 3,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    is_banned INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

#### Undocumented / Unmigrated Schema Discrepancies:
The backend functions in `/functions/api` query tables and columns that are **not** present in `0000_init.sql`. If a fresh D1 database is instantiated, the following migration must be applied:

```sql
-- Migration: 0001_add_missing_fields_and_announcements.sql

-- 1. Add missing user columns used by /api/user/sync and /api/admin/stats
ALTER TABLE users ADD COLUMN email TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN last_online DATETIME DEFAULT CURRENT_TIMESTAMP;

-- 2. Create announcements table used by /api/announcement and /api/admin/announcement
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_last_online ON users(last_online);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
```

---

### Environment Variables & Secrets
The following configuration keys and environment variables are active in this repository:

| Variable | Location | Current Value / Default | Description |
|---|---|---|---|
| `ADMIN_PASSCODE` | Cloudflare Pages Environment Variable | Fallback: `"meraj7782"` | Master administrative passcode for accessing `/api/admin/*` endpoints and the in-game admin dashboard. |
| `DB` | `wrangler.jsonc` (D1 Binding) | `7bf95994-ae9d-4c56-a672-d58c8cea72b4` | Cloudflare D1 database binding (`ink-and-iron-db`). |
| Cloudflare Account ID | `wrangler.toml` | `a9e8a56837c8224180346cb877c73b84` | Cloudflare account identifier for Wrangler deployments. |
| Firebase API Key | `src/firebase-config.js` | `AIzaSyC-jweIiF8o5Dt86EeHxhFgNzzIikkXomc` | Public web client key for Firebase project `ink-and-iron-1c654`. |
| Firebase App ID | `src/firebase-config.js` | `1:41595300123:web:0d6c1ff9b33998ffc78bbe` | Firebase Web App ID. |

---

# 4. Known Tech Debt, Hacks, & AI Shortcuts

### Hardcoded Values & Dummy Data
* **Hardcoded Admin Passcode:** `"meraj7782"` is hardcoded as a fallback default in 8 locations across client and server:
  * `functions/api/admin/login.js` (line 6)
  * `functions/api/admin/stats.js` (line 5)
  * `functions/api/admin/announcement.js` (line 5)
  * `functions/api/admin/users/index.js` (line 5)
  * `functions/api/admin/users/[id].js` (line 5)
  * `src/game.js` (line 5746)
  * `src/engine/D1Service.js` (line 102)
  * `openapi.json` (lines 84, 94, 362)
* **Static Auth Token:** The admin authentication endpoint issues a static string `"admin_authenticated_session"` rather than a cryptographically signed, expiring JWT or HMAC token.
* **Audio Synthesis Placeholders:** Sound effects (pencil scratches, gunfire, artillery explosions) are procedurally generated using Web Audio API oscillators and gain envelopes rather than loaded audio sprites.

### Bypassed Security & Validation Checks
* **Unvalidated Client Sync:** `/api/user/sync` accepts `wins` and `losses` directly from the client JSON payload without verifying combat history or server-side replay logs. Any user can send arbitrary win/loss values.
* **Client-Enforced Account Suspension:** While `/api/user/sync` checks `is_banned === 1`, if a user plays offline or intercepts the network call, the client will allow them to continue playing against the local bot.
* **CORS & CSRF:** Endpoints under `/api/` currently lack explicit CSRF token verification for state-changing POST/PUT/DELETE requests.

### Database Performance & Memory Leaks
* **Missing Index Full Table Scans:** Queries in `functions/api/admin/stats.js` (`WHERE last_online >= datetime('now', '-24 hours')`) perform full table scans on `users` because `last_online` is unindexed.
* **Unbounded Event Listener Accumulation:** In `src/game.js`, `initCustomSelects` attaches `window.addEventListener('scroll', ...)` and `window.addEventListener('resize', ...)` for every custom select element. If `initCustomSelects()` is re-invoked on UI refreshes, duplicate listeners accumulate.
* **Divergent Codebases (Tech Debt):** `src/game.js` (monolithic) and the modular files (`src/engine/*`, `src/render/*`, `src/ui/*`, `src/ai/*`) are out of sync. A build step (e.g. Vite or esbuild) should be introduced to bundle the modular files into a single distribution file rather than manually maintaining `src/game.js`.

### "Band-Aid" Fixes
* **Server-Side Clamp Disparity:** `functions/api/user/sync.js` clamps `planning_duration` to 60 and `playback_speed` to 10. This was a temporary clamp that conflicts with the new custom speed modal (10–300s).
* **Z-Index Escalation:** Stacking context issues created by `backdrop-filter` on `.main-menu-overlay` were addressed by escalating z-indices to `10000`, `100000`, and `999999` rather than restructuring the DOM tree.

---

### Handoff Completion Verification
* `HANDOFF.md` generated at repository root (`c:\Users\NoteBook\Desktop\Game\HANDOFF.md`).
* Standing by for final review.
