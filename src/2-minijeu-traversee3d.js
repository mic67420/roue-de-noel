/* ---- La grande traversée en 3D (v3.56) : vue de dessus inclinée, derrière le Père Noël ----
   Les règles (mjtNew / mjtUpdate / collisions) sont celles de 2-minijeu-traversee.js ; seul le dessin change.
   Unités du monde : 1 colonne = 1 rangée en profondeur = 1 de hauteur. X = colonnes depuis le centre (colonne 3), Y = hauteur, z = profondeur
   (z = zb à la rangée du Père Noël). Projection : f = zb / z ; écran x = W/2 + X·ch·f ; y = hy + (camH − Y·ch)·f.
   Les rangées « sûres » sont des plateaux surélevés (face avant visible), les voies sont au niveau bas. Décor en volume dessiné par le code
   (cônes, blocs, maisons…), véhicules = images B36, Père Noël = images B11. Aucun animal pour l'instant. */
function mjt3Cam(s,W,H){
  const ch=.16*H,zb=3.2,hy=.1*H,camH=(.86*H-hy)/ch*ch;
  return{W,H,ch,zb,hy,camH,cam:s.cam,
    f:z=>zb/z,
    X:(X,z)=>W/2+X*ch*zb/z,
    Y:(Y,z)=>hy+(camH-Y*ch)*zb/z};
}
const MJT_HS=.3;                                  // hauteur des plateaux (rangées sûres)
const MJT_CIEL={0:['#7f9fd6','#dfe9fb'],1:['#8fb4dd','#e3eddc'],2:['#8c93b5','#dcd8e2'],3:['#4f6aa8','#e4ecf8']};
const MJT_BRUME={0:'#dfe9fb',1:'#dfe9d4',2:'#d6d3dc',3:'#e1e9f6'};
function mjtRGB(c,k){                              // '#rrggbb' * k (éclaircir si k>1)
  const n=parseInt(c.slice(1),16),r=n>>16&255,g=n>>8&255,b=n&255,m=v=>Math.max(0,Math.min(255,Math.round(v*k)));
  return'rgb('+m(r)+','+m(g)+','+m(b)+')';
}
function mjtPoly(g,C,pts,z,fill){                  // pts = [[X,Y,z],…]
  g.fillStyle=fill;g.beginPath();
  for(let i=0;i<pts.length;i++){const p=pts[i],zz=p[2]===undefined?z:p[2],x=C.X(p[0],zz),y=C.Y(p[1],zz);i?g.lineTo(x,y):g.moveTo(x,y)}
  g.closePath();g.fill();
}
/* Solide de révolution à facettes : rings = [[hauteur, rayon],…] (du bas vers le haut), n côtés. Seules les facettes vers la caméra sont dessinées. */
function mjt3Loft(g,C,X,Y0,z,rings,col,n,top){
  n=n||10;const cull=Math.sin;
  const V=(i,k)=>{const a=k/n*6.2832,r=rings[i][1],zz=z-r*Math.sin(a)*.9;return[C.X(X+r*Math.cos(a),zz),C.Y(Y0+rings[i][0],zz)]};
  for(let i=0;i<rings.length-1;i++){
    for(let k=0;k<n;k++){
      const am=(k+.5)/n*6.2832;if(Math.sin(am)<-.05)continue;      // face arrière : cachée
      const a=V(i,k),b=V(i,k+1),c=V(i+1,k+1),d=V(i+1,k);
      const lum=.52+.48*Math.cos(am-2.2);
      g.fillStyle=mjtRGB(col,lum);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath();g.fill();
    }
  }
  if(top!==false){const i=rings.length-1;if(rings[i][1]>.001){g.fillStyle=mjtRGB(top||col,1.08);g.beginPath();for(let k=0;k<n;k++){const p=V(i,k);k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])}g.closePath();g.fill()}}
}
/* Boîte : X0..X1, Y0..Y1, z0 (face avant, la plus proche) .. z1 */
function mjt3Box(g,C,X0,X1,Y0,Y1,z0,z1,col,topCol){
  const xm=(X0+X1)/2;
  if(Math.abs(xm)>.05){const sx=xm>0?X0:X1;mjtPoly(g,C,[[sx,Y0,z0],[sx,Y0,z1],[sx,Y1,z1],[sx,Y1,z0]],0,mjtRGB(col,.62))}
  mjtPoly(g,C,[[X0,Y1,z0],[X1,Y1,z0],[X1,Y1,z1],[X0,Y1,z1]],0,topCol||mjtRGB(col,1.12));
  mjtPoly(g,C,[[X0,Y0,z0],[X1,Y0,z0],[X1,Y1,z0],[X0,Y1,z0]],0,mjtRGB(col,.86));
}
function mjtFenetres(g,C,X0,X1,Y0,Y1,z,nx,ny,lit){   // fenêtres sur la face avant
  const w=(X1-X0)/(nx*2+1),h=(Y1-Y0)/(ny*2+1);
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
    const x0=X0+w*(1+i*2),y0=Y0+h*(1+j*2);
    mjtPoly(g,C,[[x0,y0,z],[x0+w,y0,z],[x0+w,y0+h,z],[x0,y0+h,z]],0,lit&&(i*7+j*3)%4!==0?'#ffd978':'#33415f');
  }
}
function mjtToit(g,C,X0,X1,Y1,Yr,z0,z1,col,ov){     // toit à deux pans, faîtage le long de X, neige dessus
  const zc=(z0+z1)/2,o=ov||.14,xm=(X0+X1)/2;
  if(Math.abs(xm)>.05){const sx=xm>0?X0:X1;mjtPoly(g,C,[[sx,Y1,z0],[sx,Y1,z1],[sx,Yr,zc]],0,mjtRGB(col,.6))}
  mjtPoly(g,C,[[X0-o,Y1-.04,z0-o],[X1+o,Y1-.04,z0-o],[X1+o,Yr,zc],[X0-o,Yr,zc]],0,'#f4f8ff');
  mjtPoly(g,C,[[X0-o,Y1-.04,z0-o],[X1+o,Y1-.04,z0-o],[X1+o,Y1-.12,z0-o],[X0-o,Y1-.12,z0-o]],0,'#c7d3ea');
}
function mjtMaison(g,C,X,z,h,wall,roof,opt){
  opt=opt||{};const w=(opt.w||1.5),d=1.1,Y1=h*.62,Yr=h;
  const X0=X-w/2,X1=X+w/2,z0=z-d/2,z1=z+d/2;
  mjt3Box(g,C,X0,X1,0,Y1,z0,z1,wall);
  mjtFenetres(g,C,X0,X1,.18,Y1-.1,z0,2,1,true);
  if(opt.porte)mjtPoly(g,C,[[X-.16,0,z0],[X+.16,0,z0],[X+.16,.5,z0],[X-.16,.5,z0]],0,'#6a3f22');
  mjtToit(g,C,X0,X1,Y1,Yr,z0,z1,roof);
  if(!opt.nocheminee){const cx=X+(X>0?-.3:.3)*w/1.5;mjt3Box(g,C,cx-.13,cx+.13,Yr-.28,Yr+.18,z+.1,z+.34,'#8a4a36','#f4f8ff')}
  if(opt.auvent){mjtPoly(g,C,[[X0,.62,z0-.12],[X1,.62,z0-.12],[X1,.5,z0-.3],[X0,.5,z0-.3]],0,opt.auvent)}
}
function mjtSapin(g,C,X,Y0,z,h,xmas,t){
  const tiers=3,w=h*.36;
  mjt3Loft(g,C,X,Y0,z,[[0,.1],[h*.18,.1]],'#6a4426',6,false);
  for(let i=0;i<tiers;i++){
    const yb=Y0+h*.14+i*h*.25,th=h*.34,r=w*(1-i*.24);
    mjt3Loft(g,C,X,yb,z,[[0,r],[th,0]],'#2f6b45',8,false);
    mjt3Loft(g,C,X,yb+th*.42,z,[[0,r*.58],[th*.58,0]],'#f2f7ff',8,false);
  }
  if(xmas){
    for(let i=0;i<7;i++){const a=i*2.4,yy=Y0+h*(.2+i*.1),rr=w*(1-i*.11)*.8,zz=z-rr*Math.sin(a)*.5;if(Math.sin(a)<-.2)continue;
      g.fillStyle=(Math.floor(t*3)+i)%3===0?'#ffd24a':(i%2?'#ff5a5a':'#6fd0ff');g.beginPath();g.arc(C.X(X+rr*Math.cos(a),zz),C.Y(yy,zz),Math.max(1.5,C.ch*.05*C.zb/zz),0,6.283);g.fill()}
  }
}
function mjtRocher(g,C,X,Y0,z,h,col){
  mjt3Loft(g,C,X,Y0,z,[[0,h*.8],[h*.45,h*.62],[h*.85,h*.28],[h,.05]],col||'#8b93a3',7,'#f4f8ff');
  mjt3Loft(g,C,X,Y0+h*.55,z,[[0,h*.4],[h*.3,.04]],'#f4f8ff',7,false);
}
function mjtLampadaire(g,C,X,Y0,z,h,t){
  mjt3Loft(g,C,X,Y0,z,[[0,.09],[h,.06]],'#2c3140',6,'#2c3140');
  const lx=C.X(X,z),ly=C.Y(Y0+h,z),r=C.ch*.16*C.zb/z;
  const gr=g.createRadialGradient(lx,ly,0,lx,ly,r*3.2);gr.addColorStop(0,'rgba(255,225,150,.85)');gr.addColorStop(1,'rgba(255,225,150,0)');g.fillStyle=gr;g.fillRect(lx-r*3.2,ly-r*3.2,r*6.4,r*6.4);
  g.fillStyle='#fff3c4';g.beginPath();g.arc(lx,ly,r*.55,0,6.283);g.fill();
}
function mjtBonhomme(g,C,X,Y0,z,h){
  const sph=(y,r,col)=>{const rings=[];for(let k=0;k<=6;k++){const a=-1.4+k/6*2.8;rings.push([r*(1+Math.sin(a))*.98,r*Math.cos(a)])}mjt3Loft(g,C,X,Y0+y-r,z,rings,col,10,'#fff')};
  sph(h*.22,h*.22,'#f4f8ff');sph(h*.55,h*.17,'#f4f8ff');sph(h*.8,h*.13,'#f4f8ff');
  const x=C.X(X,z-.1),f=C.zb/z;
  g.fillStyle='#ff8a1e';g.beginPath();g.moveTo(x,C.Y(Y0+h*.8,z-.12));g.lineTo(x-C.ch*.02*f,C.Y(Y0+h*.8-.03,z-.12)+C.ch*.05*f);g.lineTo(x+C.ch*.02*f,C.Y(Y0+h*.8-.03,z-.12)+C.ch*.05*f);g.fill();
  mjt3Loft(g,C,X,Y0+h*.9,z,[[0,.17],[.03,.17],[.04,.1],[.2,.1]],'#222',8,'#222');
}
function mjtCloture(g,C,X,Y0,z){
  for(const dx of[-.55,0,.55])mjt3Box(g,C,X+dx-.05,X+dx+.05,Y0,Y0+.5,z-.05,z+.05,'#8a5a32');
  mjt3Box(g,C,X-.6,X+.6,Y0+.34,Y0+.4,z-.09,z-.03,'#a9703c');mjt3Box(g,C,X-.6,X+.6,Y0+.16,Y0+.22,z-.09,z-.03,'#a9703c');
}
function mjtMoulin(g,C,X,Y0,z,h,t){
  mjt3Loft(g,C,X,Y0,z,[[0,.8],[h*.7,.5]],'#c9b79a',10,false);
  mjt3Loft(g,C,X,Y0+h*.7,z,[[0,.58],[h*.3,0]],'#8a4a36',10,false);
  const cx=C.X(X,z-.6),cy=C.Y(Y0+h*.62,z-.6),f=C.zb/z,L=h*.55*C.ch*f;
  g.strokeStyle='#6a4a30';g.lineWidth=Math.max(2,C.ch*.06*f);
  for(let k=0;k<4;k++){const a=t*.6+k*1.5708;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*L,cy+Math.sin(a)*L);g.stroke()}
}
function mjtEglise(g,C,X,z,h){
  mjt3Box(g,C,X-1,X+1,0,h*.5,z-.7,z+.7,'#d9c9a8');mjtFenetres(g,C,X-1,X+1,.2,h*.5-.1,z-.7,3,1,true);
  mjtToit(g,C,X-1,X+1,h*.5,h*.7,z-.7,z+.7,'#9a4a3a');
  mjt3Box(g,C,X-.35,X+.35,h*.4,h*.95,z-.1,z+.4,'#d9c9a8');
  mjt3Loft(g,C,X,h*.95,z+.15,[[0,.5],[h*.5,0]],'#7a4538',4,false);
}
function mjtImmeuble(g,C,X,z,h,col,mag){
  const w=mag?2.2:1.7;
  mjt3Box(g,C,X-w/2,X+w/2,0,h,z-.7,z+.7,col,'#f0f4fb');
  mjtFenetres(g,C,X-w/2,X+w/2,mag?.9:.3,h-.1,z-.7,mag?3:3,Math.max(2,Math.round(h/1.1)),true);
  if(mag){mjtPoly(g,C,[[X-w/2,.85,z-.7],[X+w/2,.85,z-.7],[X+w/2,.6,z-1.0],[X-w/2,.6,z-1.0]],0,'#c8202c');mjtPoly(g,C,[[X-w/2+.1,0,z-.7],[X+w/2-.1,0,z-.7],[X+w/2-.1,.6,z-.7],[X-w/2+.1,.6,z-.7]],0,'#ffe9a8')}
}
function mjtMarche(g,C,X,z,h){
  for(const dx of[-.7,.7])mjt3Box(g,C,X+dx-.05,X+dx+.05,0,h*.55,z-.4,z-.3,'#7a4a2a');
  mjt3Box(g,C,X-.8,X+.8,0,.45,z-.1,z+.4,'#a9703c');
  mjtPoly(g,C,[[X-.95,h*.55,z-.5],[X+.95,h*.55,z-.5],[X+.95,h*.75,z+.1],[X-.95,h*.75,z+.1]],0,'#c8202c');
  for(let i=0;i<4;i++)mjtPoly(g,C,[[X-.95+i*.475,h*.55,z-.5],[X-.95+i*.475+.2375,h*.55,z-.5],[X-.95+i*.475+.2375,h*.75,z+.1],[X-.95+i*.475,h*.75,z+.1]],0,'#f4f8ff');
}
function mjtFontaine(g,C,X,Y0,z){
  mjt3Loft(g,C,X,Y0,z,[[0,.9],[.28,.9]],'#aeb7c8',14,'#7fc4e8');
  mjt3Loft(g,C,X,Y0+.28,z,[[0,.14],[.8,.1]],'#aeb7c8',8,false);
  mjt3Loft(g,C,X,Y0+.8,z,[[0,.42],[.12,.42]],'#aeb7c8',10,'#9bd4ee');
}
// décor : dispatch par clé d'image ; retourne false si la clé n'a pas de version 3D (alors on dessine l'image)
function mjt3Deco(g,C,key,X,z,h,t,side){
  const H=h*.885;
  switch(key){
    case'B12_sapin':case'B13_arbre_givre':mjtSapin(g,C,X,0,z,H*1.05);return true;
    case'B12_sapin_neige':case'B16_sapins3':case'B16_bosquet':mjtSapin(g,C,X,0,z,H*.95);mjtSapin(g,C,X+side*.9,0,z+.5,H*.75);if(key==='B16_sapins3')mjtSapin(g,C,X-side*.85,0,z-.35,H*.65);return true;
    case'B15_sapin_noel':mjtSapin(g,C,X,0,z,H*1.05,true,t);return true;
    case'B17_sapin_geant':mjtSapin(g,C,X,0,z,H*1.15,true,t);return true;
    case'B12_rocher':mjtRocher(g,C,X,0,z,H*.55);return true;
    case'B16_rochers_glace':mjtRocher(g,C,X,0,z,H*.5,'#8fb4d8');mjtRocher(g,C,X+side*.8,0,z+.3,H*.35,'#a4c4e2');return true;
    case'B16_igloo':mjt3Loft(g,C,X,0,z,[[0,1.15],[.35,1.05],[.7,.8],[.98,.4],[1.12,.02]],'#e8f0fc',12,'#ffffff');mjtPoly(g,C,[[X-.3,0,z-.95],[X+.3,0,z-.95],[X+.3,.5,z-.95],[X-.3,.5,z-.95]],0,'#35456a');return true;
    case'B13_botte':mjt3Loft(g,C,X,0,z,[[0,.5],[.55,.5]],'#d8b44c',10,'#e7c968');return true;
    case'B13_cloture':mjtCloture(g,C,X,0,z);return true;
    case'B16_grange':mjt3Box(g,C,X-1.3,X+1.3,0,1.4,z-.9,z+.9,'#a83a2a');mjtPoly(g,C,[[X-.4,0,z-.9],[X+.4,0,z-.9],[X+.4,1,z-.9],[X-.4,1,z-.9]],0,'#f1e4cc');mjtToit(g,C,X-1.3,X+1.3,1.4,2.1,z-.9,z+.9,'#6b3a2a',.2);return true;
    case'B16_moulin':mjtMoulin(g,C,X,0,z,H*1.1,t);return true;
    case'B14_lampadaire':case'B17_lampadaire':case'B16_lampadaire_village':mjtLampadaire(g,C,X,0,z,H*.75,t);return true;
    case'B14_boite_lettres':mjt3Box(g,C,X-.22,X+.22,0,.8,z-.2,z+.2,'#2f5fa8');mjt3Box(g,C,X-.22,X+.22,.65,.8,z-.2,z+.2,'#f1c232');return true;
    case'B14_banc':mjt3Box(g,C,X-.6,X+.6,.28,.36,z-.18,z+.18,'#9a6a3c');mjt3Box(g,C,X-.6,X+.6,.36,.7,z+.12,z+.18,'#9a6a3c');for(const d of[-.5,.5])mjt3Box(g,C,X+d-.04,X+d+.04,0,.28,z-.15,z+.15,'#2c3140');return true;
    case'B15_bonhomme':mjtBonhomme(g,C,X,0,z,H*1.1);return true;
    case'B15_tonneau':mjt3Loft(g,C,X,0,z,[[0,.4],[.2,.46],[.45,.46],[.65,.4]],'#8a5a32',10,'#a9703c');return true;
    case'B16_immeuble_grand':mjtImmeuble(g,C,X,z,2.9,'#b7716a');return true;
    case'B16_immeuble_magasin':mjtImmeuble(g,C,X,z,2.1,'#6f89b0',true);return true;
    case'B17_maison_rouge':mjtMaison(g,C,X,z,H*1.15,'#c8584a','#7a4538',{porte:1});return true;
    case'B17_maison_bleue':mjtMaison(g,C,X,z,H*1.15,'#6f8fc4','#4a5a7a',{porte:1});return true;
    case'B17_maison_colombages':mjtMaison(g,C,X,z,H*1.2,'#e6d6b6','#8a5a3a',{porte:1,w:1.7});return true;
    case'B17_maison_verte':mjtMaison(g,C,X,z,H*1.2,'#7fa87a','#5a3a2a',{porte:1,w:1.7});return true;
    case'B17_boulangerie':mjtMaison(g,C,X,z,H*1.05,'#e0b27a','#8a3a2a',{porte:1,auvent:'#c8202c'});return true;
    case'B17_marche':mjtMarche(g,C,X,z,H);return true;
    case'B17_fontaine':mjtFontaine(g,C,X,0,z);return true;
    case'B16_eglise':mjtEglise(g,C,X,z,H*1.25);return true;
  }
  return false;
}
function mjtDraw(g,s,W,H,tm){
  s.asp=W/H;
  if(s.fin&&s.fin.t>.25){mjtFinale(g,s,W,H,tm);return}
  const C=mjt3Cam(s,W,H),ch=C.ch,zb=C.zb,cam=s.cam,U=.885*ch;
  const bioCur=Math.max(0,Math.min(3,Math.round(s.cam<0?0:(s.rows[Math.min(s.N,Math.max(0,Math.round(s.cam+3)))]||{bio:0}).bio)));
  const sk=MJT_CIEL[bioCur],fog=MJT_BRUME[bioCur];
  // ciel + horizon
  let gr=g.createLinearGradient(0,0,0,C.hy+4);gr.addColorStop(0,sk[0]);gr.addColorStop(1,sk[1]);g.fillStyle=gr;g.fillRect(0,0,W,C.hy+4);
  g.fillStyle=fog;g.fillRect(0,C.hy,W,H-C.hy);
  g.fillStyle=mjtRGB(fog,.9);g.beginPath();g.moveTo(0,C.hy);for(let i=0;i<=24;i++)g.lineTo(W*i/24,C.hy-H*(.025+.03*Math.abs(Math.sin(i*1.7+bioCur))));g.lineTo(W,C.hy);g.fill();
  const rowVis=s.hop?s.hop.fr+(s.hop.tr-s.hop.fr)*Math.min(1,s.hop.t/s.hop.dur):s.r,rSan=Math.round(rowVis);
  const rowH=r=>{const R=r>s.N?TV_VIDE:s.rows[Math.max(0,r)];return R.t==='lane'&&r>0?0:MJT_HS};
  let santaDone=false;
  const drawSanta=()=>{
    santaDone=true;
    const p=s.hop?Math.min(1,s.hop.t/s.hop.dur):0,sx=s.hop?s.hop.fc+(s.hop.tc-s.hop.fc)*p:s.c;
    const zS=rowVis-cam+zb,f=zb/zS,x=C.X(sx-3,zS);
    const yh=s.hop?rowH(s.hop.fr)+(rowH(s.hop.tr)-rowH(s.hop.fr))*p:rowH(s.r);
    const lift=s.hop&&!s.hop.back?Math.sin(p*Math.PI)*.55:0,foot=C.Y(yh+lift*.5,zS-.0);
    const gy=C.Y(yh,zS);
    g.fillStyle='rgba(20,30,70,.32)';g.beginPath();g.ellipse(x,gy,ch*.3*f*(1-lift*.4),ch*.09*f,0,0,6.283);g.fill();
    let key='B11_santa_dos',flip=false;
    if(s.stun>0)key=Math.floor(s.t*6)%2?'B11_santa_etourdi1':'B11_santa_etourdi2';
    else if(s.hop&&!s.hop.back){if(s.hop.tc!==s.hop.fc){key='B11_santa_droite';flip=s.hop.tc<s.hop.fc}else key='B11_santa_saut'}
    else if(s.done==='win')key='B11_santa_content';
    const blink=s.inv>0&&Math.floor(s.t*14)%2===0?.45:1;
    mjtSpr(g,key,x,foot,U*1.5*f,flip,blink);
  };
  const rTop=Math.min(s.N+14,Math.ceil(cam+zb+15)),rBot=Math.floor(cam-1);
  for(let r=rTop;r>=rBot;r--){
    const R=r>s.N?TV_VIDE:s.rows[Math.max(0,r)],b=TV_BIO[R.bio];
    let zN=r-cam+zb-.5;if(zN<.3)continue;
    const zF=zN+1,zc=zN+.5,f=zb/zc,lane=R.t==='lane'&&r>0&&r<=s.N,Yg=lane?0:MJT_HS;
    const yN=C.Y(Yg,zN),yF=C.Y(Yg,zF);
    if(yF>H)continue;
    const fogA=Math.max(0,Math.min(.8,(zN-5.5)/13));
    // sol
    g.fillStyle=lane?b.lane:b.safe[((r%2)+2)%2];g.fillRect(0,yF,W,yN-yF+1);
    if(!lane&&r>=0){ // face avant du plateau (marche)
      const y0=C.Y(0,zN);g.fillStyle=mjtRGB(b.safe[0],.74);g.fillRect(0,yN,W,y0-yN+1);
      g.fillStyle='rgba(255,255,255,.55)';g.fillRect(0,yN,W,Math.max(1,(y0-yN)*.22));
    }
    if(R.t==='fin'){const sqx=ch*f*.5;for(let i=-Math.ceil(W/2/sqx);i<W/2/sqx+1;i++)for(let j=0;j<2;j++){g.fillStyle=(i+j+100)%2?'#fff':'#c8202c';const ya=yF+(yN-yF)*j/2;g.fillRect(W/2+i*sqx,ya,sqx+1,(yN-yF)/2+1)}}
    else if(lane){
      g.strokeStyle=b.ligne;g.lineWidth=Math.max(1.5,ch*.07*f);g.setLineDash([ch*.5*f,ch*.45*f]);g.beginPath();const ym=C.Y(0,zc);g.moveTo(0,ym);g.lineTo(W,ym);g.stroke();g.setLineDash([]);
      g.fillStyle='rgba(255,255,255,.18)';g.fillRect(0,yF,W,Math.max(1,(yN-yF)*.07));
      g.fillStyle='rgba(0,0,0,.16)';g.fillRect(0,yN-Math.max(1,(yN-yF)*.1),W,Math.max(1,(yN-yF)*.1));
    }else{
      g.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<10;i++){const hx=mjtHash(r,i);g.fillRect(hx*W,yF+mjtHash(i,r)*(yN-yF),Math.max(1,3*f),Math.max(1,2*f))}
    }
    // décor de la rangée
    if(R.t==='safe'&&r>=0){
      const zd=zc;
      for(const m of R.marg){
        const X=m.side*(7.3+mjtHash(r,3)*.7);
        if(m.pan){mjtSpr(g,m.key,C.X(X,zd),C.Y(MJT_HS,zd),m.h*U*f,false);continue}
        if(!mjt3Deco(g,C,m.key,X,zd,m.h,tm,m.side))mjtSpr(g,m.key,C.X(X,zd),C.Y(MJT_HS,zd),m.h*U*f,false);
      }
      // arbres de fond, de chaque côté (remplissent les bords de l'écran)
      for(const sd of[-1,1]){const hh=mjtHash(r+sd*9,5);if(hh>.55&&!R.depart){const X=sd*(9.6+hh*2.5);if(R.bio===2)mjtLampadaire(g,C,X,MJT_HS,zd,1.9,tm);else mjtSapin(g,C,X,MJT_HS,zd,1.5+hh,R.bio===3&&hh>.8,tm)}}
      for(const bl of R.blk){
        const X=bl.c-3,y0=MJT_HS;
        g.save();g.translate(0,0);
        const shifted=(function(){return mjt3DecoY(g,C,bl.key,X,zd,bl.h,tm,y0)})();
        g.restore();
        if(!shifted)mjtSpr(g,bl.key,C.X(X,zd),C.Y(MJT_HS,zd),bl.h*U*f,false);
      }
    }
    if(R.t==='fin'){mjtSpr(g,'B18_maison_finale2',C.X(0,zc),C.Y(MJT_HS,zc),U*4.4*f,false);mjtSpr(g,'B18_tapis_neige',C.X(0,zc-.5),C.Y(MJT_HS,zc-.5),U*1.3*f,false)}
    if(lane){
      for(const o of R.objs){
        const X=mjtX(R,o,s.t)-3,x=C.X(X,zc);
        const hgt=o.h*U*f,wpx=hgt*tvAsp(o.key);
        if(x<-wpx||x>W+wpx)continue;
        const yb=C.Y(0,zc);
        g.fillStyle='rgba(20,30,70,.3)';g.beginPath();g.ellipse(x,yb,wpx*.46,ch*.16*f,0,0,6.283);g.fill();
        if(!mjtVeh(g,C,o.key,X,zc,R.dir,o.h,tvAsp(o.key),tm))mjtSpr(g,o.key,x,yb+ch*.03*f,hgt,R.dir<0);
      }
    }
    if(r===rSan)drawSanta();
    if(fogA>.02){g.fillStyle=fog;g.globalAlpha=fogA;g.fillRect(0,Math.max(0,yF-ch*3.2*f),W,yN-yF+ch*3.2*f+1);g.globalAlpha=1}
  }
  if(!santaDone)drawSanta();
  // flocons
  g.fillStyle='rgba(255,255,255,.8)';
  for(let i=0;i<34;i++){const sz=1.5+(i%4),px=((i*131.7+tm*(10+i%5*6)+Math.sin(tm+i)*20)%(W+20))-10,py=((i*77.3+tm*(40+(i%4)*22))%(H+20))-10;g.beginPath();g.arc(px,py,sz,0,6.283);g.fill()}
  // rafale de neige qui avance par le bas (adultes)
  if(!s.easy){
    const zf=Math.max(.3,s.chase+1-cam+zb-.5),yf=C.Y(0,zf);
    if(yf<H){const hb=H*.16,gr2=g.createLinearGradient(0,yf-hb,0,yf+H*.05);gr2.addColorStop(0,'rgba(210,225,250,0)');gr2.addColorStop(.35,'rgba(215,228,252,.78)');gr2.addColorStop(1,'rgba(235,242,255,.95)');
      g.fillStyle=gr2;g.fillRect(0,yf-hb,W,H-yf+hb);
      g.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<26;i++){const px=((i*97.3+tm*(180+i%5*40))%(W+40))-20,py=yf+(((i*53+tm*140)%(Math.max(30,H-yf)+30))-10);g.beginPath();g.arc(px,py,2+(i%3),0,6.283);g.fill()}}
  }
  const bt=s.t-s.bioT;
  if(bt>=0&&bt<2.6){const a=Math.min(1,bt*3,(2.6-bt)*2);g.save();g.globalAlpha=a;g.textAlign='center';g.textBaseline='middle';g.font=`italic 900 ${H*.075}px Georgia,serif`;g.lineWidth=H*.012;g.strokeStyle='#1a2a60';g.strokeText(TV_BIO[s.bio].nom,W/2,H*.3);g.fillStyle='#ffe48a';g.fillText(TV_BIO[s.bio].nom,W/2,H*.3);g.restore()}
  if(s.t<5&&s.best===0){g.save();g.globalAlpha=.7+.3*Math.sin(tm*5);g.textAlign='center';g.font=`bold ${H*.045}px Georgia,serif`;g.lineWidth=5;g.strokeStyle='#1a2a60';const m='Touche pour avancer · glisse pour aller sur le côté';g.strokeText(m,W/2,H*.5);g.fillStyle='#fff';g.fillText(m,W/2,H*.5);g.restore()}
}
// objets posés sur un plateau (hauteur y0) : on décale la caméra du monde de y0 en recréant C avec Y décalé
function mjt3DecoY(g,C,key,X,z,h,t,y0){
  const C2=Object.assign({},C,{Y:(Y,zz)=>C.Y(Y+y0,zz)});
  return mjt3Deco(g,C2,key,X,z,h,t,X>0?1:-1);
}

