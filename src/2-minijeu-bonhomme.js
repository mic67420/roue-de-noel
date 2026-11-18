/* ---- Mini-jeu 4 : construis ton bonhomme de neige (v3.27) ----
   1) Glisse le doigt dans la neige : une boule roule et grossit. Adultes : lâche-la dans la zone verte (trop grosse = elle éclate).
      Alix : la boule se pose toute seule quand elle atteint la bonne taille, et on peut reprendre en touchant à nouveau.
   2) Touche chaque accessoire (chapeau, nez, écharpe, bras) pour habiller le bonhomme.
   Positions en fractions de l'écran, tailles en fraction de la hauteur. */
const MJB_TGT=[.18,.13,.09],MJB_GAIN=.075,MJB_X=.72,MJB_GY=.90,MJB_R0=.03,MJB_BAND=1.1;
const MJB_ACC=[{k:'chapeau',x:.10,y:.86,sz:.07},{k:'nez',x:.24,y:.87,sz:.09},{k:'echarpe',x:.38,y:.86,sz:.06},{k:'bras',x:.51,y:.86,sz:.05}];
function mjbGeo(){
  const g=[],r1=MJB_TGT[0],r2=MJB_TGT[1],r3=MJB_TGT[2],c1=MJB_GY-r1,c2=c1-(r1+r2)*.85,c3=c2-(r2+r3)*.85;
  return[{x:MJB_X,y:c1,r:r1},{x:MJB_X,y:c2,r:r2},{x:MJB_X,y:c3,r:r3}];
}
function mjbAnchor(k,G){
  if(k==='chapeau')return{x:G[2].x,y:G[2].y-G[2].r*1.0,sz:G[2].r*1.2};
  if(k==='nez')return{x:G[2].x+G[2].r*.3,y:G[2].y+G[2].r*.12,sz:G[2].r*.9};
  if(k==='echarpe')return{x:G[2].x,y:G[2].y+G[2].r*.95,sz:G[2].r*.95};
  return{x:G[1].x,y:G[1].y,sz:G[1].r};
}
function mjbNew(easy){
  return{D:easy?99999:30,t:0,done:null,ev:[],easy,notimer:easy,asp:2,cur:null,stack:[],fx:[],G:mjbGeo(),
    acc:MJB_ACC.map(a=>({k:a.k,x:a.x,y:a.y,sz:a.sz,placed:false,fly:null})),pad:easy?.05:.015,
    need:7,got:0};
}
function mjbLock(s,cur){
  const i=s.stack.length,G=s.G[i];
  s.stack.push({r:G.r,x:G.x,y:G.y,fly:{t:0,dur:.4,x:cur.x,y:cur.y,r:cur.r}});
  s.cur=null;s.got++;s.ev.push({k:'pose'});
}
function mjbTap(s,fx,fy){
  if(s.done)return;
  if(s.stack.length<3){
    if(s.cur){s.cur.held=true;return}
    s.cur={x:fx,y:fy,r:MJB_R0,path:0,held:true,trail:[]};return;
  }
  for(const a of s.acc){
    if(a.placed||a.fly)continue;
    if(Math.hypot((fx-a.x)*s.asp,fy-a.y)<a.sz*1.25+s.pad){a.fly={t:0,dur:.35};s.ev.push({k:'acc'});return}
  }
}
function mjbMove(s,fx,fy){
  const c=s.cur;if(!c||!c.held||s.done)return;
  const d=Math.hypot((fx-c.x)*s.asp,fy-c.y);
  c.path+=d;c.x=fx;c.y=fy;c.r=MJB_R0+c.path*MJB_GAIN;
  c.trail.push({x:fx,y:fy,r:c.r});if(c.trail.length>60)c.trail.shift();
  const tg=MJB_TGT[s.stack.length];
  if(s.easy){if(c.r>=tg)mjbLock(s,c)}
  else if(c.r>tg*MJB_BAND){s.fx.push({x:c.x,y:c.y,r:c.r,t:0,k:'boom'});s.cur=null;s.ev.push({k:'eclate'})}
}
function mjbUp(s){
  const c=s.cur;if(!c)return;
  const tg=MJB_TGT[s.stack.length];
  if(s.easy){c.held=false;return}
  if(c.r>=tg&&c.r<=tg*MJB_BAND)mjbLock(s,c);
  else{s.fx.push({x:c.x,y:c.y,r:c.r,t:0,k:'fond'});s.cur=null;s.ev.push({k:'fondu'})}
}
function mjbUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;
  for(const b of s.stack)if(b.fly){b.fly.t+=dt;if(b.fly.t>=b.fly.dur){b.fly=null;s.fx.push({x:b.x,y:b.y+b.r*.8,r:b.r,t:0,k:'pose'})}}
  for(const a of s.acc)if(a.fly){a.fly.t+=dt;if(a.fly.t>=a.fly.dur){a.fly=null;a.placed=true;s.got++}}
  for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<.6);
  if(s.stack.length===3&&s.stack.every(b=>!b.fly)&&s.acc.every(a=>a.placed)){s.done='win';return}
  if(s.t>=s.D)s.done='temps';
}
/* ---- dessin ---- */
function mjbBoule(g,x,y,r,rot){
  const gr=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.7,'#e4eeff');gr.addColorStop(1,'#a9c0ec');
  g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();
  g.strokeStyle='rgba(110,140,200,.55)';g.lineWidth=Math.max(1.5,r*.04);g.beginPath();g.arc(x,y,r,0,6.283);g.stroke();
  g.strokeStyle='rgba(150,175,225,.55)';g.lineWidth=Math.max(1,r*.03);
  for(let i=0;i<3;i++){const a=rot+i*2.1;g.beginPath();g.arc(x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25,r*.45,a-.8,a+.8);g.stroke()}
}
function mjbTige(g,x0,y0,x1,y1,w){g.strokeStyle='#4a2c12';g.lineCap='round';g.lineWidth=w;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle='#7a4c22';g.lineWidth=w*.4;g.stroke()}
function mjbAcc(g,k,x,y,sz,H,dir){
  const u=sz*H;g.save();g.translate(x,y);
  if(k==='chapeau'){
    g.fillStyle='#16181f';g.fillRect(-u*.5,-u*1.5,u,u*1.35);
    g.fillStyle='#2a2e3a';g.fillRect(-u*.5,-u*1.5,u*.22,u*1.35);
    g.fillStyle='#b8202a';g.fillRect(-u*.5,-u*.45,u,u*.28);
    g.fillStyle='#16181f';g.beginPath();g.ellipse(0,-u*.12,u*.85,u*.22,0,0,6.283);g.fill();
    g.fillStyle='#1d212b';g.beginPath();g.ellipse(0,-u*1.5,u*.5,u*.13,0,0,6.283);g.fill();
  }else if(k==='nez'){
    const gr=g.createLinearGradient(0,-u*.2,0,u*.2);gr.addColorStop(0,'#ff9a3a');gr.addColorStop(1,'#d9560e');g.fillStyle=gr;
    g.beginPath();g.moveTo(-u*.15,-u*.22);g.lineTo(u*1.0,0);g.lineTo(-u*.15,u*.22);g.closePath();g.fill();
    g.strokeStyle='#a83e08';g.lineWidth=Math.max(1,u*.04);for(let i=1;i<4;i++){g.beginPath();g.moveTo(u*(.1+i*.2),-u*.1*(1-i*.2));g.lineTo(u*(.1+i*.2),u*.1*(1-i*.2));g.stroke()}
    g.fillStyle='#3f8a2a';g.beginPath();g.ellipse(-u*.2,0,u*.1,u*.2,0,0,6.283);g.fill();
  }else if(k==='echarpe'){
    const w=u*1.9,h=u*.3;
    for(let i=0;i<8;i++){g.fillStyle=i%2?'#f4f4f4':'#c8202c';g.fillRect(-w/2+i*w/8,-h/2,w/8+1,h)}
    g.fillStyle='#c8202c';g.fillRect(w*.18,h*.4,u*.3,u*.7);g.fillStyle='#f4f4f4';g.fillRect(w*.18,h*.4+u*.23,u*.3,u*.14);
    g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=Math.max(1,u*.03);g.strokeRect(-w/2,-h/2,w,h);
  }else{ // bras : deux branches en V
    const w=Math.max(2,u*.11);
    for(const sg of[-1,1]){mjbTige(g,sg*u*.95,0,sg*u*2.1,-u*.85,w);mjbTige(g,sg*u*1.5,-u*.4,sg*u*1.95,-u*.2,w*.7);mjbTige(g,sg*u*1.7,-u*.6,sg*u*1.75,-u*1.1,w*.7)}
  }
  g.restore();
}
function mjbDraw(g,s,W,H,tm){
  s.asp=W/H;const G=s.G;
  g.drawImage(mjlFond(W,H,true),0,0);
  // ombre du bonhomme
  g.fillStyle='rgba(30,45,90,.3)';g.beginPath();g.ellipse(MJB_X*W,MJB_GY*H+H*.01,MJB_TGT[0]*H*1.1,H*.03,0,0,6.283);g.fill();
  // guides pointillés des boules pas encore posées
  g.save();g.setLineDash([8,8]);g.strokeStyle='rgba(120,150,210,.7)';g.lineWidth=3;
  for(let i=s.stack.length;i<3;i++){g.beginPath();g.arc(G[i].x*W,G[i].y*H,G[i].r*H,0,6.283);g.stroke()}
  g.restore();
  // boules posées (la plus basse d'abord)
  s.stack.forEach((b,i)=>{
    let x=b.x*W,y=b.y*H,r=b.r*H;
    if(b.fly){const k=Math.min(1,b.fly.t/b.fly.dur),e=1-Math.pow(1-k,3);x=(b.fly.x+(b.x-b.fly.x)*e)*W;y=(b.fly.y+(b.y-b.fly.y)*e)*H-Math.sin(k*3.14)*H*.12;r=(b.fly.r+(b.r-b.fly.r)*e)*H}
    else{const sq=1+Math.max(0,.5-(s.t%1000))*0;}
    mjbBoule(g,x,y,r,i*1.3);
    if(!b.fly){
      if(i===1){g.fillStyle='#1b1d24';for(const dy of[-.4,0,.4]){g.beginPath();g.arc(x,y+dy*r*.8,r*.07,0,6.283);g.fill()}}
      if(i===2){g.fillStyle='#1b1d24';g.beginPath();g.arc(x-r*.3,y-r*.2,r*.09,0,6.283);g.arc(x+r*.3,y-r*.2,r*.09,0,6.283);g.fill();
        for(let j=-2;j<=2;j++){g.beginPath();g.arc(x+j*r*.15,y+r*.42+Math.abs(j)*0+(j*j)*r*.03,r*.04,0,6.283);g.fill()}}
    }
  });
  // accessoires posés (ou en vol)
  for(const a of s.acc){
    if(!a.placed&&!a.fly)continue;
    const an=mjbAnchor(a.k,G);let x=an.x*W,y=an.y*H;
    if(a.fly){const k=Math.min(1,a.fly.t/a.fly.dur),e=1-Math.pow(1-k,3);x=(a.x+(an.x-a.x)*e)*W;y=(a.y+(an.y-a.y)*e)*H-Math.sin(k*3.14)*H*.1}
    mjbAcc(g,a.k,x,y,a.fly?(a.sz+(an.sz-a.sz)*Math.min(1,a.fly.t/a.fly.dur)):an.sz,H);
  }
  // accessoires à prendre (après les 3 boules)
  if(s.stack.length===3&&s.stack.every(b=>!b.fly)){
    for(const a of s.acc){
      if(a.placed||a.fly)continue;
      const bob=Math.sin(tm*4+a.x*9)*H*.012;
      g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.arc(a.x*W,a.y*H+bob-H*.01,H*.075,0,6.283);g.fill();
      g.strokeStyle='rgba(255,230,120,.9)';g.lineWidth=3;g.setLineDash([6,6]);g.stroke();g.setLineDash([]);
      mjbAcc(g,a.k,a.x*W,a.y*H+bob+(a.k==='chapeau'?H*.03:a.k==='bras'?H*.02:0),a.sz,H);
    }
  }
  // boule en train de rouler : traînée, guides, boule
  const c=s.cur;
  if(c){
    const tg=MJB_TGT[s.stack.length];
    g.save();g.strokeStyle='rgba(120,150,205,.35)';g.lineCap='round';g.lineJoin='round';
    for(let i=1;i<c.trail.length;i++){const p=c.trail[i-1],q=c.trail[i];g.lineWidth=Math.max(4,q.r*H*1.5);g.beginPath();g.moveTo(p.x*W,p.y*H+q.r*H*.4);g.lineTo(q.x*W,q.y*H+q.r*H*.4);g.stroke()}
    g.restore();
    g.fillStyle='rgba(25,40,90,.3)';g.beginPath();g.ellipse(c.x*W,c.y*H+c.r*H*.95,c.r*H*.95,c.r*H*.2,0,0,6.283);g.fill();
    mjbBoule(g,c.x*W,c.y*H,c.r*H,c.path*9);
    // cercle à atteindre (vert) et limite (rouge, adultes)
    g.save();g.setLineDash([10,8]);g.lineWidth=4;g.strokeStyle=c.r>=tg?'#5dff8a':'rgba(120,255,160,.85)';g.beginPath();g.arc(c.x*W,c.y*H,tg*H,0,6.283);g.stroke();
    if(!s.easy){g.strokeStyle='rgba(255,90,80,.9)';g.beginPath();g.arc(c.x*W,c.y*H,tg*MJB_BAND*H,0,6.283);g.stroke()}
    g.restore();
    if(c.r>=tg&&!s.easy){g.fillStyle='#5dff8a';g.font=`bold ${H*.05}px Georgia,serif`;g.textAlign='center';g.fillText('Lâche !',c.x*W,c.y*H-tg*H*MJB_BAND-H*.02)}
  }
  // effets
  for(const f of s.fx){
    const k=f.t/.6;g.save();g.globalAlpha=1-k;
    if(f.k==='boom'){for(let i=0;i<14;i++){const a=i*.45,d=f.r*H*(1+k*2);g.fillStyle='#fff';g.beginPath();g.arc(f.x*W+Math.cos(a)*d,f.y*H+Math.sin(a)*d,H*.02*(1-k*.5),0,6.283);g.fill()}}
    else if(f.k==='fond'){g.fillStyle='#cfe0ff';g.beginPath();g.ellipse(f.x*W,f.y*H+f.r*H*.8,f.r*H*(1+k),f.r*H*.25,0,0,6.283);g.fill()}
    else{g.strokeStyle='#fff';g.lineWidth=4;g.beginPath();g.ellipse(f.x*W,f.y*H,f.r*H*(1+k*.5),f.r*H*.3*(1+k),0,0,6.283);g.stroke()}
    g.restore();
  }
  // consigne
  if(s.stack.length<3&&!s.cur&&s.t<12){g.save();g.globalAlpha=.6+.4*Math.sin(tm*4);g.fillStyle='#fff';g.font=`bold ${H*.05}px Georgia,serif`;g.textAlign='center';g.strokeStyle='#1a2a60';g.lineWidth=5;
    const m=`Boule ${s.stack.length+1}/3 : glisse ton doigt dans la neige`;g.strokeText(m,W*.3,H*.5);g.fillText(m,W*.3,H*.5);g.restore()}
  else if(s.stack.length===3&&s.acc.some(a=>!a.placed)&&s.t<999){g.save();g.fillStyle='#fff';g.font=`bold ${H*.045}px Georgia,serif`;g.textAlign='center';g.strokeStyle='#1a2a60';g.lineWidth=5;
    g.strokeText('Touche les accessoires !',W*.3,H*.72);g.fillText('Touche les accessoires !',W*.3,H*.72);g.restore()}
}
function mjbHud(g,s,W,H,me,tm){
  const p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.fillText(p.av,26*u,46*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  const n=s.stack.length,m=s.acc.filter(a=>a.placed).length;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,86*u,230*u,44*u,22*u);g.fill();
  g.fillStyle='#fff';g.font=`bold ${24*u}px Georgia,serif`;g.fillText(`⛄ ${n}/3 · 🎩 ${m}/4`,28*u,109*u);
}
function mjBonhomme(me){
  if(PLAYERS[me].name==='Alix')return mjBonhommeAlix(me);
  return mjRunner(me,{
    nouveau:mjbNew,maj:mjbUpdate,dessin:mjbDraw,hud:mjbHud,
    tap:(s,fx,fy)=>mjbTap(s,fx,fy),drag:(s,fx,fy)=>mjbMove(s,fx,fy),up:s=>mjbUp(s),
    evenement:(e,s,fx,cv)=>{
      if(e.k==='pose'){AE.pops&&AE.pops(4,.6)}
      else if(e.k==='acc'){AE.bells&&AE.bells();AE.pops&&AE.pops(2,.5)}
      else if(e.k==='eclate'){AE.boom&&AE.boom();cv.style.transform='translate('+(Math.random()*14-7)+'px,'+(Math.random()*8-4)+'px)'}
      else if(e.k==='fondu'){AE.nope&&AE.nope()}
    },
    intro:['Construis ton bonhomme de neige !','Glisse le doigt pour rouler 3 boules, lâche-les au cercle vert,','puis touche les accessoires pour l\'habiller !']
  });
}

