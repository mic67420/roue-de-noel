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
