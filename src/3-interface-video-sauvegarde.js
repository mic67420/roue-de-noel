
/* ============ FIN DE PARTIE ============ */
async function showFinal(){
  busy=true;S.phase='end';S.current=-1;save();hud();
  const owner=S.players.findIndex(p=>p.gifts.includes('M'));
  AE.fanfare();confetti(200);
  finalTimer=setInterval(()=>confetti(45,{burst:false}),1500);
  const el=ov(`<h1>🎉 Fin de la partie ! 🎉</h1>
    <div class="finWrap"><div class="rows">${recapRows()}</div>
    <div class="finBox" id="finBox"><div class="mystGift" style="font-size:17vh">🎁</div>
      <div class="sub s">Le cadeau mystère est chez ${owner>=0?av(owner)+' '+nm(owner):'…'}</div>
      <button class="btn" id="fOpen">Ouvrir le cadeau mystère</button></div></div>
    <div class="btnRow"><button class="btn g" id="fUndo">↩️ Annuler le dernier lancer</button><button class="btn r" id="fNew">🆕 Nouvelle partie</button></div>`,'final');
  el.querySelector('#fOpen').onclick=async function(){
    this.disabled=true;const box=el.querySelector('#finBox');
    box.classList.add('shake');AE.drum(2.6);await sleep(2700);
    box.classList.remove('shake');AE.boom();AE.fanfare();flash(el);confetti(220);
    for(let i=0;i<8;i++)setTimeout(()=>firework(BW*(.1+.8*Math.random()),BH*(.1+.5*Math.random())),i*260);
    box.innerHTML=`<div class="mystGift" style="font-size:17vh">🎁</div><div class="sub">✨ ${owner>=0?av(owner)+' '+nm(owner):'Quelqu’un'} peut ouvrir le cadeau mystère ! ✨</div>`;
  };
  el.querySelector('#fUndo').onclick=()=>undo(true);
  el.querySelector('#fNew').onclick=()=>askNew();
}
function stopFinal(){if(finalTimer){clearInterval(finalTimer);finalTimer=null}}

/* ============ BOUTONS ============ */
function undo(force){
  if(!force&&(busy||!H.length))return;
  if(!H.length)return;
  stopFinal();clearUI();
  S=JSON.parse(H.pop());S.phase='bigReady';busy=false;
  big.zoom=big.zt=1;big.setSegs(S.layout);save();hud();AE.swap();toast('↩️ Dernier lancer annulé');
}
$('bUndo').onclick=()=>undo(false);
$('bRecap').onclick=()=>{
  if(busy)return;
  const m=modal(`<h2>📋 Récapitulatif</h2><div class="rows">${recapRows()}</div><div class="sub s">🔒 = cadeau protégé  ·  ? = cadeau mystère</div><button class="btn" id="rClose">Fermer</button>`);
  m.querySelector('#rClose').onclick=()=>m.remove();
};
$('bSon').onclick=volPanel;
$('bMus').onclick=()=>$('musicFile').click();
$('bNew').onclick=()=>{if(!busy)askNew()};
$('musicFile').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];
  if(f){toast(AE.setMusic(f)?'🎵 Musique chargée : '+f.name.slice(0,30):'⚠️ Musique impossible à lire');}
  e.target.value='';
});
function volPanel(){
  const m=modal(`<div class="panel"><h2>🔊 Son</h2>
    <div class="vrow">Effets<input type="range" id="vFx" min="0" max="100" value="${Math.round(AE.vol.fx*100)}"></div>
    <div class="vrow">Musique<input type="range" id="vMu" min="0" max="100" value="${Math.round(AE.vol.mus*100)}"></div>
    <div class="btnRow"><button class="btn" id="vMute"></button><button class="btn g" id="vFile">🎵 Choisir la musique</button><button class="btn" id="vPlay">⏯️ Pause / Lecture</button><button class="btn" id="vVid">🎬 Père Noël (vidéo)</button><button class="btn" id="vLum"></button></div>
    <div class="btnRow"><button class="btn r" id="vClose">Fermer</button></div></div>`);
  const mu=()=>m.querySelector('#vMute').textContent=AE.vol.mute?'🔇 Son coupé':'🔊 Son activé';mu();
  m.querySelector('#vFx').oninput=e=>AE.set('fx',e.target.value/100);
  m.querySelector('#vMu').oninput=e=>AE.set('mus',e.target.value/100);
  m.querySelector('#vMute').onclick=()=>{AE.set('mute',!AE.vol.mute);mu();hud()};
  m.querySelector('#vFile').onclick=()=>$('musicFile').click();
  m.querySelector('#vPlay').onclick=()=>{if(AE.hasMusic())AE.toggleMusic();else toast('Choisis d’abord un fichier musique')};
  m.querySelector('#vVid').onclick=()=>{m.remove();videoPanel()};
  const LN=['éteintes','faisceaux seuls','légères','complètes'],lum=()=>m.querySelector('#vLum').textContent='💡 Lumières : '+LN[LQ.q];lum();
  m.querySelector('#vLum').onclick=()=>{LQ.q=(LQ.q+3)%4;store.set(LUMKEY,LQ.q);sizeCanvases();lum();toast('💡 Lumières '+LN[LQ.q])};
  m.querySelector('#vClose').onclick=()=>{m.remove();hud()};
}
function askNew(){
  const m=modal(`<h2>Nouvelle partie ?</h2><div class="sub s">La partie en cours sera effacée.</div><div class="btnRow"><button class="btn r" id="nYes">Oui, tout effacer</button><button class="btn g" id="nNo">Non, continuer</button></div>`);
  m.querySelector('#nNo').onclick=()=>m.remove();
  m.querySelector('#nYes').onclick=()=>{m.remove();stopFinal();clearUI();store.del(KEY);saved=null;S=null;H=[];busy=false;showSettings()};
}

