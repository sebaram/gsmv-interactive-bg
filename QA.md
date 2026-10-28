# Verification

Google Chrome through Python Playwright; test server http://127.0.0.1:8766.

- PASS: All six directions are selectable
- PASS: Style 1 reaches both independent clients
- PASS: Style 2 reaches both independent clients
- PASS: Style 3 reaches both independent clients
- PASS: Style 4 reaches both independent clients
- PASS: Style 5 reaches both independent clients
- PASS: Style 6 reaches both independent clients
- PASS: Combined style plays muted research on both walls
- PASS: Clock correction aligns independent machines
- PASS: Preview inherits the corrected clock from skewed controller
- PASS: Live playback indicator reports rendering
- PASS: Visible pixel motion: style 2 / front (11.3%)
- PASS: Visible pixel motion: style 2 / left (12.6%)
- PASS: Visible pixel motion: style 4 / front (12.4%)
- PASS: Visible pixel motion: style 4 / left (15.0%)
- PASS: Visible pixel motion: style 5 / front (20.0%)
- PASS: Visible pixel motion: style 5 / left (10.2%)
- PASS: Pause freezes rendered pixels
- PASS: Show visible motion resumes and resets movement controls
- PASS: Zero movement holds decorative output within GPU rounding
- PASS: Brightness updates both outputs
- PASS: Department signature toggles
- PASS: Bilingual research titles toggle
- PASS: Subject guide displays
- PASS: Pointer interaction is configurable
- PASS: Front has editable resolution, custom physical ratio and 5 by 2 grid
- PASS: Left has an independent arbitrary tile layout
- PASS: Calibration follows each screen dimensions
- PASS: Adding a screen creates preview, setup and output link
- PASS: Added portrait screen has a working independent output
- PASS: Combined research also plays on the added screen
- PASS: Screen reordering propagates without changing output identity
- PASS: Clean take clears grids for every screen
- PASS: Video selection 1 plays on both walls
- PASS: Video selection 2 plays on both walls
- PASS: Video selection 3 plays on both walls
- PASS: Video selection 4 plays on both walls
- PASS: Video selection 5 plays on both walls
- PASS: No video produces a procedural-only background
- PASS: Saved look includes all screen layouts
- PASS: Imported look restores style and screens
- PASS: Removing a screen updates previews and outputs
- PASS: Removed outputs clearly report their status
- PASS: Fullscreen hides output hint
- PASS: Screen editor and controls fit a narrow viewport
- PASS: No JavaScript errors across all checks
- PASS: Restricted route /output/clips.csv
- PASS: Restricted route /backgrounds/.git/config
- PASS: Local research video supports precise byte ranges

Also run: `npm test` (49 motion, logo geometry, video-selection, screen-state, migration, timeline and public-bundle tests). Independent browser contexts and deliberately skewed clocks exercise network synchronization. Actual display mapping, camera exposure and separate physical machines require on-set validation.

## 2026-10-27: direct video adding, YouTube and individual preset parts

- `npm test`: 49 passing tests. Syntax checks and public build pass.
- `qa_static.py`: direct file adding on public hosting, no separate preview/detail player, existing native playback and reduced-motion behavior pass.
- `qa_video_layers.py`: optional footage on every preset, multiple native sources, per-screen physical placement, drag/resize, visibility, save/load, new screens and separate-client sync pass.
- `qa_authoring.py`: preset motion, copied objects, per-screen identity and fresh-storage bookmark/output restoration pass.
- `qa_preset_parts.py`: all six presets expose individual parts; verifies nested transforms/visibility/reset, cross-screen leaf copies, independently edited copied descendants, parent-scaled/rotated dragging, canvas picking and bookmarked edits. Eleven focused authoring tests pass, including retaining more than 160 part edits and old root IDs.
- `qa_youtube.py`: direct-add cards, local file chooser, link validation, zero YouTube playback requests in the editor, muted official-API adapter commands, pause/rate/visibility, per-screen layout, shape, minimum internal player size, duplication, portable URLs, embedding errors, teardown and mobile layout pass. External API boundary is deterministic.
- Actual YouTube IFrame API and stream `M7lc1UVf-VE` additionally loaded and played on the wall; muted playback time advanced, with no JavaScript errors.
- `qa_logo_video.py`: direct library adding, MV motion, settled paused pixels, assembly captures and mobile layout pass.
- Screenshot pause assertions wait for the paused frame and compositor settling; settled captures remain pixel-identical. No transform/geometry drift found.
- Rendered Hallmark sweep: no Floor failures or open Reflex findings; matching form fields retain an answered Finish note, and the existing scene-thumbnail waiver remains.

