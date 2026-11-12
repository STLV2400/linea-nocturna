// =====================================================================
//  ENEMIGOS — humanos reales (Microsoft Rocketbox, licencia MIT) convertidos en espectros
// =====================================================================
const RBK={novia:'r_novia',operadora:'r_operadora',nina:'r_nina',botones:'r_botones',quemado:'r_quemado'};
const ENEMIES=[], RB={};
const PX1='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkaGCoBwAD4AHAm7dRWQAAAABJRU5ErkJggg==';
function b64buf(s){const bin=atob(s), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer;}
function loadRB(key){return new Promise(res=>{const A=window.ASSETS&&ASSETS[key]; if(!A||!THREE.FBXLoader) return res(null);
  const man=new THREE.LoadingManager(); man.setURLModifier(u=>{const n=u.split(/[\\/]/).pop(); return A.tex[n]||A.tex[n.toLowerCase()]||PX1;});
  man.addHandler(/\.tga$/i,new THREE.TextureLoader(man)); let o=null, done=false; const fin=()=>{if(done) return; done=true; delete ASSETS[key]; res(o);};
  man.onLoad=fin; try{o=new THREE.FBXLoader(man).parse(b64buf(A.fbx),'');}catch(e){console.warn(key,e); return fin();} setTimeout(fin,8000);});}
