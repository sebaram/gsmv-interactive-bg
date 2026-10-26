# META Interview Background Studio

Four live 3D backgrounds for the KAIST Graduate School of Metaverse interview shoot. Built from the two supplied scenario decks, the official department identity and the existing research clips. Everything runs locally; no internet or installation is needed on playback clients.

## Start

1. Double-click **START.bat** in this folder. Python 3 is required only on the server computer (already available on the current machine).
2. Open **http://127.0.0.1:8765/backgrounds/** in Chrome or Edge. The server stays running in its console window.
3. Choose a style. Use **Open front wall** and **Open left wall** to open separate outputs, move them onto their displays, then click each background to enter fullscreen. F11 is an alternative.
4. Click **Prepare clean take** before recording. This clears framing, grid and calibration overlays and turns pointer interaction off. Choose branding/titles and motion before the take.

Do not open `index.html` directly from Explorer: local modules, video seeking and network synchronization require the included server. Original footage and scenario files are unchanged.

## The four directions

| Style | Visual treatment | Suggested use |
| --- | --- | --- |
| **01 / Blue Hour** | A polished blue orbital sculpture, thin satellite rings and a restrained red accent | Start here for faculty interviews, identity and opening statements |
| **02 / Common Ground** | Interwoven blue/red ribbons, flowing connections and floating pearl forms | People, shared spaces, collaboration and the department story |
| **03 / Soft Architecture** | Porcelain arches, warm stone, blue/red floating objects and architectural depth | Spatial design interviews and a brighter studio treatment |
| **04 / Living Research** | A spatial gallery showing the supplied research footage, paired with a moving connection network | Lab discussions, technical demonstrations and research inserts |

The front wall reserves a quieter region toward the center-left for the interview subject; main sculptures sit toward the right. Use **Framing guide** to check the camera composition. The left wall has a companion object within the same virtual panorama. These are selectable art directions, not a geometrically calibrated virtual production set; exact camera perspective and room dimensions have not been measured.

## Your wall setup

- **Front LED:** 3840 × 2160 input, 16:9 physical shape.
- **Left tiled display:** 3840 × 2160 input, a 3 × 2 arrangement. The default assumes six 16:9 tiles, giving an **8:3 physical surface**.
- The left output compensates for the processor stretching a 16:9 raster over that wider surface. A left-output screenshot may look horizontally compressed on a normal monitor; it is intended to become proportional on the physical wall. The studio preview shows the physical layout, with the left wall wider than the front wall.
- In **Display setup**, select **3 × 2 of 16:9 tiles** when the whole 4K frame fills the tiled surface. Select **Match input ratio** if the processor preserves a 16:9 image instead. If the tiled wall is a different physical ratio, use measured dimensions before final camera framing.
- The shader view and the department signature both compensate for the physical ratio, preserving the logo proportions on the wall.
- Select the **3 × 2 tile grid** to check bezel intersections. This is a visual overlay, not processor-level bezel correction or a per-panel output router.
- Enable **Calibration pattern** and check that its circle appears circular on the real wall. Check the grayscale steps through the camera; then disable the pattern and grid.

## One computer

Use extended desktop mode. Keep a control-room window on the operator display and one fullscreen browser window on each wall. All windows should use the same server origin. Settings travel through both local browser messages and the server.

## Separate computers

1. Run `START.bat` on **one** server computer. Keep all footage there; clients stream it from that computer.
2. Connect each playback computer to the same LAN, preferably wired Ethernet.
3. Expand **Separate computers** in the control room and open the generated **Front wall** or **Left wall** URL on the corresponding computer. The server console also prints its LAN address. Do not use `127.0.0.1` on a different machine.
4. If Windows asks, allow Python through the firewall for the private network. Campus network isolation or firewall rules can prevent one computer from reaching another; use a network that permits access to TCP port 8765.
5. Use one active control room. Selecting styles, cues, pause, speed, brightness, dimensions and overlays updates every connected output. A newly opened or reconnected client receives the current look.

