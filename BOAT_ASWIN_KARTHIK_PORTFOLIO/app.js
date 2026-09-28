import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const boot = $("#boot");
const enter = $("#enter");
const drawer = $("#drawer");
const menuBtn = $("#menuBtn");
const closeBtn = $("#closeBtn");

setTimeout(() => boot.classList.add("ready"), 250);

enter.addEventListener("click", () => {
  boot.classList.add("done");
  window.scrollTo({top:0, behavior:"instant"});
});
menuBtn.addEventListener("click", () => {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden","false");
  document.body.classList.add("menu-open");
});
closeBtn.addEventListener("click", closeDrawer);
$$("[data-close]").forEach(a => a.addEventListener("click", closeDrawer));
function closeDrawer(){
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden","true");
  document.body.classList.remove("menu-open");
}

// Cursor
const dot = $(".cursor-dot"), ring = $(".cursor-ring");
let mx = innerWidth/2, my = innerHeight/2, rx=mx, ry=my;
addEventListener("pointermove", e => { mx=e.clientX; my=e.clientY; });
function cursorLoop(){
  dot.style.left = mx+"px"; dot.style.top = my+"px";
  rx += (mx-rx)*.16; ry += (my-ry)*.16;
  ring.style.left = rx+"px"; ring.style.top = ry+"px";
  requestAnimationFrame(cursorLoop);
}
cursorLoop();
$$("a,button,.project,.chip,.chips span").forEach(el=>{
  el.addEventListener("mouseenter",()=>{ring.style.width="52px";ring.style.height="52px"});
  el.addEventListener("mouseleave",()=>{ring.style.width="34px";ring.style.height="34px"});
});

// Three.js living system field
const canvas = $("#world");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 100);
camera.position.z = 8;

const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);

const count = innerWidth < 700 ? 900 : 1700;
const positions = new Float32Array(count*3);
const velocities = new Float32Array(count*3);
for(let i=0;i<count;i++){
  const r = 4.2 + Math.random()*4;
  const a = Math.random()*Math.PI*2;
  positions[i*3] = Math.cos(a)*r*(.55+Math.random()*.5);
  positions[i*3+1] = (Math.random()-.5)*5.8;
  positions[i*3+2] = (Math.random()-.5)*5;
  velocities[i*3] = (Math.random()-.5)*.0015;
  velocities[i*3+1] = (Math.random()-.5)*.001;
  velocities[i*3+2] = (Math.random()-.5)*.0015;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(positions,3));
const mat = new THREE.PointsMaterial({color:0xb9ff47,size:0.025,transparent:true,opacity:.42,sizeAttenuation:true});
const points = new THREE.Points(geo,mat);
scene.add(points);

const lineMat = new THREE.LineBasicMaterial({color:0x56edff,transparent:true,opacity:.06});
let networkLines = [];
function makeConnections(){
  for(let j=0;j<90;j++){
    const a = Math.floor(Math.random()*count), b=Math.floor(Math.random()*count);
    const arr = new Float32Array(6);
    arr[0]=positions[a*3];arr[1]=positions[a*3+1];arr[2]=positions[a*3+2];
    arr[3]=positions[b*3];arr[4]=positions[b*3+1];arr[5]=positions[b*3+2];
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.BufferAttribute(arr,3));
    const l=new THREE.Line(g,lineMat);
    scene.add(l); networkLines.push([l,a,b]);
  }
}
makeConnections();

const mouse3 = new THREE.Vector2();
addEventListener("pointermove",e=>{
  mouse3.x=(e.clientX/innerWidth-.5)*2;
  mouse3.y=-(e.clientY/innerHeight-.5)*2;
});
let scrollY=0;
addEventListener("scroll",()=>scrollY=scrollY/window.innerHeight*0.01);

function animate(){
  requestAnimationFrame(animate);
  const arr=geo.attributes.position.array;
  for(let i=0;i<count;i++){
    arr[i*3]+=velocities[i*3];
    arr[i*3+1]+=velocities[i*3+1];
    arr[i*3+2]+=velocities[i*3+2];
    if(Math.abs(arr[i*3])>7) velocities[i*3]*=-1;
    if(Math.abs(arr[i*3+1])>4) velocities[i*3+1]*=-1;
    if(Math.abs(arr[i*3+2])>4) velocities[i*3+2]*=-1;
  }
  geo.attributes.position.needsUpdate=true;
  points.rotation.y += .00045;
  points.rotation.x += (mouse3.y*.02-points.rotation.x)*.01;
  points.rotation.z += (mouse3.x*.02-points.rotation.z)*.01;
  networkLines.forEach(([l,a,b])=>{
    const p=l.geometry.attributes.position.array;
    p[0]=arr[a*3];p[1]=arr[a*3+1];p[2]=arr[a*3+2];
    p[3]=arr[b*3];p[4]=arr[b*3+1];p[5]=arr[b*3+2];
    l.geometry.attributes.position.needsUpdate=true;
  });
  camera.position.x += (mouse3.x*.55-camera.position.x)*.02;
  camera.position.y += (mouse3.y*.35-camera.position.y)*.02;
  camera.lookAt(0,0,0);
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

// ECG pipeline activation
const pipes=$$(".pipe");
let pi=0;
setInterval(()=>{
  pipes.forEach(x=>x.classList.remove("active"));
  pipes[pi%pipes.length].classList.add("active");
  pi++;
},1200);

// Compression interaction
const cacheField=$("#cacheField"), compactField=$("#compactField"), compression=$(".compression");
for(let i=0;i<96;i++){const s=document.createElement("span");cacheField.appendChild(s)}
for(let i=0;i<32;i++){const s=document.createElement("span");compactField.appendChild(s)}
$("#compressBtn").addEventListener("click",()=>{
  compression.classList.toggle("compressed");
  $("#compressBtn").textContent = compression.classList.contains("compressed") ? "RESET TRANSFORMATION" : "RUN TRANSFORMATION";
});

// Reveal
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")});
},{threshold:.12});
$$(".reveal").forEach(e=>observer.observe(e));

// Active section index in drawer
const sections=$$("main section[id]");
const navLinks=$$(".drawer nav a");
const secObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      navLinks.forEach(a=>a.style.color="");
      const link=navLinks.find(a=>a.getAttribute("href")==="#"+e.target.id);
      if(link)link.style.color="#b9ff47";
    }
  })
},{rootMargin:"-45% 0px -45% 0px"});
sections.forEach(s=>secObs.observe(s));
