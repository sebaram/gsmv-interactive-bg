# Interview wall backgrounds

Create four reviewable moving backgrounds for the front LED wall and left tiled display, based on the supplied scenario and the official GSMV identity. The user has asked for multiple finished options to choose a style.

1. Read both scenario decks and the official logo guide; retain the original logo artwork and its aspect ratio. Done.
2. Build a local, offline browser player with four real-time 3D scenes: Blue Hour (orbital forms), Common Ground (blue/red ribbons), Soft Architecture (pale spatial sculpture), Living Research (local footage and spatial frames).
3. Provide a control room with paired previews, individual wall outputs, six research cues matching the scenario, speed/brightness/branding controls, subject guides and a calibration overlay. Wall outputs must contain no controls in shooting mode.
4. Use one shared panorama with adjustable front/left aspect ratios. Synchronize settings and animation time between browser windows on the same computer and on LAN computers using a central server, SSE, clock calibration and video drift correction. Clearly document the limit of software synchronization.
5. Test all variants, live settings, pause/resume, clean outputs, local footage, dimensions, calibration and persistence in Chromium. Capture an actual preview sheet for choosing a style.

Files: `index.html` and `studio.css` provide controls; `studio.js` manages settings; `wall.html`, `wall.css` and `scene.js` provide the outputs; `state.js` provides validated shared settings and timeline functions; `serve.py` supports local video ranges; `START.bat` starts the preview; `README.md` documents shooting use. Original material remains unchanged.

Confirmed setup: front 3840×2160 / 16:9, left 3840×2160 input on a 3×2 tiled surface. Assuming each tile is 16:9 gives an 8:3 physical surface. Keep the physical surface separate from the input raster and compensate both geometry and logo aspect. Support both single-computer playback and separate computers on the same LAN. Preview variants are deliberately distinct so visual approval can follow working previews.

## Follow-up: selected directions and growing display setup

The user selected Common Ground and Living Research, defined red as real and blue as virtual, reported that motion was not apparent, requested configurable ratios/grids on both walls and more screens, and requested a combined direction plus a push to `sebaram/gsmv-interactive-bg`.

Diagnosis: the session was running, but the original ribbon rotation and network rotation were too subtle (approximately 0.75–1.5% of pixels changed above a 12-level RGB threshold in two-second samples). The companion research wall had no video. Preview frames also did not receive the controller's corrected server clock.

Implement and verify: a fifth Shared Reality style; stronger absolute-time motion with separate amount control and a visible playback indicator; research footage on every selected output; one to eight editable screens with stable IDs, pixel sizes, input/tile/custom physical ratios, rectangular grids and ordering; a portable server route and configurable external media directory. Preserve old saved looks through migration. Verify pixel motion on front and companion outputs, pause, playback, clock correction, screen editing/addition/removal/reorder and network propagation. Then publish source, local vendor/assets, documentation and previews to the authorized repository, excluding research videos.

## Follow-up: MV Symbiosis and direct video selection

Add one motion direction derived from the six exact colored polylines of the official SVG. Over a 36-second absolute-time cycle, separate soft forms exchange positions and shape, assemble into the MV symbol, hold its recognizable geometry, and unfold into another shared arrangement. Keep the original department signature intact. Support the existing pause, amount, clock, reduced-motion and screen settings. Video can be explicitly included beside a smaller mark or removed for a purely procedural treatment.

Replace the operator-facing research-cue buttons with a searchable video library: actual clip titles, explanations, poster thumbnails, duration, a larger preview and an explicit Use this video action. Reuse the existing selected clips and descriptions; keep originals outside the public repository. Public mode identifies unavailable originals and offers local-file playback. Retain old cue values only for saved-look compatibility and optional topic accents. Verify selection propagation, video/no-video behavior, morph phases, actual pixel motion, mobile layout, public packaging and CI deployment.

## Follow-up: optional video composition on every background

Replace scene-coupled video galleries with an independent native-video overlay supporting up to eight layers. Fresh looks start with no footage. Add clips without changing the background; retain layers across style changes. Support all-screen placement plus per-screen center/width/visibility overrides, direct preview drag/resize and keyboard movement, duplicate/remove, master visibility, physical aspect correction, saved-look migration and portable exports. Handles stay in previews. Reuse the shared timeline and drift correction for every active video; placement edits must preserve decoders.

Verify all six styles, multiple actual sources, both wall shapes, direct gestures, separate-client sync, pause/resume, screen addition, JSON persistence, clean outputs, mobile controls, public file selection and CI deployment.