/* ============ REGLAGES ============ */
function showSettings(){
  showScreen('settings');
  const cfg=Object.assign({total:25,thr:3,boost:2},store.get(KEYCFG)||{});
  const el=$('settings');
  const lim={total:[6,40],thr:[0,10],boost:[1,5]};
  const draw=()=>{
    el.innerHTML=`<div class="panel"><h2>Réglages de la partie</h2>
      <div class="setRow"><div>Nombre de cadeaux<small>${cfg.total-1} cadeaux normaux + 1 cadeau mystère</small></div><div class="step"><button data-k="total" data-d="-1">−</button><b>${cfg.total}</b><button data-k="total" data-d="1">+</button></div></div>
      <div class="setRow"><div>Fin de partie « chaude » à partir de<small>cadeaux restants (les cases spéciales deviennent plus fréquentes)</small></div><div class="step"><button data-k="thr" data-d="-1">−</button><b>${cfg.thr}</b><button data-k="thr" data-d="1">+</button></div></div>
      <div class="setRow"><div>Multiplicateur des cases spéciales<small>1 = aucun changement</small></div><div class="step"><button data-k="boost" data-d="-1">−</button><b>×${cfg.boost}</b><button data-k="boost" data-d="1">+</button></div></div>
      ${installEv&&!isStandalone()?'<div class="btnRow"><button class="btn r" id="sInstall">📲 Installer l’application</button></div>':''}${(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!isStandalone())?'<div class="sub s">📲 iPhone : touche Partager, puis « Sur l’écran d’accueil »</div>':''}
      <div class="btnRow"><button class="btn g" id="sMus">🎵 Musique</button><button class="btn g" id="sVid">🎬 Père Noël (vidéo)</button><button class="btn" id="sGo">🎄 Lancer la partie</button></div>
      <div class="btnRow"><button class="btn g" id="sMJ">🎮 Tester les mini-jeux</button><button class="btn g" id="sMaj">🔄 Mettre à jour</button></div></div>`;
  };
  draw();
  el.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.k){const k=b.dataset.k;cfg[k]=clamp(cfg[k]+(+b.dataset.d),lim[k][0],lim[k][1]);draw();return}
    if(b.id==='sMus'){$('musicFile').click();return}
    if(b.id==='sInstall'){if(installEv){installEv.prompt();installEv.userChoice.finally(()=>{installEv=null;draw()})}return}
    if(b.id==='sVid'){videoPanel();return}
    if(b.id==='sMJ'){mjMenu();return}
    if(b.id==='sMaj'){b.textContent='⏳ Recherche…';majVerifier(true).then(r=>{if(r==='aucune'){b.textContent='✅ Déjà à jour (v'+VERSION+')'}else if(r==='erreur'){b.textContent='⚠️ Pas de connexion'}});return}
    if(b.id==='sGo'){store.set(KEYCFG,cfg);startNew(cfg)}
  };
}
function startNew(cfg){
  S=newState(cfg);H=[];busy=false;save();showScreen('game');hud();
}
function resume(){
  S=saved.S;H=saved.H||[];busy=false;
  if(['smallSpin'].includes(S.phase))S.phase='smallReady';
  if(['bigSpin','resolve'].includes(S.phase))S.phase='bigReady';
  if(S.phase==='bigReady'&&S.current<0)S.phase='smallReady';
  showScreen('game');hud();
  if(S.phase==='end')setTimeout(showFinal,600);
}

/* ============ INTRO ============ */
let introState='wait',introTimers=[];
const introAt=(ms,fn)=>introTimers.push(setTimeout(fn,ms));
function buildIntro(){
  $('introNames').innerHTML=PLAYERS.map(p=>`<div class="nm" style="--c:${p.col}"><i>${p.av}</i>${p.name}</div>`).join('');
  $('introTitle').innerHTML=[...'La Roue de Noël'].map((ch,i)=>`<span style="animation-delay:${(i*.09).toFixed(2)}s">${ch===' '?'&nbsp;':ch}</span>`).join('');
}
function runIntro(){
  introState='run';$('introHint').classList.add('off');bgT=0;AE.twinkle();
  introAt(3200,()=>{$('introTitle').classList.add('on');AE.fanfare();confetti(90,{x:BW/2,y:BH*.3})});
  introAt(6400,()=>document.querySelectorAll('#introNames .nm').forEach((e,i)=>introTimers.push(setTimeout(()=>{e.classList.add('on');AE.pop(i)},i*600))));
  introAt(10000,()=>document.querySelectorAll('#introRules li').forEach((e,i)=>introTimers.push(setTimeout(()=>e.classList.add('on'),i*700))));
  introAt(13200,introEnd);
}
function introEnd(){
  introTimers.forEach(clearTimeout);introTimers=[];introState='done';
  $('introTitle').classList.add('on');
  document.querySelectorAll('#introNames .nm').forEach(e=>{e.classList.add('on');e.style.opacity=1});
  document.querySelectorAll('#introRules li').forEach(e=>{e.classList.add('on');e.style.opacity=1});
  const cta=$('introCta');
  if(saved){
    cta.innerHTML=`<button class="btn g" id="cResume">▶️ Reprendre la partie</button><button class="btn" id="cNew">🆕 Nouvelle partie</button>`;
    cta.classList.add('on','two');
    $('cResume').onclick=resume;$('cNew').onclick=()=>showSettings();
  }else{
    cta.textContent='Appuie pour commencer';cta.classList.add('on');
  }
}
$('intro').addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  if(introState==='wait')runIntro();
  else if(introState==='run')introEnd();
  else if(introState==='done'&&!saved)showSettings();
});


