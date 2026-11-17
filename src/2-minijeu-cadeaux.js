/* ============ MINI-JEU 2 : LES CADEAUX QUI TOMBENT (v3.13) ============
   Le Père Noël tient un sac ouvert : le joueur glisse le doigt pour le déplacer et attraper les cadeaux qui tombent du ciel.
   Il faut éviter les pierres, les glaçons et le charbon (un cœur perdu). Les sucres d'orge redonnent un cœur.
   Objectif : attraper assez de cadeaux avant la fin du temps. Alix : version lente, peu de mauvais objets, objectif plus petit. */
const MJC_BONS=['B2_cadeau_rouge','B2_cadeau_bleu','B2_cadeau_vert','B2_cadeau_dore','B2_boule_rouge'];
const MJC_MAUVAIS=['B2_pierre','B2_glacon','B2_charbon'];
const MJC_CATCH=.76;                 // hauteur (part de l'écran) à laquelle les objets arrivent dans le sac
function mjcNew(easy){
  const e=!!easy;
  return{
    easy:e,t:0,D:e?40:30,need:e?7:28,got:0,lives:3,max:3,inv:0,
    x:.5,tx:.5,vel:0,hw:e?.075:.038,maxV:e?3.5:1.3,   // x = position du Père Noël (0 à 1 sur la largeur de l'écran)
    vy0:e?.30:1.05,i0:e?1.0:.34,i1:e?.75:.18,nextSpawn:.5,
    pBon:e?.74:.40,pCoeur:e?.08:.05,
    obj:[],ev:[],face:'B2_pere_sac_neutre',faceT:0,done:null,hits:0
  };
}
function mjcSpawn(s){
  const R=Math.random,r=R();
  let k,kind;
  if(r<s.pBon){kind='bon';k=MJC_BONS[Math.floor(R()*MJC_BONS.length)]}
  else if(r<s.pBon+s.pCoeur){kind='coeur';k='B2_sucre_orge'}
  else{kind='mauvais';k=MJC_MAUVAIS[Math.floor(R()*MJC_MAUVAIS.length)]}
  s.obj.push({k,kind,x:.06+R()*.88,y:-.08,rot:R()*6.28,spin:(R()-.5)*3,done:false});
}
function mjcUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;const prog=Math.min(1,s.t/s.D);
  const vy=s.vy0*(1+.45*prog);
  const ox=s.x,want=(s.tx-s.x)*Math.min(1,dt*14),mv=Math.max(-s.maxV*dt,Math.min(s.maxV*dt,want));
  s.x=Math.max(.04,Math.min(.96,s.x+mv));s.vel+=((s.x-ox)/Math.max(dt,1e-3)-s.vel)*Math.min(1,dt*10);
  if(s.inv>0)s.inv-=dt;
  if(s.faceT>0){s.faceT-=dt;if(s.faceT<=0)s.face='B2_pere_sac_neutre'}
  while(s.t>=s.nextSpawn&&s.t<s.D-1.5){mjcSpawn(s);s.nextSpawn+=s.i0+(s.i1-s.i0)*prog}
  for(const o of s.obj){
    o.y+=vy*dt;o.rot+=o.spin*dt;
    if(!o.done&&o.y>=MJC_CATCH){
      o.done=true;
      if(Math.abs(o.x-s.x)<s.hw+.025){
        if(o.kind==='bon'){s.got++;s.face='B2_pere_sac_content';s.faceT=.6;s.ev.push({k:'bon',x:o.x});o.got=true}
        else if(o.kind==='coeur'){if(s.lives<s.max)s.lives++;s.ev.push({k:'coeur'});o.got=true}
        else if(s.inv<=0){s.lives--;s.hits++;s.inv=1.2;s.face='B2_pere_sac_grimace';s.faceT=.9;s.ev.push({k:'mal',x:o.x});o.got=true}
        else o.got=true;
      }
    }
  }
  s.obj=s.obj.filter(o=>o.y<1.15&&!o.got);
  if(s.got>=s.need)s.done='win';
  else if(s.lives<=0)s.done='lose';
  else if(s.t>=s.D)s.done='temps';
}
function mjcDraw(g,s,W,H,tm){
  const im=MJ.img,u=H/720;
  if(!MJ.bgC||MJ.bgC.width!==W||MJ.bgC.height!==H){
    const c=document.createElement('canvas');c.width=W;c.height=H;const k=c.getContext('2d');
    let gr=k.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#070d2e');gr.addColorStop(.7,'#2b4a8c');gr.addColorStop(1,'#4a6aa8');
    k.fillStyle=gr;k.fillRect(0,0,W,H);k.fillStyle='#fff';
    for(let i=0;i<70;i++){k.globalAlpha=.4+.5*((i*37)%10)/10;k.beginPath();k.arc(i*173.7%W,i*97.3%(H*.7),i%3?1.3:2.2,0,6.283);k.fill()}
    k.globalAlpha=1;
    k.fillStyle='#e4edfb';k.beginPath();k.moveTo(0,H*.93);k.quadraticCurveTo(W*.25,H*.86,W*.5,H*.93);k.quadraticCurveTo(W*.75,H*1.0,W,H*.9);k.lineTo(W,H);k.lineTo(0,H);k.fill();
    k.fillStyle='#fff';k.fillRect(0,H*.965,W,H*.04);
    MJ.bgC=c;
  }
  g.drawImage(MJ.bgC,0,0);
  // objets qui tombent
  for(const o of s.obj){
    const i=im[o.k];if(!i||!i.naturalWidth)continue;
    const hh=(o.kind==='coeur'?.15:o.kind==='mauvais'?.115:.13)*H,ww=hh*i.naturalWidth/i.naturalHeight;
    g.save();g.translate(o.x*W,o.y*H);g.rotate(Math.sin(o.rot)*.35);g.drawImage(i,-ww/2,-hh/2,ww,hh);g.restore();
  }
  // Père Noël et son sac
  const f=im[s.face];
  if(f&&f.naturalWidth&&!(s.inv>0&&Math.floor(tm*14)%2)){
    const h=H*.36,w=h*f.naturalWidth/f.naturalHeight,x=s.x*W,y=H*.985;
    g.fillStyle='rgba(60,80,130,.25)';g.beginPath();g.ellipse(x,y-4,w*.5,h*.05,0,0,6.283);g.fill();
    g.save();g.translate(x,y);g.rotate(Math.max(-.12,Math.min(.12,s.vel*.03)));g.drawImage(f,-w/2,-h,w,h);g.restore();
  }
  // neige qui tombe
  g.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<40;i++){const x=((i*131.7+Math.sin(tm*.8+i)*30)%W+W)%W,y=((i*83.1+tm*(50+i%5*15))%H),r=1+i%3;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}
}
function mjcHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.fillText(p.av,26*u,46*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  const hs=50*u;
  for(let i=0;i<s.max;i++){
    const img=im[i<s.lives?'B6_coeur_plein':'B6_coeur_vide'];
    if(img&&img.naturalWidth)g.drawImage(img,260*u+i*(hs+6*u),16*u,hs,hs*img.naturalHeight/img.naturalWidth);
  }
  // cadeaux attrapés (barre) + temps restant (fine barre bleue)
  const bx=W*.58,bw=W*.28,by=22*u,pr=Math.min(1,s.got/s.need);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  const cd=im['B2_cadeau_rouge'];if(cd&&cd.naturalWidth)g.drawImage(cd,bx+bw-14*u,by-16*u,56*u,56*u);
  const tr=Math.max(0,1-s.t/s.D);
  g.fillStyle='rgba(8,14,46,.55)';rrect(g,bx,by+30*u,bw,10*u,5*u);g.fill();
  g.fillStyle=tr<.25?'#ff7a6a':'#7ad0ff';rrect(g,bx+2*u,by+32*u,Math.max(8*u,(bw-4*u)*tr),6*u,3*u);g.fill();
  g.fillStyle='#fff';g.font=`bold ${30*u}px Georgia,serif`;g.textAlign='right';g.fillText(s.got+' / '+s.need,bx-14*u,by+11*u);
}
function mjCadeaux(me){
  return mjRunner(me,{
    nouveau:mjcNew,maj:mjcUpdate,dessin:mjcDraw,hud:mjcHud,
    pointeur:(s,f)=>{s.tx=Math.max(.04,Math.min(.96,f))},
    cle:(s,d)=>{s.tx=Math.max(.04,Math.min(.96,s.tx+d*.12))},
    evenement:(e,s,fx,cv)=>{
      if(e.k==='mal'){AE.nope&&AE.nope();fx.push({t:0,x:s.x,y:.74});cv.style.transform='translate('+(Math.random()*16-8)+'px,'+(Math.random()*10-5)+'px)'}
      else if(e.k==='coeur')AE.bells&&AE.bells();
      else AE.pops&&AE.pops(3,.5);
    },
    intro:['Attrape les cadeaux !','Glisse ton doigt pour déplacer le Père Noël.','Évite les pierres, les glaçons et le charbon !']
  });
}
