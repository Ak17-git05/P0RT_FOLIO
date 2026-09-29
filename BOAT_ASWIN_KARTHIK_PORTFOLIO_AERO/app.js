import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>[...p.querySelectorAll(s)];
const boot=$("#boot"), enter=$("#enter"), drawer=$("#drawer"), menuBtn=$("#menuBtn"), closeBtn=$("#closeBtn");
const prefersReduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

setTimeout(()=>boot?.classList.add("ready"),180);
enter?.addEventListener("click",()=>{boot.classList.add("done");window.scrollTo({top:0,behavior:"instant"});});
menuBtn?.addEventListener("click",()=>{drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");document.body.classList.add("menu-open");});
closeBtn?.addEventListener("click",closeDrawer);
$$('[data-close]').forEach(a=>a.addEventListener("click",closeDrawer));
function closeDrawer(){drawer.classList.remove("open");drawer.setAttribute("aria-hidden","true");document.body.classList.remove("menu-open");}

// Cursor: a small glass droplet + elastic ring + click ripples.
const dot=$(".cursor-dot"),ring=$(".cursor-ring");
let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,ox=mx,oy=my;
addEventListener("pointermove",e=>{mx=e.clientX;my=e.clientY;});
function cursorLoop(){
  if(dot){dot.style.left=mx+"px";dot.style.top=my+"px";}
  rx+=(mx-rx)*.18;ry+=(my-ry)*.18;
  ox+=(mx-ox)*.08;oy+=(my-oy)*.08;
  if(ring){ring.style.left=rx+"px";ring.style.top=ry+"px";}
  const orb=$(".cursor-orb"); if(orb){orb.style.left=ox+"px";orb.style.top=oy+"px";}
  requestAnimationFrame(cursorLoop);
}
if(!prefersReduced) cursorLoop();
$$('a,button,.project,.chip,.chips span').forEach(el=>{
  el.addEventListener("mouseenter",()=>{ring&&(ring.style.width="58px",ring.style.height="58px");$(".cursor-orb")?.classList.add("active");});
  el.addEventListener("mouseleave",()=>{ring&&(ring.style.width="36px",ring.style.height="36px");$(".cursor-orb")?.classList.remove("active");});
});
addEventListener("pointerdown",e=>{
  if(prefersReduced)return;
  const r=document.createElement("span");r.className="aero-ripple";r.style.left=e.clientX+"px";r.style.top=e.clientY+"px";document.body.appendChild(r);setTimeout(()=>r.remove(),850);
});

// Three.js: an interactive "aero data organism" that responds to the viewer.
const canvas=$("#world");
let renderer,scene,camera,points,lines,orbital,particleGeo,mouse3=new THREE.Vector2(),targetCam=new THREE.Vector3(0,0,8);
try{
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,100);camera.position.set(0,0,8);
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);

  const count=innerWidth<700?620:1100;
  const positions=new Float32Array(count*3),velocities=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,r=3.8+Math.random()*4.5;
    positions[i*3]=Math.cos(a)*r*(.5+Math.random()*.6);
    positions[i*3+1]=(Math.random()-.5)*5.6;
    positions[i*3+2]=(Math.random()-.5)*4.5;
    velocities[i*3]=(Math.random()-.5)*.0014;velocities[i*3+1]=(Math.random()-.5)*.001;velocities[i*3+2]=(Math.random()-.5)*.0012;
  }
  particleGeo=new THREE.BufferGeometry();particleGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const particleMat=new THREE.PointsMaterial({color:0x2eaaa7,size:.028,transparent:true,opacity:.3,sizeAttenuation:true});
  points=new THREE.Points(particleGeo,particleMat);scene.add(points);

  const lineMat=new THREE.LineBasicMaterial({color:0x4b9fc7,transparent:true,opacity:.075});
  const group=new THREE.Group();const pairs=[];
  for(let i=0;i<70;i++){const a=Math.floor(Math.random()*count),b=Math.floor(Math.random()*count);const arr=new Float32Array(6);const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(arr,3));const l=new THREE.Line(g,lineMat);group.add(l);pairs.push([l,a,b]);}
  scene.add(group);lines={group,pairs,positions};

  orbital=new THREE.Group();scene.add(orbital);
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(.7,32,32),new THREE.MeshBasicMaterial({color:0x9fe9df,transparent:true,opacity:.12,wireframe:false}));orbital.add(sphere);
  [1.15,1.45,1.8].forEach((r,i)=>{const ringGeo=new THREE.TorusGeometry(r,.006,8,120);const ringMat=new THREE.MeshBasicMaterial({color:i===1?0x5ea8d5:0x29aaa4,transparent:true,opacity:.24});const t=new THREE.Mesh(ringGeo,ringMat);t.rotation.x=Math.PI*(.22+i*.15);t.rotation.z=i*.55;orbital.add(t);});

  addEventListener("pointermove",e=>{mouse3.x=(e.clientX/innerWidth-.5)*2;mouse3.y=-(e.clientY/innerHeight-.5)*2;});
  const clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);const t=clock.getElapsedTime();const arr=particleGeo.attributes.position.array;
    for(let i=0;i<count;i++){
      arr[i*3]+=velocities[i*3];arr[i*3+1]+=velocities[i*3+1];arr[i*3+2]+=velocities[i*3+2];
      if(Math.abs(arr[i*3])>7)velocities[i*3]*=-1;if(Math.abs(arr[i*3+1])>4)velocities[i*3+1]*=-1;if(Math.abs(arr[i*3+2])>4)velocities[i*3+2]*=-1;
      const dx=arr[i*3]-(mouse3.x*4),dy=arr[i*3+1]-(mouse3.y*2.6),d=Math.sqrt(dx*dx+dy*dy)+.001;
      if(d<2.2){arr[i*3]+=dx/d*.004;arr[i*3+1]+=dy/d*.004;}
    }
    particleGeo.attributes.position.needsUpdate=true;
    points.rotation.y+=prefersReduced?0:.00028;points.rotation.x+=(mouse3.y*.014-points.rotation.x)*.012;points.rotation.z+=(mouse3.x*.014-points.rotation.z)*.012;
    lines.pairs.forEach(([l,a,b])=>{const p=l.geometry.attributes.position.array;p[0]=arr[a*3];p[1]=arr[a*3+1];p[2]=arr[a*3+2];p[3]=arr[b*3];p[4]=arr[b*3+1];p[5]=arr[b*3+2];l.geometry.attributes.position.needsUpdate=true;});
    orbital.rotation.y=t*.12+mouse3.x*.25;orbital.rotation.x=mouse3.y*.12;orbital.position.x+=(mouse3.x*1.5-orbital.position.x)*.018;orbital.position.y+=(mouse3.y*1.0-orbital.position.y)*.018;orbital.position.z=-1.3+Math.sin(t*.8)*.08;
    targetCam.set(mouse3.x*.45,mouse3.y*.3,8);camera.position.lerp(targetCam,.025);camera.lookAt(0,0,0);renderer.render(scene,camera);
  }
  animate();
  addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}catch(err){canvas?.remove();console.warn("Aero field fallback:",err)}

