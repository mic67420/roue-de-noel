/* ---- Mini-jeu : LA CATAPULTE À BOULES DE NEIGE (v3.35) ----
   Vue de côté. Catapulte en bas à gauche, grand sapin décoré à droite avec des cadeaux suspendus à ses branches.
   Le joueur maintient le doigt : une jauge de puissance monte et descend, glisser le doigt vers le haut/bas règle l'angle ; il lâche : la boule part en cloche.
   Une boule qui touche un cadeau le décroche : il tombe dans la neige. Une boule ne touche qu'un seul cadeau.
   Adultes : 60 s, 9 boules, cadeaux petits qui se balancent, il faut en décrocher 5 sur 7, trajectoire en pointillés courte.
   Alix : sans chrono, boules à volonté, 5 gros cadeaux presque immobiles, trajectoire complète visible, il faut tous les décrocher.
   Coordonnées : hauteur H = 720 px, largeur W variable. g = gravité en px/s². */
const MJK_G=1100,MJK_K=7.6,MJK_R=150;
const MJK_ANC=[[.31,-.17,'B21_cadeau_rouge'],[.34,.19,'B21_cadeau_bleu'],[.49,-.29,'B21_cadeau_vert'],[.50,.05,'B21_cadeau_or'],[.52,.30,'B21_cadeau_raye'],[.70,-.35,'B21_cadeau_pois'],[.71,.24,'B21_cadeau_rouge']];
function mjkGeo(W,H){
  const th=H*.72,tw=th*180/267,tx=W*.8,gy=H*.9;
  const cs=H*.30,cw=cs*245/235,cx=W*.16;
  return{th,tw,tx,gy,tyTop:gy-th,cs,cw,cx,Lx:cx-cw*.5+cw*.20,Ly:gy-cs+cs*.09};
}
function mjkNew(easy){
  const G=mjkGeo(1080,720),n=easy?5:7,idx=[0,1,2,3,4,5,6].sort((a,b)=>easy?(Math.abs(MJK_ANC[a][1])-Math.abs(MJK_ANC[b][1])):Math.random()-.5).slice(0,n);
  const gifts=idx.map((i,k)=>{const a=MJK_ANC[i];return{ax:a[1]+(Math.random()-.5)*.04,ay:a[0]+(Math.random()-.5)*.03,key:a[2],amp:easy?.05:.10+Math.random()*.08,w:easy?1.4+Math.random()*.4:2.0+Math.random()*1.4,ph:Math.random()*6.28,
    sz:easy?.19:.115,st:'on',x:0,y:0,vx:0,vy:0,rot:0,vr:0,fl:0}});
  return{D:easy?99999:60,notimer:easy,t:0,done:null,ev:[],easy,asp:2,gifts,need:easy?5:5,got:0,balls:easy?999:9,ball:null,pull:null,fx:[],tirT:0,mood:0,moodT:0,endT:-1,wind:0,W:1080,H:720};
}
// position d'un cadeau accroché au temps t (balancement prévisible) ; renvoie le centre du cadeau et l'angle
function mjkPos(s,g,t,W,H){
  const G=mjkGeo(W,H),th=g.amp*Math.sin(g.w*t+g.ph),L=G.th*.02+G.th*g.sz*.62,ax=G.tx+g.ax*G.tw,ay=G.tyTop+g.ay*G.th;
  return{x:ax+Math.sin(th)*L,y:ay+Math.cos(th)*L,th,ax,ay,L,r:G.th*g.sz*(s.easy?.42:.30)};
}
function mjkLance(s,vx,vy){
  if(s.done||s.ball||s.balls<=0)return false;
  const G=mjkGeo(s.W,s.H);
  s.ball={x:G.Lx,y:G.Ly,vx,vy,rot:0,t:0};s.balls--;s.tirT=.3;s.ev.push({k:'tir'});return true;
}
function mjkTir(s,dx,dy){    // (dx,dy) = déplacement « lance-pierre » en px ; la boule part à l'opposé (utilisé par les tests)
  let m=Math.hypot(dx,dy);if(m<18)return false;if(m>MJK_R){dx*=MJK_R/m;dy*=MJK_R/m}
  return mjkLance(s,-dx*MJK_K,-dy*MJK_K);
}
// jauge : va et vient entre 0 et 1 pendant que le doigt est posé ; l'angle se règle en glissant le doigt vers le haut / le bas
function mjkPuiss(s,t){const per=s.easy?2.6:1.5,u=(t/per)%2;return u<1?u:2-u}
function mjkVit(ang,pw){const v=MJK_K*MJK_R*Math.max(.12,pw);return[Math.cos(ang)*v,-Math.sin(ang)*v]}
function mjkGift(s,g,hit,W,H){
  g.st='fall';const p=mjkPos(s,g,s.t,W,H);g.x=p.x;g.y=p.y;g.vx=hit.vx*.35+60;g.vy=hit.vy*.3-160;g.vr=(Math.random()-.3)*7;g.rot=p.th;g.fl=0;s.got++;
  s.fx.push({k:'puff',x:hit.x,y:hit.y,t:0});s.ev.push({k:'touche'});s.mood=1;s.moodT=1.2;
}
function mjkUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;s.tirT=Math.max(0,s.tirT-dt);s.moodT=Math.max(0,s.moodT-dt);if(s.moodT<=0)s.mood=0;
  const W=s.W,H=s.H,G=mjkGeo(W,H);
  if(s.pull){s.pull.t+=dt;s.pull.pw=mjkPuiss(s,s.pull.t)}
  const b=s.ball;
  if(b){
    for(let i=0;i<2;i++){
      const h=dt/2;b.vy+=MJK_G*h;b.x+=b.vx*h;b.y+=b.vy*h;b.rot+=h*6;
      let hit=false;
      for(const g of s.gifts){if(g.st!=='on')continue;const p=mjkPos(s,g,s.t,W,H);if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+H*.022){mjkGift(s,g,b,W,H);hit=true;s.fx.push({k:'eclat',x:b.x,y:b.y,t:0});break}}
      if(hit){s.ball=null;break}
      if(b.y>G.gy-H*.02){s.fx.push({k:'splash',x:b.x,y:G.gy+H*.005,t:0});s.ev.push({k:'rate'});s.mood=-1;s.moodT=1;s.ball=null;break}
      if(b.x>W+60||b.x<-80){s.ball=null;s.ev.push({k:'rate'});break}
    }
  }
  for(const g of s.gifts)if(g.st==='fall'){
    g.vy+=1500*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;g.rot+=g.vr*dt;
    const gy=G.gy+H*.02+(g.fl*0);
    if(g.y>gy-H*.04){g.y=gy-H*.04;if(Math.abs(g.vy)>260&&g.fl<2){g.vy*=-.32;g.vx*=.5;g.vr*=.5;g.fl++;s.fx.push({k:'splash',x:g.x,y:gy,t:0,petit:true})}else{g.vy=0;g.vx=0;g.vr=0;g.st='sol'}}
  }
  for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<.7);
  if(s.got>=s.need&&s.endT<0)s.endT=s.gifts.every(g=>g.st!=='fall')?.6:1.2;
  if(s.endT>=0){s.endT-=dt;if(s.endT<=0)s.done='win';return}
  if(!s.ball&&s.balls<=0&&s.gifts.every(g=>g.st!=='fall'))s.done='lose';
  if(!s.done&&s.t>=s.D)s.done='temps';
}
function mjkDown(s,fx,fy,W,H){if(s.ball||s.balls<=0)return;s.pull={y0:fy*H,a0:.8,ang:.8,t:0,pw:0}}
function mjkDrag(s,fx,fy,W,H){const p=s.pull;if(!p)return;p.ang=Math.max(.2,Math.min(1.35,p.a0+(p.y0-fy*H)/H*2.4))}
function mjkUp(s){const p=s.pull;s.pull=null;if(p&&p.t>.08){const v=mjkVit(p.ang,p.pw);mjkLance(s,v[0],v[1])}}
/* ---- dessin ---- */
function mjkFond(g,W,H){
  const im=MJ.img.fond_catapulte;if(!im||!im.naturalWidth){g.fillStyle='#24306a';g.fillRect(0,0,W,H);g.fillStyle='#e8eeff';g.fillRect(0,H*.72,W,H);return}
  const k=Math.max(W/im.naturalWidth,H/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k;
  g.drawImage(im,(W-w)/2,H-h,w,h);
}
function mjkTraj(s,G,W,H){
  const p=s.pull;if(!p||p.t<.05)return[];
  const v=mjkVit(p.ang,p.pw),vx=v[0],vy=v[1],pts=[],n=s.easy?40:6,dt=s.easy?.055:.07;
  for(let i=1;i<=n;i++){const t=i*dt,x=G.Lx+vx*t,y=G.Ly+vy*t+.5*MJK_G*t*t;if(y>G.gy||x>W)break;pts.push([x,y,i])}
  return pts;
}
function mjkDraw(g,s,W,H,tm){
  s.W=W;s.H=H;s.asp=W/H;
  const G=mjkGeo(W,H),im=MJ.img;
  mjkFond(g,W,H);
  // sol : léger dégradé pour asseoir les objets
  const sw=Math.sin(tm*.9)*.006;
  // sapin
  const tr=im.B21_sapin_deco;
  g.save();g.translate(G.tx,G.gy);g.rotate(sw);g.fillStyle='rgba(30,40,90,.25)';g.beginPath();g.ellipse(0,0,G.tw*.5,H*.018,0,0,6.283);g.fill();
  if(tr&&tr.naturalWidth)g.drawImage(tr,-G.tw/2,-G.th,G.tw,G.th);g.restore();
  // cadeaux accrochés (par-dessus le sapin) et tombés
  for(const gf of s.gifts){
    const k=im[gf.key];if(!k||!k.naturalWidth)continue;const hh=G.th*gf.sz,ww=hh*k.naturalWidth/k.naturalHeight;
    if(gf.st==='on'){const p=mjkPos(s,gf,s.t,W,H);g.save();g.translate(p.ax,p.ay);g.rotate(-p.th);g.drawImage(k,-ww/2,-hh*.04,ww,hh);g.restore()}
    else{g.save();g.translate(gf.x,gf.y);g.rotate(gf.rot);g.drawImage(k,-ww/2,-hh*.5,ww,hh);g.restore()}
  }
  // catapulte
  const cata=im[s.tirT>0?'B20_cata_tir':'B20_cata_repos'];
  g.fillStyle='rgba(30,40,90,.25)';g.beginPath();g.ellipse(G.cx,G.gy,G.cw*.55,H*.016,0,0,6.283);g.fill();
  if(cata&&cata.naturalWidth)g.drawImage(cata,G.cx-G.cw/2,G.gy-G.cs,G.cw,G.cs);
  const pan=im.B20_panier;if(pan&&pan.naturalWidth){const ph=G.cs*.55;g.drawImage(pan,G.cx-G.cw*.5-ph*pan.naturalWidth/pan.naturalHeight-8,G.gy-ph,ph*pan.naturalWidth/pan.naturalHeight,ph)}
  const el=im[s.mood>0?'B20_lutin_pouce':s.mood<0?'B20_lutin_decu':'B20_lutin_pouce'];if(el&&el.naturalWidth){const eh=G.cs*.72,bob=s.mood>0?Math.abs(Math.sin(tm*10))*8:0;g.drawImage(el,G.cx+G.cw*.55,G.gy-eh-bob,eh*el.naturalWidth/el.naturalHeight,eh)}
  // visée
  const bl=im.B20_boule;
  if(s.pull&&!s.ball&&s.balls>0){
    const p=s.pull;
    for(const q of mjkTraj(s,G,W,H)){g.fillStyle='rgba(255,255,255,'+(.95-q[2]*(s.easy?.018:.1))+')';g.strokeStyle='rgba(20,30,90,.6)';g.lineWidth=2;g.beginPath();g.arc(q[0],q[1],6-(s.easy?q[2]*.05:q[2]*.3),0,6.283);g.fill();g.stroke()}
    if(bl&&bl.naturalWidth)g.drawImage(bl,G.Lx-H*.03,G.Ly-H*.03,H*.06,H*.06*bl.naturalHeight/bl.naturalWidth);
    // jauge de puissance sous la catapulte
    const gw=Math.max(G.cw*1.5,260),gh=H*.045,gx=G.cx-gw*.45,gy=G.gy+H*.045;
    g.fillStyle='rgba(8,14,46,.8)';rrect(g,gx-6,gy-6,gw+12,gh+12,gh*.6);g.fill();
    const gr=g.createLinearGradient(gx,0,gx+gw,0);gr.addColorStop(0,'#4cc35b');gr.addColorStop(.55,'#ffd24a');gr.addColorStop(1,'#e8403a');
    g.fillStyle=gr;rrect(g,gx,gy,gw*p.pw,gh,gh*.5);g.fill();
    g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2;rrect(g,gx,gy,gw,gh,gh*.5);g.stroke();
    g.fillStyle='#fff';g.beginPath();g.moveTo(gx+gw*p.pw,gy-9);g.lineTo(gx+gw*p.pw-9,gy-22);g.lineTo(gx+gw*p.pw+9,gy-22);g.fill();
    // angle : petite flèche
    g.strokeStyle='#fff';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(G.Lx,G.Ly);g.lineTo(G.Lx+Math.cos(p.ang)*H*.11,G.Ly-Math.sin(p.ang)*H*.11);g.stroke();
  }else if(s.balls>0&&!s.ball&&bl&&bl.naturalWidth&&s.tirT<=0)g.drawImage(bl,G.Lx-H*.03,G.Ly-H*.03,H*.06,H*.06);
  // boule en vol
  if(s.ball&&bl&&bl.naturalWidth){const b=s.ball;g.save();g.translate(b.x,b.y);g.rotate(b.rot);g.drawImage(bl,-H*.03,-H*.03,H*.06,H*.06*bl.naturalHeight/bl.naturalWidth);g.restore()}
  // effets
  for(const f of s.fx){const u=f.t/.7,a=1-u;g.save();g.globalAlpha=a;
    if(f.k==='splash'){const sp=im.B20_splash;if(sp&&sp.naturalWidth){const w=H*(f.petit?.1:.16);g.drawImage(sp,f.x-w/2,f.y-w*.7*(.6+u*.5),w,w*.7*sp.naturalHeight/sp.naturalWidth*1.4)}}
    else if(f.k==='eclat'){const sp=im.B20_boule_eclate;if(sp&&sp.naturalWidth){const w=H*(.14+u*.1);g.drawImage(sp,f.x-w/2,f.y-w/2,w,w)}}
    else if(f.k==='puff'){g.fillStyle='#fff';for(let i=0;i<9;i++){const an=i*.7,r=u*H*.1;g.beginPath();g.arc(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r,H*.012*(1-u*.5),0,6.283);g.fill()}
      g.fillStyle='#ffd24a';for(let i=0;i<6;i++){const an=i*1.05+.3,r=u*H*.14;g.beginPath();g.arc(f.x+Math.cos(an)*r,f.y+Math.sin(an)*r,H*.01,0,6.283);g.fill()}}
    g.restore()}
  // neige qui tombe
  g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<40;i++){const x=((i*83.7+Math.sin(tm*.8+i)*18)%W+W)%W,y=((i*57.3+tm*(30+i%5*12))%H);g.beginPath();g.arc(x,y,1.3+i%3*.8,0,6.283);g.fill()}
  if(s.t<6&&s.balls===(s.easy?999:9)&&!s.pull){g.save();g.globalAlpha=.75+.25*Math.sin(tm*5);g.textAlign='center';g.font=`bold ${H*.045}px Georgia,serif`;g.lineWidth=5;g.strokeStyle='#1a2a60';const m='Maintiens le doigt : la jauge monte. Glisse haut/bas pour l\'angle. Lâche !';g.strokeText(m,W*.5,H*.33);g.fillStyle='#fff';g.fillText(m,W*.5,H*.33);g.restore()}
}
function mjkHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.fillText(p.av,26*u,46*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  // cadeaux à décrocher
  const gw=50*u;g.fillStyle='rgba(8,14,46,.65)';rrect(g,260*u,14*u,(s.need*(gw+8*u)+20*u),62*u,31*u);g.fill();
  for(let i=0;i<s.need;i++){const k=im['B21_cadeau_or'];g.globalAlpha=i<s.got?1:.3;if(k&&k.naturalWidth)g.drawImage(k,272*u+i*(gw+8*u),20*u,gw*.62,gw*.62*k.naturalHeight/k.naturalWidth*.9)}
  g.globalAlpha=1;
  // boules restantes
  if(!s.easy){const bl=im.B20_boule;g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,86*u,Math.max(60,s.balls*30*u+24*u),44*u,22*u);g.fill();for(let i=0;i<s.balls;i++)if(bl&&bl.naturalWidth)g.drawImage(bl,26*u+i*30*u,94*u,26*u,26*u)}
}
function mjCatapulte(me){
  return mjRunner(me,{
    nouveau:mjkNew,maj:mjkUpdate,dessin:mjkDraw,hud:mjkHud,
    tap:mjkDown,drag:mjkDrag,up:mjkUp,
    evenement:(e,s,fx,cv)=>{
      if(e.k==='tir'){AE.pops&&AE.pops(1,.25)}
      else if(e.k==='touche'){AE.bells&&AE.bells();AE.pops&&AE.pops(2,.3)}
      else if(e.k==='rate'){AE.pops&&AE.pops(1,.08)}
    },
    intro:['La catapulte à boules de neige !','Maintiens le doigt pour remplir la jauge, puis lâche.','Décroche les cadeaux du sapin !']
  });
}
