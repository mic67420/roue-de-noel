/* ============ MINI-JEU 2 : LES CADEAUX QUI TOMBENT (v3.13) ============
   Le Père Noël tient un sac ouvert : le joueur glisse le doigt pour le déplacer et attraper les cadeaux qui tombent du ciel.
   Il faut éviter les pierres, les glaçons et le charbon (un cœur perdu). Les sucres d'orge redonnent un cœur.
   Objectif : attraper assez de cadeaux avant la fin du temps. Alix : version lente, peu de mauvais objets, objectif plus petit. */
const MJC_BONS=['B2_cadeau_rouge','B2_cadeau_bleu','B2_cadeau_vert','B2_cadeau_dore','B2_boule_rouge'];
const MJC_MAUVAIS=['B2_charbon'];
// météorites (tombent à la verticale) : h = hauteur (part de l'écran), hx/hy = position de la roche dans l'image
const MJC_METEO={B9_meteo_roche:{h:.14,hx:.62,hy:.64,rot:.72},B9_meteo_noire:{h:.21,hx:.6,hy:.64,rot:.72},B9_meteo_glace:{h:.17,hx:.6,hy:.64,rot:.72},B9_meteo_lave:{h:.17,hx:.6,hy:.64,rot:.72},B9_meteo_cristal:{h:.16,hx:.32,hy:.7,rot:-.75}};   // rot : on redresse l'image pour que la météorite tombe bien droit
const MJC_SOL=.93;                   // hauteur du sol (part de l'écran) où les météorites explosent
const MJC_ECL=['B8_eclair_epais'];
const MJC_SHOCK=1.5;                // durée du coup de foudre (secondes)
const MJC_CATCH=.76;                 // hauteur (part de l'écran) à laquelle les objets arrivent dans le sac
function mjcNew(easy){
  const e=!!easy;
  return{
    easy:e,t:0,D:30,need:e?10:30,got:0,lives:3,max:3,inv:0,
    x:.5,tx:.5,vel:0,hw:e?.075:.038,maxV:e?3.5:1.3,   // x = position du Père Noël (0 à 1 sur la largeur de l'écran)
    vy0:e?.30:1.05,i0:e?1.0:.34,i1:e?.75:.18,nextSpawn:.5,
    pBon:e?.74:.40,pCoeur:e?.08:.05,pEcl:e?.05:.22,pMet:e?.7:.85,shock:0,fxs:[],
    obj:[],ev:[],face:'B2_pere_sac_neutre',faceT:0,done:null,hits:0
  };
}
function mjcSpawn(s){
  const R=Math.random,r=R();
  let k,kind;
  if(r<s.pBon){kind='bon';k=MJC_BONS[Math.floor(R()*MJC_BONS.length)]}
  else if(r<s.pBon+s.pCoeur){kind='coeur';k='B2_sucre_orge'}
  else if(r<s.pBon+s.pCoeur+s.pEcl){kind='eclair';k=MJC_ECL[Math.floor(R()*MJC_ECL.length)]}
  else{kind='meteo';const ks=Object.keys(MJC_METEO);k=ks[Math.floor(R()*ks.length)]}
  const ob={k,kind,x:.06+R()*.88,y:-.08,rot:kind==='eclair'||kind==='meteo'?0:R()*6.28,spin:kind==='eclair'||kind==='meteo'?0:(R()-.5)*3,done:false,dx:0};
  s.obj.push(ob);
}
function mjcUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;const prog=Math.min(1,s.t/s.D);
  const vy=s.vy0*(1+.45*prog);
  if(s.shock>0)s.shock=Math.max(0,s.shock-dt);
  const ox=s.x,want=s.shock>0?0:(s.tx-s.x)*Math.min(1,dt*14),mv=Math.max(-s.maxV*dt,Math.min(s.maxV*dt,want));
  s.x=Math.max(.04,Math.min(.96,s.x+mv));s.vel+=((s.x-ox)/Math.max(dt,1e-3)-s.vel)*Math.min(1,dt*10);
  if(s.inv>0)s.inv-=dt;
  if(s.faceT>0){s.faceT-=dt;if(s.faceT<=0)s.face='B2_pere_sac_neutre'}
  while(s.t>=s.nextSpawn&&s.t<s.D-1.5){mjcSpawn(s);s.nextSpawn+=s.i0+(s.i1-s.i0)*prog}
  for(const o of s.obj){
    o.y+=vy*dt;o.rot+=o.spin*dt;o.x+=o.dx*dt;
    if(!o.done&&o.y>=MJC_CATCH){
      o.done=true;
      if(Math.abs(o.x-s.x)<s.hw+.025){
        if(o.kind==='bon'){s.got++;s.face='B2_pere_sac_content';s.faceT=.6;s.ev.push({k:'bon',x:o.x});o.got=true}
        else if(o.kind==='coeur'){if(s.lives<s.max)s.lives++;s.ev.push({k:'coeur'});o.got=true}
        else if(o.kind==='eclair'){if(s.inv<=0){s.lives--;s.hits++;s.inv=2.6;s.shock=MJC_SHOCK;s.ev.push({k:'foudre',x:o.x})}o.got=true}
        else if(o.kind==='meteo'){if(s.inv<=0){s.lives--;s.hits++;s.inv=1.4;s.face='B2_pere_sac_grimace';s.faceT=.9;s.ev.push({k:'meteo',x:o.x});s.fxs.push({x:s.x,y:.9,t:0,hit:true,g:Math.random()})}o.got=true}
        else if(s.inv<=0){s.lives--;s.hits++;s.inv=1.2;s.face='B2_pere_sac_grimace';s.faceT=.9;s.ev.push({k:'mal',x:o.x});o.got=true}
        else o.got=true;
      }
    }
  }
  for(const o of s.obj)if(!o.got&&o.kind==='meteo'&&o.y>=MJC_SOL){o.got=true;s.fxs.push({x:o.x,y:MJC_SOL+.01,t:0,g:Math.random(),big:o.k==='B9_meteo_noire'});s.ev.push({k:'sol',x:o.x})}
  for(const f of s.fxs)f.t+=dt;s.fxs=s.fxs.filter(f=>f.t<2.8);
  s.obj=s.obj.filter(o=>o.y<1.15&&!o.got);
  if(s.lives<=0)s.done='lose';
  else if(s.t>=s.D)s.done=s.got>=s.need?'win':'temps';
}
function mjcDraw(g,s,W,H,tm){
  const im=MJ.img,u=H/720,t0=MJC_SHOCK-s.shock,ch=s.shock>0;
  g.save();if(ch&&t0<1)g.translate((Math.random()-.5)*H*.03*(1-t0),(Math.random()-.5)*H*.02*(1-t0));
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
    const M=o.kind==='meteo'?MJC_METEO[o.k]:null,hh=(M?M.h:o.kind==='coeur'?.15:o.kind==='mauvais'?.115:o.kind==='eclair'?.2:.13)*H,ww=hh*i.naturalWidth/i.naturalHeight;
    if(M){g.save();g.translate(o.x*W,o.y*H);g.rotate(M.rot);g.drawImage(i,-ww*M.hx,-hh*M.hy,ww,hh);g.restore();continue}
    g.save();if(o.kind==='eclair'){g.shadowColor='#ffe94a';g.shadowBlur=H*.05}g.translate(o.x*W,o.y*H);g.rotate(Math.sin(o.rot)*.35);g.drawImage(i,-ww/2,-hh/2,ww,hh);g.restore();
  }
  // explosions des météorites (au sol, ou sur le Père Noël)
  for(const f of s.fxs){
    const x=f.x*W,y=f.y*H,t=f.t,k=f.big||f.hit?1.25:.9,pos=(n,h,al)=>{const m=im[n];if(!m||!m.naturalWidth)return;const hh=h*H*k,ww=hh*m.naturalWidth/m.naturalHeight;g.globalAlpha=al;g.drawImage(m,x-ww/2,y-hh,ww,hh);g.globalAlpha=1};
    if(t<.5){g.strokeStyle='rgba(255,255,255,'+(.8*(1-t/.5))+')';g.lineWidth=H*.012;g.beginPath();g.ellipse(x,y-H*.01,H*.06+t*H*.9,H*.02+t*H*.18,0,0,6.283);g.stroke()}
    if(t>.35)pos('B9_cratere',.14,Math.max(0,Math.min(1,(2.6-t)/1.0)));
    if(t<.12)pos('B9_expl1',.2*(.7+t*3),1);
    else if(t<.3)pos('B9_expl2',.26,1);
    else if(t<.65)pos('B9_expl3',.42,1);
    else if(t<1.1)pos('B9_expl4',.42,Math.max(0,1-(t-.65)/.45));
    if(t<.7){const m=im['B9_debris'];if(m&&m.naturalWidth){const hh=H*.3*k,ww=hh*m.naturalWidth/m.naturalHeight,up=Math.sin(Math.min(1,t/.7)*Math.PI)*H*.12;g.globalAlpha=Math.min(1,(.7-t)*3);g.drawImage(m,x-ww/2,y-hh-up,ww,hh);g.globalAlpha=1}}
  }
  // Père Noël et son sac
  let fk=s.face;
  if(ch){fk=t0<.12?'B8_pere_electrocute':s.shock<.3?'B8_pere_carbonise':(Math.floor(tm*13)%2?'B8_pere_squelette':'B8_pere_squelette_etoile')}
  const f=im[fk];
  if(ch){ // lueur électrique derrière le Père Noël
    const cx=s.x*W,cy=H*.78,gr=g.createRadialGradient(cx,cy,0,cx,cy,H*.45);gr.addColorStop(0,'rgba(190,230,255,'+(.85*Math.min(1,s.shock*2))+')');gr.addColorStop(1,'rgba(120,180,255,0)');
    g.fillStyle=gr;g.fillRect(cx-H*.5,cy-H*.5,H,H);
  }
  if(f&&f.naturalWidth&&!(!ch&&s.inv>0&&Math.floor(tm*14)%2)){
    const h=H*.36,w=h*f.naturalWidth/f.naturalHeight,x=s.x*W,y=H*.985;
    g.fillStyle='rgba(60,80,130,.25)';g.beginPath();g.ellipse(x,y-4,w*.5,h*.05,0,0,6.283);g.fill();
    g.save();g.translate(x,y);g.rotate(Math.max(-.12,Math.min(.12,s.vel*.03)));g.drawImage(f,-w/2,-h,w,h);g.restore();
  }
  // coup de foudre : éclair du ciel jusqu'au Père Noël, étincelles, flash blanc
  if(ch){
    const cx=s.x*W,seed=Math.floor(tm*25);
    if(t0<.45){
      for(let pass=0;pass<2;pass++){
        g.strokeStyle=pass?'#fff':'rgba(120,190,255,.9)';g.lineWidth=(pass?H*.012:H*.04)*(1-t0*1.4);g.lineJoin='round';g.shadowColor='#9fd2ff';g.shadowBlur=H*.06;
        g.beginPath();let x=cx+(Math.sin(seed)*H*.1),y=0;g.moveTo(x,y);
        for(let k=1;k<=9;k++){const r=Math.sin(seed*7.3+k*12.9898)*43758.5453,rr=r-Math.floor(r);x+=(cx-x)*.25+(rr-.5)*H*.16;y=H*.78*k/9;g.lineTo(x,y)}
        g.lineTo(cx,H*.8);g.stroke();
      }
      g.shadowBlur=0;
    }
    g.strokeStyle='#dff3ff';g.lineWidth=3*u;
    for(let i=0;i<9;i++){const a=Math.random()*6.283,r1=H*.1+Math.random()*H*.1,r2=r1+H*(.05+Math.random()*.12);g.beginPath();g.moveTo(cx+Math.cos(a)*r1,H*.74+Math.sin(a)*r1);g.lineTo(cx+Math.cos(a+.3)*r2,H*.74+Math.sin(a+.3)*r2);g.stroke()}
    const fl=t0<.1?1:Math.max(0,1-(t0-.1)/.35)*.9;
    if(fl>0){g.fillStyle='rgba(235,245,255,'+fl+')';g.fillRect(0,0,W,H)}
  }
  // neige qui tombe
  g.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<40;i++){const x=((i*131.7+Math.sin(tm*.8+i)*30)%W+W)%W,y=((i*83.1+tm*(50+i%5*15))%H),r=1+i%3;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}
  g.restore();
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
      if(e.k==='meteo'){AE.boom&&AE.boom();cv.style.transform='translate('+(Math.random()*22-11)+'px,'+(Math.random()*14-7)+'px)'}
      else if(e.k==='sol'){AE.pops&&AE.pops(1,.4)}
      else if(e.k==='foudre'){AE.boom&&AE.boom();AE.nope&&AE.nope();cv.style.transform=''}
      else if(e.k==='mal'){AE.nope&&AE.nope();fx.push({t:0,x:s.x,y:.74});cv.style.transform='translate('+(Math.random()*16-8)+'px,'+(Math.random()*10-5)+'px)'}
      else if(e.k==='coeur')AE.bells&&AE.bells();
      else AE.pops&&AE.pops(3,.5);
    },
    intro:['Attrape les cadeaux !','Glisse ton doigt pour déplacer le Père Noël.','Évite les éclairs ⚡ et les météorites ☄️ !']
  });
}
