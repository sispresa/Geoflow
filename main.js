import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $=id=>document.getElementById(id), C=h=>new THREE.Color(h);
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)), mix=(a,b,t)=>a+(b-a)*t;
const sm=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------- renderer / scene ---------- */
const vp=$('viewport');
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(err){vp.innerHTML='<div style="position:absolute;inset:0;display:grid;place-items:center;padding:24px;text-align:center;color:#e6eef6">Browser atau perangkat ini tidak mendukung WebGL, sehingga simulasi 3D tidak dapat ditampilkan. Coba browser lain atau perbarui driver grafis.</div>';throw err}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.style.cssText='display:block;width:100%;height:100%';
vp.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xbfe6ff,90,260);
const camera=new THREE.PerspectiveCamera(48,1,.5,1200);
const controls=new OrbitControls(camera,renderer.domElement);
Object.assign(controls,{enableDamping:true,dampingFactor:.06,minDistance:14,maxDistance:95,maxPolarAngle:1.47,autoRotateSpeed:1.1});
controls.target.set(0,4,0);
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.55,.6,.9);
composer.addPass(bloom);composer.addPass(new OutputPass());
function resize(){const w=vp.clientWidth||innerWidth,h=vp.clientHeight||innerHeight;renderer.setSize(w,h,false);composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

/* ---------- terrain ---------- */
const g=(x,z,cx,cz,r,h)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/r);
const nz=(x,z)=>Math.sin(x*.21+1)*Math.cos(z*.19)+.5*Math.sin(x*.07+z*.11);
function H(x,z){
  const m=sm(5,22,-x),b=.18+.1*Math.min(-x,5);
  const hl=Math.max(b,0)+m*(2.2+1.6*nz(x,z))+g(x,z,-75,-45,700,24)+g(x,z,-65,48,600,18);
  const hs=-2.6*(1-Math.exp(-Math.max(x,0)*.3));
  return mix(hl,hs,sm(-1.5,1.5,x))+g(x,z,58,-42,180,6)+g(x,z,72,30,260,9);
}
const tgeo=new THREE.PlaneGeometry(180,150,240,200);tgeo.rotateX(-Math.PI/2);
{
  const p=tgeo.attributes.position,col=new Float32Array(p.count*3),c=new THREE.Color();
  const K=['#e9d7a4','#c9b583','#5aa845','#3a8a3c','#7c7a6e','#2f6f7e','#1d4d63'].map(C);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),h=H(x,z);p.setY(i,h);const n=nz(x*2.3,z*2.3)*.5+.5;
    if(h<-1.2)c.copy(K[6]).lerp(K[5],sm(-2.6,-1.2,h));
    else if(h<.05)c.copy(K[5]).lerp(K[1],sm(-1.2,.05,h));
    else if(h<.75)c.copy(K[1]).lerp(K[0],sm(.05,.4,h));
    else if(h<3)c.copy(K[0]).lerp(K[2],sm(.75,1.4,h)).lerp(K[3],n*sm(1.4,3,h));
    else c.copy(K[3]).lerp(K[4],sm(3,9,h)).lerp(K[2],n*.2);
    col.set([c.r,c.g,c.b],i*3);
  }
  tgeo.setAttribute('color',new THREE.BufferAttribute(col,3));tgeo.computeVertexNormals();
}
const landMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
const terrain=new THREE.Mesh(tgeo,landMat);terrain.receiveShadow=true;scene.add(terrain);