The clients estimate the server clock offset by a timed request and recalibrate every 30 seconds. Animation is evaluated from the shared absolute clock. Research videos periodically correct drift above approximately 0.28 seconds. This supports separate computers with software synchronization; it does **not** genlock GPUs, guarantee matching refresh phases or remove LED scan/PWM banding. Test actual cameras and processors before the interview. Wired network playback is recommended for the video style.

The server listens on the LAN and serves only this background folder and the existing `output/clips` folder. Stop it when the session ends. No public hosting is involved.

## Research cues

The six cues follow Part 2 of the scenario. Cues affect the accent color and optional bilingual research titles. In Living Research they select these original clips:

| Cue | Local clip ID | Scenario |
| --- | --- | --- |
| Space design | P2-S1-02 | Personalizing the VR room |
| Telepresence | P2-S2-02 | ParameterRoom multi-user play |
| Multimodal AI | P2-S3-01 | Reasoning-based robot arm |
| Space × People × AI | P2-S4-01 | 3D scene style transfer |
| Haptic experience | P2-S5-01 | AquaHaptics application |
| Metaverse economics | Procedural network; no research video | Society and economic ecosystem |

There is no dedicated economics research excerpt among the selected clips; that cue uses a conceptual 3D network rather than presenting unrelated footage as economics research. Videos are muted and loop their existing excerpts. Hard cuts and existing source annotations remain in those excerpts. The procedural styles are better for an uninterrupted, quiet interview take.

## Controls

- **Wall brightness:** software brightness, independent of the LED processor. Begin at 70%, then set exposure with your camera and hardware brightness.
- **Motion speed:** starts at 0.50×. 0 freezes motion; Pause holds the timeline and resumes from the same point.
- **Department signature:** original department logo plus KAIST identification. Logo assets retain the official artwork.
- **Research titles:** optional Korean heading and English cue label; also controls gallery captions in Living Research.
- **Pointer interaction:** gentle sculpture parallax on the window receiving pointer movement. Disable for recorded takes.
- **Save look / Load look:** download and restore the settings as JSON. Current settings also remain in the controlling browser; the running server keeps its latest shared look in memory.

Output shortcuts: **Space** pause/resume; **1–4** choose a style; **G** toggle the framing guide; **Esc** leave fullscreen. The short fullscreen hint disappears automatically and is hidden in fullscreen.

Before filming, check motion, brightness, logo placement, camera crop, rolling-shutter banding and moiré on the real displays. Adjust the camera shutter and LED controller refresh settings as needed. Physical camera/display validation has not been performed by this software.

## Files and sources

- `previews/comparison.jpg`: four-style comparison with both walls.
- `previews/style-0.jpg` through `style-3.jpg`: front-wall stills.
- `previews/studio.png`: control-room screenshot.
- `previews/front-4k.png` and `previews/left-4k-input.png`: actual 3840×2160 still outputs for the recommended look. The left input is intentionally compressed for the stretched tiled surface.
- `clips.json`: references to the existing footage; keep this folder beside `output`.
- `assets`: unmodified logo artwork and usage guide from [meta.kaist.ac.kr/logo](https://meta.kaist.ac.kr/logo). The guide identifies KAIST blue and Metaverse red; the downloaded SVG uses `#0066b3` and `#ed1c24`.
- `vendor`: locally bundled Three.js 0.180.0 and MIT license; no CDN requests during playback. [Three.js documentation](https://threejs.org/docs/).
- `scene.js`, `state.js`, `sync.js`, `studio.js`: live render, shared state/timeline, network connection and controls.

Re-run automated checks with `node --test backgrounds/state.test.mjs` from the project root. `qa_browser.py` exercises the live server and independent browser clients; it needs the existing Python Playwright installation and Chrome. Browser evidence is recorded in `QA.md` after the checks.
