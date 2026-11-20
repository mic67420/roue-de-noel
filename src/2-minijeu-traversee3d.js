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
        g.fillStyle='rgba(20,30,70,.3)';g.beginPath();g.ellipse(x,yb,wpx*.46,ch*.1*f,0,0,6.283);g.fill();
        mjtSpr(g,o.key,x,yb+ch*.03*f,hgt,R.dir<0);
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
