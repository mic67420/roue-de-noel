<script>
(()=>{
'use strict';
const VERSION='3.19';
const KEY='roueNoel_partie',KEYCFG='roueNoel_reglages',KEYSON='roueNoel_son';
const $=id=>document.getElementById(id);
const mod=(a,n)=>((a%n)+n)%n;
const rnd=n=>Math.floor(Math.random()*n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const store={
  get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
$('ver').textContent='v'+VERSION;

/* ============ DONNEES ============ */
// w = poids secret du tirage (jamais affiché)
const PLAYERS=[
  {name:'Mic',av:'🎅',col:'#d32f2f',w:15},
  {name:'Caroline',av:'🤶',col:'#2e9e5b',w:15},
  {name:'Arley',av:'🦌',col:'#f2b01e',w:20},
  {name:'Axel',av:'⛄',col:'#1e88e5',w:20},
  {name:'Alix',av:'🧝',col:'#e91e8c',w:25}
];
const SPECIALS={
  vol:{col:'#3b1a55'},echange:{col:'#10336b'},double:{col:'#6b4a10'},bouclier:{col:'#2b3340'},
  choix:{col:'#07514e'},autre:{col:'#6a1740'},pas:{col:'#34495e'}
};
const EMOJI='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
let LV=.6; // niveau d'intensité des lumières (0.55 au repos → 1 en action)
/* ---- matières et pictogrammes dessinés (réalistes, sans emoji) ---- */
function shade(hex,a){
  const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=a<0?0:255,p=Math.abs(a);
  r=Math.round(r+(f-r)*p);g=Math.round(g+(f-g)*p);b=Math.round(b+(f-b)*p);return`rgb(${r},${g},${b})`;
}
function metal(g,s,v){
  const m=g.createLinearGradient(0,-s*.5,0,s*.5);
  if(v){m.addColorStop(0,'#ffffff');m.addColorStop(.45,'#c3ccd8');m.addColorStop(1,'#6d7888')}
  else{m.addColorStop(0,'#fff3b8');m.addColorStop(.45,'#e0ac3a');m.addColorStop(1,'#8a5a10')}
  return m;
}
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function star(g,x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fill()}
function snow(g,x,y,r){g.lineWidth=Math.max(1,r*.25);for(let i=0;i<3;i++){const a=i*Math.PI/3;g.beginPath();g.moveTo(x-Math.cos(a)*r,y-Math.sin(a)*r);g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.stroke()}}
function arrowHead(g,a,r,s){
  const px=Math.cos(a)*r,py=Math.sin(a)*r,tx=-Math.sin(a),ty=Math.cos(a),nx=Math.cos(a),ny=Math.sin(a);
  g.beginPath();g.moveTo(px+tx*s*.17,py+ty*s*.17);g.lineTo(px+nx*s*.13,py+ny*s*.13);g.lineTo(px-nx*s*.13,py-ny*s*.13);g.closePath();g.fill();
}
function glyph(g,k,s,v){
  g.save();g.shadowColor='rgba(0,0,0,.7)';g.shadowBlur=s*.09;g.shadowOffsetY=s*.035;
  const M=metal(g,s,v);g.fillStyle=M;g.strokeStyle=M;g.lineCap='round';g.lineJoin='round';
  if(k==='bouclier'){
    g.lineWidth=s*.11;g.beginPath();g.arc(0,-s*.1,s*.19,Math.PI,0);g.moveTo(-s*.19,-s*.1);g.lineTo(-s*.19,s*.06);g.moveTo(s*.19,-s*.1);g.lineTo(s*.19,s*.06);g.stroke();
    rrect(g,-s*.3,-s*.02,s*.6,s*.46,s*.07);g.fill();
    g.shadowColor='transparent';g.fillStyle='rgba(25,14,0,.85)';g.beginPath();g.arc(0,s*.15,s*.06,0,7);g.fill();g.fillRect(-s*.02,s*.15,s*.04,s*.14);
  }else if(k==='echange'){
    for(let i=0;i<2;i++){g.save();if(i)g.rotate(Math.PI);g.lineWidth=s*.1;g.beginPath();g.arc(0,0,s*.3,Math.PI*1.12,Math.PI*1.88);g.stroke();arrowHead(g,Math.PI*1.88,s*.3,s);g.restore()}
  }else if(k==='double'){
    g.beginPath();for(let i=0;i<24;i++){const a=i*Math.PI/12,r=i%2?s*.3:s*.47;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();g.fill();
    g.shadowColor='transparent';g.fillStyle='rgba(30,18,0,.9)';g.font=`900 ${s*.36}px Georgia,serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('×2',0,s*.02);
  }else if(k==='vol'){
    rrect(g,-s*.2,s*.0,s*.4,s*.38,s*.1);g.fill();
    [.34,.43,.4,.31].forEach((h,i)=>{rrect(g,-s*.2+s*.02+i*s*.1,-s*h,s*.085,s*h+s*.05,s*.042);g.fill()});
    g.save();g.translate(-s*.17,s*.22);g.rotate(-.85);rrect(g,-s*.2,-s*.045,s*.22,s*.09,s*.045);g.fill();g.restore();
  }else if(k==='choix'){
    g.lineWidth=s*.07;g.beginPath();g.arc(0,0,s*.4,0,7);g.stroke();g.beginPath();g.arc(0,0,s*.24,0,7);g.stroke();
    g.beginPath();g.arc(0,0,s*.09,0,7);g.fill();g.lineWidth=s*.05;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([x,y])=>{g.beginPath();g.moveTo(x*s*.48,y*s*.48);g.lineTo(x*s*.16,y*s*.16);g.stroke()});
  }else if(k==='autre'){
    g.beginPath();g.moveTo(0,s*.34);g.bezierCurveTo(-s*.56,-s*.04,-s*.3,-s*.46,0,-s*.14);g.bezierCurveTo(s*.3,-s*.46,s*.56,-s*.04,0,s*.34);g.fill();
  }else if(k==='pas'){
    [[-.18,.02,.16],[0,-.12,.22],[.2,0,.17]].forEach(([x,y,r])=>{g.beginPath();g.arc(x*s,y*s,r*s,0,7);g.fill()});
    rrect(g,-s*.34,0,s*.68,s*.17,s*.08);g.fill();
    [[-.18,.34],[0,.4],[.18,.34]].forEach(([x,y])=>{g.beginPath();g.arc(x*s,y*s,s*.04,0,7);g.fill()});
  }else if(k==='mystere'){
    g.font=`900 ${s*.95}px Georgia,serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('?',0,s*.04);
    star(g,s*.34,-s*.34,s*.14);
  }
  g.restore();
}
const WRAPS=['#8f0f24','#0d5a34','#1c3f7a','#b8892b','#4a1a5e','#cfd3dc','#a6411a','#0b6a6a'];
const RIBS=['#e8c25a','#f4f1ea','#8f0f24','#0d5a34','#e8c25a','#cfd3dc'];
function drawGiftArt(g,s,d){
  const wrap=WRAPS[d%8],pat=Math.floor(d/8)%6,rib0=RIBS[(d*3+1)%6],rib=(rib0===wrap)?'#e8c25a':rib0;
  const w=s*.78,x=-w/2,y=-w/2+s*.1,r=s*.06;
  g.save();
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(0,y+w+s*.02,w*.55,s*.06,0,0,7);g.fill();
  rrect(g,x,y,w,w,r);g.fillStyle=wrap;g.fill();g.save();g.clip();
  g.fillStyle='rgba(255,255,255,.28)';g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=Math.max(1,s*.03);
  if(pat===0){for(let i=-3;i<5;i++)g.fillRect(x+i*w/4,y,w/8,w)}
  else if(pat===1){for(let i=0;i<4;i++)for(let j=0;j<4;j++){g.beginPath();g.arc(x+(i+.5)*w/4,y+(j+.5)*w/4,w*.05,0,7);g.fill()}}
  else if(pat===2){for(let i=0;i<3;i++)for(let j=0;j<3;j++)star(g,x+(i+.5)*w/3,y+(j+.5)*w/3,w*.09)}
  else if(pat===3){for(let i=0;i<4;i++)for(let j=0;j<4;j++){if((i+j)%2===0)g.fillRect(x+i*w/4,y+j*w/4,w/4,w/4)}}
  else if(pat===4){for(let i=0;i<3;i++)for(let j=0;j<3;j++)snow(g,x+(i+.5)*w/3,y+(j+.5)*w/3,w*.1)}
  else{for(let i=-4;i<6;i++){g.beginPath();g.moveTo(x+i*w/4,y+w);g.lineTo(x+i*w/4+w,y);g.lineWidth=w*.06;g.stroke()}}
  const lg=g.createLinearGradient(x,y,x+w,y+w);lg.addColorStop(0,'rgba(255,255,255,.32)');lg.addColorStop(.5,'rgba(255,255,255,0)');lg.addColorStop(1,'rgba(0,0,0,.38)');
  g.fillStyle=lg;g.fillRect(x,y,w,w);
  g.restore();
  const rg=g.createLinearGradient(-w*.1,0,w*.1,0);rg.addColorStop(0,shade(rib,-.25));rg.addColorStop(.5,shade(rib,.25));rg.addColorStop(1,shade(rib,-.25));
  g.fillStyle=rg;g.fillRect(-w*.09,y,w*.18,w);
  const rg2=g.createLinearGradient(0,y+w*.38,0,y+w*.58);rg2.addColorStop(0,shade(rib,-.25));rg2.addColorStop(.5,shade(rib,.25));rg2.addColorStop(1,shade(rib,-.25));
  g.fillStyle=rg2;g.fillRect(x,y+w*.4,w,w*.16);
  g.fillStyle=rg;g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=Math.max(1,s*.02);
  g.beginPath();g.ellipse(-w*.2,y-w*.02,w*.22,w*.13,-.5,0,7);g.fill();g.stroke();
  g.beginPath();g.ellipse(w*.2,y-w*.02,w*.22,w*.13,.5,0,7);g.fill();g.stroke();
  g.beginPath();g.arc(0,y,w*.08,0,7);g.fillStyle=shade(rib,.2);g.fill();g.stroke();
  g.restore();
}
function segView(s){
  if(s.k==='gift')return{col:s.c?'#0b4f2e':'#7e0c20',draw:(g,z)=>ICON.draw(g,'gift',z*1.16,s.d)};
  if(s.k==='mystery')return{col:'#17151f',draw:(g,z)=>ICON.draw(g,'mystery',z*1.16)};
  return{col:SPECIALS[s.k].col,draw:(g,z)=>ICON.draw(g,s.k,z*1.16)};
}
const playerView=p=>({col:p.col,ico:p.av,cream:true});

/* ============ ICONES DE LA ROUE (dessinées en vectoriel, validées case par case) ============ */
const ICON=(()=>{
// Bibliothèque d'icônes vectorielles (coordonnées unitaires : l'icône occupe [-0.5 ; 0.5])
const TAU=Math.PI*2;
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
const STY={
 or:{main:['#fff3b8','#e8b53f','#8a5a10'],dark:['#d6a030','#9a6a14','#5a3504'],light:['#ffffff','#fff0b0','#f0cc66'],accent:['#fffbe0','#ffd966','#c98f1c'],white:['#fffbe8','#f4e2a8','#d8b860'],red:['#f6bd62','#cf8f2e','#7a4d0c'],green:['#ecce74','#bc9733','#6d5214'],skin:['#fff0b8','#e0b050','#9a6a14'],black:['#8a6a2a','#4a3410','#1c1204'],blue:['#f0d27a','#c9962e','#7a5412'],sack:['#f0d27a','#c9962e','#7a5412'],outline:'rgba(60,32,0,.85)'},
 argent:{main:['#ffffff','#c3ccd8','#6d7888'],dark:['#aab4c4','#6d7888','#3b4454'],light:['#ffffff','#f2f6ff','#d7e0f0'],accent:['#e8f6ff','#8fd0ff','#3a86c8'],white:['#ffffff','#eef3fb','#c9d3e3'],red:['#ffd0d6','#d98c98','#8a4452'],green:['#d6f2e4','#8cc9a8','#4a8468'],skin:['#ffffff','#dfe7f4','#aab6cc'],black:['#7a8498','#3b4454','#151a24'],blue:['#d6ecff','#7ab8f0','#2f78c0'],sack:['#e4e9f4','#aab4c4','#6d7888'],outline:'rgba(25,40,70,.8)'},
 couleur:{main:['#ff6b7d','#d4203a','#8f1226'],dark:['#b01e34','#8f1226','#5e0a18'],light:['#ffa3ae','#ff6b7d','#e03a52'],accent:['#ffeaa0','#ffc93d','#d48a0c'],white:['#ffffff','#f4f6fb','#cfd6e6'],red:['#ff6b7d','#d4203a','#8f1226'],green:['#5fd68f','#1f9d55','#0d6a36'],skin:['#ffe3cb','#f2b48f','#cf8a66'],black:['#555566','#22222b','#07070a'],blue:['#8fbcff','#2f6fe0','#163f9a'],sack:['#e9cf97','#bd9355','#7d5b2c'],brown:['#d9a066','#a8672f','#63381a'],outline:'rgba(25,10,35,.85)'},
 blanc:{main:['#ffffff','#f4f6fc','#d9e0ee'],dark:['#e4e9f4','#c4cde0','#9aa6bf'],light:['#ffffff','#ffffff','#f4f6fc'],accent:['#ffffff','#fff6d8','#f0dc9c'],white:['#ffffff','#ffffff','#e8edf7'],red:['#ffffff','#f4f6fc','#d9e0ee'],green:['#ffffff','#f4f6fc','#d9e0ee'],skin:['#ffffff','#f4f6fc','#d9e0ee'],black:['#d0d8e8','#aab4cc','#7d8aa6'],blue:['#ffffff','#f4f6fc','#d9e0ee'],sack:['#ffffff','#f4f6fc','#d9e0ee'],outline:'rgba(60,75,110,.55)'},
 neon:{}
};
function makeX(g,style,neon){
  const st=STY[style]||{};
  const X={g,style,neon:style==='neon'?(neon||'#3ee8ff'):null,s:1};
  X.c=role=>{const a=st[role]||st.main;const gr=g.createLinearGradient(0,-.5,0,.5);a.forEach((c,i)=>gr.addColorStop(i/(a.length-1),c));return gr};
  X.paint=(role,o={})=>{
    if(X.neon){
      if(o.skip)return;
      g.save();g.lineJoin='round';g.lineCap='round';
      g.shadowColor=X.neon;g.shadowBlur=X.s*.05;g.lineWidth=o.lw||.034;g.strokeStyle=X.neon;g.stroke();g.stroke();
      g.shadowBlur=0;g.lineWidth=(o.lw||.034)*.38;g.strokeStyle='#ffffff';g.stroke();g.restore();return
    }
    g.fillStyle=X.c(role);g.fill();
    if(o.outline!==false&&st.outline){g.lineWidth=o.ow||.016;g.strokeStyle=st.outline;g.lineJoin='round';g.stroke()}
  };
  // trait épais (pour les formes filaires : anses, flèches…)
  X.stroke=(role,lw,o={})=>{
    g.save();g.lineCap='round';g.lineJoin='round';
    if(X.neon){g.shadowColor=X.neon;g.shadowBlur=X.s*.05;g.strokeStyle=X.neon;g.lineWidth=Math.min(lw,.045);g.stroke();g.stroke();g.shadowBlur=0;g.strokeStyle='#fff';g.lineWidth=Math.min(lw,.045)*.38;g.stroke()}
    else{
      if(st.outline&&o.outline!==false){g.strokeStyle=st.outline;g.lineWidth=lw+.03;g.stroke()}
      g.strokeStyle=X.c(role);g.lineWidth=lw;g.stroke();
    }
    g.restore();
  };
  // reflet : voile blanc translucide (ignoré en néon)
  X.hl=(a=.35)=>{if(X.neon)return;g.fillStyle=`rgba(255,255,255,${a})`;g.fill()};
  X.shade=(a=.22)=>{if(X.neon)return;g.fillStyle=`rgba(0,0,0,${a})`;g.fill()};
  return X;
}
function star5(g,cx,cy,r,ratio=.46){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*ratio:r;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}g.closePath()}
function sparkle(g,cx,cy,r){g.beginPath();g.moveTo(cx,cy-r);g.quadraticCurveTo(cx+r*.12,cy-r*.12,cx+r,cy);g.quadraticCurveTo(cx+r*.12,cy+r*.12,cx,cy+r);g.quadraticCurveTo(cx-r*.12,cy+r*.12,cx-r,cy);g.quadraticCurveTo(cx-r*.12,cy-r*.12,cx,cy-r);g.closePath()}
function heartP(g,cx,cy,s){g.beginPath();g.moveTo(cx,cy+s*.45);g.bezierCurveTo(cx-s*.75,cy-s*.02,cx-s*.46,cy-s*.58,cx,cy-s*.2);g.bezierCurveTo(cx+s*.46,cy-s*.58,cx+s*.75,cy-s*.02,cx,cy+s*.45);g.closePath()}
function bow(X,cx,cy,w,role='accent'){
  const g=X.g,h=w*.55;
  [-1,1].forEach(sg=>{g.beginPath();g.moveTo(cx,cy);g.bezierCurveTo(cx+sg*w*.12,cy-h*1.15,cx+sg*w*.78,cy-h*1.25,cx+sg*w*.64,cy-h*.1);g.bezierCurveTo(cx+sg*w*.5,cy+h*.2,cx+sg*w*.2,cy+h*.12,cx,cy);X.paint(role)});
  g.beginPath();g.ellipse(cx,cy,w*.11,w*.095,0,0,TAU);X.paint(role);
}
function giftBox(X,cx,cy,w,h,o={}){
  const g=X.g,x=cx-w/2,y=cy-h/2,lid=h*.27;
  rr(g,x+w*.05,y+lid-.004,w*.9,h-lid,.018);X.paint(o.body||'main');X.shade(.12);
  g.save();rr(g,x+w*.05,y+lid-.004,w*.9,h-lid,.018);g.clip();
  g.beginPath();g.rect(x+w*.05,y+lid,w*.2,h);g.fillStyle='rgba(255,255,255,.18)';if(!X.neon)g.fill();g.restore();
  rr(g,x,y,w,lid,.018);X.paint(o.lid||o.body||'main');X.hl(.18);
  g.beginPath();g.rect(cx-w*.085,y+lid,w*.17,h-lid);X.paint(o.rib||'accent');
  g.beginPath();g.rect(cx-w*.085,y,w*.17,lid);X.paint(o.rib||'accent');
  if(o.bow!==false)bow(X,cx,y+.005,w*.6,o.rib||'accent');
}
function snowflake(X,cx,cy,r,lw=.03,role='white'){
  const g=X.g;g.save();g.translate(cx,cy);
  for(let i=0;i<6;i++){g.save();g.rotate(i*Math.PI/3);
    g.beginPath();g.moveTo(0,0);g.lineTo(0,-r);g.moveTo(0,-r*.55);g.lineTo(-r*.28,-r*.8);g.moveTo(0,-r*.55);g.lineTo(r*.28,-r*.8);g.moveTo(0,-r*.3);g.lineTo(-r*.18,-r*.46);g.moveTo(0,-r*.3);g.lineTo(r*.18,-r*.46);
    X.stroke(role,lw);g.restore()}
  g.restore();
}
function lockIcon(X,cx,cy,w){
  const g=X.g,bw=w,bh=w*.8;
  g.beginPath();g.arc(cx,cy-bh*.38,bw*.3,Math.PI,0);g.lineTo(cx+bw*.3,cy-bh*.05);g.moveTo(cx-bw*.3,cy-bh*.38);g.lineTo(cx-bw*.3,cy-bh*.05);X.stroke('dark',w*.17);
  rr(g,cx-bw/2,cy-bh*.12,bw,bh,.05);X.paint('main');X.hl(.2);
  g.beginPath();g.arc(cx,cy+bh*.2,bw*.09,0,TAU);g.moveTo(cx,cy+bh*.2);g.lineTo(cx-bw*.045,cy+bh*.48);g.lineTo(cx+bw*.045,cy+bh*.48);g.closePath();X.paint('black',{skip:true,outline:false});
}

// ---------- briques communes ----------
function hand(X,o={}){           // main de gant, paume vers nous, doigts légèrement écartés vers le haut (origine au centre de la paume)
  const g=X.g,fr=o.fr||(X.style==='or'?'dark':'black');
  [[-.19,.27,-.16],[-.065,.35,-.05],[.065,.33,.05],[.19,.25,.16]].forEach(([x,len,ang])=>{
    g.save();g.translate(x,-.02);g.rotate(ang);rr(g,-.058,-len,.116,len+.06,.058);X.paint(fr);X.hl(.12);g.restore()});
  rr(g,-.235,-.06,.47,.38,.11);X.paint(fr);X.hl(.12);
  g.save();g.translate(-.2,.12);g.rotate(-.8);rr(g,-.22,-.065,.24,.13,.065);X.paint(fr);X.hl(.12);g.restore();
  rr(g,-.27,.26,.54,.13,.065);X.paint('white');
  [-.22,-.11,0,.11,.22].forEach(x=>{g.beginPath();g.arc(x,.36,.06,0,TAU);X.paint('white',{skip:true})});
}
function qm(X,cx,cy,h,role='main',lw){                 // point d'interrogation
  const g=X.g;lw=lw||h*.2;
  g.beginPath();g.arc(cx,cy-h*.22,h*.27,Math.PI*1.08,Math.PI*2.45);g.bezierCurveTo(cx+h*.42,cy+h*.1,cx,cy+h*.08,cx,cy+h*.26);X.stroke(role,lw);
  g.beginPath();g.arc(cx,cy+h*.5,lw*.62,0,TAU);X.paint(role);
}
function two(X,cx,cy,h,role='dark'){                   // chiffre 2 + croix
  const g=X.g,lw=h*.2;
  g.beginPath();g.moveTo(cx-h*.28,cy-h*.2);g.bezierCurveTo(cx-h*.28,cy-h*.55,cx+h*.3,cy-h*.55,cx+h*.28,cy-h*.18);g.bezierCurveTo(cx+h*.26,cy+h*.05,cx-h*.28,cy+h*.2,cx-h*.3,cy+h*.5);g.lineTo(cx+h*.32,cy+h*.5);X.stroke(role,lw*.75,{outline:false});
}
function arrowHead(X,x,y,ang,sz,role){const g=X.g;g.save();g.translate(x,y);g.rotate(ang);g.beginPath();g.moveTo(sz,0);g.lineTo(-sz*.6,-sz*.75);g.lineTo(-sz*.3,0);g.lineTo(-sz*.6,sz*.75);g.closePath();X.paint(role);g.restore()}
function circArrows(X,r,lw,role){
  const g=X.g;
  [0,Math.PI].forEach(off=>{
    g.beginPath();g.arc(0,0,r,off+.35,off+Math.PI-.55);X.stroke(role,lw);
    const a=off+Math.PI-.55,x=Math.cos(a)*r,y=Math.sin(a)*r;
    arrowHead(X,x,y,a+Math.PI/2,lw*1.25,role);
  });
}
function sack(X){
  const g=X.g;
  giftBox(X,.04,-.3,.3,.26,{body:'red',rib:'accent'});
  g.save();g.translate(-.2,-.3);g.rotate(-.5);rr(g,-.03,-.16,.06,.3,.03);X.paint('white');rr(g,-.03,-.16,.06,.1,.03);X.paint('red',{skip:true});g.restore();
  g.beginPath();g.moveTo(-.13,-.14);g.bezierCurveTo(-.52,.0,-.5,.5,-.14,.47);g.lineTo(.14,.47);g.bezierCurveTo(.5,.5,.52,.0,.13,-.14);g.closePath();X.paint('skin');X.hl(.1);
  g.beginPath();g.moveTo(-.3,.1);g.bezierCurveTo(-.34,.2,-.32,.3,-.26,.38);g.moveTo(.3,.1);g.bezierCurveTo(.34,.2,.32,.3,.26,.38);X.stroke('dark',.014,{outline:false});
  g.save();rr(g,-.12,.14,.24,.2,.02);X.paint('accent',{skip:true});g.setLineDash([.025,.02]);g.lineWidth=.012;g.strokeStyle=X.neon?X.neon:'rgba(80,40,10,.7)';g.stroke();g.restore();
  g.beginPath();g.moveTo(-.2,-.1);g.quadraticCurveTo(0,-.02,.2,-.1);g.lineTo(.22,-.04);g.quadraticCurveTo(0,.05,-.22,-.04);g.closePath();X.paint('dark');
  for(let i=-3;i<=3;i++){g.beginPath();g.arc(i*.065,-.14,.04,Math.PI,0);X.paint('sack')}
  g.beginPath();g.arc(.18,.0,.026,0,TAU);X.paint('dark',{skip:true});
}
function santaHat(X,cx,cy,s){
  const g=X.g;g.save();g.translate(cx,cy);g.scale(s,s);
  g.beginPath();g.moveTo(-.34,0);g.bezierCurveTo(-.3,-.38,.1,-.55,.34,-.3);g.bezierCurveTo(.42,-.22,.42,-.1,.36,0);g.closePath();X.paint('main');X.hl(.14);
  rr(g,-.4,-.04,.8,.15,.07);X.paint('white');
  g.beginPath();g.arc(.34,-.3,.09,0,TAU);X.paint('white');g.restore();
}
function bauble(X,cx,cy,r,role='main',o={}){
  const g=X.g;
  g.beginPath();g.arc(cx,cy,r,0,TAU);X.paint(role);
  if(o.band){g.save();g.beginPath();g.arc(cx,cy,r,0,TAU);g.clip();g.beginPath();g.rect(cx-r,cy-r*.1,r*2,r*.3);g.fillStyle=X.neon?'rgba(0,0,0,0)':X.c('accent');g.fill();g.restore()}
  g.beginPath();g.ellipse(cx-r*.35,cy-r*.4,r*.22,r*.14,-.6,0,TAU);X.hl(.5);
  rr(g,cx-r*.2,cy-r*1.22,r*.4,r*.28,.02);X.paint('accent');
  g.beginPath();g.arc(cx,cy-r*1.3,r*.12,0,TAU);X.stroke('accent',r*.05,{outline:false});
}
function shieldP(g,w,h){g.beginPath();g.moveTo(0,-h);g.bezierCurveTo(w*.35,-h*.82,w*.7,-h*.9,w,-h*.78);g.bezierCurveTo(w*1.02,-h*.1,w*.7,h*.55,0,h);g.bezierCurveTo(-w*.7,h*.55,-w*1.02,-h*.1,-w,-h*.78);g.bezierCurveTo(-w*.7,-h*.9,-w*.35,-h*.82,0,-h);g.closePath()}
function cloud(X,role='main'){
  const g=X.g;g.beginPath();g.arc(-.2,.02,.17,Math.PI*.5,Math.PI*1.5);g.arc(-.05,-.14,.2,Math.PI,Math.PI*1.9);g.arc(.18,-.04,.17,Math.PI*1.45,Math.PI*.5);g.closePath();X.paint(role);X.hl(.2);
}
// ---------- VOL ----------
const vol={
 A:X=>{const g=X.g;giftBox(X,.14,.14,.4,.36,{body:'red',rib:'accent'});g.save();g.translate(-.26,-.02);g.rotate(Math.PI/2);g.scale(.82,.82);hand(X);g.restore()},
 B:X=>{const g=X.g;
   g.beginPath();g.arc(0,.1,.3,0,TAU);X.paint('skin');
   g.beginPath();g.moveTo(-.3,.14);g.bezierCurveTo(-.34,.46,.34,.46,.3,.14);g.bezierCurveTo(.15,.2,-.15,.2,-.3,.14);X.paint('white');
   g.beginPath();g.moveTo(-.34,.0);g.bezierCurveTo(-.2,-.1,-.08,-.04,0,-.04);g.bezierCurveTo(.08,-.04,.2,-.1,.34,0);g.bezierCurveTo(.36,.1,.24,.16,.12,.12);g.bezierCurveTo(.06,.08,-.06,.08,-.12,.12);g.bezierCurveTo(-.24,.16,-.36,.1,-.34,0);g.closePath();X.paint('black');
   [-.16,.16].forEach(x=>{g.beginPath();g.ellipse(x,.04,.06,.04,0,0,TAU);X.paint('white',{skip:true})});
   santaHat(X,0,-.12,.62)},
 C:X=>sack(X),
 D:X=>{const g=X.g;g.save();g.scale(.92,.92);g.translate(0,.0);hand(X,{fr:'main'});g.restore();
   g.beginPath();g.arc(0,-.02,.48,Math.PI*1.1,Math.PI*1.36);X.stroke('accent',.03);g.beginPath();g.arc(0,-.02,.48,Math.PI*1.64,Math.PI*1.9);X.stroke('accent',.03)}
};
// ---------- ÉCHANGE ----------
const ech={
 A:X=>{circArrows(X,.3,.1,'main');const g=X.g;sparkle(g,0,0,.1);X.paint('accent')},
 B:X=>{const g=X.g;
   giftBox(X,-.2,.14,.3,.28,{body:'red',rib:'accent'});giftBox(X,.2,.14,.3,.28,{body:'green',rib:'white'});
   g.beginPath();g.arc(0,.0,.3,Math.PI*1.15,Math.PI*1.85);X.stroke('accent',.05);arrowHead(X,Math.cos(Math.PI*1.85)*.3,Math.sin(Math.PI*1.85)*.3,Math.PI*1.85+Math.PI/2,.07,'accent');
   g.beginPath();g.arc(0,.28,.3,Math.PI*.15,Math.PI*.85);X.stroke('accent',.05);arrowHead(X,Math.cos(Math.PI*.85)*.3,.28+Math.sin(Math.PI*.85)*.3,Math.PI*.85+Math.PI/2,.07,'accent')},
 C:X=>{const g=X.g;
   g.beginPath();g.moveTo(-.4,-.12);g.lineTo(.22,-.12);X.stroke('main',.07);arrowHead(X,.32,-.12,0,.1,'main');
   g.beginPath();g.moveTo(.4,.12);g.lineTo(-.22,.12);X.stroke('main',.07);arrowHead(X,-.32,.12,Math.PI,.1,'main');
   sparkle(g,0,.0,.07);X.paint('accent')},
 D:X=>{circArrows(X,.33,.075,'main');snowflake(X,0,0,.17,.028,'accent')}
};
// ---------- DOUBLE ----------
const dbl={
 A:X=>{const g=X.g;giftBox(X,.14,-.08,.34,.3,{body:'green',rib:'white'});giftBox(X,-.1,.12,.4,.36,{body:'red',rib:'accent'});
   g.beginPath();g.arc(.3,.3,.15,0,TAU);X.paint('accent');two(X,.3,.3,.18,'dark')},
 B:X=>{const g=X.g;g.beginPath();for(let i=0;i<32;i++){const a=i*TAU/32-Math.PI/2,r=i%2?.3:.47;g.lineTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath();X.paint('main');X.hl(.2);
   g.beginPath();g.arc(0,0,.27,0,TAU);X.paint('dark',{skip:true});
   g.beginPath();g.moveTo(-.26,-.09);g.lineTo(-.12,.05);g.moveTo(-.12,-.09);g.lineTo(-.26,.05);X.stroke('light',.05,{outline:false});
   two(X,.12,.0,.34,'light')},
 C:X=>{const g=X.g;for(let i=0;i<12;i++){const a=i*TAU/12;g.beginPath();g.moveTo(Math.cos(a)*.18,Math.sin(a)*.18);g.lineTo(Math.cos(a)*(i%2?.34:.46),Math.sin(a)*(i%2?.34:.46));X.stroke('main',.04)}
   g.beginPath();g.moveTo(-.12,-.1);g.lineTo(-.02,.0);g.moveTo(-.02,-.1);g.lineTo(-.12,.0);X.stroke('main',.04);two(X,.1,-.02,.22,'main')},
 D:X=>{const g=X.g;g.save();g.globalAlpha=.4;giftBox(X,.1,-.04,.4,.36,{body:'main',rib:'accent'});g.restore();giftBox(X,-.1,.1,.4,.36,{body:'main',rib:'accent'});
   sparkle(g,.32,-.3,.1);X.paint('accent');sparkle(g,-.34,-.2,.07);X.paint('accent')}
};
// ---------- BOUCLIER ----------
const bou={
 A:X=>{lockIcon(X,0,.04,.5);sparkle(X.g,.32,-.34,.1);X.paint('accent');sparkle(X.g,-.34,-.24,.07);X.paint('accent')},
 B:X=>{const g=X.g;g.save();g.scale(.95,.95);shieldP(g,.36,.46);X.paint('main');X.hl(.18);g.scale(.8,.8);shieldP(g,.36,.46);X.paint('accent',{skip:true});g.restore();snowflake(X,0,-.02,.2,.032,'accent')},
 C:X=>{const g=X.g;giftBox(X,-.04,-.02,.5,.46,{body:'red',rib:'accent'});g.save();g.translate(.2,.2);g.scale(.6,.6);lockIcon(X,0,0,.5);g.restore()},
 D:X=>{const g=X.g;g.save();shieldP(g,.34,.46);X.paint('main');g.restore();star5(g,0,-.02,.2);X.paint('accent')}
};
// ---------- CHOIX ----------
const cho={
 A:X=>{const g=X.g;[['white',.4],['red',.3],['white',.2],['red',.1]].forEach(([r,rad])=>{g.beginPath();g.arc(-.06,.08,rad,0,TAU);X.paint(r)});
   g.beginPath();g.moveTo(-.06,.08);g.lineTo(.3,-.28);X.stroke('accent',.045);
   [[.3,-.28],[.38,-.36]].forEach(([x,y],k)=>{[1,-1].forEach(sg=>{g.beginPath();g.moveTo(x,y);g.lineTo(x+.02+sg*.11,y-.02+sg*(-.11)*-1+(-.11)*0);g.lineTo(x+.1+sg*.05,y-.1+sg*.05*0);g.closePath();X.paint(sg>0?'white':'red')})})},
 B:X=>{const g=X.g;giftBox(X,-.06,.08,.5,.46,{body:'red',rib:'accent'});
   g.save();g.translate(.06,-.04);g.scale(1,1);g.beginPath();g.moveTo(0,0);g.lineTo(0,.46);g.lineTo(.11,.36);g.lineTo(.2,.56);g.lineTo(.29,.52);g.lineTo(.2,.33);g.lineTo(.34,.33);g.closePath();X.paint('white');g.restore();
   sparkle(g,.32,-.34,.1);X.paint('accent');sparkle(g,-.34,-.34,.07);X.paint('accent')},
 C:X=>{const g=X.g;giftBox(X,-.08,.0,.4,.36,{body:'main',rib:'accent'});g.beginPath();g.arc(.14,.1,.22,0,TAU);X.paint('white',{skip:true});
   g.beginPath();g.arc(.14,.1,.2,0,TAU);X.stroke('dark',.045);g.beginPath();g.moveTo(.3,.26);g.lineTo(.44,.42);X.stroke('dark',.075)},
 D:X=>{const g=X.g;g.beginPath();g.arc(0,0,.36,0,TAU);X.stroke('main',.04);
   [[0,-.5,0,-.22],[0,.5,0,.22],[-.5,0,-.22,0],[.5,0,.22,0]].forEach(([a,b,c,d])=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,d);X.stroke('main',.04)});
   star5(g,0,0,.16);X.paint('accent')}
};
// ---------- POUR UN AUTRE ----------
const aut={
 A:X=>{const g=X.g;giftBox(X,0,.14,.46,.42,{body:'red',rib:'accent',bow:false});heartP(g,0,-.2,.34);X.paint('light');X.hl(.1);
   sparkle(g,.3,-.38,.08);X.paint('accent');sparkle(g,-.32,-.3,.06);X.paint('accent')},
 B:X=>{const g=X.g;heartP(g,0,.04,.86);X.paint('main');X.hl(.2);g.beginPath();g.ellipse(-.16,-.14,.1,.06,-.7,0,TAU);X.hl(.5);bow(X,-.22,-.28,.34,'accent')},
 C:X=>{const g=X.g;giftBox(X,-.16,.14,.4,.36,{body:'red',rib:'accent'});
   g.beginPath();g.moveTo(-.02,-.08);g.bezierCurveTo(.1,-.4,.3,-.4,.38,-.22);X.stroke('accent',.05);arrowHead(X,.4,-.18,Math.PI*.42,.08,'accent');
   heartP(g,.3,-.4,.2);X.paint('light');sparkle(g,.04,-.4,.07);X.paint('accent')},
 D:X=>{const g=X.g;heartP(g,-.08,.04,.62);X.paint('main');
   g.beginPath();g.moveTo(.0,.0);g.bezierCurveTo(.2,-.2,.3,-.3,.4,-.38);X.stroke('accent',.05);arrowHead(X,.42,-.4,-Math.PI/4,.08,'accent')}
};
// ---------- PAS DE CHANCE ----------
const pas={
 A:X=>{const g=X.g;g.save();g.translate(0,-.1);cloud(X,'main');g.restore();[[-.2,.24],[0,.34],[.2,.24],[-.1,.44],[.12,.46]].forEach(([x,y])=>snowflake(X,x,y,.07,.016,'accent'))},
 B:X=>{const g=X.g;
   g.beginPath();g.arc(0,.26,.22,0,TAU);X.paint('white');g.beginPath();g.arc(0,-.08,.17,0,TAU);X.paint('white');
   rr(g,-.14,-.36,.28,.14,.02);X.paint('black');rr(g,-.2,-.24,.4,.05,.02);X.paint('black');
   g.beginPath();g.moveTo(.02,-.08);g.lineTo(.2,-.02);g.lineTo(.02,.0);g.closePath();X.paint('accent');
   [-.06,.07].forEach(x=>{g.beginPath();g.arc(x,-.13,.018,0,TAU);X.paint('black',{skip:true})});
   g.beginPath();g.moveTo(-.06,.04);g.quadraticCurveTo(0,-.01,.07,.04);X.stroke('black',.016,{outline:false});
   g.beginPath();g.moveTo(-.2,.05);g.bezierCurveTo(-.1,.14,.1,.14,.2,.05);g.lineTo(.22,.12);g.bezierCurveTo(.1,.2,-.1,.2,-.22,.12);g.closePath();X.paint('main');
   [.2,.28,.36].forEach(y=>{g.beginPath();g.arc(0,y,.02,0,TAU);X.paint('black',{skip:true})})},
 C:X=>{const g=X.g;g.beginPath();g.moveTo(-.38,.08);g.lineTo(-.24,-.2);g.lineTo(-.02,-.34);g.lineTo(.22,-.26);g.lineTo(.4,-.02);g.lineTo(.3,.26);g.lineTo(.06,.38);g.lineTo(-.2,.32);g.closePath();X.paint('black');
   g.beginPath();g.moveTo(-.24,-.2);g.lineTo(-.02,-.34);g.lineTo(.08,-.1);g.lineTo(-.2,-.02);g.closePath();X.hl(.22);
   g.beginPath();g.moveTo(.22,-.26);g.lineTo(.4,-.02);g.lineTo(.2,.06);g.lineTo(.08,-.1);g.closePath();X.hl(.12)},
 D:X=>{const g=X.g;
   const crack=[[0,-.36],[.07,-.2],[-.06,-.07],[.08,.07],[-.05,.21],[0,.36]];
   const piece=(side,dx,dy,rot)=>{g.save();g.translate(dx,dy+.04);g.rotate(rot);
     g.beginPath();crack.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.lineTo(side*.6,.36);g.lineTo(side*.6,-.36);g.closePath();g.save();g.clip();
     g.beginPath();g.arc(0,0,.34,0,TAU);X.paint('main');X.hl(side<0?.22:.05);g.restore();
     g.beginPath();crack.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));X.stroke('dark',.018,{outline:false});g.restore()};
   piece(-1,-.03,0,-.07);piece(1,.05,.03,.09);
   rr(g,-.1,-.5,.2,.12,.02);X.paint('accent');
   [[.28,.38,.06],[.4,.28,.04],[-.36,.4,.05]].forEach(([x,y,s])=>{g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s,y+s);g.lineTo(x-s,y+s*.6);g.closePath();X.paint('main')})}
};
// ---------- CADEAU ----------
const gift={
 A:(X,v=0)=>{const c=[['red','accent'],['green','white'],['blue','accent']][v%3];giftBox(X,0,.04,.62,.56,{body:c[0],rib:c[1]})},
 B:(X,v=0)=>{const c=['main','green','blue'][v%3];bauble(X,0,.1,.3,c,{band:true})},
 C:(X,v=0)=>{giftBox(X,0,.04,.62,.56,{body:'main',rib:['accent','white','accent'][v%3]})},
 D:(X,v=0)=>{const g=X.g;
   if(v%3===0){g.beginPath();g.moveTo(0,-.46);g.lineTo(.3,-.06);g.lineTo(.18,-.06);g.lineTo(.38,.28);g.lineTo(-.38,.28);g.lineTo(-.18,-.06);g.lineTo(-.3,-.06);g.closePath();X.paint('green');X.hl(.14);rr(g,-.07,.28,.14,.14,.01);X.paint('dark');star5(g,0,-.44,.1);X.paint('accent')}
   else if(v%3===1){star5(g,0,0,.46,.5);X.paint('accent');X.hl(.2)}
   else{g.beginPath();g.moveTo(.2,.42);g.lineTo(.2,-.16);g.arc(0,-.16,.2,0,Math.PI,true);X.stroke('white',.13);g.save();g.beginPath();g.moveTo(.2,.42);g.lineTo(.2,-.16);g.arc(0,-.16,.2,0,Math.PI,true);g.setLineDash([.07,.07]);X.stroke('red',.12,{outline:false});g.restore()}}
};
// ---------- MYSTÈRE ----------
const mys={
 A:X=>{qm(X,0,.0,.78,'main',.17);sparkle(X.g,.34,-.36,.1);X.paint('accent');sparkle(X.g,-.36,.28,.07);X.paint('accent')},
 B:X=>{const g=X.g;giftBox(X,0,.04,.66,.6,{body:'black',rib:'accent'});qm(X,0,.1,.3,'accent',.065)},
 C:X=>{const g=X.g;rr(g,-.2,.3,.4,.1,.04);X.paint('dark');g.beginPath();g.arc(0,-.02,.34,0,TAU);X.paint('accent');X.hl(.25);qm(X,0,-.02,.4,'dark',.07);
   g.beginPath();g.ellipse(-.14,-.18,.1,.05,-.7,0,TAU);X.hl(.55)},
 D:X=>{const g=X.g;star5(g,0,0,.46,.55);X.stroke('main',.03);qm(X,0,.0,.46,'main',.06)}
};

// ---------- VOL (version « voleur tout simple ») ----------
function thiefMask(X,cy,w){const g=X.g;
  g.beginPath();g.moveTo(-w,cy-.01);g.bezierCurveTo(-w*.6,cy-.1,-w*.25,cy-.05,0,cy-.05);g.bezierCurveTo(w*.25,cy-.05,w*.6,cy-.1,w,cy-.01);g.bezierCurveTo(w*1.04,cy+.09,w*.7,cy+.14,w*.4,cy+.1);g.bezierCurveTo(w*.22,cy+.07,w*.12,cy+.03,0,cy+.03);g.bezierCurveTo(-w*.12,cy+.03,-w*.22,cy+.07,-w*.4,cy+.1);g.bezierCurveTo(-w*.7,cy+.14,-w*1.04,cy+.09,-w,cy-.01);g.closePath();X.paint('black');
  [-1,1].forEach(sg=>{g.beginPath();g.ellipse(sg*w*.43,cy+.02,w*.2,w*.12,sg*-.15,0,TAU);X.paint('white',{skip:true});g.beginPath();g.arc(sg*w*.43+sg*.01,cy+.025,w*.06,0,TAU);X.paint('black',{skip:true})});
}
function beanie(X,cx,cy,r){const g=X.g;
  g.beginPath();g.arc(cx,cy,r,Math.PI,0);g.closePath();X.paint('black');X.hl(.1);
  rr(g,cx-r*1.03,cy-r*.12,r*2.06,r*.3,.03);X.paint('dark');
  g.beginPath();g.arc(cx,cy-r,r*.12,0,TAU);X.paint('dark');
}
function thiefBust(X,o={}){const g=X.g;
  g.beginPath();g.moveTo(-.42,.5);g.bezierCurveTo(-.42,.3,-.32,.22,-.12,.2);g.lineTo(.12,.2);g.bezierCurveTo(.32,.22,.42,.3,.42,.5);g.closePath();X.paint('white');
  g.save();g.beginPath();g.moveTo(-.42,.5);g.bezierCurveTo(-.42,.3,-.32,.22,-.12,.2);g.lineTo(.12,.2);g.bezierCurveTo(.32,.22,.42,.3,.42,.5);g.closePath();g.clip();
  for(let y=.2;y<.52;y+=.1){g.beginPath();g.rect(-.5,y,1,.05);g.fillStyle=X.neon?'rgba(0,0,0,0)':X.c('black');g.fill()}g.restore();
  g.beginPath();g.moveTo(-.42,.5);g.bezierCurveTo(-.42,.3,-.32,.22,-.12,.2);g.lineTo(.12,.2);g.bezierCurveTo(.32,.22,.42,.3,.42,.5);X.stroke('black',.012,{outline:false});
  rr(g,-.09,.1,.18,.14,.04);X.paint('skin');
  g.beginPath();g.ellipse(0,-.07,.27,.3,0,0,TAU);X.paint('skin');
  [-1,1].forEach(sg=>{g.beginPath();g.ellipse(sg*.275,-.04,.04,.06,0,0,TAU);X.paint('skin')});
  beanie(X,0,-.12,.29);thiefMask(X,-.04,.3);
  g.beginPath();g.moveTo(-.1,.12);g.quadraticCurveTo(0,.2,.12,.1);X.stroke('dark',.02,{outline:false});
  g.beginPath();g.moveTo(.02,.02);g.lineTo(-.02,.07);g.lineTo(.04,.075);X.stroke('dark',.012,{outline:false});
}
const vol2={
 A:X=>thiefBust(X),
 B:X=>{const g=X.g;                        // silhouette qui file avec un sac
   g.beginPath();g.arc(-.1,-.04,.26,0,TAU);X.paint('accent');X.hl(.15);
   g.beginPath();g.moveTo(-.22,-.24);g.quadraticCurveTo(-.1,-.34,.02,-.26);g.lineTo(.0,-.2);g.quadraticCurveTo(-.1,-.27,-.2,-.19);g.closePath();X.paint('dark');
   g.beginPath();g.arc(.12,-.26,.12,0,TAU);X.paint('black');beanie(X,.12,-.28,.12);
   g.beginPath();g.moveTo(.12,-.15);g.bezierCurveTo(.22,-.08,.26,.1,.2,.2);g.bezierCurveTo(.14,.24,.04,.2,.0,.12);g.closePath();X.paint('black');
   g.beginPath();g.moveTo(.14,.2);g.lineTo(.3,.42);g.moveTo(.1,.2);g.lineTo(.0,.42);X.stroke('black',.08);
   g.beginPath();g.moveTo(.16,-.04);g.lineTo(-.04,.02);X.stroke('black',.07);
   g.beginPath();g.arc(.16,-.24,.015,0,TAU);X.paint('white',{skip:true})},
 C:X=>{const g=X.g;
   g.beginPath();g.ellipse(0,.04,.3,.32,0,0,TAU);X.paint('skin');
   [-1,1].forEach(sg=>{g.beginPath();g.ellipse(sg*.3,.06,.045,.07,0,0,TAU);X.paint('skin')});
   g.beginPath();g.ellipse(0,-.2,.3,.1,0,0,TAU);X.paint('main');X.hl(.14);   // casquette plate
   g.beginPath();g.moveTo(-.32,-.2);g.bezierCurveTo(-.3,-.4,.3,-.4,.32,-.2);g.bezierCurveTo(.2,-.26,-.2,-.26,-.32,-.2);g.closePath();X.paint('dark');X.hl(.1);
   g.beginPath();g.moveTo(.0,-.21);g.bezierCurveTo(.2,-.18,.42,-.16,.46,-.1);g.bezierCurveTo(.3,-.06,.1,-.12,0,-.14);g.closePath();X.paint('dark');
   thiefMask(X,.0,.32);
   g.beginPath();g.moveTo(-.18,.2);g.bezierCurveTo(-.1,.3,.1,.3,.18,.2);g.bezierCurveTo(.1,.24,-.1,.24,-.18,.2);g.closePath();X.paint('white');
   g.beginPath();g.moveTo(-.16,.22);g.quadraticCurveTo(0,.34,.16,.22);X.stroke('dark',.016,{outline:false});
   [-.12,0,.12].forEach(x=>{g.beginPath();g.arc(x,.17,.012,0,TAU);X.paint('dark',{skip:true})})},
 D:X=>{const g=X.g;beanie(X,0,-.1,.3);thiefMask(X,.04,.34);
   g.beginPath();g.moveTo(-.2,.22);g.quadraticCurveTo(0,.34,.2,.22);X.stroke('main',.03)}
};

// ---------- VOL : nouvelles pistes ----------
function mustache(X,cx,cy,w){const g=X.g;[-1,1].forEach(sg=>{g.beginPath();g.moveTo(cx,cy);g.bezierCurveTo(cx+sg*w*.3,cy-w*.22,cx+sg*w*.8,cy-w*.12,cx+sg*w,cy-w*.34);g.bezierCurveTo(cx+sg*w*.84,cy+w*.04,cx+sg*w*.4,cy+w*.14,cx,cy+w*.06);g.closePath();X.paint('black')})}
function tinySack(X,cx,cy,r){const g=X.g;
  g.beginPath();g.moveTo(cx-r*.5,cy-r*.7);g.bezierCurveTo(cx-r*1.5,cy-r*.2,cx-r*1.4,cy+r*1.2,cx-r*.4,cy+r*1.2);g.lineTo(cx+r*.4,cy+r*1.2);g.bezierCurveTo(cx+r*1.4,cy+r*1.2,cx+r*1.5,cy-r*.2,cx+r*.5,cy-r*.7);g.closePath();X.paint('sack');X.hl(.1);
  g.beginPath();g.moveTo(cx-r*.6,cy-r*.6);g.quadraticCurveTo(cx,cy-r*.4,cx+r*.6,cy-r*.6);X.stroke('dark',r*.18,{outline:false});
}
const vol3={
 A:X=>{const g=X.g;                       // cagoule de cambrioleur + sac de butin
   tinySack(X,.3,.3,.16);giftBox(X,.3,.02,.2,.18,{body:'red',rib:'accent'});
   g.beginPath();g.moveTo(-.46,.5);g.bezierCurveTo(-.46,.3,-.36,.22,-.14,.2);g.lineTo(.14,.2);g.bezierCurveTo(.36,.22,.46,.3,.46,.5);g.closePath();X.paint('black');X.hl(.08);
   g.beginPath();g.ellipse(0,-.06,.27,.32,0,0,TAU);X.paint('black');X.hl(.1);
   g.beginPath();g.ellipse(0,-.08,.2,.09,0,0,TAU);X.paint('skin');
   [-1,1].forEach(sg=>{g.beginPath();g.ellipse(sg*.085,-.08,.045,.04,0,0,TAU);X.paint('white',{skip:true});g.beginPath();g.arc(sg*.085+sg*.008,-.08,.022,0,TAU);X.paint('black',{skip:true});
     g.beginPath();g.moveTo(sg*.04,-.16);g.lineTo(sg*.14,-.14);X.stroke('black',.022,{outline:false})})},
 B:X=>{const g=X.g;                       // gentleman cambrioleur : haut-de-forme, masque, moustache
   g.beginPath();g.moveTo(-.44,.5);g.bezierCurveTo(-.44,.3,-.34,.26,-.14,.22);g.lineTo(.14,.22);g.bezierCurveTo(.34,.26,.44,.3,.44,.5);g.closePath();X.paint('black');
   g.beginPath();g.moveTo(-.12,.22);g.lineTo(0,.46);g.lineTo(.12,.22);g.closePath();X.paint('white');
   g.beginPath();g.moveTo(-.1,.3);g.lineTo(.1,.3);g.lineTo(.07,.4);g.lineTo(-.07,.4);g.closePath();X.paint('red',{skip:true});
   [-1,1].forEach(sg=>{g.beginPath();g.moveTo(0,.31);g.lineTo(sg*.13,.26);g.lineTo(sg*.13,.38);g.closePath();X.paint('red')});
   g.beginPath();g.ellipse(0,-.02,.24,.27,0,0,TAU);X.paint('skin');
   rr(g,-.2,-.46,.4,.34,.03);X.paint('black');X.hl(.1);rr(g,-.2,-.2,.4,.07,.01);X.paint('accent');
   g.beginPath();g.ellipse(0,-.12,.34,.07,0,0,TAU);X.paint('black');X.hl(.1);
   thiefMask(X,-.02,.27);mustache(X,0,.12,.17);
   g.beginPath();g.moveTo(-.07,.2);g.quadraticCurveTo(0,.25,.07,.2);X.stroke('dark',.014,{outline:false})},
 C:X=>{const g=X.g;                       // voleur en pied, sac sur le dos
   tinySack(X,-.26,-.02,.19);
   g.beginPath();g.moveTo(.0,.1);g.lineTo(.14,.44);X.stroke('black',.1);g.beginPath();g.moveTo(-.02,.1);g.lineTo(-.12,.44);X.stroke('black',.1);
   [[.18,.46],[-.08,.46]].forEach(([x,y])=>{g.beginPath();g.ellipse(x+.02,y,.075,.04,0,0,TAU);X.paint('dark')});
   rr(g,-.14,-.2,.3,.34,.08);X.paint('white');g.save();rr(g,-.14,-.2,.3,.34,.08);g.clip();for(let y=-.16;y<.14;y+=.1){g.beginPath();g.rect(-.2,y,.4,.05);g.fillStyle=X.neon?'rgba(0,0,0,0)':X.c('black');g.fill()}g.restore();
   g.beginPath();g.moveTo(.1,-.12);g.lineTo(.3,-.02);X.stroke('white',.075);g.beginPath();g.arc(.31,-.02,.04,0,TAU);X.paint('skin');
   g.beginPath();g.moveTo(-.1,-.12);g.lineTo(-.2,-.06);X.stroke('white',.075);
   g.beginPath();g.arc(.02,-.32,.14,0,TAU);X.paint('skin');beanie(X,.02,-.34,.14);thiefMask(X,-.3,.15)},
 D:X=>{const g=X.g;                       // voleur qui guette par-dessus un mur
   g.beginPath();g.arc(0,-.12,.25,0,TAU);X.paint('skin');beanie(X,0,-.16,.26);thiefMask(X,-.08,.27);
   [-1,1].forEach(sg=>{g.beginPath();g.arc(sg*.09+.03,-.07,.018,0,TAU);X.paint('white',{skip:true})});
   rr(g,-.5,.1,1,.4,.02);X.paint('red');
   g.save();rr(g,-.5,.1,1,.4,.02);g.clip();
   for(let y=.2;y<.5;y+=.1){g.beginPath();g.moveTo(-.5,y);g.lineTo(.5,y);X.stroke('white',.012,{outline:false})}
   for(let r=0;r<4;r++)for(let x=-.5+(r%2)*.12;x<.5;x+=.24){g.beginPath();g.moveTo(x,.1+r*.1);g.lineTo(x,.2+r*.1);X.stroke('white',.012,{outline:false})}
   g.restore();
   [-1,1].forEach(sg=>{rr(g,sg*.2-.06,.04,.12,.1,.05);X.paint('black')})}
};
// ---------- CADEAU AU CHOIX : nouvelles pistes ----------
const cho2={
 A:X=>{const g=X.g;
   g.beginPath();g.arc(0,-.02,.4,0,TAU);X.paint('accent',{skip:true});
   const gr=g.createRadialGradient(0,-.02,.05,0,-.02,.42);gr.addColorStop(0,'rgba(255,235,150,.55)');gr.addColorStop(1,'rgba(255,235,150,0)');if(!X.neon){g.fillStyle=gr;g.beginPath();g.arc(0,-.02,.42,0,TAU);g.fill()}
   giftBox(X,-.3,.22,.26,.24,{body:'green',rib:'white'});giftBox(X,.3,.22,.26,.24,{body:'blue',rib:'accent'});
   giftBox(X,0,-.02,.4,.36,{body:'red',rib:'accent'});
   sparkle(g,.3,-.34,.09);X.paint('accent');sparkle(g,-.32,-.3,.07);X.paint('accent');sparkle(g,0,-.46,.06);X.paint('accent')},
 B:X=>{const g=X.g;giftBox(X,-.04,.04,.58,.52,{body:'red',rib:'accent'});
   g.beginPath();g.arc(.28,.26,.2,0,TAU);X.paint('accent');
   g.beginPath();g.moveTo(.18,.26);g.lineTo(.26,.35);g.lineTo(.4,.17);X.stroke('green',.06,{outline:false})},
 C:X=>{const g=X.g;
   for(let r=0;r<2;r++)for(let c=0;c<3;c++){const x=-.31+c*.31,y=-.17+r*.34,sel=(r===1&&c===1);
     if(sel){const gr=g.createRadialGradient(x,y,.02,x,y,.26);gr.addColorStop(0,'rgba(255,235,150,.7)');gr.addColorStop(1,'rgba(255,235,150,0)');if(!X.neon){g.fillStyle=gr;g.beginPath();g.arc(x,y,.26,0,TAU);g.fill()}}
     rr(g,x-.12,y-.12,.24,.24,.04);X.paint(sel?'accent':'red');
     g.beginPath();g.rect(x-.025,y-.12,.05,.24);X.paint(sel?'white':'accent',{skip:true})}
   sparkle(g,.2,.18,.08);X.paint('white')},
 D:X=>{const g=X.g;giftBox(X,-.14,.18,.38,.34,{body:'green',rib:'accent'});
   g.save();g.translate(.1,-.06);g.rotate(.9);rr(g,-.04,-.4,.08,.8,.04);X.paint('black');rr(g,-.045,-.4,.09,.12,.03);X.paint('white');rr(g,-.045,.28,.09,.12,.03);X.paint('accent');g.restore();
   star5(g,.36,-.38,.12);X.paint('accent');sparkle(g,.1,-.34,.07);X.paint('accent');sparkle(g,.4,-.08,.06);X.paint('accent');sparkle(g,.3,.1,.05);X.paint('accent')}
};

// ---------- MOTIFS DE NOËL (cases cadeau) ----------
function stocking(X,o={}){const g=X.g;
  g.beginPath();g.moveTo(-.16,-.38);g.lineTo(.12,-.38);g.lineTo(.12,.1);g.bezierCurveTo(.12,.18,.36,.22,.4,.34);g.bezierCurveTo(.44,.48,.3,.5,.18,.46);g.bezierCurveTo(-.02,.4,-.16,.32,-.16,.1);g.closePath();X.paint('main');X.hl(.14);
  g.beginPath();g.moveTo(.18,.46);g.bezierCurveTo(.3,.5,.44,.48,.4,.34);g.bezierCurveTo(.36,.26,.26,.26,.2,.3);g.closePath();X.paint('white');
  g.beginPath();g.moveTo(-.16,.1);g.bezierCurveTo(-.16,.22,-.1,.3,-.02,.36);g.lineTo(.04,.28);g.bezierCurveTo(-.04,.22,-.04,.14,-.04,.1);g.closePath();X.paint('white');
  rr(g,-.22,-.46,.4,.16,.06);X.paint('white');
  [-.14,-.04,.06,.14].forEach(x=>{g.beginPath();g.arc(x,-.46,.05,0,TAU);X.paint('white',{skip:true})});
}
function bell(X){const g=X.g;
  g.beginPath();g.moveTo(-.34,.24);g.bezierCurveTo(-.3,.1,-.24,-.04,-.2,-.16);g.bezierCurveTo(-.16,-.36,.16,-.36,.2,-.16);g.bezierCurveTo(.24,-.04,.3,.1,.34,.24);g.closePath();X.paint('accent');X.hl(.18);
  rr(g,-.4,.22,.8,.1,.05);X.paint('accent');
  g.beginPath();g.arc(0,.38,.07,0,TAU);X.paint('dark');
  g.beginPath();g.arc(0,-.36,.06,0,TAU);X.paint('dark');
  bow(X,0,-.3,.34,'main');
}
function mitten(X){const g=X.g;
  g.beginPath();g.moveTo(-.2,.28);g.lineTo(-.24,-.06);g.bezierCurveTo(-.26,-.36,.2,-.4,.24,-.08);g.lineTo(.22,.28);g.closePath();X.paint('main');X.hl(.14);
  g.beginPath();g.moveTo(-.24,.06);g.bezierCurveTo(-.4,.04,-.46,.2,-.36,.28);g.bezierCurveTo(-.3,.32,-.22,.26,-.2,.2);g.closePath();X.paint('main');
  rr(g,-.28,.24,.54,.16,.06);X.paint('white');
  [-.2,-.1,0,.1,.2].forEach(x=>{g.beginPath();g.arc(x,.4,.05,0,TAU);X.paint('white',{skip:true})});
  snowflake(X,0,-.08,.13,.026,'white');
}
function gingerbread(X){const g=X.g;
  g.beginPath();g.arc(0,-.28,.15,0,TAU);X.paint('brown');
  g.beginPath();g.moveTo(-.1,-.16);g.lineTo(-.4,-.12);g.bezierCurveTo(-.46,-.1,-.46,.04,-.4,.06);g.lineTo(-.14,.04);g.lineTo(-.2,.3);g.bezierCurveTo(-.24,.42,-.1,.46,-.06,.38);g.lineTo(0,.16);g.lineTo(.06,.38);g.bezierCurveTo(.1,.46,.24,.42,.2,.3);g.lineTo(.14,.04);g.lineTo(.4,.06);g.bezierCurveTo(.46,.04,.46,-.1,.4,-.12);g.lineTo(.1,-.16);g.closePath();X.paint('brown');X.hl(.1);
  [-1,1].forEach(sg=>{g.beginPath();g.arc(sg*.055,-.31,.02,0,TAU);X.paint('white',{skip:true})});
  g.beginPath();g.moveTo(-.07,-.23);g.quadraticCurveTo(0,-.17,.07,-.23);X.stroke('white',.016,{outline:false});
  [-.06,.04,.14].forEach(y=>{g.beginPath();g.arc(0,y,.022,0,TAU);X.paint('red',{skip:true})});
  g.beginPath();g.moveTo(-.07,-.17);g.lineTo(-.14,-.12);g.lineTo(-.14,-.2);g.closePath();X.paint('red');g.beginPath();g.moveTo(.07,-.17);g.lineTo(.14,-.12);g.lineTo(.14,-.2);g.closePath();X.paint('red');
  [[-.4,-.04],[.4,-.04],[-.15,.4],[.15,.4]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,.02,0,TAU);X.paint('white',{skip:true})});
}
function wreath(X){const g=X.g;
  g.beginPath();g.arc(0,0,.3,0,TAU);X.stroke('green',.2);
  for(let i=0;i<24;i++){const a=i*TAU/24;g.beginPath();g.arc(Math.cos(a)*.3,Math.sin(a)*.3,.07,0,TAU);X.paint(i%2?'green':'main',{skip:true});g.fillStyle=i%3?'#2aa862':'#17803f';g.fill()}
  [[.26,-.16],[-.2,-.22],[.0,.36],[-.3,.1]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,.045,0,TAU);X.paint('red')});
  bow(X,0,.3,.42,'main');
}
function holly(X){const g=X.g;
  [-1,1].forEach(sg=>{g.save();g.translate(0,.06);g.rotate(sg*.9);
    g.beginPath();g.moveTo(0,0);for(let i=0;i<=6;i++){const y=-i*.08,x=(i%2?.05:.12);g.lineTo(x*1.2,y-.03)}g.lineTo(0,-.5);for(let i=6;i>=0;i--){const y=-i*.08,x=(i%2?.05:.12);g.lineTo(-x*1.2,y-.03)}g.closePath();X.paint('green');X.hl(.1);
    g.beginPath();g.moveTo(0,0);g.lineTo(0,-.46);X.stroke('white',.012,{outline:false});g.restore()});
  [[-.07,.1],[.07,.1],[0,.2]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,.075,0,TAU);X.paint('red');g.beginPath();g.arc(x-.02,y-.025,.02,0,TAU);X.paint('white',{skip:true})});
}
function reindeer(X){const g=X.g;
  [-1,1].forEach(sg=>{g.beginPath();g.moveTo(sg*.16,-.16);g.bezierCurveTo(sg*.2,-.34,sg*.34,-.4,sg*.36,-.5);X.stroke('sack',.045);
    g.beginPath();g.moveTo(sg*.24,-.28);g.lineTo(sg*.4,-.26);X.stroke('sack',.035);g.beginPath();g.moveTo(sg*.3,-.38);g.lineTo(sg*.18,-.46);X.stroke('sack',.035);
    g.beginPath();g.ellipse(sg*.3,-.06,.09,.05,sg*-.5,0,TAU);X.paint('brown')});
  g.beginPath();g.moveTo(-.26,-.1);g.bezierCurveTo(-.3,.2,-.14,.4,0,.4);g.bezierCurveTo(.14,.4,.3,.2,.26,-.1);g.bezierCurveTo(.16,-.2,-.16,-.2,-.26,-.1);g.closePath();X.paint('brown');X.hl(.1);
  [-1,1].forEach(sg=>{g.beginPath();g.ellipse(sg*.1,.0,.04,.045,0,0,TAU);X.paint('white',{skip:true});g.beginPath();g.arc(sg*.1,.005,.02,0,TAU);X.paint('black',{skip:true})});
  g.beginPath();g.arc(0,.28,.09,0,TAU);X.paint('red');g.beginPath();g.ellipse(-.03,.25,.025,.015,-.5,0,TAU);X.hl(.6);
}
function tree(X){const g=X.g;g.beginPath();g.moveTo(0,-.46);g.lineTo(.3,-.06);g.lineTo(.18,-.06);g.lineTo(.38,.28);g.lineTo(-.38,.28);g.lineTo(-.18,-.06);g.lineTo(-.3,-.06);g.closePath();X.paint('green');X.hl(.14);rr(g,-.07,.28,.14,.14,.01);X.paint('dark');star5(g,0,-.44,.1);X.paint('accent');
  [[-.1,.18],[.14,.1],[-.04,-.1],[.1,.2]].forEach(([x,y],i)=>{g.beginPath();g.arc(x,y,.032,0,TAU);X.paint(i%2?'accent':'red')})}