YouTube requires internet and embedding permission; its branding/overlays/advertising and streaming synchronization remain service behavior. Local files remain the controlled option for uninterrupted takes.

## Seeded MV variation and the Elements list

`npm test`:54 passing tests. Builds and JavaScript syntax checks pass. New tests cover repeatable varied paths/surfaces, exact assembly, classic randomness0, seed/timing bounds and persistence, unique seeds for added/copied sculptures, and independent geometry with editable facets.

`qa_mv_variations.py` verified multiple MV instances on one screen, changing one seed while the other instance's rendered pixels stay unchanged, facet editing, motion/pause and fresh-storage URL persistence. `qa_element_list.py` verified expandable hierarchy, nested search context, row visibility, clear selection, canvas/list synchronization, stable search/numeric focus, add/duplicate/remove and MV controls, unobstructed painted row controls, and a bounded390px layout. `qa_preset_parts.py` and `qa_authoring.py` regressions pass.

Read-only review found no material defects. The Hallmark renderer reports a false occlusion finding for rows outside the element list's scroll viewport: its text-center probe does not intersect ranges with overflow ancestors before testing the element below. Actual clipped rows are not painted over subsequent fields; screenshot inspection and a viewport-clipped hit-test verify visible row controls. Disabled controls use explicit fill/ink/cursor styling. The existing matching-form-fields Finish note and scene-thumbnail waiver remain.

## Direct preview editing and list deletion

58 unit tests pass, including preset/part deletion, subtree removal, independent copy survival, preserved unrelated selection, URL persistence and repeated-delete/reused-ID safety. Public packaging and JavaScript syntax checks pass.

`qa_preview_interaction.py` verifies immediate list-to-preview highlighting, hover feedback, first-gesture click-and-drag without enabling a mode, accurate pointer displacement, group-label movement, signature dragging, clean outputs, pinned monitor visibility, portrait fitting and skipping invisible MV links. `qa_delete_elements.py` verifies inline Delete versus Hide, preset/group descendants disappearing from the list and scene, copies staying selected/visible, fresh-storage bookmarked deletions, repeated deletion and ID reuse, and Reset preset restoration. Element-list and preset-part regressions pass.

`qa_authoring.py` checks procedural pixels through the WebGL buffer so native video or preview markers composited above the canvas are not mistaken for scene movement; native playback pause is checked separately. Gesture regressions use labels for deliberately selected groups, while the direct-preview test picks actual visible surfaces. Read-only review findings for preserving selection and repeated deletion were reproduced and fixed.

## Mouse actions and authoring shortcuts

65 automated tests pass. Clipboard coverage includes copied child edits, source deletion, changed/reused custom source IDs, retained MV facet variations, recursive provenance, independent whole-MV seeds and atomic refusal at the object limit. History coverage includes drag grouping, redo, preserved playback settings, external-content resets and state sanitation.

`qa_author_shortcuts.py` verifies Ctrl/Cmd copy/paste/cut/duplicate from list and preview, Delete, Insert, Escape, undo/redo, one undo per drag, one paste per keypress after scene rebuilds, native text-input behavior, right-click menu actions, keyboard menu navigation, mobile bounds, fresh-storage URL restoration, local-only clipboard/history and clean outputs. The menu was visually inspected. Authoring, preset-part, element-list, direct-preview and deletion browser regressions pass against isolated static builds. Concurrent controllers must use static mode for independent test arrangements; LAN mode intentionally synchronizes their state.

Read-only review found two clipboard/MV variation regressions. Both were reproduced with failing tests and fixed; final review found no remaining important issues. The controller menu sits outside preview frames to avoid clipping. Frame keyboard forwarding uses replaceable handlers so scene rebuilds do not multiply actions. Programmatic scroll updates do not dismiss the menu; outside clicks, wheel input, Escape and resizing do.

## Protected groups and compact two-pane authoring

66 automated tests pass, including nested group edit targets and URL persistence of explicit ungrouping. `qa_group_editor.py` verifies grouped surface picking, locked-child selection and disabled destructive actions, explicit Ungroup/Regroup, part deletion and undo, compact rows, side-by-side Layers/Properties, long ribbon discovery and transforms, bookmarked line edits, narrow layout and first-gesture group movement from an older saved leaf selection. The desktop editor was visually inspected with the entire panel below the pinned preview.

