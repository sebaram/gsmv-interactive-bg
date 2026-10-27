"""Add research relationships to existing stages without rewriting earlier looks."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONCEPTS = ['Co-presence', 'Co-creation', 'Shared coordinates', 'Mutual response', 'A place to meet', 'MV Symbiosis', 'A commons made together', 'A responsive counterpart']
TYPES = ['presence', 'cocreation', 'registration', 'feedback', 'registration', None, 'cocreation', 'feedback']
CENTERS = {'presence': (75, 1.1), 'registration': (71, 1.05), 'feedback': (73, 1.15), 'cocreation': (72, 1.1)}


def compose(item, alternate):
    look = copy.deepcopy(item['look']); variant = look['variant']
    preset = look['authored'][str(variant)]; edits = preset['edits']
    def hide(element):
        edits.setdefault(element, {})['visible'] = False
    if variant in [0, 1, 2, 4]:
        for element in ['preset-main', 'preset-companion']:
            hide(element)
        if variant == 2:
            for screen in ['front', 'left']:
                hide(screen+'-pedestal-1')
    if variant == 3:
        for screen in ['front', 'left']:
            for n in [1, 2]:
                hide(f'{screen}-research-network-{n}')
    if variant == 6:
        for screen in ['front', 'left']:
            hide('atelier-leaves-'+screen)
            hide(screen+'-low-limestone-plinth-1')
            hide(screen+'-sculpture-contact-shadow-1')
    if variant == 7:
        for screen in ['front', 'left']:
            hide('court-glass-'+screen); hide('court-red-'+screen)
            hide(screen+'-graphite-sculpture-plinth-1')
            for n in [1, 2]:
                hide(screen+'-sculpture-contact-shadow-'+str(n))
    if variant != 5:
        for screen in ['front', 'left']:
            kind = 'presence' if variant == 4 and screen == 'left' else TYPES[variant]
            y, size = CENTERS[kind]
            x = 84 if variant >= 6 else 18 if alternate else 82
            preset['objects'].append({'id': 'meaning-'+screen, 'type': kind, 'source': None, 'archived': False,
                'screen': screen, 'x': x, 'y': y, 'size': size, 'rotation': 0, 'visible': True,
                'motionSpeed': .8 if alternate else .9, 'motionAmount': 1, 'motionAnchor': 0, 'motionOffset': 9 if alternate else 0})
    return look


if __name__ == '__main__':
    originals = json.loads((ROOT/'looks/floor-wall-variations.json').read_text(encoding='utf-8'))
    looks = []
    for index, item in enumerate(originals['looks']):
        variant = item['look']['variant']; alternate = bool(index % 2)
        letter = 'B' if alternate else 'A'
        looks.append({'name': f'Meaning {variant+1:02}{letter} / {CONCEPTS[variant]}', 'look': compose(item, alternate)})
    destination = ROOT/'looks/research-meaning-variations.json'
    destination.write_text(json.dumps({'wall': originals['wall'], 'subject': originals['subject'],
        'interpretation': 'Editorial research metaphors, not official logo meanings or research simulations.',
        'looks': looks}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print('Created 16 research meaning compositions; original Astra collection retained')
