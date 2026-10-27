# Video playlist implementation plan

**Goal:** Show only added files and YouTube sources in a clear playlist and switch what plays with one click.

**Architecture:** Reuse existing video layers as playlist entries. One-click Play enables that entry and disables other entries on all screens while retaining placement. Play together restores concurrent video composition. Keep the server clip catalog collapsed and omit placeholder research cards from public hosting. No upload or server saving is introduced.

**Tech stack:** Existing JavaScript modules, native video, YouTube adapter, static HTML/CSS, Node tests and Playwright browser checks.

## Task 1: Playback and portable source metadata

- [x] Add failing tests for solo switching, retained placement/overrides, invalid IDs, together playback, and portable local-file names.
- [x] Implement pure playback helpers in `video-layers.js`, retaining the existing eight-layer limit and video timeline.
- [x] Preserve local file names through sanitation/URL exports and resolve titles in `youtube-source.js`.
- [x] Verify tests and preserve existing source/shape/placement behavior.

## Task 2: Added-video playlist and unified add controls

- [x] Replace the public research catalog with a playlist that appears after sources are added; include native files, demos and YouTube entries.
- [x] Add Play, Ready/Playing/Held/Choose-file-again states, remove actions, reversible Hide video, Play together, and separate selection for placement.
- [x] Group local multi-file selection and YouTube input together. Support relinking missing files in place, preserving IDs and placement.
- [x] Retain collapsed server research clip browsing on LAN; keep current APIs for authoring and outputs.
- [x] Verify browser switching, multiple imports, relinking, visibility, YouTube pause/resume, fresh URLs and mobile fit.

## Task 3: Review, documentation and publishing

- [x] Update video/browser regressions to the explicit playlist interaction.
- [x] Review changes, run automated tests, syntax/build and focused browser checks; inspect desktop/mobile UI.
- [x] Update README/QA and prepare the verified release.
- [ ] Commit and push the authorized repository, wait for Pages CI/CD, and check the public playlist.