function loadHumans(){return Promise.all(Object.entries(RBK).map(([k,key])=>loadRB(key).then(o=>{if(o) RB[k]=o;})));}
function bonesOf(o){const B={}; o.traverse(b=>{if(b.isBone) B[b.name.replace(/^Bip0\d_?/,'')]=b;}); return B;}
// ---------- texturas ----------
function texCanvas(t,max=1024){const im=t.image; const s=Math.min(1,max/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=im.width*s|0; c.height=im.height*s|0;
  const g=c.getContext('2d'); g.drawImage(im,0,0,c.width,c.height); return {c,g,w:c.width,h:c.height};}
function toTex(c,src){const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; if(src){t.flipY=src.flipY; t.wrapS=src.wrapS; t.wrapT=src.wrapT;} return t;}
function remap(g,w,h,fn){const d=g.getImageData(0,0,w,h), a=d.data; for(let i=0;i<a.length;i+=4) fn(a,i); g.putImageData(d,0,0);}
const isSkin=(r,g,b)=>r>80&&g>35&&b>20&&r>g&&r>b&&(r-g)>10&&(r-b)>18&&(Math.max(r,g,b)-Math.min(r,g,b))>18&&!(r>235&&g>225);
function veins(g,w,h,n,col){g.lineCap='round'; for(let i=0;i<n;i++){let x=rnd(0,w),y=rnd(0,h),a=rnd(0,6.28); g.strokeStyle=col; g.lineWidth=rnd(.5,1.4);
  g.beginPath(); g.moveTo(x,y); for(let k=0;k<rnd(6,16);k++){a+=rnd(-.6,.6); x+=Math.cos(a)*rnd(2,6); y+=Math.sin(a)*rnd(2,6); g.lineTo(x,y);} g.stroke();}}
// piel de cadáver / ropa sucia, según cada píxel sea piel o tela
function horrorPaint(map,{skin=[.8,.84,.82],skinLift=.35,cloth=null,hair=null,veinsN=60,bruise=12,dirt=30}={}){
  const cv=texCanvas(map), {g,w,h}=cv;
  remap(g,w,h,(a,i)=>{const r=a[i],G=a[i+1],b=a[i+2], L=(r*.3+G*.59+b*.11)/255;
    if(isSkin(r,G,b)){const l=(skinLift+(1-skinLift)*Math.pow(L,.9))*.82, n=1+rnd(-.04,.04); a[i]=Math.min(255,l*skin[0]*255*n); a[i+1]=Math.min(255,l*skin[1]*255*n); a[i+2]=Math.min(255,l*skin[2]*255*n); return;}
    if(hair&&L<.55&&!(b>r+10)){const k=hair(L); a[i]=k[0]; a[i+1]=k[1]; a[i+2]=k[2]; return;}
    if(cloth){const k=cloth(L,r,G,b); if(k){a[i]=k[0]; a[i+1]=k[1]; a[i+2]=k[2];}}});
  veins(g,w,h,veinsN,'rgba(70,45,95,.22)'); grime(g,w,h,bruise,.22,'70,30,70'); grime(g,w,h,dirt,.25,'45,38,25');
  return cv;}
function charPaint(map){const cv=texCanvas(map), {g,w,h}=cv;
  remap(g,w,h,(a,i)=>{const L=(a[i]*.3+a[i+1]*.59+a[i+2]*.11)/255, n=rnd(.7,1.3); a[i]=(16+L*42)*n; a[i+1]=(11+L*20)*n; a[i+2]=(9+L*12)*n;});
  const em=document.createElement('canvas'); em.width=w; em.height=h; const e=em.getContext('2d'); e.fillStyle='#000'; e.fillRect(0,0,w,h);
  for(const ctx of [g,e]){ctx.lineCap='round'; for(let i=0;i<55;i++){let x=rnd(0,w),y=rnd(0,h),a=rnd(0,6.28); ctx.strokeStyle=ctx===g?'rgba(95,24,6,.9)':`rgba(255,${rnd(70,130)|0},20,${rnd(.35,.9)})`; ctx.lineWidth=rnd(.6,1.8);
    ctx.beginPath(); ctx.moveTo(x,y); for(let k=0;k<rnd(5,14);k++){a+=rnd(-1,1); x+=Math.cos(a)*rnd(3,9); y+=Math.sin(a)*rnd(3,9); ctx.lineTo(x,y);} ctx.stroke();}}
  grime(g,w,h,40,.5,'0,0,0'); grime(g,w,h,15,.3,'110,20,10'); return {cv,em};}
// pinta en el atlas alrededor de un punto 3D (usa las UV de los vértices cercanos de un grupo de material)
function paintAt(m,matIndex,center,radius,painter,cv){const geo=m.geometry, pos=geo.attributes.position, uv=geo.attributes.uv; if(!uv) return; const v=new THREE.Vector3();
  const grp=geo.groups.find(gp=>gp.materialIndex===matIndex), idx=geo.index?geo.index.array:null; const seen=new Set();
  const visit=i=>{if(seen.has(i)) return; seen.add(i); v.fromBufferAttribute(pos,i).applyMatrix4(m.matrixWorld); const d=v.distanceTo(center); if(d<radius) painter(cv.g,uv.getX(i)*cv.w,(1-uv.getY(i))*cv.h,1-d/radius);};
  if(grp){for(let k=grp.start;k<grp.start+grp.count;k++) visit(idx?idx[k]:k);} else for(let i=0;i<pos.count;i++) visit(i);}
// localiza los ojos en la malla de la cabeza (los puntos más adelantados a cada lado, a la altura de los ojos)
function findEyes(m,headIdx){const geo=m.geometry, pos=geo.attributes.position, idx=geo.index?geo.index.array:null, grp=geo.groups.find(gp=>gp.materialIndex===headIdx); const P=[], v=new THREE.Vector3();
  if(grp){for(let k=grp.start;k<grp.start+grp.count;k+=3){v.fromBufferAttribute(pos,idx?idx[k]:k).applyMatrix4(m.matrixWorld); P.push(v.clone());}}
  const bb=new THREE.Box3().setFromPoints(P), top=bb.max.y, cx=(bb.min.x+bb.max.x)/2;
  const eyes=[-1,1].map(sd=>{let best=null; for(const p of P){const dx=(p.x-cx)*sd; if(dx<.022||dx>.048||p.y<top-.15||p.y>top-.08) continue; if(!best||p.z>best.z) best=p;} return best;});
  return {eyes,top,cx,front:bb.max.z,bb};}
// pelo largo, negro y mojado (puede dejar un ojo a la vista)
function longHair(center,len,frontLen,gapSide=0,q=new THREE.Quaternion()){const hair=[], fwd=V3(0,0,1).applyQuaternion(q); fwd.y=0; fwd.normalize();
  for(let i=0;i<900;i++){const front=i<330; let a,el;
    if(front){a=Math.PI/2+(i%2?1:-1)*rnd(0,1.15); el=rnd(.05,.85); if(gapSide&&Math.sign(Math.cos(a))===gapSide&&Math.random()<.75) a=Math.PI/2-gapSide*rnd(0,1.1);} else {a=rnd(0,Math.PI*2); el=rnd(.05,1.7);}
    if(!front&&Math.sin(a)>.35&&el>1.1) el=rnd(.05,1.0);
    const sx=Math.cos(a)*Math.sin(el)*.088, sz=Math.sin(a)*Math.sin(el)*.1, sy=Math.cos(el)*.105;
    const L=(front?frontLen:len)*rnd(.75,1.1);
    const p0=V3(sx,sy,sz).applyQuaternion(q), dir=V3(sx,sy*.3,sz).normalize().applyQuaternion(q);
    const p1=p0.clone().addScaledVector(dir,.03).add(V3(0,-.03,0)), p2=p0.clone().addScaledVector(dir,.045).add(V3(0,-.1,0));
    if(front){const k=Math.max(0,.11-p2.clone().dot(fwd)); p2.addScaledVector(fwd,k);}
    const p3=p2.clone().add(V3(rnd(-.015,.015),-L*.5,rnd(-.015,.015))), p4=p2.clone().add(V3(rnd(-.03,.03),-L,rnd(-.03,.03)));
    hair.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0,p1,p2,p3,p4]),16,rnd(.0009,.0021),3));}
    const m=new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(hair),new THREE.MeshStandardMaterial({color:0x060505,roughness:.32,metalness:.1}));
  m.castShadow=true; m.position.copy(center); return m;}