/* ---------- sky, sun, moon, stars ---------- */
const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uT:{value:C('#2a7fd6')},uB:{value:C('#bfe6ff')},uSd:{value:new THREE.Vector3(0,1,0)},uSc:{value:C('#ffb070')}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uT,uB,uSd,uSc;varying vec3 vD;void main(){float h=max(vD.y,0.);vec3 c=mix(uB,uT,pow(h,.55));float s=max(dot(vD,normalize(uSd)),0.);c+=uSc*(pow(s,6.)*.25+pow(s,80.)*.8);gl_FragColor=vec4(c,1.);}'});
const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),skyMat);sky.renderOrder=-1;scene.add(sky);
const stN=1600,stP=new Float32Array(stN*3);
for(let i=0;i<stN;i++){const u=Math.random()*Math.PI*2,v=Math.acos(rnd(.02,1)),r=380;stP.set([r*Math.sin(v)*Math.cos(u),r*Math.cos(v),r*Math.sin(v)*Math.sin(u)],i*3)}
const stG=new THREE.BufferGeometry();stG.setAttribute('position',new THREE.BufferAttribute(stP,3));
const stars=new THREE.Points(stG,new THREE.PointsMaterial({color:0xffffff,size:1.8,sizeAttenuation:false,transparent:true,fog:false,depthWrite:false}));scene.add(stars);
function glow(col,s){const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,col);gr.addColorStop(.25,col.replace(/[\d.]+\)$/,'.35)'));gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));sp.scale.set(s,s,1);return sp}
const sun=new THREE.Mesh(new THREE.SphereGeometry(5,32,16),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.4,1.3),fog:false}));sun.add(glow('rgba(255,200,120,1)',70));scene.add(sun);
const moon=new THREE.Mesh(new THREE.SphereGeometry(3.6,32,16),new THREE.MeshBasicMaterial({color:new THREE.Color(1.3,1.4,1.7),fog:false}));moon.add(glow('rgba(160,190,255,1)',45));scene.add(moon);

/* ---------- lights ---------- */
const hemi=new THREE.HemisphereLight(0xbfe6ff,0x3b4a36,.8);scene.add(hemi);
const dl=new THREE.DirectionalLight(0xffffff,3);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);
Object.assign(dl.shadow.camera,{left:-50,right:40,top:35,bottom:-35,near:1,far:260});dl.shadow.bias=-.0005;dl.target.position.set(-10,0,0);scene.add(dl,dl.target);

/* ---------- sea ---------- */
const WAVE='float wv(vec2 p){return(sin(p.x*.45-uTime*1.3+p.y*.2)*.5+sin(p.x*.9+p.y*.6-uTime*1.9)*.25+sin(p.y*.35-uTime*.9+p.x*.2)*.3)*uAmp;}';
const seaMat=new THREE.ShaderMaterial({transparent:true,fog:false,
  uniforms:{uTime:{value:0},uAmp:{value:.2},uDeep:{value:C('#0a4f7a')},uShal:{value:C('#3fd0c9')},uSky:{value:C('#bfe6ff')},uLc:{value:C('#fff')},uLd:{value:new THREE.Vector3(0,1,0)},uLi:{value:1},uFog:{value:C('#bfe6ff')}},
  vertexShader:'uniform float uTime,uAmp;varying vec3 vW,vN;'+WAVE+'void main(){vec4 w=modelMatrix*vec4(position,1.);vec2 q=w.xz;float h=wv(q),e=.3;vN=normalize(vec3(-(wv(q+vec2(e,0.))-h)/e*2.5,1.,-(wv(q+vec2(0.,e))-h)/e*2.5));w.y+=h;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uTime,uLi;uniform vec3 uDeep,uShal,uSky,uLc,uLd,uFog;varying vec3 vW,vN;void main(){vec3 N=normalize(vN),V=normalize(cameraPosition-vW);float f=pow(1.-max(dot(N,V),0.),3.);vec3 c=mix(mix(uShal,uDeep,smoothstep(1.,22.,vW.x)),uSky,f*.75);vec3 Hh=normalize(normalize(uLd)+V);c+=uLc*pow(max(dot(N,Hh),0.),140.)*uLi;float fo=smoothstep(2.6,0.,vW.x+.4*sin(vW.z*.7+uTime))*(.5+.5*sin(vW.x*5.-uTime*2.4+vW.z*.4));c=mix(c,vec3(1.),fo*.8);c=mix(c,uFog,smoothstep(80.,190.,length(cameraPosition-vW)));gl_FragColor=vec4(c,mix(.5,.94,smoothstep(0.,6.,vW.x)));}'});
const seaG=new THREE.PlaneGeometry(95,150,190,150);seaG.rotateX(-Math.PI/2);
const sea=new THREE.Mesh(seaG,seaMat);sea.position.set(44,0,0);scene.add(sea);
let AMP=.2;const waveH=(x,z,t)=>(Math.sin(x*.45-t*1.3+z*.2)*.5+Math.sin(x*.9+z*.6-t*1.9)*.25+Math.sin(z*.35-t*.9+x*.2)*.3)*AMP;

