/* ---- Mini-jeu : LE GRAND SAUT (v3.67) ----
   Comme le dinosaure de Chrome quand il n'y a pas de connexion : le Père Noël court sur place, des obstacles défilent
   vers lui, UN toucher (n'importe où) = UN saut. Le décor défile (panorama B24–B29 + sol de neige).
   Planche B37 = poses du Père Noël (s_c1..s_c4 course, s_decol, s_monte, s_sommet, s_descend, s_recep, s_touche, s_victoire).
   Planche B38 = obstacles (voiture, bouche d'incendie, ballon qui roule, boule de neige qui roule, cône, boîte aux lettres,
   tonneau, cadeaux, luge, caisse, bonhomme de neige, congère).
   Règles : 45 s pour tout le monde, 6 cœurs ; un choc = -1 cœur, le Père Noël est renversé puis protégé 1,6 s ; gagné si on tient 45 s.
   Adultes : vitesse 520 → 1500 px/s (accélération croissante, p^1,7), obstacles seuls ou en petits groupes (un seul saut les passe s'il est bien placé), ballon et boule qui roulent
   plus vite que le sol. Alix : vitesse lente 360 → 500, obstacles bas seulement, un à la fois, bien espacés.
   Unités : H = 720 px, vitesses en px/s, y = hauteur des pieds au-dessus du sol (px). */