// falda larga de tela con el ruedo roto (cubre piernas y botas)
function longSkirt(top,rTop,rBot,col,blood,seed){const prof=[[rBot,0],[rBot*.92,top*.3],[rTop*1.25,top*.7],[rTop*1.05,top*.92],[rTop,top]];
  const geo=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),64); const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x); const k=1+Math.sin(a*11+y*5)*.04*(1.4-y/top)+Math.sin(a*27+seed)*.012;
    p.setXYZ(i,x*k,y<.001?y+Math.max(0,Math.sin(a*7+seed)*.07+Math.sin(a*17)*.04+rnd(0,.05)):y,z*k*.85);}
  geo.computeVertexNormals();
  const t=ctex(512,1024,(g,w,h)=>{g.fillStyle=col; g.fillRect(0,0,w,h); for(let i=0;i<80;i++){g.strokeStyle='rgba(0,0,0,.07)'; g.lineWidth=rnd(2,9); const x=rnd(0,w); g.beginPath(); g.moveTo(x,0); g.lineTo(x+rnd(-30,30),h); g.stroke();}
    const b=g.createLinearGradient(0,h*.5,0,h); b.addColorStop(0,'rgba(40,30,15,0)'); b.addColorStop(1,'rgba(35,28,15,.9)'); g.fillStyle=b; g.fillRect(0,0,w,h); grime(g,w,h,45,.35,'50,40,25');
    if(blood){bloodSplat(g,w*.45,h*.08,55,.9); bloodDrips(g,w*.45,h*.1,120,h*.5,.85); bloodSplat(g,w*.15,h*.45,30,.7); bloodSplat(g,w*.8,h*.6,26,.6);}});
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:t,roughness:.9,side:THREE.DoubleSide})); m.castShadow=m.receiveShadow=true; return m;}
function pose(B,spec){for(const k in spec){const b=B[k]; if(!b) continue; const [x,y,z]=spec[k]; b.rotation.x+=x||0; b.rotation.y+=y||0; b.rotation.z+=z||0;}}
function attachTo(bone,obj){S.add(obj); obj.updateMatrixWorld(true); bone.attach(obj); return obj;}
// poses: los brazos se orientan apuntando a una dirección del mundo (sirve con cualquier esqueleto); cabeza con giros locales (z asiente, y inclina, x gira)
const ARM_DOWN=(sd,f=.08)=>({[sd+'_UpperArm']:[sd+'_Forearm',[sd==='L'?.16:-.16,-1,f]],[sd+'_Forearm']:[sd+'_Hand',[sd==='L'?.06:-.06,-1,f+.08]]});
const POSES={
  novia:{aim:{...ARM_DOWN('L'),...ARM_DOWN('R',.15)},rot:{Head:[0,.42,.32],Neck:[0,.15,.12]}},
  nina:{aim:{...ARM_DOWN('L',.02),...ARM_DOWN('R',.02)},rot:{Head:[0,-.32,.42],Neck:[0,-.05,.12]}},
  operadora:{aim:{...ARM_DOWN('L'),...ARM_DOWN('R')},rot:{Head:[0,.95,.12],Neck:[0,.38,0],Spine2:[0,.06,0]}},
  botones:{aim:{...ARM_DOWN('L'),R_UpperArm:['R_Forearm',[-.18,-1,.12]],R_Forearm:['R_Hand',[-.05,-.45,1]]},rot:{Head:[0,-1.02,.18],Neck:[0,-.32,0],Spine1:[0,0,.05]}},
  quemado:{aim:{L_UpperArm:['L_Forearm',[.3,-.35,1]],L_Forearm:['L_Hand',[.12,-.15,1]],R_UpperArm:['R_Forearm',[-.3,-.3,1]],R_Forearm:['R_Hand',[-.1,-.1,1]]},rot:{Head:[0,.15,.45],Spine1:[0,0,.18],Spine2:[0,0,.1]}}};