function candy(X){const g=X.g;const path=()=>{g.beginPath();g.moveTo(.2,.42);g.lineTo(.2,-.16);g.arc(0,-.16,.2,0,Math.PI,true)};path();X.stroke('white',.13);g.save();path();g.setLineDash([.07,.07]);X.stroke('red',.12,{outline:false});g.restore()}
const motifs=[tree,X=>{star5(X.g,0,0,.46,.5);X.paint('accent');X.hl(.2)},candy,bell,stocking,mitten,gingerbread,wreath,holly,X=>{snowflake(X,0,0,.46,.055,'white')},reindeer,X=>bauble(X,0,.1,.3,'main',{band:true})];
const motifNames=['Sapin','Étoile','Canne à sucre','Cloche','Chaussette','Moufle','Pain d’épice','Couronne','Houx','Flocon','Renne','Boule (en réserve)'];
// ---------- MYSTÈRE : nouvelles pistes ----------
const mys2={
 A:X=>{const g=X.g;                         // boîte entrouverte qui laisse filer la lumière
   [-1,0,1].forEach(k=>{g.beginPath();g.moveTo(k*.04,-.04);g.lineTo(k*.34-.05,-.46);g.lineTo(k*.34+.1,-.46);g.closePath();if(!X.neon){const gr=g.createLinearGradient(0,-.04,0,-.46);gr.addColorStop(0,'rgba(255,230,140,.85)');gr.addColorStop(1,'rgba(255,230,140,0)');g.fillStyle=gr;g.fill()}else X.paint('accent')});
   rr(g,-.3,.0,.6,.4,.03);X.paint('black');g.beginPath();g.rect(-.05,0,.1,.4);X.paint('accent');
   g.save();g.translate(-.28,-.0);g.rotate(-.3);rr(g,-.06,-.14,.64,.16,.03);X.paint('black');g.beginPath();g.rect(.19,-.14,.1,.16);X.paint('accent');g.restore();
   qm(X,0,-.24,.28,'accent',.06);sparkle(g,.32,-.3,.08);X.paint('accent');sparkle(g,-.34,-.34,.06);X.paint('accent')},
 B:X=>{const g=X.g;                         // boule à neige mystère
   rr(g,-.26,.28,.52,.14,.05);X.paint('dark');
   g.beginPath();g.arc(0,.0,.34,0,TAU);X.paint('blue');X.hl(.1);
   g.beginPath();g.ellipse(0,.3,.3,.05,0,0,TAU);X.paint('white');
   qm(X,0,-.04,.4,'accent',.075);
   [[-.2,-.16],[.22,-.1],[-.1,.14],[.18,.18],[.0,-.3]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,.02,0,TAU);X.paint('white',{skip:true})});
   g.beginPath();g.ellipse(-.16,-.18,.1,.05,-.7,0,TAU);X.hl(.55)},
 C:X=>{const g=X.g;                         // chapeau de magicien
   g.beginPath();g.ellipse(0,.26,.4,.1,0,0,TAU);X.paint('black');
   g.beginPath();g.moveTo(-.24,.24);g.lineTo(-.18,-.3);g.bezierCurveTo(-.1,-.38,.1,-.38,.18,-.3);g.lineTo(.24,.24);g.closePath();X.paint('black');X.hl(.08);
   rr(g,-.25,.1,.5,.12,.02);X.paint('main');
   qm(X,0,-.08,.34,'accent',.06);
   star5(g,.28,-.32,.09);X.paint('accent');sparkle(g,-.3,-.26,.07);X.paint('accent');sparkle(g,.34,0,.05);X.paint('accent')},
 D:X=>{const g=X.g;g.save();g.scale(1.1,1.1);g.translate(-.02,.02);stocking(X);g.restore();qm(X,.0,-.12,.3,'accent',.06);sparkle(g,.36,-.38,.09);X.paint('accent')}
};

  const MAP={vol:['couleur',X=>vol3.A(X)],echange:['couleur',X=>ech.B(X)],double:['couleur',X=>dbl.A(X)],bouclier:['or',X=>bou.A(X)],
    choix:['couleur',X=>cho2.A(X)],autre:['couleur',X=>aut.A(X)],pas:['couleur',X=>pas.B(X)],mystery:['couleur',X=>mys2.A(X)]};
  const SPR={},SPRN=['sapin','etoile','canne','cloche','chaussette','moufle','painepice','couronne','houx','flocon','renne','boule'];
  const SPRKEY=k=>k==='gift'?null:(k==='pas'?'pas':(k==='mystery'?'mystery':k));
  function vec(g,key,z,d){
    let style='couleur',fn;
    if(key==='gift'){fn=X=>motifs[(d||0)%motifs.length](X)}else{const m=MAP[key];if(!m)return;style=m[0];fn=m[1]}
    g.save();g.scale(z,z);const X=makeX(g,style);X.s=z;g.lineJoin='round';g.lineCap='round';
    g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=z*.03;g.shadowOffsetY=z*.02;
    fn(X);g.restore();
  }
  function draw(g,key,z,d){
    const sk=key==='gift'?'g'+((d||0)%12):(key==='pas'?'pas':key);
    const im=SPR[sk==='pas'?'pas':sk];
    if(im&&im.complete&&im.naturalWidth){
      g.save();g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=z*.05;g.shadowOffsetY=z*.03;
      const s=z*.96;g.drawImage(im,-s/2,-s/2,s,s);g.restore();return;
    }
    vec(g,key==='pas'?'pas':key,z,d);
  }
  function load(onAll){
    const D=window.SANTA_ICONS;if(!D)return;const ks=Object.keys(D);let n=0;
    ks.forEach(k=>{const im=new Image();im.onload=()=>{if(++n===ks.length&&onAll)onAll()};im.onerror=()=>{if(++n===ks.length&&onAll)onAll()};im.src=D[k];SPR[k]=im});
  }
  return{draw,load};
})();

