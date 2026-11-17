# Découpe les 6 planches Gemini (assets/planches-sources/B1..B6.jpg) en PNG transparents (assets/mini-jeux/)
# Fond blanc retiré par remplissage depuis les bords, textes (légendes) supprimés.
import sys, json, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets', 'planches-sources')
OUT = os.path.join(ROOT, 'assets', 'mini-jeux')

NOMS = {
 'B1': ['traineau_droit','traineau_gauche','traineau_droite','sapin_grand','sapin_petit','rocher','bonhomme','souche','cadeau_rouge','etoile_doree','panneau','tas_neige'],
 'B2': ['pere_sac_neutre','pere_sac_content','pere_sac_grimace','cadeau_rouge','cadeau_bleu','cadeau_vert','cadeau_dore','boule_rouge','pierre','glacon','charbon','sucre_orge'],
 'B3': ['cible_ronde','cible_bonhomme','cible_etoile','cible_cadeau','cible_touchee','boule_neige','eclaboussure_neige','lutin','panneau_support','tas_neige','moufle','etoile_victoire'],
 'B4': ['trou_neige','lutin_sort','lutin_debout','lutin_touche','lutin_rouge','lutin_dore','cadeau_piege','cadeau_explose','cadeau_normal','bordure_neige','etoile_victoire','coeur'],
 'B5': ['pere_debout','pere_saute','pere_glisse','glace_plate','glace_fissuree','glace_coule','bloc_depart','bloc_arrivee','eclaboussure_eau','poisson','etoile','flocon'],
 'B7': ['renne_marche1','renne_marche2','renne_galop','renne_debout','renne_face','bebe_renne','pingouin_marche1','pingouin_marche2','pingouin_glisse','pingouin_face','bebe_pingouin','pingouin_saute'],
 'B8': ['eclair_long','eclair_ramifie','eclair_epais','nuage_orage','pere_electrocute','pere_squelette','pere_squelette_etoile','pere_carbonise','etincelles','eclair_impact','sac_fume','arc_cercle'],
 'B9': ['meteo_roche','meteo_noire','meteo_glace','meteo_lave','expl1','expl2','expl3','expl4','cratere','debris','meteo_cristal','anneau'],
 'B6': ['coeur_plein','coeur_vide','etoile_score','pouce','croix','sablier','doigt','fleches','banniere','bouton_dore','trophee','nuage'],
}
TROUS_TRANSPARENTS = {('B6','coeur_vide')}   # l'intérieur blanc du cœur vide devient transparent

def decouper(b):
    im = Image.open(os.path.join(SRC, b + '.jpg')).convert('RGB')
    a = np.array(im).astype(int)
    blanc = a.min(axis=2) >= 232
    lab, n = ndi.label(blanc)
    bord = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fond = np.isin(lab, list(bord))
    fg = ndi.binary_opening(~fond, iterations=1)
    # groupes : on rapproche les morceaux d'un même objet
    grp, ng = ndi.label(ndi.binary_dilation(fg, iterations=9))
    objs = []
    for i, sl in enumerate(ndi.find_objects(grp)):
        m = (grp[sl] == i + 1) & fg[sl]
        aire = int(m.sum())
        h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
        if aire < 600: continue
        # texte : bas et plat, peu de pixels
        if h <= 85 and aire < 5200 and w >= 25 and w/h > 1.3: continue
        objs.append((sl, i + 1, aire))
    return im, a, fg, grp, objs

def ordonner(objs):
    ys = sorted(set(((s[0].start + s[0].stop)//2) for s, _, _ in objs))
    # 3 rangées par regroupement des centres verticaux
    c = sorted(objs, key=lambda o: (o[0][0].start + o[0][0].stop)//2)
    lignes = [c[0:4], c[4:8], c[8:12]]
    res = []
    for l in lignes:
        res += sorted(l, key=lambda o: (o[0][1].start + o[0][1].stop)//2)
    return res

def main():
    os.makedirs(OUT, exist_ok=True)
    index = {}
    for b in sorted(NOMS):
        im, a, fg, grp, objs = decouper(b)
        if len(objs) != 12:
            print(b, 'ATTENTION', len(objs), 'objets trouvés');
        objs = ordonner(objs)
        for (sl, gid, aire), nom in zip(objs, NOMS[b]):
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
            m = ((grp == gid) & fg)[y0:y1, x0:x1]
            # suppression de la légende : petits morceaux situés sous le corps principal de l'objet
            cl, nc = ndi.label(ndi.binary_dilation(m, iterations=1))
            cl = cl * m
            aires = ndi.sum(m, cl, range(1, nc + 1))
            if nc > 1:
                bbs = ndi.find_objects(cl)
                gros = int(np.argmax(aires))
                bas = bbs[gros][0].stop
                for k in range(nc):
                    if k == gros: continue
                    if aires[k] < 1600 and bbs[k][0].start >= bas - 10:
                        m[cl == k + 1] = False
            m = ndi.binary_fill_holes(m) if (b, nom) not in TROUS_TRANSPARENTS else m
            if (b, nom) in TROUS_TRANSPARENTS:
                blanc = a[y0:y1, x0:x1].min(axis=2) >= 225
                m = m & ~blanc
                m = ndi.binary_opening(m, iterations=1)
            # bords adoucis
            alpha = Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.8))
            alpha = np.array(alpha)
            rgb = np.array(im)[y0:y1, x0:x1]
            rgba = np.dstack([rgb, alpha]).astype('uint8')
            pad = 4
            img = Image.fromarray(rgba, 'RGBA')
            bb = img.getbbox()
            img = img.crop(bb)
            out = Image.new('RGBA', (img.width + 2*pad, img.height + 2*pad), (0,0,0,0))
            out.paste(img, (pad, pad))
            fn = f'{b}_{nom}.png'
            out.save(os.path.join(OUT, fn), optimize=True)
            index[b + '_' + nom] = {'f': fn, 'w': out.width, 'h': out.height}
        print(b, len(objs), 'objets')
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)

main()
