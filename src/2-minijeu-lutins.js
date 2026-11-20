/* ---- Mini-jeu 3 : lutins farceurs (v3.24) ----
   Un canon à neige en bas de l'écran. Le joueur TOUCHE un lutin du doigt : une boule de neige part du canon.
   Adultes : 3 cœurs, chaque lutin qui s'échappe coûte un cœur, 12 touchés à faire. Alix : pas de cœur perdu, 6 à toucher, lutins gros et lents.
   Positions en fractions de l'écran (x : largeur, y : hauteur) ; tailles en fraction de la hauteur. */
const MJL_H=[{x:.07,y:.73,k:.85},{x:.23,y:.87,k:1.1},{x:.37,y:.67,k:.7},{x:.60,y:.71,k:.78},{x:.75,y:.89,k:1.1},{x:.91,y:.69,k:.82},{x:.47,y:.62,k:.6}],MJL_LANES=[.60,.69,.77];
function mjlNew(easy){
  return{D:easy?99999:30,t:0,done:null,ev:[],easy,asp:2,
    need:easy?20:30,notimer:easy,got:0,lives:3,max:3,
    el:[],balls:[],splash:[],tSp:.6,nSp:0,aim:-Math.PI/2,rec:0,
    // réglages
    gap0:easy?1.7:.58,gap1:easy?1.3:.36,cross:easy?5.2:2.4,peek:easy?2.8:1.15,size:easy?.36:.24,pad:easy?.07:.025,
    pRed:easy?0:.25,pGold:easy?.08:.08,pPeek:easy?.4:.4,pHop:easy?.2:.4};
}
function mjlSpawn(s){
  const r=Math.random();
  if(r<s.pPeek){ // lutin qui sort d'un trou
    const libres=MJL_H.map((x,i)=>i).filter(i=>!s.el.some(e=>e.kind==='peek'&&e.hole===i));
    if(libres.length){const h=libres[Math.floor(Math.random()*libres.length)];
      s.el.push({kind:'peek',hole:h,x:MJL_H[h].x,y:MJL_H[h].y,size:s.size*.95*MJL_H[h].k,age:0,ttl:s.peek*(.8+Math.random()*.4),gold:Math.random()<s.pGold,hit:false});return}
  }
  const dir=Math.random()<.5?1:-1,lane=Math.floor(Math.random()*3),red=Math.random()<s.pRed,gold=!red&&Math.random()<s.pGold;
  const sz=s.size*(.82+lane*.1)*(red?.95:1),sp=(1.2+.2)/(s.cross*(red?.62:1));
  s.el.push({kind:'run',x:dir>0?-.08:1.08,y:MJL_LANES[lane],dir,vx:dir*sp,size:sz,age:0,red,gold,hop:Math.random()<s.pHop,ph:Math.random()*6,hit:false});
}
function mjlTap(s,fx,fy){
  if(s.done)return;
  let best=null,bd=1e9;
  for(const e of s.el){
    if(e.hit||(e.kind==='peek'&&(e.age<.15||e.age>e.ttl-.05)))continue;
    const hop=e.kind==='run'&&e.hop?Math.abs(Math.sin(e.ph))*.08:0;
    const cy=e.y-e.size*.5-hop,cx=e.x;
    const dx=(fx-cx)*s.asp,dy=fy-cy,hw=e.size*.32+s.pad,hh=e.size*.55+s.pad;
    const d=(dx/hw)*(dx/hw)+(dy/hh)*(dy/hh);
    if(d<=1&&d<bd){bd=d;best=e}
  }
  s.aim=Math.atan2(fy-.93,(fx-.5)*s.asp);s.rec=1;
  if(best){best.hit=true;best.hitT=0;s.got+=best.gold?2:1;s.balls.push({x0:.5,y0:.93,x1:fx,y1:fy,t:0,dur:.16,hit:true});s.ev.push({k:best.gold?'dore':'touche',x:fx,y:fy})}
  else{s.balls.push({x0:.5,y0:.93,x1:fx,y1:fy,t:0,dur:.2,hit:false});s.ev.push({k:'rate'})}
}
function mjlUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;s.rec=Math.max(0,s.rec-dt*5);
  s.tSp-=dt;
  if(s.tSp<=0){mjlSpawn(s);const p=Math.min(1,s.t/s.D);s.tSp=(s.gap0+(s.gap1-s.gap0)*p)*(.75+Math.random()*.5)}
  for(const e of s.el){
    e.age+=dt;
    if(e.hit){e.hitT+=dt;continue}
    if(e.kind==='run'){e.x+=e.vx*dt;e.ph+=dt*(e.red?13:9);
      if((e.dir>0&&e.x>1.07)||(e.dir<0&&e.x<-.07)){e.gone=true;mjlFuite(s,e)}}
    else if(e.age>=e.ttl){e.gone=true;mjlFuite(s,e)}
  }
  s.el=s.el.filter(e=>!e.gone&&!(e.hit&&e.hitT>.8));
  for(const b of s.balls)b.t+=dt;
  for(const b of s.balls)if(!b.done&&b.t>=b.dur){b.done=true;s.splash.push({x:b.x1,y:b.y1,t:0,hit:b.hit})}
  s.balls=s.balls.filter(b=>!b.done);
  for(const p of s.splash)p.t+=dt;
  s.splash=s.splash.filter(p=>p.t<.45);
  if(s.got>=s.need){s.done='win';return}
  if(s.t>=s.D)s.done='temps';
}
function mjlFuite(s,e){
  s.ev.push({k:'fuite0'}); // plus de cœur perdu : un lutin échappé ne coûte rien
}
/* ---- dessin ---- */
function mjlFond(W,H,alt){
  const K=alt?'bgL2':'bgL';
  if(MJ[K]&&MJ[K].width===W)return MJ[K];
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  let gr=g.createLinearGradient(0,0,0,H*.6);gr.addColorStop(0,'#050a26');gr.addColorStop(.6,'#1d2d6e');gr.addColorStop(1,'#4a5fa8');g.fillStyle=gr;g.fillRect(0,0,W,H);
  // aurore boréale
  for(let k=0;k<3;k++){const ag=g.createLinearGradient(0,H*.05,0,H*.4);const col=['80,255,170','90,170,255','200,120,255'][k];ag.addColorStop(0,'rgba('+col+',0)');ag.addColorStop(.5,'rgba('+col+',.16)');ag.addColorStop(1,'rgba('+col+',0)');g.fillStyle=ag;g.beginPath();g.moveTo(0,H*.2);for(let x=0;x<=W;x+=20)g.lineTo(x,H*(.14+k*.05+.06*Math.sin(x/W*(4+k)+k*2)));for(let x=W;x>=0;x-=20)g.lineTo(x,H*(.34+k*.04+.05*Math.sin(x/W*(3+k)+k)));g.fill()}
  g.fillStyle='#fff';for(let i=0;i<110;i++){g.globalAlpha=.3+.7*((i*37)%10)/10;g.beginPath();g.arc((i*197.3)%W,(i*71.9)%(H*.5),.7+(i%3)*.6,0,6.283);g.fill()}
  g.globalAlpha=1;g.fillStyle='#f4f1d8';g.beginPath();g.arc(W*.84,H*.2,H*.06,0,6.283);g.fill();g.fillStyle='rgba(244,241,216,.15)';g.beginPath();g.arc(W*.84,H*.2,H*.11,0,6.283);g.fill();
  // montagnes lointaines puis collines
  g.fillStyle='#6d80c0';g.beginPath();g.moveTo(0,H*.55);for(let x=0;x<=W;x+=16)g.lineTo(x,H*(.40+.07*Math.abs(Math.sin(x/W*5+.5))+.03*Math.sin(x/W*23)));g.lineTo(W,H*.6);g.lineTo(0,H*.6);g.fill();
  g.fillStyle='#fff';g.globalAlpha=.55;for(let x=0;x<W;x+=16){const y=H*(.40+.07*Math.abs(Math.sin(x/W*5+.5))+.03*Math.sin(x/W*23));if(y<H*.44){g.fillRect(x,y,16,H*.012)}}g.globalAlpha=1;
  g.fillStyle='#8da2da';g.beginPath();g.moveTo(0,H*.62);for(let x=0;x<=W;x+=20)g.lineTo(x,H*(.52+.05*Math.sin(x/W*7+1)+.03*Math.sin(x/W*17)));g.lineTo(W,H*.64);g.lineTo(0,H*.64);g.fill();
  // sapins enneigés
  const sapin=(x,y,h)=>{g.fillStyle='#143626';for(let i=0;i<4;i++){const w=h*(.16+i*.07),yy=y-h+i*h*.24;g.beginPath();g.moveTo(x,yy);g.lineTo(x+w,yy+h*.3);g.lineTo(x-w,yy+h*.3);g.fill();g.fillStyle='#e8f0ff';g.beginPath();g.moveTo(x,yy);g.lineTo(x+w*.62,yy+h*.19);g.lineTo(x-w*.62,yy+h*.19);g.fill();g.fillStyle='#143626'}};
  for(let i=0;i<16;i++)sapin((i+.5)*W/16+((i*53)%20),H*.60,H*(.1+(i%3)*.03));
  // chalet éclairé
  const cx=W*.16,cy=H*.60,cw=H*.2;g.fillStyle='#3a2316';g.fillRect(cx,cy-cw*.55,cw,cw*.55);g.fillStyle='#e9f0ff';g.beginPath();g.moveTo(cx-cw*.1,cy-cw*.5);g.lineTo(cx+cw*.5,cy-cw*.95);g.lineTo(cx+cw*1.1,cy-cw*.5);g.fill();g.fillStyle='#6b2a1c';g.beginPath();g.moveTo(cx-cw*.03,cy-cw*.52);g.lineTo(cx+cw*.5,cy-cw*.9);g.lineTo(cx+cw*1.03,cy-cw*.52);g.fill();
  g.fillStyle='#ffd36a';g.shadowColor='#ffb830';g.shadowBlur=18;g.fillRect(cx+cw*.14,cy-cw*.4,cw*.26,cw*.24);g.fillRect(cx+cw*.62,cy-cw*.4,cw*.26,cw*.24);g.shadowBlur=0;g.fillStyle='#24140c';g.fillRect(cx+cw*.43,cy-cw*.3,cw*.14,cw*.3);
  g.fillStyle='#8a6a40';g.fillRect(cx+cw*.78,cy-cw*1.1,cw*.12,cw*.3);g.fillStyle='#e9f0ff';g.fillRect(cx+cw*.76,cy-cw*1.13,cw*.16,cw*.05);
  // sol de neige
  gr=g.createLinearGradient(0,H*.58,0,H);gr.addColorStop(0,'#eef4ff');gr.addColorStop(.5,'#d3e0f7');gr.addColorStop(1,'#a3b8e4');g.fillStyle=gr;
  g.beginPath();g.moveTo(0,H*.6);for(let x=0;x<=W;x+=20)g.lineTo(x,H*(.6+.012*Math.sin(x/W*9)));g.lineTo(W,H);g.lineTo(0,H);g.fill();
  // bosses de neige et ondulations douces
  g.fillStyle='rgba(120,145,205,.18)';for(let i=0;i<9;i++){g.beginPath();g.ellipse(((i*313)%W),H*(.68+(i%4)*.07),W*.09,H*.018,0,0,6.283);g.fill()}
  // barrière
  g.fillStyle='#6b4a2a';for(let x=W*.34;x<W*.5;x+=H*.05){g.fillRect(x,H*.585,H*.012,H*.05)}g.fillRect(W*.34,H*.6,W*.16,H*.01);g.fillRect(W*.34,H*.62,W*.16,H*.01);g.fillStyle='#fff';for(let x=W*.34;x<W*.5;x+=H*.05)g.fillRect(x-1,H*.583,H*.014,H*.01);
  // bonhomme de neige (absent du décor de construction)
  if(!alt){const bx=W*.88,by=H*.64;g.fillStyle='#fff';g.strokeStyle='#9bb0dd';g.lineWidth=2;for(const [dy,r] of [[0,H*.045],[-H*.07,H*.035],[-H*.125,H*.026]]){g.beginPath();g.arc(bx,by+dy,r,0,6.283);g.fill();g.stroke()}
  g.fillStyle='#e8892b';g.beginPath();g.moveTo(bx,by-H*.125);g.lineTo(bx+H*.05,by-H*.115);g.lineTo(bx,by-H*.108);g.fill();g.fillStyle='#222';g.fillRect(bx-H*.02,by-H*.17,H*.04,H*.025);g.fillRect(bx-H*.03,by-H*.148,H*.06,H*.007)}
  // lanternes guirlande
  g.strokeStyle='#2a1a10';g.lineWidth=2;g.beginPath();g.moveTo(0,H*.42);for(let x=0;x<=W;x+=10)g.lineTo(x,H*(.42+.03*Math.abs(Math.sin(x/W*Math.PI*5))));g.stroke();
  const cols=['#ff4a4a','#ffd23a','#4adf7a','#4aa8ff'];for(let i=0;i<30;i++){const x=(i+.5)*W/30,y=H*(.42+.03*Math.abs(Math.sin(x/W*Math.PI*5)))+4;g.fillStyle=cols[i%4];g.shadowColor=cols[i%4];g.shadowBlur=10;g.beginPath();g.arc(x,y+5,5,0,6.283);g.fill()}g.shadowBlur=0;
  MJ[K]=c;return c;
}
function mjlSpr(g,im,cx,by,h,flip,rot,a){ // dessine une image centrée en x, posée en y (bas), hauteur h
  if(!im||!im.naturalWidth)return;const w=h*im.naturalWidth/im.naturalHeight;
  g.save();if(a!=null)g.globalAlpha=a;g.translate(cx,by);if(rot)g.rotate(rot);if(flip)g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);g.restore();
}
function mjlDraw(g,s,W,H,tm){
  const im=MJ.img;s.asp=W/H;
  g.drawImage(mjlFond(W,H),0,0);
  // trous vides (ou lutin qui sort)
  const ordre=s.el.slice().sort((a,b)=>a.y-b.y);
  for(const o of MJL_H){
    if(!s.el.some(e=>e.kind==='peek'&&e.x===o.x&&!e.hit))mjlSpr(g,im.B4_trou_neige,o.x*W,o.y*H+H*.01,H*.085*o.k);
  }
  for(const e of ordre){
    const x=e.x*W,y=e.y*H,h=e.size*H;
    if(e.kind==='peek'){
      const up=Math.min(1,e.age/.22),down=Math.max(0,Math.min(1,(e.ttl-e.age)/.2)),k=e.hit?1:Math.min(up,down),ek=1-Math.pow(1-k,3);
      if(e.hit){mjlSpr(g,im.B4_lutin_touche,x,y-e.hitT*H*.35+Math.pow(e.hitT,2)*H*.9,h*.95,false,e.hitT*4,Math.max(0,1-e.hitT/.8));mjlEtoiles(g,x,y-h*.7,e.hitT,H);continue}
      g.save();g.beginPath();g.rect(x-W,y-H,W*2,H+H*.012);g.clip();
      mjlSpr(g,im.B4_lutin_sort,x,y+(1-ek)*h*.9,h*.95);g.restore();continue;
    }
    // coureur
    const hop=e.hop?Math.abs(Math.sin(e.ph))*H*.08:0,bob=e.hop?0:Math.abs(Math.sin(e.ph))*H*.012;
    // ombre
    g.fillStyle='rgba(30,45,90,.3)';g.beginPath();g.ellipse(x,y+H*.004,h*.2*(1-hop/H*3),h*.045,0,0,6.283);g.fill();
    const spr=e.gold?im.B4_lutin_dore:e.red?im.B4_lutin_rouge:(Math.floor(e.ph/9)%2?im.B3_lutin:im.B4_lutin_debout);
    if(e.hit){mjlSpr(g,im.B4_lutin_touche,x,y-hop-e.hitT*H*.3+Math.pow(e.hitT,2)*H*.9,h,e.dir<0,e.hitT*5*e.dir,Math.max(0,1-e.hitT/.8));mjlEtoiles(g,x,y-h*.8,e.hitT,H);continue}
    mjlSpr(g,spr,x,y-hop-bob,h,e.dir<0,Math.sin(e.ph)*.07);
    if(e.gold){g.save();g.globalAlpha=.6+.4*Math.sin(tm*10);g.fillStyle='#fff6b0';for(let i=0;i<3;i++){const a=tm*3+i*2.1;g.beginPath();g.arc(x+Math.cos(a)*h*.35,y-hop-h*.55+Math.sin(a)*h*.4,H*.007,0,6.283);g.fill()}g.restore()}
  }
  // boules de neige en vol
  for(const b of s.balls){const k=b.t/b.dur,x=(b.x0+(b.x1-b.x0)*k)*W,y=(b.y0+(b.y1-b.y0)*k)*H-Math.sin(k*3.14)*H*.04,r=H*(.07-.035*k);
    const bi=im.B3_boule_neige;if(bi&&bi.naturalWidth)g.drawImage(bi,x-r/2,y-r/2,r,r);else{g.fillStyle='#fff';g.beginPath();g.arc(x,y,r/3,0,6.283);g.fill()}}
  // éclaboussures
  for(const p of s.splash){const k=p.t/.45,r=H*(.1+.1*k),si=im.B3_eclaboussure_neige;if(si&&si.naturalWidth){g.globalAlpha=1-k;g.drawImage(si,p.x*W-r/2*1.3,p.y*H-r/2,r*1.3,r*si.naturalHeight/si.naturalWidth*1.3);g.globalAlpha=1}}
  // canon
  mjlCanon(g,s,W,H,tm);
  // tas de neige devant
  mjlSpr(g,im.B3_tas_neige,W*.06,H*1.02,H*.2);mjlSpr(g,im.B3_tas_neige,W*.94,H*1.02,H*.2,true);
}
function mjlEtoiles(g,x,y,t,H){g.save();g.fillStyle='#ffe066';g.globalAlpha=Math.max(0,1-t/.7);for(let i=0;i<4;i++){const a=t*6+i*1.57,r=H*(.03+t*.05);g.beginPath();g.arc(x+Math.cos(a)*r*2,y+Math.sin(a)*r,H*.012,0,6.283);g.fill()}g.restore()}
function mjlRoue(g,x,y,r,u){ // roue de canon en bois cerclée de fer, vue de face légèrement tournée
  g.save();g.translate(x,y);g.scale(.5,1);
  g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(6*u,r*.9,r*1.05,r*.22,0,0,6.283);g.fill();
  g.fillStyle='#2b2f36';g.beginPath();g.arc(0,0,r,0,6.283);g.fill();
  let gr=g.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r);gr.addColorStop(0,'#a9743c');gr.addColorStop(1,'#5a3515');g.fillStyle=gr;g.beginPath();g.arc(0,0,r*.88,0,6.283);g.fill();
  g.strokeStyle='#3a2210';g.lineWidth=5*u;for(let i=0;i<8;i++){const an=i*Math.PI/4;g.beginPath();g.moveTo(Math.cos(an)*r*.22,Math.sin(an)*r*.22);g.lineTo(Math.cos(an)*r*.84,Math.sin(an)*r*.84);g.stroke()}
  g.strokeStyle='#6f4a26';g.lineWidth=2*u;g.beginPath();g.arc(0,0,r*.55,0,6.283);g.stroke();
  g.strokeStyle='#14161a';g.lineWidth=7*u;g.beginPath();g.arc(0,0,r*.95,0,6.283);g.stroke();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2*u;g.beginPath();g.arc(0,0,r*.95,3.5,4.6);g.stroke();
  gr=g.createRadialGradient(-3*u,-3*u,1,0,0,r*.24);gr.addColorStop(0,'#f2d38a');gr.addColorStop(1,'#7a5a1e');g.fillStyle=gr;g.beginPath();g.arc(0,0,r*.22,0,6.283);g.fill();
  g.restore();
}
function mjlCanon(g,s,W,H,tm){
  const cx=W*.5,cy=H*.93,u=H/720,a=Math.max(-Math.PI+.4,Math.min(-.4,s.aim)),rec=s.rec*16*u;
  g.save();g.translate(cx,cy);
  // ombre au sol
  g.fillStyle='rgba(25,40,90,.38)';g.beginPath();g.ellipse(0,46*u,118*u,19*u,0,0,6.283);g.fill();
  // affût en bois renforcé de fer
  let gr=g.createLinearGradient(-60*u,0,60*u,0);gr.addColorStop(0,'#4d2c12');gr.addColorStop(.35,'#9a6330');gr.addColorStop(.6,'#7a4a20');gr.addColorStop(1,'#3d210c');
  g.fillStyle=gr;g.beginPath();g.moveTo(-62*u,44*u);g.lineTo(-44*u,-10*u);g.lineTo(44*u,-10*u);g.lineTo(62*u,44*u);g.closePath();g.fill();
  g.strokeStyle='#2a1608';g.lineWidth=3*u;g.stroke();
  g.strokeStyle='rgba(255,220,160,.18)';g.lineWidth=2*u;for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(i*17*u,-8*u);g.lineTo(i*21*u,42*u);g.stroke()}
  g.fillStyle='#20242b';g.fillRect(-60*u,22*u,120*u,9*u);g.fillRect(-52*u,-6*u,104*u,7*u);
  g.fillStyle='#9aa4b4';for(const x of[-52,-26,0,26,52]){g.beginPath();g.arc(x*u,26.5*u,2.6*u,0,6.283);g.fill()}
  // roues
  mjlRoue(g,-76*u,28*u,40*u,u);mjlRoue(g,76*u,28*u,40*u,u);
  // tourillons (supports du canon)
  g.fillStyle='#1c2027';g.beginPath();g.arc(0,-6*u,26*u,0,6.283);g.fill();
  gr=g.createRadialGradient(-8*u,-14*u,2,0,-6*u,26*u);gr.addColorStop(0,'#d9dfe8');gr.addColorStop(.5,'#7d8796');gr.addColorStop(1,'#2d333d');g.fillStyle=gr;g.beginPath();g.arc(0,-6*u,22*u,0,6.283);g.fill();
  // tube orientable
  g.save();g.translate(0,-6*u);g.rotate(a+Math.PI/2);g.translate(0,rec);
  const L=150*u,wr=22*u,wf=31*u; // largeur culasse -> bouche
  // culasse arrondie
  gr=g.createRadialGradient(-6*u,6*u,2,0,8*u,wr);gr.addColorStop(0,'#c8d0dc');gr.addColorStop(1,'#3a414d');g.fillStyle=gr;g.beginPath();g.arc(0,10*u,wr*.95,0,6.283);g.fill();
  g.fillStyle='#262b33';g.beginPath();g.arc(0,20*u,8*u,0,6.283);g.fill();
  // corps du tube conique, dégradé métal sombre/clair
  gr=g.createLinearGradient(-wf,0,wf,0);gr.addColorStop(0,'#272d36');gr.addColorStop(.22,'#6e7a8c');gr.addColorStop(.4,'#d6dde8');gr.addColorStop(.55,'#8e9aab');gr.addColorStop(1,'#1f242c');
  g.fillStyle=gr;g.beginPath();g.moveTo(-wr,6*u);g.lineTo(-wf,-L);g.lineTo(wf,-L);g.lineTo(wr,6*u);g.closePath();g.fill();
  // anneaux de renfort en laiton
  const ring=(y,w,h)=>{const g2=g.createLinearGradient(-w,0,w,0);g2.addColorStop(0,'#6d4a10');g2.addColorStop(.35,'#f6d681');g2.addColorStop(.6,'#b8862a');g2.addColorStop(1,'#573a0a');g.fillStyle=g2;g.fillRect(-w,y,2*w,h);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(-w,y+h,2*w,2*u)};
  ring(-18*u,wr+2*u+ (18/L)*(wf-wr),9*u);ring(-L*.52,wr+(L*.52/L)*(wf-wr)+2*u,8*u);
  // bouche évasée
  const gm=g.createLinearGradient(-wf-6*u,0,wf+6*u,0);gm.addColorStop(0,'#3a2c10');gm.addColorStop(.35,'#ffe9a0');gm.addColorStop(.6,'#c8952f');gm.addColorStop(1,'#4a3410');
  g.fillStyle=gm;g.beginPath();g.moveTo(-wf,-L+4*u);g.lineTo(-wf-8*u,-L-14*u);g.lineTo(wf+8*u,-L-14*u);g.lineTo(wf,-L+4*u);g.fill();
  g.fillStyle='#0c0f14';g.beginPath();g.ellipse(0,-L-14*u,wf+4*u,8*u,0,0,6.283);g.fill();
  gr=g.createRadialGradient(0,-L-14*u,2,0,-L-14*u,wf);gr.addColorStop(0,'#000');gr.addColorStop(1,'#222a35');g.fillStyle=gr;g.beginPath();g.ellipse(0,-L-14*u,wf-3*u,6*u,0,0,6.283);g.fill();
  // reflet et neige déposée sur le tube
  g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=3*u;g.beginPath();g.moveTo(-wr*.35,0);g.lineTo(-wf*.35,-L+8*u);g.stroke();
  g.fillStyle='#f4f8ff';g.beginPath();g.ellipse(8*u,-L*.3,10*u,4*u,0,0,6.283);g.fill();g.beginPath();g.ellipse(-12*u,-L*.74,8*u,3*u,.2,0,6.283);g.fill();
  // fumée de neige à la bouche juste après le tir
  if(s.rec>.15){g.fillStyle='rgba(255,255,255,'+s.rec*.8+')';for(let i=0;i<5;i++){g.beginPath();g.arc((i-2)*12*u,-L-26*u-(1-s.rec)*40*u-(i%2)*8*u,(10+s.rec*8)*u,0,6.283);g.fill()}}
  g.restore();
  g.restore();
}
function mjlHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';avDraw(g,p,24*u,46*u,40*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
    const bx=W*.58,bw=W*.28,by=22*u,pr=Math.min(1,s.got/s.need);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  const lu=im.B4_lutin_dore;if(lu&&lu.naturalWidth)g.drawImage(lu,bx+bw-10*u,by-18*u,40*u,40*u*lu.naturalHeight/lu.naturalWidth);
  g.fillStyle='#fff';g.font=`bold ${30*u}px Georgia,serif`;g.textAlign='right';g.fillText(s.got+' / '+s.need,bx-14*u,by+11*u);
}
function mjLutins(me){
  return mjRunner(me,{
    nouveau:mjlNew,maj:mjlUpdate,dessin:mjlDraw,hud:mjlHud,
    tap:(s,fx,fy)=>mjlTap(s,fx,fy),
    evenement:(e,s,fx,cv)=>{
      if(e.k==='touche'){AE.pops&&AE.pops(3,.6);fx.push({t:0,x:e.x,y:e.y})}
      else if(e.k==='dore'){AE.bells&&AE.bells();AE.pops&&AE.pops(6,.7);fx.push({t:0,x:e.x,y:e.y})}
      else if(e.k==='rate'){AE.pops&&AE.pops(1,.25)}
      else if(e.k==='fuite'){AE.nope&&AE.nope();cv.style.transform='translate('+(Math.random()*14-7)+'px,'+(Math.random()*8-4)+'px)'}
    },
    intro:['Tire sur les lutins !','Touche vite les lutins : le canon leur lance','une boule de neige !']
  });
}
