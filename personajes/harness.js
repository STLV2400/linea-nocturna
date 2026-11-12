const P=new URLSearchParams(location.search);
const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true}); R.setSize(innerWidth,innerHeight); R.outputEncoding=THREE.sRGBEncoding; R.toneMapping=THREE.ACESFilmicToneMapping; R.shadowMap.enabled=true;
document.body.appendChild(R.domElement);
const S=new THREE.Scene(); S.background=new THREE.Color(0x0b0c0e);
const cam=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.05,50);
S.add(new THREE.HemisphereLight(0x8090a8,0x101010,P.has('bright')?1.2:.35)); const dl=new THREE.SpotLight(0xfff0dd,P.has('bright')?2:3.5,20,.6,.5,1); dl.position.set(1.5,3.5,4); dl.castShadow=true; S.add(dl);
S.add(new THREE.Mesh(new THREE.PlaneGeometry(20,20).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x2a2826,roughness:.9})));
const rnd=(a,b)=>a+Math.random()*(b-a), V3=(x,y,z)=>new THREE.Vector3(x,y,z), std=o=>new THREE.MeshStandardMaterial(o), phys=o=>new THREE.MeshPhysicalMaterial(o);
function ctex(w,h,fn){const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); fn&&fn(g,w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.userData={g,c,w,h}; return t;}
function grime(g,w,h,n,a=.35,col='0,0,0'){for(let i=0;i<n;i++){const x=Math.random()*w,y=Math.random()*h,r=rnd(15,w/5); const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(${col},${a*Math.random()})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r);}}
function mesh(geo,mat,x=0,y=0,z=0,parent=S,cast=true,recv=true){const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=cast; m.receiveShadow=recv; parent.add(m); return m;}

// =====================================================================
//  SANGRE REALISTA: manchas irregulares, gotas satélite con cola, chorreaduras, brillo húmedo
// =====================================================================
function bloodSplat(g,x,y,r,a=1,dir=null){
  const N=48, pts=[]; let k=rnd(0,9);
  for(let i=0;i<N;i++){const t=i/N*Math.PI*2; const n=1+.22*Math.sin(t*3+k)+.12*Math.sin(t*7+k*2)+.07*Math.sin(t*13+k*3)+rnd(-.06,.06); pts.push([x+Math.cos(t)*r*n,y+Math.sin(t)*r*n*.92]);}
  const gr=g.createRadialGradient(x,y,0,x,y,r*1.2); gr.addColorStop(0,`rgba(48,2,2,${a})`); gr.addColorStop(.6,`rgba(78,5,4,${a})`); gr.addColorStop(1,`rgba(110,10,8,${a*.85})`);
  g.fillStyle=gr; g.beginPath(); pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.closePath(); g.fill();
  g.strokeStyle=`rgba(30,1,1,${a*.6})`; g.lineWidth=Math.max(1,r*.06); g.stroke();
  for(let i=0;i<Math.floor(rnd(8,22));i++){const t=dir!=null?dir+rnd(-.6,.6):rnd(0,6.28), d=r*rnd(1.15,2.6), s=r*rnd(.04,.16), px=x+Math.cos(t)*d, py=y+Math.sin(t)*d;
    g.fillStyle=`rgba(${rnd(60,95)|0},4,3,${a*rnd(.6,1)})`; g.beginPath(); g.ellipse(px,py,s*1.8,s,t,0,7); g.fill();
    g.beginPath(); g.moveTo(px-Math.cos(t)*s*1.6,py-Math.sin(t)*s*1.6); g.lineTo(px-Math.cos(t)*s*5-Math.sin(t)*s*.3,py-Math.sin(t)*s*5+Math.cos(t)*s*.3); g.lineTo(px-Math.cos(t)*s*1.6+Math.sin(t)*s*.6,py-Math.sin(t)*s*1.6-Math.cos(t)*s*.6); g.fill();}
}
function bloodDrips(g,x,y,w,L,a=1){for(let i=0;i<Math.floor(w/9)+2;i++){const dx=x+rnd(-w/2,w/2), l=L*rnd(.25,1), ww=rnd(2,6);
  const gr=g.createLinearGradient(0,y,0,y+l); gr.addColorStop(0,`rgba(70,4,3,${a})`); gr.addColorStop(1,`rgba(95,7,5,${a*.8})`); g.fillStyle=gr;
  g.beginPath(); g.moveTo(dx-ww/2,y); g.quadraticCurveTo(dx+rnd(-2,2),y+l*.5,dx-ww*.35,y+l); g.lineTo(dx+ww*.35,y+l); g.quadraticCurveTo(dx+rnd(-2,2),y+l*.5,dx+ww/2,y); g.fill();
  g.beginPath(); g.ellipse(dx,y+l,ww*.75,ww,0,0,7); g.fill();}}