const MJS_D=45,MJS_RX=.22,MJS_GY=.82;
// [clé, hauteur à l'écran (part de H), largeur/hauteur, roule ? (vitesse en plus), part de la largeur qui touche]
const MJS_OBS={
  // planche B41
  voiture:['B41_voiture_verte',.140,1.645,0,.80],bouche:['B41_bouche',.130,.616,0,.70],ballon:['B41_ballon',.100,.970,.22,.85],buches:['B41_buches',.120,1.489,0,.85],
  cone:['B41_cone',.120,.793,0,.65],lettres:['B41_boite_lettres',.170,.779,0,.50],tonneau:['B41_tonneau',.140,.803,0,.75],pot:['B41_pot',.110,.791,0,.70],
  taxi:['B41_taxi',.140,1.775,0,.80],luge2:['B41_luge_enfant',.120,1.005,0,.75],pelle:['B41_tas_pelle',.110,1.651,0,.85],
  // planche B43
  traineauchien:['B43_traineau_chien',.100,1.623,0,.85],machine:['B43_machine_laver',.170,1.197,0,.80],cabine:['B43_cabine',.200,.954,0,.80],flamant:['B43_flamant',.170,.702,0,.45],
  piano:['B43_piano',.170,1.116,0,.85],scooter:['B43_scooter',.140,1.359,0,.75],frigo:['B43_frigo',.190,1.144,0,.80],parasol:['B43_parasol',.170,.722,0,.50],
  canne:['B43_canne_peche',.170,1.098,0,.45],bidon:['B43_bidon',.150,.873,0,.70],tracteur:['B43_tracteur_pedales',.130,1.489,0,.80],lit:['B43_lit',.130,1.378,0,.85],
  // planche B44
  pingouin:['B44_pingouin',.160,.838,0,.60],peinture:['B44_pot_peinture',.100,1.359,0,.85],seau:['B44_seau',.120,.967,0,.75],robot:['B44_robot',.065,1.446,0,.90],
  tondeuse:['B44_tondeuse',.140,1.264,0,.80],fauteuil:['B44_fauteuil',.170,.758,0,.65],coffre:['B44_coffre',.130,1.248,0,.80],valise:['B44_valise',.130,1.170,0,.80],
  tv:['B44_tv',.150,1.315,0,.80],bonhommet:['B44_bonhomme_tombe',.090,1.688,0,.85],palmes:['B44_palmes',.150,1.272,0,.70],bouee:['B44_bouee',.150,1.458,0,.80],
  // soucoupe (B42) puis extra-terrestre (B41), une seule fois chacun
  ufo:['B42_soucoupe',.200,1.78,0,.72],alien:['B41_alien',.185,.642,0,.55]
};
const MJS_Z=1.15;Object.keys(MJS_OBS).forEach(k=>{MJS_OBS[k][1]*=MJS_Z});   // tout est un peu plus gros : lisible de loin sur la télé
const MJS_SPECIAUX=['ufo','alien'];
const MJS_ADULTES=Object.keys(MJS_OBS).filter(k=>!MJS_SPECIAUX.includes(k)).concat(['ballon']);
const MJS_ALIX=['bouche','ballon','cone','tonneau','pot','pelle','buches','peinture','seau','robot','bonhommet','traineauchien','tracteur','valise','coffre','luge2'];
function mjsNew(easy){
  // saut : sommet ≈ .30 H (.32 pour Alix), durée en l'air ≈ .75 s (.95 pour Alix)
  const H=720,apex=H*(easy?.35:.33),T=easy?.95:.75;
  const s={D:MJS_D,t:0,done:null,ev:[],easy,W:1080,H,d:0,v:easy?360:520,y:0,vy:0,air:false,G:8*apex/(T*T),V0:4*apex/T,
    obs:[],nxt:0,lives:6,max:6,inv:0,coup:0,slow:0,buf:0,rec:0,tAnim:0,hits:0,lastLand:0,passed:0,fx:[],lastF:-1,sp:0,tU:12+Math.random()*8};
  mjsSpawn(s);return s;
}
function mjsVit(s){const p=Math.min(1,s.t/s.D);return s.easy?360+140*p:520+1400*Math.pow(p,2.2)}
// largeur (px) d'une zone de ciel libre au-dessus d'une hauteur donnée : le Père Noël y reste hy..sommet pendant tw secondes
function mjsFenetre(s,hy){const q=s.V0*s.V0-2*s.G*hy;return q<=0?0:2*Math.sqrt(q)/s.G}
function mjsHW(k,H){const d=MJS_OBS[k];return d[1]*H*d[2]*.5}    // demi-largeur de l'image
function mjsMake(s,k,x){
  const d=MJS_OBS[k],H=s.H,hp=d[1]*H,o={k,key:d[0],x,hp,w:hp*d[2],ex:s.easy?d[3]*.45:d[3],hw:hp*d[2]*.5*d[4],ht:hp*.86,rot:0,hit:false,ht0:0,pass:false};
  return o;
}
function mjsSpawn(s){
  while(s.d>=s.nxt){
    if(s.t>s.D-3.5){s.nxt=s.d+1e9;break}
    const H=s.H,v=mjsVit(s),p=Math.min(1,s.t/s.D),x0=Math.max(1800,v*1.5);   // toujours hors de l'écran, quelle que soit sa largeur
    
    const spe=(s.sp===0&&s.t>=s.tU)?'ufo':(s.sp===1?'alien':null);if(spe)s.sp++;   // soucoupe, puis extra-terrestre : une seule fois
    let ks=spe?[spe]:[s.easy?MJS_ALIX[Math.floor(Math.random()*MJS_ALIX.length)]:MJS_ADULTES[Math.floor(Math.random()*MJS_ADULTES.length)]];
    // petit groupe (adultes) : deux obstacles côte à côte que UN saut bien placé passe
    if(!spe&&!s.easy&&MJS_OBS[ks[0]][3]===0&&s.t>6&&Math.random()<.06+.3*p){
      const k2=MJS_ADULTES[Math.floor(Math.random()*MJS_ADULTES.length)];
      if(MJS_OBS[k2][3]===0){
        const a=MJS_OBS[ks[0]],b=MJS_OBS[k2],gap=30+Math.random()*30,span=a[1]*H*a[2]+gap+b[1]*H*b[2],hmax=Math.max(a[1],b[1])*H*.86+10;   // (a[1] déjà multiplié par MJS_Z)
        const tw=mjsFenetre(s,hmax),maxS=tw*v*1.08-52*MJS_Z-.1*v*1.08;
        if(span<=maxS)ks=[ks[0],k2];
      }
    }
    let x=x0,span=0;
    ks.forEach((k,i)=>{const o=mjsMake(s,k,0);if(i>0)x+=30+Math.random()*30;o.x=x+o.w/2;s.obs.push(o);x+=o.w;span=x-x0});
    // espace avant le prochain groupe : en secondes de jeu, il rétrécit un peu avec le temps
    const g0=s.easy?1.7+Math.random()*1.0:(.95-.2*p)+Math.random()*(.8-.3*p);
    s.nxt=s.d+span+g0*v;
  }
}
function mjsPuff(s,n,k){for(let i=0;i<n;i++)s.fx.push({x:0,y:0,vx:-(s.v*.35+Math.random()*90)*k,vy:-(30+Math.random()*90)*k,t:0,life:.35+Math.random()*.35,r:5+Math.random()*7})}
function mjsJump(s){
  if(s.done||s.coup>0)return false;
  if(s.air){s.buf=.14;return false}              // saut mémorisé : il part à l'atterrissage si on a touché juste avant
  s.vy=s.V0;s.air=true;s.rec=0;s.tAir=0;s.ev.push({k:'saut'});return true;
}
function mjsUpdate(s,dt){
  if(s.done)return;
  s.t+=dt;s.tAnim+=dt;s.inv=Math.max(0,s.inv-dt);s.coup=Math.max(0,s.coup-dt);s.rec=Math.max(0,s.rec-dt);s.buf=Math.max(0,s.buf-dt);
  s.slow=Math.max(0,s.slow-dt);
  let v=mjsVit(s);if(s.slow>0)v*=.62+.38*(1-s.slow/1.3);
  s.v=v;s.d+=v*dt;
  // poussière de neige soulevée par les pieds (donne la sensation de courir)
  if(!s.air&&s.coup<=0){const f=Math.floor(s.tAnim*(9+9*Math.min(1,Math.max(0,(s.v-360)/1560))));if(f!==s.lastF){s.lastF=f;if(f%2===0)mjsPuff(s,3,.6)}}
  for(const p of s.fx){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt}
  s.fx=s.fx.filter(p=>p.t<p.life);
  // physique du saut
  if(s.air){
    s.tAir+=dt;s.vy-=s.G*dt;s.y+=s.vy*dt;
    if(s.y<=0){s.y=0;s.vy=0;s.air=false;s.rec=.14;s.ev.push({k:'pose'});mjsPuff(s,7,1.1);if(s.buf>0){s.buf=0;mjsJump(s)}}
  }
  // obstacles
  const rx=s.W*MJS_RX,hw=26*MJS_Z;
  for(const o of s.obs){
    if(o.hit){o.ht0+=dt;continue}
    const dx=v*(1+o.ex)*dt;o.x-=dx;if(o.ex>0)o.rot-=dx/(o.hp/2);
    if(!o.pass&&o.x+o.w/2<rx-hw){o.pass=true;s.passed++}
    if(s.inv<=0&&Math.abs(o.x-rx)<o.hw+hw&&s.y<o.ht){
      o.hit=true;o.ht0=0;s.lives--;s.hits++;s.inv=1.6;s.coup=.55;s.slow=1.3;s.ev.push({k:'touche'});
      if(s.lives<=0){s.done='lose';return}
    }
  }
  s.obs=s.obs.filter(o=>o.hit?o.ht0<1:o.x>-o.w);
  mjsSpawn(s);
  if(s.t>=s.D){s.done='win';s.air=false;s.y=0}
}
function mjsPano(){return typeof mjrPano==='function'?mjrPano():null}
function mjsPose(s){
  if(s.done==='win')return'B40_sommet';
  if(s.coup>0||s.done==='lose')return'B40_recep';
  if(s.air){const f=s.vy/s.V0;return f>.75?'B40_decol':f>.3?'B40_monte':f>-.3?'B40_sommet':'B40_descend'}
  if(s.rec>0)return'B40_recep';
  const cad=9+9*Math.min(1,Math.max(0,(s.v-360)/1560));return'B39_c'+(1+Math.floor(s.tAnim*cad)%4);
}
function mjsDraw(g,s,W,H,tm){
  s.W=W;s.H=H;const u=H/720,gy=MJS_GY*H,rx=W*MJS_RX,im=MJ.img;
  // paysage lointain : défile lentement sur la durée
  const pano=mjsPano();
  if(pano){const L=pano.width,bx=Math.max(0,Math.min(L-W,s.d*.12));g.drawImage(pano,bx,0,Math.min(W,L),720,0,0,W,H)}
  else{g.fillStyle='#0b1a4a';g.fillRect(0,0,W,H)}
  // sol : neige tassée, avec petites bosses qui défilent à la vitesse du jeu
  const gr=g.createLinearGradient(0,gy-H*.06,0,H);gr.addColorStop(0,'rgba(215,228,250,0)');gr.addColorStop(.2,'rgba(224,235,253,.97)');gr.addColorStop(1,'rgba(184,201,232,1)');
  g.fillStyle=gr;g.fillRect(0,gy-H*.06,W,H-gy+H*.06);
  g.fillStyle='rgba(140,160,205,.4)';g.fillRect(0,gy+H*.004,W,H*.004);
  const off=s.d;
  // petits sapins et buissons enneigés derrière la ligne du sol (défilent à mi-vitesse)
  {const per=W+500;for(let i=0;i<9;i++){
    const xx=(((i*(per/9)+(i*97)%60-off*.5)%per)+per)%per-150,sz=H*(.07+((i*37)%5)*.012),by=gy-H*.004;
    if(i%3===0){g.fillStyle='rgba(235,243,255,.95)';g.beginPath();g.ellipse(xx,by,sz*.55,sz*.28,0,Math.PI,0);g.fill();g.fillStyle='rgba(160,180,220,.55)';g.fillRect(xx-sz*.55,by-1,sz*1.1,H*.006)}
    else{for(let k=0;k<3;k++){const w=sz*(.6-.14*k),y0=by-sz*.42*k;g.fillStyle=k%2?'#1f4a46':'#256057';g.beginPath();g.moveTo(xx-w/2,y0);g.lineTo(xx,y0-sz*.5);g.lineTo(xx+w/2,y0);g.fill();g.fillStyle='rgba(240,247,255,.9)';g.beginPath();g.moveTo(xx-w*.26,y0-sz*.3);g.lineTo(xx,y0-sz*.5);g.lineTo(xx+w*.26,y0-sz*.3);g.lineTo(xx,y0-sz*.24);g.fill()}
      g.fillStyle='#5b3d28';g.fillRect(xx-sz*.04,by-sz*.02,sz*.08,sz*.07)}
  }}
  // traits de vitesse sur le sol : plus ils sont proches du bas de l'écran, plus ils filent vite (perspective)
  for(let i=0;i<26;i++){
    const dep=((i*0.6180339)%1),fy=gy+H*(.012+dep*(1-MJS_GY-.03)),sp=.8+dep*1.7,per=W+700,len=H*(.05+dep*.16);
    const xx=(((i*331.7-off*sp)%per)+per)%per-200;
    g.fillStyle='rgba(255,255,255,'+(.35+dep*.4)+')';g.fillRect(xx,fy,len,H*(.003+dep*.007));
    g.fillStyle='rgba(110,130,185,'+(.14+dep*.12)+')';g.fillRect(xx+len*.1,fy+H*(.006+dep*.007),len*.8,H*.003);
  }
  // obstacles
  for(const o of s.obs){
    const i=im[o.key];if(!i||!i.naturalWidth)continue;
    if(o.hit){
      const t=o.ht0,x=o.x+t*H*.9,y=gy-(t*H*.8-t*t*H*1.5);
      g.save();g.globalAlpha=Math.max(0,1-t);g.translate(x,y-o.hp/2);g.rotate(t*9);g.drawImage(i,-o.w/2,-o.hp/2,o.w,o.hp);g.restore();continue;
    }
    if(o.x<-o.w||o.x>W+o.w)continue;
    g.fillStyle='rgba(20,30,80,.22)';g.beginPath();g.ellipse(o.x,gy+H*.006,o.w*.46,H*.011,0,0,6.283);g.fill();
    if(o.ex>0){g.save();g.translate(o.x,gy-o.hp/2+H*.004);g.rotate(o.rot);g.drawImage(i,-o.w/2,-o.hp/2,o.w,o.hp);g.restore()}
    else g.drawImage(i,o.x-o.w/2,gy-o.hp+H*.004,o.w,o.hp);
  }
  for(const p of s.fx){const k=1-p.t/p.life;g.fillStyle='rgba(255,255,255,'+(.8*k)+')';g.beginPath();g.arc(rx-H*.03+p.x,gy+H*.004+p.y,p.r*(1.4-.6*k)*(H/720),0,6.283);g.fill()}
  // le Père Noël
  const key=mjsPose(s),p=im[key];
  if(p&&p.naturalWidth){
    const k=H*.27*MJS_Z/340,w=p.naturalWidth*k,h=p.naturalHeight*k,by=gy+H*.008-s.y;
    g.fillStyle='rgba(20,30,80,'+(.28*(1-Math.min(1,s.y/(H*.35))*.6))+')';g.beginPath();g.ellipse(rx,gy+H*.008,H*.085*(1-Math.min(1,s.y/(H*.4))*.4),H*.012,0,0,6.283);g.fill();
    g.save();if(s.inv>0&&s.coup<=0)g.globalAlpha=.45+.55*Math.abs(Math.sin(tm*18));if(s.coup>0){g.translate(rx-w*.1,by);g.rotate(-.35*Math.min(1,(.55-s.coup)*6+.3));g.drawImage(p,-w/2,-h,w,h)}else g.drawImage(p,rx-w/2,by-h,w,h);g.restore();
  }
}
function mjsHud(g,s,W,H,me,tm){
  const im=MJ.img,p=PLAYERS[me],u=H/720;
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,14*u,14*u,230*u,62*u,31*u);g.fill();
  g.font=`${40*u}px sans-serif`;g.textBaseline='middle';g.textAlign='left';g.fillStyle='#fff';avDraw(g,p,24*u,46*u,40*u);
  g.font=`bold ${30*u}px Georgia,serif`;g.fillText(p.name,80*u,47*u);
  const hs=36*u;for(let i=0;i<s.max;i++){const img=im[i<s.lives?'B11_coeur_plein':'B11_coeur_vide'];if(img&&img.naturalWidth)g.drawImage(img,256*u+i*(hs+4*u),20*u,hs,hs*img.naturalHeight/img.naturalWidth)}
  const bx=W*.58,bw=W*.28,by=26*u,pr=Math.min(1,s.t/s.D);
  g.fillStyle='rgba(8,14,46,.65)';rrect(g,bx,by,bw,22*u,11*u);g.fill();
  g.fillStyle='#ffd24a';rrect(g,bx+3*u,by+3*u,Math.max(16*u,(bw-6*u)*pr),16*u,8*u);g.fill();
  const r=im.B39_c1;if(r&&r.naturalWidth){const h=40*u,x=bx+(bw-6*u)*pr;g.drawImage(r,x-12*u,by-14*u,h*r.naturalWidth/r.naturalHeight,h)}
}
function mjSaut(me){
  const alix=PLAYERS[me].name==='Alix';
  return mjRunner(me,{
    nouveau:mjsNew,maj:mjsUpdate,dessin:mjsDraw,hud:mjsHud,
    tap:s=>mjsJump(s),clavier:(s,k)=>{if(k===' '||k==='ArrowUp'||k==='w'||k==='W'||k==='z'||k==='Z')mjsJump(s)},
    evenement:(e,s,fx,cv)=>{
      if(e.k==='saut'){AE.pops&&AE.pops(1,.2)}
      else if(e.k==='touche'){AE.nope&&AE.nope();AE.boom&&AE.boom();cv.style.transform='translate('+(Math.random()*14-7)+'px,'+(Math.random()*8-4)+'px)'}
    },
    intro:alix?['Le grand saut !','TAPOTE l\'écran pour sauter !','Saute par-dessus les obstacles. Tiens 45 secondes !']
      :['Le grand saut !','Un TOUCHER = un saut. Saute au bon moment !','De plus en plus vite ! Tiens 45 secondes !']
  });
}
