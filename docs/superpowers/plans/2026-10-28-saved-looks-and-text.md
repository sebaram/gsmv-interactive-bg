# Saved Looks and Editable Text Implementation Plan

**Goal:** Make saved editor compositions easy to find, preview and protect, then enable authoring of display text.

**Architecture:** Keep the twelve built-in preset IDs intact. Saved compositions remain authenticated SQLite records with public reads. Add optional metadata through a compatible migration. Use a stable authored-state fingerprint for edit protection. Store sanitized text properties in the existing per-element authored edits so URLs, JSON and server looks share the same representation.

**Tech stack:** Browser JavaScript, Three.js, Python standard-library HTTP/SQLite storage, Node tests and Playwright browser QA.

**Constraints:** Preserve all existing records and uploaded media. Keep the screen and element editing model. No arbitrary scripts or external HTML resources in text. Each numbered step ends with verification, a separate commit and push, and deployment checks. Execute sequentially in the current session.

## 1. Saved looks next to presets

- [x] Move `.server-library` into `.backgrounds` below `.style-grid`; call it Saved looks and explain editor save/load semantics.
- [x] Mount a loading state before fetching session/library data, with retry on failure and a persistent loaded count.
- [x] Extend `qa_server_library.py` for parent placement and loading/empty states. Run the isolated hosted browser test and Node checks.
- [x] Commit and push this working UI change.

## 2. Saved editor thumbnails

- [ ] Add optional `origin` and JPEG `thumbnail` columns to `projects`, preserving existing rows as legacy. Validate thumbnail payloads and retain thumbnails during rename.
- [ ] Add `look-thumbnail.js` to capture the actual main-wall canvas and visible overlays at save/update time. Show thumbnail cards with explicit selected/loaded state and a fallback for earlier looks.
- [ ] Put editor saves in Saved looks; retain previous records under Earlier saved looks, without deleting or rewriting their configurations.
- [ ] Verify migration, thumbnail validation/persistence, save/update/rename, public cards and mobile layout in storage/browser tests.
- [ ] Commit and push.

## 3. Unsaved edits and save targets

- [ ] Add a pure authored-configuration fingerprint and draft tracker; exclude animation time, playback and selection from dirty detection.
- [ ] Guard preset changes, saved-look/research/JSON loads and page exit when edits are unsaved. Keep per-preset drafts in the existing state.
- [ ] Track loaded project separately from the dropdown selection; permit Update only for that project and prevent an accidental write to another look. Mark only the submitted snapshot saved after a successful response.
- [ ] Test cancel/continue, undo-to-clean, playing without false alerts, failed saves, wrong-target updates and fresh loads.
- [ ] Commit and push.

## 4. Editable text

- [ ] Add a bounded text schema and a simple HTML allowlist: paragraphs, line breaks, emphasis, lists and safe inline formatting; strip active content and remote resources.
- [ ] Add Properties controls for existing topic footer and research text, including HTML, font family, size, weight, italic, color, alignment and line spacing. Add optional text elements through the existing element chooser.
- [ ] Render text per screen, independently of the global branding/title switches when its visibility is explicitly authored. Keep grouped editing, drag/resize and copying consistent.
- [ ] Verify exact persistence in URL/JSON/server records, separate screen content, formatting, visibility, reset, safe HTML, browser output and editable-text thumbnails.
- [ ] Run relevant regression tests, commit and push, then verify the final deployment.
