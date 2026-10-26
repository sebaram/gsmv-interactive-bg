# KAIST META Interview Background Studio

Real-time 3D backgrounds for interview shoots, with configurable display walls, research video, local playback and network control.

**[Public studio](https://sebaram.github.io/gsmv-interactive-bg/)** · [Six background directions](previews/comparison.jpg)

## Backgrounds

| Direction | Treatment |
| --- | --- |
| **MV Symbiosis** | Six exact facets from the official MV symbol soften, exchange form and position, assemble into the mark, then unfold together. Optional video gallery. |
| **Shared Reality** | The combined direction: Common Ground's red real-world and blue virtual ribbons surrounding Living Research's floating video gallery. |
| **Common Ground** | Interwoven red and blue ribbons representing exchange between real and virtual spaces. |
| **Living Research** | Moving research galleries and connection networks, with footage on every screen. |
| Blue Hour | Polished blue orbital forms with restrained red accents. |
| Soft Architecture | Pale arches, warm stone and floating blue/red forms. |

The original department signature is retained. The source identity and color guide are from [meta.kaist.ac.kr/logo](https://meta.kaist.ac.kr/logo); the supplied scenario decks and selected clips provide the video library.

### MV Symbiosis

The new scene uses the six red and blue polylines copied directly from the official SVG, rather than an approximate M/V icon. Over a 36-second cycle, the facets become soft volumetric forms, move in complementary pairs, consolidate into the recognizable symbol, hold it, and unfold into another exchange. The red/blue connections represent mutual influence. Pause, speed, movement amount, reduced motion and every configured screen remain supported. The interview subject's area stays quieter toward the center-left.

Selecting MV Symbiosis initially runs without a video so the transformation is clear. Use the video library to add footage beside the sculpture, or choose No video to return to the full-size mark. Under an operating-system reduced-motion preference, it shows the assembled symbol until playback is explicitly enabled.

## Choose a video

The monitor now has a **34-clip video library** instead of research-cue buttons. Search titles, descriptions, topics or clip IDs, or browse with Previous/Next. Each entry has an actual poster frame, title, topic and duration. The larger detail view explains the clip and offers preview playback.

**Preview** changes only the detail view. **Use this video** sends that clip to the wall outputs; the status names what is on screens. MV Symbiosis keeps its logo animation when footage is added. A procedural-only background switches to Shared Reality when a video is applied. **No video** removes the footage without requiring a topic selection. The on-set panel also links directly to the video browser.

Five primary examples have English titles and descriptions; the additional selected clips retain their supplied Korean titles and explanations. Poster images are real frames from those clips. Original video files remain outside Git.

## Public browser mode

Open the public studio in Chrome or Edge. Choose a background, configure screens, and open each output in its own window. Controls synchronize windows in the **same browser**.

Research galleries initially show a small, explicitly labeled **animation demo**. Original laboratory videos are not published. The library shows poster previews and descriptions; **Choose this video file** opens your local copy. You can also use **Use any video from this computer**. It plays directly from your computer as a browser blob and is not uploaded. Keep the editor open while outputs use that file. Pick it again after closing the browser; saved look files do not contain video files or reusable file permissions.

For synchronized playback across separate computers, use the LAN server below. GitHub Pages is static hosting and does not run the Python sync server.

## Local and LAN playback

1. Clone or download this repository.
2. Double-click **START.bat**, or run `python serve.py --open`. Only the server computer needs Python 3.
3. Open `http://127.0.0.1:8765/backgrounds/` in Chrome or Edge. Keep the server console open.
4. Choose a direction, then preview and apply a video if wanted. Open each screen's output, move the window to its display and click the background for fullscreen. **Esc** leaves fullscreen.
5. Before recording, use **Prepare clean take** to clear calibration, framing and tile-grid overlays on every screen and disable pointer interaction.

The server maps `/backgrounds/` to the app regardless of the cloned directory name. It serves only the app and selected media directory, and blocks hidden paths such as `.git`.

### Research files

On the current shoot workspace, the original clips are already at `../output/clips/` relative to this repository. To use another folder:

```powershell
python serve.py --media-dir "D:\Shoot\selected-clips" --open
```

The `GSMV_MEDIA_DIR` environment variable is also supported. `clips.json` lists all 34 library items, their descriptions, poster paths and exact expected clip filenames. Originals remain outside Git. Local server mode previews and plays those research files; public mode uses its demo until you choose a local file.

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

Settings are shared through server events; one SharedWorker connection is reused by tabs on the same computer to avoid exhausting browser connection slots. Clients estimate the server clock offset, recalibrate every 30 seconds, and periodically correct video drift above approximately 0.28 seconds. This is software synchronization, not hardware genlock or a guarantee that display refresh phases match. Keep one active control room.

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

- **Motion speed**, 0–3×, controls the shared timeline; 0 holds it.
- **Movement amount**, 0–2×, adjusts the 3D movement. The previous very slow decorative motion has been replaced with clearly visible rotations and floating galleries.
- **Show visible motion** resumes playback at 1× speed and 1.3× movement. It also explicitly overrides an operating-system reduced-motion preference.
- The live status reports render FPS, timeline progress, paused/held state, reduced-motion preference or blocked video playback. The still scene thumbnails are selectors; the live panorama and wall outputs animate.
- **Pause** freezes both the scene and video. Resume continues from the held phase.
- **Wall brightness** is a software adjustment. Match hardware wall brightness and camera exposure on set.
- **Department signature**, **Research titles** and **Pointer interaction** are optional. Disable pointer interaction during recording.

Output shortcuts: **Space** pause/resume, **1–6** select a direction, **G** framing guide, **Esc** leave fullscreen. No controls are burned into fullscreen outputs.

Videos retain their source annotations and loop their selected excerpts. For uninterrupted interview takes, Common Ground uses procedural motion without clip cuts. Check the actual camera for moiré, LED scan/PWM banding, shutter behavior, logo placement and framing before filming.

## Development and CI/CD

There are no runtime package dependencies or CDN requests. Three.js, fonts and identity assets are local. Node 24 or later is used for checks and public packaging:

```sh
npm test
npm run build
```

`npm run build` creates `_site/`, marks both HTML routes for browser-only playback, packages the demo and replaces private clip paths. It never packages Git data, the Python server or original research media.

`.github/workflows/pages.yml` runs tests, syntax checks and the static build for pushes and pull requests. Pushes to `main` publish the artifact through GitHub Actions to GitHub Pages. Pages must use **GitHub Actions** as its publishing source. Pull requests test the bundle without deploying it.

For browser checks, install Python Playwright and Chrome, run `python serve.py --port 8766` in a separate terminal, then `python qa_browser.py`. For public mode, build the site, serve this repository at port 8770 with Python's HTTP server, and run `python qa_static.py`. `QA.md` records the latest results. `make_previews.py` captures the actual rendered backgrounds.

## Design and credits

The monitor editor was redesigned with [Hallmark v2](https://github.com/nutlope/hallmark), using the Console direction with KAIST's supplied red/blue identity. Its final rendered sweep reported zero Floor failures and zero open Reflex findings; the large scene thumbnail controls have a recorded app-specific waiver. The redesign preserves the existing fields, output links and handlers. Design evidence is in `.hallmark/`.

Three.js 0.180.0 is bundled under its MIT license. Host Grotesk and Atkinson Hyperlegible Mono are bundled with their SIL Open Font Licenses. Department identity artwork belongs to KAIST. The public animation demo is generated from this project's own 3D scene; it is not research footage.