// Make the hero respond with a restrained perspective shift.
const hero=$('.hero');
if(hero&&!prefersReduced){hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hero.style.setProperty('--mx',(x*12).toFixed(2)+'px');hero.style.setProperty('--my',(y*8).toFixed(2)+'px');});hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--mx','0px');hero.style.setProperty('--my','0px');});}

// Gentle 3D tilt for content cards.
if(!prefersReduced){$$('.project,.compression,.raw,.processed,.output,.stack-group').forEach(card=>{
  card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(900px) rotateX(${(-y*3).toFixed(2)}deg) rotateY(${(x*4).toFixed(2)}deg) translateY(-2px)`;});
  card.addEventListener('pointerleave',()=>card.style.transform='');
});}

// ECG pipeline activation.
const pipes=$$('.pipe');let pi=0;setInterval(()=>{pipes.forEach(x=>x.classList.remove('active'));if(pipes.length)pipes[pi%pipes.length].classList.add('active');pi++;},1300);

// SpectralQuant transformation.
const cacheField=$("#cacheField"),compactField=$("#compactField"),compression=$(".compression");
for(let i=0;i<96;i++){const s=document.createElement('span');cacheField?.appendChild(s)}
for(let i=0;i<32;i++){const s=document.createElement('span');compactField?.appendChild(s)}
$("#compressBtn")?.addEventListener('click',()=>{compression.classList.toggle('compressed');$("#compressBtn").textContent=compression.classList.contains('compressed')?'RESET TRANSFORMATION':'RUN TRANSFORMATION';});

// Reveal sections.
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
$$('.reveal').forEach(e=>observer.observe(e));
const sections=$$('main section[id]'),navLinks=$$('.drawer nav a');
const secObs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>a.style.color='');const link=navLinks.find(a=>a.getAttribute('href')==='#'+e.target.id);if(link)link.style.color='#0a999b';}}),{rootMargin:'-45% 0px -45% 0px'});
sections.forEach(s=>secObs.observe(s));