/* ---------- props ---------- */
const mk=(geo,mat,x,y,z,sh=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=sh;m.receiveShadow=true;return m};
const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...o});
// pine forest (instanced)
{
  const N=240,tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.2,1.4,6),std('#6b4a2b'),N);
  const fo=new THREE.InstancedMesh(new THREE.ConeGeometry(1,3,7),std('#ffffff'),N),d=new THREE.Object3D(),c=new THREE.Color();let n=0;
  for(let i=0;i<4000&&n<N;i++){
    const x=rnd(-70,-5.5),z=rnd(-45,45),h=H(x,z);
    if(h<.9||h>5.5||(x>-17&&x<-7&&Math.abs(z)<9)||(x>-5&&x<-1&&Math.abs(z+10)<4))continue;
    const k=rnd(.7,1.6);d.rotation.set(0,rnd(0,6),0);d.scale.set(k,k,k);
    d.position.set(x,h+.7*k,z);d.updateMatrix();tr.setMatrixAt(n,d.matrix);
    d.position.y=h+2.3*k;d.updateMatrix();fo.setMatrixAt(n,d.matrix);
    fo.setColorAt(n,c.setHSL(rnd(.28,.37),rnd(.45,.6),rnd(.2,.32)));n++;
  }
  tr.count=fo.count=n;tr.castShadow=fo.castShadow=true;scene.add(tr,fo);
}
// houses
const winMat=new THREE.MeshStandardMaterial({color:0x332a1a,emissive:0xffc766,emissiveIntensity:0});
[[-10,-4],[-12.5,2],[-9.5,6.5],[-14,-1.5]].forEach(([x,z],i)=>{
  const y=H(x,z),gr=new THREE.Group();gr.position.set(x,y,z);gr.rotation.y=i*.5-.4;
  gr.add(mk(new THREE.BoxGeometry(2,1.6,1.7),std('#f3e6cf'),0,.6,0),(()=>{const r=mk(new THREE.ConeGeometry(1.7,1,4),std('#c8442f'),0,1.9,0);r.rotation.y=Math.PI/4;return r})(),mk(new THREE.BoxGeometry(.5,.5,.06),winMat,.4,.7,.87,false),mk(new THREE.BoxGeometry(.5,.5,.06),winMat,-.4,.7,.87,false));
  scene.add(gr);
});
// lighthouse
const lh=new THREE.Group(),lhy=H(-3,-10);lh.position.set(-3,lhy,-10);
for(let i=0;i<4;i++)lh.add(mk(new THREE.CylinderGeometry(.95-i*.07,1-i*.07,1.8,16),std(i%2?'#d63a2f':'#f4f4f0'),0,.9+i*1.8,0));
const lamp=new THREE.MeshStandardMaterial({color:0x222222,emissive:0xffe9a0,emissiveIntensity:1});
lh.add(mk(new THREE.CylinderGeometry(.6,.6,.9,16),lamp,0,7.65,0,false),mk(new THREE.ConeGeometry(.9,.8,16),std('#333'),0,8.5,0));
const beam=new THREE.Group(),bg=new THREE.ConeGeometry(2.4,20,24,1,true);bg.translate(0,-10,0);bg.rotateZ(Math.PI/2);
const bm=new THREE.MeshBasicMaterial({color:0xfff2b0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const b1=new THREE.Mesh(bg,bm),b2=b1.clone();b2.rotation.y=Math.PI;beam.add(b1,b2);beam.position.y=7.65;lh.add(beam);scene.add(lh);
// boats
const boats=[];
[[9,-6,'#d63a2f'],[15,6,'#2f6fd6'],[22,-12,'#f2f2f2']].forEach(([x,z,c])=>{
  const gr=new THREE.Group(),sh=new THREE.Shape();sh.moveTo(-1.3,.35);sh.lineTo(1.5,.35);sh.lineTo(.9,-.25);sh.lineTo(-.9,-.25);
  const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.9,bevelEnabled:false}),std(c));hull.position.z=-.45;hull.castShadow=true;
  const sg=new THREE.Shape();sg.moveTo(0,0);sg.lineTo(0,3.4);sg.lineTo(1.6,.1);
  const sail=new THREE.Mesh(new THREE.ShapeGeometry(sg),new THREE.MeshStandardMaterial({color:0xfff3e0,side:THREE.DoubleSide,roughness:.9}));sail.position.set(-.2,.4,0);sail.castShadow=true;
  gr.add(hull,mk(new THREE.CylinderGeometry(.05,.05,3.6),std('#444'),-.2,2.2,0),sail);gr.position.set(x,0,z);gr.userData={sail,ph:Math.random()*6};scene.add(gr);boats.push(gr);
});
// clouds
const cloudMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92,fog:true});
const clouds=[];
for(let i=0;i<9;i++){
  const gr=new THREE.Group();
  for(let j=0;j<6;j++){const s=rnd(2,4.2),m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,2),cloudMat);m.position.set(j*2.4-6+rnd(-.5,.5),rnd(-.4,.8),rnd(-1.5,1.5));m.scale.y=.6;gr.add(m)}
  gr.position.set(rnd(-40,40),rnd(15,21),rnd(-40,25));gr.castShadow=false;scene.add(gr);clouds.push(gr);
}

