/* ---- Mini-jeu : LA COURSE DU RENNE (v3.38) ----
   Comme le dinosaure de Chrome : le renne reste à la même place à l'écran, c'est le paysage qui défile.
   Un toucher = un saut identique. ADULTES (v3.42) : garder le doigt posé et le glisser vers le BAS = glissade à plat ventre
   (planche B33), pour passer sous les ponts, la passerelle, l'arche, la banderole, les branches, les oiseaux et le cerf-volant (planche B32).
   Obstacles au sol : sauter. Obstacles en l'air : glisser. Alix : saut seulement.
   Paysage : 6 décors (B24 à B29) raccordés en fondu dans un long panorama qui défile lentement (parallaxe),
   sol dessiné en code qui défile à la vitesse du jeu. 45 s. Adultes : 2 cœurs, vitesse croissante, obstacles aériens.
   Alix : 3 cœurs, vitesse lente et constante, obstacles bas seulement. Unités : H = 720 px ; vitesses en px/s. */
const MJR_G=2400,MJR_V0=1000,MJR_RX=.22,MJR_GY=.84,MJR_D=45;
// [clé, hauteur (en H), largeur/hauteur, hauteur du bas au-dessus du sol (air), hauteur de la boîte]
const MJR_SOL=[['B23_tas_petit',.075,2.713],['B23_tas_grand',.12,1.821],['B23_souche',.105,1.542],['B23_sapin',.17,0.764],['B23_sapins3',.16,1.221],['B23_rocher',.115,1.393],['B23_bonhomme',.19,0.768],['B23_guirlande',.12,2.351]];
const MJR_FACILE=[0,1,2,5];
MJR_SOL.push(['B32_tronc',.17,1.62]);   // 8 : tronc sur des rochers (adultes)   // tas petit, tas grand, souche, rocher
// obstacles à passer EN GLISSANT : [image, hauteur (H), largeur/hauteur, bas libre (H), haut (H), x0, x1 (part de la largeur qui touche), volant]
// bas libre ≈ .155 H : le renne debout (.17 H) s'y cogne, le renne en glissade (.13 H) passe
const MJR_AIR=[['B3D_pont',.30,1,.155,.28,0,1,0],['B32_passerelle',.41,1.31,.156,.40,.12,.9,0],['B32_arche_glace',.345,1.32,.155,.335,.18,.85,0],
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
    if(air){const a=Math.random()<.5?MJR_AIR[0]:MJR_AIR[Math.floor(Math.random()*MJR_AIR.length)];s.obs.push({air:true,key:a[0],h:a[1],asp:a[2],yb:a[3],yt:a[4],x0:a[5],x1:a[6],fly:a[7],wx:s.next,hit:false,fl:Math.random()*6});s.next+=gapBase+a[1]*a[2]*H*.7}
    else{const lst=s.easy?MJR_FACILE:[0,1,2,3,4,5,6,7,8],i=lst[Math.floor(Math.random()*lst.length)],a=MJR_SOL[i];
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

/* ---- décor 3D (v3.44) : petite projection en perspective maison, sans moteur 3D ----
   x = pixels écran (au plan du renne), y = hauteur au-dessus du sol (px), z = profondeur (px, + = vers nous). Le renne est en z = 0. */
function mjr3dP(W,H,gy,x,y,z){const cx=W/2,hor=gy-.5*H,f=1/(1-z/(H*1.2));return[cx+(x-cx)*f,hor+(gy-y-hor)*f]}
function mjr3dPoly(g,pts,fill,lw){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill();if(lw){g.lineWidth=lw;g.strokeStyle='#2a2838';g.stroke()}}
function mjr3dBox(g,W,H,gy,x0,x1,y0,y1,z0,z1,dark){
  const P=(x,y,z)=>mjr3dP(W,H,gy,x,y,z),cx=W/2,lw=Math.max(2,H*.006);g.lineJoin='round';
  const cF=dark?'#6f7690':'#a3a9bb',cS=dark?'#5a6078':'#7e849a',cT=dark?'#dfe8f6':'#f0f5fd';
  const sx=x0>cx?x0:x1<cx?x1:null;
  if(sx!==null)mjr3dPoly(g,[P(sx,y0,z0),P(sx,y0,z1),P(sx,y1,z1),P(sx,y1,z0)],cS,lw);
  mjr3dPoly(g,[P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1)],cT,lw);
  const a=P(x0,y1,z1),b=P(x1,y0,z1);
  mjr3dPoly(g,[P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)],cF,lw);
  // joints de pierre
  g.save();g.beginPath();g.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]);g.clip();g.strokeStyle='rgba(30,30,50,.4)';g.lineWidth=1.5;
  const rh=H*.03,n=Math.max(1,Math.round((b[1]-a[1])/rh)),hh=(b[1]-a[1])/n;
  g.beginPath();for(let i=1;i<n;i++){g.moveTo(a[0],a[1]+i*hh);g.lineTo(b[0],a[1]+i*hh)}
  for(let i=0;i<n;i++){const st=(i%2)*H*.04;for(let x=a[0]+st+H*.04;x<b[0];x+=H*.08){g.moveTo(x,a[1]+i*hh);g.lineTo(x,a[1]+(i+1)*hh)}}
  g.stroke();g.restore();
}
const MJ3D={D:.10,p:.03,xw:.15};
function mjr3dFar(g,W,H,gy,sx){          // ce qui est DERRIÈRE le renne : ombre au sol et mur du fond
  const P=(x,y,z)=>mjr3dP(W,H,gy,x,y,z),d=MJ3D.D*H,p=MJ3D.p*H,xw=MJ3D.xw*H;
  mjr3dPoly(g,[P(sx-xw,0,-d),P(sx+xw,0,-d),P(sx+xw*1.1,0,d),P(sx-xw*1.1,0,d)],'rgba(15,25,70,.3)',0);
  mjr3dBox(g,W,H,gy,sx-xw,sx+xw,0,.20*H,-d-p,-d+p,true);
}
function mjr3dNear(g,W,H,gy,sx){         // ce qui est DEVANT le renne : tablier, poteaux, rambardes
  const d=MJ3D.D*H,xw=MJ3D.xw*H,cw=.035*H,t=.03*H;
  mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.155*H,.20*H,-d,d,false);
  mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.20*H,.28*H,-d,-d+t,false);
  mjr3dBox(g,W,H,gy,sx-xw,sx-xw+cw,0,.155*H,d-t,d,false);
  mjr3dBox(g,W,H,gy,sx+xw-cw,sx+xw,0,.155*H,d-t,d,false);
  mjr3dBox(g,W,H,gy,sx-xw,sx+xw,.20*H,.28*H,d-t,d,false);
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
    if(o.key==='B3D_pont'){mjr3dFar(g,W,H,gy,sx);proches.push(sx);continue}
    if(o.air){
      if(o.fly){const bob=Math.sin(tm*4+o.fl)*H*.012;g.fillStyle='rgba(20,30,80,.14)';g.beginPath();g.ellipse(sx,gy+H*.012,hp*o.asp*.3,H*.01,0,0,6.283);g.fill();
        mjrSpr(g,o.key,sx,gy-o.yb*H-bob,hp,false)}
      else{g.fillStyle='rgba(20,30,80,.2)';g.beginPath();g.ellipse(sx,gy+H*.01,hp*o.asp*.4,H*.013,0,0,6.283);g.fill();
        mjrSpr(g,o.key,sx,gy+H*.012,hp,false)}
      continue}
    g.fillStyle='rgba(20,30,80,.2)';g.beginPath();g.ellipse(sx,gy+H*.008,hp*o.asp*.45,H*.011,0,0,6.283);g.fill();
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
  for(const x of proches)mjr3dNear(g,W,H,gy,x);
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
