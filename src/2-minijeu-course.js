/* ---- Mini-jeu : LA COURSE DU RENNE (v3.38) ----
   Comme le dinosaure de Chrome : le renne reste à la même place à l'écran, c'est le paysage qui défile.
   Toucher le haut de l'écran = sauter (garder le doigt = saut plus haut). Garder le doigt dans le tiers du bas = se baisser.
   Obstacles au sol : sauter. Obstacles en l'air (branche, corbeau) : se baisser. Cadeaux dorés = bonus.
   Paysage : 6 décors (B24 à B29) raccordés en fondu dans un long panorama qui défile lentement (parallaxe),
   sol dessiné en code qui défile à la vitesse du jeu. 45 s. Adultes : 2 cœurs, vitesse croissante, obstacles aériens.
   Alix : 3 cœurs, vitesse lente et constante, obstacles bas seulement. Unités : H = 720 px ; vitesses en px/s. */
const MJR_G=2400,MJR_V0=1000,MJR_RX=.22,MJR_GY=.84,MJR_D=45;
// [clé, hauteur (en H), largeur/hauteur, hauteur du bas au-dessus du sol (air), hauteur de la boîte]
const MJR_SOL=[['B23_tas_petit',.075,2.713],['B23_tas_grand',.12,1.821],['B23_souche',.105,1.542],['B23_sapin',.17,0.764],['B23_sapins3',.16,1.221],['B23_rocher',.115,1.393],['B23_bonhomme',.19,0.768],['B23_guirlande',.12,2.351]];
const MJR_FACILE=[0,1,2,5];   // tas petit, tas grand, souche, rocher
const MJR_AIR=[['B23_branche',.27,1.523,.06,.13,.32],['B23_corbeau1',.09,1.086,.125,.12,.205],['B23_corbeau2',.09,1.415,.125,.12,.205]];
const MJR_ASP={c:1.076,bas:1.554};
function mjrNew(easy){
  const o={D:MJR_D,notimer:false,t:0,done:null,ev:[],easy,asp:2,W:1080,H:720,d:0,v:easy?340:470,fy:0,vy:0,hold:false,duck:false,duckT:0,jumpBuf:0,lives:easy?3:2,max:easy?3:2,inv:0,stun:0,pts:0,obs:[],next:900,tAnim:0,best:0,coup:0};
  mjrSpawn(o);return o;
}
function mjrVit(s){return s.easy?340:470+300*Math.min(1,s.t/s.D)}
function mjrSpawn(s){
  while(s.next<s.d+s.W+400){
    const v=mjrVit(s)*(s.easy?1:1.15),gapBase=s.easy?v*(1.5+Math.random()*1.1):v*(.95+Math.random()*.85);
    if(s.t>s.D-5){s.next=s.d+s.W+4000;break}
    const air=!s.easy&&Math.random()<.35,H=s.H;
    if(air){const a=MJR_AIR[Math.random()<.5?0:1+Math.floor(Math.random()*2)];s.obs.push({air:true,key:a[0],h:a[1],asp:a[2],b:a[3],hb:a[4],ht:a[5],wx:s.next,hit:false,fl:Math.random()*6});s.next+=gapBase+H*.35}
    else{const lst=s.easy?MJR_FACILE:[0,1,2,3,4,5,6,7],i=lst[Math.floor(Math.random()*lst.length)],a=MJR_SOL[i];
      s.obs.push({air:false,key:a[0],h:a[1]*(s.easy?.9:1),asp:a[2],wx:s.next,hit:false});s.next+=gapBase+a[1]*a[2]*H}
    if(Math.random()<.4){const hh=.1+Math.random()*.22;s.obs.push({bonus:true,key:'B23_cadeau_or',h:.075,asp:.99,b:hh,wx:s.next-gapBase*.5,hit:false})}
  }
}
function mjrJump(s,hold){
  if(s.done||s.fy>1)return false;
  s.vy=MJR_V0;s.hold=!!hold;s.ev.push({k:'saut'});return true;
}
function mjrDown(s,fx,fy){
  if(s.done)return;
  if(!s.easy&&fy>.62){s.duck=true;return}
  s.hold=true;
  if(s.fy>1)s.jumpBuf=.12;else mjrJump(s,true);
}
function mjrUp(s){
  s.hold=false;s.duck=false;
  if(!s.easy&&s.vy>200)s.vy*=.45;     // relâcher tôt = petit saut
}
function mjrKey(s,k){
  if(k==='ArrowUp'||k===' '||k==='w'){if(s.fy>1)s.jumpBuf=.12;else mjrJump(s,true);s.holdT=.3}
  else if(k==='ArrowDown'||k==='s'){if(!s.easy)s.duckT=.45}
}
function mjrBox(s,o,H){          // boîte de collision d'un obstacle, en px : [x0,x1,yBas,yHaut] (y vers le haut depuis le sol)
  const w=o.h*H*o.asp,sx=o.wx-s.d+s.W*MJR_RX;
  if(o.bonus)return[sx-w*.45,sx+w*.45,o.b*H,o.b*H+o.h*H];
  if(o.air)return[sx-w*.42,sx+w*.42,o.hb*H,o.ht*H];
  return[sx-w*.36,sx+w*.36,0,o.h*H*.82];
}
function mjrUpdate(s,dt){
  if(s.done)return;
  const H=s.H;
  s.t+=dt;s.inv=Math.max(0,s.inv-dt);s.stun=Math.max(0,s.stun-dt);s.coup=Math.max(0,s.coup-dt);s.tAnim+=dt;
  if(s.holdT>0){s.holdT-=dt;if(s.holdT<=0)mjrUp(s)}
  if(s.duckT>0){s.duckT-=dt;s.duck=s.duckT>0}
  s.v=mjrVit(s);if(s.stun>0)s.v*=.55;
  s.d+=s.v*dt;
  // saut
  if(s.fy>0||s.vy>0){
    s.fy+=s.vy*dt;s.vy-=MJR_G*(s.hold&&s.vy>0?.6:1.15)*dt;
    if(s.fy<=0){s.fy=0;s.vy=0;s.ev.push({k:'pose'});if(s.jumpBuf>0){s.jumpBuf=0;mjrJump(s,s.hold)}}
  }
  s.jumpBuf=Math.max(0,s.jumpBuf-dt);
  // collisions
  const rx=s.W*MJR_RX,rh=(s.duck&&s.fy<1?.09:.17)*H,rw=.085*H,ry0=s.fy,ry1=s.fy+rh;
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
  for(const o of s.obs){
    const sx=o.wx-s.d+rx;if(sx<-H*.4||sx>W+H*.4)continue;
    const hp=o.h*H;
    if(o.bonus){const bob=Math.sin(tm*5+o.wx)*H*.01;mjrSpr(g,o.key,sx,gy-o.b*H-bob,hp,false,o.hit?0:1);continue}
    if(o.air){g.fillStyle='rgba(20,30,80,.18)';g.beginPath();g.ellipse(sx,gy+H*.01,hp*o.asp*.3,H*.012,0,0,6.283);g.fill();
      const fl=o.key.indexOf('corbeau')>=0?(Math.floor(tm*8+o.fl)%2?'B23_corbeau1':'B23_corbeau2'):o.key;
      mjrSpr(g,fl,sx,gy-o.b*H,hp,false);continue}
    g.fillStyle='rgba(20,30,80,.2)';g.beginPath();g.ellipse(sx,gy+H*.008,hp*o.asp*.45,H*.011,0,0,6.283);g.fill();
    mjrSpr(g,o.key,sx,gy+H*.01,hp,false);
  }
  // renne
  const bas=s.duck&&s.fy<1&&!s.coup;
  let key='B22_renne_c1';
  if(s.done==='win')key='B22_renne_content';
  else if(s.coup>0)key='B22_renne_touche';
  else if(s.fy>1){key=s.vy>350?'B22_renne_saut1':s.vy<-350?'B22_renne_atterrit':'B22_renne_saut2'}
  else if(bas)key='B22_renne_bas';
  else key='B22_renne_c'+(1+Math.floor(s.tAnim*(9+s.v/110))%6);
  const rh=H*.2,sh=H*.2*(bas?.7:1),blink=s.inv>0&&Math.floor(tm*14)%2===0?.45:1;
  g.fillStyle='rgba(20,30,80,.28)';g.beginPath();g.ellipse(rx,gy+H*.012,H*.11*(1-Math.min(.5,s.fy/H*1.4)),H*.014,0,0,6.283);g.fill();
  mjrSpr(g,key,rx,gy+H*.012-s.fy,sh,false,blink);
  // neige qui tombe
  g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<40;i++){const x=(((i*83.7-tm*(60+i%4*20)+s.d*.05)%W)+W)%W,y=((i*57.3+tm*(40+i%5*14))%H);g.beginPath();g.arc(x,y,1.3+i%3*.8,0,6.283);g.fill()}
  if(s.t<6){g.save();g.globalAlpha=.75+.25*Math.sin(tm*5);g.textAlign='center';g.font=`bold ${H*.045}px Georgia,serif`;g.lineWidth=5;g.strokeStyle='#1a2a60';const m=s.easy?'Touche l\'écran pour sauter !':'Touche en haut = sauter · garde le doigt en bas = se baisser';g.strokeText(m,W*.5,H*.33);g.fillStyle='#fff';g.fillText(m,W*.5,H*.33);g.restore()}
}
function mjrHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.fillText(p.av,26*u,46*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  const hs=50*u;for(let i=0;i<s.max;i++){const img=im[i<s.lives?'B11_coeur_plein':'B11_coeur_vide'];if(img&&img.naturalWidth)g.drawImage(img,260*u+i*(hs+6*u),16*u,hs,hs*img.naturalHeight/img.naturalWidth)}
  // cadeaux dorés ramassés
  const k=im.B23_cadeau_or;g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,86*u,150*u,50*u,25*u);g.fill();
  if(k&&k.naturalWidth)g.drawImage(k,24*u,92*u,36*u,36*u*k.naturalHeight/k.naturalWidth);
  g.fillStyle='#ffe48a';g.font=`bold ${30*u}px Georgia,serif`;g.fillText('× '+s.pts,72*u,112*u);
  // progression du voyage
  const bx=W*.58,bw=W*.28,by=26*u,pr=Math.min(1,s.t/s.D);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  const r=im.B22_renne_c1;if(r&&r.naturalWidth){const h=36*u,x=bx+(bw-6*u)*pr;g.drawImage(r,x-10*u,by-12*u,h*r.naturalWidth/r.naturalHeight,h)}
}
function mjCourse(me){
  return mjRunner(me,{
    nouveau:mjrNew,maj:mjrUpdate,dessin:mjrDraw,hud:mjrHud,
    tap:mjrDown,up:mjrUp,clavier:(s,k)=>mjrKey(s,k),
    evenement:(e,s,fx,cv)=>{
      if(e.k==='saut'){AE.pops&&AE.pops(1,.2)}
      else if(e.k==='touche'){AE.nope&&AE.nope();AE.boom&&AE.boom();cv.style.transform='translate('+(Math.random()*14-7)+'px,'+(Math.random()*8-4)+'px)'}
      else if(e.k==='bonus'){AE.bells&&AE.bells()}
    },
    intro:['La course du renne !','Touche en haut de l\'écran pour sauter.','Garde le doigt en bas pour te baisser sous les branches et les corbeaux !']
  });
}
