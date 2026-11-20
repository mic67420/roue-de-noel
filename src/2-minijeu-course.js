/* ---- Mini-jeu : LA COURSE DU RENNE (v3.38) ----
   Comme le dinosaure de Chrome : le renne reste à la même place à l'écran, c'est le paysage qui défile.
   Un toucher = un saut identique. ADULTES (v3.42) : garder le doigt posé et le glisser vers le BAS = glissade à plat ventre
   (planche B33), pour passer sous les ponts, la passerelle, l'arche, la banderole, les branches, les oiseaux et le cerf-volant (planche B32).
   Obstacles au sol : sauter. Obstacles en l'air : glisser. Alix : saut seulement.
   Paysage : 6 décors (B24 à B29) raccordés en fondu dans un long panorama qui défile lentement (parallaxe),
   sol dessiné en code qui défile à la vitesse du jeu. 60 s. Adultes : 2 cœurs, vitesse croissante, obstacles aériens.
   Alix : 3 cœurs, vitesse lente et constante, obstacles bas seulement. Unités : H = 720 px ; vitesses en px/s. */
const MJR_G=2400,MJR_V0=1000,MJR_RX=.22,MJR_GY=.84,MJR_D=60;
// [clé, hauteur (en H), largeur/hauteur, hauteur du bas au-dessus du sol (air), hauteur de la boîte]
const MJR_SOL=[['B23_tas_petit',.075,2.713],['B23_tas_grand',.12,1.821],['B23_souche',.105,1.542],['B23_sapin',.17,0.764],['B23_sapins3',.16,1.221],['B23_rocher',.115,1.393],['B23_bonhomme',.19,0.768],['B23_guirlande',.12,2.351]];
const MJR_FACILE=[0,1,2,5];
MJR_SOL.push(['B32_tronc',.17,1.62]);MJR_SOL.push(['B3D_rocher',.12,1.4],['B3D_barriere',.13,2],['B3D_bonhomme',.2,.8],['B3D_souche',.11,1.3]);   // 9..12 : obstacles du sol en 3D (adultes)   // 8 : tronc sur des rochers (adultes)   // tas petit, tas grand, souche, rocher
// obstacles à passer EN GLISSANT : [image, hauteur (H), largeur/hauteur, bas libre (H), haut (H), x0, x1 (part de la largeur qui touche), volant]
// bas libre ≈ .155 H : le renne debout (.17 H) s'y cogne, le renne en glissade (.13 H) passe
const MJR_AIR=[['B3D_pont',.30,1,.155,.30,0,1,0],['B3D_passerelle',.30,1.13,.155,.30,0,1,0],['B3D_arche',.30,1,.155,.30,0,1,0],['B3D_portique',.30,1.27,.155,.30,0,1,0],
  ['B32_banderole',.31,1.13,.155,.30,.15,.88,0],['B32_branche_sapin',.37,1.37,.155,.36,.4,.98,0],
  ['B32_corbeau',.10,1.145,.155,.245,.15,.85,1],['B32_oie',.105,1.41,.155,.25,.15,.85,1],['B32_chouette',.11,1.57,.155,.255,.15,.85,1],['B32_cerf_volant',.2,1.02,.155,.34,.25,.85,1]];
