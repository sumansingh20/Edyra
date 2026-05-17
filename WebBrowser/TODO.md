# Edyra WebBrowser - Work Tracker

This file tracks implementation steps for turning the existing Electron UI into a fully functional Chrome-like browser.

## Step 1 — IPC/event bus + state wiring
- [x] Define shared event bus channels between main and renderer (navigation/loading/title)
- [ ] Add renderer→main invokes for settings (adblock/devtools), navigation, download cancel/reveal
- [ ] Ensure history recording hooks into real navigation events


## Step 2 — Loading indicator / progress UI
- [ ] Implement loading/progress indicator in topbar (spinner/progress bar)
- [ ] Wire `did-start-loading`, `did-stop-loading`, `did-fail-load`, `load-progress` to renderer

## Step 3 — Download manager completeness
- [ ] Robust download id registry in main
- [ ] Implement download cancel (`item.cancel()`) and reveal in folder
- [ ] Update renderer UI to reflect cancel + completed states

## Step 4 — Incognito mode correctness
- [ ] Ensure incognito tabs run on an isolated non-persisted session partition
- [ ] Ensure cookies/storage/history do not persist for incognito
- [ ] Add Incognito toggle/tab creation + UI indicator

## Step 5 — History manager
- [ ] Record visits from main navigation events (per active tab)
- [ ] Implement searchable history modal with open + clear

## Step 6 — Bookmarks
- [ ] Integrate bookmark bar UI into renderer (existing code support)
- [ ] Ensure add/remove/update fully works and persists

## Step 7 — Security hardening
- [ ] Tighten URL scheme allowlist + navigation denylist
- [ ] Prevent window.open/target=_blank from bypassing
- [ ] Validate download paths

## Step 8 — Ad blocker (basic)
- [ ] Implement minimal filter list enforcement using `session.webRequest.onBeforeRequest`
- [ ] Wire settings toggle to update rules

## Step 9 — Settings + theme application
- [ ] Apply theme switch via renderer class/stylesheet vars
- [ ] Apply search engine + homepage to address bar + home button
- [ ] Wire devtools toggle to enable/disable devtools

## Step 10 — Keyboard shortcuts
- [ ] Implement Ctrl/Cmd+L, T, W, R, Alt+Left/Right, Ctrl+Shift+I

## Step 11 — Verification
- [ ] Manual smoke test: multi-tabs, restore session, history, downloads, incognito, adblock, shortcuts
- [ ] Build test: `npm run build`