/* ============ AUDIO (Web Audio, tout est synthétisé) ============ */
const AE=(()=>{
  let ctx=null,master,fx,mus,nb,el=null,hasSrc=false,lastTick=0;
  const vol=Object.assign({fx:.8,mus:.45,mute:false},store.get(KEYSON)||{});
  function apply(){
    if(!ctx)return;
    master.gain.value=vol.mute?0:1;fx.gain.value=vol.fx;mus.gain.value=vol.mus;
    if(el&&!hasSrc)el.volume=vol.mus;
  }
  function init(){
    if(ctx){if(ctx.state==='suspended')ctx.resume();return}
    try{
      const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();
      master=ctx.createGain();fx=ctx.createGain();mus=ctx.createGain();
      fx.connect(master);mus.connect(master);master.connect(ctx.destination);
      nb=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);
      const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      apply();if(ctx.state==='suspended')ctx.resume();
    }catch(e){ctx=null}
  }
  function tone(o){
    if(!ctx)return;
    const f=o.f||440,t=o.t||0,d=o.d||.3,type=o.type||'sine',v=o.v||.3,a=Math.min(o.a||.004,d*.95);
    const T=ctx.currentTime+t,os=ctx.createOscillator();
    os.type=type;os.frequency.setValueAtTime(f,T);
    if(o.slide)os.frequency.exponentialRampToValueAtTime(o.slide,T+d);
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,T);
    g.gain.exponentialRampToValueAtTime(v,T+a);g.gain.exponentialRampToValueAtTime(.0001,T+d);
    if(o.lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;os.connect(fl);fl.connect(g)}else os.connect(g);
    g.connect(fx);os.start(T);os.stop(T+d+.05);
  }
  function noise(o){
    if(!ctx)return;
    const t=o.t||0,d=o.d||.1,v=o.v||.3,a=Math.min(o.a||.002,d*.95);
    const T=ctx.currentTime+t,s=ctx.createBufferSource();s.buffer=nb;
    const fl=ctx.createBiquadFilter();fl.type=o.type||'bandpass';fl.Q.value=o.q||1;
    fl.frequency.setValueAtTime(o.f||2000,T);
    if(o.fe)fl.frequency.exponentialRampToValueAtTime(o.fe,T+d);
    const g=ctx.createGain();g.gain.setValueAtTime(.0001,T);
    g.gain.exponentialRampToValueAtTime(v,T+a);g.gain.exponentialRampToValueAtTime(.0001,T+d);
    s.connect(fl);fl.connect(g);g.connect(fx);s.start(T,Math.random()*.4,d+.05);
  }
  function bell(f,t=0,v=.18,d=1.6){[[1,1],[2.01,.45],[2.76,.3],[5.4,.15]].forEach(([m,a],i)=>tone({f:f*m,t,d:d/(1+i*.6),v:v*a,a:.002}))}
  function brass(f,t,d,v=.17){tone({f,t,d,type:'sawtooth',v,a:.03,lp:1800});tone({f:f*1.007,t,d,type:'square',v:v*.5,a:.03,lp:1400})}
  function shaker(t=0,n=5){for(let i=0;i<n;i++)noise({t:t+i*.045,d:.04,v:.1,type:'highpass',f:6000+rnd(1500),q:.7})}
  const sfx={
    init,vol,
    tick(speed){
      if(!ctx)return;const now=ctx.currentTime;if(now-lastTick<.011)return;lastTick=now;
      const s=Math.min(1,speed/900),v=.55-.25*s;
      noise({d:.03,v:v*.8,type:'bandpass',f:2200+Math.random()*900,q:3});
      tone({f:1100+Math.random()*200,slide:420,d:.05,type:'triangle',v:v*.55});
      if(s<.35){const w=1-s/.35;tone({f:230+Math.random()*30,slide:90,d:.11,type:'sine',v:.38*w});noise({d:.08,v:.25*w,type:'lowpass',f:700,q:.8})}
    },
    launch(){shaker(0,6);[784,988,1175,1568].forEach((f,i)=>bell(f,i*.09,.12,.9));noise({d:.5,v:.12,type:'bandpass',f:400,fe:2200,q:1.2,a:.3})},
    bells(){[784,988,1175,1568,1976].forEach((f,i)=>bell(f,i*.11,.14,1.4));shaker(.1,8)},
    fanfare(){
      [[262,0,.15],[330,.16,.15],[392,.32,.15],[523,.48,.55],[392,1.1,.18],[523,1.3,1.1]].forEach(([f,t,d])=>brass(f,t,d));
      [[330,.48,.55],[392,.48,.55],[330,1.3,1.1],[392,1.3,1.1],[262,1.3,1.1]].forEach(([f,t,d])=>brass(f,t,d,.1));
      noise({t:.48,d:1.2,v:.18,type:'highpass',f:5000});noise({t:1.3,d:1.6,v:.22,type:'highpass',f:4500});bell(1047,1.3,.12,2);
    },
    fanSmall(){[[392,0,.14],[523,.16,.14],[659,.32,.7]].forEach(([f,t,d])=>brass(f,t,d,.15));bell(1319,.35,.12,1.6);noise({t:.32,d:.7,v:.12,type:'highpass',f:5000})},
    zoom(){noise({d:.8,v:.28,type:'bandpass',f:200,fe:2400,q:1.1,a:.5});tone({f:70,slide:190,d:.7,type:'sine',v:.22,a:.4})},
    twinkle(){for(let i=0;i<7;i++)bell(1500+rnd(1800),i*.28,.05,1.1)},
    pop(i=0){tone({f:500+i*90,slide:1000+i*120,d:.12,v:.2});bell(1200+i*110,.05,.06,.6)},
    rumble(d=1.5){noise({d,v:.55,type:'lowpass',f:70,fe:320,q:.8,a:d*.95});tone({f:38,slide:95,d,type:'sawtooth',v:.22,a:d*.95,lp:220})},
    boom(){tone({f:120,slide:28,d:1,v:1,a:.003});noise({d:1.1,v:.9,type:'lowpass',f:500,fe:60,q:.7,a:.003});noise({d:.5,v:.5,type:'highpass',f:2500})},
    pops(n=10,span=1.4){for(let i=0;i<n;i++){const t=Math.random()*span;noise({t,d:.07,v:.18,type:'highpass',f:2500+Math.random()*3000,q:.6});if(i%3===0)tone({f:600+rnd(500),slide:2400,t:Math.max(0,t-.3),d:.3,v:.04})}},
    steal(){
      noise({d:.5,v:.25,type:'bandpass',f:300,fe:2500,q:1.2,a:.2});
      tone({f:600,slide:150,t:.9,d:.18,type:'square',v:.12,lp:1500});
      [262,311,370,392,370,311].forEach((f,i)=>tone({f,t:1.1+i*.16,d:.12,type:'triangle',v:.16}));
    },
    lock(){
      noise({d:.5,v:.12,type:'bandpass',f:300,fe:1500,q:1.2,a:.3});
      noise({t:.45,d:.09,v:.8,type:'highpass',f:2500,q:.8});tone({f:1400,slide:700,t:.45,d:.12,v:.35});
      tone({f:95,slide:55,t:.45,d:.3,v:.9});
      bell(2093,.7,.1,1.4);bell(2637,.8,.09,1.4);
    },
    sad(){[[392,0,.36],[370,.38,.36],[349,.76,.36],[330,1.14,1.1]].forEach(([f,t,d],i)=>tone({f,t,d,type:'sawtooth',v:.14,a:.04,lp:900,slide:i===3?290:0}))},
    swap(){tone({f:400,slide:900,d:.3,v:.2});tone({f:900,slide:400,t:.3,d:.3,v:.2});bell(1047,.7,.1,1.2)},
    nope(){tone({f:440,slide:330,d:.18,type:'square',v:.1,lp:1500});tone({f:330,slide:220,t:.2,d:.25,type:'square',v:.1,lp:1500})},
    mystere(){bell(523,0,.14,2.4);bell(622,.18,.12,2.2);bell(784,.36,.12,2.2);bell(1047,.6,.14,2.2);noise({d:1.4,v:.08,type:'highpass',f:6000,a:.8});tone({f:130,d:1.5,v:.14,a:.6})},
    drum(d=2.6){let t=0,k=0,step=.13;while(t<d){noise({t,d:.07,v:.05+.35*(t/d),type:'bandpass',f:260,q:1.4});t+=step;step=Math.max(.035,step*.93);k++}}
  };
  sfx.set=(k,v)=>{vol[k]=v;apply();store.set(KEYSON,vol)};
  sfx.setMusic=file=>{
    init();if(!ctx)return false;
    try{
      if(!el){
        el=new Audio();el.loop=true;el.preload='auto';
        try{const src=ctx.createMediaElementSource(el);src.connect(mus);hasSrc=true}catch(e){hasSrc=false}
      }
      if(el._u)URL.revokeObjectURL(el._u);
      el._u=URL.createObjectURL(file);el.src=el._u;apply();
      const p=el.play();if(p&&p.catch)p.catch(()=>{});
      return true;
    }catch(e){return false}
  };
  sfx.toggleMusic=()=>{if(!el)return;if(el.paused){const p=el.play();if(p&&p.catch)p.catch(()=>{})}else el.pause()};
  sfx.hasMusic=()=>!!(el&&el.src);
  return sfx;
})();
['pointerdown','pointerup','touchend','click'].forEach(ev=>document.addEventListener(ev,()=>AE.init(),{capture:true,passive:true}));
document.addEventListener('contextmenu',e=>e.preventDefault());