Shortcut, direct-preview, preset-part, deletion, list and authoring browser regressions pass. Part-specific regression scenarios now explicitly ungroup their parent or restore a previously ungrouped look; defaults remain protected. Accessible visibility and trash icons replace wide row action text. Long-line labels retain legacy IDs. Read-only review found a stale leaf handle target; it was corrected consistently for picking, drawing, pointer gestures, context menus and keyboard movement, then verified with a browser regression. No remaining important review findings.

## Added-source video playlist

69 automated tests pass, including solo/together playback with retained per-screen placement, portable local-file names, and matching-opener runtime media for newly opened outputs. Public mode now lists only added native files, demos and YouTube sources; the LAN catalog stays in a separate collapsed browser. Hide/Show preserves the list and composition. Placement is separate from playback selection.

`qa_video_playlist.py` verifies multiple file import, actual native output switching, retained placement, together playback, reversible Hide/Show, YouTube joining the same list without editor player requests, fresh-storage names and source metadata, in-place reattachment at the eight-entry limit, clean missing-file outputs, expired root-storage recovery and mobile fit. Desktop and mobile UI screenshots were inspected. `qa_youtube.py` verifies the official-player boundary, seek/pause/rate/visibility, shape, duplication, saved sources and player disposal. `qa_static.py` verifies project-path hosting, local media, demo composition, controls and reduced motion. Group editor and authoring regressions pass.

LAN composition checks pass across all six backgrounds, two sources, independent physical placement, preserved decoders, separate playback clients, pause/resume, saved looks, duplication/removal and added screens. The retained-expired-file test uses a fresh root controller after closing the importing controller; a bookmarked URL deliberately takes precedence over retained server state. Preview load failures mark stale local files as missing and preserve their names for reattachment. The MV/server catalog regression also passes.

Review findings for reversible Show, missing-file wall boxes and stale stored blobs were reproduced and fixed. Missing sources do not render unavailable placeholders as video content. A newly opened live output can use its matching editor's runtime files, while saved URLs remain free of blob references. No backend or media uploads were added.

## Per-preset scene appearance

71 automated tests pass, including bounded appearance settings, strict hex colors, independent preset state and URL restoration. `qa_appearance.py` verifies all six presets, exact solid RGB values on both physical screen shapes and in a composited wall screenshot, glow/light/floor pixel differences, automatic bright-background identity contrast, missing-floor raycast exclusion, retained video decoder identity, bookmarked settings, responsive controls and appearance-only reset. After switching away and back, reset pixels match the original paused baseline exactly, guarding against compounded lighting.

Solid mode removes the CSS vignette as well as the shader gradient. Browser screenshot tests check actual delivered pixels in addition to the canvas buffer. Rendering comparisons bring the controller to the foreground so background-tab animation throttling cannot leave stale buffers. Desktop/mobile panel screenshots were inspected. Playlist, grouped authoring and YouTube adapter regressions pass. Read-only review's invisible-floor and vignette findings were reproduced, fixed and rechecked; no remaining important findings.

A separate LAN playback browser context received changed appearance settings through the server and rendered the exact expected screenshot RGB, confirming synchronization beyond the controller's browser storage.

## Video elements and object motion Properties

76 automated tests pass. New coverage verifies continuous independent clocks, frozen originals versus animated copies, copied-leaf ancestor coordinates, source replacement/reuse, persistent video screen assignments, media manifests and preserving the selected video when another row is deleted. JavaScript syntax checks and public packaging pass.

`qa_media_elements.py` verifies Motion speed and Movement amount in artwork Properties, freezing one MV while another advances, independent video duplication/source changes, front/left assignments, per-video pause rate, direct preview drag/list selection, in-place YouTube-to-file replacement, blank video creation, clipboard/delete/undo, unrelated-row deletion, saved motion/media settings and mobile fit. The two-pane video Properties layout was visually inspected.

Static playback, YouTube adapter, playlist, appearance, grouped editor, shortcut, preset-part and authoring regressions pass. LAN composition verifies multiple native sources, preserved decoders, physical positioning, drag/resize, shared pause, saved looks, added screens and expired-file reattachment. The broader LAN suite passes 49 browser/server checks, including independent object clock updates across playback clients. Its generated report now goes under ignored previews rather than replacing this history. Read-only review reproduced two copy-coordinate/selection issues; dedicated regressions now pass and final review found no remaining important issues.

