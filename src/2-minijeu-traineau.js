/* ============ MINI-JEU 1 : LE TRAÎNEAU (v3.7) ============
   Le joueur glisse le doigt de gauche à droite pour guider le traîneau du Père Noël et esquiver les arbres, rochers et bonhommes de neige.
   Les cadeaux rouges font des points, les étoiles redonnent un cœur. Arrivé au bout sans perdre tous ses cœurs = cadeau gagné.
   Alix (5 ans) a une version lente et facile : plus de cœurs, plus court, obstacles plus petits.
   Le code est séparé en : mjNew/mjUpdate (règles, testables sans écran) et mjDraw (dessin). */
const MJ={img:{},loaded:false,active:false,bg:null};
function mjLoad(){
  return new Promise(res=>{
    if(MJ.loaded)return res();
    const D=window.MJ_IMGS||{},ks=Object.keys(D);let n=0;
    if(!ks.length){MJ.loaded=true;return res()}
    ks.forEach(k=>{
      const im=new Image();
      const done=()=>{if(++n===ks.length){MJ.loaded=true;res()}};
      im.onload=done;im.onerror=done;im.src=D[k].u;MJ.img[k]=im;
    });
  });
}
const MJ_OBST=[                       // [image, demi-largeur de collision, hauteur à l'écran (part de la hauteur)]
  ['B1_sapin_grand',.30,.50],['B1_sapin_petit',.20,.34],['B1_rocher',.26,.22],['B1_bonhomme',.17,.34],['B1_souche',.20,.19],['TRONC',.34,.17]
];
const MJ_ANIM=[                      // animaux qui traversent la piste : [images, demi-largeur, hauteur, vitesse (piste/s), images par seconde, saut, adultes seulement]
  [['B7_renne_marche1','B7_renne_marche2'],.24,.30,.8,5,0,false],
  [['B7_renne_galop'],.28,.27,1.5,0,.03,true],
  [['B7_pingouin_marche1','B7_pingouin_marche2'],.16,.22,.7,4,0,false],
  [['B7_pingouin_glisse'],.24,.17,1.6,0,0,true],
  [['B7_bebe_pingouin'],.12,.17,.6,0,.035,false],
  [['B7_pingouin_saute'],.17,.24,.9,0,.05,true]
];
const MJ_ZS=.86;                      // « profondeur » où se trouve le traîneau (0 = horizon, 1 = bas de l'écran)
function mjNew(easy){
  const e=!!easy;
  return{
    easy:e,t:0,D:30,lives:3,max:3,inv:0,
    x:0,tx:0,vel:0,hw:e?.18:.22,maxV:e?3.5:2.1,   // position du traîneau (-1 = bord gauche de la piste, +1 = bord droit) ; maxV = vitesse latérale maximale
    base:e?.30:.60,spd:0,dist:0,
    i0:e?1.0:.68,i1:e?.75:.38,nextSpawn:.6,nextScen:0,nextArch:3.5,
    obj:[],sc:[],ev:[],score:0,stars:0,done:null,hits:0
  };
}
function mjSpawn(s,prog){
  const R=Math.random;
  const kind=R()<(s.easy?.38:.3)?'bonus':'obst';
  if(kind==='bonus'){
    const star=R()<.28;
    s.obj.push({k:star?'B1_etoile_doree':'B1_cadeau_rouge',type:star?'etoile':'cadeau',wx:(R()*2-1)*.95,hw:.24,hf:star?.15:.17,lift:star?.06:0,z:.07,done:false});
    return;
  }
  if(R()<(s.easy?.22:.32)){             // un animal traverse la piste (il arrive à hauteur du traîneau à un endroit au hasard)
    const pool=MJ_ANIM.filter(a=>!(s.easy&&a[6])),a=pool[Math.floor(R()*pool.length)];
    const vx=(R()<.5?-1:1)*a[3]*(s.easy?.45:1)*(.85+.3*R()),tgt=(R()*2-1)*.9,Tapp=(MJ_ZS-.035-.07)/s.spd;
    s.obj.push({k:a[0][0],frames:a[0],fps:a[4],hop:a[5],vx,type:'obst',wx:tgt-vx*Tapp,hw:a[1]*(s.easy?.9:1),hf:a[2],lift:0,z:.07,done:false});
    return;
  }
  const t=MJ_OBST[Math.floor(R()*MJ_OBST.length)],wx=(R()*2-1)*.95,k=s.easy?.9:1;
  s.obj.push({k:t[0],type:'obst',wx,hw:t[1]*k,hf:t[2],lift:0,z:.07,done:false});
  if(!s.easy&&prog>.05&&R()<.65){        // souvent un deuxième obstacle, toujours avec un passage libre entre les deux
    const u=MJ_OBST[Math.floor(R()*MJ_OBST.length)],hw2=u[1],d=t[1]*k+hw2+2*s.hw+.22+R()*.25,sg=R()<.5?-1:1;
    for(const sgn of [sg,-sg]){const w2=wx+sgn*d;if(Math.abs(w2)<=1.05){s.obj.push({k:u[0],type:'obst',wx:w2,hw:hw2,hf:u[2],lift:0,z:.07,done:false});break}}
  }
}
function mjUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;const prog=Math.min(1,s.t/s.D);
  s.spd=s.base*(1+(s.easy?.35:.5)*prog);s.dist+=s.spd*dt;
  const ox=s.x,want=(s.tx-s.x)*Math.min(1,dt*12),mv=Math.max(-s.maxV*dt,Math.min(s.maxV*dt,want));s.x+=mv;s.x=Math.max(-1.05,Math.min(1.05,s.x));
  s.vel+=((s.x-ox)/Math.max(dt,1e-3)-s.vel)*Math.min(1,dt*10);
  if(s.inv>0)s.inv-=dt;
  while(s.t>=s.nextSpawn&&s.t<s.D-2.6){mjSpawn(s,prog);s.nextSpawn+=s.i0+(s.i1-s.i0)*prog}
  while(s.t>=s.nextScen){                // décor sur les côtés (sans collision)
    const t=MJ_OBST[Math.floor(Math.random()*(MJ_OBST.length-1))],side=Math.random()<.5?-1:1;
    s.sc.push({k:t[0],wx:side*(1.4+Math.random()*.9),hf:t[2]*(.8+Math.random()*.4),z:.07});s.nextScen+=.28+Math.random()*.25;
  }
  if(s.t>=s.nextArch&&s.t<s.D-3){s.sc.push({k:'ARCHE',wx:0,hf:.5,z:.07});s.nextArch=s.t+5+Math.random()*3}
  for(const o of s.obj){
    o.z+=s.spd*dt;if(o.vx)o.wx+=o.vx*dt;
    if(!o.done&&o.z>=MJ_ZS-.035){
      o.done=true;
      if(Math.abs(o.wx-s.x)<o.hw+s.hw){
        if(o.type==='obst'){if(s.inv<=0){s.lives--;s.hits++;s.inv=1.4;s.ev.push({k:'hit',wx:o.wx});o.hit=true}}
        else if(o.type==='cadeau'){s.score++;s.ev.push({k:'cadeau'});o.got=true}
        else{s.stars++;if(s.lives<s.max)s.lives++;s.ev.push({k:'etoile'});o.got=true}
      }
    }
  }
  for(const o of s.sc)o.z+=s.spd*dt;
  s.obj=s.obj.filter(o=>o.z<1.3&&!o.got);s.sc=s.sc.filter(o=>o.z<1.6);
  if(s.lives<=0)s.done='lose';else if(s.t>=s.D)s.done='win';
}
/* ---- dessin ---- */
function mjDraw2D(g,s,W,H,tm){
  const im=MJ.img,hy=H*.30,roadHalf=W*.42,gy=z=>hy+(H*1.0-hy)*z,px=(wx,z)=>W/2+wx*roadHalf*z,P=u=>MJ_ZS*Math.pow(Math.max(u,0)/MJ_ZS,1.5);   // P : effet de perspective, ce qui est proche défile plus vite
  // ciel, collines lointaines, brume et neige du fond : dessinés une seule fois puis recopiés (plus fluide sur téléphone)
  if(!MJ.bg||MJ.bg.width!==W||MJ.bg.height!==H){
    const c=document.createElement('canvas');c.width=W;c.height=H;const k=c.getContext('2d');
    let gr=k.createLinearGradient(0,0,0,hy);gr.addColorStop(0,'#070d2e');gr.addColorStop(.7,'#243f80');gr.addColorStop(1,'#3d5fa3');
    k.fillStyle=gr;k.fillRect(0,0,W,hy+2);k.fillStyle='#fff';
    for(let i=0;i<60;i++){k.globalAlpha=.45+.45*((i*37)%10)/10;k.beginPath();k.arc(i*173.7%W,i*97.3%(hy*.8),i%3?1.2:2,0,6.283);k.fill()}
    k.globalAlpha=1;
    // deux rangées de collines enneigées (plus claires et plus bleues au loin)
    const colline=(col,amp,fr,ph,base)=>{k.fillStyle=col;k.beginPath();k.moveTo(0,hy+3);for(let x=0;x<=W;x+=8){const y=hy-base-amp*(.55+.45*Math.sin(x/W*fr+ph))-amp*.35*Math.sin(x/W*fr*2.7+ph*2);k.lineTo(x,y)}k.lineTo(W,hy+3);k.fill()};
    colline('#4a6bad',H*.075,9,1.2,H*.01);colline('#6784c0',H*.05,14,3.1,0);
    // brume à l'horizon
    gr=k.createLinearGradient(0,hy-H*.07,0,hy+H*.07);gr.addColorStop(0,'rgba(190,210,245,0)');gr.addColorStop(.55,'rgba(205,222,250,.75)');gr.addColorStop(1,'rgba(205,222,250,0)');
    k.fillStyle=gr;k.fillRect(0,hy-H*.07,W,H*.14);
    // neige : sombre et bleutée au loin, blanche près de nous
    gr=k.createLinearGradient(0,hy,0,H);gr.addColorStop(0,'#a9bde3');gr.addColorStop(.25,'#cddcf5');gr.addColorStop(.6,'#eaf1fc');gr.addColorStop(1,'#ffffff');
    k.fillStyle=gr;k.fillRect(0,hy+2,W,H-hy);
    gr=k.createLinearGradient(0,hy-4,0,hy+H*.05);gr.addColorStop(0,'rgba(205,222,250,.8)');gr.addColorStop(1,'rgba(205,222,250,0)');k.fillStyle=gr;k.fillRect(0,hy-4,W,H*.05+4);
    MJ.bg=c;
  }
  g.drawImage(MJ.bg,0,0);
  const N=9,ph=(s.dist*1.0)%(1/N),dt=Math.min(.05,Math.max(0,tm-(MJ.lastTm||tm)));MJ.lastTm=tm;
  // piste : un peu plus claire, bords en congères
  g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.moveTo(W/2-W*.03,hy);g.lineTo(W/2+W*.03,hy);g.lineTo(W/2+roadHalf*1.12,H);g.lineTo(W/2-roadHalf*1.12,H);g.fill();
  // relief doux de la neige qui défile (dégradé lissé, pas de bandes dures : évite l'effet de clignotement)
  {const M=40;
    for(let j=0;j<M;j++){
      const u0=j/M,u1=(j+1)/M,um=(u0+u1)/2,v=Math.sin(6.283*N*(um-ph)),z0=P(u0),z1=P(u1),y0=gy(z0),y1=gy(z1);
      g.fillStyle=v>0?'rgba(255,255,255,'+(.07*v)+')':'rgba(120,150,205,'+(-.07*v)+')';
      g.beginPath();g.moveTo(px(-1.12,z0),y0);g.lineTo(px(1.12,z0),y0);g.lineTo(px(1.12,z1),y1+1);g.lineTo(px(-1.12,z1),y1+1);g.fill();
    }}
  // ombre bleutée et bord clair des congères
  for(const sd of [-1,1]){
    g.fillStyle='rgba(95,125,185,.22)';g.beginPath();g.moveTo(px(sd*1.12,.02),gy(.02));g.lineTo(px(sd*1.34,.02),gy(.02));g.lineTo(px(sd*1.34,1.1),gy(1.1));g.lineTo(px(sd*1.12,1.1),gy(1.1));g.fill();
    g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=4;g.beginPath();g.moveTo(px(sd*1.12,.02),gy(.02));g.lineTo(px(sd*1.12,1.1),gy(1.1));g.stroke();
    // petites bosses de neige sur le bord, qui défilent
    for(let i=0;i<N;i++){const u=i/N+ph,z=P(u);if(z<.04)continue;g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.ellipse(px(sd*1.2,z),gy(z),roadHalf*.12*z,H*.028*z,0,Math.PI,6.283);g.fill();g.fillStyle='rgba(95,125,185,.3)';g.beginPath();g.ellipse(px(sd*1.2,z),gy(z),roadHalf*.12*z,H*.007*z,0,0,6.283);g.fill()}
  }
  // traces de patins laissées par le traîneau (suivent ses déplacements)
  const tr=MJ.trail||(MJ.trail=[]);
  if(tr.length&&s.dist<tr[0].d)tr.length=0;
  if(!tr.length||s.dist-tr[tr.length-1].d>.02)tr.push({d:s.dist,x:s.x});
  while(tr.length&&s.dist-tr[0].d>.3)tr.shift();
  g.strokeStyle='rgba(110,140,200,.5)';g.lineCap='round';
  for(const off of [-.1,.1]){
    g.beginPath();let first=true;
    for(const t of tr){const z=P(MJ_ZS+(s.dist-t.d));g.lineWidth=1+3*z;const X=px(t.x+off,z),Y=gy(z);if(first){g.moveTo(X,Y);first=false}else g.lineTo(X,Y)}
    g.stroke();
  }
  g.lineCap='butt';
  // objets triés du plus loin au plus proche, le traîneau s'intercale à sa profondeur
  const list=[];
  s.sc.forEach(o=>list.push({z:o.z,k:o.k,wx:o.wx,hf:o.hf,lift:0,a:1}));
  s.obj.forEach(o=>list.push({z:o.z,k:o.frames&&o.fps?o.frames[Math.floor(tm*o.fps)%o.frames.length]:o.k,wx:o.wx,hf:o.hf,lift:o.lift+(o.hop?o.hop*Math.abs(Math.sin(tm*7+o.wx*3)):0),a:o.hit?.5:1,bob:o.type!=='obst',flip:o.vx<0}));
  list.push({z:MJ_ZS,sleigh:true});
  list.sort((a,b)=>a.z-b.z);
  for(const o of list){
    if(o.sleigh){mjSleigh(g,s,W,H,gy,px,tm,dt);continue}
    const i=im[o.k];if(!i||!i.naturalWidth)continue;
    const z=P(o.z),h=H*o.hf*z,w=h*i.naturalWidth/i.naturalHeight,x=px(o.wx,z),yb=gy(z),y=yb-H*o.lift*z+(o.bob?Math.sin(tm*5+o.wx*7)*H*.008*z:0);
    const al=Math.min(1,z*8)*o.a;
    // ombre portée au sol (reste au sol quand l'objet saute)
    g.globalAlpha=al*Math.max(.35,1-o.lift*3);g.fillStyle='rgba(70,95,160,.32)';g.beginPath();g.ellipse(x+w*.08,yb,w*.4,Math.max(2,h*.07),0,0,6.283);g.fill();
    g.globalAlpha=al;
    if(o.flip){g.save();g.translate(x,0);g.scale(-1,1);g.drawImage(i,-w/2,y-h,w,h);g.restore()}else g.drawImage(i,x-w/2,y-h,w,h);
  }
  g.globalAlpha=1;
  // flocons qui filent vers nous depuis l'horizon (sensation de vitesse)
  g.strokeStyle='rgba(255,255,255,.7)';
  for(let i=0;i<34;i++){
    const ang=(i*2.399)%1,sd=ang<.5?-1:1,wx=sd*(1.25+((i*0.6180339)%1)*2.4),u=((i*0.37)%1+s.dist*1.7)%1,z0=P(u),z1=P(Math.min(1.2,u+.06));
    if(z0<.03)continue;g.globalAlpha=Math.min(1,z0*5)*.75;g.lineWidth=1+2*z1;g.beginPath();g.moveTo(px(wx,z0),gy(z0)-H*(.02+.1*((i*.77)%1))*z0);g.lineTo(px(wx,z1),gy(z1)-H*(.02+.1*((i*.77)%1))*z1);g.stroke();
  }
  g.globalAlpha=1;
  // neige qui tombe
  g.fillStyle='rgba(255,255,255,.8)';
  for(let i=0;i<60;i++){const x=((i*131.7+Math.sin(tm*.8+i)*30)%W+W)%W,y=((i*83.1+tm*(60+i%5*18))%H),r=1+i%3;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}
}
function mjSleigh(g,s,W,H,gy,px,tm,dt){
  const im=MJ.img,k=s.vel<-.35?'B1_traineau_gauche':s.vel>.35?'B1_traineau_droite':'B1_traineau_droit',i=im[k];
  if(!i||!i.naturalWidth)return;
  const h=H*.30,w=h*i.naturalWidth/i.naturalHeight,x=px(s.x,MJ_ZS),y=gy(MJ_ZS)+Math.sin(tm*14)*H*.004;
  // poudreuse soulevée par les patins (plus forte quand on tourne)
  const sp=MJ.spray||(MJ.spray=[]);
  if(dt>0){const n=2+Math.min(3,Math.abs(s.vel)*2);for(let q=0;q<n;q++){const sd=Math.random()<.5?-1:1;sp.push({x:x+sd*w*.28,y:y-h*.03,vx:sd*(20+Math.random()*60)*H/720-s.vel*40*H/720,vy:(80+Math.random()*140)*H/720,r:(3+Math.random()*5)*H/720,l:0,L:.45+Math.random()*.3})}}
  for(const q of sp){q.l+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy-=60*dt*H/720*0}
  MJ.spray=sp.filter(q=>q.l<q.L);
  g.fillStyle='rgba(60,80,130,.25)';g.beginPath();g.ellipse(x,y,w*.5,h*.07,0,0,6.283);g.fill();
  if(!(s.inv>0&&Math.floor(tm*14)%2)){                           // clignote quand il vient d'être touché
    g.save();g.translate(x,y);g.rotate(Math.max(-.1,Math.min(.1,s.vel*.035)));g.drawImage(i,-w/2,-h*.95,w,h);g.restore();
  }
  for(const q of MJ.spray){const a=1-q.l/q.L;g.fillStyle='rgba(255,255,255,'+(.85*a)+')';g.beginPath();g.arc(q.x,q.y,q.r*(1+q.l*1.6),0,6.283);g.fill()}
}
function mjHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  // nom du joueur
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';avDraw(g,p,24*u,46*u,40*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  // cœurs
  const hs=50*u;
  for(let i=0;i<s.max;i++){
    const k=i<s.lives?'B6_coeur_plein':'B6_coeur_vide',img=im[k];
    if(img&&img.naturalWidth){const pulse=(s.inv>1.1&&i===s.lives)?1.3:1;g.drawImage(img,260*u+i*(hs+6*u),16*u,hs*pulse,hs*pulse*img.naturalHeight/img.naturalWidth)}
  }
  // avancement
  const bx=W*.58,bw=W*.28,by=26*u,pr=Math.min(1,s.t/s.D);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  const st=im['B6_etoile_score'];if(st&&st.naturalWidth)g.drawImage(st,bx+bw-18*u,by-14*u,50*u,50*u);
  // cadeaux ramassés
  const cd=im['B1_cadeau_rouge'];
  if(cd&&cd.naturalWidth){g.fillStyle='rgba(8,14,46,.65)';rrect(g,10*u,H-84*u,200*u,72*u,36*u);g.fill();g.drawImage(cd,20*u,H-78*u,60*u,60*u);g.fillStyle='#fff';g.font=`bold ${40*u}px Georgia,serif`;g.textBaseline='middle';g.fillText('× '+s.score,92*u,H-46*u)}
}
/* ---- la partie : boucle commune à tous les mini-jeux ----
   cfg = { nouveau(easy), maj(s,dt), dessin(g,s,W,H,tm), hud(g,s,W,H,me,tm), pointeur(s,fraction), cle(s,dir), evenement(e,s,fx,cv), intro:[titre,ligne1,ligne2], fin(s) } */
