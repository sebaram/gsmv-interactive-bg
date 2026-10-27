# KAIST META Interview Background Studio

Real-time 3D backgrounds for interview shoots, with configurable display walls, research video, local playback and network control.

**[Public studio](https://sebaram.github.io/gsmv-interactive-bg/)** · [Six background directions](previews/comparison.jpg)

## Backgrounds

| Direction | Treatment |
| --- | --- |
| **MV Symbiosis** | Six exact facets from the official MV symbol soften, exchange form and position, assemble into the mark, then unfold together. Optional, freely positioned video layers. |
| **Shared Reality** | The combined direction: Common Ground's red real-world and blue virtual ribbons combined with the research direction. |
| **Common Ground** | Interwoven red and blue ribbons representing exchange between real and virtual spaces. |
| **Living Research** | Moving connection networks, with optional footage on any screen. |
| Blue Hour | Polished blue orbital forms with restrained red accents. |
| Soft Architecture | Pale arches, warm stone and floating blue/red forms. |

The original department signature is retained. The source identity and color guide are from [meta.kaist.ac.kr/logo](https://meta.kaist.ac.kr/logo); the supplied scenario decks and selected clips provide the video library.

### MV Symbiosis

The new scene uses the six red and blue polylines copied directly from the official SVG, rather than an approximate M/V icon. Over a 36-second cycle, the facets become soft volumetric forms, move in complementary pairs, consolidate into the recognizable symbol, hold it, and unfold into another exchange. The red/blue connections represent mutual influence. Pause, speed, movement amount, reduced motion and every configured screen remain supported. The interview subject's area stays quieter toward the center-left.

Every background starts without video in a fresh studio. Switching backgrounds preserves any video layers you have added and their placement. Use **Videos** to add footage wherever it suits the composition, or choose **Hide video** to keep the list while showing only motion graphics. Under an operating-system reduced-motion preference, it shows the assembled symbol until playback is explicitly enabled.

## Author a preset and bookmark it

### Scene appearance

Open **Scene appearance** under Wall brightness in the on-set controls. **Preset atmosphere** keeps the original direction; **Custom gradient** uses your base/glow colors; **Solid color** removes the background gradient and vignette. Pick colors with the swatches or enter hex values. Choosing a color from Preset atmosphere switches to Custom gradient.

**Background glow** adjusts the atmospheric color strength. **3D lighting** scales the scene lights and reflections without dimming the background or footage. **Floor opacity** fades the floor shading; at zero the invisible floor no longer intercepts preview clicks. Solid mode disables irrelevant glow controls. Bright custom backgrounds automatically use the colored department mark and dark text for contrast.

Appearance settings belong to each preset and synchronize to the wall outputs. They are retained in saved JSON and look URLs. **Reset preset appearance** restores only this preset's colors, lighting and floor; authored elements, footage, wall brightness and motion settings remain available. Changes update existing shader/light settings without rebuilding objects or video decoders.

Existing controls also cover overall Wall brightness, pause/resume, pointer interaction, signature/titles, screen ratios/grids, and element/video placement, size, rotation and visibility. Select an animated object to change its Motion speed and Movement amount in Properties.

### Elements

All six backgrounds are starting **presets**. In **Author the preset**, select an element, choose its screen and set position, size, rotation and visibility. **Duplicate element** gives it an independent placement: for example, keep the main sculpture large on the front/right screen and put a smaller copy on the left. Copies keep their animation and survive removal of a custom source object. **Add element** offers MV sculptures, red/blue ribbons, orbital forms, networks, spheres and arches on any preset.

The editor has a compact **Layers** pane on the left and selected **Properties** on the right. Expand groups to inspect their contents, search by name/part/screen, and use the eye or trash icons for visibility and deletion. Full names appear in Properties and row tooltips. The panes stack on narrow screens. Search **long** to find the red/blue **Long line** ribbon layers; their position, size, rotation and visibility are editable like other elements. Floor-grid connections are named **Connection line**.

Animated objects and groups have their own **Motion speed** and **Movement amount** in Properties. Speed changes preserve their current phase; 0 freezes only that object. Group settings apply to animated descendants, and duplicates can move at different rates. Static parts explain when motion belongs to their parent group. Session Pause/Resume still controls the whole composition.

Videos appear in the same Layers list. Choose **Video element** under Add an element for a blank placement, or add a file/YouTube source from Videos. Video Properties lets you name it, reuse another video's source, replace its file or YouTube link, select its assigned screens, and change its **Playback rate**. Duplicate to reuse footage in another position or assign a different source. Videos support the same selection, preview dragging, visibility, deletion, clipboard and undo commands as artwork. Each placement keeps its own source, screen assignments and playback rate in saved looks; local file bytes still need reattaching after reopening.

Groups edit as one unit by default. Clicking a child in the preview or list selects its grouped ancestor; child Hide/Delete controls are disabled. Choose **Ungroup** in Properties or the right-click menu to edit individual parts. Nested groups keep their own boundary until ungrouped too. **Regroup** protects the artwork again. Expanding a group only shows its contents. Grouping choices support undo and are saved in look URLs; existing child transforms and animation are preserved.

Click and drag visible artwork in the monitor to select and move it in one gesture. Grouped artwork moves together; after Ungroup, parts can be moved individually. Hover outlines show pickable parts; selecting an item in the list automatically highlights it in the preview and reveals its selection handles. Drag a selection label or frame border to move its whole group, or drag the lower-right corner to resize. Arrow keys move the focused selection and Escape clears it. The monitor and Pause control stay visible while using the list and controls, with preview proportions fitted to each screen, including portrait setups. The hierarchical element list exposes individual ribbons, rings, spheres, arches, network nodes/links and MV facets inside their parent sculptures. Child edits compose with parent motion and group transforms; originals and copied groups keep independent part edits. The element list also includes the preset's sculptures, decorative components and each screen's department signature, research titles and topic footer. Signatures and text are positioned separately per display; choose that display's existing copy. Position percentages describe the object's center for 3D elements and the upper-left anchor for signature/text. **Reset element** restores a preset component; **Reset this preset** clears only that preset's edits and added objects. Video layers remain independent.

### Multiple MV sculptures

New MV sculptures and whole-sculpture duplicates automatically receive distinct motion seeds. Each instance owns its geometry and varies its timing, spread, rotations and soft-form proportions. They assemble into the exact six-facet MV mark at different points in their cycles. Ungroup the MV and any nested group to edit its individual facets and links.

Select a whole MV sculpture in the **Elements** list, then use **New variation**, **Seed** or **Randomness**. A higher randomness value makes shape and path differences stronger; 0 keeps the classic motion. Existing preset sculptures retain the classic look until edited. Duplicate the sculpture, position/resize each copy separately, and give it another seed when wanted. Seeds and variation amounts are stored in look URLs, so reloads and playback clients reproduce the arrangement. Reduced-motion mode holds the assembled mark.

**Delete** removes the element or group from the authored scene and its list, including group descendants. It is separate from visibility: **Hide** keeps the item available to show again. Deletions persist in saved looks and URLs; independent copies survive deletion of their source. **Reset this preset** restores deleted preset elements along with the default arrangement. Editor highlights and hover outlines never appear in wall outputs.

Right-click an element in the preview or list for **Copy**, **Cut**, **Paste**, **Duplicate**, **Ungroup/Regroup**, **Hide/Show**, **Delete**, and **Add chosen object**. Keyboard shortcuts work from the preview or list: **Delete/Backspace** removes the selection, **Ctrl/Cmd+C/V/X** copies/pastes/cuts, **Ctrl/Cmd+D** duplicates, **Ctrl/Cmd+Z** undoes, and **Ctrl/Cmd+Shift+Z** or **Ctrl+Y** redoes. **Insert** adds the type chosen under “Add a moving object.” In the preview, **Arrow keys** move the selection, **Shift+Arrow** moves faster, and **Escape** clears selection. Text fields retain normal typing, clipboard and undo behavior.

Element copy/paste stays within its preset and this editor tab; copied parts retain their source form and child edits even after deleting or changing the source. Whole MV duplicates get independent variations. **Undo/Redo** buttons also recover authoring changes, with one step per drag or focused numeric edit. History lasts for the current editor session, keeps screen/playback settings, and clears when external authored content changes. The resulting arrangement, including pasted objects, is saved in the look URL; clipboard and undo history are not.

The address bar updates automatically with a versioned `#look=v1.…` fragment. **Copy look link** copies the current arrangement; bookmark or share it to restore the preset, authored elements, screen shapes, video choices and playback settings in a fresh browser. No server save is needed. Public output links also carry the look, including Display setup and URL fields, so their addresses can be bookmarked directly. Runtime editing handles are excluded. Playing looks restart their timeline on opening; paused looks retain their held phase.

The URL contains configuration, not video bytes or file permissions. Choose local video files again after opening in a new browser. YouTube sources, portable demo sources and LAN library clip IDs are retained. On the LAN controller, opening a saved look applies it to the session once; subsequent edits continue to synchronize with playback computers.

## Choose a video

The monitor now has a **34-clip video library** instead of research-cue buttons. Search titles, descriptions, topics or clip IDs, or browse with Previous/Next. Each card has an actual thumbnail, title, explanation, topic and duration, with a direct add button. There is no separate preview player or detail pane.

The **Videos** section puts **Add files** and **Add YouTube** together. Select one or more files, or add a YouTube URL and optional title. Only sources you add appear in **Your videos**; empty research placeholders are omitted from the public studio. Up to eight entries are supported.

Click an entry to show it by itself. A **Playing** or **On screen · paused** badge identifies what is visible. Switching retains each video's position, shape and screen placement. **Play together** shows ready entries simultaneously; use Placement to arrange the composition. **Hide video** and **Show video** preserve the entire visible composition and the list. **Remove** deletes an entry.

Public and JSON look links retain file names, placement and YouTube sources. Local media itself is never saved or uploaded. Reopened files show **Choose file again**; reattaching replaces the missing source in place, retaining its ID and placement even when the list is full. Keep the editor open while live wall outputs use local files. LAN mode keeps the original catalog in **Browse server research clips**, collapsed by default.

### YouTube

Paste a YouTube watch, share (`youtu.be`), Shorts, live or embed link in **YouTube**, optionally name the layer, and click **Add YouTube**. A timestamp in the link becomes the start point. The editor uses a lightweight placement card; opening the wall output loads the official YouTube player, muted and looping. It follows the session's pause, visibility and supported playback rates, with periodic timeline correction. This is best-effort streaming synchronization, not frame-accurate synchronization between separate YouTube players.

YouTube layers use the same per-screen placement, size, duplicate/remove and bookmark controls as local files. Choose **YouTube shape** for widescreen, portrait or square footage. YouTube links survive reopening a saved address without file selection or server storage. Playback needs internet and a video that permits embedding. YouTube can show branding, overlays or advertisements; use local files when those would interfere with a take. The adapter uses the [official YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) and [supported player parameters](https://developers.google.com/youtube/player_parameters).

Choose **Placement** on a playlist entry, or select its row in **Layers**, to open its **Properties**:

- Choose the selected layer; **Duplicate** or **Remove video** manages individual layers.
- Click and drag a video in the preview to select and move it; drag its lower-right corner to resize. Arrow keys move a focused video; Shift moves faster.
- Choose assigned screens to show this instance on one or several outputs. Solo/together playlist actions retain those assignments.
- Choose **All screens** or an individual screen before entering horizontal center, vertical center and width percentages. Dragging edits the screen you drag on. An All screens change replaces that property on every screen.
- **Visible here** shows or hides a layer on the chosen screen. **Show videos** hides all entries while retaining their positions; **Remove video** deletes only the selected entry.
- **Reset placement** resets the selected scope. Instances assigned to all screens also include newly added screens; specific-screen assignments stay specific.

Placement and source aspect compensate for each screen's physical shape, including tiled and portrait screens. Editing handles appear only in the monitor preview. YouTube retains its own player behavior and possible overlays. Saved looks retain every layer and per-screen placement; old single-video looks migrate automatically.

Five primary examples have English titles and descriptions; the additional selected clips retain their supplied Korean titles and explanations. Poster images are real frames from those clips. Original video files remain outside Git.

## Public browser mode

Open the public studio in Chrome or Edge. Choose a background, configure screens, and open each output in its own window. Controls synchronize windows in the **same browser**.

Video is optional. Original laboratory videos are not published. Use **Add files**, **Add YouTube** or **Try demo animation**. The playlist appears after adding a source and shows only your entries. Files play directly from your computer and are not uploaded. The matching editor supplies its live file references when opening a wall output; bookmarked addresses retain names and placement and ask for local files again. Missing files remain absent from the wall until reattached.

For synchronized playback across separate computers, use the LAN server below. GitHub Pages is static hosting and does not run the Python sync server.

## Local and LAN playback

1. Clone or download this repository.
2. Double-click **START.bat**, or run `python serve.py --open`. Only the server computer needs Python 3.
3. Open `http://127.0.0.1:8765/backgrounds/` in Chrome or Edge. Keep the server console open.
4. Choose a preset, then add a local file or YouTube link if wanted. Open each screen's output, move the window to its display and click the background for fullscreen. **Esc** leaves fullscreen.
5. Before recording, use **Prepare clean take** to clear calibration, framing and tile-grid overlays on every screen and disable pointer interaction.

The server maps `/backgrounds/` to the app regardless of the cloned directory name. It serves only the app and selected media directory, and blocks hidden paths such as `.git`.

### Research files

On the current shoot workspace, the original clips are already at `../output/clips/` relative to this repository. To use another folder:

```powershell
python serve.py --media-dir "D:\Shoot\selected-clips" --open
```

The `GSMV_MEDIA_DIR` environment variable is also supported. `clips.json` lists all 34 library items, their descriptions, poster paths and exact expected clip filenames. Originals remain outside Git. Local server mode adds and plays those research files; public mode offers a demo or local file selection.

| Scenario cue | Selected clip ID |
| --- | --- |
| Space design | P2-S1-02 |
| Telepresence | P2-S2-02 |
| Multimodal AI | P2-S3-01 |
| Space × People × AI | P2-S4-01 |
| Haptic experience | P2-S5-01 |
| Metaverse economics | Conceptual connection network, no dedicated research excerpt |

### Separate computers

Run the server on **one computer** and connect the playback computers to the same LAN. Expand **Separate computers** and open each generated screen URL on the corresponding computer. The console prints the server's LAN address too. `127.0.0.1` refers to the current computer and cannot reach the server from another machine.

Allow Python through Windows Firewall on a private network if prompted. Wired Ethernet is recommended for video playback. Campus client isolation may prevent LAN access to port 8765.

Settings are shared through server events; one SharedWorker connection is reused by tabs on the same computer to avoid exhausting browser connection slots. Clients estimate the server clock offset, recalibrate every 30 seconds, and periodically correct each video's drift above approximately 0.28 seconds. This is software synchronization, not hardware genlock or a guarantee that display refresh phases match. Keep one active control room.

## Screen editor

Configure one to eight screens in **Display setup**. Each screen has:

- A stable output identity and editable name.
- Independent input width and height, up to 16384 pixels per dimension.
- **Match input ratio**, **Tile arrangement**, or a **Custom ratio** for its physical shape.
- Independent grid columns and rows, from 1 to 32; tile aspect width/height; a setup grid toggle.
- Its own output link. Screens can be added, removed or reordered left to right without changing retained output URLs.

Click **Apply screen** after editing a row. **Save look** and **Load look** include the complete screen setup and background controls. Old two-wall look files migrate automatically.

The default front LED input is 3840×2160 at 16:9. The default left input is also 3840×2160, mapped to a 3×2 arrangement of 16:9 tiles, an **8:3 physical surface**. Input pixels and physical shape are deliberately separate. Geometry and the logo compensate when a 16:9 raster is stretched onto that wider surface. The preview shows the physical proportions; a raster screenshot can look compressed before it reaches the actual tiled wall.

If the processor preserves a 16:9 picture rather than stretching it, select **Match input ratio**. Use a custom ratio for measured physical dimensions. A tile grid is a setup overlay, not per-panel routing or processor-level bezel compensation. Check the calibration circle on the actual wall: it should appear circular. The connected composition is a horizontal panorama, not a measured camera-tracking volume or a room-geometry calibration.

## Motion and shoot controls

- **Motion speed**, 0–3×, belongs to the selected animated object/group in Properties; 0 holds that object.
- **Movement amount**, 0–2×, adjusts the selected object's 3D movement. Video elements instead expose their own **Playback rate**.
- **Enable playback** resumes the session and explicitly overrides an operating-system reduced-motion preference. Individual object motion and video rates remain as authored.
- The live status reports render FPS, timeline progress, paused/held state, reduced-motion preference or blocked video playback. The still scene thumbnails are selectors; the live panorama and wall outputs animate.
- **Pause** freezes both the scene and video. Resume continues from the held phase.
- **Wall brightness** is a software adjustment. Match hardware wall brightness and camera exposure on set.
- **Department signature**, **Research titles** and **Pointer interaction** are optional. Disable pointer interaction during recording.

Output shortcuts: **Space** pause/resume, **1–6** select a direction, **G** framing guide, **Esc** leave fullscreen. No controls are burned into fullscreen outputs.

Videos retain their source annotations and loop their selected excerpts. For uninterrupted interview takes, leave video off and use the procedural background. Check the actual camera for moiré, LED scan/PWM banding, shutter behavior, logo placement and framing before filming.

## Development and CI/CD

Procedural backgrounds and local-file playback use no runtime package dependencies or CDNs. Three.js, fonts and identity assets are local. Only YouTube wall layers load the external official player/API; the editor does not load YouTube playback. Node 24 or later is used for checks and public packaging:

```sh
npm test
npm run build
```

`npm run build` creates `_site/`, marks both HTML routes for browser-only playback, packages the demo and replaces private clip paths. It never packages Git data, the Python server or original research media.

`.github/workflows/pages.yml` runs tests, syntax checks and the static build for pushes and pull requests. Pushes to `main` publish the artifact through GitHub Actions to GitHub Pages. Pages must use **GitHub Actions** as its publishing source. Pull requests test the bundle without deploying it.

For browser checks, install Python Playwright and Chrome, run `python serve.py --port 8766` in a separate terminal, then `python qa_browser.py`, `python qa_video_layers.py` and `python qa_logo_video.py`. `python qa_preview_interaction.py` checks direct gestures, selection highlights and responsive previews; `python qa_delete_elements.py` checks deletion, copies and saved URLs. `python qa_element_list.py` checks the hierarchy, selection, CRUD and focus; `python qa_mv_variations.py` checks independent seeded MV instances and portable looks. `python qa_youtube.py` checks direct adding and the external YouTube API adapter; `python qa_preset_parts.py` checks individual preset parts. `python qa_authoring.py` checks the public bundle, authored elements and address restoration in fresh browser contexts. For public mode, build the site, serve this repository at port 8770 with Python's HTTP server, and run `python qa_static.py`. `QA.md` records the latest results. `make_previews.py` captures the actual rendered backgrounds.

`python qa_video_playlist.py` checks chosen-file/YouTube switching, placement, local file reattachment and saved names. `python qa_group_editor.py` checks protected groups, explicit ungrouping, long lines, two-pane layout and legacy selections. `python qa_author_shortcuts.py` checks mouse menus, keyboard editing, input guards, drag undo, copy provenance and saved URLs against the built site on port8770. Use `META_STATIC_URL` to point it at the deployed studio.

`python qa_media_elements.py` checks unified video/artwork Layers and Properties, independent object motion, media source replacement/reuse, screen assignments, per-video rate, drag selection, clipboard/history and saved links.

## Design and credits

The monitor editor was redesigned with [Hallmark v2](https://github.com/nutlope/hallmark), using the Console direction with KAIST's supplied red/blue identity. The large scene thumbnail controls have a recorded app-specific waiver. The element list is checked as a scrollable editor control, including narrow screens and keyboard focus. The redesign preserves the existing fields, output links and handlers. Design evidence is in `.hallmark/`.

Three.js 0.180.0 is bundled under its MIT license. Host Grotesk and Atkinson Hyperlegible Mono are bundled with their SIL Open Font Licenses. Department identity artwork belongs to KAIST. The public animation demo is generated from this project's own 3D scene; it is not research footage.
