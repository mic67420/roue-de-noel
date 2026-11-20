
/* ============ FOND ETOILE, NEIGE, CONFETTIS ============ */
const lc=$('lights'),lg=lc.getContext('2d'),bgc=$('bg'),bg=bgc.getContext('2d'),fxc=$('fx'),fg=fxc.getContext('2d');
let BW=0,BH=0,DPR=1,bgT=-1,time=0;
const stars=Array.from({length:170},()=>({x:Math.random(),y:Math.random()*.85,r:.6+Math.random()*1.7,ph:Math.random()*6.28,sp:1+Math.random()*3,t0:Math.random()*3}));
function setVars(){document.documentElement.style.setProperty('--v',(window.innerHeight/100)+'px')}
function sizeCanvases(){
  DPR=Math.min(window.devicePixelRatio||1,2);BW=window.innerWidth;BH=window.innerHeight;
  [bgc,fxc].forEach(c=>{c.width=Math.round(BW*DPR);c.height=Math.round(BH*DPR)});lc.width=Math.round(BW*lqScale());lc.height=Math.round(BH*lqScale());$('santa').width=Math.round(BW*DPR);$('santa').height=Math.round(BH*DPR);
}
/* ---- neige réaliste : vrais cristaux à 6 branches, 3 plans de profondeur + gros flocons flous au premier plan ---- */
function flakeSprite(type){
  const S=96,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.translate(S/2,S/2);
  g.strokeStyle='rgba(255,255,255,.96)';g.fillStyle='rgba(255,255,255,.96)';g.lineCap='round';g.lineJoin='round';g.shadowColor='rgba(185,225,255,.95)';g.shadowBlur=5;
  const R=S*.42;
  for(let i=0;i<6;i++){g.save();g.rotate(i*Math.PI/3);
    if(type===0){            // dendrite : branche principale + 3 paires de ramifications
      g.lineWidth=2.4;g.beginPath();g.moveTo(0,0);g.lineTo(0,-R);g.stroke();
      [[.34,.3],[.57,.24],[.77,.15]].forEach(([p,l])=>{g.lineWidth=1.8;g.beginPath();g.moveTo(0,-R*p);g.lineTo(-R*l*1.1,-R*(p+l*.85));g.moveTo(0,-R*p);g.lineTo(R*l*1.1,-R*(p+l*.85));g.stroke()});
    }else if(type===1){      // étoile à losanges
      g.lineWidth=2.6;g.beginPath();g.moveTo(0,-R*.1);g.lineTo(0,-R);g.stroke();
      g.lineWidth=2;g.beginPath();g.moveTo(0,-R*.45);g.lineTo(-R*.17,-R*.66);g.lineTo(0,-R*.87);g.lineTo(R*.17,-R*.66);g.closePath();g.stroke();
    }else{                   // plaque à nervures
      g.lineWidth=2.1;g.beginPath();g.moveTo(0,0);g.lineTo(0,-R*.92);g.stroke();
      g.beginPath();g.moveTo(-R*.15,-R*.84);g.lineTo(0,-R);g.lineTo(R*.15,-R*.84);g.stroke();
      g.beginPath();g.moveTo(-R*.26,-R*.42);g.lineTo(0,-R*.58);g.lineTo(R*.26,-R*.42);g.stroke();
    }
    g.restore()}
  if(type===2){g.lineWidth=2;g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/2;g.lineTo(Math.cos(a)*R*.36,Math.sin(a)*R*.36)}g.closePath();g.stroke()}
  g.shadowBlur=0;const rg=g.createRadialGradient(0,0,0,0,0,R*.17);rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.beginPath();g.arc(0,0,R*.17,0,7);g.fill();
  return c;
}
const SNOWSP=[0,1,2].map(flakeSprite);
const mkSoft=(a0,a1,a2)=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),rg=g.createRadialGradient(32,32,0,32,32,32);rg.addColorStop(0,`rgba(255,255,255,${a0})`);rg.addColorStop(.7,`rgba(255,255,255,${a1})`);rg.addColorStop(.92,`rgba(255,255,255,${a2})`);rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.fillRect(0,0,64,64);return c};
const SNOWDOT=mkSoft(.95,.5,0),SNOWBOKEH=mkSoft(.14,.16,.22);
const snowF=[];
(function(){
  const add=(n,zmin,zmax,kind)=>{for(let i=0;i<n;i++){const z=zmin+Math.random()*(zmax-zmin);snowF.push({kind,x:Math.random()*1000,y:Math.random()*600,z,
    sz:kind==='dot'?3+z*12:kind==='small'?10+(z-.3)*50:kind==='big'?24+(z-.6)*55:46+Math.random()*50,
    vy:kind==='dot'?20+z*40:kind==='small'?28+z*40:kind==='big'?38+z*40:70+Math.random()*40,
    sw:.4+Math.random()*1.1,ph:Math.random()*6.28,rot:Math.random()*6.28,vr:(Math.random()-.5)*1.4,type:rnd(3),a:.55+Math.random()*.4})}};
  add(70,0,.3,'dot');add(60,.3,.6,'small');add(30,.6,.9,'big');add(14,.9,1,'fg');
})();
function snowStep(dt){
  const wind=Math.sin(time*.23)*10+6;
  snowF.forEach(f=>{
    f.y+=f.vy*dt;f.x+=(Math.sin(time*f.sw+f.ph)*16*(.5+f.z)+wind*(.4+f.z))*dt;f.rot+=f.vr*dt;
    if(f.y>BH+f.sz){f.y=-f.sz;f.x=Math.random()*BW}
    if(f.x>BW+f.sz)f.x=-f.sz;if(f.x<-f.sz)f.x=BW+f.sz;
  });
}
function snowDraw(g,fgLayer,sa){
  snowF.forEach(f=>{
    if((f.kind==='fg')!==fgLayer)return;
    g.globalAlpha=sa*(f.kind==='fg'?.5:f.a);
    if(f.kind==='dot'){g.drawImage(SNOWDOT,f.x-f.sz/2,f.y-f.sz/2,f.sz,f.sz);return}
    if(f.kind==='fg'){g.drawImage(SNOWBOKEH,f.x-f.sz/2,f.y-f.sz/2,f.sz,f.sz);return}
    g.save();g.translate(f.x,f.y);g.rotate(f.rot);g.scale(1,.62+.38*Math.abs(Math.cos(f.ph+time*f.vr*.6)));
    g.drawImage(SNOWSP[f.type],-f.sz/2,-f.sz/2,f.sz,f.sz);g.restore();
  });
  g.globalAlpha=1;
}
function drawBg(dt){
  bg.setTransform(DPR,0,0,DPR,0,0);bg.clearRect(0,0,BW,BH);
  if(bgT<0)return;
  bgT+=dt;
  stars.forEach(s=>{
    const a=clamp((bgT-s.t0)/.7,0,1)*(.5+.5*Math.sin(time*s.sp+s.ph));if(a<=.02)return;
    const x=s.x*BW,y=s.y*BH;bg.globalAlpha=a;bg.fillStyle='#fff6d6';
    bg.beginPath();bg.arc(x,y,s.r,0,7);bg.fill();
    if(s.r>1.8){bg.fillRect(x-s.r*2.4,y-.4,s.r*4.8,.8);bg.fillRect(x-.4,y-s.r*2.4,.8,s.r*4.8)}
  });
  const sa=clamp((bgT-2)/2,0,1);
  snowStep(dt);if(sa>0)snowDraw(bg,false,sa);
  const ha=clamp((bgT-1)/2,0,1);
  if(ha>0){
    const h=BH*.07;bg.globalAlpha=ha*.9;
    bg.fillStyle='#b9c9ee';bg.beginPath();bg.moveTo(0,BH);bg.lineTo(0,BH-h*.9);
    bg.quadraticCurveTo(BW*.2,BH-h*1.8,BW*.45,BH-h*.9);bg.quadraticCurveTo(BW*.7,BH-h*.1,BW,BH-h*1.1);bg.lineTo(BW,BH);bg.closePath();bg.fill();
    bg.fillStyle='#e6eeff';bg.beginPath();bg.moveTo(0,BH);bg.lineTo(0,BH-h*.45);
    bg.quadraticCurveTo(BW*.3,BH-h*.1,BW*.6,BH-h*.5);bg.quadraticCurveTo(BW*.85,BH-h*.85,BW,BH-h*.4);bg.lineTo(BW,BH);bg.closePath();bg.fill();
  }
  bg.globalAlpha=1;
}