/* ============ PERE NOEL (dessiné en vectoriel) ============ */
const sc=$('santa'),sgx=sc.getContext('2d');
const SN={st:'idle',t:0,phi:.55,off:.6,lean:0,phi0:.55,off0:.6};
function santaPush(){SN.st='wind';SN.t=0;SN.phi0=SN.phi;SN.off0=SN.off}
const eIO=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,lerp=(a,b,u)=>a+(b-a)*u;
function santaStep(dt){
  SN.t+=dt;let leanT=0;
  if(SN.st==='idle'){const f=Math.min(1,dt*3);SN.phi+=(.55+Math.sin(time*.9)*.05-SN.phi)*f;SN.off+=(.6-SN.off)*f}
  else if(SN.st==='wind'){const u=clamp(SN.t/.45,0,1);SN.phi=lerp(SN.phi0,.78,eIO(u));SN.off=lerp(SN.off0,0,eIO(u));leanT=-.06;if(u>=1){SN.st='push';SN.t=0}}
  else if(SN.st==='push'){const u=clamp(SN.t/.9,0,1);SN.phi=lerp(.78,-.45,1-Math.pow(1-u,2.6));SN.off=0;leanT=.09;if(u>=1){SN.st='rel';SN.t=0}}
  else{const u=clamp(SN.t/.8,0,1);SN.phi=lerp(-.45,.1,eIO(u));SN.off=lerp(0,1,u);leanT=0;if(u>=1){SN.st='idle';SN.t=0}}
  SN.lean+=(leanT-SN.lean)*Math.min(1,dt*6);
}
function ik(sx,sy,tx,ty,l1,l2){
  let dx=tx-sx,dy=ty-sy,d=Math.hypot(dx,dy);const mx=l1+l2-.01;
  if(d>mx){dx*=mx/d;dy*=mx/d;d=mx}
  if(d<.5)d=.5;
  const a=Math.atan2(dy,dx),c=clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1),b=Math.acos(c);
  return{ex:sx+Math.cos(a+b)*l1,ey:sy+Math.sin(a+b)*l1,wx:sx+dx,wy:sy+dy};
}
function fur(g,pts,r,seed){
  const cols=['#ffffff','#f4f6fb','#e6e9f2','#d3d9e6','#fafbfe'];
  pts.forEach((p,i)=>{for(let j=0;j<4;j++){
    const a=((i*7+j*13+seed)%11)/11-.5,b=((i*5+j*17+seed)%13)/13-.5;
    g.fillStyle=cols[(i*3+j)%5];g.beginPath();g.arc(p[0]+a*r*1.5,p[1]+b*r*1.5,r*(.7+((i+j)%3)*.16),0,7);g.fill();
  }});
}
function dens(p,n){const o=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];for(let k=0;k<n;k++)o.push([lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n)])}return o}
const samp=(f,n)=>Array.from({length:n+1},(_,i)=>f(i/n));
function limb(g,a,b,w,c1,c2){
  g.lineCap='round';g.strokeStyle=c2;g.lineWidth=w+1.6;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
  g.strokeStyle=c1;g.lineWidth=w;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
  g.strokeStyle='rgba(255,140,150,.35)';g.lineWidth=w*.25;g.beginPath();g.moveTo(a[0]-w*.18,a[1]-w*.18);g.lineTo(b[0]-w*.18,b[1]-w*.18);g.stroke();
}
function leg(g,x,dark){
  const tg=g.createLinearGradient(x-6,0,x+9,0);tg.addColorStop(0,dark?'#5a0814':'#7a0b1c');tg.addColorStop(.6,dark?'#9a1126':'#c8142d');tg.addColorStop(1,dark?'#6a0a18':'#8a0d1f');
  g.fillStyle=tg;g.beginPath();g.moveTo(x-6,-37);g.lineTo(x+8.5,-37);g.lineTo(x+9,-10);g.lineTo(x-5.5,-10);g.closePath();g.fill();
  g.fillStyle='#f4f6fb';rrect(g,x-6.5,-12,16.5,4,2);g.fill();
  const bg=g.createLinearGradient(0,-9,0,0);bg.addColorStop(0,'#2b2b33');bg.addColorStop(1,'#08080b');
  g.fillStyle=bg;g.beginPath();g.moveTo(x-5.5,-9);g.lineTo(x+8.5,-9);g.lineTo(x+9,-4);g.quadraticCurveTo(x+19,-4,x+19,0);g.lineTo(x-6,0);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=.6;g.beginPath();g.moveTo(x-4,-7.5);g.lineTo(x+7,-7.5);g.stroke();
}
function santaBack(g){
  leg(g,-9,true);leg(g,5,false);
  // bras arrière (main sur la hanche)
  limb(g,[-4,-67],[-18,-56],9,'#8d0f22','#4e0612');limb(g,[-18,-56],[-10,-45],8.6,'#8d0f22','#4e0612');
  fur(g,samp(t=>[lerp(-13,-10.5,t),lerp(-47,-45,t)],3),2.5,3);
  g.fillStyle='#16161b';g.beginPath();g.arc(-8.5,-43.5,4,0,7);g.fill();
  // manteau
  g.beginPath();g.moveTo(-15,-72);g.bezierCurveTo(-27,-62,-26,-46,-19,-33);g.lineTo(21,-33);g.bezierCurveTo(29,-46,27,-62,14,-72);g.bezierCurveTo(6,-77,-6,-77,-15,-72);g.closePath();
  const cg=g.createLinearGradient(-26,0,28,0);cg.addColorStop(0,'#620916');cg.addColorStop(.4,'#c0132b');cg.addColorStop(.75,'#e12a41');cg.addColorStop(1,'#8a0d1f');
  g.fillStyle=cg;g.fill();g.strokeStyle='rgba(40,0,6,.45)';g.lineWidth=.8;g.stroke();
  const vg=g.createLinearGradient(0,-77,0,-33);vg.addColorStop(0,'rgba(255,255,255,.14)');vg.addColorStop(.5,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=vg;g.fill();
  g.strokeStyle='rgba(50,0,8,.4)';g.lineWidth=.9;
  [[-8,-62,-10,-48],[2,-66,3,-52],[-14,-55,-15,-40]].forEach(([a,b,c,d])=>{g.beginPath();g.moveTo(a,b);g.quadraticCurveTo((a+c)/2-2,(b+d)/2,c,d);g.stroke()});
  fur(g,[[14,-70],[18.5,-63],[22.5,-54],[24.5,-45],[23,-37.5],[20,-34]],3.3,5);
  fur(g,samp(t=>[lerp(-19,21,t),-33.5+Math.sin(t*Math.PI)*1.6],12),3,9);
  // ceinture
  const bt=g.createLinearGradient(0,-48,0,-41);bt.addColorStop(0,'#3a3a44');bt.addColorStop(.5,'#101014');bt.addColorStop(1,'#050507');
  g.fillStyle=bt;g.beginPath();g.moveTo(-22,-47);g.quadraticCurveTo(2,-44.5,26,-47);g.lineTo(26,-41);g.quadraticCurveTo(2,-38.5,-22,-41);g.closePath();g.fill();
  const bk=g.createLinearGradient(5,-49,14,-39);bk.addColorStop(0,'#fff3b8');bk.addColorStop(.5,'#e0ac3a');bk.addColorStop(1,'#8a5a10');
  g.fillStyle=bk;rrect(g,5.5,-48.6,10,8.6,1.4);g.fill();g.fillStyle='#17110a';rrect(g,8,-46.2,5,3.8,.8);g.fill();
}
function santaFront(g){
  // tête
  const sk=g.createRadialGradient(8,-84,1,5,-81,10);sk.addColorStop(0,'#f6cdb0');sk.addColorStop(1,'#d39274');
  g.fillStyle=sk;g.beginPath();g.ellipse(5,-81.5,8.4,9,0,0,7);g.fill();
  const ck=g.createRadialGradient(9.5,-78.5,0,9.5,-78.5,4.6);ck.addColorStop(0,'rgba(235,110,100,.55)');ck.addColorStop(1,'rgba(235,110,100,0)');g.fillStyle=ck;g.beginPath();g.arc(9.5,-78.5,4.6,0,7);g.fill();
  // barbe
  const bd=[[-3.5,-79],[-6.8,-75],[-8.2,-70],[-6,-64.5],[-1.5,-60],[5,-57.5],[11,-59],[15.5,-63.5],[18,-69.5],[16.5,-74.5],[13,-77.2]];
  g.beginPath();bd.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();
  const bgd=g.createLinearGradient(-8,-80,18,-58);bgd.addColorStop(0,'#ffffff');bgd.addColorStop(.55,'#eceff6');bgd.addColorStop(1,'#c9d0e0');g.fillStyle=bgd;g.fill();
  g.lineCap='round';
  for(let i=0;i<34;i++){
    const t=i/33,x0=lerp(-5.5,16,t)+Math.sin(i*12.9)*.8,y0=-77+Math.sin(i*3.1)*1.2,x1=x0+Math.sin(i*7.7)*1.6+ (t-.4)*3,y1=-60-Math.abs(Math.sin(i*5.3))*2.5;
    g.strokeStyle=i%3?'rgba(175,185,208,.45)':'rgba(255,255,255,.8)';g.lineWidth=.55;g.beginPath();g.moveTo(x0,y0);g.quadraticCurveTo((x0+x1)/2+Math.sin(i)*1.8,(y0+y1)/2,x1,y1);g.stroke();
  }
  fur(g,dens(bd,3),2,2);
  // moustache + nez
  g.save();g.translate(12,-75.6);g.rotate(.2);fur(g,[[-5.5,0],[-3,.4],[-.5,.9],[2,.6],[4.5,.1],[7,-.6]],2.1,4);g.restore();
  const ns=g.createRadialGradient(12.4,-80.2,.3,12.8,-79.4,3);ns.addColorStop(0,'#f6a898');ns.addColorStop(1,'#d9776a');g.fillStyle=ns;g.beginPath();g.arc(12.8,-79.2,2.6,0,7);g.fill();
  g.fillStyle='#fff';g.beginPath();g.ellipse(9.4,-83.6,2.1,1.6,0,0,7);g.fill();g.fillStyle='#1b2a3a';g.beginPath();g.arc(9.9,-83.6,1.15,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(10.2,-84,.4,0,7);g.fill();
  g.strokeStyle='#f2f4fa';g.lineWidth=2.1;g.lineCap='round';g.beginPath();g.moveTo(5.5,-86.8);g.quadraticCurveTo(9.2,-88.4,12.4,-86.4);g.stroke();
  // bonnet
  const hg=g.createLinearGradient(-10,-100,16,-88);hg.addColorStop(0,'#8a0d1f');hg.addColorStop(.6,'#d11a33');hg.addColorStop(1,'#a50f26');
  g.fillStyle=hg;g.beginPath();g.moveTo(-5,-87);g.bezierCurveTo(-4,-101,8,-106,14,-96);g.bezierCurveTo(16,-92,16.5,-90,16.5,-87);g.closePath();g.fill();
  g.beginPath();g.moveTo(-3,-101);g.bezierCurveTo(-14,-105,-23,-98,-21,-90);g.bezierCurveTo(-18,-95,-10,-96,-1,-95);g.closePath();g.fill();
  fur(g,samp(t=>[lerp(-6.5,17,t),-87.8+Math.sin(t*Math.PI)*1.2],16),2.3,11);fur(g,[[-21,-89.5],[-19,-87.5],[-22.5,-88],[-20,-91],[-23,-90]],2.6,13);
}
function santaArm(g,P){
  // bras avant (cinématique inverse jusqu'à la roue)
  const SX=7,SY=-65,gx=P.hx,gy=P.hy,gd=Math.hypot(gx-SX,gy-SY)||1,ux=(gx-SX)/gd,uy=(gy-SY)/gd;
  const w=ik(SX,SY,gx-ux*4.6,gy-uy*4.6,24,23);
  limb(g,[SX,SY],[w.ex,w.ey],9.4,'#c0132b','#5b0714');limb(g,[w.ex,w.ey],[w.wx,w.wy],8.8,'#c0132b','#5b0714');
  const fx=w.wx-w.ex,fy=w.wy-w.ey,fl=Math.hypot(fx,fy)||1,fdx=fx/fl,fdy=fy/fl;
  fur(g,samp(t=>[w.wx-fdx*(4-t*4),w.wy-fdy*(4-t*4)],4),3.3,17);
  const hx=w.wx+fdx*4.2,hy=w.wy+fdy*4.2,gl=g.createRadialGradient(hx-1,hy-1,.5,hx,hy,5);gl.addColorStop(0,'#4a4a55');gl.addColorStop(1,'#0b0b0e');
  g.fillStyle=gl;g.beginPath();g.arc(hx,hy,4.6,0,7);g.fill();g.beginPath();g.ellipse(hx+fdy*3,hy-fdx*3,2.2,3.4,Math.atan2(fdy,fdx),0,7);g.fill();
}
let SCA=null;
function santaCache(k){
  const kk=Math.max(.5,k*DPR),key=Math.round(kk*100);
  if(SCA&&SCA.key===key)return SCA;
  const mk=fn=>{const c=document.createElement('canvas');c.width=Math.ceil(66*kk);c.height=Math.ceil(118*kk);const x=c.getContext('2d');x.translate(34*kk,112*kk);x.scale(kk,kk);fn(x);return c};
  SCA={key,back:mk(santaBack),front:mk(santaFront)};return SCA;
}
function drawSanta(g,P){
  const C=santaCache(P.k);
  g.save();g.translate(P.px,P.py);g.scale(P.k,P.k);
  g.fillStyle='rgba(0,0,0,.38)';g.beginPath();g.ellipse(4,0,25,3.4,0,0,7);g.fill();
  g.rotate(P.lean);
  g.drawImage(C.back,-34,-112,66,118);
  santaArm(g,P);
  g.drawImage(C.front,-34,-112,66,118);
  g.restore();
}
function santaDraw(){
  sgx.setTransform(DPR,0,0,DPR,0,0);sgx.clearRect(0,0,BW+4,BH);
  const wb=$('wheelBox').getBoundingClientRect();if(!wb.width||wb.width<10)return;
  const cx=wb.left+wb.width/2,cy=wb.top+wb.height/2,R=wb.width*.385,k=BH*.56/100;
  if(VID.ready){vidDrawTo(sgx,BH,cx,cy,R);return}
  if(!VID.cfg.vector)return;
  const shx=Math.max(BH*.12,cx-1.14*R-.14*BH),px=shx-9*k,py=BH*.985;
  const rr=R*(1.14+.45*SN.off),hx=cx-rr*Math.cos(SN.phi),hy=cy+rr*Math.sin(SN.phi);
  let lx=(hx-px)/k,ly=(hy-py)/k;const lean=SN.lean+Math.sin(time*1.7)*.004,cl=Math.cos(lean),sl=Math.sin(lean);
  drawSanta(sgx,{px,py,k,lean,hx:lx*cl+ly*sl,hy:-lx*sl+ly*cl});
}


/* ============ PERE NOEL EN VIDEO : attente en boucle + lancer au clic (détourage du fond vert en direct) ============ */
const KEYVID='roueNoel_video3';
const VID={clips:{idle:{el:null,ready:false,url:null},thr:{el:null,ready:false,url:null}},cur:'idle',ready:false,
  wc:null,ctx:null,fc:null,fctx:null,w:0,h:0,dirty:true,keys:{},keyTry:0,prev:null,fade:null,acc:0,pick:'thr',idleAt:5.125,status:'',
  cfg:Object.assign({push:2.2,sens:3,crop:0,scale:66,pos:75,handY:18,flip:false,vector:false},store.get(KEYVID)||{})};
function vidSave(){store.set(KEYVID,VID.cfg);VID.dirty=true}
function vidSetStatus(t){VID.status=t;const m=MOD.querySelector('#vMsg');if(m&&!VID.ready)m.textContent=t}
function vidMake(name){
  const c=VID.clips[name];if(c.el)return c.el;
  const v=document.createElement('video');
  v.muted=true;v.defaultMuted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('muted','');
  v.preload='auto';v.loop=(name==='idle');
  v.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1';
  document.body.appendChild(v);c.el=v;
  ['loadedmetadata','loadeddata','canplay'].forEach(ev=>v.addEventListener(ev,()=>vidClipReady(name)));
  v.addEventListener('seeked',()=>{VID.dirty=true});
  if(name==='thr')v.addEventListener('ended',()=>{
    if(VID.clips.idle.ready)vidSwitch('idle',VID.idleAt);
    else{try{v.currentTime=0}catch(e){}VID.dirty=true}
  });
  v.addEventListener('error',()=>{c.ready=false;const e=v.error?v.error.code:0;vidSetStatus('Vidéo « '+(name==='idle'?'attente':'lancer')+' » non lisible (code '+e+').');if(!c.quiet)toast('⚠️ Vidéo illisible : essaie un MP4 (H.264)')});
  return v;
}
function vidLoad(name,file,quiet){
  try{
    const c=VID.clips[name],v=vidMake(name);
    c.ready=false;c.quiet=!!quiet;VID.keys[name]=null;VID.keyTry=0;VID.ready=VID.clips.idle.ready||VID.clips.thr.ready;vidSetStatus('Chargement de la vidéo…');
    if(c.url)URL.revokeObjectURL(c.url);
    c.url=URL.createObjectURL(file);v.src=c.url;v.load();
    return true;
  }catch(e){return false}
}
function b64blob(b64,type){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type})}
function vidEmbedded(){
  try{
    const t=document.createElement('video');
    const mp4=!!t.canPlayType('video/mp4; codecs="avc1.640028"')||!!t.canPlayType('video/mp4; codecs="avc1.42E01E"');
    const webm=!!t.canPlayType('video/webm; codecs="vp9"');
    [['idle','SANTA_IDLE'],['thr','SANTA_THR']].forEach(([name,key])=>{
      const m=window[key+'_MP4'],w=window[key+'_WEBM'];let data=null,type='';
      if(mp4&&typeof m==='string'&&m){data=m;type='video/mp4'}
      else if(webm&&typeof w==='string'&&w){data=w;type='video/webm'}
      else if(typeof m==='string'&&m){data=m;type='video/mp4'}
      if(data)vidLoad(name,b64blob(data,type),true);
    });
  }catch(e){vidSetStatus('Erreur vidéo intégrée.')}
}
// iPhone/Safari : la 1re lecture doit venir d'un contact de l'utilisateur => on « amorce » les vidéos au premier toucher
function vidPrime(){
  ['idle','thr'].forEach(name=>{
    const c=VID.clips[name],v=c.el;if(!v||!c.ready||c.primed)return;
    c.primed=true;
    try{
      const p=v.play();
      if(name==='idle'){if(VID.cur!=='idle'&&p&&p.then)p.then(()=>v.pause()).catch(()=>{})}
      else if(p&&p.then)p.then(()=>{if(VID.cur!=='thr'){v.pause();try{v.currentTime=0}catch(e){}}}).catch(()=>{c.primed=false});
    }catch(e){c.primed=false}
  });
}
['pointerdown','touchend','click'].forEach(ev=>document.addEventListener(ev,vidPrime,{capture:true,passive:true}));
function vidClipReady(name){
  const c=VID.clips[name],v=c.el;
  if(!v||!v.videoWidth||(c.ready&&c.readyUrl===c.url))return;
  c.readyUrl=c.url;c.ready=true;
  if(!VID.wc){ // les deux séquences ont le même cadrage : on dimensionne le détourage sur la première prête
    const vw=v.videoWidth,vh=v.videoHeight,sc=Math.min(1,480/Math.max(vw,vh));
    VID.w=Math.max(16,Math.round(vw*sc));VID.h=Math.max(16,Math.round(vh*sc));
    VID.wc=document.createElement('canvas');VID.wc.width=VID.w;VID.wc.height=VID.h;VID.ctx=VID.wc.getContext('2d',{willReadFrequently:true});
    VID.fc=document.createElement('canvas');VID.fc.width=VID.w;VID.fc.height=VID.h;VID.fctx=VID.fc.getContext('2d');
    VID.sc=document.createElement('canvas');VID.sc.width=VID.w;VID.sc.height=VID.h;VID.sctx=VID.sc.getContext('2d',{willReadFrequently:true});
  }
  VID.ready=true;VID.dirty=true;
  if(name==='idle'){if(VID.cur==='idle'){try{const p=v.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}}
  else{if(!VID.clips.idle.ready)VID.cur='thr';try{v.currentTime=0}catch(e){}}
  if(!c.quiet)toast('🎬 Vidéo chargée');c.quiet=false;
}
function vidSwitch(name,t){
  const c=VID.clips[name];if(!c||!c.ready)return false;
  if(VID.wc&&VID.cur!==name){VID.fctx.clearRect(0,0,VID.w,VID.h);VID.fctx.drawImage(VID.wc,0,0);VID.fade={t:0,dur:.3}}   // fondu enchaîné
  const old=VID.clips[VID.cur];if(old&&old!==c&&old.el){try{old.el.pause()}catch(e){}}
  VID.cur=name;VID.fullNext=true;VID.lastT=-1;
  try{if(t!=null)c.el.currentTime=t}catch(e){}
  try{const p=c.el.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}
  VID.dirty=true;return true;
}
// Mesure la couleur du fond vert sur le pourtour de l'image (6 points). Renvoie null si l'image n'est pas encore valide
// (vide, noire, pas encore décodée : cela arrive sur certains téléphones juste après le chargement de la vidéo).
const VID_FOND_DEFAUT=[52,177,75];   // couleur réelle du fond des vidéos du jeu, utilisée si aucune mesure n'aboutit
function vidMeasureKey(sg,w,h){
  const P=Math.max(4,Math.round(w*.02)),pts=[[0,0],[w-P,0],[0,h-P],[w-P,h-P],[Math.round(w/2-P/2),0],[0,Math.round(h/2)]],ok=[];
  pts.forEach(([x0,y0])=>{
    const d=sg.getImageData(x0,y0,P,P).data;let r=0,g=0,b=0,a=0,n=0;
    for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];a+=d[i+3];n++}
    r/=n;g/=n;b/=n;a/=n;
    if(a>250&&g>r+25&&g>b+25)ok.push([r,g,b]);
  });
  if(ok.length<3)return null;
  const med=i=>{const v=ok.map(c=>c[i]).sort((x,y)=>x-y);return v[v.length>>1]};
  return[med(0),med(1),med(2)];
}
function vidProcess(){
  const v=VID.clips[VID.cur].el;if(!VID.ready||!VID.wc||!v||v.readyState<2)return;
  const w=VID.w,h=VID.h,sg=VID.sctx,g=VID.ctx;sg.drawImage(v,0,0,w,h);
  let k=VID.keys[VID.cur];
  if(!k){ // couleur du fond de CETTE vidéo : mesurée sur une image valide
    const m=vidMeasureKey(sg,w,h);
    if(m){VID.keys[VID.cur]=k=m;VID.keyTry=0;VID.bb=null;VID.fullNext=true}
    else{
      const o=VID.keys[VID.cur==='idle'?'thr':'idle'];
      if(o)k=o;                                                  // en attendant : le fond mesuré sur l'autre vidéo (même fond)
      else if(++VID.keyTry<90){g.clearRect(0,0,w,h);VID.dirty=true;return}   // pas d'image valide : on attend, rien n'est affiché
      else{VID.keys[VID.cur]=k=VID_FOND_DEFAUT.slice();VID.bb=null}
    }
  }
  // on ne traite que la zone autour du Père Noël (celle de l'image précédente + marge), le reste est transparent
  let x0=0,y0=0,x1=w,y1=h;if(VID.bb&&!VID.fullNext){x0=VID.bb[0];y0=VID.bb[1];x1=VID.bb[2];y1=VID.bb[3]}VID.fullNext=false;
  const bw=x1-x0,bh=y1-y0,im=sg.getImageData(x0,y0,bw,bh),d=im.data;
  // détourage « par démélange » : s = part de fond vert dans le pixel (0 = Père Noël pur, 1 = fond pur)
  const gk=Math.max(30,k[1]-Math.max(k[0],k[2])),sens=clamp(VID.cfg.sens,1,5);
  const hi=[.96,.93,.90,.86,.82][sens-1],cropX=Math.floor(w*(1-VID.cfg.crop/100)),flip=VID.cfg.flip;
  const n=bw*bh,A=VID.A&&VID.A.length>=n?VID.A:(VID.A=new Uint8Array(w*h)),T=VID.T&&VID.T.length>=n?VID.T:(VID.T=new Uint8Array(w*h));
  const k0=k[0],k1=k[1],k2=k[2];
  for(let y=0,p=0;y<bh;y++){for(let x=0;x<bw;x++,p++){
    const i=p*4;let r=d[i],gr=d[i+1],b=d[i+2];
    const m=r>b?r:b;let s=(gr-m)/gk;
    if(s>=hi){A[p]=0;continue}                       // fond pur : transparent tout de suite
    s=s<0?0:s;
    let a=(hi-s)/.8;a=a>1?1:a;
    const ax=x0+x;if((flip?w-1-ax:ax)>cropX)a=0;
    if(a>0&&s>.02){ // retire la part de fond mélangée au pixel de bord
      const f=1/(1-(s>.9?.9:s));
      r=(r-s*k0)*f;gr=(gr-s*k1)*f;b=(b-s*k2)*f;
      r=r<0?0:r>255?255:r;gr=gr<0?0:gr>255?255:gr;b=b<0?0:b>255?255:b;
    }
    if(a>0){const m2=r>b?r:b;if(gr>m2)gr=m2;d[i]=r;d[i+1]=gr;d[i+2]=b}   // supprime le reflet vert résiduel
    A[p]=a*255;
  }}
  // resserre le contour d'environ 1 px (retire la bande de transition fond/Père Noël) puis l'adoucit
  const E=sens>=4?2:1;
  for(let nn=0;nn<E;nn++){
    for(let y=0;y<bh;y++){const o=y*bw;for(let x=0;x<bw;x++){const l=x>0?A[o+x-1]:A[o+x],c=A[o+x],r2=x<bw-1?A[o+x+1]:A[o+x];let m=l<c?l:c;T[o+x]=m<r2?m:r2}}
    for(let y=0;y<bh;y++){const o=y*bw,u=y>0?o-bw:o,dn=y<bh-1?o+bw:o;for(let x=0;x<bw;x++){const a1=T[u+x],c=T[o+x],a2=T[dn+x];let m=a1<c?a1:c;A[o+x]=m<a2?m:a2}}
  }
  for(let y=0;y<bh;y++){const o=y*bw;for(let x=0;x<bw;x++){const l=x>0?A[o+x-1]:A[o+x],c=A[o+x],r2=x<bw-1?A[o+x+1]:A[o+x];T[o+x]=(l+2*c+r2)>>2}}
  let mnx=bw,mny=bh,mxx=-1,mxy=-1;
  for(let y=0;y<bh;y++){const o=y*bw,u=y>0?o-bw:o,dn=y<bh-1?o+bw:o;for(let x=0;x<bw;x++){
    let v=(T[u+x]+2*T[o+x]+T[dn+x])/4/255;v=(v-.1)/.8;v=v<0?0:v>1?1:v;const al=v*255;d[(o+x)*4+3]=al;
    if(al>6){if(x<mnx)mnx=x;if(x>mxx)mxx=x;if(y<mny)mny=y;if(y>mxy)mxy=y}}}
  g.clearRect(0,0,w,h);g.putImageData(im,x0,y0);
  if(mxx<0)VID.bb=null;
  else{const M=Math.round(Math.max(w,h)*.1);VID.bb=[Math.max(0,x0+mnx-M),Math.max(0,y0+mny-M),Math.min(w,x0+mxx+M),Math.min(h,y0+mxy+M)]}
  VID.dirty=false;
}
function vidTick(dt){
  if(!VID.ready)return;
  if(VID.fade){VID.fade.t+=dt;if(VID.fade.t>=VID.fade.dur)VID.fade=null}
  const v=VID.clips[VID.cur].el;if(!v)return;
  const visible=$('game').classList.contains('on')||(VID.prev&&VID.prev.isConnected);
  if(!visible&&!VID.dirty)return;
  VID.acc+=dt;
  const playing=!v.paused&&!v.ended;
  if(VID.dirty||(playing&&v.currentTime!==VID.lastT&&VID.acc>=1/30)){VID.acc=0;VID.lastT=v.currentTime;vidProcess()}   // seulement quand l'image de la vidéo a changé
}
function vidLaunch(){
  if(!VID.clips.thr.ready)return 0;
  vidSwitch('thr',0);
  return Math.round(VID.cfg.push*1000);
}
function vidPlace(H,cx,cy,R){
  const asp=VID.w/VID.h,h=H*.92*VID.cfg.scale/100,w=h*asp,y=H*.995-h;
  // la main (à handY % de la hauteur de la vidéo) doit toucher la jante, en haut à gauche de la roue
  const dy=cy-(y+h*VID.cfg.handY/100),rr=1.13*R,dx=Math.sqrt(Math.max(0,rr*rr-dy*dy));
  return{x:cx-dx-w*VID.cfg.pos/100,y,w,h};   // pos = % de la largeur de la vidéo où se trouve la main
}
function vidDrawTo(g,H,cx,cy,R){
  const p=vidPlace(H,cx,cy,R);
  const one=(cv,a)=>{g.save();g.globalAlpha=a;
    if(VID.cfg.flip){g.translate(p.x+p.w,p.y);g.scale(-1,1);g.drawImage(cv,0,0,p.w,p.h)}else g.drawImage(cv,p.x,p.y,p.w,p.h);
    g.restore()};
  if(VID.fade){const u=clamp(VID.fade.t/VID.fade.dur,0,1);one(VID.fc,1-u);one(VID.wc,u)}else one(VID.wc,1);
}
function vidPreview(){
  const c=VID.prev;if(!c||!c.isConnected)return;
  const g=c.getContext('2d'),W=c.width,H=c.height;
  const bgG=g.createLinearGradient(0,0,0,H);bgG.addColorStop(0,'#0a1038');bgG.addColorStop(1,'#1b2a6b');g.fillStyle=bgG;g.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2,R=H*.37;
  g.beginPath();g.arc(cx,cy,R*1.13,0,7);g.fillStyle='#cfd5e0';g.fill();
  for(let i=0;i<12;i++){g.beginPath();g.moveTo(cx,cy);g.arc(cx,cy,R,i*Math.PI/6,(i+1)*Math.PI/6);g.fillStyle=i%2?'#0b4f2e':'#7e0c20';g.fill()}
  g.beginPath();g.arc(cx,cy,R*.14,0,7);g.fillStyle='#9aa3b2';g.fill();
  if(VID.ready)vidDrawTo(g,H,cx,cy,R);
  else{g.fillStyle='rgba(255,255,255,.8)';g.font=`${H*.06}px sans-serif`;g.textAlign='center';g.fillText('Aucune vidéo choisie',W*.25,H*.5)}
}
const VROWS=[['push','Poussée à (s)',0,6,.1],['sens','Détourage du vert',1,5,1],['crop','Rogner côté roue (%)',0,60,5],['scale','Taille (%)',50,160,10],['pos','Position de la main (%)',20,95,1],['handY','Hauteur de la main (%)',5,90,1]];
function videoPanel(){
  if(MOD.querySelector('.vpanel'))return;
  const m=modal(`<div class="panel vpanel"><h2>🎬 Père Noël en vidéo</h2>
    <div class="vwrap"><canvas id="vPrev" width="640" height="360"></canvas><div class="vctl" id="vCtl"></div></div>
    <div class="sub s" id="vMsg"></div>
    <div class="btnRow"><button class="btn g" id="vChooseI">🎬 Attente</button><button class="btn g" id="vChooseT">🎬 Lancer</button><button class="btn" id="vTest">▶️ Tester</button><button class="btn r" id="vDone">Fermer</button></div></div>`);
  VID.prev=m.querySelector('#vPrev');
  const render=()=>{
    m.querySelector('#vCtl').innerHTML=VROWS.map(([k,l])=>`<div class="vr"><span>${l}</span><div class="step sm"><button data-k="${k}" data-d="-1">−</button><b>${VID.cfg[k]}</b><button data-k="${k}" data-d="1">+</button></div></div>`).join('')
      +`<div class="vr"><span>Miroir</span><button class="btn sm2" data-t="flip">${VID.cfg.flip?'Oui':'Non'}</button></div><div class="vr"><span>Père Noël dessiné</span><button class="btn sm2" data-t="vector">${VID.cfg.vector?'Oui':'Non'}</button></div>`;
    m.querySelector('#vMsg').textContent=VID.ready?('Attente : '+(VID.clips.idle.ready?'chargée':'—')+'  ·  Lancer : '+(VID.clips.thr.ready?'chargé':'—')):(VID.status||'Choisis un MP4 tourné sur fond vert uni (Père Noël seul, sans texte).');
  };
  render();
  m.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.k){const r=VROWS.find(x=>x[0]===b.dataset.k);VID.cfg[r[0]]=clamp(Math.round((VID.cfg[r[0]]+(+b.dataset.d)*r[4])*100)/100,r[2],r[3]);vidSave();render();return}
    if(b.dataset.t){VID.cfg[b.dataset.t]=!VID.cfg[b.dataset.t];VID.keys={};vidSave();render();return}
    if(b.id==='vChooseI'||b.id==='vChooseT'){VID.pick=b.id==='vChooseI'?'idle':'thr';$('videoFile').click();return}
    if(b.id==='vTest'){if(VID.clips.thr.ready)vidLaunch();else toast('Choisis d’abord la vidéo du lancer');return}
    if(b.id==='vDone'){VID.prev=null;m.remove();if(VID.cur==='thr'&&VID.clips.idle.ready)vidSwitch('idle',VID.idleAt)}
  };
  VID.render=render;
}
$('videoFile').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];
  if(f){if(VID.pick==='idle')VID.idleAt=0;if(!vidLoad(VID.pick,f))toast('⚠️ Vidéo impossible à lire');else setTimeout(()=>{if(VID.render&&VID.prev&&VID.prev.isConnected)VID.render()},900)}
  e.target.value='';
});