/* ============ ROUE (canvas) ============ */
const BCl=['#ff3040','#ffc24d','#30ff88','#fff1d6'];
function makeEase(p,ramp){
  const N=400,tab=[0];let a=0;
  for(let i=1;i<=N;i++){const u=i/N;a+=Math.min(1,u/ramp)*Math.pow(1-u,p);tab.push(a)}
  return u=>{const x=clamp(u,0,1)*N,i=Math.min(N-1,Math.floor(x));return(tab[i]+(tab[i+1]-tab[i])*(x-i))/a};
}
const easeOut=makeEase(1.7,.07),easeSoft=u=>1-Math.pow(1-u,2.2),easeIO=u=>-(Math.cos(Math.PI*u)-1)/2,lin=u=>u;
/* ============ PHYSIQUE DE LA ROUE : roue + picots + aiguille à ressort (contacts solides) ============
   Unités : rayon de la roue R = 1, angles en radians, temps en secondes. Écran : y vers le bas, sommet de la roue = (0,-1).
   Chaque picot est un disque rigide sur la roue ; la pointe de l'aiguille est un disque au bout d'une tige à ressort.
   Quand un picot pousse la pointe, l'aiguille est déviée, monte par-dessus le picot puis claque en revenant ;
   en échange le picot est freiné : c'est ce qui ralentit la roue, la fait hésiter et parfois reculer. */