/* ============ LUMIERES v3 : 2 lyres façon « référence » : faisceaux larges et diffus, bicolores, taches au sol en perspective ============ */
const PAL=[[[40,110,255],[60,255,120]],[[255,210,40],[90,90,255]],[[230,60,255],[80,170,255]],[[235,235,255],[150,120,255]],[[60,255,110],[255,50,50]],
  [[50,200,255],[255,70,60]],[[255,70,40],[255,200,40]],[[180,70,255],[90,160,255]],[[255,200,30],[255,245,160]]];
const HITCOL={gift:[255,200,70],mystery:[170,90,255],vol:[255,60,60],echange:[60,200,255],double:[255,235,170],bouclier:[90,140,255],choix:[80,255,140],autre:[255,90,190],pas:[120,170,255]};
const eSin=u=>.5-.5*Math.cos(Math.PI*u),eOutC=u=>1-Math.pow(1-u,3);
const mkLy=i=>({fx:i?.68:.32,px:i?.68:.32,py:.88,ax:i?.68:.32,ay:.88,bx:i?.68:.32,by:.88,t:1,dur:1,ease:eSin,
  col:PAL[i?2:0][0].slice(),ecol:PAL[i?2:0][1].slice(),c0:PAL[i?2:0][0].slice(),c1:PAL[i?2:0][0].slice(),e0:PAL[i?2:0][1].slice(),e1:PAL[i?2:0][1].slice(),
  ct:1,cdur:1,bl:0,gobo:i?1:2,gr:0,hw:.17,hwa:.17,hwb:.17});
