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
 'B10': ['boule_bas','boule_milieu','boule_tete','haut_de_forme','bonnet','carotte','charbon','echarpe','branche','moufle','bouton','noeud'],
 'B11': ['santa_dos','santa_saut','santa_atterrit','santa_gauche','santa_droite','santa_ecrase','santa_etourdi1','santa_etourdi2','santa_content','cadeau','etoile','coeur_plein','coeur_vide'],
 'B12': ['renne_trot','renne_galop','pingouin_marche','pingouin_ventre','renard','lievre','ours','boule_neige','traineau_vide','sapin','sapin_neige','rocher'],
 'B13': ['mouton','mouton_court','vache','oie','lapin','cheval','tracteur','charrette_ane','botte','epouvantail','cloture','arbre_givre'],
 'B14': ['voiture','taxi','camionnette','bus','chat','chien','pigeon','cycliste','passant','lampadaire','boite_lettres','banc'],
 'B15': ['enfant_luge','enfant_court','chien','poule','cheval_traineau','charrette','bonhomme','tonneau','sapin_noel','lanterne','arche','maisonnette'],
 'B17': ['maison_rouge','maison_bleue','maison_colombages','maison_verte','boulangerie','marche','sapin_geant','lampadaire','fontaine','traineau','renne_lumineux','porte_cadeaux'],
 'B18': ['maison_finale','maison_finale2','cheminee','toit','cheminee_lutin','fenetre_enfant','bas_noel','couronne','tapis_neige','boite_lettres','sapin_pot','cadeau_geant'],
 'B19': ['p_accroupi','p_saut','p_atterrit','p_sac','p_penche','p_grimpe','p_tete','p_bonnet','p_mains','p_salut','p_pouce','p_sac_etoile'],
 'B20': ['cata_repos','cata_tendue','cata_tir','bras','base','boule','boule_vol','boule_eclate','splash','panier','lutin_pouce','lutin_decu'],
 'B21': ['sapin','sapin_deco','cadeau_rouge','cadeau_bleu','cadeau_vert','cadeau_or','cadeau_raye','cadeau_pois','cadeau_gros','etoile','cloche','ruban'],
 'B22': ['renne_c1','renne_c2','renne_c3','renne_c4','renne_c5','renne_c6','renne_saut1','renne_saut2','renne_atterrit','renne_bas','renne_touche','renne_content'],
 'B23': ['tas_petit','tas_grand','souche','sapin','sapins3','rocher','bonhomme','branche','corbeau1','corbeau2','guirlande','cadeau_or'],
 'B30': ['chat','chien','panda','renard','grenouille','lion','hibou','dragon','licorne','dino','pingouin','requin'],
 'B31': ['robot','astronaute','pirate','chevalier','ninja','sorciere','magicien','cowboy','footballeur','cuisinier','alien','hero'],
 'B32': ['pont_pierre','passerelle','tronc','portique','branche_sapin','corbeau','oie','chouette','arche_glace','banderole','cerf_volant','pancarte'],
 'B33': ['g_debut1','g_debut2','g_debut3','g_debut4','g_plat1','g_neige','g_plat3','g_plat4','g_sortie1','g_sortie2','g_sortie3','g_sortie4'],
 'B16': ['immeuble_grand','immeuble_magasin','maison','eglise','grange','moulin','igloo','sapins3','rochers_glace','panneau','bosquet','lampadaire_village'],
 'B35': ['t1','t2','t3','t4','l1','l2','l3','l4','r1','r2','r3','r4'],
 'B36': ['voiture_rouge','berline_bleue','sport_jaune','break_vert','camionnette','camion_bache','citerne','demenagement','tracteur_rouge','tracteur_vert','pompiers','deneigeuse'],
 'B6': ['coeur_plein','coeur_vide','etoile_score','pouce','croix','sablier','doigt','fleches','banniere','bouton_dore','trophee','nuage'],
}
LIGNES = {'B11': [5, 4, 4]}   # nombre d'objets par rangée quand ce n'est pas 4-4-4
TROUS_TRANSPARENTS = {('B33','g_debut1'),('B33','g_debut2'),('B33','g_debut3'),('B33','g_debut4'),('B33','g_plat1'),('B33','g_neige'),('B33','g_plat3'),('B33','g_plat4'),('B33','g_sortie1'),('B33','g_sortie2'),('B33','g_sortie3'),('B33','g_sortie4'),('B32','pont_pierre'),('B32','arche_glace'),('B32','passerelle'),('B32','portique'),('B32','pancarte'),('B32','banderole'),('B6','coeur_vide'),('B11','coeur_vide'),('B15','arche'),('B13','cloture'),('B18','couronne'),('B20','cata_repos'),('B20','cata_tendue'),('B20','cata_tir'),('B20','base'),('B21','cloche'),('B21','ruban'),('B22','renne_c2'),('B22','renne_bas'),('B22','renne_c1'),('B22','renne_c3'),('B22','renne_saut1'),('B22','renne_saut2'),('B22','renne_atterrit')}   # l'intérieur blanc du cœur vide devient transparent

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

def ordonner(objs, cfg=(4, 4, 4)):
    ys = sorted(set(((s[0].start + s[0].stop)//2) for s, _, _ in objs))
    # 3 rangées par regroupement des centres verticaux
    c = sorted(objs, key=lambda o: (o[0][0].start + o[0][0].stop)//2)
    a, b2, c3 = cfg
    lignes = [c[0:a], c[a:a+b2], c[a+b2:a+b2+c3]]
    res = []
    for l in lignes:
        res += sorted(l, key=lambda o: (o[0][1].start + o[0][1].stop)//2)
    return res

def main():
    os.makedirs(OUT, exist_ok=True)
    index = {}
    for b in sorted(NOMS):
        im, a, fg, grp, objs = decouper(b)
        if len(objs) != len(NOMS[b]):
            print(b, 'ATTENTION', len(objs), 'objets trouvés');
        objs = ordonner(objs, LIGNES.get(b, (4, 4, 4)))
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