/* ---- Véhicules (v3.58) : silhouettes arrondies extrudées en profondeur, dégradés métalliques, vitres, roues à jantes ----
   Chaque pièce = contour de points [x,y,rayon d'arrondi] (x 0 arrière → 1 avant, y 0 sol → 1 hauteur totale). Le contour est dessiné
   en tranches de la profondeur (loin → proche : le toit et le capot apparaissent en volume), puis la face proche reçoit dégradé,
   vitres, portières, phares, pare-chocs et roues. */
const MJT_CAB=(c,x0,x1,y1)=>({c,p:[[x0,.22,.02],[x0,y1-.04,.05],[x0+(x1-x0)*.55,y1,.06],[x1-.05,y1-.3,.1],[x1,.5,.05],[x1,.22,.02]],
  g:[[[x0+.04,.5,.02],[x0+.04,y1-.1,.04],[x0+(x1-x0)*.5,y1-.06,.04],[x1-.07,.62,.03],[x1-.07,.5,.02]]]});
const MJT_VEH={
 'B36_voiture_rouge':{wh:[[.22,.19],[.78,.19]],parts:[{c:'#d8352f',p:[[0,.2,.03],[0,.5,.09],[.2,.6,.14],[.3,.97,.16],[.6,.97,.16],[.78,.6,.12],[1,.46,.1],[1,.2,.03]],
   g:[[[.27,.63,.03],[.33,.9,.05],[.47,.9,.03],[.47,.63,.02]],[[.51,.63,.02],[.51,.9,.03],[.6,.9,.05],[.71,.63,.03]]],seam:[.49,.2,.6]}]},
 'B36_berline_bleue':{wh:[[.2,.19],[.8,.19]],parts:[{c:'#2c5cc2',p:[[0,.2,.03],[0,.5,.08],[.1,.55,.1],[.3,.97,.17],[.6,.97,.17],[.78,.55,.12],[1,.46,.1],[1,.2,.03]],
   g:[[[.32,.58,.03],[.37,.9,.05],[.47,.9,.03],[.47,.58,.02]],[[.51,.58,.02],[.51,.9,.03],[.6,.9,.05],[.72,.58,.03]]],seam:[.49,.2,.58]}]},
 'B36_sport_jaune':{wh:[[.2,.2],[.8,.2]],parts:[{c:'#f3c21a',p:[[0,.22,.03],[0,.52,.1],[.12,.6,.1],[.4,.98,.2],[.62,.98,.2],[.8,.64,.14],[1,.5,.1],[1,.22,.03]],
   g:[[[.38,.66,.03],[.43,.9,.07],[.6,.9,.07],[.74,.66,.04]]]},{c:'#2a2a30',p:[[0,.6,.02],[0,.74,.02],[.12,.74,.02],[.12,.6,.02]]}]},
 'B36_break_vert':{wh:[[.21,.19],[.79,.19]],parts:[{c:'#2f8a45',p:[[0,.2,.03],[0,.55,.06],[.08,.97,.1],[.76,.97,.12],[.88,.56,.1],[1,.48,.08],[1,.2,.03]],
   g:[[[.12,.6,.03],[.14,.9,.04],[.3,.9,.03],[.3,.6,.02]],[[.34,.6,.02],[.34,.9,.03],[.52,.9,.03],[.52,.6,.02]],[[.56,.6,.02],[.56,.9,.03],[.72,.9,.05],[.82,.6,.03]]],seam:[.32,.2,.6]}]},
 'B36_camionnette':{wh:[[.2,.17],[.82,.17]],parts:[{c:'#f4f4f0',band:[.2,.3,'#f07d1a'],p:[[0,.2,.03],[0,.97,.07],[.7,.97,.08],[.86,.62,.1],[1,.5,.07],[1,.2,.03]],
   g:[[[.73,.64,.02],[.73,.9,.04],[.8,.9,.04],[.92,.64,.03]]],seam:[.7,.2,.97]}]},
 'B36_camion_bache':{wh:[[.1,.13],[.24,.13],[.38,.13],[.78,.13],[.92,.13]],parts:[{c:'#2a2d36',p:[[0,.14,.02],[0,.28,.02],[1,.28,.02],[1,.14,.02]]},
   {c:'#d9d4c4',band2:[.12,.22,'#c8252b'],p:[[0,.27,.04],[0,.98,.06],[.68,.98,.06],[.68,.27,.04]]},
   Object.assign(MJT_CAB('#c8252b',.7,1,.78),{})]},
 'B36_citerne':{wh:[[.1,.13],[.24,.13],[.38,.13],[.78,.13],[.92,.13]],parts:[{c:'#2a2d36',p:[[0,.14,.02],[0,.28,.02],[1,.28,.02],[1,.14,.02]]},
   {c:'#3a7bd8',tank:1,p:[[0,.3,.25],[0,.9,.25],[.68,.9,.25],[.68,.3,.25]]},MJT_CAB('#2d63c4',.7,1,.8)]},
 'B36_demenagement':{wh:[[.14,.14],[.28,.14],[.78,.14],[.92,.14]],parts:[{c:'#2a2d36',p:[[0,.14,.02],[0,.28,.02],[1,.14,.02]]},
   {c:'#3aa05a',p:[[0,.25,.04],[0,.98,.06],[.68,.98,.06],[.68,.25,.04]],seam:[.34,.25,.98]},MJT_CAB('#2f8f4a',.7,1,.74)]},
 'B36_tracteur_rouge':{rim:'#e8e8e8',wh:[[.3,.3],[.82,.18]],parts:[{c:'#c8252b',p:[[.52,.3,.03],[.52,.56,.05],[.9,.6,.08],[1,.5,.06],[1,.3,.03]]},
   {c:'#c8252b',p:[[.15,.3,.02],[.16,.96,.07],[.46,.98,.07],[.54,.55,.06],[.54,.3,.02]],g:[[[.2,.42,.02],[.21,.9,.05],[.43,.92,.05],[.49,.6,.03],[.49,.42,.02]]]},
   {c:'#222',p:[[.78,.58,.01],[.78,.92,.01],[.81,.92,.01],[.81,.58,.01]]}]},
 'B36_tracteur_vert':{rim:'#f1c40f',wh:[[.3,.3],[.82,.18]],parts:[{c:'#2f8a35',p:[[.52,.3,.03],[.52,.56,.05],[.9,.6,.08],[1,.5,.06],[1,.3,.03]]},
   {c:'#2f8a35',p:[[.15,.3,.02],[.16,.96,.07],[.46,.98,.07],[.54,.55,.06],[.54,.3,.02]],g:[[[.2,.42,.02],[.21,.9,.05],[.43,.92,.05],[.49,.6,.03],[.49,.42,.02]]]},
   {c:'#222',p:[[.78,.58,.01],[.78,.92,.01],[.81,.92,.01],[.81,.58,.01]]}]},
 'B36_pompiers':{wh:[[.15,.13],[.35,.13],[.82,.13]],parts:[{c:'#d02a25',band:[.45,.52,'#f4f4f4'],p:[[0,.22,.03],[0,.86,.05],[.68,.86,.05],[.68,.22,.03]],seam:[.2,.22,.86]},
   {c:'#9aa3b0',p:[[.04,.86,.02],[.04,.95,.02],[.6,.95,.02],[.6,.86,.02]]},MJT_CAB('#d02a25',.7,1,.8),{c:'#2f6bff',p:[[.78,.8,.02],[.78,.88,.02],[.95,.88,.02],[.95,.8,.02]]}]},
 'B36_deneigeuse':{wh:[[.12,.13],[.3,.13],[.7,.13]],parts:[{c:'#f08a1a',p:[[0,.3,.03],[0,.8,.04],[.56,.74,.05],[.56,.3,.03]],snow:1},MJT_CAB('#f08a1a',.56,.86,.92),
   {c:'#ffb300',p:[[.86,.18,.04],[.86,.7,.05],[1,.66,.06],[1,.12,.04]]}]}
};
function mjtPathV(g,C,pts,X,z,L,Hh,dir,f){
  const n=pts.length,P=pts.map(q=>[C.X(X+(q[0]-.5)*L*dir,z),C.Y(q[1]*Hh,z)]);
  g.beginPath();g.moveTo((P[n-1][0]+P[0][0])/2,(P[n-1][1]+P[0][1])/2);
  for(let i=0;i<n;i++){const nx=P[(i+1)%n];g.arcTo(P[i][0],P[i][1],(P[i][0]+nx[0])/2,(P[i][1]+nx[1])/2,Math.max(.5,pts[i][2]*Hh*C.ch*f))}
  g.closePath();
}
function mjtVeh(g,C,key,X,zc,dir,h,asp,t){
  const sp=MJT_VEH[key];if(!sp)return false;
  const Hh=h*.885,L=Hh*asp,d=Math.min(.5,L*.2),z0=zc-d/2,z1=zc+d/2,ch=C.ch,f0=C.zb/z0;
  const NS=8;
  // tranches du fond vers la face proche
  for(let i=NS;i>=1;i--){
    const zz=z0+(z1-z0)*i/NS,ff=C.zb/zz,k=.5+.3*(1-i/NS);
    for(const pt of sp.parts){mjtPathV(g,C,pt.p,X,zz,L,Hh,dir,ff);g.fillStyle=mjtRGB(pt.c,k+(i===1?.06:0));g.fill()}
  }
  // face proche
  const px=l=>C.X(X+(l-.5)*L*dir,z0),py=v=>C.Y(v*Hh,z0),sx=L*ch*f0,sy=Hh*ch*f0;
  for(const pt of sp.parts){
    mjtPathV(g,C,pt.p,X,z0,L,Hh,dir,f0);
    let ymin=1e9,ymax=-1e9;for(const q of pt.p){const y=py(q[1]);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y)}
    const gr=g.createLinearGradient(0,ymin,0,ymax);
    if(pt.tank){gr.addColorStop(0,mjtRGB(pt.c,1.45));gr.addColorStop(.3,mjtRGB(pt.c,1.1));gr.addColorStop(1,mjtRGB(pt.c,.55))}
    else{gr.addColorStop(0,mjtRGB(pt.c,1.22));gr.addColorStop(.45,mjtRGB(pt.c,1));gr.addColorStop(1,mjtRGB(pt.c,.7))}
    g.fillStyle=gr;g.fill();
    g.save();g.clip();
    const xa=px(0),xb=px(1),xl=Math.min(xa,xb),xr=Math.max(xa,xb);
    if(pt.band){g.fillStyle=pt.band[2];g.fillRect(xl,py(pt.band[1]),xr-xl,py(pt.band[0])-py(pt.band[1]))}
    if(pt.band2){g.fillStyle=pt.band2[2];const a=px(pt.band2[0]),b=px(pt.band2[1]);g.fillRect(Math.min(a,b),ymin,Math.abs(b-a),ymax-ymin)}
    if(pt.snow){g.fillStyle='#f4f8ff';g.fillRect(xl,ymin,xr-xl,(ymax-ymin)*.25)}
    if(pt.tank){g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=Math.max(1,sy*.02);for(const lx of[.15,.35,.55]){g.beginPath();g.moveTo(px(pt.p[0][0]+lx*.68),ymin);g.lineTo(px(pt.p[0][0]+lx*.68),ymax);g.stroke()}
      g.fillStyle='rgba(255,255,255,.35)';g.fillRect(xl,ymin+(ymax-ymin)*.12,xr-xl,(ymax-ymin)*.1)}
    if(pt.seam){g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=Math.max(1,sy*.012);g.beginPath();g.moveTo(px(pt.seam[0]),py(pt.seam[1]));g.lineTo(px(pt.seam[0]),py(pt.seam[2]));g.stroke()}
    // reflet le long de l'épaule
    g.fillStyle='rgba(255,255,255,.16)';g.fillRect(xl,ymin+(ymax-ymin)*.3,xr-xl,(ymax-ymin)*.05);
    g.restore();
    g.strokeStyle=mjtRGB(pt.c,.35);g.lineWidth=Math.max(1,sy*.015);mjtPathV(g,C,pt.p,X,z0,L,Hh,dir,f0);g.stroke();
    for(const gl of pt.g||[]){
      mjtPathV(g,C,gl,X,z0,L,Hh,dir,f0);
      let a=1e9,b=-1e9;for(const q of gl){const y=py(q[1]);a=Math.min(a,y);b=Math.max(b,y)}
      const gg=g.createLinearGradient(0,a,0,b);gg.addColorStop(0,'#9cc0e6');gg.addColorStop(.5,'#3c5578');gg.addColorStop(1,'#1f2d46');g.fillStyle=gg;g.fill();
      g.strokeStyle='rgba(20,30,50,.9)';g.lineWidth=Math.max(1,sy*.012);g.stroke();
    }
  }
  // phares et feux
  const front=dir>0?1:0,back=1-front,sg=dir>0?1:-1;
  g.fillStyle='#fff6c2';g.beginPath();g.ellipse(px(front-.03*sg),py(.36),sx*.022,sy*.045,0,0,6.283);g.fill();
  g.fillStyle='#e22a2a';g.beginPath();g.ellipse(px(back+.03*sg),py(.38),sx*.02,sy*.05,0,0,6.283);g.fill();
  // pare-chocs
  g.fillStyle='#9aa0aa';for(const e of[0,1]){const a=px(e),b=px(e?(dir>0?1.0:0):(dir>0?0:1.0));}
  g.fillStyle='#8d939e';const bx0=px(dir>0?.0:.97),bx1=px(dir>0?.03:1);g.fillRect(Math.min(bx0,bx1),py(.26),Math.abs(bx1-bx0),sy*.06);
  const fx0=px(dir>0?.97:0),fx1=px(dir>0?1:.03);g.fillRect(Math.min(fx0,fx1),py(.26),Math.abs(fx1-fx0),sy*.06);
  // roues
  const z=z0-.02;
  sp.wh.forEach(w=>{
    const r=w[1]*Hh,x=C.X(X+(w[0]-.5)*L*dir,z),y=C.Y(r,z),R=r*ch*f0;
    g.fillStyle='#0d0f14';g.beginPath();g.arc(x,y,R*1.1,0,6.283);g.fill();
    g.fillStyle='#1b1d23';g.beginPath();g.arc(x,y,R,0,6.283);g.fill();
    g.fillStyle=sp.rim||'#c8cdd6';g.beginPath();g.arc(x,y,R*.62,0,6.283);g.fill();
    g.strokeStyle='rgba(60,66,78,.8)';g.lineWidth=Math.max(1,R*.08);
    const a0=t*0*0+w[0]*7;for(let q=0;q<5;q++){const a=a0+q*1.2566;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*R*.6,y+Math.sin(a)*R*.6);g.stroke()}
    g.fillStyle='#4b505c';g.beginPath();g.arc(x,y,R*.16,0,6.283);g.fill();
  });
  // gyrophares
  if(key==='B36_pompiers'||key==='B36_deneigeuse'){
    const on=Math.floor(t*6)%2===0,pm=key==='B36_pompiers',lx=px(pm?.87:.7),ly=py(pm?.9:.97);
    const rr=ch*.14*f0,col=pm?(on?'80,150,255':'255,60,60'):'255,190,40',gr=g.createRadialGradient(lx,ly,0,lx,ly,rr*3);
    gr.addColorStop(0,'rgba('+col+',.9)');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(lx-rr*3,ly-rr*3,rr*6,rr*6)}
  return true;
}