/* ============ APPLICATION INSTALLABLE (PWA) ============ */
let installEv=null,wakeLock=null;
const IN_APP=/RoueNoelApp/.test(navigator.userAgent);
const isStandalone=()=>IN_APP||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true||(window.matchMedia&&window.matchMedia('(display-mode: fullscreen)').matches);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEv=e});
window.addEventListener('appinstalled',()=>{installEv=null;try{toast('✅ Application installée')}catch(e){}});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}   // fonctionnement hors ligne
/* ---- mise à jour sans fermer l'application ----
   On lit sw.js (petit fichier) directement sur internet : son numéro de cache = la dernière version publiée. */
const majNum=v=>v.split('.').map(Number);
const majPlusRecent=(a,b)=>{const x=majNum(a),y=majNum(b);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return(x[i]||0)>(y[i]||0)}return false};
let majBandeauEl=null;
function majAppliquer(){
  try{navigator.serviceWorker&&navigator.serviceWorker.getRegistration().then(r=>{if(r)return r.update()}).catch(()=>{})}catch(e){}
  setTimeout(()=>location.reload(),700);
}
function majBandeau(nv){
  if(majBandeauEl||MJ.active)return;
  const d=document.createElement('div');majBandeauEl=d;
  d.style.cssText='position:fixed;left:50%;bottom:2.5vh;transform:translateX(-50%);z-index:99998;background:#c8102e;color:#fff;font:700 3vh Georgia,serif;padding:1.4vh 3vh;border-radius:4vh;border:.4vh solid #fff;box-shadow:0 0 3vh rgba(255,255,255,.6);cursor:pointer;text-align:center';
  d.textContent='🔄 Nouvelle version v'+nv+' : touche ici pour mettre à jour';
  d.onclick=majAppliquer;document.body.appendChild(d);
}
async function majVerifier(force){
  try{
    const r=await fetch('sw.js?maj='+Date.now(),{cache:'no-store'});if(!r.ok)return'erreur';
    const m=(await r.text()).match(/cache-v([\d.]+)/);if(!m)return'erreur';
    if(majPlusRecent(m[1],VERSION)){if(force)majAppliquer();else majBandeau(m[1]);return'nouvelle'}
    return'aucune';
  }catch(e){return'erreur'}
}
if(typeof location!=='undefined'&&/^https?:$/.test(location.protocol)){
  setTimeout(()=>majVerifier(false),6000);
  setInterval(()=>majVerifier(false),120000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')majVerifier(false)});
}
async function keepAwake(){try{if('wakeLock' in navigator&&!wakeLock){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null})}}catch(e){}}  // l'écran ne s'éteint pas pendant la partie
document.addEventListener('pointerdown',keepAwake,{capture:true,passive:true});
// Plein écran automatique (utile quand le jeu est ouvert dans Chrome et non en application) + verrouillage en paysage
let fsTried=false;
function goFull(){
  if(fsTried||isStandalone()||document.fullscreenElement)return;fsTried=true;
  const el=document.documentElement;
  try{if(el.requestFullscreen){el.requestFullscreen({navigationUI:'hide'}).then(()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}}).catch(()=>{})}}catch(e){}
}
['pointerup','touchend','click'].forEach(ev=>document.addEventListener(ev,goFull,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepAwake()});