## Persistent server library (2026-10-28)

76 JavaScript tests and 8 HTTP/storage integration tests pass. Storage checks cover authentication/logout, expiry/password rotation, cross-origin rejection, SQLite persistence, saved video references, public byte ranges, signatures/filenames, upload and quota limits, interrupted-upload cleanup, malformed JSON and isolation of source/database files. Hosted mode disables the LAN state API. Static builds make no storage API requests.

`qa_server_library.py` passes against an isolated real server: admin sign-in, password-field clearing, uploading an actual MP4, saving/updating/renaming/loading a look, fresh unauthenticated browser playback, deletion, logout and desktop/mobile bounds. Screenshots were inspected. The existing media-element browser regression also passes, including local files, source replacement, independent motion, per-screen placement, clipboard/history and portable URLs. Production container/deployment verification is tracked separately in the implementation plan.

GitHub run 40533446464 passed build, Pages and self-hosted `mvbg` deployment. Production HTTPS checks passed administrator sign-in with the provisioned password, Secure/HttpOnly cookies, real MP4 upload, saved-look reads from an unauthenticated client, byte ranges, browser login/load/logout and standalone video playback. The verifier retains only its own temporary look/video across the next rollout to check volume and session persistence, then removes those test records.

## Astra floor-wall collection (2026-10-28)

79 JavaScript tests and 9 server tests pass. New coverage includes grounded sway transforms, independent clocks, both new preset IDs through authored/appearance URL sanitation and server save/load, and all16 curated configurations through portable look encoding. The public bundle contains the new scene module and downloadable look collection. Old preset IDs remain unchanged.

`qa_floor_looks.py` renders all16 front-wall compositions and checks authored settings, actual changing pixels, repeatable held phases, valid semantic edit IDs, both new companion-wall outputs, optional native-video decoding and clean outputs. Generated front/left thumbnails and the complete comparison sheet were visually inspected. The sixteen looks provide A/B variations of all eight directions for a floor-mounted4.44×2.5m16:9 wall, keeping the central interview zone quiet for seated and standing subjects. New architecture uses grounded sculpture pivots and a shallow floor; original scenes receive separate authored palette/placement variations.

The full authoring, independent video element and all-eight-preset appearance browser regressions pass. Review caught stale floor-grid IDs in the Living Research collection; these were replaced with the preserved legacy IDs and checked against actual manifests. Final read-only review found no further important issues. The scene camera is an authored stage view; physical camera perspective is not calibrated or tracked.

## Research meanings and relational sculpture

87 JavaScript tests and9 server tests pass. Four new authorable sculptures use absolute-time relational motion: co-presence, shared-coordinate registration, bidirectional response, and collaborative pavilion assembly. Tests cover approach/shared/reopening landmarks, passage after registration, causal outgoing/returning responses, exact repeatability, zero movement, bounded transforms, independently frozen copies and portable copy/paste. Meaning metadata recognizes visible whole-object copies whose source has been archived, and handles cyclic provenance safely.

`qa_research_meanings.py` renders all16 Meaning looks, verifies changing pixels, checks the complementary companion-wall composition, and exercises sourced editor explanations, A/B loading, independent speed, duplicate/delete/undo and mobile layout. The artwork and expanded explanation panel were visually inspected. The original16 Astra compositions pass their complete render regression, including held-phase repeatability and optional native video. Video-element and grouped-editor regressions pass.

Primary sources were checked for the official logo's human/technology values, faculty research areas, and UVR's shared-space and bidirectional-object themes. The new works are explicitly editorial interpretations, with source notes in the editor and `docs/scene-meanings.md`; explanatory text is absent from wall outputs. Read-only review found no important motion, copying, grouping, persistence or research-attribution issue. The original eight preset builders and original Astra look data remain unchanged.

## Kinetic 3D revision

88 JavaScript tests and 9 server tests pass. New coverage requires clear secondary movement in all four research objects at opening, assembled and reopening phases. Fractional movement amounts retain seamless 28-second boundaries; zero amount and zero speed remain still. Co-presence uses solid twisted ribbons in place of the seat/table arrangement; portals add scanning guides, response folds ripple continuously, and pavilion bays hinge with orbiting contribution panels. A parent yaw reveals depth without tilting the common floor.