const LUMKEY='roueNoel_lum';
const LQ={q:(()=>{const v=store.get(LUMKEY);return(v===0||v===1||v===2||v===3)?v:2})()};   // 0 éteintes, 1 faisceaux seuls, 2 légères (par défaut), 3 complètes
const lqScale=()=>LQ.q===3?.5:.35;
const LGT={t:0,m:0,lv:.55,next:.4,bnext:3,alt:false,flash:0,strobe:0,hitT:0,hitCol:null,spin:false,last:-1,ly:[mkLy(0),mkLy(1)]};
const CUES=[
  r=>[[.1+r()*.1,.82+r()*.12],[.9-r()*.1,.82+r()*.12]],                                   // éventail extérieur
  r=>[[.6+r()*.25,.84+r()*.1],[.4-r()*.25,.84+r()*.1]],                                   // croisement
  r=>[[.44+r()*.04,.9+r()*.06],[.56-r()*.04,.9+r()*.06]],                                 // côte à côte sous la roue
  r=>[[.2+r()*.1,.95],[.8-r()*.1,.95]],                                                   // proches (grosses taches)
  r=>[[.3+r()*.1,.8],[.7-r()*.1,.8]],                                                     // lointaines (petites taches)
  r=>[[.18+r()*.05,.93],[.5+r()*.15,.88]],                                                // Père Noël + centre
  r=>{const a=r()*6.28;return[[.5+Math.cos(a)*.3,.88+Math.sin(a)*.07],[.5-Math.cos(a)*.3,.88-Math.sin(a)*.07]]}  // orbite au sol
];
function lgtNewCue(){
  const r=Math.random,spin=LGT.spin,hit=LGT.hitT>0;
  let k;do{k=rnd(CUES.length)}while(k===LGT.last);LGT.last=k;
  let g=CUES[k](r);
  if(hit)g=[[.4,.9],[.6,.9]];
  const dur=hit?.16:spin?.3+r()*.35:2.6+r()*1.8;
  const pi=[rnd(PAL.length),0];do{pi[1]=rnd(PAL.length)}while(pi[1]===pi[0]);
  LGT.ly.forEach((l,i)=>{
    l.ax=l.px;l.ay=l.py;l.bx=g[i][0];l.by=g[i][1];l.t=0;l.dur=dur;l.ease=(spin||hit)?eOutC:eSin;
    l.hwa=l.hw;l.hwb=spin?.15+r()*.06:.16+r()*.07;
    const pal=PAL[pi[i]],main=(hit&&LGT.hitCol)?LGT.hitCol:pal[0],edge=(hit&&LGT.hitCol)?[255,255,255]:pal[1];
    l.c0=l.col.slice();l.c1=main.slice();l.e0=l.ecol.slice();l.e1=edge.slice();l.ct=0;l.cdur=(spin||hit)?.12:1.8;
    l.gobo=rnd(5);
  });
  if(spin&&r()<.4)LGT.strobe=.25;
  LGT.next=hit?1.5:spin?.6+r()*.7:dur+1+r()*1.6;
}
function lightHit(kind){
  LGT.hitT=1.3;LGT.hitCol=HITCOL[kind]||[255,220,120];
  LGT.flash=kind==='double'?1.6:kind==='pas'?.25:1;LGT.strobe=kind==='pas'?0:.5;LGT.next=0;
}
function lgtStep(dt){
  LGT.t+=dt;
  {const on=LGT.spin||LGT.hitT>0;LGT.m+=((on?1:0)-LGT.m)*Math.min(1,dt*(on?6:3))}   // allumées pendant le lancer jusqu'au résultat, puis éteintes en fondu
  const tgt=LGT.hitT>0?1.25:LGT.spin?1:.6;
  LGT.lv+=(tgt-LGT.lv)*Math.min(1,dt*(tgt>LGT.lv?7:1.4));
  LGT.flash=Math.max(0,LGT.flash-dt/1.3);LGT.strobe=Math.max(0,LGT.strobe-dt);
  if(LGT.hitT>0)LGT.hitT-=dt;
  LGT.next-=dt;if(LGT.next<=0)lgtNewCue();
  LGT.bnext-=dt;
  if(LGT.bnext<=0){const w=Math.random(),d=.35+Math.random()*.55;LGT.bnext=LGT.spin?1.2+Math.random()*1.6:3.5+Math.random()*5;LGT.alt=false;
    if(w<.35)LGT.ly[0].bl=d;else if(w<.7)LGT.ly[1].bl=d;else{LGT.ly[0].bl=LGT.ly[1].bl=d+.3;LGT.alt=w>.85}}
  LGT.ly.forEach((l,i)=>{
    l.bl=Math.max(0,l.bl-dt);l.t+=dt;const e=l.ease(clamp(l.t/l.dur,0,1));
    l.px=l.ax+(l.bx-l.ax)*e;l.py=l.ay+(l.by-l.ay)*e;l.hw=l.hwa+(l.hwb-l.hwa)*e;
    l.ct+=dt;const u=clamp(l.ct/l.cdur,0,1);
    l.col=[0,1,2].map(j=>Math.round(l.c0[j]+(l.c1[j]-l.c0[j])*u));
    l.ecol=[0,1,2].map(j=>Math.round(l.e0[j]+(l.e1[j]-l.e0[j])*u));
    l.gr+=dt*(LGT.spin?2.4:.6)*(i?-1:1);
  });
}
const NS=11,SLC=Array.from({length:NS},(_,i)=>{const u0=i/NS*2-1,u1=(i+1)/NS*2-1,uc=(u0+u1)/2;return{u0,u1,w:Math.exp(-Math.pow(uc*1.1,2)),t:clamp((uc+.9)/.55,0,1)}});
const dust=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.012,vy:(Math.random()-.5)*.01,ph:Math.random()*6.28}));
const mixc=(a,b,t)=>[0,1,2].map(j=>Math.round(a[j]+(b[j]-a[j])*t));
function conePath(g,ax,ay,cx,cy,a,b){
  // contour du cône = sommet (lyre) + deux tangentes à l'ellipse + arc de l'ellipse du côté opposé au sommet
  const px=ax-cx,py=ay-cy,A=px/a,B=py/b,R=Math.hypot(A,B);
  g.beginPath();
  if(R<=1.02){g.ellipse(cx,cy,a,b,0,0,Math.PI*2);return}
  const phi=Math.atan2(B,A),d=Math.acos(1/R),t1=phi+d,t2=phi-d;
  g.moveTo(ax,ay);g.lineTo(cx+a*Math.cos(t1),cy+b*Math.sin(t1));
  g.ellipse(cx,cy,a,b,0,t1,t2+Math.PI*2,false);
  g.closePath();
}
function drawGobo(g,k,r){
  if(k===1){for(let i=0;i<6;i++){g.save();g.rotate(i*Math.PI/3);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(r*.6,-r*.4,r*.95,-r*.05);g.quadraticCurveTo(r*.62,r*.2,0,0);g.fill();g.restore()}}          // moulinet
  else if(k===2){for(let ring=0;ring<2;ring++){const n=ring?10:6,rr=ring?r*.72:r*.4;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+ring*.3;g.beginPath();g.arc(Math.cos(a)*rr,Math.sin(a)*rr,r*(ring?.1:.12),0,7);g.fill()}}g.beginPath();g.arc(0,0,r*.1,0,7);g.fill()}   // points
  else if(k===3){g.lineWidth=r*.2;g.lineCap='butt';for(let i=0;i<6;i++){g.beginPath();g.arc(0,0,r*.68,i*Math.PI/3,i*Math.PI/3+.78);g.stroke()}}                                  // anneau
  else if(k===4){for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);g.beginPath();g.ellipse(r*.52,0,r*.3,r*.13,0,0,7);g.fill();g.restore()}}                                         // fleur
}
function drawPool(p,I,boost){
  const l=p.l,r=p.rx;
  lg.save();lg.translate(p.tx,p.ty);
  lg.save();lg.scale(1,.42);const gg=lg.createRadialGradient(0,0,0,0,0,r*1.8);gg.addColorStop(0,`rgba(${p.col},${Math.min(1,.32*I*boost)})`);gg.addColorStop(1,`rgba(${p.col},0)`);lg.fillStyle=gg;lg.beginPath();lg.arc(0,0,r*1.8,0,7);lg.fill();lg.restore();   // lueur diffuse au sol
  lg.scale(1,.38);                                                           // perspective : le cercle devient une ellipse posée au sol
  const gobo=l.gobo,baseA=gobo===0?.5:.32,Ab=Math.min(1,baseA*I*boost);
  // deux lumières colorées qui se recouvrent au centre : le mélange est additif (comme de vrais projecteurs)
  [[p.ecol,0],[p.col,1]].forEach(([c,side])=>{
    const g1=side?lg.createLinearGradient(-r,0,r,0):lg.createLinearGradient(-r,0,r,0);
    if(side){g1.addColorStop(0,`rgba(${c},0)`);g1.addColorStop(.28,`rgba(${c},0)`);g1.addColorStop(.62,`rgba(${c},${Ab*.9})`);g1.addColorStop(1,`rgba(${c},${Ab})`)}
    else{g1.addColorStop(0,`rgba(${c},${Ab})`);g1.addColorStop(.38,`rgba(${c},${Ab*.9})`);g1.addColorStop(.72,`rgba(${c},0)`);g1.addColorStop(1,`rgba(${c},0)`)}
    lg.fillStyle=g1;lg.beginPath();lg.arc(0,0,r,0,7);lg.fill();
  });
  if(gobo>0){
    lg.save();lg.beginPath();lg.arc(0,0,r*.97,0,7);lg.clip();lg.rotate(l.gr);
    const A=Math.min(.85,.8*I*boost),gc=Math.cos(l.gr),gs=Math.sin(l.gr),g2=lg.createLinearGradient(-r*gc,r*gs,r*gc,-r*gs);
    g2.addColorStop(0,`rgba(${p.elite},${A})`);g2.addColorStop(.4,`rgba(${p.elite},${A})`);g2.addColorStop(.5,`rgba(${p.mixl},${A})`);g2.addColorStop(.6,`rgba(${p.lite},${A})`);g2.addColorStop(1,`rgba(${p.lite},${A})`);
    lg.fillStyle=g2;lg.strokeStyle=g2;drawGobo(lg,gobo,r);lg.restore();
  }
  lg.strokeStyle=`rgba(${p.lite},${Math.min(1,.5*I*boost)})`;lg.lineWidth=r*.04;lg.beginPath();lg.arc(0,0,r,.06,Math.PI-.06);lg.stroke();   // liseré lumineux du bord avant
  lg.restore();
}
function drawLights(dt){
  lg.setTransform(lqScale(),0,0,lqScale(),0,0);lg.clearRect(0,0,BW,BH);   // résolution réduite : lumières floues, bien moins de pixels à calculer
  if(LQ.q===0)return;
  const K=clamp((bgT-3.4)/2,0,1);if(K<=.01)return;
  const u=BH*.012,fl=LGT.flash,boost=1+fl*.7;
  const str=LGT.strobe>0?(Math.floor(time*14)%2?1:.05):1;
  const I=(.5+.5*LGT.lv)*K*str*LGT.m;
  const F=LGT.ly.map((l,i)=>{
    const depth=clamp((l.py-.8)/.17,0,1),hwF=l.hw*BH*(.8+.5*depth);
    const sway=Math.sin(time*.8+i*2.1)*.012,fx=l.fx*BW,fy=BH*.034,tx=(l.px+sway)*BW,ty=Math.min(l.py*BH,BH-hwF*.38*1.1-3),dx=tx-fx,dy=ty-fy,D=Math.max(BH*.5,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);   // la tache reste entière dans l'écran
    return{l,fx,fy,tx,ty,D,a,ca:Math.cos(a),sa:Math.sin(a),hwF,rx:hwF,col:l.col.join(','),ecol:l.ecol.join(','),lite:mixc(l.col,[255,255,255],.22).join(','),elite:mixc(l.ecol,[255,255,255],.22).join(','),mix:mixc(l.ecol,l.col,.5).map(v=>Math.min(255,Math.round(v*1.5))).join(','),mixl:mixc(mixc(l.ecol,l.col,.5),[255,255,255],.4).join(','),lm:(l.bl>0?(Math.floor(time*(LGT.spin?12:8)+(LGT.alt?i:0))%2?1:.05):1)};
  });
  // corps des lyres (suspendues en haut, comme sur la photo)
  F.forEach(p=>{
    lg.strokeStyle='#2a3040';lg.lineWidth=u*.6;lg.beginPath();lg.moveTo(p.fx-u*2,0);lg.lineTo(p.fx-u*2,p.fy);lg.moveTo(p.fx+u*2,0);lg.lineTo(p.fx+u*2,p.fy);lg.stroke();
    lg.fillStyle='#161923';lg.fillRect(p.fx-u*2.4,0,u*4.8,u*1.2);
    lg.save();lg.translate(p.fx,p.fy);lg.rotate(p.a);
    const hg=lg.createLinearGradient(0,-u*1.5,0,u*1.5);hg.addColorStop(0,'#6a748c');hg.addColorStop(.5,'#262b3a');hg.addColorStop(1,'#0e1017');
    lg.fillStyle=hg;rrect(lg,-u*1.6,-u*1.5,u*4,u*3,u*.9);lg.fill();lg.restore();
  });
  if(LGT.m<.01){lg.globalCompositeOperation='source-over';return}   // éteintes : rien d'autre à dessiner
  lg.globalCompositeOperation='lighter';
  F.forEach(p=>{
    const L=p.D*1.03,nx=-p.sa,ny=p.ca,w0=u*.7,half=d=>(w0+(p.hwF*2-w0)*d/p.D)/2;
    const ex=p.fx+p.ca*L,ey=p.fy+p.sa*L;
    // faisceau = vrai cône dont la base est l'ellipse de la tache au sol ; cônes imbriqués => cœur lumineux, bords diffus
    // les deux couleurs de la lyre se fondent l'une dans l'autre (zone centrale = mélange additif des deux lumières)
    const ax=p.fx+p.ca*u*1.6,ay=p.fy+p.sa*u*1.6,ry=p.rx*.38,NC=LQ.q===3?12:LQ.q===2?6:5,Il=I*p.lm;
    for(let k=0;k<NC;k++){
      const sc=1-k*(.8/(NC-1)),al=Math.min(1,.08*(12/NC)*Il*boost*(.5+.5*(k/(NC-1)))),aw=p.rx*sc;
      const gr=lg.createLinearGradient(p.tx-aw,p.ty,p.tx+aw,p.ty);
      gr.addColorStop(0,`rgba(${p.ecol},${al})`);gr.addColorStop(.3,`rgba(${p.ecol},${al})`);gr.addColorStop(.5,`rgba(${p.mix},${Math.min(1,al*1.15)})`);gr.addColorStop(.7,`rgba(${p.col},${al})`);gr.addColorStop(1,`rgba(${p.col},${al})`);
      lg.fillStyle=gr;conePath(lg,ax,ay,p.tx,p.ty,aw,ry*sc);lg.fill();
    }
    // lentille
    const lx=p.fx+p.ca*u*2.4,ly=p.fy+p.sa*u*2.4,lgr=lg.createRadialGradient(lx,ly,0,lx,ly,u*3.6);
    lgr.addColorStop(0,`rgba(255,255,255,${Math.min(1,.95*Il*boost)})`);lgr.addColorStop(.3,`rgba(${p.col},${Math.min(1,.6*Il*boost)})`);lgr.addColorStop(1,`rgba(${p.col},0)`);
    lg.fillStyle=lgr;lg.beginPath();lg.arc(lx,ly,u*3.6,0,7);lg.fill();
    if(LQ.q>=2)drawPool(p,Il,boost);
  });
  // poussière scintillante dans les faisceaux
  if(LQ.q===3)dust.forEach(d=>{
    d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.x<0)d.x+=1;if(d.x>1)d.x-=1;if(d.y<0)d.y+=1;if(d.y>1)d.y-=1;
    const px=d.x*BW,py=d.y*BH;
    F.forEach(p=>{
      const rx=px-p.fx,ry=py-p.fy,t=rx*p.ca+ry*p.sa;if(t<0||t>p.D)return;
      const perp=Math.abs(-rx*p.sa+ry*p.ca),hw=(u*.35+(p.hwF-u*.35)*t/p.D);
      if(perp>=hw)return;
      const al=(1-perp/hw)*(.35+.65*Math.max(0,Math.sin(time*3+d.ph)))*Math.min(1,I*boost*p.lm);
      lg.fillStyle=`rgba(${p.col},${al*.9})`;lg.beginPath();lg.arc(px,py,1.1+al*.9,0,7);lg.fill();
    });
  });
  if(fl>0.02){lg.fillStyle=`rgba(255,255,255,${Math.min(.14,fl*.07)})`;lg.fillRect(0,0,BW,BH)}
  lg.globalCompositeOperation='source-over';
}
const P=[],CC=['#ff4d4d','#3ddc84','#ffd84d','#ffffff','#5cc3ff','#ff8ad8'];
function confetti(n=120,o={}){
  const burst=o.burst!==false,x=o.x==null?BW/2:o.x,y=o.y==null?BH*.35:o.y;
  for(let i=0;i<n&&P.length<1500;i++){
    const a=Math.random()*Math.PI*2,v=200+Math.random()*700;
    P.push({k:'conf',x:burst?x:Math.random()*BW,y:burst?y:-20,vx:burst?Math.cos(a)*v:(Math.random()-.5)*80,vy:burst?Math.sin(a)*v-300:100+Math.random()*200,g:600,life:2.6+Math.random()*2,age:0,c:CC[rnd(CC.length)],w:6+Math.random()*8,h:10+Math.random()*10,rot:Math.random()*6,vr:(Math.random()-.5)*12});
  }
}
function firework(x,y){
  const cols=['#ffd966','#fff2b0','#ffb300','#ff5a5a','#7dff9b'],n=70,base=cols[rnd(cols.length)];
  for(let i=0;i<n&&P.length<1800;i++){
    const a=Math.PI*2*i/n+Math.random()*.1,v=150+Math.random()*380;
    P.push({k:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:220,life:1.1+Math.random()*.6,age:0,c:Math.random()<.6?base:'#fff2b0',r:2+Math.random()*2.5});
  }
}
function fxStep(dt){
  fg.setTransform(DPR,0,0,DPR,0,0);fg.clearRect(0,0,BW,BH);
  {const sa=clamp((bgT-2)/2,0,1);if(sa>0)snowDraw(fg,true,sa)}   // gros flocons flous au premier plan (profondeur de champ)
  for(let i=P.length-1;i>=0;i--){
    const p=P[i];p.age+=dt;
    if(p.age>p.life||p.y>BH+40){P.splice(i,1);continue}
    p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.k==='spark'){
      p.vx*=.985;p.vy*=.985;fg.globalAlpha=1-p.age/p.life;fg.fillStyle=p.c;
      fg.beginPath();fg.arc(p.x,p.y,p.r,0,7);fg.fill();
    }else{
      p.rot+=p.vr*dt;p.vx*=.99;fg.globalAlpha=Math.min(1,(p.life-p.age)*2);
      fg.save();fg.translate(p.x,p.y);fg.rotate(p.rot);fg.fillStyle=p.c;
      fg.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.rot*2))+1);fg.restore();
    }
  }
  fg.globalAlpha=1;
}

