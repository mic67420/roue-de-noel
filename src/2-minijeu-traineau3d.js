/* ====== Course de traîneau en VRAIE 3D (v3.51) ======
   Caméra derrière et au-dessus du traîneau. Unités = pixels à la profondeur du traîneau (f=1).
   X = vers la droite, Y = hauteur, D = distance devant le traîneau. Projection : f=c/(c+D). */
const MJ3_LZ=4.6;                       // D (en hauteurs d'écran) parcouru par une unité de z du jeu
function mj3Cam(s,W,H){
  const hy=H*.30,yG=hy+(H-hy)*MJ_ZS,c=H*.9,RH=W*.42*MJ_ZS,Lz=MJ3_LZ*H,camX=s.x*RH*.5,t0=s.dist;
  const amp=t=>Math.max(0,Math.min(1,(t-.35)/.9));
  const bend=t=>amp(t)*(Math.sin(t*1.7)*.8+Math.sin(t*3.9+1.3)*.32)*RH*.95;     // virage de la piste (px)
  const hill=t=>amp(t)*(Math.sin(t*2.3)+.6*Math.sin(t*5.1+.7))*H*.03;             // bosses (px)
  const b0=bend(t0),h0=hill(t0);
  const C={W,H,hy,yG,camH:yG-hy,c,RH,Lz,camX,s,bend,hill,b0,h0};
  C.off=D=>bend(t0+D/Lz)-b0;C.hg=D=>hill(t0+D/Lz)-h0;
  C.P=(X,Y,D)=>{const f=c/(c+D);return[W/2+(X-camX+C.off(D))*f,hy+(C.camH-Y-C.hg(D))*f,f]};
  return C;
}
const MJ3_L=[-.38,.7,-.6];
function mj3Col(c,lum){const a=(1-lum)*.22,r=c[0]*lum*(1-a)+40*a,g=c[1]*lum*(1-a)+60*a,b=c[2]*lum*(1-a)+130*a;return'rgb('+(r|0)+','+(g|0)+','+(b|0)+')'}
/* maillage : faces {v:[[X,Y,D]…], c:[r,g,b], ctr:[X,Y,D]} ; face de dos cachée, tri du plus loin au plus proche */
function mj3Mesh(g,C,faces,ctr,noLine){
  const out=[];
  for(const F of faces){
    const v=F.v,a=v[0],b=v[1],d=v[2];
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],wx=d[0]-a[0],wy=d[1]-a[1],wz=d[2]-a[2];
    let nx=uy*wz-uz*wy,ny=uz*wx-ux*wz,nz=ux*wy-uy*wx;const ln=Math.hypot(nx,ny,nz)||1;nx/=ln;ny/=ln;nz/=ln;
    let cx=0,cy=0,cz=0;for(const p of v){cx+=p[0];cy+=p[1];cz+=p[2]}cx/=v.length;cy/=v.length;cz/=v.length;
    const o=F.ctr||ctr;if(nx*(cx-o[0])+ny*(cy-o[1])+nz*(cz-o[2])<0){nx=-nx;ny=-ny;nz=-nz}
    if(nx*(C.camX-cx)+ny*(C.camH-cy)+nz*(-C.c-cz)<=0)continue;
    out.push({F,n:[nx,ny,nz],d:cz});
  }
  out.sort((p,q)=>q.d-p.d);
  g.lineJoin='round';
  for(const o of out){
    const pts=o.F.v.map(p=>C.P(p[0],p[1],p[2]));if(pts.some(p=>p[2]>3||p[2]<0))continue;
    const lum=.50+.50*Math.max(0,o.n[0]*MJ3_L[0]+o.n[1]*MJ3_L[1]+o.n[2]*MJ3_L[2]);
    g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();
    g.fillStyle=mj3Col(o.F.c,o.F.lit?1:lum);g.fill();
    if(!noLine){g.lineWidth=Math.max(1,1.6*pts[0][2]*C.H/720);g.strokeStyle='rgba(18,22,52,.55)';g.stroke()}
  }
}
function mj3Box(x0,x1,y0,y1,d0,d1,c){
  const q=(a,b,e,f)=>({v:[a,b,e,f],c});
  const A=[x0,y0,d0],B=[x1,y0,d0],Cc=[x1,y1,d0],Dd=[x0,y1,d0],E=[x0,y0,d1],F=[x1,y0,d1],G=[x1,y1,d1],Hh=[x0,y1,d1],ctr=[(x0+x1)/2,(y0+y1)/2,(d0+d1)/2];
  return[q(A,B,Cc,Dd),q(E,F,G,Hh),q(A,E,Hh,Dd),q(B,F,G,Cc),q(A,B,F,E),q(Dd,Cc,G,Hh)].map(f=>(f.ctr=ctr,f));
}
function mj3Sph(g,C,X,Y,D,r,col,rot){      // sphère ombrée
  const p=C.P(X,Y,D),R=r*p[2];if(R<.5)return;
  const gr=g.createRadialGradient(p[0]-R*.35,p[1]-R*.4,R*.08,p[0],p[1],R);
  gr.addColorStop(0,mj3Col([Math.min(255,col[0]*1.45+40),Math.min(255,col[1]*1.45+40),Math.min(255,col[2]*1.45+40)],1));
  gr.addColorStop(.6,mj3Col(col,.92));gr.addColorStop(1,mj3Col(col,.5));
  g.fillStyle=gr;g.beginPath();g.arc(p[0],p[1],R,0,6.283);g.fill();
  g.lineWidth=Math.max(1,R*.05);g.strokeStyle='rgba(18,22,52,.45)';g.stroke();
}
function mj3Shadow(g,C,X,D,rx,rd,a){        // ombre portée au sol
  const p=C.P(X,0,D),q1=C.P(X,0,D-rd),q2=C.P(X,0,D+rd),ry=Math.abs(q1[1]-q2[1])/2;
  g.fillStyle='rgba(55,80,150,'+(.3*(a==null?1:a))+')';g.beginPath();g.ellipse(p[0]+rx*p[2]*.1,p[1],rx*p[2],Math.max(2,ry),0,0,6.283);g.fill();
}
function mj3Ell(C,X,Y,D,rx,rd){const p=C.P(X,Y,D),a=C.P(X,Y,D-rd),b=C.P(X,Y,D+rd);return{x:p[0],y:p[1],rx:rx*p[2],ry:Math.max(1,Math.abs(a[1]-b[1])/2),f:p[2]}}
/* ---- objets ---- */
function mj3Sapin(g,C,X,D,h,R){             // sapin : trois étages de cônes enneigés
  const tiers=[[.10,.52,1],[.30,.76,.78],[.52,1,.56]];
  const p0=C.P(X,0,D),tw=R*.16*p0[2];
  g.fillStyle=mj3Col([90,60,38],.8);g.fillRect(p0[0]-tw,p0[1]-h*.14*p0[2],tw*2,h*.14*p0[2]+1);
  for(const[tb,tt,rk] of tiers){
    const r=R*rk,e=mj3Ell(C,X,h*tb,D,r,r),A=C.P(X,h*tt,D);
    const gr=g.createLinearGradient(e.x-e.rx,0,e.x+e.rx,0);gr.addColorStop(0,mj3Col([54,128,86],1));gr.addColorStop(.5,mj3Col([34,92,64],1));gr.addColorStop(1,mj3Col([16,44,42],1));
    g.fillStyle=gr;g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(e.x-e.rx,e.y);g.ellipse(e.x,e.y,e.rx,e.ry,0,Math.PI,0,true);g.closePath();g.fill();
    g.lineWidth=Math.max(1,1.4*e.f);g.strokeStyle='rgba(12,22,40,.6)';g.stroke();
    // neige : calotte et liseré au bord de l'étage
    const k=.5,sx=(e.x-A[0])*k,sy=(e.y-A[1])*k;
    g.fillStyle='rgba(240,246,255,.96)';g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(A[0]-Math.abs(e.rx)*k,A[1]+sy);g.quadraticCurveTo(A[0]-e.rx*k*.3,A[1]+sy*1.35,A[0],A[1]+sy*.95);g.quadraticCurveTo(A[0]+e.rx*k*.3,A[1]+sy*1.45,A[0]+e.rx*k,A[1]+sy);g.closePath();g.fill();
    g.strokeStyle='rgba(235,243,255,.9)';g.lineWidth=Math.max(1.5,3*e.f);g.beginPath();g.ellipse(e.x,e.y,e.rx*.98,e.ry*.98,0,.15,Math.PI-.15);g.stroke();
  }
}
function mj3Rocher(g,C,X,D,w,h,sd){
  const N=8,rg=i=>.85+.3*Math.abs(Math.sin(sd*91+i*7.3)),ring=(r,y,ph)=>{const a=[];for(let i=0;i<N;i++){const t=i/N*6.283+ph,q=r*rg(i+y);a.push([X+Math.cos(t)*q,y,D+Math.sin(t)*q*.85])}return a};
  const b=ring(w,0,.2),m=ring(w*1.08,h*.42,.5),u=ring(w*.62,h*.82,.1),top=[X+w*.1,h,D];
  const faces=[],col=(y,i)=>y>1?[238,244,252]:[118+i%3*10,128+i%2*10,156+i%3*8];
  for(let i=0;i<N;i++){const j=(i+1)%N;
    faces.push({v:[b[i],b[j],m[j],m[i]],c:col(0,i)});
    faces.push({v:[m[i],m[j],u[j],u[i]],c:i%3===0?[228,236,248]:col(0,i+1)});
    faces.push({v:[u[i],u[j],top],c:[240,246,255]});
  }
  mj3Mesh(g,C,faces,[X,h*.4,D]);
}
function mj3Tronc(g,C,X,D,L,r){            // tronc couché en travers de la piste
  const N=10,faces=[],cs=[];
  for(let i=0;i<N;i++){const t=i/N*6.283;cs.push([Math.cos(t)*r,r+Math.sin(t)*r])}
  for(let i=0;i<N;i++){const j=(i+1)%N,a=cs[i],b=cs[j],top=a[1]+b[1]>2.6*r;
    faces.push({v:[[X-L,a[1],D+a[0]],[X+L,a[1],D+a[0]],[X+L,b[1],D+b[0]],[X-L,b[1],D+b[0]]],c:top?[236,243,252]:[96+i%2*14,66+i%2*8,42]});}
  for(const sd of[-1,1])faces.push({v:cs.map(p=>[X+sd*L,p[1],D+p[0]]),c:[200,160,108]});
  mj3Mesh(g,C,faces,[X,r,D]);
  // cernes sur le bout visible
  const sd=C.camX+C.off(D)>X?1:-1,e=mj3Ell(C,X+sd*L,r,D,0,0),p=C.P(X+sd*L,r,D),q=C.P(X+sd*L,r,D-r),q2=C.P(X+sd*L,r,D+r);
  g.strokeStyle='rgba(110,70,38,.7)';g.lineWidth=Math.max(1,1.5*p[2]);
  for(const k of[.35,.65]){g.beginPath();g.ellipse(p[0],p[1],Math.max(1,r*p[2]*.45*k*.5),Math.abs(q[1]-q2[1])/2*k,0,0,6.283);g.stroke()}
}
function mj3Souche(g,C,X,D,h,r){
  const N=10,faces=[],cs=[];for(let i=0;i<N;i++){const t=i/N*6.283;cs.push([Math.cos(t)*r*(.92+.12*Math.sin(i*2.3)),Math.sin(t)*r*(.92+.12*Math.sin(i*2.3))])}
  for(let i=0;i<N;i++){const j=(i+1)%N;faces.push({v:[[X+cs[i][0],0,D+cs[i][1]],[X+cs[j][0],0,D+cs[j][1]],[X+cs[j][0],h,D+cs[j][1]],[X+cs[i][0],h,D+cs[i][1]]],c:[100+i%2*14,68+i%2*8,44]})}
  faces.push({v:cs.map(p=>[X+p[0],h,D+p[1]]),c:[206,166,112]});
  mj3Mesh(g,C,faces,[X,h/2,D]);
  const e=mj3Ell(C,X,h,D,r,r);g.strokeStyle='rgba(120,78,44,.75)';g.lineWidth=Math.max(1,1.6*e.f);
  for(const k of[.75,.5,.25]){g.beginPath();g.ellipse(e.x,e.y,e.rx*k,e.ry*k,0,0,6.283);g.stroke()}
  g.fillStyle='rgba(240,246,255,.95)';g.beginPath();g.ellipse(e.x+e.rx*.25,e.y-e.ry*.35,e.rx*.5,e.ry*.38,0,0,6.283);g.fill();
}
function mj3Bonhomme(g,C,X,D,h){
  const r1=.26*h,r2=.19*h,r3=.14*h,y1=r1,y2=y1+.78*(r1+r2),y3=y2+.78*(r2+r3),W=[236,242,252];
  mj3Sph(g,C,X,y1,D,r1,W);mj3Sph(g,C,X,y2,D,r2,W);mj3Sph(g,C,X,y3,D,r3,W);
  const pt=(dx,dy,Y,r,D0)=>{const z=Math.sqrt(Math.max(0,r*r-dx*dx-dy*dy));return C.P(X+dx,Y+dy,D0-z)};
  // boutons, yeux, nez
  g.fillStyle='#23283c';for(const dy of[-.3,0,.3]){const p=pt(0,dy*r2,y2,r2,D),R=Math.max(1.5,r2*.1*p[2]);g.beginPath();g.arc(p[0],p[1],R,0,6.283);g.fill()}
  for(const dx of[-.35,.35]){const p=pt(dx*r3,r3*.25,y3,r3,D),R=Math.max(1.5,r3*.1*p[2]);g.beginPath();g.arc(p[0],p[1],R,0,6.283);g.fill()}
  const n0=pt(0,0,y3,r3,D),n1=C.P(X,y3,D-r3*1.9);g.fillStyle='#e8731f';g.beginPath();g.moveTo(n0[0]-r3*.14*n0[2],n0[1]);g.lineTo(n0[0]+r3*.14*n0[2],n0[1]);g.lineTo(n1[0],n1[1]+r3*.05*n1[2]);g.closePath();g.fill();
  // écharpe
  const sc=[];for(let i=0;i<=12;i++){const t=Math.PI*i/12;sc.push(C.P(X-Math.cos(t)*r3*1.02,y2+r2*.62+Math.sin(t)*0,D-Math.sin(t)*r3*.9))}
  g.strokeStyle='#c8202c';g.lineWidth=Math.max(2,r3*.5*sc[6][2]);g.lineCap='round';g.beginPath();sc.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();g.lineCap='butt';
  // chapeau haut-de-forme
  const hb=y3+r3*.82,hh=r3*1.25,e0=mj3Ell(C,X,hb,D,r3*1.25,r3*1.25),e1=mj3Ell(C,X,hb+hh,D,r3*.8,r3*.8);
  g.fillStyle='#1c1f33';g.beginPath();g.ellipse(e0.x,e0.y,e0.rx,e0.ry,0,0,6.283);g.fill();
  g.beginPath();g.moveTo(e0.x-e1.rx,e0.y);g.lineTo(e1.x-e1.rx,e1.y);g.lineTo(e1.x+e1.rx,e1.y);g.lineTo(e0.x+e1.rx,e0.y);g.ellipse(e0.x,e0.y,e1.rx,e1.ry*(e0.ry/Math.max(1,e1.ry)),0,0,Math.PI);g.closePath();g.fill();
  g.fillStyle='#37406a';g.beginPath();g.ellipse(e1.x,e1.y,e1.rx,e1.ry,0,0,6.283);g.fill();
  g.fillStyle='#b8202c';g.fillRect(e0.x-e1.rx,e0.y-hh*.35*e0.f,e1.rx*2,hh*.22*e0.f);
}
function mj3Cadeau(g,C,X,Y,D,a,sd,tm){        // cadeau en volume qui tourne
  const pal=[[200,34,44],[32,128,70],[46,92,190],[150,50,150]],c=pal[Math.floor(sd*4)%4],S=48,gold=[236,190,70];
  const rot=(p)=>{const x=p[0],d=p[2],ca=Math.cos(a),sa=Math.sin(a);return[X+x*ca+d*sa,Y+p[1],D-x*sa+d*ca]};
  const mk=(x0,x1,y0,y1,d0,d1,col)=>mj3Box(x0,x1,y0,y1,d0,d1,col).map(f=>({v:f.v.map(rot),c:f.c,ctr:rot(f.ctr)}));
  mj3Mesh(g,C,mk(-S,S,0,S*1.5,-S,S,c),[X,Y+S*.75,D]);
  mj3Mesh(g,C,mk(-S*.1,S*.1,-1,S*1.5+3,-S-2,S+2,gold).concat(mk(-S-2,S+2,-1,S*1.5+3,-S*.1,S*.1,gold)),[X,Y+S*.75,D],true);
  const bx=rot([0,S*1.5+S*.2,0]);for(const sx of[-1,1]){const p=C.P(...rot([sx*S*.32,S*1.5+S*.2,0]));g.fillStyle=mj3Col(gold,.95);g.beginPath();g.ellipse(p[0],p[1],S*.3*p[2],S*.2*p[2],sx*.5,0,6.283);g.fill();g.strokeStyle='rgba(120,80,10,.6)';g.lineWidth=Math.max(1,p[2]*1.5);g.stroke()}
  mj3Sph(g,C,bx[0],bx[1],bx[2],S*.13,gold);
}
function mj3Etoile(g,C,X,Y,D,a,tm){
  const R=62,T=15,pts=[];for(let i=0;i<10;i++){const r=i%2?R*.46:R,t=-Math.PI/2+i*Math.PI/5;pts.push([Math.cos(t)*r,Math.sin(t)*r])}
  const rot=p=>{const ca=Math.cos(a),sa=Math.sin(a);return[X+p[0]*ca+p[2]*sa,Y+R+p[1]*-1,D-p[0]*sa+p[2]*ca]};
  const faces=[{v:pts.map(p=>rot([p[0],p[1],-T])),c:[255,222,90],lit:1,ctr:rot([0,0,0])},{v:pts.map(p=>rot([p[0],p[1],T])),c:[255,206,64],lit:1,ctr:rot([0,0,0])}];
  for(let i=0;i<10;i++){const j=(i+1)%10,p=pts[i],q=pts[j];faces.push({v:[rot([p[0],p[1],-T]),rot([q[0],q[1],-T]),rot([q[0],q[1],T]),rot([p[0],p[1],T])],c:[214,150,28],ctr:rot([p[0]*.2+q[0]*.2,p[1]*.2+q[1]*.2,0])})}
  const c0=C.P(X,Y+R,D),gl=g.createRadialGradient(c0[0],c0[1],0,c0[0],c0[1],R*2.1*c0[2]);gl.addColorStop(0,'rgba(255,230,120,.5)');gl.addColorStop(1,'rgba(255,230,120,0)');
  g.fillStyle=gl;g.beginPath();g.arc(c0[0],c0[1],R*2.1*c0[2],0,6.283);g.fill();
    mj3Mesh(g,C,faces,[X,Y+R,D]);
}
/* arche de Noël (décor) : poteaux en cannes à sucre, poutre, guirlandes qui clignotent */
function mj3Arche(g,C,D,tm){
  const H=C.H,X0=1.3*C.RH,Hh=H*.55,w=H*.03,faces=[],seg=H*.045;
  for(const sd of[-1,1])for(let k=0;k*seg<Hh;k++)faces.push(...mj3Box(sd*X0-w,sd*X0+w,k*seg,(k+1)*seg,D-w,D+w,k%2?[245,245,250]:[206,34,46]));
  for(let k=0;k*seg*1.5<2*X0+2*w;k++){const x0=-X0-w+k*seg*1.5;faces.push(...mj3Box(x0,Math.min(X0+w,x0+seg*1.5),Hh,Hh+w*2,D-w,D+w,k%2?[245,245,250]:[206,34,46]))}
  mj3Mesh(g,C,faces,[0,Hh/2,D]);
  // guirlande
  const N=22,pts=[];for(let i=0;i<=N;i++){const u=i/N;pts.push(C.P(-X0+2*X0*u,Hh-H*.07*4*u*(1-u)*1.6,D-w*1.2))}
  g.strokeStyle='#14502e';g.lineWidth=Math.max(2,4*pts[0][2]);g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke();
  const cols=['#ff3b3b','#ffd23b','#4bd6ff','#6bff7a','#ff7bd5'];
  pts.forEach((p,i)=>{const on=(Math.floor(tm*3)+i)%3!==0,R=Math.max(2,6*p[2]);if(on){g.globalAlpha=.3;g.fillStyle=cols[i%5];g.beginPath();g.arc(p[0],p[1],R*2.4,0,6.283);g.fill();g.globalAlpha=1}g.fillStyle=cols[i%5];g.beginPath();g.arc(p[0],p[1]+R,R,0,6.283);g.fill()});
}
/* ---- le traîneau ---- */
function mj3Traineau(g,C,s,tm){
  const k=C.H/720*1.3,yaw=Math.max(-.25,Math.min(.25,s.vel*.06)),roll=Math.max(-.09,Math.min(.09,-s.vel*.03)),X=s.x*C.RH;
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(roll),sr=Math.sin(roll),bob=Math.sin(tm*14)*1.6*k;
  const T=p=>{const x=p[0]*k,y=p[1]*k,d=p[2]*k;const x1=x*cy+d*sy,d1=-x*sy+d*cy;return[X+x1*cr-y*sr,bob+x1*sr+y*cr,d1]};
  const M=(x0,x1,y0,y1,d0,d1,c)=>mj3Box(x0,x1,y0,y1,d0,d1,c).map(f=>({v:f.v.map(T),c:f.c,ctr:T(f.ctr)}));
  const RED=[218,40,50],GOLD=[232,188,72],MET=[214,200,150];
  // ombre
  mj3Shadow(g,C,X,0,86*k,84*k,1);
  // dessous et corps (tout ce qui est plus loin que le dossier arrière)
  const body=[];
  for(const sd of[-1,1]){
    body.push(...M(sd*46-4,sd*46+4,0,9,-84,34,MET),...M(sd*46-4,sd*46+4,5,22,34,62,MET),...M(sd*46-4,sd*46+4,15,44,62,86,MET),...M(sd*46-3,sd*46+3,9,26,-50,-42,MET),...M(sd*46-3,sd*46+3,9,26,22,30,MET));
    body.push(...M(sd*56-6,sd*56+6,24,84,-70,72,RED),...M(sd*56-7,sd*56+7,82,90,-72,74,GOLD));
  }
  body.push(...M(-56,56,22,34,-70,72,[150,22,32]),...M(-56,56,24,112,68,80,RED),...M(-58,58,108,118,66,82,GOLD));
  mj3Mesh(g,C,body,T([0,40,0]));
  // Père Noël (de dos) et son sac
  const sp=(x,y,d,r,c)=>{const p=T([x,y,d]);mj3Sph(g,C,p[0],p[1],p[2],r*k,c)};
  sp(0,104,14,42,[214,36,46]);
  sp(0,174,20,27,[240,236,230]);
  sp(-25,166,12,12,[246,244,240]);sp(25,166,12,12,[246,244,240]);
  // bonnet
  const hb=T([0,192,20]),ht=T([12,244,12]);{const e=mj3Ell(C,hb[0],hb[1],hb[2],27*k,27*k),A=C.P(ht[0],ht[1],ht[2]);
    g.fillStyle=mj3Col([198,28,40],.95);g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(e.x-e.rx,e.y);g.ellipse(e.x,e.y,e.rx,e.ry,0,Math.PI,0,true);g.closePath();g.fill();g.lineWidth=Math.max(1,1.5);g.strokeStyle='rgba(18,22,52,.5)';g.stroke();
    g.strokeStyle='#f4f4f8';g.lineWidth=Math.max(3,9*e.f*k);g.beginPath();g.ellipse(e.x,e.y,e.rx,e.ry,0,.1,Math.PI-.1);g.stroke();}
  sp(14,246,8,10,[250,250,252]);
  sp(-4,80,-30,46,[158,108,64]);       // sac
  sp(18,124,-30,16,[146,98,58]);sp(18,134,-30,7,[222,190,70]);
  // dossier arrière + liseré doré, devant tout le reste
  const rear=[...M(-56,56,24,86,-84,-72,RED),...M(-58,58,84,94,-86,-70,GOLD),...M(-56,56,40,50,-88,-84,GOLD)];
  mj3Mesh(g,C,rear,T([0,60,-78]));
}
/* ---- le décor et l'ensemble ---- */
function mjDraw(g,s,W,H,tm){
  const C=mj3Cam(s,W,H),hy=C.hy,c=C.c,RH=C.RH,Lz=C.Lz,im=MJ.img,P=C.P,dt=Math.min(.05,Math.max(0,tm-(MJ.lastTm||tm)));MJ.lastTm=tm;
  // ciel, collines, brume, neige : mis en cache
  if(!MJ.bg3||MJ.bg3.width!==W||MJ.bg3.height!==H){
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const k=cv.getContext('2d');
    let gr=k.createLinearGradient(0,0,0,hy);gr.addColorStop(0,'#050a28');gr.addColorStop(.7,'#1e3674');gr.addColorStop(1,'#3d5fa3');
    k.fillStyle=gr;k.fillRect(0,0,W,hy+2);k.fillStyle='#fff';
    for(let i=0;i<70;i++){k.globalAlpha=.4+.5*((i*37)%10)/10;k.beginPath();k.arc(i*173.7%W,i*97.3%(hy*.8),i%3?1.2:2,0,6.283);k.fill()}
    k.globalAlpha=1;
    const colline=(col,amp,fr,ph,base)=>{k.fillStyle=col;k.beginPath();k.moveTo(0,hy+3);for(let x=0;x<=W;x+=8){const y=hy-base-amp*(.55+.45*Math.sin(x/W*fr+ph))-amp*.35*Math.sin(x/W*fr*2.7+ph*2);k.lineTo(x,y)}k.lineTo(W,hy+3);k.fill()};
    colline('#4a6bad',H*.075,9,1.2,H*.01);colline('#6784c0',H*.05,14,3.1,0);
    // forêt de sapins au loin
    for(let i=0;i<46;i++){const x=(i*W/46+((i*53)%17)),h=H*(.02+.03*((i*37)%10)/10),b=hy+2;k.fillStyle=i%2?'#1c3a5c':'#244a6e';k.beginPath();k.moveTo(x,b-h);k.lineTo(x+h*.32,b);k.lineTo(x-h*.32,b);k.fill()}
    gr=k.createLinearGradient(0,hy-H*.07,0,hy+H*.07);gr.addColorStop(0,'rgba(190,210,245,0)');gr.addColorStop(.55,'rgba(205,222,250,.72)');gr.addColorStop(1,'rgba(205,222,250,0)');
    k.fillStyle=gr;k.fillRect(0,hy-H*.07,W,H*.14);
    gr=k.createLinearGradient(0,hy,0,H);gr.addColorStop(0,'#a9bde3');gr.addColorStop(.25,'#cddcf5');gr.addColorStop(.6,'#eaf1fc');gr.addColorStop(1,'#ffffff');
    k.fillStyle=gr;k.fillRect(0,hy+2,W,H-hy);
    MJ.bg3=cv;
  }
  g.drawImage(MJ.bg3,0,0);
  // piste en tranches (virages et bosses), congères sur les bords
  const M=46,f0=1.3,f1=.07,sl=[];
  for(let j=0;j<=M;j++){const f=f0+(f1-f0)*j/M,D=c*(1/f-1),o=C.off(D),h=C.hg(D),y=hy+(C.camH-h)*f;sl.push({f,D,o,y,t:s.dist+D/Lz,hh:h})}
  const X=(sl_,x,Y)=>W/2+(x-C.camX+sl_.o)*sl_.f;
  const quad=(a,b,xa0,xa1,ya,xb0,xb1,yb)=>{g.beginPath();g.moveTo(X(a,xa0),a.y-ya*a.f);g.lineTo(X(a,xa1),a.y-ya*a.f);g.lineTo(X(b,xb1),b.y-yb*b.f);g.lineTo(X(b,xb0),b.y-yb*b.f);g.closePath();g.fill()};
  for(let j=0;j<M;j++){
    const a=sl[j],b=sl[j+1],tm_=(a.t+b.t)/2,v=Math.sin(6.283*10*tm_),fa=Math.min(1,a.f*3);
    g.fillStyle='rgba(255,255,255,.55)';quad(a,b,-1.12*RH,1.12*RH,0,-1.12*RH,1.12*RH,0);
    g.fillStyle=v>0?'rgba(255,255,255,'+(.08*v*fa)+')':'rgba(110,140,205,'+(-.08*v*fa)+')';quad(a,b,-1.12*RH,1.12*RH,0,-1.12*RH,1.12*RH,0);
    for(const sd of[-1,1]){
      const hb=H*.045*(.8+.2*Math.sin(tm_*14)),ha=hb*(.8+.2*Math.sin(a.t*14))/(.8+.2*Math.sin(tm_*14)),hb2=hb*(.8+.2*Math.sin(b.t*14))/(.8+.2*Math.sin(tm_*14));
      g.fillStyle='rgba(120,150,215,.85)';quad(a,b,sd*1.12*RH,sd*1.2*RH,ha,sd*1.12*RH,sd*1.2*RH,hb2);        // face intérieure (bleutée)
      g.fillStyle='rgba(250,252,255,.97)';quad(a,b,sd*1.2*RH,sd*1.75*RH,ha,sd*1.2*RH,sd*1.75*RH,hb2);        // dessus enneigé
      g.fillStyle='rgba(150,175,225,.22)';quad(a,b,sd*1.75*RH,sd*2.4*RH,ha*.4,sd*1.75*RH,sd*2.4*RH,hb2*.4);
    }
  }
  // traces des patins
  const tr=MJ.trail3||(MJ.trail3=[]);
  if(tr.length&&s.dist<tr[0].d)tr.length=0;
  if(!tr.length||s.dist-tr[tr.length-1].d>.02)tr.push({d:s.dist,x:s.x});
  while(tr.length&&s.dist-tr[0].d>.2)tr.shift();
  g.strokeStyle='rgba(100,130,195,.55)';g.lineCap='round';
  for(const off of[-46,46]){g.beginPath();let first=true;
    for(const t of tr){const D=-(s.dist-t.d)*Lz;if(D<-c*.55)continue;const p=P(t.x*RH+off,0,D);g.lineWidth=Math.max(1,3*p[2]);if(first){g.moveTo(p[0],p[1]);first=false}else g.lineTo(p[0],p[1])}g.stroke()}
  g.lineCap='butt';
  // objets triés du plus loin au plus proche
  const list=[],ZD=z=>(MJ_ZS-z)*Lz;
  const seed=o=>o.sd==null?(o.sd=Math.abs(Math.sin(o.wx*127.1+o.hf*311.7+o.z*3))):o.sd;
  s.sc.forEach(o=>list.push({D:ZD(o.z),o,sc:true}));
  s.obj.forEach(o=>list.push({D:ZD(o.z),o}));
  list.push({D:0,sleigh:true});
  list.sort((a,b)=>b.D-a.D);
  for(const it of list){
    if(it.sleigh){
      // poudreuse + traîneau
      const p=P(s.x*RH,0,0),sp=MJ.spray||(MJ.spray=[]);
      if(dt>0){const n=2+Math.min(3,Math.abs(s.vel)*2);for(let q=0;q<n;q++){const sd=Math.random()<.5?-1:1;sp.push({x:p[0]+sd*55*H/720,y:p[1]-4,vx:sd*(20+Math.random()*60)*H/720-s.vel*40*H/720,vy:(80+Math.random()*140)*H/720,r:(3+Math.random()*5)*H/720,l:0,L:.45+Math.random()*.3})}}
      for(const q of sp){q.l+=dt;q.x+=q.vx*dt;q.y+=q.vy*dt}
      MJ.spray=sp.filter(q=>q.l<q.L);
      if(!(s.inv>0&&Math.floor(tm*14)%2)){          // traîneau = dessin 2D (sprite) posé dans le décor 3D (le modèle 3D, mj3Traineau, est gardé mais non utilisé)
        const av=Math.abs(s.vel),n=Math.floor(tm*7)%2,lvl=av<.25?0:av<.8?1:av<1.4?2:3;
        // planche B35 : tout droit (t1,t4), léger (t2,t3 ; miroir pour la droite), virage à gauche (r1..r4), virage à droite (l1..l4)
        let k2,flip=false;
        if(lvl===0)k2=n?'B35_t1':'B35_t4';
        else if(lvl===1){k2=n?'B35_t2':'B35_t3';flip=s.vel>0}
        else{const side=s.vel<0?'r':'l',q=lvl===2?(n?1:2):(n?3:4);k2='B35_'+side+q}
        const i=im[k2];
        mj3Shadow(g,C,s.x*RH,0,80*H/720,60*H/720,1);
        if(i&&i.naturalWidth){const sc=H*.30/220,w=i.naturalWidth*sc,h=i.naturalHeight*sc,y=p[1]+Math.sin(tm*14)*H*.004;g.save();g.translate(p[0],y);if(flip)g.scale(-1,1);g.drawImage(i,-w/2,-h*.97,w,h);g.restore()}
      }
      for(const q of MJ.spray){const a=1-q.l/q.L;g.fillStyle='rgba(255,255,255,'+(.8*a)+')';g.beginPath();g.arc(q.x,q.y,q.r*(1+q.l*1.6),0,6.283);g.fill()}
      continue;
    }
    const o=it.o,D=it.D,f=c/(c+D);if(c+D<c*.38||f<.15)continue;
    const al=Math.max(0,Math.min(1,(f-.17)/.15))*Math.min(1,(1.75-f)/.35)*(o.hit?.5:1);if(al<=0)continue;
    const wx=o.wx*RH,Xs=wx,k=o.k;g.globalAlpha=al;
    if(k==='ARCHE'){mj3Arche(g,C,D,tm)}
    else if(k==='B1_sapin_grand'||k==='B1_sapin_petit'){const h=o.hf*MJ_ZS*H,R=(k==='B1_sapin_grand'?.30:.20)*RH*(it.sc?.9:1.05);mj3Shadow(g,C,Xs,D,R*1.1,R*.9);mj3Sapin(g,C,Xs,D,h,R)}
    else if(k==='B1_rocher'){const w=(o.hw||.26)*RH*1.05,h=o.hf*MJ_ZS*H;mj3Shadow(g,C,Xs,D,w*1.1,w);mj3Rocher(g,C,Xs,D,w,h,seed(o))}
    else if(k==='B1_souche'){const r=(o.hw||.2)*RH*.8,h=o.hf*MJ_ZS*H;mj3Shadow(g,C,Xs,D,r*1.1,r);mj3Souche(g,C,Xs,D,h,r)}
    else if(k==='B1_bonhomme'){const h=o.hf*MJ_ZS*H;mj3Shadow(g,C,Xs,D,h*.3,h*.25);mj3Bonhomme(g,C,Xs,D,h)}
    else if(k==='TRONC'){const L=(o.hw||.34)*RH,r=o.hf*MJ_ZS*H*.5;mj3Shadow(g,C,Xs,D,L*1.05,r*1.4);mj3Tronc(g,C,Xs,D,L,r)}
    else if(o.type==='cadeau'){const Y=26+Math.sin(tm*4+o.wx*7)*10;mj3Shadow(g,C,Xs,D,62,62,.7);mj3Cadeau(g,C,Xs,Y,D,tm*1.7+o.wx*5,seed(o),tm)}
    else if(o.type==='etoile'){const Y=60+Math.sin(tm*4+o.wx*7)*14;mj3Shadow(g,C,Xs,D,50,40,.6);mj3Etoile(g,C,Xs,Y,D,tm*2.2+o.wx*5,tm)}
    else{                                   // animaux : sprites debout dans le décor 3D
      const key=o.frames&&o.fps?o.frames[Math.floor(tm*o.fps)%o.frames.length]:k,i=im[key];
      if(i&&i.naturalWidth){const p=P(Xs,0,D),h=H*o.hf*MJ_ZS*p[2],w=h*i.naturalWidth/i.naturalHeight,lift=(o.hop?o.hop*Math.abs(Math.sin(tm*7+o.wx*3)):0)*H*p[2];
        mj3Shadow(g,C,Xs,D,w*.45/p[2],w*.18/p[2],Math.max(.35,1-lift/(H*.1)));
        if(o.vx<0){g.save();g.translate(p[0],0);g.scale(-1,1);g.drawImage(i,-w/2,p[1]-lift-h,w,h);g.restore()}else g.drawImage(i,p[0]-w/2,p[1]-lift-h,w,h)}
    }
    g.globalAlpha=1;
  }
  g.globalAlpha=1;
  // flocons qui filent vers la caméra
  g.strokeStyle='rgba(255,255,255,.7)';
  for(let i=0;i<34;i++){
    const ang=(i*2.399)%1,sd=ang<.5?-1:1,wxx=sd*(1.3+((i*.618)%1)*2.2)*RH,u=((i*.37)%1+s.dist*1.7)%1,D0=(1-u)*Lz*.7-c*.3,D1=D0-.1*Lz*.2,Y=H*(.05+.3*((i*.77)%1));
    if(c+D1<c*.45)continue;const a=P(wxx,Y,D0),b=P(wxx,Y,D1);g.globalAlpha=Math.min(1,a[2]*4)*.7;g.lineWidth=1+2*b[2];g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
  }
  g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.8)';
  for(let i=0;i<60;i++){const x=((i*131.7+Math.sin(tm*.8+i)*30)%W+W)%W,y=((i*83.1+tm*(60+i%5*18))%H),r=1+i%3;g.beginPath();g.arc(x,y,r,0,6.283);g.fill()}
}