/* ============ BOUCLE PRINCIPALE ============ */
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;
  if(MJ.active){fxStep(dt);requestAnimationFrame(loop);return}      // pendant un mini-jeu, le décor de la roue est mis en pause (plus de fluidité)
  lgtStep(dt);LV=LGT.lv;
  drawBg(dt);drawLights(dt);
  if(S&&$('game').classList.contains('on')){big.update(dt);big.draw(time);small.update(dt);small.draw(time)}
  vidTick(dt);vidPreview();
  if(S&&$('game').classList.contains('on')){santaStep(dt);santaDraw()}
  fxStep(dt);
  requestAnimationFrame(loop);
}
function onResize(){
  setVars();sizeCanvases();
  if($('game').classList.contains('on')&&S){big.S=0;small.S=0;requestAnimationFrame(layoutWheels)}
}
window.addEventListener('resize',onResize);
window.addEventListener('orientationchange',()=>setTimeout(onResize,250));

function init(){
  setVars();sizeCanvases();
  big=new Roue($('cvBig'),{rf:.385,ir:.8,imax:.27,q:2,bulbs:true,hub:'⭐',view:segView,tick:s=>AE.tick(s)});
  small=new Roue($('cvSmall'),{rf:.40,ir:.62,imax:.46,bulbs:false,hub:'🎄',view:playerView,tick:s=>AE.tick(s*.8),phys:{mu:2.3}});
  small.setSegs(PLAYERS);
  saved=loadSave();
  vidEmbedded();
  ICON.load(()=>{if(big)big.build()});   // icônes de la roue (images intégrées)
  buildIntro();
  requestAnimationFrame(loop);
}
init();
})();
</script>
</body>
</html>