function mjRunner(me,cfg){
  return new Promise(async res=>{
    await mjLoad();
    const easy=PLAYERS[me].name==='Alix';MJ.active=true;document.body.classList.add('mjOn');
    const el=ov('<canvas class="mjc"></canvas>','mj'),cv=el.querySelector('canvas'),g=cv.getContext('2d');
    const H=720,W=Math.round(H*Math.max(1.5,BW/BH));cv.width=W;cv.height=H;
    const s=cfg.nouveau(easy);
    let state='intro',tIntro=0,last=performance.now(),tm=0,raf=0,endT=0,fx=[],parts=[],flash=0;
    const setX=cx=>{const r=cv.getBoundingClientRect();cfg.pointeur&&cfg.pointeur(s,(cx-r.left)/r.width,W)};
    cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(_){}setX(e.clientX);if(state==='intro'&&tIntro>.6){state='count';tIntro=0}else if(state==='play'&&cfg.tap){const r=cv.getBoundingClientRect();cfg.tap(s,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,W,H)}});
    let down=false;cv.addEventListener('pointerdown',()=>{down=true});const fin=()=>{if(down&&cfg.up&&state==='play')cfg.up(s);down=false};cv.addEventListener('pointerup',fin);cv.addEventListener('pointercancel',fin);
    cv.addEventListener('pointermove',e=>{if(state!=='intro')setX(e.clientX);if(down&&state==='play'&&cfg.drag){const r=cv.getBoundingClientRect();cfg.drag(s,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,W,H)}});
    const key=e=>{if(state==='intro'){if(tIntro>.6){state='count';tIntro=0}return}if(cfg.clavier){cfg.clavier(s,e.key);return}if(!cfg.cle)return;if(e.key==='ArrowLeft')cfg.cle(s,-1);else if(e.key==='ArrowRight')cfg.cle(s,1)};
    window.addEventListener('keydown',key);
    AE.init&&AE.init();
    let croix=null;
    if(MJ.test){croix=document.createElement('button');croix.textContent='✕';croix.setAttribute('aria-label','Fermer');croix.style.cssText='position:absolute;left:1.2%;top:24%;width:56px;height:56px;border-radius:50%;border:3px solid #fff;background:rgba(190,30,30,.9);color:#fff;font:bold 30px sans-serif;z-index:5;cursor:pointer';croix.addEventListener('pointerdown',e=>{e.stopPropagation()});croix.addEventListener('click',e=>{e.stopPropagation();finish('x')});el.appendChild(croix)}
    const finish=ok=>{MJ.active=false;document.body.classList.remove('mjOn');cancelAnimationFrame(raf);window.removeEventListener('keydown',key);res(ok)};
    function countdown(){
      const left=state==='play'?Math.max(0,Math.ceil(s.D-s.t)):Math.round(s.D),u=H/720,low=left<=5&&state==='play',pul=low?1+.12*Math.abs(Math.sin(tm*6)):1,cx=W/2,cy=112*u,r=40*u*pul;
      g.save();g.fillStyle=low?'rgba(190,30,30,.85)':'rgba(8,14,46,.7)';g.beginPath();g.arc(cx,cy,r,0,6.283);g.fill();
      g.strokeStyle='#fff';g.lineWidth=4*u;g.beginPath();g.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+6.283*Math.max(0,Math.min(1,state==='play'?1-s.t/s.D:1)));g.stroke();
      g.fillStyle='#fff';g.font=`bold ${(left>=10?44:50)*u*pul}px Georgia,serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(String(left),cx,cy+2*u);g.restore();
    }
    function txt(t,y,size,col){g.textAlign='center';g.textBaseline='middle';g.font=`italic 900 ${size}px Georgia,serif`;g.lineWidth=size*.12;g.strokeStyle='#6b3d00';g.strokeText(t,W/2,y);g.fillStyle=col||'#ffe48a';g.fillText(t,W/2,y)}
    const COL=['#ff3b3b','#ffd23a','#3ad06a','#3aa0ff','#ff6ad5','#ffffff','#ff9a2e'];
    function boom(second){
      const pts=second?[[.2,.4],[.8,.4],[.5,.25]]:[[.5,.55],[.15,.7],[.85,.7],[.5,.2]];
      for(const [px,py] of pts)for(let i=0;i<70;i++){
        const a=Math.random()*6.283,v=H*(.5+Math.random()*1.5);
        parts.push({x:px*W,y:py*H,vx:Math.cos(a)*v,vy:Math.sin(a)*v-H*.25,w:H*(.012+Math.random()*.014),h:H*(.022+Math.random()*.02),r:Math.random()*6,vr:(Math.random()-.5)*16,c:COL[Math.floor(Math.random()*COL.length)],life:2.2+Math.random()*1.2,age:0,star:Math.random()<.25});
      }
      flash=1;
    }
    function boomDraw(dt){
      for(const q of parts){q.age+=dt;q.vy+=H*1.1*dt;q.vx*=1-1.1*dt;q.vy*=1-.5*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=q.vr*dt}
      parts=parts.filter(q=>q.age<q.life&&q.y<H*1.1);
      for(const q of parts){
        g.save();g.globalAlpha=Math.min(1,(q.life-q.age)*1.5);g.translate(q.x,q.y);g.rotate(q.r);g.fillStyle=q.c;
        if(q.star){g.beginPath();for(let i=0;i<10;i++){const rr=i%2?q.w*.6:q.w*1.4,aa=i*Math.PI/5;g.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr)}g.fill()}
        else g.fillRect(-q.w/2,-q.h/2,q.w,q.h*Math.abs(Math.cos(q.r*2)+.15));
        g.restore();
      }
    }
    function giftShow(t){
      const im=MJ.img.B2_cadeau_rouge||MJ.img.B1_cadeau_rouge;if(!im||!im.naturalWidth)return;
      // rayons de lumière
      g.save();g.translate(W/2,H*.5);g.rotate(t*.8);
      for(let i=0;i<14;i++){g.rotate(Math.PI/7);g.fillStyle='rgba(255,230,120,'+(.28*Math.min(1,t*3))+')';g.beginPath();g.moveTo(0,0);g.lineTo(H*.9,-H*.05);g.lineTo(H*.9,H*.05);g.fill()}
      g.restore();
      // onde de choc
      if(t<.7){g.strokeStyle='rgba(255,255,255,'+(1-t/.7)+')';g.lineWidth=H*.03*(1-t/.7)+2;g.beginPath();g.arc(W/2,H*.5,H*.1+t*H*1.6,0,6.283);g.stroke()}
      // le cadeau jaillit avec un rebond
      const k=Math.min(1,t/.55),sc=k<1?(1-Math.pow(1-k,3))*1.25-Math.sin(k*3.14)*.0:1.0+Math.sin(Math.min(1,(t-.55)/.5)*6.283)*.06*Math.max(0,1-(t-.55));
      const h=H*.55*Math.max(.01,k<1?1.2*k*k*(3-2*k)*(1+.25*Math.sin(k*3.14)):1+Math.sin(t*5)*.03),w=h*im.naturalWidth/im.naturalHeight;
      g.save();g.translate(W/2,H*.5+(k<1?(1-k)*H*.25:Math.sin(t*4)*H*.01));g.rotate(Math.sin(t*6)*.06*Math.max(0,1.2-t));g.shadowColor='#ffe48a';g.shadowBlur=H*.08;g.drawImage(im,-w/2,-h/2,w,h);g.restore();
    }
    function loop(now){
      const dt=Math.min(.05,(now-last)/1000);last=now;tm+=dt;
      if(state==='play'){
        cfg.maj(s,dt);
        for(const e of s.ev)cfg.evenement(e,s,fx,cv);
        if(s.ev.length)setTimeout(()=>{cv.style.transform=''},120);
        s.ev.length=0;
        if(s.done){state='end';endT=0;if(s.done==='win'){AE.bells&&AE.bells();AE.pops&&AE.pops(8,.9);boom();setTimeout(()=>{AE.bells&&AE.bells()},350);setTimeout(()=>{boom(1)},550)}else AE.sad&&AE.sad()}
      }else if(state==='intro')tIntro+=dt;
      else if(state==='count'){tIntro+=dt;if(tIntro>=2.4){state='play'}}
      else if(state==='end'){endT+=dt;if(endT>(s.done==='win'?3.6:2.4))return finish(s.done==='win')}
      g.clearRect(0,0,W,H);cfg.dessin(g,s,W,H,tm);cfg.hud(g,s,W,H,me,tm);
      for(const f of fx){f.t+=dt;const i=MJ.img.B6_nuage;if(i&&i.naturalWidth&&f.t<.7){const sc=H*.2*(1+f.t*1.4);g.globalAlpha=1-f.t/.7;g.drawImage(i,f.x*W-sc/2,H*f.y-sc*(.4+f.t),sc,sc*i.naturalHeight/i.naturalWidth);g.globalAlpha=1}}
      fx=fx.filter(f=>f.t<.7);
      if((state==='play'||state==='count')&&!s.notimer)countdown();
      if(state==='intro'){
        g.fillStyle='rgba(6,10,36,.72)';g.fillRect(0,0,W,H);
        txt(cfg.intro[0],H*.22,H*.11);
        g.fillStyle='#fff';g.font=`bold ${H*.05}px Georgia,serif`;g.textAlign='center';
        g.fillText(cfg.intro[1],W/2,H*.34);
        g.fillText(cfg.intro[2],W/2,H*.41);
        const dd=MJ.img.B6_doigt,off=Math.sin(tm*2.6)*W*.12;
        if(dd&&dd.naturalWidth){const h=H*.2;g.drawImage(dd,W/2+off-h*.35,H*.48,h*dd.naturalWidth/dd.naturalHeight,h)}
        if(tIntro>.6){g.globalAlpha=.6+.4*Math.sin(tm*5);txt('Touche pour partir !',H*.80,H*.08,'#fff');g.globalAlpha=1}
      }else if(state==='count'){
        const n=3-Math.floor(tIntro/.8);
        if(n>0)txt(String(n),H*.42,H*.30*(1-((tIntro%.8)/.8)*.25));else txt('Go !',H*.42,H*.2,'#9dffb0');
      }else if(state==='end'){
        g.fillStyle='rgba(6,10,36,.45)';g.fillRect(0,0,W,H);
        if(s.done==='win'){giftShow(endT);txt('BRAVO !',H*.14,H*.15);boomDraw(dt);
          if(flash>0){g.fillStyle='rgba(255,255,255,'+flash*.8+')';g.fillRect(0,0,W,H);flash=Math.max(0,flash-dt*3.5)}
          if(endT<.5)cv.style.transform='translate('+(Math.random()*20-10)*(1-endT*2)+'px,'+(Math.random()*14-7)*(1-endT*2)+'px)';else cv.style.transform=''}
        else txt(s.done==='temps'?'Trop tard…':'Oh non…',H*.45,H*.16,'#ffb0a0');
      }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  });
}
function mjTraineau(me){
  return mjRunner(me,{
    nouveau:mjNew,maj:mjUpdate,dessin:mjDraw,hud:mjHud,
    pointeur:(s,f,W)=>{const wx=((f*W)-W/2)/(W*.42*MJ_ZS);s.tx=Math.max(-1.05,Math.min(1.05,wx))},
    cle:(s,d)=>{s.tx=Math.max(-1.05,Math.min(1.05,s.tx+d*.35))},
    evenement:(e,s,fx,cv)=>{
      if(e.k==='hit'){AE.nope&&AE.nope();fx.push({t:0,x:.5+s.x*.42*MJ_ZS,y:.62});cv.style.transform='translate('+(Math.random()*16-8)+'px,'+(Math.random()*10-5)+'px)'}
      else AE.pops&&AE.pops(e.k==='etoile'?5:3,.5);
    },
    intro:['Guide le traîneau !','Glisse ton doigt à gauche et à droite','pour éviter les arbres et les rochers']
  });
}
/* Liste des mini-jeux (ajouter ici chaque nouveau mini-jeu) */
function mjListe(){return[
  {id:'traineau',nom:'🛷 Traîneau',fn:mjTraineau,emo:'🛷'},
  {id:'cadeaux',nom:'🎁 Cadeaux qui tombent',fn:mjCadeaux,emo:'🎁'},
  {id:'catapulte',nom:'🎯 Catapulte à boules de neige',fn:mjCatapulte,emo:'🎯'},
  {id:'course',nom:'🦌 La course du renne',fn:mjCourse,emo:'🦌'},
  {id:'traversee',nom:'🎅 La grande traversée',fn:mjTraversee,emo:'🎅'}
  // Bonhomme de neige retiré de la liste en v3.31 (ne fonctionnait pas bien) : le code reste dans 2-minijeu-bonhomme.js
  //,{id:'bonhomme',nom:'⛄ Bonhomme de neige',fn:mjBonhomme,emo:'⛄'}
]}
const mjDernier={};   // dernier mini-jeu joué par chaque joueur (jamais deux fois de suite le même pour un joueur)
function mjChoisir(me){const L=mjListe(),ch=L.length>1?L.filter(x=>x.id!==mjDernier[me]):L,jeu=ch[Math.floor(Math.random()*ch.length)];mjDernier[me]=jeu.id;return jeu}
/* Cadeau « sous condition » : un mini-jeu au hasard (jamais deux fois le même d'affilée), 2 essais */
async function mjCase(me){
    let jeu=mjChoisir(me);
  for(let essai=0;essai<2;essai++){
    if(essai===1)jeu=mjChoisir(me);
    const ok=await jeu.fn(me);clearUI();
    if(ok)return true;
    if(essai===0){
      const el=ov(`<div class="emo">${jeu.emo}</div><h2>Raté !</h2><div class="sub">${av(me)} ${nm(me)}, une deuxième chance, avec un autre jeu !</div>${tapHint()}`,'light');
      await waitTap(el,700);clearUI();
    }
  }
  return false;
}
/* Menu de test (écran des réglages) : lancer un mini-jeu sans tourner la roue */
async function mjMenu(){
  const alix=PLAYERS.findIndex(p=>p.name==='Alix');
  let msg='Choisis un mini-jeu à essayer';
  while(true){
    const L=mjListe();
    const el=ov(`<h2>🎮 Tester les mini-jeux</h2><div class="sub s">${msg}</div>
      ${L.map(j=>`<div class="btnRow"><button class="btn g" data-t="${j.id}:0">${j.nom} · adultes</button><button class="btn g" data-t="${j.id}:${alix}">${j.nom} · Alix (facile)</button></div>`).join('')}
      <div class="btnRow"><button class="btn r" data-t="x">↩️ Retour aux réglages</button></div>`);
    const t=await new Promise(r=>el.addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(b)r(b.dataset.t)}));
    clearUI();
    if(t==='x')return;
    const [id,pl]=t.split(':'),jeu=L.find(j=>j.id===id);
    MJ.test=true;const ok=await jeu.fn(+pl);MJ.test=false;clearUI();
    if(ok==='x'){msg='Choisis un mini-jeu à essayer';continue}
    msg=ok?'✅ Réussi ! Tu veux rejouer ?':'❌ Raté. Tu veux réessayer ?';
  }
}
window.MJ_TEST={mjDraw,mjChoisir,mjNew,mjUpdate,mjTraineau,mjCadeaux,mjlNew,mjlUpdate,mjlTap,mjLutins,mjBonhomme,mjbNew,mjbUpdate,mjbTap,mjbMove,mjbUp,mjbaNew,mjbaUpdate,mjbaTap,mjbaMove,mjbaUp,mjTraversee,mjtNew,mjtUpdate,mjtHop,mjtDraw,mjCatapulte,mjkNew,mjkUpdate,mjkTir,mjkLance,mjkPos,mjkDraw,mjCourse,mjrNew,mjrUpdate,mjrJump,mjrDown,mjrUp,mjrDrag,mjrSlide,mjrKey,mjrBox,mjrPano,mjrDraw,mjLoad,MJ,MJR_AIR,mjMenu};