const MJR_ASP={c:1.076,bas:1.554};
function mjrNew(easy){
  const o={D:MJR_D,notimer:false,t:0,done:null,ev:[],easy,asp:2,W:1080,H:720,d:0,v:easy?340:650,fy:0,vy:0,G:easy?1100:MJR_G,V0:easy?676:MJR_V0,hold:false,slideP:false,slideK:0,slide:false,tSlide:0,slideEnd:0,pd:false,pt:0,py0:0,swiped:false,jumped:false,jumpBuf:0,lives:6,max:6,inv:0,stun:0,pts:0,obs:[],next:900,tAnim:0,best:0,coup:0};
  mjrSpawn(o);return o;
}
function mjrVit(s){return s.easy?340:650+600*Math.min(1,s.t/s.D)}
function mjrSpawn(s){
  while(s.next<s.d+s.W+400){
    const v=mjrVit(s),gapBase=s.easy?v*(1.5+Math.random()*1.1):v*(.85+Math.random()*.7);
    if(s.t>s.D-5){s.next=s.d+s.W+4000;break}
    const air=!s.easy&&Math.random()<.45,H=s.H;
    if(air){const a=Math.random()<.6?MJR_AIR[Math.floor(Math.random()*4)]:MJR_AIR[4+Math.floor(Math.random()*(MJR_AIR.length-4))];s.obs.push({air:true,key:a[0],h:a[1],asp:a[2],yb:a[3],yt:a[4],x0:a[5],x1:a[6],fly:a[7],wx:s.next,hit:false,fl:Math.random()*6});s.next+=gapBase+a[1]*a[2]*H*.7}
    else{const lst=s.easy?MJR_FACILE:Math.random()<.65?[9,10,11,12]:[0,1,2,3,4,5,6,7,8],i=lst[Math.floor(Math.random()*lst.length)],a=MJR_SOL[i];
      s.obs.push({air:false,key:a[0],h:a[1]*(s.easy?.9:1),asp:a[2],wx:s.next,hit:false});s.next+=gapBase+a[1]*a[2]*H}
  }
}
function mjrJump(s,hold){
  if(s.done||s.fy>1)return false;
  s.vy=s.V0;s.hold=!!hold;s.slide=false;s.slideEnd=0;s.slideP=false;s.slideK=0;s.ev.push({k:'saut'});return true;
}
const mjrTapJump=s=>{if(s.done)return;if(s.fy>1)s.jumpBuf=.12;else mjrJump(s,false)};
function mjrDown(s,fx,fy){      // Alix : un toucher = saut tout de suite ; adultes : saut au relâchement (ou après .35 s), sauf si le doigt glisse vers le bas = glissade
  if(s.done)return;
  if(s.easy){mjrTapJump(s);return}
  s.pd=true;s.pt=0;s.py0=fy;s.swiped=false;s.jumped=false;
}
function mjrDrag(s,fx,fy){
  if(s.easy||s.done||!s.pd||s.swiped||s.jumped)return;
  if(fy-s.py0>.08){s.swiped=true;s.slideP=true}          // doigt posé puis glissé vers le bas
}
function mjrUp(s){
  if(!s.easy&&s.pd&&!s.swiped&&!s.jumped)mjrTapJump(s);
  s.pd=false;s.slideP=false;
}
function mjrSlide(s,on){s.slideP=!!on}                   // pour le robot de test
function mjrKey(s,k){
  if(k==='ArrowUp'||k===' '||k==='w')mjrTapJump(s);
  else if((k==='ArrowDown'||k==='s')&&!s.easy)s.slideK=.3;
}
function mjrBox(s,o,H){          // boîte de collision d'un obstacle, en px : [x0,x1,yBas,yHaut] (y vers le haut depuis le sol)
  const w=o.h*H*o.asp,sx=o.wx-s.d+s.W*MJR_RX;
  if(o.bonus)return[sx-w*.45,sx+w*.45,o.b*H,o.b*H+o.h*H];
  if(o.air)return[sx-w*.5+w*o.x0,sx-w*.5+w*o.x1,o.yb*H,o.yt*H];
  return[sx-w*.36,sx+w*.36,0,o.h*H*.82];
}
function mjrUpdate(s,dt){
  if(s.done)return;
  const H=s.H;
  s.t+=dt;s.inv=Math.max(0,s.inv-dt);s.stun=Math.max(0,s.stun-dt);s.coup=Math.max(0,s.coup-dt);s.tAnim+=dt;
      s.v=mjrVit(s);if(s.stun>0)s.v*=.55;
  s.d+=s.v*dt;
  // saut
  if(s.fy>0||s.vy>0){
    s.fy+=s.vy*dt;s.vy-=s.G*dt;
    if(s.fy<=0){s.fy=0;s.vy=0;s.ev.push({k:'pose'});if(s.jumpBuf>0){s.jumpBuf=0;mjrJump(s,false)}}
  }
  s.jumpBuf=Math.max(0,s.jumpBuf-dt);
  // maintien sans bouger : saut après .35 s ; glissade
  if(s.pd&&!s.swiped&&!s.jumped){s.pt+=dt;if(s.pt>.35){s.jumped=true;mjrTapJump(s)}}
  if(s.slideK>0)s.slideK-=dt;
  const veut=(s.slideP||s.slideK>0)&&!s.easy;
  if(s.fy<=1){
    if(veut&&!s.slide){s.slide=true;s.tSlide=0;s.slideEnd=0;s.ev.push({k:'glisse'})}
    else if(!veut&&s.slide){s.slide=false;s.slideEnd=.28}
  }
  if(s.slide)s.tSlide+=dt;
  if(s.slideEnd>0)s.slideEnd=Math.max(0,s.slideEnd-dt);
  // collisions
  const rx=s.W*MJR_RX,bas=s.fy<1&&(s.slide||s.slideEnd>0),rh=(bas?.13:.17)*H,rw=(s.easy?.05:bas?.11:.085)*H,ry0=s.fy,ry1=s.fy+rh;
  for(const o of s.obs){
    if(o.hit)continue;const b=mjrBox(s,o,H);
    if(b[1]<rx-rw||b[0]>rx+rw)continue;
    if(ry0<b[3]&&ry1>b[2]){
      o.hit=true;
      if(o.bonus){s.pts++;s.ev.push({k:'bonus'})}
      else if(s.inv<=0){s.lives--;s.inv=1.4;s.stun=.6;s.coup=.6;s.ev.push({k:'touche'});if(s.lives<=0){s.done='lose';return}}
    }
  }
  s.obs=s.obs.filter(o=>o.wx-s.d>-s.W*MJR_RX-400);
  mjrSpawn(s);
  if(s.t>=s.D)s.done='win';
}
/* ---- dessin ---- */
function mjrPano(){
  if(MJ.runPano)return MJ.runPano;
  const L=6*1280-5*200,c=document.createElement('canvas');c.width=L;c.height=720;const g=c.getContext('2d');
  for(let i=0;i<6;i++){
    const im=MJ.img['fond_run'+(i+1)];if(!im||!im.naturalWidth)continue;
    if(i===0){g.drawImage(im,0,0,1280,720);continue}
    const t=document.createElement('canvas');t.width=1280;t.height=720;const q=t.getContext('2d');
    q.drawImage(im,0,0,1280,720);q.globalCompositeOperation='destination-in';
    const gr=q.createLinearGradient(0,0,200,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');q.fillStyle=gr;q.fillRect(0,0,1280,720);
    g.drawImage(t,i*1080,0);
  }
  if(MJ.img.fond_run6&&MJ.img.fond_run6.naturalWidth)MJ.runPano=c;
  return c;
}

/* ---- décor 3D (v3.44-45) : petite projection en perspective maison, sans moteur 3D ----
   x = pixels écran (au plan du renne), y = hauteur au-dessus du sol (px), z = profondeur (px, + = vers nous). Le renne est en z = 0.
   Chaque structure a une partie « far » (dessinée AVANT le renne) et une partie « near » (APRÈS : il passe dessous). Textures : planche B34 (tex_*). */
function mjr3dP(W,H,gy,x,y,z){const cx=W/2,hor=gy-.5*H,f=1/(1-z/(H*1.2));return[cx+(x-cx)*f,hor+(gy-y-hor)*f]}
function mjr3dFace(g,H,pts,Lu,Lv,key,shade,ts){      // face texturée : pts[0]→pts[1] = axe u (Lu px), pts[0]→pts[3] = axe v (Lv px)
  g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();
  const im=MJ.img[key];
  if(im&&im.naturalWidth){
    MJ.pat=MJ.pat||{};const pt=MJ.pat[key]||(MJ.pat[key]=g.createPattern(im,'repeat')),k=(ts||.22)*H/256;
    if(pt&&pt.setTransform)pt.setTransform(new DOMMatrix([(pts[1][0]-pts[0][0])/Lu*k,(pts[1][1]-pts[0][1])/Lu*k,(pts[3][0]-pts[0][0])/Lv*k,(pts[3][1]-pts[0][1])/Lv*k,pts[0][0],pts[0][1]]));
    g.fillStyle=pt||'#999';
  }else g.fillStyle='#999';
  g.fill();
  if(shade){g.fillStyle='rgba(10,15,45,'+shade+')';g.fill()}
  g.lineWidth=Math.max(2,H*.005);g.strokeStyle='#2a2838';g.lineJoin='round';g.stroke();
}
// boîte texturée. o = {f,s,t : textures face avant / côté / dessus ; sh : ombrage ; ts : taille d'une tuile (part de H)}
function mjr3dBox(g,W,H,gy,x0,x1,y0,y1,z0,z1,o){
  const P=(x,y,z)=>mjr3dP(W,H,gy,x,y,z),cx=W/2,sh=o.sh||0,ts=o.ts;
  const sx=x0>cx?x0:x1<cx?x1:null;
  if(sx!==null)mjr3dFace(g,H,[P(sx,y1,z0),P(sx,y1,z1),P(sx,y0,z1),P(sx,y0,z0)],z1-z0,y1-y0,o.s||o.f,sh+.3,ts);
  mjr3dFace(g,H,[P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)],x1-x0,z1-z0,o.t||o.f,sh,ts);
  mjr3dFace(g,H,[P(x0,y1,z1),P(x1,y1,z1),P(x1,y0,z1),P(x0,y0,z1)],x1-x0,y1-y0,o.f,sh,ts);
}
const MJ3D={D:.10,p:.03};
function mjr3dOmbre(g,W,H,gy,sx,xw){const d=MJ3D.D*H,P=(x,y,z)=>mjr3dP(W,H,gy,x,y,z);
  g.beginPath();[P(sx-xw,0,-d),P(sx+xw,0,-d),P(sx+xw*1.1,0,d),P(sx-xw*1.1,0,d)].forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fillStyle='rgba(15,25,70,.3)';g.fill()}
