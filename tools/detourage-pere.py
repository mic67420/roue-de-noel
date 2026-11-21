# Découpe les planches du Père Noël réaliste : B39 (course, 4x2) et B40 (saut, 3x2).
# Chaque case est détourée (fond blanc), puis posée sur un canvas commun, pieds alignés en bas, centrée sur le corps.
import os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
SRC=os.path.join(ROOT,'assets','planches-sources');OUT=os.path.join(ROOT,'assets','mini-jeux')
PLANCHES={'B39':(4,2,['c1','c2','c3','c4','c1b','c2b','c3b','c4b']),'B40':(3,2,['prep','decol','monte','sommet','descend','recep'])}
def main():
    idx=json.load(open(os.path.join(OUT,'index.json')))
    for b,(nc,nl,noms) in PLANCHES.items():
        im=Image.open(os.path.join(SRC,b+'.jpg')).convert('RGB');W,H=im.size;cw,ch=W//nc,H//nl
        fr=[]
        for i,nom in enumerate(noms):
            c=i%nc;l=i//nc
            cell=im.crop((c*cw,l*ch,(c+1)*cw,(l+1)*ch));a=np.array(cell).astype(int)
            blanc=a.min(axis=2)>=232
            lab,_=ndi.label(blanc);bord=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
            fond=np.isin(lab,list(bord));fg=ndi.binary_opening(~fond,iterations=1)
            l2,n=ndi.label(fg)
            if n>1:
                s=ndi.sum(fg,l2,range(1,n+1));fg=l2==(1+int(np.argmax(s)))
            fg=ndi.binary_fill_holes(fg)
            al=np.array(Image.fromarray((fg*255).astype('uint8')).filter(ImageFilter.GaussianBlur(.8)))
            ys,xs=np.where(fg)
            fr.append((nom,np.dstack([np.array(cell),al]).astype('uint8'),ys.min(),ys.max(),float(xs.mean())))
        # canvas commun : hauteur max au-dessus des pieds, largeur max autour du centre de masse
        up=max(f[4-2+0]-0 for f in fr) if False else max(f[3]-f[2] for f in fr)+1
        L=int(max(f[4]-np.where(f[1][:,:,3]>40)[1].min() for f in fr))+4
        R=int(max(np.where(f[1][:,:,3]>40)[1].max()-f[4] for f in fr))+4
        cwid=L+R;chei=up+8
        for nom,arr,y0,y1,cx in fr:
            out=Image.new('RGBA',(cwid,chei),(0,0,0,0))
            x0=int(L-cx);yy=chei-4-(y1-y0+1)
            out.paste(Image.fromarray(arr,'RGBA').crop((0,y0,arr.shape[1],y1+1)),(x0,yy))
            fn=f'{b}_{nom}.png';out.save(os.path.join(OUT,fn),optimize=True)
            idx[b+'_'+nom]={'f':fn,'w':int(cwid),'h':int(chei)}
        print(b,cwid,chei)
    json.dump(idx,open(os.path.join(OUT,'index.json'),'w'),indent=1)
main()