/* ---------- labels ---------- */
function lab(){const cv=document.createElement('canvas');cv.width=512;cv.height=160;const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false,fog:false,color:0xdddddd}));sp.scale.set(11,3.4,1);sp.renderOrder=20;sp.userData={cv,tx,k:''};scene.add(sp);return sp}
function setLab(sp,a,b,col){const k=a+b+col;if(sp.userData.k===k)return;sp.userData.k=k;const x=sp.userData.cv.getContext('2d');x.clearRect(0,0,512,160);x.fillStyle='rgba(8,20,33,.75)';x.beginPath();if(x.roundRect)x.roundRect(8,8,496,144,36);else x.rect(8,8,496,144);x.fill();x.strokeStyle=col;x.lineWidth=4;x.stroke();x.textAlign='center';x.fillStyle='#fff';x.font='700 54px sans-serif';x.fillText(a,256,72);x.fillStyle=col;x.font='600 32px sans-serif';x.fillText(b,256,118);sp.userData.tx.needsUpdate=true}
const labL=lab(),labS=lab();labL.position.set(-15,12.5,0);labS.position.set(15,12.5,0);

/* ---------- wind particles ---------- */
const dot=(()=>{const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(cv)})();
const NP=innerWidth<700?1200:2200,LX=26,HH=12,UU=7;
const P=new Float32Array(NP*3),age=new Float32Array(NP),life=new Float32Array(NP),LP=new Float32Array(NP*6),LC=new Float32Array(NP*6),PC=new Float32Array(NP*3);
function spawn(i){P[i*3]=rnd(-LX,LX)*.95;P[i*3+1]=Math.random()<.5?rnd(.7,4.2):rnd(4.2,11);P[i*3+2]=rnd(-22,22);age[i]=0;life[i]=rnd(4,9)}
for(let i=0;i<NP;i++){spawn(i);age[i]=Math.random()*life[i]}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(P,3));pg.setAttribute('color',new THREE.BufferAttribute(PC,3));
const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(LP,3));lg.setAttribute('color',new THREE.BufferAttribute(LC,3));
const add={transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,vertexColors:true,fog:false};
const heads=new THREE.Points(pg,new THREE.PointsMaterial({...add,size:.55,map:dot})),tails=new THREE.LineSegments(lg,new THREE.LineBasicMaterial(add));
heads.frustumCulled=tails.frustumCulled=false;scene.add(heads,tails);
const NQ=260,Q=new Float32Array(NQ*3),qa=new Float32Array(NQ),ql=new Float32Array(NQ),QC=new Float32Array(NQ*3);
const qg=new THREE.BufferGeometry();qg.setAttribute('position',new THREE.BufferAttribute(Q,3));qg.setAttribute('color',new THREE.BufferAttribute(QC,3));
const plumes=new THREE.Points(qg,new THREE.PointsMaterial({...add,size:1.1,map:dot}));plumes.frustumCulled=false;scene.add(plumes);
let warmLand=true;
function spawnQ(i){const x=warmLand?-rnd(2,24):rnd(2,24),z=rnd(-20,20);Q.set([x,(warmLand?H(x,z):0)+.2,z],i*3);qa[i]=0;ql[i]=rnd(2,4)}
for(let i=0;i<NQ;i++){spawnQ(i);qa[i]=Math.random()*ql[i]}
const cSea=C('#58e6ff'),cLand=C('#ffb25a'),cUp=C('#c99bff'),cs=new THREE.Color();
const labW=lab();labW.position.set(0,7,14);
const NA=56,arrows=new THREE.InstancedMesh((()=>{const g=new THREE.ConeGeometry(.42,1.3,10);g.rotateZ(-Math.PI/2);return g})(),new THREE.MeshBasicMaterial({toneMapped:false,fog:false}),NA);
const AX=new Float32Array(NA*3),AD=new THREE.Object3D(),ac=new THREE.Color();
for(let i=0;i<NA;i++)AX.set([rnd(-LX,LX)*.9,i>=NA/2?rnd(8,10.5):rnd(1.2,2.4),rnd(-16,16)],i*3);
arrows.frustumCulled=false;scene.add(arrows);