const MJ3D_S={
 pont:{  // pont de pierre : mur de pierre au fond, tablier, rambardes, deux poteaux devant
  far(g,W,H,gy,sx){const d=MJ3D.D*H,p=MJ3D.p*H,xw=.15*H;mjr3dOmbre(g,W,H,gy,sx,xw);
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,0,.20*H,-d-p,-d+p,{f:'tex_pierre',t:'tex_poudre',sh:.35,ts:.26})},
  near(g,W,H,gy,sx){const d=MJ3D.D*H,xw=.15*H,cw=.035*H,t=.03*H,o={f:'tex_pierre',t:'tex_poudre',ts:.26};
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.155*H,.20*H,-d,d,o);
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.20*H,.30*H,-d,-d+t,o);
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+cw,0,.155*H,d-t,d,o);mjr3dBox(g,W,H,gy,sx+xw-cw,sx+xw,0,.155*H,d-t,d,o);
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.20*H,.30*H,d-t,d,o)}},
 passerelle:{ // passerelle en bois : poteaux, planches, cordes
  far(g,W,H,gy,sx){const d=MJ3D.D*H,xw=.17*H,pw=.03*H,q=.015*H,o={f:'tex_boisvieux',t:'tex_pin',ts:.2};mjr3dOmbre(g,W,H,gy,sx,xw);
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+pw,0,.30*H,-d-q,-d+q,o);mjr3dBox(g,W,H,gy,sx+xw-pw,sx+xw,0,.30*H,-d-q,-d+q,o);
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.205*H,.22*H,-d-.008*H,-d+.008*H,{f:'tex_corde',ts:.1});
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.26*H,.275*H,-d-.008*H,-d+.008*H,{f:'tex_corde',ts:.1})},
  near(g,W,H,gy,sx){const d=MJ3D.D*H,xw=.17*H,pw=.03*H,q=.015*H,o={f:'tex_boisvieux',t:'tex_pin',ts:.2};
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.155*H,.19*H,-d,d,{f:'tex_boisvieux',t:'tex_pin',ts:.16});
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+pw,0,.30*H,d-q,d+q,o);mjr3dBox(g,W,H,gy,sx+xw-pw,sx+xw,0,.30*H,d-q,d+q,o);
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.205*H,.22*H,d-.008*H,d+.008*H,{f:'tex_corde',ts:.1});
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.26*H,.275*H,d-.008*H,d+.008*H,{f:'tex_corde',ts:.1})}},
 arche:{ // bloc de glace avec stalactites
  far(g,W,H,gy,sx){const d=MJ3D.D*H,p=MJ3D.p*H,xw=.15*H;mjr3dOmbre(g,W,H,gy,sx,xw);
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,0,.20*H,-d-p,-d+p,{f:'tex_glace2',t:'tex_givre',sh:.25,ts:.26})},
  near(g,W,H,gy,sx,tm){const d=MJ3D.D*H,xw=.15*H,cw=.035*H,t=.03*H,P=(x,y,z)=>mjr3dP(W,H,gy,x,y,z);
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+cw,0,.155*H,d-t,d,{f:'tex_glace2',t:'tex_givre',ts:.26});mjr3dBox(g,W,H,gy,sx+xw-cw,sx+xw,0,.155*H,d-t,d,{f:'tex_glace2',t:'tex_givre',ts:.26});
    mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.155*H,.22*H,-d,d,{f:'tex_glace1',t:'tex_givre',ts:.26});
    mjr3dBox(g,W,H,gy,sx-xw+.01*H,sx+xw-.01*H,.22*H,.30*H,-d+.01*H,d-.01*H,{f:'tex_poudre',t:'tex_poudre',ts:.26});
    for(let i=0;i<7;i++){const x=sx-xw+(i+.5)*(2*xw/7),a=P(x-.014*H,.155*H,d),b=P(x+.014*H,.155*H,d),c=P(x,(.145-(i%3)*.004)*H,d);
      g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.closePath();g.fillStyle='#d7efff';g.fill();g.lineWidth=Math.max(2,H*.004);g.strokeStyle='#2a2838';g.stroke()}}},
 portique:{ // portique de Noël : poteaux en canne à sucre, guirlandes qui clignotent
  far(g,W,H,gy,sx,tm){const d=MJ3D.D*H,xw=.19*H,pw=.035*H,o={f:'tex_cane',t:'tex_cane',ts:.16};mjr3dOmbre(g,W,H,gy,sx,xw);
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+pw,0,.30*H,-d-pw/2,-d+pw/2,o);mjr3dBox(g,W,H,gy,sx+xw-pw,sx+xw,0,.30*H,-d-pw/2,-d+pw/2,o);
    mjr3dGuirlande(g,W,H,gy,sx-xw+pw/2,sx+xw-pw/2,-d,tm)},
  near(g,W,H,gy,sx,tm){const d=MJ3D.D*H,xw=.19*H,pw=.035*H,o={f:'tex_cane',t:'tex_cane',ts:.16};
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+pw,.26*H,.30*H,-d,d,o);mjr3dBox(g,W,H,gy,sx+xw-pw,sx+xw,.26*H,.30*H,-d,d,o);
    mjr3dGuirlande(g,W,H,gy,sx-xw+pw/2,sx+xw-pw/2,0,tm);
    mjr3dBox(g,W,H,gy,sx-xw,sx-xw+pw,0,.30*H,d-pw/2,d+pw/2,o);mjr3dBox(g,W,H,gy,sx+xw-pw,sx+xw,0,.30*H,d-pw/2,d+pw/2,o);
    mjr3dGuirlande(g,W,H,gy,sx-xw+pw/2,sx+xw-pw/2,d,tm)}},
 tronc:{ // tronc d'arbre posé sur deux pieux
  far(g,W,H,gy,sx){const d=MJ3D.D*H,w=.05*H,o={f:'tex_boisvieux',t:'tex_pin',ts:.18};mjr3dOmbre(g,W,H,gy,sx,.07*H);
    mjr3dBox(g,W,H,gy,sx-w,sx+w,0,.16*H,-d-w/2,-d+w/2,o);mjr3dBox(g,W,H,gy,sx-w*1.5,sx+w*1.5,0,.03*H,-d-w,-d+w,{f:'tex_poudre',ts:.2})},
  near(g,W,H,gy,sx){const d=MJ3D.D*H,w=.05*H,o={f:'tex_boisvieux',t:'tex_pin',ts:.18},P=(x,y,z)=>mjr3dP(W,H,gy,x,y,z),r=.065*H,yc=.22*H,z0=-d-.05*H,z1=d+.05*H;
    const a=P(sx,yc,z0),b=P(sx,yc,z1),fa=1/(1-z0/(H*1.2)),fb=1/(1-z1/(H*1.2)),ra=r*fa,rb=r*fb;
    g.beginPath();g.arc(a[0],a[1],ra,0,6.283);g.fillStyle='#4a3524';g.fill();
    g.beginPath();g.moveTo(a[0]-ra,a[1]);g.lineTo(a[0]+ra,a[1]);g.lineTo(b[0]+rb,b[1]);g.lineTo(b[0]-rb,b[1]);g.closePath();
    const im=MJ.img.tex_ecorce;
    if(im&&im.naturalWidth){MJ.pat=MJ.pat||{};const pt=MJ.pat.tex_ecorce||(MJ.pat.tex_ecorce=g.createPattern(im,'repeat')),k=.2*H/256;if(pt.setTransform)pt.setTransform(new DOMMatrix([k,0,0,k,a[0],a[1]]));g.fillStyle=pt}else g.fillStyle='#6b4a2e';
    g.fill();g.fillStyle='rgba(10,15,45,.18)';g.fill();g.lineWidth=Math.max(2,H*.005);g.strokeStyle='#2a2838';g.lineJoin='round';g.stroke();
    // dessus éclairé
    g.beginPath();g.moveTo(a[0]-ra*.5,a[1]-ra*.9);g.lineTo(a[0]+ra*.5,a[1]-ra*.9);g.lineTo(b[0]+rb*.5,b[1]-rb*.9);g.lineTo(b[0]-rb*.5,b[1]-rb*.9);g.closePath();g.fillStyle='rgba(255,255,255,.18)';g.fill();
    // bout coupé, face à nous : disque de bois clair avec cernes
    g.beginPath();g.arc(b[0],b[1],rb,0,6.283);g.fillStyle='#e0b985';g.fill();g.lineWidth=Math.max(2,H*.005);g.strokeStyle='#2a2838';g.stroke();
    g.strokeStyle='rgba(120,80,40,.7)';g.lineWidth=Math.max(1.5,H*.003);for(let k2=1;k2<4;k2++){g.beginPath();g.arc(b[0],b[1],rb*k2*.23,0,6.283);g.stroke()}
    mjr3dBox(g,W,H,gy,sx-w,sx+w,0,.16*H,d-w/2,d+w/2,o);mjr3dBox(g,W,H,gy,sx-w*1.5,sx+w*1.5,0,.03*H,d-w,d+w,{f:'tex_poudre',ts:.2})}}
};
/* obstacles du SOL en 3D (adultes) : G3[nom](g,W,H,gy,sx,tm) */
function mjr3dSph(g,x,y,r,H){const gr=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.65,'#dbe6fa');gr.addColorStop(1,'#9fb4dc');
  g.beginPath();g.arc(x,y,r,0,6.283);g.fillStyle=gr;g.fill();g.lineWidth=Math.max(2,H*.005);g.strokeStyle='#2a2838';g.stroke()}