/* ============ ETAT DE LA PARTIE ============ */
let S=null,H=[],busy=false,big=null,small=null,finalTimer=null,saved=null;
function buildLayout(){
  // roue FIXE de 13 cases, sans aucun doublon : 7 cases spéciales (une de chaque sorte) + 5 cases cadeaux + le cadeau mystère
  const keys=['vol','echange','double','bouclier','choix','autre','pas'];
  const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  const ds=shuf(Array.from({length:11},(_,i)=>i));        // motifs de cadeau tirés parmi les 11 disponibles (jamais deux fois le même)
  // 7 spéciales formant un cercle : 7 intervalles, dont 6 reçoivent une case cadeau (5 cadeaux + le mystère) => jamais deux cadeaux côte à côte
  const sp=shuf(keys),gaps=shuf([0,1,2,3,4,5,6]).slice(0,6),gifts=shuf(['g','g','g','g','g','m']),order=[];
  let gi=0;
  for(let i=0;i<7;i++){order.push(sp[i]);if(gaps.includes(i))order.push(gifts[gi++])}
  const r0=rnd(order.length),rot=order.slice(r0).concat(order.slice(0,r0));      // la roue démarre à un endroit au hasard
  let dI=0,gI=0;
  const slots=rot.map(k=>k==='m'?{k:'mystery'}:k==='g'?{k:'gift',c:(gI++)%2,d:ds[dI++]}:{k,v:0});
  slots.forEach((s,i)=>{s.id='s'+i+'_'+rnd(1e6)});
  return slots;
}
function newState(cfg){
  const normal=cfg.total-1;
  return{ver:VERSION,set:{total:cfg.total,thr:cfg.thr,boost:cfg.boost},
    players:PLAYERS.map(()=>({gifts:[]})),pool:Array.from({length:normal},(_,i)=>i+1),
    mysteryDrawn:false,shields:[],layout:buildLayout(),current:-1,phase:'smallReady'};
}
function save(){store.set(KEY,{S,H:H.slice(-60)})}
function loadSave(){const o=store.get(KEY);return(o&&o.S&&o.S.players&&o.S.layout&&o.S.layout.length===13)?o:null}   // une partie sauvegardée avec l'ancienne roue (24 cases) n'est pas reprise
const nm=i=>PLAYERS[i].name,av=i=>PLAYERS[i].av;
const isShield=g=>S.shields.includes(g);
const unprot=i=>S.players[i].gifts.filter(g=>!isShield(g));
const others=me=>{const r=[];PLAYERS.forEach((_,i)=>{if(i!==me)unprot(i).forEach(g=>r.push({p:i,g}))});return r};
const gv=x=>x==='M'?'M':+x;
function drawFromPool(){return S.pool.splice(rnd(S.pool.length),1)[0]}
function weightedPlayer(){
  const tot=PLAYERS.reduce((a,p)=>a+p.w,0);let r=Math.random()*tot;
  for(let i=0;i<PLAYERS.length;i++){r-=PLAYERS[i].w;if(r<0)return i}
  return PLAYERS.length-1;
}
function pickSeg(){
  const left=S.pool.length+(S.mysteryDrawn?0:1);
  const boost=left<=S.set.thr?S.set.boost:1;
  const w=S.layout.map(s=>(s.k==='gift'||s.k==='mystery')?1:boost),tot=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*tot;
  for(let i=0;i<w.length;i++){r-=w[i];if(r<0)return i}
  return w.length-1;
}
const gameOver=()=>S.pool.length===0&&S.mysteryDrawn;

