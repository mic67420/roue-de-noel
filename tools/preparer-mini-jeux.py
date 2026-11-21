# Prépare assets/mini-jeux.json : les images des mini-jeux, allégées (palette 256 couleurs + transparence), en base64.
# Ajouter une planche à EMBARQUE pour l'intégrer dans le jeu au prochain `npm run build`.
import os, io, json, base64, glob
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'mini-jeux')
EMBARQUE = ['B1_*', 'B2_*', 'B8_eclair_epais', 'B8_pere_*', 'B9_meteo_*', 'B9_expl*', 'B9_cratere', 'B9_debris', 'B7_*', 'B6_coeur_plein', 'B6_coeur_vide', 'B6_etoile_score', 'B6_doigt', 'B6_nuage', 'B3_lutin', 'B3_boule_neige', 'B3_eclaboussure_neige', 'B3_tas_neige', 'B4_lutin_*', 'B4_trou_neige', 'B10_*', 'B11_*', 'B12_*', 'B13_*', 'B14_*', 'B15_*', 'B16_*', 'B17_*', 'B18_*', 'B19_*', 'B20_*', 'B21_*', 'B22_*', 'B23_*', 'B30_*', 'B31_*', 'B32_*', 'B33_*', 'B35_*', 'B36_*', 'B38_*', 'B39_*', 'B40_*']
out = {}
for motif in EMBARQUE:
    for f in sorted(glob.glob(os.path.join(SRC, motif + '.png'))):
        k = os.path.basename(f)[:-4]
        im = Image.open(f).convert('RGBA')
        q = im.quantize(colors=255, method=Image.FASTOCTREE, dither=Image.NONE)
        buf = io.BytesIO(); q.save(buf, 'PNG', optimize=True)
        out[k] = {'u': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), 'w': im.width, 'h': im.height}
fb = Image.open(os.path.join(ROOT, 'assets', 'planches-sources', 'fond_catapulte.jpg')).convert('RGB')
buf = io.BytesIO(); fb.save(buf, 'JPEG', quality=80, optimize=True)
out['fond_catapulte'] = {'u': 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(), 'w': fb.width, 'h': fb.height}
for n in range(6):
    fr = Image.open(os.path.join(ROOT, 'assets', 'planches-sources', 'B%d.jpg' % (24 + n))).convert('RGB')
    fr = fr.resize((1280, 720), Image.LANCZOS)
    buf = io.BytesIO(); fr.save(buf, 'JPEG', quality=72, optimize=True)
    out['fond_run%d' % (n + 1)] = {'u': 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(), 'w': 1280, 'h': 720}

# textures du décor 3D (planche B34 : 12 carrés)
import numpy as np
tb = Image.open(os.path.join(ROOT, 'assets', 'planches-sources', 'B34.jpg')).convert('RGB')
a = np.array(tb).astype(int); nonw = (a.sum(axis=2) < 740)
def runs(v):
    r = []; st = None
    for i, x in enumerate(v):
        if x and st is None: st = i
        if not x and st is not None:
            if i - st > 100: r.append((st, i))
            st = None
    if st is not None and len(v) - st > 100: r.append((st, len(v)))
    return r
cols = runs(nonw.mean(axis=0) > .1); rows = runs(nonw.mean(axis=1) > .1)
TEX = ['pierre','rocher','pin','boisvieux','ecorce','glace1','glace2','poudre','givre','corde','cane','fer']
assert len(cols) == 4 and len(rows) == 3, (cols, rows)
for k, nm in enumerate(TEX):
    (x0, x1), (y0, y1) = cols[k % 4], rows[k // 4]
    t = tb.crop((x0 + 3, y0 + 3, x1 - 3, y1 - 3)).resize((256, 256), Image.LANCZOS)
    buf = io.BytesIO(); t.save(buf, 'JPEG', quality=82, optimize=True)
    out['tex_' + nm] = {'u': 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(), 'w': 256, 'h': 256}
json.dump(out, open(os.path.join(ROOT, 'assets', 'mini-jeux.json'), 'w'))
print(len(out), 'images,', round(os.path.getsize(os.path.join(ROOT, 'assets', 'mini-jeux.json')) / 1024), 'Ko')
