# Prépare assets/mini-jeux.json : les images des mini-jeux, allégées (palette 256 couleurs + transparence), en base64.
# Ajouter une planche à EMBARQUE pour l'intégrer dans le jeu au prochain `npm run build`.
import os, io, json, base64, glob
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'mini-jeux')
EMBARQUE = ['B1_*', 'B2_*', 'B8_eclair_epais', 'B8_pere_*', 'B7_*', 'B6_coeur_plein', 'B6_coeur_vide', 'B6_etoile_score', 'B6_doigt', 'B6_nuage']
out = {}
for motif in EMBARQUE:
    for f in sorted(glob.glob(os.path.join(SRC, motif + '.png'))):
        k = os.path.basename(f)[:-4]
        im = Image.open(f).convert('RGBA')
        q = im.quantize(colors=255, method=Image.FASTOCTREE, dither=Image.NONE)
        buf = io.BytesIO(); q.save(buf, 'PNG', optimize=True)
        out[k] = {'u': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), 'w': im.width, 'h': im.height}
json.dump(out, open(os.path.join(ROOT, 'assets', 'mini-jeux.json'), 'w'))
print(len(out), 'images,', round(os.path.getsize(os.path.join(ROOT, 'assets', 'mini-jeux.json')) / 1024), 'Ko')