/* ============ AFFICHAGE ============ */
const UI=$('ui'),MOD=$('modal');
function ov(html,cls=''){const e=document.createElement('div');e.className='ov '+cls;e.innerHTML=html;UI.appendChild(e);return e}
function modal(html,cls=''){const e=document.createElement('div');e.className='ov '+cls;e.innerHTML=html;MOD.appendChild(e);return e}
function clearUI(){UI.innerHTML=''}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2200)}
function waitTap(el,delay=800){return new Promise(res=>{const t0=performance.now();const h=()=>{if(performance.now()-t0<delay)return;el.removeEventListener('pointerdown',h);res()};el.addEventListener('pointerdown',h)})}
function pick(el,sel='button.tag:not(:disabled), button.who'){return new Promise(res=>{const h=ev=>{const b=ev.target.closest(sel);if(!b||!el.contains(b))return;el.removeEventListener('click',h);res(b)};el.addEventListener('click',h)})}
function flash(el){const f=document.createElement('div');f.className='flash';el.appendChild(f);setTimeout(()=>f.remove(),1000)}
const tapHint=t=>`<div class="tapHint">${t||'Appuie pour continuer'}</div>`;
function tag(g,extra=''){return`<div class="tag${g==='M'?' m':''}${isShield(g)?' prot':''} ${extra}"><b>${g==='M'?'?':g}</b></div>`}
function pickTag(g,p){const pr=isShield(g);return`<button class="tag${g==='M'?' m':''}${pr?' prot':''}" data-g="${g}" data-p="${p}" ${pr?'disabled':''}><b>${g==='M'?'?':g}</b></button>`}
function ownGrid(me){return S.players[me].gifts.map(g=>pickTag(g,me)).join('')}
function groupHTML(me){
  return PLAYERS.map((p,i)=>{
    if(i===me)return'';
    const gs=S.players[i].gifts;
    return`<div class="row" style="--c:${p.col}"><div class="wh"><i>${p.av}</i>${p.name}</div><div class="tags">${gs.length?gs.map(g=>pickTag(g,i)).join(''):'<span class="vide">Aucun cadeau</span>'}</div></div>`;
  }).join('');
}
function recapRows(){
  return PLAYERS.map((p,i)=>{
    const gs=S.players[i].gifts.slice().sort((a,b)=>((a==='M')-(b==='M'))||(a-b));
    return`<div class="row" style="--c:${p.col}"><div class="wh"><i>${p.av}</i>${p.name}</div><div class="tags">${gs.length?gs.map(g=>tag(g)).join(''):'<span class="vide">Aucun cadeau</span>'}</div></div>`;
  }).join('');
}
function hud(){
  if(!S)return;
  $('players').innerHTML=PLAYERS.map((p,i)=>{
    const gs=S.players[i].gifts,sh=gs.filter(isShield).length;
    return`<div class="chip${S.current===i?' on':''}" style="--c:${p.col}"><span class="av">${p.av}</span><span class="nm">${p.name}</span><span class="ct">🎁${gs.length}</span>${sh?`<span class="ct">🔒${sh}</span>`:''}</div>`;
  }).join('');
  const c=S.current;
  $('turnCard').innerHTML=c>=0?`<span class="av">${av(c)}</span><span class="nm">${nm(c)}</span>`:`<span class="av">🎄</span><span class="nm">Qui va jouer ?</span>`;
  $('hint').textContent=(!busy&&S.phase==='smallReady')?'👆 Tape pour désigner le joueur':(!busy&&S.phase==='bigReady')?`${nm(c)}, tape pour lancer la grande roue !`:'';
  $('bUndo').disabled=busy||!H.length;
  ['bRecap','bNew'].forEach(id=>$(id).disabled=busy);
  $('bSon').textContent=AE.vol.mute?'🔇':'🔊';
}
function layoutWheels(){
  big.resize();small.resize();
  big.setSegs(S.layout);small.setSegs(PLAYERS);
}
function showScreen(id){
  ['intro','settings','avPick','game'].forEach(x=>$(x).classList.toggle('on',x===id));
  $('santa').style.display=id==='game'?'block':'none';
  if(id==='game'){bgT=Math.max(bgT,99);requestAnimationFrame(()=>requestAnimationFrame(layoutWheels))}
}