/* ---------- time model / sky update ---------- */
const PAL={night:[C('#030818'),C('#0b1d3a')],dawn:[C('#34407a'),C('#ff9a6a')],day:[C('#2a7fd6'),C('#bfe6ff')],dusk:[C('#2e2c66'),C('#ff6a4a')]};
const tmpT=new THREE.Color(),tmpB=new THREE.Color(),lp=new THREE.Vector3();
let T=12,S=1,playing=true,mode='observe';
let nightF=0;
function env(){
  const a=(T-6)/12*Math.PI,e=Math.sin(a),dayF=sm(-.1,.25,e);nightF=1-dayF;
  sun.position.set(-Math.cos(a)*95,Math.sin(a)*70,-55);moon.position.set(Math.cos(a)*95,-Math.sin(a)*70,-55);
  const gold=T<12?PAL.dawn:PAL.dusk,k=sm(.02,.4,e),nn=1-sm(-.3,0,e);
  tmpT.copy(gold[0]).lerp(PAL.day[0],k).lerp(PAL.night[0],nn);tmpB.copy(gold[1]).lerp(PAL.day[1],k).lerp(PAL.night[1],nn);
  skyMat.uniforms.uT.value.copy(tmpT);skyMat.uniforms.uB.value.copy(tmpB);
  skyMat.uniforms.uSd.value.copy(e>0?sun.position:moon.position);skyMat.uniforms.uSc.value.set(e>0?'#ff9a55':'#4a64a8').multiplyScalar(e>0?(1-k*.7):.5);
  scene.fog.color.copy(tmpB);scene.background=null;stars.material.opacity=sm(.05,-.25,e);
  const up=e>0;lp.copy(up?sun.position:moon.position);dl.position.copy(lp).multiplyScalar(1.2);
  dl.color.set(up?'#ffd6a0':'#8fb0ff').lerp(C('#fff4e0'),up?sm(.1,.6,e):0);
  dl.intensity=up?3.2*sm(0,.15,e):.5*sm(0,.15,-e)*1;
  hemi.color.copy(tmpT).lerp(C('#ffffff'),.3);hemi.intensity=.3+.65*dayF;
  renderer.toneMappingExposure=.9+.25*dayF;
  const u=seaMat.uniforms;u.uDeep.value.set('#0a4f7a').lerp(C('#031225'),nn);u.uShal.value.set('#3fd0c9').lerp(C('#0a2a4a'),nn);
  u.uSky.value.copy(tmpB);u.uFog.value.copy(tmpB);u.uLd.value.copy(lp);u.uLc.value.set(up?'#ffcf90':'#9db8ff');u.uLi.value=up?1.4*sm(0,.2,e):.5*sm(0,.2,-e);
  winMat.emissiveIntensity=nightF*2.6;lamp.emissiveIntensity=1+nightF*4;bm.opacity=nightF*.32;
  cloudMat.color.set('#ffffff').lerp(C('#2a3550'),nn*.8).lerp(C('#ffc8a0'),(1-k)*dayF*.5);
}