function aimBone(B,name,child,dir){const b=B[name], c=B[child]; if(!b||!c) return; b.parent.updateWorldMatrix(true,false); b.updateMatrixWorld(true);
  const cur=c.getWorldPosition(V3()).sub(b.getWorldPosition(V3())).normalize(), d=new THREE.Quaternion().setFromUnitVectors(cur,V3(...dir).normalize());
  const wq=b.getWorldQuaternion(new THREE.Quaternion()), pq=b.parent.getWorldQuaternion(new THREE.Quaternion()).invert(); b.quaternion.copy(pq.multiply(d.multiply(wq))); b.updateMatrixWorld(true);}
function applyPose(B,P){if(!P) return; if(P.aim) for(const k in P.aim) aimBone(B,k,P.aim[k][0],P.aim[k][1]); if(P.rot) pose(B,P.rot);}
// =====================================================================
function makeEnemy(kind){
  const root=new THREE.Group(); root.userData.kind=kind; if(!RB[kind]) return root; const o=THREE.SkeletonUtils.clone(RB[kind]);
  o.scale.setScalar(.01); root.add(o); S.add(root); root.updateMatrixWorld(true);
  const B=bonesOf(o), E={kind,root,o,B,tw:{t:-9,next:rnd(1,4),ax:0,az:0}};
  let body=null; o.traverse(m=>{if(m.isMesh){m.castShadow=true; m.receiveShadow=true; m.frustumCulled=false; if(!body) body=m;}});
  const mats=[].concat(body.material).map(x=>new THREE.MeshStandardMaterial({map:x.map,normalMap:x.normalMap,alphaMap:x.alphaMap,alphaTest:x.alphaMap?.45:0,side:x.alphaMap?THREE.DoubleSide:THREE.FrontSide,roughness:.7,name:x.name}));
  const mi=re=>mats.findIndex(m=>re.test(m.name)), iB=mi(/_body/), iH=mi(/_head/), iO=mi(/_opacity/);
  body.material=mats.length===1?mats[0]:mats;
  const head=findEyes(body,iH);
  const sw=(i,cv,rough=.6)=>{mats[i].map=toTex(cv.c,mats[i].map); mats[i].roughness=rough; mats[i].needsUpdate=true;};
  // ojos: las esferas oculares son islas de malla separadas dentro del material de la cabeza → se repinta su zona UV
  const eyeIslands=(()=>{const geo=body.geometry, grp=geo.groups.find(gp=>gp.materialIndex===iH), pos=geo.attributes.position, uv=geo.attributes.uv; if(!grp) return []; const idx=geo.index?geo.index.array:{length:pos.count,__proto__:null}; if(!geo.index){for(let k=0;k<pos.count;k++) idx[k]=k;}
    const par=new Map(); const f=a=>{while(par.get(a)!==a){par.set(a,par.get(par.get(a))); a=par.get(a);} return a;}; const u=(a,b)=>{a=f(a); b=f(b); if(a!==b) par.set(a,b);};
    const key=i=>{const x=pos.getX(i).toFixed(5)+','+pos.getY(i).toFixed(5)+','+pos.getZ(i).toFixed(5); return x;}; const canon=new Map(), cid=i=>{const k=key(i); if(!canon.has(k)) canon.set(k,i); return canon.get(k);};
    for(let k=grp.start;k<grp.start+grp.count;k++){const c=cid(idx[k]); if(!par.has(c)) par.set(c,c);}
    for(let k=grp.start;k<grp.start+grp.count;k+=3){const a=cid(idx[k]),b=cid(idx[k+1]),c=cid(idx[k+2]); u(a,b); u(b,c);}
    const comps=new Map(), v=new THREE.Vector3(); for(let k=grp.start;k<grp.start+grp.count;k++){const i=idx[k], r=f(cid(i)); if(!comps.has(r)) comps.set(r,new Set()); comps.get(r).add(i);}
    const out=[]; for(const set of comps.values()){if(set.size<20||set.size>3000) continue; const bb=new THREE.Box3(), ub=new THREE.Box2(); for(const i of set){v.fromBufferAttribute(pos,i).applyMatrix4(body.matrixWorld); bb.expandByPoint(v); ub.expandByPoint(new THREE.Vector2(uv.getX(i),1-uv.getY(i)));}
      const sz=bb.getSize(V3()); if(sz.x>.018&&sz.x<.04&&sz.y>.018&&sz.y<.04&&Math.abs(bb.getCenter(V3()).x-head.cx)>.015&&Math.abs(bb.getCenter(V3()).x-head.cx)<.06) out.push({bb,ub});}
    window.__eyes=(window.__eyes||[]).concat([kind+':'+out.length]); return out.slice(0,2);})();
  const deadEyes=(cv,mode)=>{const g=cv.g; for(const e of eyeIslands){const x0=e.ub.min.x*cv.w, y0=e.ub.min.y*cv.h, w=(e.ub.max.x-e.ub.min.x)*cv.w, h=(e.ub.max.y-e.ub.min.y)*cv.h, cx=x0+w/2, cy=y0+h/2, r=Math.max(w,h)*.5;
      if(mode==='negro'){g.fillStyle='#030202'; g.fillRect(x0-2,y0-2,w+4,h+4); continue;}
      g.fillStyle=mode==='rojo'?'#8a2a24':'#cfccc0'; g.fillRect(x0-2,y0-2,w+4,h+4);
      const gr=g.createRadialGradient(cx,cy,0,cx,cy,r*.45); gr.addColorStop(0,mode==='rojo'?'rgba(60,8,6,.9)':'rgba(205,205,195,.95)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,r*.45,0,7); g.fill();
      g.strokeStyle=mode==='rojo'?'rgba(60,0,0,.8)':'rgba(150,25,25,.55)'; g.lineWidth=Math.max(.6,r*.03); for(let k=0;k<14;k++){const a=rnd(0,6.28); g.beginPath(); g.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); g.lineTo(cx+Math.cos(a+rnd(-.3,.3))*r*.5,cy+Math.sin(a+rnd(-.3,.3))*r*.5); g.stroke();}}
    for(const e of eyeIslands){const c=e.bb.getCenter(V3()); paintAt(body,iH,c.add(V3(0,0,.012)),.03,(g2,x,y,k)=>{g2.fillStyle=`rgba(30,10,25,${.07*k})`; g2.beginPath(); g2.arc(x,y,4,0,7); g2.fill();},cv);}};
  const mouthBlood=cv=>{if(eyeIslands.length<2) return; const m=eyeIslands[0].bb.getCenter(V3()).add(eyeIslands[1].bb.getCenter(V3())).multiplyScalar(.5).add(V3(0,-.075,.012));
    paintAt(body,iH,m,.035,(g,x,y,k)=>{if(Math.random()<.35*k) bloodSplat(g,x,y,rnd(1.5,4),.95);},cv);
    paintAt(body,iH,m.clone().add(V3(0,-.04,0)),.04,(g,x,y,k)=>{if(Math.random()<.15*k) bloodSplat(g,x,y,rnd(1.5,3.5),.85);},cv);};
  const handsBlood=cv=>{for(const hn of ['L_Hand','R_Hand']) if(B[hn]) paintAt(body,iB,B[hn].getWorldPosition(V3()),.1,(g,x,y,k)=>{if(Math.random()<.06*k) bloodSplat(g,x,y,rnd(2,6),.9);},cv);};
  const hairCenter=V3(head.cx,head.top-.1,head.front-.1);
  E.head=head; E.hairCenter=hairCenter; E.headQ0inv=B.Head.getWorldQuaternion(new THREE.Quaternion()).invert();
  if(kind==='novia'){
    const cvB=horrorPaint(mats[iB].map,{skin:[.74,.8,.78],skinLift:.16,cloth:L=>{const v=150+L*95; return [v,v*.97,v*.9];}}); handsBlood(cvB); sw(iB,cvB,.45);
    const cvH=horrorPaint(mats[iH].map,{skin:[.8,.86,.86],skinLift:.24,hair:L=>[8+L*20,7+L*16,7+L*14],veinsN:90}); deadEyes(cvH,'blanco'); mouthBlood(cvH); sw(iH,cvH,.35);
    if(iO>=0) mats[iO].visible=false;
    E.hairReq=[1.0,.72,1];
    const hip=B.Pelvis.getWorldPosition(V3()).y; attachTo(B.Pelvis,longSkirt(hip+.1,.17,.42,'#d8d2c2',true,3));
  }
  if(kind==='operadora'){
    const cvB=horrorPaint(mats[iB].map,{skin:[.8,.78,.86],skinLift:.2,cloth:L=>[30+L*90,34+L*96,44+L*110]}); handsBlood(cvB); sw(iB,cvB,.6);
    const cvH=horrorPaint(mats[iH].map,{skin:[.8,.76,.86],skinLift:.2,veinsN:160,bruise:30,cloth:L=>[22+L*40,19+L*34,17+L*28]}); deadEyes(cvH,'rojo'); sw(iH,cvH,.55);
    if(iO>=0) mats[iO].color=new THREE.Color(.22,.2,.18);
    const blk=new THREE.MeshStandardMaterial({color:0x111111,roughness:.4});
    const band=new THREE.Mesh(new THREE.TorusGeometry(.095,.005,6,30,Math.PI),blk); band.position.copy(hairCenter).add(V3(0,.02,0)); band.rotation.y=Math.PI/2; attachTo(B.Head,band);
    const ear=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.02,16),blk); ear.position.copy(hairCenter).add(V3(.095,-.02,0)); ear.rotation.z=Math.PI/2; attachTo(B.Head,ear);
    const neck=B.Neck.getWorldPosition(V3()).add(V3(0,.04,.01)); const pts=[]; for(let i=0;i<=400;i++){const t=i/400, a=t*Math.PI*2*3.2; pts.push(V3(Math.cos(a)*.058,t*.06+Math.sin(t*90)*.004,Math.sin(a)*.055).add(neck));}
    for(let i=0;i<=60;i++){const t=i/60; pts.push(V3(.05+t*.06,.06-t*.95,.03+Math.sin(t*40)*.01).add(neck));}
    attachTo(B.Neck,new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),900,.005,6),blk));
  }
  if(kind==='nina'){
    const cvB=horrorPaint(mats[iB].map,{skin:[.84,.86,.86],skinLift:.25,cloth:L=>{const v=140+L*90; return [v,v*.96,v*.88];}}); handsBlood(cvB); sw(iB,cvB,.6);
    const cvH=horrorPaint(mats[iH].map,{skin:[.84,.86,.88],skinLift:.26,hair:()=>[8,7,7],veinsN:70}); deadEyes(cvH,'negro'); sw(iH,cvH,.5);
    E.hairReq=[.7,.5,-1];
    const hip=B.Pelvis.getWorldPosition(V3()).y; attachTo(B.Pelvis,longSkirt(hip+.06,.14,.3,'#d0c9b8',true,7));
  }
  if(kind==='botones'){
    const cvB=horrorPaint(mats[iB].map,{skin:[.8,.86,.78],skinLift:.16,cloth:(L,r,g,b)=>{if(r>190&&g>190&&b>180) return [r*.82,g*.78,b*.7]; return [45+L*175,6+L*24,8+L*22];}}); handsBlood(cvB);
    for(let i=0;i<8;i++) bloodSplat(cvB.g,rnd(0,cvB.w),rnd(0,cvB.h*.5),rnd(5,16),.85); sw(iB,cvB,.65);
    const cvH=horrorPaint(mats[iH].map,{skin:[.8,.86,.78],skinLift:.18,veinsN:120}); deadEyes(cvH,'blanco'); mouthBlood(cvH); sw(iH,cvH,.5);
    const red=new THREE.MeshStandardMaterial({color:0x5a0a0a,roughness:.6}), gold=new THREE.MeshStandardMaterial({color:0x8a6a2a,metalness:.8,roughness:.4}); const capG=new THREE.Group();
    mesh(new THREE.CylinderGeometry(.068,.072,.07,24),red,0,0,0,capG); mesh(new THREE.CylinderGeometry(.073,.073,.012,24),gold,0,-.025,0,capG); capG.position.set(head.cx,head.top-.005,hairCenter.z+.005); attachTo(B.Head,capG);
    const key=new THREE.Group(); mesh(new THREE.TorusGeometry(.014,.003,6,14),gold,0,0,0,key); mesh(new THREE.BoxGeometry(.004,.05,.002),gold,0,-.035,0,key); mesh(new THREE.BoxGeometry(.035,.06,.006),new THREE.MeshStandardMaterial({color:0x5a0a08}),0,-.085,0,key);
    key.position.copy(B.R_Hand.getWorldPosition(V3())).add(V3(0,-.07,.02)); attachTo(B.R_Hand,key);
  }
  if(kind==='quemado'){
    E.glow=[]; for(const i of [iB,iH]){const {cv,em}=charPaint(mats[i].map); const src=mats[i].map; mats[i].map=toTex(cv.c,src); mats[i].emissiveMap=toTex(em,src); mats[i].emissive=new THREE.Color(1,.42,.12); mats[i].emissiveIntensity=1.0; mats[i].roughness=.95; mats[i].needsUpdate=true; E.glow.push(mats[i]);}
    if(iO>=0) mats[iO].visible=false;
    const smoke=ctex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(60,55,50,.55)'); gr.addColorStop(1,'rgba(60,55,50,0)'); g.fillStyle=gr; g.fillRect(0,0,128,128);});
    E.smoke=[]; for(let i=0;i<20;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:smoke,transparent:true,depthWrite:false,opacity:0})); root.add(sp); E.smoke.push({sp,t:i/20,x:rnd(-.2,.2),z:rnd(-.1,.1)});}
  }
  const hl=B.Head.worldToLocal(hairCenter.clone()); applyPose(B,POSES[kind]); root.updateMatrixWorld(true);
  if(E.hairReq){const c=B.Head.localToWorld(hl.clone()), q=B.Head.getWorldQuaternion(new THREE.Quaternion()).multiply(E.headQ0inv); attachTo(B.Head,longHair(c,E.hairReq[0],E.hairReq[1],E.hairReq[2],q));}
  S.remove(root);
  E.base={}; for(const k in B) E.base[k]=B[k].rotation.clone(); ENEMIES.push(E); root.userData.enemy=E; return root;
}
// movimientos: respiración, espasmos de cabeza, temblor de manos, humo y brasas
function enemyTick(t,dt){for(const E of ENEMIES){const B=E.B, b=E.base; if(!B.Head) continue;
  if(B.Spine2) B.Spine2.rotation.x=b.Spine2.x+Math.sin(t*1.3+E.kind.length)*.012;
  if(t>E.tw.next){E.tw.t=t; E.tw.next=t+rnd(1.5,5); E.tw.ax=rnd(-.3,.3); E.tw.az=rnd(-.35,.35);}
  const k=Math.max(0,1-(t-E.tw.t)/.35);
  B.Head.rotation.x=b.Head.x+E.tw.ax*k*Math.sin((t-E.tw.t)*60); B.Head.rotation.z=b.Head.z+E.tw.az*k+Math.sin(t*.7)*.025;
  for(const hn of ['L_Hand','R_Hand']) if(B[hn]) B[hn].rotation.z=b[hn].z+Math.sin(t*23+hn.length)*.035;
  if(E.smoke) for(const s of E.smoke){s.t+=dt*.25; if(s.t>1) s.t-=1; s.sp.position.set(s.x+Math.sin(t+s.t*6)*.06,1.2+s.t*1.3,s.z); const sc=.15+s.t*.6; s.sp.scale.set(sc,sc,1); s.sp.material.opacity=Math.sin(s.t*Math.PI)*.3;}
  if(E.glow) for(const m of E.glow) m.emissiveIntensity=.8+Math.sin(t*3+m.id)*.3+Math.random()*.15;
}}