/* ---- Version d'Alix (v3.29) : sans chrono, tout est facile ----
   1) 3 grosses boules à glisser sur le bonhomme (zones en pointillés).
   2) Un TAS d'objets apparaît (planche B10) : Alix prend ce qu'il veut, dans l'ordre qu'il veut, et le dépose près du bonhomme :
      l'objet se range tout seul au bon endroit (un simple toucher suffit aussi). Le bonhomme finit toujours par SOURIRE. */
const MJBA_Z=['boule_bas','boule_milieu','boule_tete','branche','moufle','bouton','noeud','echarpe','carotte','charbon','chapeau','bonnet'];
const MJBA_IMG={boule_bas:'B10_boule_bas',boule_milieu:'B10_boule_milieu',boule_tete:'B10_boule_tete',chapeau:'B10_haut_de_forme',bonnet:'B10_bonnet',carotte:'B10_carotte',charbon:'B10_charbon',echarpe:'B10_echarpe',branche:'B10_branche',moufle:'B10_moufle',bouton:'B10_bouton',noeud:'B10_noeud'};
const MJBA_ASP={boule_bas:235/219,boule_milieu:202/196,boule_tete:1.01,chapeau:245/183,bonnet:232/160,carotte:194/84,charbon:163/143,echarpe:198/196,branche:224/171,moufle:156/192,bouton:1,noeud:203/114}; // largeur/hauteur
function mjbaSlots(hat){
  const G=mjbGeo(),[b1,b2,b3]=G,S=[];
  const add=(kind,x,y,w,flip)=>S.push({kind,x,y,w,flip:!!flip,placed:false,t:9});
  add('boule_bas',b1.x,b1.y,b1.r*2);add('boule_milieu',b2.x,b2.y,b2.r*2);add('boule_tete',b3.x,b3.y,b3.r*2);
  for(const sg of[-1,1])add('charbon',b3.x+sg*b3.r*.38,b3.y-b3.r*.28,b3.r*.36);                       // yeux
  for(let j=-2;j<=2;j++)add('charbon',b3.x+j*b3.r*.22,b3.y+b3.r*(.5-.04*(2-Math.abs(j))*0)+ (Math.abs(j)===2?-b3.r*.1:Math.abs(j)===1?-b3.r*.03:b3.r*.04),b3.r*.25); // bouche : sourire (les coins remontent)
  add('carotte',b3.x+b3.r*.62,b3.y+b3.r*.12,b3.r*1.3);
  {const w=b3.r*2.3,h=w/MJBA_ASP.chapeau;if(hat==='chapeau')add('chapeau',b3.x,b3.y-b3.r*.78-h/2,w);else{const w2=b3.r*2.2,h2=w2/MJBA_ASP.bonnet;add('bonnet',b3.x,b3.y-b3.r*.55-h2/2+h2*.1,w2)}}
  add('echarpe',b3.x,b3.y+b3.r*1.12,b3.r*2.3);
  add('noeud',b1.x,b1.y-b1.r*.5,b1.r*.5);
  for(let j=0;j<3;j++)add('bouton',b2.x,b2.y+(.2+j*.35)*b2.r,b2.r*.3);
  add('branche',b2.x+b2.r*1.45,b2.y-b2.r*.45,b2.r*1.5);add('branche',b2.x-b2.r*1.45,b2.y-b2.r*.45,b2.r*1.5,true);
  add('moufle',b2.x+b2.r*2.2,b2.y-b2.r*1.1,b2.r*.5);add('moufle',b2.x-b2.r*2.2,b2.y-b2.r*1.1,b2.r*.5);
  return S;
}
function mjbaNew(){
  const hat=Math.random()<.5?'chapeau':'bonnet',slots=mjbaSlots(hat),items=[];
  // 3 boules posées au sol à gauche ; les autres objets forment un tas (positions mélangées mais fixes)
  const bx=[.09,.26,.41];
  ['boule_bas','boule_milieu','boule_tete'].forEach((k,i)=>items.push({kind:k,hx:bx[i],hy:.82,rot:0,placed:false,ball:true,n:i}));
  const autres=slots.filter(x=>!x.kind.startsWith('boule')).map(x=>x.kind);
  for(let i=autres.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[autres[i],autres[j]]=[autres[j],autres[i]]}
  autres.forEach((k,i)=>{const c=i%6,r=Math.floor(i/6);items.push({kind:k,hx:.08+c*.075+(r%2)*.035+(Math.random()-.5)*.02,hy:.70+r*.075+(Math.random()-.5)*.03,rot:(Math.random()-.5)*.8,placed:false,ball:false,n:3+i})});
  return{D:99999,t:0,done:null,ev:[],easy:true,notimer:true,asp:2,slots,items,held:null,fx:[],deco:[],need:items.length,got:0,t2:-1};
}
const mjbaP2=s=>s.t2>=0;
function mjbaPos(s,it,H){ // position d'affichage d'un objet du tas (avec chute d'arrivée)
  let dy=0;if(!it.ball&&mjbaP2(s)){const k=Math.max(0,Math.min(1,(s.t-s.t2-(it.n-3)*.04)/.5));dy=-(1-k*k*(3-2*k))*.9;if(k<=0)dy=-2}
  return{x:it.hx,y:it.hy+dy}
}
function mjbaTap(s,fx,fy){
  if(s.done||s.held)return;
  for(let i=s.items.length-1;i>=0;i--){
    const it=s.items[i];if(it.placed)continue;
    if(!it.ball&&!mjbaP2(s))continue;
    const p=mjbaPos(s,it,1);if(p.y<0)continue;
    const R=it.ball?(it.kind==='boule_bas'?.12:it.kind==='boule_milieu'?.1:.08):.085;
    if(Math.hypot((fx-p.x)*s.asp,fy-p.y)<R){s.held={it,x:fx,y:fy,x0:fx,y0:fy,t:0,moved:0};s.ev.push({k:'prend'});return}
  }
}
function mjbaMove(s,fx,fy){const h=s.held;if(!h||s.done)return;h.x=fx;h.y=fy;h.moved=Math.max(h.moved,Math.hypot((fx-h.x0)*s.asp,fy-h.y0))}
function mjbaUp(s){
  const h=s.held;if(!h)return;s.held=null;
  const it=h.it,libres=s.slots.filter(x=>!x.placed&&x.kind===it.kind);
  let slot=null,x=null,y=null;
  if(it.ball){ // les 3 boules s'empilent toujours au bon endroit
    if(libres.length){
      if(h.moved<.03)slot=libres[0];
      else{let bd=1e9;for(const sl of libres){const d=Math.hypot((h.x-sl.x)*s.asp,h.y-sl.y);if(d<bd){bd=d;slot=sl}}if(bd>.4)slot=null}
    }
  }else{
    const px=h.x,py=h.y-.04;
    if(h.moved<.03&&libres.length)slot=libres[0];                  // un simple toucher : l'objet va à sa place habituelle
    else if(h.moved>=.03&&!(px<.52&&py>.6)&&py<.97&&py>.05){       // sinon il reste EXACTEMENT où on le lâche (sauf sur le tas)
      let bd=.07;for(const sl of libres){const d=Math.hypot((px-sl.x)*s.asp,py-sl.y);if(d<bd){bd=d;slot=sl}}   // léger aimant près d'une place habituelle
      if(!slot){x=px;y=py}
    }
  }
  if(slot){slot.placed=true;x=slot.x;y=slot.y}
  if(x!=null){
    const ref=s.slots.find(q=>q.kind===it.kind);
    s.deco.push({kind:it.kind,x,y,w:slot?ref.w:Math.max(ref.w,.065),flip:slot?slot.flip:(it.kind==='branche'&&x<MJB_X),t:0});
    it.placed=true;s.got++;s.fx.push({x,y,w:ref.w,t:0});s.ev.push({k:'pose'});
    if(s.t2<0&&s.items.filter(q=>q.ball&&q.placed).length===3){s.t2=s.t+.7;s.ev.push({k:'tas'})}
  }else s.ev.push({k:'rate'});
}
function mjbaUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;if(s.held)s.held.t+=dt;
  for(const d of s.deco)d.t+=dt;
  for(const f of s.fx)f.t+=dt;s.fx=s.fx.filter(f=>f.t<.6);
  if(s.got>=s.need&&s.fx.length===0)s.done='win';
}
function mjbaImg(g,kind,cx,cy,wpx,flip,rot,alpha){
  const im=MJ.img[MJBA_IMG[kind]],h=wpx/MJBA_ASP[kind];
  g.save();if(alpha!=null)g.globalAlpha=alpha;g.translate(cx,cy);if(rot)g.rotate(rot);if(flip)g.scale(-1,1);
  if(im&&im.naturalWidth)g.drawImage(im,-wpx/2,-h/2,wpx,h);else{g.fillStyle='#ddd';g.beginPath();g.arc(0,0,wpx/2,0,6.283);g.fill()}
  g.restore();
}
function mjbaBox(kind,H,ball){const a=MJBA_ASP[kind],b=ball?(kind==='boule_bas'?.2:kind==='boule_milieu'?.16:.12):.14;return(a>=1?b:b*a)*H}
function mjbaDraw(g,s,W,H,tm){
  s.asp=W/H;
  g.drawImage(mjlFond(W,H,true),0,0);
  g.fillStyle='rgba(30,45,90,.3)';g.beginPath();g.ellipse(MJB_X*W,MJB_GY*H+H*.01,MJB_TGT[0]*H*1.1,H*.03,0,0,6.283);g.fill();
  const held=s.held?s.held.it.kind:null;
  // zones en pointillés : les 3 boules au début, puis les places de l'objet qu'on tient
  for(const sl of s.slots){
    if(sl.placed)continue;
    const bal=sl.kind.startsWith('boule'),on=sl.kind===held;
    if(!(on||(bal&&!mjbaP2(s))))continue;
    const pul=on?.55+.25*Math.sin(tm*9):.3;
    if(on)mjbaImg(g,sl.kind,sl.x*W,sl.y*H,sl.w*H,sl.flip,0,pul);
    g.save();g.setLineDash([9,8]);g.lineWidth=on?5:3;g.strokeStyle=on?'#ffe066':'rgba(255,255,255,.75)';g.beginPath();g.arc(sl.x*W,sl.y*H,Math.max(H*.024,sl.w*H*.5*(bal?1:.62)),0,6.283);g.stroke();g.restore();
  }
  // pièces posées : boules d'abord, puis le sourire, puis les objets (dans l'ordre d'empilement des types)
  const dessiner=d=>{const k=Math.min(1,d.t/.3),pop=1+Math.sin(k*3.14)*.18;mjbaImg(g,d.kind,d.x*W,d.y*H,d.w*H*pop,d.flip)};
  const tri=s.deco.slice().sort((a,b)=>MJBA_Z.indexOf(a.kind)-MJBA_Z.indexOf(b.kind));
  for(const d of tri)if(d.kind.startsWith('boule'))dessiner(d);
  const tete=s.deco.find(d=>d.kind==='boule_tete');
  if(tete){const r=tete.w*H/2,cx=tete.x*W,cy=tete.y*H;g.save();g.strokeStyle='#1b1d24';g.lineWidth=Math.max(3,r*.08);g.lineCap='round';g.beginPath();g.arc(cx,cy+r*.02,r*.55,.2*Math.PI,.8*Math.PI);g.stroke();g.restore()}
  for(const d of tri)if(!d.kind.startsWith('boule'))dessiner(d);
  // tas de neige où se trouvent les objets
  if(mjbaP2(s)){
    const gr=g.createRadialGradient(W*.27,H*.84,10,W*.27,H*.84,W*.3);gr.addColorStop(0,'rgba(255,255,255,.95)');gr.addColorStop(.7,'rgba(220,232,255,.9)');gr.addColorStop(1,'rgba(200,215,245,0)');
    g.fillStyle=gr;g.beginPath();g.ellipse(W*.27,H*.85,W*.27,H*.19,0,0,6.283);g.fill();
  }
  // objets au repos (boules, puis tas)
  for(const it of s.items){
    if(it.placed||(s.held&&s.held.it===it))continue;
    if(!it.ball&&!mjbaP2(s))continue;
    const p=mjbaPos(s,it,H);if(p.y<-1)continue;
    const bob=it.ball?Math.sin(tm*3+it.n)*H*.008:0;
    if(it.ball){g.fillStyle='rgba(25,40,90,.25)';g.beginPath();g.ellipse(p.x*W,p.y*H+mjbaBox(it.kind,H,true)*.46,mjbaBox(it.kind,H,true)*.42,H*.012,0,0,6.283);g.fill()}
    mjbaImg(g,it.kind,p.x*W,p.y*H+bob,mjbaBox(it.kind,H,it.ball),false,it.rot);
  }
  // objet tenu : il grossit jusqu'à sa taille sur le bonhomme
  if(s.held){
    const h=s.held,sl=s.slots.find(x=>!x.placed&&x.kind===h.it.kind),tw=sl?sl.w*H:H*.14,k=Math.min(1,h.t/.2),w=mjbaBox(h.it.kind,H,h.it.ball)+(tw-mjbaBox(h.it.kind,H,h.it.ball))*k;
    g.fillStyle='rgba(25,40,90,.25)';g.beginPath();g.ellipse(h.x*W+6,h.y*H+w/MJBA_ASP[h.it.kind]*.5+8,w*.4,H*.015,0,0,6.283);g.fill();
    mjbaImg(g,h.it.kind,h.x*W,h.y*H-H*.04,w,false);
  }
  for(const f of s.fx){const k=f.t/.6;g.save();g.globalAlpha=1-k;g.strokeStyle='#fff6b0';g.lineWidth=4;g.beginPath();g.arc(f.x*W,f.y*H,H*.03+f.w*H*.5*k*1.4,0,6.283);g.stroke();
    g.fillStyle='#ffe066';for(let i=0;i<6;i++){const a=i*1.047+k,d=H*.04+f.w*H*.5*k*1.6;g.beginPath();g.arc(f.x*W+Math.cos(a)*d,f.y*H+Math.sin(a)*d,H*.01*(1-k),0,6.283);g.fill()}g.restore()}
  // consigne
  let msg=null;
  if(!mjbaP2(s))msg='Mets les 3 boules sur le bonhomme';
  else if(s.got<=3+1&&!s.held)msg='Mets les objets où tu veux !';
  if(msg){g.save();g.globalAlpha=.7+.3*Math.sin(tm*4);g.fillStyle='#fff';g.strokeStyle='#1a2a60';g.lineWidth=5;g.font=`bold ${H*.05}px Georgia,serif`;g.textAlign='center';
    g.strokeText(msg,W*.3,H*.55);g.fillText(msg,W*.3,H*.55);g.restore()}
}
function mjbaHud(g,s,W,H,me,tm){
  const p=PLAYERS[me],u=H/720,pr=s.got/s.need;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';g.fillText(p.av,26*u,46*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,86*u,230*u,34*u,17*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,20*u,92*u,Math.max(16*u,218*u*pr),22*u,11*u);g.fill();
}
function mjBonhommeAlix(me){
  return mjRunner(me,{
    nouveau:mjbaNew,maj:mjbaUpdate,dessin:mjbaDraw,hud:mjbaHud,
    tap:(s,fx,fy)=>mjbaTap(s,fx,fy),drag:(s,fx,fy)=>mjbaMove(s,fx,fy),up:s=>mjbaUp(s),
    evenement:(e,s,fx,cv)=>{
      if(e.k==='pose'){AE.pops&&AE.pops(4,.6);AE.bells&&s.got%6===0&&AE.bells()}
      else if(e.k==='tas'){AE.bells&&AE.bells()}
      else if(e.k==='prend'){AE.pops&&AE.pops(1,.3)}
      else if(e.k==='rate'){AE.nope&&AE.nope()}
    },
    intro:['Construis ton bonhomme !','Pose les 3 boules, puis prends les objets du tas','et mets-les où tu veux sur le bonhomme !']
  });
}
