"""Recreate the Astra A/B look collection for the floor-mounted interview wall."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCREENS = [
    {'id': 'left', 'name': 'Left tiled wall', 'width': 3840, 'height': 2160, 'mode': 'tiles', 'cols': 3, 'rows': 2, 'tileW': 16, 'tileH': 9},
    {'id': 'front', 'name': 'Front LED / 4.44 x 2.50 m', 'width': 3840, 'height': 2160, 'mode': 'raster', 'cols': 1, 'rows': 1},
]
NAMES = ['Blue Hour', 'Common Ground', 'Soft Architecture', 'Living Research', 'Shared Reality', 'MV Symbiosis', 'Serein Atelier', 'MV Light Court']
TITLES = [('Obsidian', 'Steel'), ('Cobalt', 'Wine'), ('Chalk', 'Sand'), ('Deep teal', 'Ink'), ('Indigo', 'Garnet'), ('Signature right', 'Signature left'), ('Daylight', 'Evening'), ('Real and virtual', 'Blue hour')]


def compose(variant, alternate):
    edits = {}
    def patch(element, **values):
        edits.setdefault(element, {}).update(values)
    def moving(element, **values):
        patch(element, motionSpeed=.45 if not alternate else .35, motionAmount=.8, **values)
    for screen in ['front', 'left']:
        patch('branding-'+screen, x=7, y=7, size=.62)
        patch('wall-caption-'+screen, visible=False)
    appearance = {'floor': .55, 'lighting': .95}
    if variant in [0, 1, 2, 4]:
        config = {
            0: [(82, 60, .78), (17, 62, .72)],
            1: [(84, 60, .70), (82, 64, .78)],
            2: [(83, 59, .88), (83, 65, .72)],
            4: [(85, 61, .70), (83, 65, .62)],
        }[variant][int(alternate)]
        x, y, size = config
        moving('preset-main', screen='front', x=x, y=y, size=size)
        moving('preset-companion', screen='left', x=20 if alternate else 80, y=64, size=.68)
        for screen in (['front'] if variant == 0 else ['front', 'left']):
            patch(screen+'-soft-shadow-1', visible=False)
        if variant == 2:
            # Keep the architectural platform under the scaled arch group.
            for screen, center, old_x, old_y in [('front', (x, y, size), 72.17645, 53.4557), ('left', (20 if alternate else 80, 64, .68), 53, 54.59273)]:
                cx, cy, scale = center
                patch(screen+'-pedestal-1', x=cx+((75 if screen=='front' else 53)-old_x)*scale,
                      y=cy+((85.56263 if screen=='front' else 86.05914)-old_y)*scale, size=scale)
    if variant in [1, 4, 5]:
        for index in [1, 2]:
            patch('left-connecting-ribbon-'+str(index), visible=alternate, y=89+index*2)
    if variant == 3:
        for screen in ['front', 'left']:
            moving(screen+'-research-network-1', x=89 if alternate else 13, y=82, size=.65)
            moving(screen+'-research-network-2', x=17 if alternate else 84, y=64, size=.58 if alternate else .68)
        # Fine floor grid is unnecessary for a camera-facing interview.
        # Legacy BufferGeometry IDs stay stable even though labels now say grid.
        for screen, count in [('left', 7), ('front', 2)]:
            for n in range(1, count+1):
                patch(screen+'-sculptural-element-'+str(n), visible=False)
    if variant == 5:
        for index, screen in enumerate(['front', 'left']):
            moving('preset-logo-'+screen, x=17 if alternate else 83, y=63, size=.65,
                   seed=520+int(alternate)*10+index, randomness=.65)
            patch(screen+'-soft-shadow-1', visible=False)
    if variant == 6:
        appearance = {'floor': 1, 'lighting': 1.05 if not alternate else .83}
        for screen in ['front', 'left']:
            moving('atelier-leaves-'+screen)
            if alternate:
                for part in ['limestone-bench-seat-1', 'bench-support-1', 'bench-support-2', 'sculpture-contact-shadow-2']:
                    patch(screen+'-'+part, visible=False)
    if variant == 7:
        appearance = {'floor': 1, 'lighting': 1.15 if alternate else 1}
        for screen in ['front', 'left']:
            moving('court-glass-'+screen)
            moving('court-red-'+screen, visible=not alternate)
            if alternate:
                patch(screen+'-sculpture-contact-shadow-2', visible=False)
    palettes = {
        (0, False): ('#0a101a', '#1c3855'), (0, True): ('#111c2d', '#43566d'),
        (1, False): ('#101824', '#27495f'), (1, True): ('#21151e', '#68424a'),
        (2, False): ('#c1beb5', '#e0dcd1'), (2, True): ('#a99c88', '#e0ceb1'),
        (3, False): ('#0b2029', '#275855'), (3, True): ('#0b1723', '#274955'),
        (4, False): ('#111929', '#314761'), (4, True): ('#201723', '#6a3b51'),
        (5, False): ('#0b1621', '#234763'), (5, True): ('#101a25', '#3b536e'),
        (6, True): ('#777369', '#b8ae98'), (7, True): ('#13212e', '#345a6d'),
    }
    if (variant, alternate) in palettes:
        base, glow = palettes[(variant, alternate)]
        appearance.update(mode='gradient', backgroundColor=base, glowColor=glow, glow=.65)
    return {
        'variant': variant, 'screens': SCREENS, 'brightness': 85, 'speed': 1, 'motionAmount': 1,
        'paused': False, 'offset': 0, 'epoch': 0, 'branding': True, 'headlines': False,
        'interactive': False, 'showVideo': False, 'videoLayers': [],
        'authored': {str(variant): {'objects': [], 'edits': edits}}, 'appearance': {str(variant): appearance},
    }


if __name__ == '__main__':
    looks = []
    for variant, name in enumerate(NAMES):
        for alternate in [False, True]:
            letter = 'B' if alternate else 'A'
            looks.append({'name': f'Astra {variant+1:02}{letter} / {name} / {TITLES[variant][int(alternate)]}',
                          'look': compose(variant, alternate)})
    destination = ROOT/'looks/floor-wall-variations.json'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps({'wall': {'widthMeters': 40/9, 'heightMeters': 2.5, 'bottomMeters': 0},
                                       'subject': 'Seated or standing', 'looks': looks}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(f'Created {len(looks)} authored floor-wall variations')
