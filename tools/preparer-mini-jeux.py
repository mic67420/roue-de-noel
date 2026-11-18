# Prépare assets/mini-jeux.json : les images des mini-jeux, allégées (palette 256 couleurs + transparence), en base64.
# Ajouter une planche à EMBARQUE pour l'intégrer dans le jeu au prochain `npm run build`.
import os, io, json, base64, glob
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'mini-jeux')
EMBARQUE = ['B1_*', 'B2_*', 'B8_eclair_epais', 'B8_pere_*', 'B9_meteo_*', 'B9_expl*', 'B9_cratere', 'B9_debris', 'B7_*', 'B6_coeur_plein', 'B6_coeur_vide', 'B6_etoile_score', 'B6_doigt', 'B6_nuage', 'B3_lutin', 'B3_boule_neige', 'B3_eclaboussure_neige', 'B3_tas_neige', 'B4_lutin_*', 'B4_trou_neige', 'B10_*', 'B11_*', 'B12_*', 'B13_*', 'B14_*', 'B15_*', 'B16_*']
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