/* ---------- UI ---------- */
const slider=$('timeSlider'),cache={};
const setTxt=(id,v)=>{if(cache[id]!==v){cache[id]=v;$(id).textContent=v}};
const EXP={sea:'Darat memanas lebih cepat sehingga udara di atasnya naik dan tekanan permukaan menurun. Udara dari laut yang relatif sejuk mengalir ke darat mengisi kekosongan itu, lalu kembali ke laut di lapisan atas.',
  land:'Darat melepas panas lebih cepat dan menjadi lebih dingin daripada laut. Udara di atas laut yang relatif hangat naik, sehingga udara dari darat bergerak ke laut di permukaan.',
  mid:'Perbedaan suhu darat dan laut sedang mengecil. Tekanan hampir seimbang, sehingga angin permukaan melemah sebelum berbalik arah.'};
function per(){return T>=5&&T<7?'FAJAR':T>=7&&T<11?'PAGI':T>=11&&T<15?'SIANG':T>=15&&T<18?'SORE':T>=18&&T<19?'SENJA':'MALAM'}
let D=0;
function ui(){
  const L=27+8*Math.sin(2*Math.PI*(T-9)/24),Sa=27.5+1.5*Math.sin(2*Math.PI*(T-12)/24);D=L-Sa;
  const hh=Math.floor(T)%24,mm=Math.floor((T%1)*60);
  setTxt('clock',String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'));setTxt('period',per());
  setTxt('landTemp',Math.round(L)+'°');setTxt('seaTemp',Math.round(Sa)+'°');
  const hot=D>1,cold=D<-1;
  setTxt('landTempState',hot?'LEBIH HANGAT':cold?'LEBIH SEJUK':'SETARA');setTxt('seaTempState',cold?'LEBIH HANGAT':hot?'LEBIH SEJUK':'SETARA');
  const lpz=hot?'RENDAH':cold?'TINGGI':'SEIMBANG',spz=hot?'TINGGI':cold?'RENDAH':'SEIMBANG';
  setTxt('landPressure',lpz);setTxt('seaPressure',spz);
  const w=S>.18?['LAUT → DARAT','ANGIN LAUT','Udara relatif sejuk bergerak dari laut menuju daratan.',EXP.sea]:S<-.18?['DARAT → LAUT','ANGIN DARAT','Udara dari daratan yang mendingin bergerak menuju laut yang lebih hangat.',EXP.land]:['PERALIHAN','ANGIN LEMAH','Beda suhu kecil, angin permukaan melemah dan berbalik arah.',EXP.mid];
  setTxt('windDirection',w[0]);setTxt('windName',w[1]);setTxt('windSummary',w[2]);setTxt('explanationText',w[3]);setTxt('sceneCaption',per()+' · '+w[1]);
  setLab(labL,'DARAT '+Math.round(L)+'°','TEKANAN '+lpz,hot?'#ff9a5a':cold?'#6fc3ff':'#cfd8e3');
  setLab(labS,'LAUT '+Math.round(Sa)+'°','TEKANAN '+spz,cold?'#ff9a5a':hot?'#6fc3ff':'#cfd8e3');
  setLab(labW,w[1],w[0],S>.18?'#58e6ff':S<-.18?'#ffb25a':'#cfd8e3');
  warmLand=D>0;
}
let toastT;function toast(m){const t=$('toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),3200)}
let drag=false;slider.addEventListener('pointerdown',()=>drag=true);addEventListener('pointerup',()=>drag=false);slider.addEventListener('input',()=>{T=parseFloat(slider.value)%24});
$('playBtn').onclick=()=>playing=true;$('pauseBtn').onclick=()=>playing=false;
$('resetBtn').onclick=()=>{T=12;playing=false;slider.value=12;S=1;toast('Simulasi direset ke 12:00')};
$('helpBtn').onclick=()=>toast('Geser slider waktu, seret untuk memutar, scroll untuk zoom. Garis cyan/oranye = angin permukaan, ungu = aliran balik di atas.');
const MD={observe:'Amati perubahan arah angin ketika waktu bergeser.',explore:'Kamera berputar otomatis. Perhatikan sirkulasi udara dari berbagai sudut.',understand:'Lihat label suhu dan tekanan: angin bergerak dari tekanan relatif tinggi ke rendah.',quiz:'Uji pemahamanmu dengan kuis singkat.'};
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
function setMode(m){mode=m;document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));$('modeDescription').textContent=MD[m];controls.autoRotate=m==='explore';labL.visible=labS.visible=m!=='observe'||true;if(m==='quiz')openQuiz();else $('quizModal').classList.add('hidden')}

/* ---------- quiz ---------- */
const st=document.createElement('style');st.textContent='.quiz-option{display:block;width:100%;text-align:left;margin:6px 0;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:inherit;font:inherit;cursor:pointer}.quiz-option:hover{background:rgba(255,255,255,.12)}.quiz-option.correct{background:rgba(60,200,140,.3);border-color:#3cc88c}.quiz-option.wrong{background:rgba(230,80,80,.28);border-color:#e65050}';document.head.appendChild(st);
const QZ=[['Ke mana arah angin permukaan pada siang hari?','Laut → Darat',['Darat → Laut','Tidak bergerak','Naik tegak lurus'],'Siang: darat lebih hangat, tekanan lebih rendah, sehingga angin laut bertiup dari laut ke darat.'],
['Mengapa darat lebih cepat panas daripada laut?','Suhu daratan berubah lebih cepat karena kalor jenisnya lebih kecil',['Laut tidak menerima sinar matahari','Darat selalu lebih dekat ke matahari','Laut tidak pernah berubah suhu'],'Air menyimpan panas lebih banyak, sehingga suhu laut berubah lebih lambat.'],
['Kapan angin darat terjadi?','Malam hari',['Siang hari','Tepat tengah hari','Hanya saat hujan'],'Malam: darat mendingin lebih cepat dan laut relatif lebih hangat.'],
['Pada siang hari, udara naik di atas…','Daratan',['Lautan','Keduanya sama','Tidak ada yang naik'],'Udara yang menghangat di atas darat naik dan menurunkan tekanan permukaan.'],
['Saat malam, tekanan permukaan di atas laut relatif…','Lebih rendah daripada darat',['Lebih tinggi daripada darat','Selalu sama','Tidak berpengaruh pada angin'],'Laut yang relatif hangat membuat udara naik, tekanan turun, sehingga angin bergerak ke laut.']];
let qi=-1,answered=false;
function nextQ(){qi=(qi+1)%QZ.length;answered=false;const [q,ok,bad,ex]=QZ[qi];$('quizQuestion').textContent=q;$('quizFeedback').textContent='';$('nextQuiz').classList.add('hidden');
  const box=$('quizOptions');box.innerHTML='';[ok,...bad].sort(()=>Math.random()-.5).forEach(o=>{const b=document.createElement('button');b.className='quiz-option';b.textContent=o;
    b.onclick=()=>{if(answered)return;answered=true;const right=o===ok;b.classList.add(right?'correct':'wrong');if(!right)[...box.children].find(x=>x.textContent===ok).classList.add('correct');$('quizFeedback').textContent=(right?'Benar! ':'Belum tepat. ')+ex;$('nextQuiz').classList.remove('hidden')};box.appendChild(b)})}
function openQuiz(){qi=-1;nextQ();$('quizModal').classList.remove('hidden')}
$('nextQuiz').onclick=nextQ;$('closeQuiz').onclick=()=>setMode('observe');

/* ---------- loop ---------- */
const clock=new THREE.Clock();let intro=0;const camEnd=new THREE.Vector3(4,13,40),camStart=new THREE.Vector3(70,45,95);
camera.position.copy(camStart);
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  if(playing&&!drag){T=(T+dt*.8)%24;slider.value=T.toFixed(1)}
  ui();env();
  S+=(clamp(D/3.5,-1,1)-S)*Math.min(1,dt*2.5);AMP=.14+.2*Math.abs(S);
  seaMat.uniforms.uTime.value=t;seaMat.uniforms.uAmp.value=AMP;
  if(intro<1){intro=Math.min(1,intro+dt/3.2);const e=1-Math.pow(1-intro,3);camera.position.lerpVectors(camStart,camEnd,e)}
  // wind
  const aS=Math.abs(S),inten=.15+.85*Math.min(1,aS*1.5),pk=Math.PI/(2*LX);
  for(let i=0;i<NP;i++){
    let x=P[i*3],y=P[i*3+1],z=P[i*3+2];
    const cx=Math.cos(pk*x),cy=Math.cos(Math.PI*y/HH);
    const u=-S*UU*cy*cx,v=-S*UU*(HH/(2*LX))*Math.sin(Math.PI*y/HH)*Math.sin(pk*x)*2.2,w=Math.sin(t*.8+x*.3+y)*.5*aS;
    x+=u*dt;y+=v*dt;z+=w*dt;age[i]+=dt;
    const gh=x<0?H(x,z)+.45:.5;if(y<gh)y=gh;
    if(age[i]>life[i]||Math.abs(x)>LX*.96||y>HH-.2){spawn(i);continue}
    P[i*3]=x;P[i*3+1]=y;P[i*3+2]=z;
    const f=Math.min(1,age[i]*2,(life[i]-age[i])*2)*inten;
    if(cy>0)cs.copy(S>=0?cSea:cLand);else cs.copy(cUp);
    PC[i*3]=cs.r*f;PC[i*3+1]=cs.g*f;PC[i*3+2]=cs.b*f;
    LP.set([x,y,z,x-u*.25,y-v*.25-0,z-w*.25],i*6);
    LC.set([cs.r*f,cs.g*f,cs.b*f,0,0,0],i*6);
  }
  pg.attributes.position.needsUpdate=pg.attributes.color.needsUpdate=lg.attributes.position.needsUpdate=lg.attributes.color.needsUpdate=true;
  for(let i=0;i<NA;i++){
    let x=AX[i*3],y=AX[i*3+1];const z=AX[i*3+2];
    const cx=Math.cos(pk*x),cy=Math.cos(Math.PI*y/HH),u=-S*UU*cy*cx*1.1,v=-S*UU*(HH/(2*LX))*Math.sin(Math.PI*y/HH)*Math.sin(pk*x)*2.2;
    x+=u*dt;y+=v*dt;if(Math.abs(x)>LX*.92||y>HH-.5||y<.9){x=rnd(-LX,LX)*.9;y=i<NA/2?rnd(1.2,2.4):rnd(8,10.5)}
    AX[i*3]=x;AX[i*3+1]=y;AD.position.set(x,Math.max(y,x<0?H(x,z)+.9:.9),z);AD.rotation.set(0,0,Math.atan2(v,u));
    AD.scale.setScalar(.4+1.1*Math.min(1,aS*1.3));AD.updateMatrix();arrows.setMatrixAt(i,AD.matrix);
    arrows.setColorAt(i,ac.copy(i<NA/2?(S>=0?cSea:cLand):cUp).multiplyScalar(1.6));
  }
  arrows.instanceMatrix.needsUpdate=true;arrows.instanceColor.needsUpdate=true;
  // thermal plumes
  const hi=Math.min(1,Math.abs(D)/6);
  for(let i=0;i<NQ;i++){
    qa[i]+=dt;if(qa[i]>ql[i]){spawnQ(i);continue}
    Q[i*3+1]+=(1.2+qa[i]*.8)*dt;Q[i*3]+=Math.sin(t+Q[i*3+2])*.3*dt;
    const f=Math.sin(Math.PI*qa[i]/ql[i])*hi*.85;QC[i*3]=1*f;QC[i*3+1]=.42*f;QC[i*3+2]=.12*f;
  }
  qg.attributes.position.needsUpdate=qg.attributes.color.needsUpdate=true;
  // land thermal tint
  landMat.color.setRGB(1,1,1).lerp(C(D>0?'#ffc9a0':'#b9d0ff'),Math.min(1,Math.abs(D)/9)*.7);
  // boats, clouds, beacon
  boats.forEach((b,i)=>{
    b.position.x=clamp(b.position.x-S*.5*dt,5,34);const x=b.position.x,z=b.position.z;
    b.position.y=waveH(x,z,t)-.1;b.rotation.z=(waveH(x+.6,z,t)-waveH(x-.6,z,t))*.8;b.rotation.x=Math.sin(t*1.1+b.userData.ph)*.04;
    const target=S>=0?0:Math.PI;b.userData.sail.rotation.y+=(target*.5+.25*Math.sin(t+b.userData.ph)-b.userData.sail.rotation.y)*dt*1.5;
  });
  clouds.forEach(c=>{c.position.x+=(.15+S*.7)*dt;if(c.position.x>60)c.position.x=-60;if(c.position.x<-60)c.position.x=60});
  beam.rotation.y=t*.9;
  controls.update();composer.render();
}
setMode('observe');frame();