`qa_research_meanings.py` passes all16 rendered compositions and the source panel, A/B loading, independently frozen object, duplicate/delete/undo and mobile checks. `qa_kinetic_motion.py` verifies actual changed pixels in four detail views over short intervals at0,12,15 and25seconds, including the assembled phase. It renders a28-second1280×80024fps comparison at actual wall speed; the four artwork details are cropped for visibility. Extracted motion phases and the refreshed full-wall previews were visually inspected. Existing saved look JSON is not rewritten by this renderer upgrade.

## Preset browser and screen hierarchy

The four kinetic graphics have independent preset IDs8–11; IDs0–7 retain their meanings.89 JavaScript tests and9 storage tests pass, including authored-state/appearance URL persistence for all four added presets and server save/read support. The public-bundle test checks every element thumbnail and all four new preset images.

`qa_preset_browser.py` verifies all twelve cards, per-preset edits, eleven loaded thumbnails, visual insertion and Insert, physical-screen parent rows, collapsing/revealing, search, moving a group between screens, shared/unassigned video parents, portable URLs and mobile fit. The search regression caught child parts reporting a group's previous screen; matching now follows the current root assignment. The thumbnail generator forces a fresh document per composition so hash-only navigation cannot capture stale artwork. Desktop and mobile chooser screenshots, screen grouping and actual new-preset renders were inspected. Existing grouped editing, all-twelve-preset authoring and unified video-element browser regressions pass.

## Saved-look placement

The hosted library now mounts below the preset grid before requesting server data. The isolated hosted-browser suite verifies its parent group, empty count, failed-session retry, save/rename/update/load, public playback and mobile bounds.89 JavaScript tests pass.

## Saved editor previews

10 storage integration tests pass, including compatible migration of old project records, bounded JPEG validation, public thumbnails and thumbnail retention during rename. The hosted browser suite verifies actual480-pixel preview capture, new editor cards, changed previews after update, unchanged previews after rename and public loading. Earlier records remain in their own section.

## Unsaved look protection

93 JavaScript tests pass. Draft fingerprints ignore runtime time, pause, selection and automatic source aspect metadata, while retaining authored changes. Tests verify per-preset draft baselines, undo-to-clean behavior, saved snapshots versus edits made during a request, and loaded-project provenance. Hosted browser checks confirm cancellation preserves current edits, accepting loads the requested look, selecting another saved record disables Update, and a failed save leaves the dirty flag intact.

## Editable text layers

96 JavaScript tests and11 storage tests pass. Text tests cover a bounded, idempotent HTML allowlist, removal of active content/resources, safe inline styles, typography bounds, independent text copies, text-only reset and per-screen URL persistence. A real server restart retains authored HTML, Korean text, fonts and positions exactly.

`qa_text_elements.py` verifies independent front/left footers, editable research titles and signature text, proportional4K font sizes including inline pixel sizes, fonts/weight/italic/color/width/spacing/opacity, new text elements, duplicate/delete/undo, moving to another screen, direct preview drag, clean standalone outputs, bookmarked restoration and mobile fit. Saved thumbnails include wrapped inline text through actual browser text ranges. Rendered wall, text Properties and thumbnail images were inspected. Preset-browser, grouped-editor and full twelve-preset authoring regressions pass; gesture-only resize checks hold the animation still to avoid a moving-handle timing race.

## Read-only built-ins and redundant-save cleanup

97 JavaScript tests and12 storage integration tests pass. Built-in metadata is frozen, and selecting a preset creates pristine artwork/appearance even when reselecting the active preset. The current display setup, videos and on-set brightness are retained. Browser checks verify fresh selection and separate saved-look recovery; authenticated POST/PUT/DELETE requests cannot modify built-in assets or a preset API. Editor copy describes edits as a working look rather than mutations to a preset.

The32 legacy server records were compared against the bundled Astra/Meaning JSON by name and full look data. All32 were exact redundant copies, with no custom/modified records. They were backed up under ignored `data/backups/` and deleted through the authenticated API after a second unchanged-record check. All34 uploaded videos were retained.

## Explicit insertion destination

The Add an element area has an independent Add to screen selector, defaulting to the front display and tracking configured screen names. Browser coverage verifies thumbnail insertion to front, Insert to left, a blank video restricted to front, a new text layer placed on left, and that changing the selected layer does not change the insertion destination.97 JavaScript tests pass.
