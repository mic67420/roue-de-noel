/* ---- Mini-jeu : LA GRANDE TRAVERSÉE (v3.32) ----
   Type « Crossy Road », vue de dessus en 3/4 : le Père Noël est en bas au centre, l'écran défile du haut vers le bas.
   Toucher = un bond en avant ; glisser à gauche / droite = un bond sur le côté.
   Les animaux et véhicules traversent les voies de gauche à droite ou de droite à gauche. 4 environnements : neige, plaine, ville, village.
   Adultes : 30 s, 3 cœurs, la rafale de neige rattrape celui qui reste immobile. Alix : sans chrono, sans cœurs, lent et facile.
   Colonnes : 0..6 (le Père Noël est entre 0 et 6) ; les rangées vont de 0 (départ) à N (arche d'arrivée). */
const TV_DIM={"B11_santa_dos":[123,205],"B11_santa_saut":[136,193],"B11_santa_atterrit":[197,174],"B11_santa_gauche":[139,187],"B11_santa_droite":[157,182],"B11_santa_ecrase":[238,156],"B11_santa_etourdi1":[168,203],"B11_santa_etourdi2":[153,211],"B11_santa_content":[206,213],"B11_cadeau":[196,201],"B11_etoile":[163,156],"B11_coeur_plein":[181,161],"B11_coeur_vide":[181,160],"B12_renne_trot":[221,220],"B12_renne_galop":[240,206],"B12_pingouin_marche":[130,178],"B12_pingouin_ventre":[213,123],"B12_renard":[230,123],"B12_lievre":[182,159],"B12_ours":[255,167],"B12_boule_neige":[205,197],"B12_traineau_vide":[209,151],"B12_sapin":[155,184],"B12_sapin_neige":[188,251],"B12_rocher":[207,158],"B13_mouton":[202,174],"B13_mouton_court":[220,166],"B13_vache":[237,178],"B13_oie":[143,182],"B13_lapin":[192,169],"B13_cheval":[260,196],"B13_tracteur":[209,169],"B13_charrette_ane":[270,172],"B13_botte":[197,175],"B13_epouvantail":[176,213],"B13_cloture":[189,183],"B13_arbre_givre":[201,222],"B14_voiture":[234,151],"B14_taxi":[271,137],"B14_camionnette":[259,171],"B14_bus":[259,178],"B14_chat":[229,133],"B14_chien":[230,157],"B14_pigeon":[178,186],"B14_cycliste":[195,219],"B14_passant":[145,229],"B14_lampadaire":[96,247],"B14_boite_lettres":[100,210],"B14_banc":[234,183],"B15_enfant_luge":[169,189],"B15_enfant_court":[139,190],"B15_chien":[221,153],"B15_poule":[143,180],"B15_cheval_traineau":[288,169],"B15_charrette":[248,158],"B15_bonhomme":[147,205],"B15_tonneau":[137,177],"B15_sapin_noel":[184,248],"B15_lanterne":[108,207],"B15_arche":[223,236],"B15_maisonnette":[180,239],"B16_immeuble_grand":[269,246],"B16_immeuble_magasin":[180,206],"B16_maison":[200,213],"B16_eglise":[176,227],"B16_grange":[227,194],"B16_moulin":[156,215],"B16_igloo":[246,168],"B16_sapins3":[237,227],"B16_rochers_glace":[245,182],"B16_panneau":[147,220],"B16_bosquet":[269,226],"B16_lampadaire_village":[77,228]};
const TV_C=7,TV_CH=.13,TV_RH=.115,TV_HOP=.17,TV_P=24,TV_X0=-9;
// [image, hauteur en rangées, vitesse min, vitesse max] (colonnes par seconde)
const TV_BIO=[
 {nom:'❄️ Paysage enneigé',safe:['#f1f6ff','#e3edfc'],lane:'#b3c4e0',ligne:'rgba(255,255,255,.6)',
  an:[['B12_renne_trot',1.15,1.7,2.3],['B12_renne_galop',1.15,2.8,3.5],['B12_pingouin_marche',.95,1.3,1.8],['B12_pingouin_ventre',.7,2.6,3.2],['B12_renard',.75,2.8,3.5],['B12_lievre',.8,3,3.7],['B12_ours',1.2,1.1,1.6],['B12_boule_neige',1.05,2.2,2.8],['B12_traineau_vide',.9,2.8,3.4]],
  blocs:[['B12_sapin',1.3],['B12_sapin_neige',1.7],['B12_rocher',.8]],marges:[['B16_sapins3',2.2],['B16_igloo',1.5],['B16_rochers_glace',1.7]]},
 {nom:'🌾 La plaine',safe:['#d4e6bd','#c8dfaa'],lane:'#b59a74',ligne:'rgba(90,65,40,.35)',
  an:[['B13_mouton',.95,1.2,1.7],['B13_mouton_court',.9,2.2,2.8],['B13_vache',1.15,.9,1.4],['B13_oie',.9,1.5,2],['B13_lapin',.8,2.8,3.6],['B13_cheval',1.2,3.4,4.2],['B13_tracteur',1.15,2,2.6],['B13_charrette_ane',1.2,1.5,1.9]],
  blocs:[['B13_botte',.85],['B13_cloture',.8],['B13_arbre_givre',1.7],['B13_epouvantail',1.5]],marges:[['B16_grange',2],['B16_moulin',2.8],['B16_bosquet',1.7]]},
 {nom:'🏙️ La ville',safe:['#cfcbc8','#c3bfbc'],lane:'#3b404c',ligne:'rgba(255,255,255,.75)',
  an:[['B14_voiture',.95,3,3.8],['B14_taxi',.95,3.8,4.6],['B14_camionnette',1.1,2.6,3.2],['B14_bus',1.35,2,2.6],['B14_chat',.6,2.8,3.6],['B14_chien',.8,3.2,3.8],['B14_pigeon',.7,1.4,1.9],['B14_cycliste',1.1,2.3,2.9],['B14_passant',1.2,1.1,1.5]],
  blocs:[['B14_lampadaire',2],['B14_boite_lettres',1.05],['B14_banc',.8]],marges:[['B16_immeuble_grand',3.2],['B16_immeuble_magasin',2.2],['B16_lampadaire_village',2.2]]},
 {nom:'🏘️ Le village',safe:['#eef3fb','#e0e9f6'],lane:'#8d6c4e',ligne:'rgba(255,255,255,.35)',
  an:[['B15_enfant_luge',.9,2.8,3.4],['B15_enfant_court',1.1,2.4,3],['B15_chien',.8,3.2,3.8],['B15_poule',.7,1.4,1.9],['B15_cheval_traineau',1.3,3.2,3.9],['B15_charrette',1,1.5,1.9]],
  blocs:[['B15_bonhomme',1.3],['B15_tonneau',.85],['B15_sapin_noel',1.7],['B15_lanterne',1.2]],marges:[['B16_maison',2],['B16_eglise',2.6],['B15_maisonnette',1.5],['B16_lampadaire_village',2.2]]}
];
const tvAsp=k=>{const d=TV_DIM[k];return d?d[0]/d[1]:1};
const tvPick=a=>a[Math.floor(Math.random()*a.length)];
const tvHW=(k,h,easy)=>{const w=h*TV_RH*tvAsp(k)/TV_CH;return w*(easy?.3:.36)+(easy?.16:.2)};   // demi-largeur de collision, en colonnes
function mjtLane(bio,easy){
  const B=TV_BIO[bio],kinds=[],n=Math.random()<.45?2:1;
  for(let i=0;i<n;i++){const a=tvPick(B.an);if(!kinds.some(k=>k[0]===a[0]))kinds.push(a)}
  const dir=Math.random()<.5?1:-1,fac=easy?.55:1,v=[],objs=[];
  const vit=kinds.map(k=>(k[2]+Math.random()*(k[3]-k[2]))*fac);
  const sp=vit.reduce((a,b)=>a+b,0)/vit.length;
  const gap=(easy?6.5:3.6)+Math.random()*(easy?3:2.4),cnt=Math.max(2,Math.round(TV_P/gap));
  for(let i=0;i<cnt;i++){const ki=i%kinds.length,k=kinds[ki];objs.push({x0:i*TV_P/cnt+(Math.random()-.5)*gap*.3,key:k[0],h:k[1]*(easy?1.15:1),hw:tvHW(k[0],k[1]*(easy?1.15:1),easy),v:vit[ki]})}
  return{t:'lane',bio,dir,objs};
}
function mjtSafe(bio,first,easy){
  const B=TV_BIO[bio],blk=[],marg=[];
  if(!first&&!easy||(!first&&Math.random()<.5)){const nb=Math.random()<.5?1:2;for(let i=0;i<nb;i++){const c=Math.floor(Math.random()*TV_C);if(!blk.some(b=>Math.abs(b.c-c)<2)){const d=tvPick(B.blocs);blk.push({c,key:d[0],h:d[1]})}}}
  for(const side of[-1,1])if(Math.random()<.75){const d=tvPick(B.marges);marg.push({side,key:d[0],h:d[1]})}
  if(first)marg.push({side:1,key:'B16_panneau',h:1.5,pan:true});
  return{t:'safe',bio,blk,marg,first};
}
function mjtNew(easy){
  const B=easy?5:8,rows=[{t:'safe',bio:0,blk:[],marg:[{side:-1,key:'B16_sapins3',h:2.2},{side:1,key:'B12_sapin_neige',h:1.7}],first:true,depart:true}];
  let run=0,prevBlk=false;
  for(let k=0;k<4;k++)for(let i=0;i<B;i++){
    const first=i===0,lane=!first&&run<3&&Math.random()<(easy?.58:.74);
    if(lane){rows.push(mjtLane(k,easy));run++;prevBlk=false}
    else{const r=mjtSafe(k,first,easy);if(prevBlk)r.blk=[];rows.push(r);run=0;prevBlk=r.blk.length>0}
  }
  rows.push({t:'fin',bio:3,blk:[],marg:[]});
  return{D:easy?99999:30,notimer:easy,t:0,done:null,ev:[],easy,asp:2,rows,N:rows.length-1,
    c:3,r:0,hop:null,q:null,stun:0,inv:0,lives:3,max:3,chase:-3.4,cam:0,bio:0,bioT:-9,down:null,best:0};
}
function mjtX(R,o,t){const p=(((o.x0+R.dir*o.v*t)%TV_P)+TV_P)%TV_P;return TV_X0+p}
function mjtBlocked(s,r,c){const R=s.rows[r];return!!(R&&R.t==='safe'&&R.blk.some(b=>b.c===c))}
function mjtHop(s,dc,dr){
  if(s.done||s.stun>0)return false;
  if(s.hop){s.q=[dc,dr];return false}
  const tc=s.c+dc,tr=s.r+dr;
  if(tc<0||tc>=TV_C||tr<0||tr>s.N){s.ev.push({k:'bump'});return false}
  if(mjtBlocked(s,tr,tc)){s.ev.push({k:'bump'});return false}
  s.hop={t:0,dur:TV_HOP,fr:s.r,fc:s.c,tr,tc,back:false};s.ev.push({k:'saut',dr});return true;
}
function mjtDown(s,fx,fy){s.down={x:fx,y:fy,used:false}}
function mjtMove(s,fx,fy){
  const d=s.down;if(!d||d.used)return;
  const dx=(fx-d.x)*s.asp;if(Math.abs(dx)>.06){d.used=true;mjtHop(s,dx>0?1:-1,0)}
}
function mjtUp(s){const d=s.down;s.down=null;if(d&&!d.used)mjtHop(s,0,1)}
function mjtKey(s,k){
  if(k==='ArrowUp'||k===' '||k==='w')mjtHop(s,0,1);else if(k==='ArrowLeft'||k==='a')mjtHop(s,-1,0);else if(k==='ArrowRight'||k==='d')mjtHop(s,1,0);
}
function mjtHit(s,why){
  if(s.inv>0||s.done)return;
  if(!s.easy)s.lives--;
  s.ev.push({k:why==='rafale'?'rafale':'hit'});
  s.stun=.55;s.inv=1.5;
  const fr=s.hop?s.hop.fr:s.r,fc=s.hop?s.hop.fc:s.c;s.hop=null;s.q=null;s.r=fr;s.c=fc;
  if(why==='rafale')s.chase=s.r-3.4;
  if(s.r>0){ // recul d'une rangée (colonne libre la plus proche)
    let tc=s.c;if(mjtBlocked(s,s.r-1,tc)){for(let d=1;d<TV_C;d++){if(tc+d<TV_C&&!mjtBlocked(s,s.r-1,tc+d)){tc+=d;break}if(tc-d>=0&&!mjtBlocked(s,s.r-1,tc-d)){tc-=d;break}}}
    s.hop={t:0,dur:.22,fr:s.r,fc:s.c,tr:s.r-1,tc,back:true};
  }
  if(!s.easy&&s.lives<=0)s.done='lose';
}
function mjtUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;s.stun=Math.max(0,s.stun-dt);s.inv=Math.max(0,s.inv-dt);
  if(s.hop){
    s.hop.t+=dt;
    if(s.hop.t>=s.hop.dur){
      const h=s.hop;s.r=h.tr;s.c=h.tc;s.hop=null;
      if(!h.back){s.ev.push({k:'pose'});if(s.r>s.best){s.best=s.r;const b=s.rows[s.r].bio;if(b!==s.bio){s.bio=b;s.bioT=s.t;s.ev.push({k:'bio',b})}}}
      if(s.r>=s.N){s.done='win';return}
    }
  }
  if(!s.hop&&s.q&&s.stun<=0){const q=s.q;s.q=null;mjtHop(s,q[0],q[1])}
  // collision avec la voie où se trouve le Père Noël
  const row=s.hop?(s.hop.t<s.hop.dur*.5?s.hop.fr:s.hop.tr):s.r,R=s.rows[row];
  if(R&&R.t==='lane'&&s.inv<=0){
    const x=s.hop?s.hop.fc+(s.hop.tc-s.hop.fc)*Math.min(1,s.hop.t/s.hop.dur):s.c;
    for(const o of R.objs){if(Math.abs(mjtX(R,o,s.t)-x)<o.hw){mjtHit(s,'obstacle');break}}
  }
  // rafale de neige (adultes) : rattrape celui qui reste immobile
  if(!s.easy&&!s.done){
    s.chase+=(.3+.14*Math.min(1,s.t/s.D))*dt;
    if(s.r-s.chase<1.0)mjtHit(s,'rafale');
  }
  const tgt=s.hop?s.hop.fr+(s.hop.tr-s.hop.fr)*Math.min(1,s.hop.t/s.hop.dur):s.r;
  s.cam+=(tgt-s.cam)*(1-Math.exp(-9*dt));
  if(!s.done&&!s.easy&&s.t>=s.D)s.done='temps';
}
/* ---- dessin ---- */
function mjtSpr(g,key,cx,by,h,flip,alpha,rot){
  const im=MJ.img[key];if(!im||!im.naturalWidth)return;
  const w=h*im.naturalWidth/im.naturalHeight;
  g.save();if(alpha!=null)g.globalAlpha=alpha;g.translate(cx,by);if(rot)g.rotate(rot);if(flip)g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);g.restore();
}
function mjtHash(a,b){const x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x)}
function mjtDraw(g,s,W,H,tm){
  s.asp=W/H;
  const ch=TV_CH*H,rh=TV_RH*H,colX=c=>W/2+(c-3)*ch,yb=r=>H*.86-(r-s.cam)*rh;
  const rTop=Math.min(s.N+3,Math.ceil(s.cam+(H*.86+rh)/rh)+4),rBot=Math.floor(s.cam-.25/TV_RH)-1;
  const rowVis=s.hop?s.hop.fr+(s.hop.tr-s.hop.fr)*Math.min(1,s.hop.t/s.hop.dur):s.r,rSan=Math.round(rowVis);
  g.fillStyle='#e8f0ff';g.fillRect(0,0,W,H);
  let santaDone=false;
  const drawSanta=()=>{
    santaDone=true;
    const p=s.hop?Math.min(1,s.hop.t/s.hop.dur):0,sx=s.hop?s.hop.fc+(s.hop.tc-s.hop.fc)*p:s.c,x=colX(sx),foot=yb(rowVis)-rh*.28,lift=s.hop&&!s.hop.back?Math.sin(p*Math.PI)*rh*.5:0;
    g.fillStyle='rgba(20,30,70,.32)';g.beginPath();g.ellipse(x,foot,ch*.3*(1-lift/rh*.4),rh*.1,0,0,6.283);g.fill();
    let key='B11_santa_dos',flip=false;
    if(s.stun>0)key=Math.floor(s.t*6)%2?'B11_santa_etourdi1':'B11_santa_etourdi2';
    else if(s.hop&&!s.hop.back){if(s.hop.tc!==s.hop.fc){key='B11_santa_droite';flip=s.hop.tc<s.hop.fc}else key='B11_santa_saut'}
    else if(s.done==='win')key='B11_santa_content';
    const blink=s.inv>0&&Math.floor(s.t*14)%2===0?.45:1;
    mjtSpr(g,key,x,foot-lift,rh*1.45,flip,blink);
  };
  for(let r=rTop;r>=rBot;r--){
    const R=s.rows[Math.max(0,Math.min(s.N,r))],b=TV_BIO[R.bio],y1=yb(r),y0=y1-rh;
    if(y0>H+4||y1<-rh*3)continue;
    const lane=R.t==='lane'&&r>0&&r<=s.N;
    g.fillStyle=lane?b.lane:b.safe[((r%2)+2)%2];g.fillRect(0,y0,W,rh+1);
    if(R.t==='fin'){const sq=rh/2;for(let i=0;i<W/sq;i++)for(let j=0;j<2;j++){g.fillStyle=(i+j)%2?'#fff':'#c8202c';g.fillRect(i*sq,y0+j*sq,sq,sq)}}
    else if(lane){
      g.strokeStyle=b.ligne;g.lineWidth=Math.max(2,rh*.05);g.setLineDash([rh*.45,rh*.4]);g.beginPath();g.moveTo(0,y0+rh*.5);g.lineTo(W,y0+rh*.5);g.stroke();g.setLineDash([]);
      g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y1-2,W,2);
    }else{
      g.fillStyle='rgba(255,255,255,.45)';for(let i=0;i<9;i++){const hx=mjtHash(r,i);g.fillRect(hx*W,y0+mjtHash(i,r)*rh,3+hx*3,2)}
      g.fillStyle='rgba(120,140,190,.12)';g.fillRect(0,y1-3,W,3);
    }
    // décor de la rangée
    if(R.t==='safe'&&r>=0){
      for(const m of R.marg){const x=m.side<0?W*.07:W*.93;mjtSpr(g,m.key,x,y1-rh*.1,m.h*rh,false);}
      for(const bl of R.blk)mjtSpr(g,bl.key,colX(bl.c),y1-rh*.22,bl.h*rh,false);
    }
    if(R.t==='fin')mjtSpr(g,'B15_arche',colX(3),y1-rh*.1,rh*3.1,false);
    if(lane){
      for(const o of R.objs){
        const x=colX(mjtX(R,o,s.t)+0)-0,cx=W/2+(mjtX(R,o,s.t)-3)*ch;
        if(cx<-rh*3||cx>W+rh*3)continue;
        const hgt=o.h*rh,wpx=hgt*tvAsp(o.key);
        g.fillStyle='rgba(20,30,70,.28)';g.beginPath();g.ellipse(cx,y1-rh*.26,wpx*.42,rh*.12,0,0,6.283);g.fill();
        mjtSpr(g,o.key,cx,y1-rh*.2,hgt,R.dir<0);
      }
    }
    if(r===rSan)drawSanta();
  }
  if(!santaDone)drawSanta();
  // rafale de neige qui avance par le bas (adultes)
  if(!s.easy){
    const yf=yb(s.chase+1);
    if(yf<H){const gr=g.createLinearGradient(0,yf-rh*.8,0,yf+rh*.4);gr.addColorStop(0,'rgba(210,225,250,0)');gr.addColorStop(.35,'rgba(215,228,252,.78)');gr.addColorStop(1,'rgba(235,242,255,.95)');
      g.fillStyle=gr;g.fillRect(0,yf-rh*.8,W,H-yf+rh*.8);
      g.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<26;i++){const px=((i*97.3+tm*(180+i%5*40))%(W+40))-20,py=yf+(((i*53+tm*140)%(H-yf+30))-10);g.beginPath();g.arc(px,py,2+(i%3),0,6.283);g.fill()}}
  }
  // bandeau du nouvel environnement
  const bt=s.t-s.bioT;
  if(bt>=0&&bt<2.6){const a=Math.min(1,bt*3,(2.6-bt)*2);g.save();g.globalAlpha=a;g.textAlign='center';g.textBaseline='middle';g.font=`italic 900 ${H*.075}px Georgia,serif`;g.lineWidth=H*.012;g.strokeStyle='#1a2a60';g.strokeText(TV_BIO[s.bio].nom,W/2,H*.3);g.fillStyle='#ffe48a';g.fillText(TV_BIO[s.bio].nom,W/2,H*.3);g.restore()}
  if(s.t<5&&s.best===0){g.save();g.globalAlpha=.7+.3*Math.sin(tm*5);g.textAlign='center';g.font=`bold ${H*.045}px Georgia,serif`;g.lineWidth=5;g.strokeStyle='#1a2a60';const m='Touche pour avancer · glisse pour aller sur le côté';g.strokeText(m,W/2,H*.5);g.fillStyle='#fff';g.fillText(m,W/2,H*.5);g.restore()}
}
function mjtHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.fillText(p.av,26*u,46*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  if(!s.easy){const hs=50*u;for(let i=0;i<s.max;i++){const img=im[i<s.lives?'B11_coeur_plein':'B11_coeur_vide'];if(img&&img.naturalWidth)g.drawImage(img,260*u+i*(hs+6*u),16*u,hs,hs*img.naturalHeight/img.naturalWidth)}}
  // progression du voyage : 4 étapes
  const bx=W*.58,bw=W*.28,by=26*u,pr=Math.min(1,s.best/s.N);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  g.fillStyle='rgba(8,14,46,.8)';for(let i=1;i<4;i++)g.fillRect(bx+bw*i/4-1,by+3*u,2,16*u);
  const sa=im.B11_santa_dos;if(sa&&sa.naturalWidth){const h=40*u,x=bx+(bw-6*u)*pr;g.drawImage(sa,x-6*u,by-14*u,h*sa.naturalWidth/sa.naturalHeight,h)}
}
function mjTraversee(me){
  return mjRunner(me,{
    nouveau:mjtNew,maj:mjtUpdate,dessin:mjtDraw,hud:mjtHud,
    tap:(s,fx,fy)=>mjtDown(s,fx,fy),drag:(s,fx,fy)=>mjtMove(s,fx,fy),up:s=>mjtUp(s),clavier:(s,k)=>mjtKey(s,k),
    evenement:(e,s,fx,cv)=>{
      if(e.k==='saut'){AE.pops&&AE.pops(1,.2)}
      else if(e.k==='hit'){AE.nope&&AE.nope();cv.style.transform='translate('+(Math.random()*18-9)+'px,'+(Math.random()*10-5)+'px)'}
      else if(e.k==='rafale'){AE.boom&&AE.boom();AE.nope&&AE.nope();cv.style.transform='translate('+(Math.random()*14-7)+'px,'+(Math.random()*8-4)+'px)'}
      else if(e.k==='bio'){AE.bells&&AE.bells()}
      else if(e.k==='bump'){AE.pops&&AE.pops(1,.1)}
    },
    intro:['La grande traversée !','Touche pour sauter en avant, glisse pour aller sur le côté.','Évite les animaux jusqu\'au village !']
  });
}