/* ============ DEROULEMENT D'UN TOUR ============ */
document.addEventListener('pointerdown',()=>{});
$('game').addEventListener('pointerdown',e=>{if(e.target.closest('.ib'))return;tapStage()});
async function tapStage(){
  if(busy||!S)return;
  if(S.phase==='smallReady')return doSmall();
  if(S.phase==='bigReady')return doBig();
}
async function doSmall(){
  busy=true;S.phase='smallSpin';S.current=-1;hud();
  const idx=weightedPlayer();
  const plan=small.plan(idx,{dur:5.2});
  AE.launch();
  await small.spin(idx,{dur:5.2,turns:5,plan});
  S.current=idx;hud();
  await banner(idx);
  S.phase='bigReady';save();busy=false;hud();
}
async function banner(i){
  const p=PLAYERS[i];
  const el=ov(`<div class="burst"></div><div class="avBig">${p.av}</div><h1>${p.name} !</h1><div class="sub">À toi de jouer !</div>`,'banner');
  el.style.setProperty('--c',p.col);AE.fanSmall();confetti(70);
  await Promise.race([sleep(2700),waitTap(el,900)]);clearUI();
}
function pushHistory(){H.push(JSON.stringify(S));if(H.length>80)H.shift()}
async function doBig(){
  busy=true;pushHistory();S.phase='bigSpin';hud();
  while(true){
    const si=pickSeg(),seg=S.layout[si];
    LGT.spin=true;
    const plan=big.plan(si,{dur:8.8});                        // la physique du lancer se calcule pendant l'élan du Père Noël
    const vd=vidLaunch();if(vd>0)await sleep(vd);
    AE.launch();santaPush();
    await big.spin(si,{dur:8.8,turns:7,zoomAt:3,onZoom:()=>{big.zoomTo(2.7);AE.zoom()},plan});
    LGT.spin=false;
    await sleep(1100);
    big.zoomTo(1);await sleep(1100);
    const r=await resolveSeg(seg);
    if(r!=='relaunch')break;
  }
  clearUI();
  big.setSegs(S.layout);
  const wb=$('wheelBox');wb.classList.remove('pulse');void wb.offsetWidth;wb.classList.add('pulse');
  if(gameOver()){await showFinal();return}
  S.phase='smallReady';S.current=-1;save();busy=false;hud();
}
async function relaunch(ico,msg){
  ov(`<div class="sub" style="font-size:4.6vh">${ico}<br>${msg}</div>`,'light');AE.nope();
  await sleep(2000);clearUI();return'relaunch';
}
async function revealNum(n,sub){
  const el=ov(`<div class="burst"></div><div class="emo">🎁</div><div class="sub">${sub}</div><div class="numBig">${n}</div>${tapHint()}`,'gift');
  await waitTap(el,900);
}
async function resolveSeg(seg){
  const me=S.current,pl=S.players;
  lightHit(seg.k);
  switch(seg.k){
    case'gift':
    case'mystery':{
      // le mystère est donné par sa case, ou par n'importe quelle case cadeau quand la réserve est vide (dernier cadeau)
      const giveMyst=!S.mysteryDrawn&&(seg.k==='mystery'||!S.pool.length);
      if(giveMyst){
        S.mysteryDrawn=true;pl[me].gifts.push('M');
        const ms=S.layout.find(x=>x.k==='mystery');if(ms){ms.k='gift';ms.d=11;ms.c=0}   // la case reste sur la roue, devenue une case cadeau normale
        AE.mystere();confetti(80);
        const el=ov(`<div class="burst"></div><div class="mystGift">🎁</div><h2>Cadeau mystère !</h2><div class="sub s">${av(me)} ${nm(me)} le garde, mais il ne s’ouvrira qu’à la toute fin…<br>On peut le voler, l’échanger ou le protéger 🔒</div>${tapHint()}`);
        await waitTap(el,1200);return'ok';
      }
      if(!S.pool.length)return relaunch('🎁','Plus de cadeau à tirer…<br>on relance la roue !');
      // v3.7 : le cadeau se gagne en réussissant le mini-jeu du traîneau (2 essais)
      if(!await mjCase(me)){
        const el=ov(`<div class="cloud">🌨️</div><h2>Pas de cadeau…</h2><div class="sub">${av(me)} ${nm(me)} passe son tour, le cadeau reste sous le sapin</div>${tapHint()}`,'sad');
        AE.sad();await waitTap(el,1500);return'ok';
      }
      const n=drawFromPool();pl[me].gifts.push(n);
      AE.bells();confetti(110);
      await revealNum(n,`${av(me)} ${nm(me)} ouvre le cadeau`);return'ok';
    }
    case'vol':{
      const o=others(me);
      if(!o.length)return relaunch('🖐️','Personne à voler pour l’instant…<br>on relance la roue !');
      const el=ov(`<h2>🖐️ Vol !</h2><div class="sub s">${av(me)} ${nm(me)}, touche le cadeau que tu veux voler</div><div class="rows">${groupHTML(me)}</div>`);
      const b=await pick(el),g=gv(b.dataset.g),from=+b.dataset.p;
      pl[from].gifts.splice(pl[from].gifts.indexOf(g),1);pl[me].gifts.push(g);
      clearUI();
      const e2=ov(`<div class="sub">${av(me)} ${nm(me)} vole le cadeau de ${av(from)} ${nm(from)} !</div><div class="volScene"><div class="th">${av(me)}</div><div class="vi">${av(from)}</div><div class="vh">🖐️</div><div class="vg">${tag(g)}</div></div>${tapHint()}`,'vol');
      AE.steal();await waitTap(e2,2600);return'ok';
    }
    case'echange':{
      const mine=unprot(me),o=others(me);
      if(!mine.length||!o.length)return relaunch('🔄','Échange impossible pour l’instant…<br>on relance la roue !');
      const e1=ov(`<h2>🔄 Échange !</h2><div class="sub s">1. Touche TON cadeau à donner</div><div class="grid">${ownGrid(me)}</div>`);
      const b1=await pick(e1),g1=gv(b1.dataset.g);
      clearUI();
      const e2=ov(`<h2>🔄 Échange !</h2><div class="sub s">2. Contre quel cadeau ?</div><div class="rows">${groupHTML(me)}</div>`);
      const b2=await pick(e2),g2=gv(b2.dataset.g),from=+b2.dataset.p;
      pl[me].gifts[pl[me].gifts.indexOf(g1)]=g2;pl[from].gifts[pl[from].gifts.indexOf(g2)]=g1;
      clearUI();
      const e3=ov(`<div class="sub">${av(me)} ${nm(me)} échange avec ${av(from)} ${nm(from)} !</div><div class="swapScene"><div class="col"><i>${av(me)}</i><div class="tg a">${tag(g1)}</div></div><div class="sw">🔄</div><div class="col"><i>${av(from)}</i><div class="tg b">${tag(g2)}</div></div></div>${tapHint()}`);
      AE.swap();await waitTap(e3,2600);return'ok';
    }
    case'double':{
      if(!S.pool.length)return relaunch('🎆','Plus de cadeau à tirer…<br>on relance la roue !');
      const k=Math.min(2,S.pool.length),got=[];
      for(let i=0;i<k;i++){got.push(drawFromPool());}
      got.forEach(n=>pl[me].gifts.push(n));
      const el=ov(`<h1>💥 Double cadeau ! 💥</h1><div class="dblStage shake"><div class="pkBig">🎁</div></div><div class="sub">${av(me)} ${nm(me)}</div>`,'dbl');
      const st=el.querySelector('.dblStage');
      AE.rumble(1.6);await sleep(1700);
      st.classList.remove('shake');AE.boom();AE.pops(12,1.6);flash(el);confetti(160);
      for(let i=0;i<6;i++)setTimeout(()=>firework(BW*(.15+.7*Math.random()),BH*(.12+.45*Math.random())),i*230);
      st.innerHTML=got.map((n,i)=>`<div class="tag xl" style="animation:pop .7s ${i*.15}s both"><b>${n}</b></div>`).join('');
      el.insertAdjacentHTML('beforeend',tapHint());
      await waitTap(el,1200);return'ok';
    }
    case'bouclier':{
      const mine=unprot(me);
      if(!mine.length)return relaunch('🔒','Rien à protéger pour l’instant…<br>on relance la roue !');
      const e1=ov(`<h2>🔒 Bouclier !</h2><div class="sub s">Touche le cadeau à protéger jusqu’à la fin</div><div class="grid">${ownGrid(me)}</div>`);
      const b=await pick(e1),g=gv(b.dataset.g);
      S.shields.push(g);clearUI();
      const e2=ov(`<div class="lockWrap"><div class="lockBig">🔒</div>${tag(g)}</div><div class="sub">${av(me)} ${nm(me)} protège ce cadeau pour toujours !</div>${tapHint()}`);
      AE.lock();setTimeout(()=>confetti(40,{x:BW/2,y:BH*.4}),500);
      await waitTap(e2,1800);return'ok';
    }
    case'choix':{
      if(!S.pool.length)return relaunch('🎯','Plus de cadeau à choisir…<br>on relance la roue !');
      const nums=S.pool.slice().sort((a,b)=>a-b);
      const el=ov(`<h2>🎯 Cadeau au choix !</h2><div class="sub s">${av(me)} ${nm(me)}, touche un numéro</div><div class="grid">${nums.map(n=>pickTag(n,'')).join('')}</div>`);
      const b=await pick(el),n=+b.dataset.g;
      S.pool.splice(S.pool.indexOf(n),1);pl[me].gifts.push(n);
      clearUI();AE.bells();confetti(110);
      await revealNum(n,`${av(me)} ${nm(me)} choisit le cadeau`);return'ok';
    }
    case'autre':{
      if(!S.pool.length)return relaunch('💝','Plus de cadeau à offrir…<br>on relance la roue !');
      const el=ov(`<h2>💝 Cadeau pour un autre !</h2><div class="sub s">${av(me)} ${nm(me)}, à qui veux-tu l’offrir ?</div><div class="whoRow">${PLAYERS.map((p,i)=>i===me?'':`<button class="who" style="--c:${p.col}" data-p="${i}"><span class="a">${p.av}</span>${p.name}</button>`).join('')}</div>`);
      const b=await pick(el),r=+b.dataset.p,n=drawFromPool();
      pl[r].gifts.push(n);
      clearUI();AE.bells();confetti(110);
      await revealNum(n,`💝 ${av(me)} ${nm(me)} offre un cadeau à ${av(r)} ${nm(r)} !`);return'ok';
    }
    case'pas':{
      const el=ov(`<div class="flakes">${Array.from({length:16},()=>`<i style="left:${rnd(96)}%;animation-delay:${(Math.random()*2.6).toFixed(2)}s">❄️</i>`).join('')}</div><div class="cloud">🌨️</div><h2>Pas de chance !</h2><div class="sub">${av(me)} ${nm(me)} passe son tour</div>${tapHint()}`,'sad');
      AE.sad();await waitTap(el,1800);return'ok';
    }
  }
  return'ok';
}