const PHB={rp:.968,pr:.026,Rp:1.17,L:.20,rt:.014,k:.8,In:.8*8e-5,c:.0043,dmax:1.15,e:.12,Iw:1,mu:.62,beta:.04,dt:1/800,push:.22};
const RAD=Math.PI/180;
// Simule un lancer : n cases, rotDeg = position de départ (°), d0 = angle de l'aiguille, w0 = vitesse après la poussée (rad/s).
// rec = true : enregistre toute la trajectoire (pour la rejouer) ; sinon ne renvoie que la position d'arrêt (pour chercher la bonne force).
function physSim(n,rotDeg,d0,w0,P,rec){
  const sA=Math.PI*2/n,dt=P.dt,Rp=P.Rp,L=P.L,rr=P.pr+P.rt,rp=P.rp,In=P.In,Iw=P.Iw,nMax=Math.ceil(30/dt);
  let rot=rotDeg*RAD,w=0,d=d0,dd=0,t=0,still=0,wasTouch=false,np=0,rotMark=-1e9;const nStill=Math.round(.4/dt);
  const RR=rec?new Float64Array(nMax+2):null,DR=rec?new Float64Array(nMax+2):null,ev=rec?[]:null;
  if(rec){RR[0]=rot/RAD;DR[0]=d;np=1}
  for(let s=0;s<nMax;s++){
    const driven=t<P.push;
    if(driven){const u=t/P.push;w=w0*u*u*(3-2*u)}                                   // poussée de lancement
    dd+=(-P.k*d-P.c*dd)/In*dt;                                                      // ressort de l'aiguille
    const sd=Math.sin(d),cd=Math.cos(d),tx=-L*sd,ty=-Rp+L*cd,i0=Math.round(rot/sA);let touch=false;
    for(let i=i0-1;i<=i0+1;i++){                                                    // picots proches de l'aiguille
      const D=i*sA-rot;if(D>.3||D<-.3)continue;
      const sD=Math.sin(D),cD=Math.cos(D);let nx=tx-rp*sD,ny=ty+rp*cD;
      const dist=Math.sqrt(nx*nx+ny*ny);if(dist>=rr)continue;
      touch=true;const inv=1/(dist||1e-9);nx*=inv;ny*=inv;
      const Jn=L*(-cd*nx-sd*ny),Jw=rp*(-cD*nx-sD*ny),den=Jn*Jn/In+(driven?0:Jw*Jw/Iw)||1e-9;
      const pen=Math.max(0,rr-dist-.0005)*.8;                                       // le picot ne traverse pas la pointe : on repousse l'aiguille (légère), jamais la roue
      if(pen>0){if(Math.abs(Jn)>.02)d+=pen/Jn;else{const lam=pen/den;d+=lam*Jn/In;if(!driven)rot-=lam*Jw/Iw}}
      const vn=Jn*dd-Jw*w;
      if(vn<0){                                                                     // choc : le picot pousse l'aiguille, l'aiguille freine le picot
        const j=-(1+P.e)*vn/den;dd+=j*Jn/In;if(!driven)w-=j*Jw/Iw;
        if(rec&&!wasTouch&&-vn>.15)ev.push([t,0,Math.abs(w)/RAD]);
      }
    }
    if(!driven){w-=P.beta*w*dt;const f=P.mu*dt*(t>16?4:1);w=w>f?w-f:w<-f?w+f:0}      // frottements de la roue (après les chocs : à l'arrêt, la roue reste immobile)
    if(rec&&wasTouch&&!touch)ev.push([t,1,Math.abs(w)/RAD]);                        // l'aiguille se libère et claque
    wasTouch=touch;
    if(d>P.dmax){d=P.dmax;if(dd>0)dd*=-.2}else if(d<-P.dmax){d=-P.dmax;if(dd<0)dd*=-.2}   // butées de l'aiguille
    d+=dd*dt;rot+=w*dt;t+=dt;
    if(rec){RR[np]=rot/RAD;DR[np]=d;np++}
    if(!driven&&++still>=nStill){if(Math.abs(rot-rotMark)<2e-4)break;rotMark=rot;still=0}   // arrêt : la roue n'a pas bougé pendant 0,4 s
  }
  return{rot:rot/RAD,t,d,R:rec?{dt,n:np,rot:RR.slice(0,np),d:DR.slice(0,np),ev}:null};
}
const nap=()=>new Promise(r=>setTimeout(r,0));
class Roue{
  constructor(cv,o){this.cv=cv;this.g=cv.getContext('2d');this.o=o;this.segs=[];this.rot=rnd(360);this.fa=0;this.fv=0;this.anim=null;this.lastK=null;this.S=0;this.n=0;this.s=72;this.w=3.2;this.bmp=null;this.zoom=1;this.zt=1;this.Zmax=2.7;this.q=1;this.th=0;this.P=Object.assign({},PHB,o.phys||{});this.tab=null}
  zoomTo(z){this.zt=z}
  resize(){
    const r=this.cv.getBoundingClientRect();if(r.width<10)return;
    const S=Math.round(r.width*Math.min(window.devicePixelRatio||1,2.5));
    if(S===this.S)return;this.S=S;this.cv.width=S;this.cv.height=S;this.R=S*this.o.rf;this.build();
  }
  setSegs(a){this.segs=a;this.n=a.length;this.s=360/this.n;this.w=Math.min(3.2,this.s*.45);this.lastK=null;this.rest();this.build()}
  dc(){const P=this.P;return Math.asin(Math.min(1,(P.pr+P.rt)/P.rp))/RAD+.3}   // demi-largeur (°) de la zone où un picot touche l'aiguille
  rest(){   // à l'arrêt, la roue ne doit pas être posée sur un picot
    if(!this.n||this.anim)return;const s=this.s,dc=this.dc(),p=mod(this.rot,s);
    if(p<dc)this.rot+=dc-p+.2;else if(p>s-dc)this.rot-=p-(s-dc)+.2;
    this.rot=mod(this.rot,360);this.th=0;
  }
  build(){
    if(!this.S||!this.n)return;
    const n=this.n,R=this.R,D=Math.ceil(R*2)+4,q=this.o.q?(D*this.o.q>2000?1.5:this.o.q):1;this.q=q;
    const c=document.createElement('canvas');c.width=c.height=Math.ceil(D*q);
    const g=c.getContext('2d');g.translate(c.width/2,c.width/2);g.scale(q,q);const sA=Math.PI*2/n;
    this.segs.forEach((sg,i)=>{
      const v=this.o.view(sg),a0=-Math.PI/2+i*sA;
      const gr=g.createRadialGradient(0,0,R*.12,0,0,R);gr.addColorStop(0,shade(v.col,-.38));gr.addColorStop(.55,v.col);gr.addColorStop(1,shade(v.col,.2));
      g.beginPath();g.moveTo(0,0);g.arc(0,0,R,a0,a0+sA);g.closePath();g.fillStyle=gr;g.fill();
      g.lineWidth=Math.max(1,R*.006);g.strokeStyle='rgba(255,226,150,.55)';g.stroke();
    });
    const rr=R*this.o.ir,size=Math.min(sA*rr*.9,R*this.o.imax);
    g.textAlign='center';g.textBaseline='middle';
    this.segs.forEach((sg,i)=>{
      const v=this.o.view(sg),ac=-Math.PI/2+(i+.5)*sA;
      g.save();g.translate(Math.cos(ac)*rr,Math.sin(ac)*rr);g.rotate(ac+Math.PI/2);
      if(v.draw)v.draw(g,size*1.25);
      else{
        g.beginPath();g.arc(0,0,size*.55,0,7);g.fillStyle='rgba(255,247,226,.94)';g.fill();
        g.font=`${size*.8}px ${EMOJI}`;g.fillStyle='#000';g.fillText(v.ico,0,size*.04);
      }
      g.restore();
    });
    {const P=this.P,prr=R*P.rp,pr=Math.max(2,R*P.pr);
    for(let i=0;i<n;i++){   // picots : dômes chromés bien visibles, c'est eux qui poussent l'aiguille
      const a=-Math.PI/2+i*sA,x=Math.cos(a)*prr,y=Math.sin(a)*prr;
      g.beginPath();g.arc(x+pr*.28,y+pr*.38,pr*1.12,0,7);g.fillStyle='rgba(0,0,0,.5)';g.fill();
      g.beginPath();g.arc(x,y,pr*1.14,0,7);g.fillStyle='#232a3b';g.fill();
      const pg=g.createRadialGradient(x-pr*.35,y-pr*.4,pr*.05,x,y,pr);pg.addColorStop(0,'#ffffff');pg.addColorStop(.35,'#dfe5ee');pg.addColorStop(.75,'#8f99aa');pg.addColorStop(1,'#4b5463');
      g.beginPath();g.arc(x,y,pr,0,7);g.fillStyle=pg;g.fill();
      g.beginPath();g.arc(x-pr*.32,y-pr*.38,pr*.2,0,7);g.fillStyle='rgba(255,255,255,.9)';g.fill();
    }}
    const ir=g.createRadialGradient(0,0,R*.86,0,0,R);ir.addColorStop(0,'rgba(0,0,0,0)');ir.addColorStop(1,'rgba(0,0,0,.4)');
    g.beginPath();g.arc(0,0,R,0,7);g.fillStyle=ir;g.fill();
    this.bmp=c;
  }
  update(dt){
    this.zoom+=(this.zt-this.zoom)*(1-Math.exp(-dt*3));
    const a=this.anim;
    if(a&&a.R)return this.playPhys(dt,a);                 // lancer physique : on rejoue la trajectoire calculée
    if(a)return this.updateLegacy(dt);                    // secours : ancienne animation scriptée
    this.speed=0;                                         // roue arrêtée : l'aiguille reste où la physique l'a laissée
  }
  playPhys(dt,a){
    const R=a.R;a.t+=dt;
    if(!a.z&&a.zoomAt&&a.t>=a.zoomAt){a.z=1;a.onZoom&&a.onZoom()}
    const N=R.n-1;let f=a.t/R.dt,end=false;if(f>=N){f=N;end=true}
    const i=Math.floor(f),u=f-i,j=i<N?i+1:i,r0=R.rot[i],r1=R.rot[j];
    this.rot=r0+(r1-r0)*u;this.th=R.d[i]+(R.d[j]-R.d[i])*u;this.speed=Math.abs(r1-r0)/R.dt;
    while(a.e<R.ev.length&&R.ev[a.e][0]<=a.t){    // sons : un clic à chaque choc picot/aiguille, un petit claquement quand elle se libère (roue lente)
      const e=R.ev[a.e++];if(this.o.tick){if(e[1]===0)this.o.tick(e[2]);else if(e[2]<150)this.o.tick(300)}
    }
    if(end){this.anim=null;this.rot=mod(R.rot[N],360);this.th=R.d[N];this.speed=0;a.done()}
  }
  updateLegacy(dt){
    const a=this.anim,prev=this.rot;
    if(a){
      a.t+=dt;if(a.i===0&&!a.z&&a.zoomAt&&a.t>=a.zoomAt){a.z=1;a.onZoom&&a.onZoom()}
      const ph=a.ph[a.i],u=Math.min(1,a.t/ph.d);
      this.rot=ph.f+(ph.to-ph.f)*ph.e(u);
      if(u>=1){a.i++;a.t=0;if(a.i>=a.ph.length){this.anim=null;this.rot=mod(this.rot,360);a.done()}else if(a.ph[a.i].on)a.ph[a.i].on()}
    }
    const sp=dt>0?Math.abs(this.rot-prev)/dt:0;this.speed=sp;
    if(!this.n)return;
    const L=mod(this.rot,360),k=Math.floor(L/this.s);   // sens anti-horaire : l'angle sous l'aiguille augmente
    if(this.lastK!==null&&k!==this.lastK&&sp>0&&this.o.tick)this.o.tick(sp);
    this.lastK=k;
    const d=(k+1)*this.s-L,target=d<this.w?(1-d/this.w):0;
    for(let i=0;i<2;i++){const h=dt/2,acc=1500*(target-this.fa)-36*this.fv;this.fv+=acc*h;this.fa+=this.fv*h}
    this.fa=clamp(this.fa,-.5,1.3);this.th=this.fa*.45;
  }
  draw(t){
    const g=this.g,S=this.S;if(!S)return;g.clearRect(0,0,S,S);
    const c=S/2,R=this.R,z=this.zoom;
    g.save();
    if(z>1.001){const k=Math.min(1,(z-1)/(this.Zmax-1)),px=c,py=c-R*.97,qy=c*.74;g.translate(px,py+(qy-py)*k);g.scale(z,z);g.translate(-px,-py)}
    // ombre portée
    const sh=g.createRadialGradient(c,c,R*1.05,c,c,R*1.32);sh.addColorStop(0,'rgba(0,0,0,.6)');sh.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=sh;g.beginPath();g.arc(c,c,R*1.32,0,7);g.fill();
    // jante chrome
    let rim;
    if(g.createConicGradient){
      rim=g.createConicGradient(-.6,c,c);
      ['#f4f6fa','#8e97a6','#e9edf3','#59627a','#f8fafc','#9aa3b2','#dfe4ec','#5d667a','#f4f6fa'].forEach((cl,i,a)=>rim.addColorStop(i/(a.length-1),cl));
    }else{rim=g.createRadialGradient(c,c,R,c,c,R*1.13);rim.addColorStop(0,'#c9d0dc');rim.addColorStop(.5,'#f4f6fa');rim.addColorStop(1,'#6b7486')}
    g.beginPath();g.arc(c,c,R*1.13,0,7);g.fillStyle=rim;g.fill();
    const bev=g.createRadialGradient(c,c,R*.99,c,c,R*1.13);bev.addColorStop(0,'rgba(0,0,0,.5)');bev.addColorStop(.25,'rgba(0,0,0,0)');bev.addColorStop(.85,'rgba(255,255,255,0)');bev.addColorStop(1,'rgba(0,0,0,.45)');
    g.beginPath();g.arc(c,c,R*1.13,0,7);g.fillStyle=bev;g.fill();
    g.beginPath();g.arc(c,c,R,0,7);g.fillStyle='#10152b';g.fill();
    if(this.bmp){const q=this.q;g.save();g.translate(c,c);g.rotate(-this.rot*Math.PI/180);g.drawImage(this.bmp,-this.bmp.width/(2*q),-this.bmp.height/(2*q),this.bmp.width/q,this.bmp.height/q);g.restore()}
    // reflets de lumière (fixes dans l'espace, la roue tourne dessous)
    g.save();g.beginPath();g.arc(c,c,R,0,7);g.clip();g.globalCompositeOperation='lighter';
    const la=t*.8,lx=c+Math.cos(la)*R*.55,ly=c+Math.sin(la)*R*.55;
    const gl=g.createRadialGradient(lx,ly,0,lx,ly,R*.75);gl.addColorStop(0,`rgba(255,244,220,${.12+.1*LV})`);gl.addColorStop(1,'rgba(255,244,220,0)');
    g.fillStyle=gl;g.fillRect(c-R,c-R,R*2,R*2);
    const hue=(t*40)%360,lx2=c+Math.cos(la+Math.PI)*R*.6,ly2=c+Math.sin(la+Math.PI)*R*.6;
    const gl2=g.createRadialGradient(lx2,ly2,0,lx2,ly2,R*.7);gl2.addColorStop(0,`hsla(${hue},100%,60%,${.07+.12*LV})`);gl2.addColorStop(1,'hsla(0,0%,0%,0)');
    g.fillStyle=gl2;g.fillRect(c-R,c-R,R*2,R*2);
    g.restore();
    // chenillard sur la jante chromée
    if(this.o.bulbs){
      const B=48,mode=Math.floor(t/7)%3,rate=(10+22*LV)*(1+Math.min(1.5,(this.speed||0)/600)),head=(t*rate)%B;
      const posx=i=>c+Math.cos(-i/B*Math.PI*2-Math.PI/2)*R*1.065,posy=i=>c+Math.sin(-i/B*Math.PI*2-Math.PI/2)*R*1.065;
      const Ia=[];
      for(let i=0;i<B;i++){
        let I=0;
        if(mode===0){for(let h=0;h<3;h++)I=Math.max(I,Math.max(0,1-mod(head+h*B/3-i,B)/9))}
        else if(mode===1){I=Math.max(0,1-mod(i<B/2?head-i:i-head,B)/9)}
        else{I=((i+Math.floor(t*rate/5))%2===0)?1:0}
        Ia.push(.07+.93*Math.pow(I,1.25));
      }
      for(let i=0;i<B;i++){g.fillStyle='#1c2231';g.beginPath();g.arc(posx(i),posy(i),R*.027,0,7);g.fill();g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=R*.006;g.stroke()}
      g.globalCompositeOperation='lighter';
      for(let i=0;i<B;i++){
        const x=posx(i),y=posy(i),I=Ia[i],col=BCl[(Math.floor(i/6)+Math.floor(t*.5))%4];
        g.fillStyle=col;g.globalAlpha=.2*I;g.beginPath();g.arc(x,y,R*.075,0,7);g.fill();
        g.globalAlpha=.38*I;g.beginPath();g.arc(x,y,R*.042,0,7);g.fill();
        g.globalAlpha=.25+.75*I;g.beginPath();g.arc(x,y,R*.02,0,7);g.fill();
        g.fillStyle='#fff';g.globalAlpha=.85*I;g.beginPath();g.arc(x-R*.005,y-R*.005,R*.0075,0,7);g.fill();
      }
      g.globalAlpha=1;g.globalCompositeOperation='source-over';
    }
    // moyeu chromé
    const hr=R*.14,hg=g.createRadialGradient(c-hr*.35,c-hr*.35,hr*.05,c,c,hr);
    hg.addColorStop(0,'#ffffff');hg.addColorStop(.5,'#9aa3b2');hg.addColorStop(1,'#3f4757');
    g.beginPath();g.arc(c,c,hr,0,7);g.fillStyle=hg;g.fill();g.lineWidth=R*.01;g.strokeStyle='rgba(0,0,0,.55)';g.stroke();
    g.fillStyle=metal(g,hr*1.2,0);star(g,c,c+hr*.04,hr*.62);
    // languette (aiguille)
    g.save();g.translate(c,c-R*this.P.Rp);g.shadowColor='rgba(0,0,0,.55)';g.shadowBlur=R*.03;g.shadowOffsetY=R*.015;g.rotate(this.th);
    const L=R*this.P.L,W=R*.098,rt=R*this.P.rt;
    g.beginPath();g.moveTo(-W/2,0);g.lineTo(W/2,0);g.lineTo(rt,L);g.arc(0,L,rt,0,Math.PI,false);g.lineTo(-W/2,0);g.closePath();
    const pg=g.createLinearGradient(-W/2,0,W/2,0);pg.addColorStop(0,'#e84a5a');pg.addColorStop(.45,'#b30d28');pg.addColorStop(1,'#5e0716');
    g.fillStyle=pg;g.fill();g.shadowColor='transparent';g.lineWidth=R*.012;g.strokeStyle='#e8c25a';g.stroke();
    const pv=g.createRadialGradient(-R*.01,-R*.01,0,0,0,R*.05);pv.addColorStop(0,'#fff');pv.addColorStop(1,'#7d8696');
    g.beginPath();g.arc(0,0,R*.041,0,7);g.fillStyle=pv;g.fill();g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=R*.008;g.stroke();
    g.restore();
    g.restore();
  }
  // Lance la roue (sens ANTI-HORAIRE) pour qu'elle s'arrête sur le segment T déjà tiré au sort
  // Prépare le lancer : trouve la force de lancement pour que la physique s'arrête sur la case T (tirée au sort avant).
  // Se calcule en arrière-plan, par petites tranches, pendant que le Père Noël prend son élan.
  plan(T,opt={}){return this._plan(T,opt).catch(()=>null)}
  async _plan(T,opt){
    const n=this.n,s=this.s,P=this.P;if(!n)return null;
    const dc=this.dc(),gapW=s-2*dc;if(gapW<2)return null;
    const rot0=this.rot,d0=this.th,dur=opt.dur||6,tol=Math.max(.5,gapW*.12);
    const dist=w=>physSim(n,rot0,d0,w,P,false).rot-rot0;
    if(!this.tab||this.tab.key!==n+'|'+P.mu){          // table « vitesse de lancement -> distance, durée » (une seule fois par roue)
      const tab=[],r0=s*.5;
      for(let w=3,q=0;w<19;w*=1.25,q++){const r=physSim(n,r0,0,w,P,false);tab.push({w,dist:r.rot-r0,dur:r.t});if(q%2)await nap()}
      this.tab={key:n+'|'+P.mu,tab};
    }
    const tab=this.tab.tab;
    let recul=Math.random()<.38;
    for(let att=0;att<7;att++){
      const Dt=dur*(.92+.16*Math.random());
      let wd=tab[tab.length-1].w,Fd=tab[tab.length-1].dist;                       // vitesse qui donne la durée voulue
      for(let i=1;i<tab.length;i++)if(tab[i].dur>=Dt){const a=tab[i-1],b=tab[i],u=(Dt-a.dur)/Math.max(1e-6,b.dur-a.dur);wd=a.w+(b.w-a.w)*u;Fd=a.dist+(b.dist-a.dist)*u;break}
      const alpha=recul?T*s+(s-dc)-1.2:T*s+dc+gapW*(.1+.8*Math.random()),base=mod(alpha-rot0,360);   // « recul » : on vise la fin de la case          // position d'arrêt visée, dans la case T
      let A=base+360*Math.round((Fd-base)/360);if(A<360)A+=360;
      let lo=wd*.88,hi=wd*1.12;
      for(let k=0;k<8&&dist(lo)>A;k++){lo*=.88}
      await nap();
      for(let k=0;k<8&&dist(hi)<A;k++){hi*=1.12}
      await nap();
      let m=(lo+hi)/2;
      for(let it=0;it<18;it++){
        m=(lo+hi)/2;const F=dist(m);if(Math.abs(F-A)<tol)break;
        if(F<A)lo=m;else hi=m;
        if(it%3===2)await nap();
      }
      if(recul){const m2=await this._recul(rot0,m,T,dist);if(m2)m=m2;else recul=false}
      const r=physSim(n,rot0,d0,m,P,true),fin=mod(r.rot,360),pos=fin-T*s;
      const okDur=att<4?(r.t>dur*.8&&r.t<dur*1.3):(r.t>dur*.6&&r.t<dur*1.6);
      if(recul){let mx=-1e9,back=0;for(let i=0;i<r.R.n;i+=8){if(r.R.rot[i]>mx)mx=r.R.rot[i];back=Math.max(back,mx-r.R.rot[i])}if(back<.8)recul=false}   // le recul doit être visible
      if(pos>dc&&pos<s-dc&&okDur&&(!recul||att>=0))return{R:r.R,w0:m};                 // arrêt dans la bonne case, durée correcte
      await nap();
    }
    return null;
  }
  // Cherche, juste au-dessus d'une force qui arrête la roue près du picot suivant, les forces où elle cale sur ce picot puis RECULE.
  async _recul(rot0,wA,T,dist){
    const s=this.s,dc=this.dc(),cand=[],F0=dist(wA);let Fmax=F0;
    for(let j=1;j<=50;j++){
      const w=wA+j*.0012,F=dist(w);
      if(F>F0+s*1.4)break;                             // le picot suivant est franchi : fin de la plage
      const pos=mod(rot0+F,360)-T*s;
      if(F>Fmax)Fmax=F;
      else if(F<Fmax-.15&&pos>dc&&pos<s-dc)cand.push(w);   // la position d'arrêt recule quand la force augmente : branche « recul »
      if(j%5===0)await nap();
    }
    for(let i=cand.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),t=cand[i];cand[i]=cand[j];cand[j]=t}
    return cand.slice(0,6);
  }
  // amplitude du plus grand recul (°) d'une trajectoire enregistrée
  static recul(R){let mx=-1e9,back=0;for(let i=0;i<R.n;i+=8){if(R.rot[i]>mx)mx=R.rot[i];back=Math.max(back,mx-R.rot[i])}return back}
  async _plan(T,opt){
    const n=this.n,s=this.s,P=this.P;if(!n)return null;
    const dc=this.dc(),gapW=s-2*dc;if(gapW<2)return null;
    const rot0=this.rot,d0=this.th,dur=opt.dur||6,tol=Math.max(.5,gapW*.12);
    const dist=w=>physSim(n,rot0,d0,w,P,false).rot-rot0;
    if(!this.tab||this.tab.key!==n+'|'+P.mu){          // table « vitesse de lancement -> distance, durée » (une seule fois par roue)
      const tab=[],r0=s*.5;
      for(let w=3,q=0;w<19;w*=1.25,q++){const r=physSim(n,r0,0,w,P,false);tab.push({w,dist:r.rot-r0,dur:r.t});if(q%2)await nap()}
      this.tab={key:n+'|'+P.mu,tab};
    }
    const tab=this.tab.tab;
    let recul=Math.random()<.38;                       // environ un lancer sur trois se termine par un recul de la roue
    for(let att=0;att<8;att++){
      const Dt=dur*(.92+.16*Math.random());
      let wd=tab[tab.length-1].w,Fd=tab[tab.length-1].dist;                       // vitesse qui donne la durée voulue
      for(let i=1;i<tab.length;i++)if(tab[i].dur>=Dt){const a=tab[i-1],b=tab[i],u=(Dt-a.dur)/Math.max(1e-6,b.dur-a.dur);wd=a.w+(b.w-a.w)*u;Fd=a.dist+(b.dist-a.dist)*u;break}
      const alpha=recul?T*s+(s-dc)-1.2:T*s+dc+gapW*(.1+.8*Math.random()),base=mod(alpha-rot0,360);   // « recul » : on vise la fin de la case
      let A=base+360*Math.round((Fd-base)/360);if(A<360)A+=360;
      let lo=wd*.88,hi=wd*1.12;
      for(let k=0;k<8&&dist(lo)>A;k++){lo*=.88}
      await nap();
      for(let k=0;k<8&&dist(hi)<A;k++){hi*=1.12}
      await nap();
      let m=(lo+hi)/2;
      for(let it=0;it<18;it++){
        m=(lo+hi)/2;const F=dist(m);if(Math.abs(F-A)<tol)break;
        if(F<A)lo=m;else hi=m;
        if(it%3===2)await nap();
      }
      const okDur=r=>att<5?(r.t>dur*.8&&r.t<dur*1.3):(r.t>dur*.6&&r.t<dur*1.6);
      const okPos=r=>{const pos=mod(r.rot,360)-T*s;return pos>dc&&pos<s-dc};
      if(recul){                                       // on retient une force qui donne un recul visible (2 à 7°)
        for(const w of await this._recul(rot0,m,T,dist)){
          const r=physSim(n,rot0,d0,w,P,true),b=Roue.recul(r.R);
          if(okPos(r)&&okDur(r)&&b>=2&&b<=7)return{R:r.R,w0:w,recul:b};
          await nap();
        }
        recul=false;continue;                          // pas de recul trouvé pour ce tirage : on passe à une fin sans recul
      }
      const r=physSim(n,rot0,d0,m,P,true);
      if(okPos(r)&&okDur(r)&&(Roue.recul(r.R)<1.2||att>=5))return{R:r.R,w0:m,recul:0};
      await nap();
    }
    return null;
  }
  spin(T,opt={}){
    return new Promise(res=>{
      const go=pl=>{
        if(pl&&pl.R){this.anim={R:pl.R,t:0,e:0,done:()=>res(T),zoomAt:opt.zoomAt||0,onZoom:opt.onZoom,z:0};return}
        this.spinLegacy(T,opt).then(res);              // secours si le calcul physique n'a pas abouti
      };
      const pp=opt.plan||this.plan(T,opt);
      if(pp&&typeof pp.then==='function')pp.then(go,()=>go(null));else go(pp);
    });
  }
  spinLegacy(T,opt={}){
    return new Promise(res=>{
      const s=this.s,w=this.w,rot0=this.rot,dur=opt.dur||6,turns=opt.turns||5;
      const q=Math.random();let m=q<.45?'A':q<.75?'B':'N';if(this.n<3)m='N';
      const lo=T*s+.8,hi=(T+1)*s-w-.4,Lf=lo+(hi-lo)*Math.random(),e=w*(.25+.3*Math.random());
      let Lm=Lf;if(m==='A')Lm=T*s-e;else if(m==='B')Lm=(T+1)*s-e;
      const need=mod(Lm-rot0,360),rotMain=rot0+360*(turns+rnd(2))+need;
      const ph=[{f:rot0,to:rotMain,d:dur,e:easeOut}];
      if(m==='A'){ph.push({f:rotMain,to:rotMain,d:.6,e:lin});ph.push({f:rotMain,to:rotMain+(Lf-Lm),d:2.2,e:easeIO})}
      if(m==='B'){
        const Lb=lo+(hi-lo)*.5;
        ph.push({f:rotMain,to:rotMain,d:.7,e:lin});
        ph.push({f:rotMain,to:rotMain-(Lm-Lb),d:1,e:easeSoft,on:()=>{if(this.o.tick)this.o.tick(40)}});
      }
      this.anim={ph,i:0,t:0,done:()=>res(T),zoomAt:opt.zoomAt||0,onZoom:opt.onZoom};
    });
  }
}