const MJ3D_G={
 rocher(g,W,H,gy,sx){const o={f:'tex_rocher',s:'tex_rocher',t:'tex_poudre',ts:.2};
  mjr3dBox(g,W,H,gy,sx-.085*H,sx+.075*H,0,.07*H,-.04*H,.04*H,o);
  mjr3dBox(g,W,H,gy,sx-.06*H,sx+.03*H,.07*H,.12*H,-.03*H,.03*H,o)},
 barriere(g,W,H,gy,sx){const o={f:'tex_boisvieux',s:'tex_boisvieux',t:'tex_poudre',ts:.18},w=.011*H;
  for(const dx of[-.11,0,.11])mjr3dBox(g,W,H,gy,sx+dx*H-w,sx+dx*H+w,0,.13*H,-.01*H,.01*H,o);
  for(const y of[.04,.09])mjr3dBox(g,W,H,gy,sx-.115*H,sx+.115*H,y*H,(y+.022)*H,.012*H,.028*H,{f:'tex_pin',t:'tex_poudre',ts:.18})},
 souche(g,W,H,gy,sx){const r=.055*H,h=.1*H,ry=r*.38,im=MJ.img.tex_ecorce;
  g.beginPath();g.moveTo(sx-r,gy-h);g.lineTo(sx-r,gy);g.ellipse(sx,gy,r,ry,0,Math.PI,0,true);g.lineTo(sx+r,gy-h);g.closePath();
  if(im&&im.naturalWidth){MJ.pat=MJ.pat||{};const pt=MJ.pat.tex_ecorce||(MJ.pat.tex_ecorce=g.createPattern(im,'repeat')),k=.18*H/256;if(pt.setTransform)pt.setTransform(new DOMMatrix([k,0,0,k,sx-r,gy-h]));g.fillStyle=pt}else g.fillStyle='#6b4a2e';
  g.fill();g.fillStyle='rgba(10,15,45,.25)';g.fill();g.lineWidth=Math.max(2,H*.005);g.strokeStyle='#2a2838';g.lineJoin='round';g.stroke();
  g.beginPath();g.ellipse(sx,gy-h,r,ry,0,0,6.283);g.fillStyle='#e0b985';g.fill();g.stroke();
  g.strokeStyle='rgba(120,80,40,.7)';g.lineWidth=Math.max(1.5,H*.003);for(let k2=1;k2<3;k2++){g.beginPath();g.ellipse(sx,gy-h,r*k2*.3,ry*k2*.3,0,0,6.283);g.stroke()}
  g.beginPath();g.ellipse(sx-r*.1,gy-h-ry*.15,r*.7,ry*.62,0,0,6.283);g.fillStyle='#f4f8ff';g.fill();g.lineWidth=Math.max(2,H*.004);g.strokeStyle='#2a2838';g.stroke()},
 bonhomme(g,W,H,gy,sx){const r1=.058*H,r2=.043*H,r3=.032*H,y1=gy-r1,y2=gy-2*r1-r2*.6,y3=y2-r2-r3*.6;
  mjr3dSph(g,sx,y1,r1,H);mjr3dSph(g,sx,y2,r2,H);
  g.fillStyle='#d83a3a';g.lineWidth=Math.max(2,H*.004);g.strokeStyle='#2a2838';g.beginPath();g.rect(sx-r3*1.15,y3+r3*.75,r3*2.3,r3*.45);g.fill();g.stroke();   // écharpe
  mjr3dSph(g,sx,y3,r3,H);
  g.fillStyle='#17161f';for(const dx of[-.35,.35]){g.beginPath();g.arc(sx+dx*r3,y3-r3*.2,r3*.12,0,6.283);g.fill()}
  g.fillStyle='#ff8a1f';g.beginPath();g.moveTo(sx,y3-r3*.05);g.lineTo(sx+r3*.95,y3+r3*.12);g.lineTo(sx,y3+r3*.2);g.closePath();g.fill();g.stroke();       // nez
  g.fillStyle='#17161f';for(let i=0;i<3;i++){g.beginPath();g.arc(sx,y2-r2*.3+i*r2*.45,r2*.1,0,6.283);g.fill()}
  g.fillStyle='#22212e';g.beginPath();g.rect(sx-r3*1.1,y3-r3*1.02,r3*2.2,r3*.2);g.fill();g.stroke();g.beginPath();g.rect(sx-r3*.7,y3-r3*1.75,r3*1.4,r3*.8);g.fill();g.stroke()}   // chapeau
};
function mjr3dGuirlande(g,W,H,gy,xa,xb,z,tm){    // fil qui s'affaisse entre deux poteaux, ampoules colorées qui clignotent
  const P=(x,y,z2)=>mjr3dP(W,H,gy,x,y,z2),N=14,pts=[];
  for(let i=0;i<=N;i++){const u=i/N;pts.push(P(xa+(xb-xa)*u,(.26-.095*4*u*(1-u))*H,z))}
  g.beginPath();pts.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.lineWidth=Math.max(2,H*.005);g.strokeStyle='#17361f';g.lineJoin='round';g.stroke();
  const C=['#ff3b3b','#ffd23a','#3bd16f','#46a8ff'],f=1/(1-z/(H*1.2));
  for(let i=1;i<N;i++){const q=pts[i],on=.55+.45*Math.sin(tm*5+i*1.7),r=H*.011*f;
    g.globalAlpha=.3*on;g.fillStyle=C[i%4];g.beginPath();g.arc(q[0],q[1]+r,r*2.2,0,6.283);g.fill();
    g.globalAlpha=1;g.fillStyle=C[i%4];g.beginPath();g.arc(q[0],q[1]+r,r,0,6.283);g.fill();g.lineWidth=1.5;g.strokeStyle='#2a2838';g.stroke()}
}
function mjrSpr(g,key,cx,by,h,flip,alpha){
  const im=MJ.img[key];if(!im||!im.naturalWidth)return;
  const w=h*im.naturalWidth/im.naturalHeight;
  g.save();if(alpha!=null)g.globalAlpha=alpha;g.translate(cx,by);if(flip)g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);g.restore();
}
function mjrDraw(g,s,W,H,tm){
  s.W=W;s.H=H;s.asp=W/H;
  const gy=MJR_GY*H,rx=W*MJR_RX,im=MJ.img;
  // paysage lointain : défile lentement sur toute la durée
  const pano=mjrPano(),L=pano.width,bx=Math.max(0,Math.min(L-W,(L-W)*Math.min(1,s.t/s.D)));
  g.drawImage(pano,bx,0,Math.min(W,L),720,0,0,W,H);
  // sol : sentier de neige tassée qui défile à la vitesse du jeu
  const gr=g.createLinearGradient(0,gy-H*.07,0,H);gr.addColorStop(0,'rgba(215,228,250,0)');gr.addColorStop(.25,'rgba(222,233,252,.96)');gr.addColorStop(1,'rgba(184,201,232,1)');
  g.fillStyle=gr;g.fillRect(0,gy-H*.07,W,H-gy+H*.07);
  g.fillStyle='rgba(140,160,205,.35)';g.fillRect(0,gy+H*.012,W,H*.004);
  const off=s.d;
  for(let i=0;i<26;i++){                // cailloux de neige, ombres et traces, espacés irrégulièrement
    const sp=900+((i*137)%520),x=(((i*331.7-off*(.9+.25*(i%3)))%sp)+sp)%sp+Math.floor(i*37%W/sp)*sp*0,xx=((i*251.3+((-off*(i%3===0?1:.8+.1*(i%3))) ))%(W+200)+(W+200))%(W+200)-100;
    const yy=gy+H*(.03+((i*53)%9)*.012);g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(xx,yy,H*(.02+(i%4)*.01),H*.007,0,0,6.283);g.fill();
    g.fillStyle='rgba(120,140,190,.22)';g.beginPath();g.ellipse(xx+4,yy+H*.008,H*(.018+(i%4)*.008),H*.004,0,0,6.283);g.fill();
  }
  // obstacles
  const proches=[];
  for(const o of s.obs){
    const sx=o.wx-s.d+rx;if(sx<-H*.4||sx>W+H*.4)continue;
    const hp=o.h*H;
    if(o.bonus){const bob=Math.sin(tm*5+o.wx)*H*.01;mjrSpr(g,o.key,sx,gy-o.b*H-bob,hp,false,o.hit?0:1);continue}
    if(o.air&&o.key.indexOf('B3D_')===0){const S3=MJ3D_S[o.key.slice(4)];S3.far(g,W,H,gy,sx,tm);proches.push([S3,sx]);continue}
    if(o.air){
      if(o.fly){const bob=Math.sin(tm*4+o.fl)*H*.012,k=1-bob/H*2;g.fillStyle='rgba(15,25,70,.3)';g.beginPath();g.ellipse(sx,gy+H*.014,hp*o.asp*.34*k,H*.013*k,0,0,6.283);g.fill();g.fillStyle='rgba(15,25,70,.18)';g.beginPath();g.ellipse(sx,gy+H*.014,hp*o.asp*.5*k,H*.02*k,0,0,6.283);g.fill();
        mjrSpr(g,o.key,sx,gy-o.yb*H-bob,hp,false)}
      else{g.fillStyle='rgba(20,30,80,.2)';g.beginPath();g.ellipse(sx,gy+H*.01,hp*o.asp*.4,H*.013,0,0,6.283);g.fill();
        mjrSpr(g,o.key,sx,gy+H*.012,hp,false)}
      continue}
    g.fillStyle='rgba(20,30,80,.2)';g.beginPath();g.ellipse(sx,gy+H*.008,hp*o.asp*.45,H*.011,0,0,6.283);g.fill();
    if(o.key.indexOf('B3D_')===0){MJ3D_G[o.key.slice(4)](g,W,H,gy+H*.008,sx,tm);continue}
    mjrSpr(g,o.key,sx,gy+H*.01,hp,false);
  }
  // renne
  const sl=s.fy<1&&s.slide&&!s.coup,fin=s.fy<1&&!s.slide&&s.slideEnd>0&&!s.coup;
  let key='B22_renne_c1';
  if(s.done==='win')key='B22_renne_content';
  else if(s.coup>0)key='B22_renne_touche';
  else if(s.fy>1){key=s.vy>350?'B22_renne_saut1':s.vy<-350?'B22_renne_atterrit':'B22_renne_saut2'}
  else if(sl){const q=s.tSlide;key=q<.07?'B33_g_debut2':q<.15?'B33_g_debut3':['B33_g_plat1','B33_g_neige','B33_g_plat3','B33_g_neige'][Math.floor((q-.15)/.12)%4]}
  else if(fin){const e=.28-s.slideEnd;key=e<.09?'B33_g_sortie1':e<.18?'B33_g_sortie2':'B33_g_sortie3'}
  else key='B22_renne_c'+(1+Math.floor(s.tAnim*(9+s.v/110))%6);
  const sh=H*.2,blink=s.inv>0&&Math.floor(tm*14)%2===0?.45:1;
  g.fillStyle='rgba(20,30,80,.28)';g.beginPath();g.ellipse(rx,gy+H*.012,H*.11*(1-Math.min(.5,s.fy/H*1.4)),H*.014,0,0,6.283);g.fill();
  if(key.indexOf('B33_')===0){      // poses de glissade : même échelle que le galop (210 px = .2 H), calées sur le museau
    const ig=im[key];if(ig&&ig.naturalWidth){const k=sh/210,w=ig.naturalWidth*k,hh=ig.naturalHeight*k;g.save();g.globalAlpha=blink;g.drawImage(ig,rx+H*.108-w,gy+H*.012-hh,w,hh);g.restore()}
  }else mjrSpr(g,key,rx,gy+H*.012-s.fy,sh,false,blink);
  for(const q of proches)q[0].near(g,W,H,gy,q[1],tm);
  // neige qui tombe
  g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<40;i++){const x=(((i*83.7-tm*(60+i%4*20)+s.d*.05)%W)+W)%W,y=((i*57.3+tm*(40+i%5*14))%H);g.beginPath();g.arc(x,y,1.3+i%3*.8,0,6.283);g.fill()}
  const P1=s.easy?7:4.5,P2=s.easy?0:10;
  if(s.t<P2){
    const ph=(tm*1.6)%1,cx=W*.5,cy=H*.5,tap=s.t<P1,a=Math.min(1,(tap?P1-s.t:P2-s.t)/1);
    const titre=tap?'TAPOTE l\'écran !':'GLISSADE !',sous=tap?(s.easy?'un petit coup de doigt, sans balayer':'un petit coup de doigt = un saut'):'pose le doigt, puis glisse-le vers le BAS';
    g.save();g.globalAlpha=a;g.textAlign='center';g.lineJoin='round';
    g.font=`bold ${H*.07}px Georgia,serif`;g.lineWidth=7;g.strokeStyle='#1a2a60';g.strokeText(titre,cx,H*.3);g.fillStyle='#fff';g.fillText(titre,cx,H*.3);
    g.font=`bold ${H*.04}px Georgia,serif`;g.lineWidth=5;g.strokeText(sous,cx,H*.37);g.fillStyle='#ffe48a';g.fillText(sous,cx,H*.37);
    if(tap){
      for(let k=0;k<2;k++){const q=(ph+k*.5)%1;g.globalAlpha=a*(1-q)*.9;g.strokeStyle='#fff';g.lineWidth=6;g.beginPath();g.arc(cx,cy,H*(.04+.13*q),0,6.283);g.stroke()}
      g.globalAlpha=a;const dy=Math.sin(ph*6.283)>0?H*.015:0;g.font=`${H*.14}px sans-serif`;g.fillText('👆',cx,cy+H*.1+dy);
    }else{
      const q=ph<.75?ph/.75:1,y=cy-H*.04+H*.2*q;
      g.globalAlpha=a*.9;g.strokeStyle='#fff';g.lineWidth=6;g.beginPath();g.arc(cx,cy-H*.04,H*.05,0,6.283);g.stroke();
      g.lineWidth=9;g.setLineDash([H*.03,H*.025]);g.beginPath();g.moveTo(cx,cy);g.lineTo(cx,cy+H*.2);g.stroke();g.setLineDash([]);
      g.fillStyle='#fff';g.beginPath();g.moveTo(cx-H*.04,cy+H*.2);g.lineTo(cx+H*.04,cy+H*.2);g.lineTo(cx,cy+H*.26);g.closePath();g.fill();
      g.globalAlpha=a;g.font=`${H*.14}px sans-serif`;g.fillText('👆',cx,y+H*.1);
    }
    g.restore()}
}
function mjrHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';avDraw(g,p,24*u,46*u,40*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  const hs=36*u;for(let i=0;i<s.max;i++){const img=im[i<s.lives?'B11_coeur_plein':'B11_coeur_vide'];if(img&&img.naturalWidth)g.drawImage(img,256*u+i*(hs+4*u),20*u,hs,hs*img.naturalHeight/img.naturalWidth)}
  // progression du voyage
  const bx=W*.58,bw=W*.28,by=26*u,pr=Math.min(1,s.t/s.D);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  const r=im.B22_renne_c1;if(r&&r.naturalWidth){const h=36*u,x=bx+(bw-6*u)*pr;g.drawImage(r,x-10*u,by-12*u,h*r.naturalWidth/r.naturalHeight,h)}
}
function mjCourse(me){
  return mjRunner(me,{
    nouveau:mjrNew,maj:mjrUpdate,dessin:mjrDraw,hud:mjrHud,
    tap:mjrDown,drag:mjrDrag,up:mjrUp,clavier:(s,k)=>mjrKey(s,k),
    evenement:(e,s,fx,cv)=>{
      if(e.k==='saut'){AE.pops&&AE.pops(1,.2)}
      else if(e.k==='glisse'){AE.pops&&AE.pops(3,.12)}
      else if(e.k==='touche'){AE.nope&&AE.nope();AE.boom&&AE.boom();cv.style.transform='translate('+(Math.random()*14-7)+'px,'+(Math.random()*8-4)+'px)'}
      else if(e.k==='bonus'){AE.bells&&AE.bells()}
    },
    intro:PLAYERS[me].name==='Alix'?['La course du renne !','TAPOTE l\'écran (un petit coup de doigt, sans balayer) pour sauter !','Un toucher = un saut. Saute par-dessus les obstacles.']
      :['La course du renne !','TAPOTE l\'écran pour SAUTER par-dessus les obstacles au sol.','Pour GLISSER sous les ponts et les oiseaux : pose le doigt et glisse-le vers le BAS.']
  });
}
