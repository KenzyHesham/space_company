'use strict';
/* =====================================================================
   CONFIG
   ===================================================================== */
const FAST = /[?&]fast=1/.test(location.search);
const NEXT_PAGE = 'opportunity.html', HOME = 'index.html';
const TOTAL_CHAPTERS = 7;

const IMG = {
  bg:     ['File:ESO - Milky Way.jpg'],
  rover:  ['File:Apollo 15 Lunar Roving Vehicle.jpg', 'File:AS15-88-11901.jpg'],
  rille:  ['File:Hadley Rille - Apollo 15.jpg', 'search:Apollo 15 Hadley Rille', 'File:Apollo 15 Lunar Roving Vehicle.jpg'],
  driver: ['File:Apollo 15 - Jim Irwin and Lunar Roving Vehicle - AS15-86-11603.jpg', 'search:Apollo 15 Jim Irwin rover', 'File:Apollo 15 Lunar Roving Vehicle.jpg'],
  moon:   ['File:FullMoon2010.jpg']
};

/* =====================================================================
   HELPERS + SAVED STATE
   ===================================================================== */
const $  = (s,r=document)=>r.querySelector(s);
const el = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms=>new Promise(r=>setTimeout(r,FAST?0:ms));

const KEY='astrotales.lrv.v1';
let S={name:'',score:0,done:{},badges:{},astro:'classic',rover:'classic',deep:0,quizRight:0,parts:{},seenSkin:{}};
try{
  const shared=JSON.parse(localStorage.getItem('astrotales.v1')||'null');
  const r=JSON.parse(localStorage.getItem(KEY)||'null');
  if(r) S=Object.assign(S,r);
  if(!S.name && shared && shared.name) S.name=shared.name;
}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};

/* Resolve exact Wikimedia Commons image URL via official API */
const urlCache = {};
async function resolveWikiUrl(fileTitle, width = 1200) {
  const key = `${fileTitle}_${width}`;
  if (urlCache[key]) return urlCache[key];
  if (!fileTitle.startsWith('File:') && !fileTitle.startsWith('search:')) return fileTitle;
  try {
    const api = fileTitle.startsWith('search:')
      ? `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(fileTitle.slice(7))}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`
      : `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`;
    const res = await fetch(api);
    const data = await res.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];
    const info = page?.imageinfo?.[0];
    const finalUrl = info?.thumburl || info?.url || null;
    if (finalUrl) urlCache[key] = finalUrl;
    return finalUrl;
  } catch (e) {
    return null;
  }
}

async function loadImg(img, list, width = 1200) {
  for (const item of list) {
    const src = await resolveWikiUrl(item, width);
    if (!src) continue;
    const ok = await new Promise(res => {
      img.onload = () => res(true);
      img.onerror = () => res(false);
      img.src = src;
    });
    if (ok) return;
  }
  img.style.opacity = 0.25;
}

resolveWikiUrl(IMG.bg[0], 2000).then(src => {
  if (!src) return;
  const bg = new Image();
  bg.onload = () => { document.body.style.backgroundImage = `url("${bg.src}")`; };
  bg.src = src;
});

/* lightbox */
const lb=$('#lb');
lb.addEventListener('click',()=>lb.classList.remove('on'));
addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on');});
function zoom(src){$('img',lb).src=src;lb.classList.add('on');}

/* =====================================================================
   BADGES, LEVELS, SKINS (SYSTEM / GAME HUD ONLY)
   ===================================================================== */
const ICON={
  star:'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z',
  wheel:'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 4a2 2 0 100 4 2 2 0 000-4z',
  cube:'M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.3L5.6 7.8 12 11.4l6.4-3.6L12 4.3zM5 9.6v6.8l6 3.3v-6.8L5 9.6zm14 0l-6 3.3v6.8l6-3.3V9.6z',
  lens:'M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z',
  check:'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  moon:'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z'
};
const BADGES=[
  {id:'first',  name:'First Signal',        icon:'star',  color:'#4aa3ff', how:'Start the conversation'},
  {id:'driver', name:'Lunar Driver',        icon:'wheel', color:'#fc3d21', how:'Complete the Hadley Rille drive'},
  {id:'explore',name:'Chassis Inspector',   icon:'cube',  color:'#3ddc84', how:'Inspect 3 parts of the 3D rover'},
  {id:'detect', name:'Geology Detective',   icon:'lens',  color:'#b48cff', how:'Open 5 NASA telemetry sheets'},
  {id:'ace',    name:'Traverse Ace',        icon:'check', color:'#ffc542', how:'Answer 7 memory checks correctly'},
  {id:'friend', name:'Hadley Explorer',     icon:'moon',  color:'#dfe8ff', how:'Complete the full traverse'}
];
const LEVELS=[[0,'New Contact'],[40,'Cadet Driver'],[120,'Traverse Navigator'],[220,'Field Geologist'],[320,'Crew Mate']];
const levelIdx=()=>{let k=0;LEVELS.forEach((l,i)=>{if(S.score>=l[0])k=i;});return k;};

const ASKINS={
  classic:{name:'Classic White',  suit:'#f2f4f8',visor:'#1b2b4d',acc:'#0b3d91',test:()=>true,                  req:'Starter'},
  orange: {name:'Orange Pioneer', suit:'#ff8a3d',visor:'#1b2b4d',acc:'#ffffff',test:()=>S.score>=40,           req:'Reach 40 pts'},
  blue:   {name:'Commander Blue', suit:'#4aa3ff',visor:'#0d1a33',acc:'#ffffff',test:()=>!!S.badges.friend,     req:'Finish the mission'},
  gold:   {name:'Gold Visor',     suit:'#f2f4f8',visor:'#c99a2e',acc:'#fc3d21',test:()=>!!S.badges.ace,        req:'Earn Traverse Ace'}
};
const RSKINS={
  classic:{name:'Flight Aluminum', frame:0xd4d9e2,accent:0xd8a640,em:0x000000,glow:'#4aa3ff',sw:'#d4d9e2',test:()=>true,                 req:'Starter'},
  gold:   {name:'Kapton Gold',     frame:0xd8a640,accent:0xfff1c2,em:0x000000,glow:'#ffc542',sw:'#d8a640',test:()=>S.score>=120,         req:'Reach 120 pts'},
  red:    {name:'Falcon Stripe',   frame:0xe5ebf5,accent:0xfc3d21,em:0x000000,glow:'#fc3d21',sw:'#fc3d21',test:()=>!!S.badges.explore,    req:'Inspect 3 parts'},
  night:  {name:'Earthshine Glow', frame:0x1c2c52,accent:0x3de1ff,em:0x0b4a7a,glow:'#3de1ff',sw:'#1c2c52',test:()=>!!S.badges.driver,     req:'Complete the drive'}
};

function astroSVG(id){
  const k=ASKINS[id]||ASKINS.classic;
  return `<svg class="uav" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="24" fill="#0a1226"/>
    <path d="M6 48c0-11 8-15 18-15s18 4 18 15z" fill="${k.suit}"/>
    <rect x="19" y="38" width="10" height="5" rx="1.5" fill="${k.acc}"/>
    <circle cx="24" cy="21" r="14" fill="${k.suit}" stroke="#9fb4d9" stroke-width="1.2"/>
    <ellipse cx="24.5" cy="21.5" rx="10" ry="8.4" fill="${k.visor}"/>
    <path d="M17 18c3-3 8-4 11-3" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function badgeSVG(b,on){
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2l15 8.5v19L20 38 5 29.5v-19z" fill="${on?b.color:'#2a3246'}" fill-opacity="${on?.28:1}" stroke="${on?b.color:'#4b5878'}" stroke-width="2"/>
    <g transform="translate(8 8) scale(1)"><path d="${ICON[b.icon]}" fill="${on?'#fff':'#7b88a8'}"/></g></svg>`;
}

function popup(msg){
  const p=el('div','pop',msg); document.body.appendChild(p); setTimeout(()=>p.remove(),3100);
}
function sysNote(html){
  chat.appendChild(el('div','sys-banner',html)); toBottom();
}
function award(key,pts,label){
  if(S.done[key]) return false;
  S.done[key]=1; const before=levelIdx(); S.score+=pts;
  popup(`+${pts} pts &middot; ${esc(label)}`);
  if(levelIdx()>before) setTimeout(()=>popup(`Rank up: ${LEVELS[levelIdx()][1]}`),1200);
  save(); renderSide(); return true;
}
function giveBadge(id){
  if(S.badges[id]) return;
  S.badges[id]=1; const b=BADGES.find(x=>x.id===id);
  popup(`Badge unlocked: ${esc(b.name)}`); save(); renderSide();
}

/* ---------- sidebar rendering ---------- */
function renderSide(){
  $('#scoreSide').textContent=S.score; $('#scoreTop').textContent=S.score;
  const i=levelIdx(); $('#lvlName').textContent=LEVELS[i][1];
  const lo=LEVELS[i][0], hi=LEVELS[i+1]?LEVELS[i+1][0]:null;
  $('#lvlBar').style.width=(hi?Math.min(100,(S.score-lo)/(hi-lo)*100):100)+'%';
  $('#lvlNext').textContent=hi?`${hi-S.score} pts to ${LEVELS[i+1][1]}`:'Maximum rank achieved.';

  $('#badges').innerHTML=BADGES.map(b=>{const on=!!S.badges[b.id];
    return `<div class="badge ${on?'on':'off'}" title="${esc(b.how)}">${badgeSVG(b,on)}<span>${esc(b.name)}</span></div>`;}).join('');

  const skinBtn=(map,cur,kind)=>Object.keys(map).map(id=>{
    const k=map[id], ok=k.test(), sel=cur===id;
    const sw=kind==='astro'?astroSVG(id).replace('class="uav"','width="38" height="38"'):`<span style="width:38px;height:38px;border-radius:50%;background:${k.sw};box-shadow:inset 0 0 0 2px rgba(255,255,255,.2)"></span>`;
    return `<button class="skin ${sel?'sel':''} ${ok?'':'lock'}" data-kind="${kind}" data-id="${id}" ${ok?'':'aria-disabled="true"'}>
      <span class="sw">${sw}</span><span><b>${esc(k.name)}</b><small>${ok?(sel?'Equipped':'Tap to equip'):'Locked: '+esc(k.req)}</small></span></button>`;
  }).join('');
  $('#astroSkins').innerHTML=skinBtn(ASKINS,S.astro,'astro');
  $('#roverSkins').innerHTML=skinBtn(RSKINS,S.rover,'rover');

  [['a',ASKINS],['r',RSKINS]].forEach(([p,map])=>Object.keys(map).forEach(id=>{
    const k=p+id; if(id!=='classic'&&map[id].test()&&!S.seenSkin[k]){S.seenSkin[k]=1;setTimeout(()=>popup(`New customization unlocked: ${esc(map[id].name)}`),1800);save();}
  }));
  document.documentElement.style.setProperty('--glow',RSKINS[S.rover].glow);
  document.querySelectorAll('.uav').forEach(n=>{n.outerHTML=astroSVG(S.astro);});
}
document.addEventListener('click',e=>{
  const b=e.target.closest('.skin'); if(!b||b.classList.contains('lock')) return;
  if(b.dataset.kind==='astro') S.astro=b.dataset.id; else {S.rover=b.dataset.id; if(viewer) viewer.setSkin(S.rover);}
  save(); renderSide();
});
$('#openSide').onclick=()=>$('#side').classList.add('open');
$('#closeSide').onclick=()=>$('#side').classList.remove('open');
$('#hero').onclick=()=>zoom($('#heroImg').src);
loadImg($('#heroImg'),IMG.rover,800); loadImg($('#headImg'),IMG.rover,200);

/* =====================================================================
   CHAT ENGINE
   ===================================================================== */
const chat=$('#chat'), statusEl=$('#status');
const toBottom=()=>{chat.scrollTop=chat.scrollHeight;};
const stamp=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const T=s=>String(s).replace(/\{name\}/g,esc(S.name||'friend'));
const smallAv=()=>{const d=el('div','av');const i=el('img');i.alt='';loadImg(i,IMG.rover,120);d.appendChild(i);return d;};

async function typing(ms){
  const row=el('div','row'); row.appendChild(smallAv()); row.appendChild(el('div','bub typing','<i></i><i></i><i></i>'));
  chat.appendChild(row); statusEl.textContent='transmitting...'; statusEl.className='live'; toBottom();
  await sleep(ms); row.remove(); statusEl.textContent='online from Hadley\u2013Apennine'; 
}
function moduleRow(content,wide){
  const row=el('div','row'); row.appendChild(smallAv());
  const b=el('div','bub'+(wide?' wide':'')); if(typeof content==='string') b.innerHTML=content; else b.appendChild(content);
  row.appendChild(b); chat.appendChild(row); toBottom(); return b;
}
async function say(text){
  const t=T(text); await typing(Math.min(1100,300+t.length*9));
  const b=moduleRow(t+`<span class="t">${stamp()}</span>`); return b;
}
async function youSay(text){
  const row=el('div','row me'); row.appendChild(el('div','bub',esc(text)+`<span class="t">${stamp()}</span>`));
  const a=el('div'); a.innerHTML=astroSVG(S.astro); row.appendChild(a.firstChild); chat.appendChild(row); toBottom();
}
function ask(options){
  return new Promise(res=>{
    const box=el('div','replies');
    options.forEach((o,i)=>{const b=el('button',null,esc(o)); b.onclick=()=>{box.remove();youSay(o);res(i);}; box.appendChild(b);});
    chat.appendChild(box); toBottom();
  });
}
async function photo(list,caption,tag){
  await typing(700);
  const wrap=el('div'); 
  const a=el('div','photo'); const img=el('img'); img.alt=caption; loadImg(img,list,1200); a.appendChild(img);
  a.onclick=()=>zoom(img.currentSrc||img.src); wrap.appendChild(a);
  wrap.appendChild(el('div','cap',(tag?`<span class="flag">${esc(tag)}</span> `:'')+T(caption)));
  return moduleRow(wrap,true);
}
async function widget(node){ await typing(600); return moduleRow(node,true); }
function chapter(n,title){
  chat.appendChild(el('div','chap',`PART ${n} OF ${TOTAL_CHAPTERS}<span>${esc(title)}</span>`)); toBottom();
  $('#progTxt').textContent=`Part ${n} of ${TOTAL_CHAPTERS}`; $('#progBar').style.width=(n/TOTAL_CHAPTERS*100)+'%';
}
function deepDive(key,title,rows){
  const d=el('details'); d.appendChild(el('summary',null,'NASA Telemetry Sheet: '+esc(title)));
  d.appendChild(el('div',null,`<table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table>`));
  d.addEventListener('toggle',()=>{ if(d.open && award('deep_'+key,5,'Opened NASA data sheet')){ S.deep++; save(); if(S.deep>=5) giveBadge('detect'); } });
  return moduleRow(d,true);
}
async function quiz(key,q,options,correct,explain){
  await typing(700);
  const box=el('div'); box.appendChild(el('span','flag','MEMORY CHECK'));
  box.appendChild(el('div',null,'<b>'+T(q)+'</b>'));
  const done=new Promise(res=>{
    options.forEach((o,i)=>{
      const b=el('button','opt',esc(o));
      b.onclick=()=>{
        box.querySelectorAll('.opt').forEach(x=>x.disabled=true);
        const ok=i===correct; b.classList.add(ok?'ok':'no'); if(!ok) box.querySelectorAll('.opt')[correct].classList.add('ok');
        res(ok);
      }; box.appendChild(b);
    });
  });
  moduleRow(box,true);
  const ok=await done;
  if(ok){ S.quizRight=(S.quizRight||0); if(!S.done['q_'+key]){S.quizRight++;} award('q_'+key,20,'Correct memory check'); if(S.quizRight>=7) giveBadge('ace'); save(); }
  else { award('qtry_'+key,5,'Tried memory check'); }
  await say(ok?`Spot on! ${explain}`:`Not quite—let me fill you in! ${explain}`);
  return ok;
}
function nameInput(){
  return new Promise(res=>{
    const row=el('div','replies');
    const inp=el('input'); inp.type='text'; inp.maxLength=14; inp.placeholder='Type your name...';
    inp.style.cssText='padding:9px 14px;border-radius:20px;border:1px solid var(--blue);background:rgba(0,0,0,.5);color:#fff;font-size:15px;min-width:190px';
    const b=el('button',null,'Send');
    const go=()=>{const v=inp.value.trim().slice(0,14)||'Explorer'; row.remove(); res(v);};
    b.onclick=go; inp.onkeydown=e=>{if(e.key==='Enter')go();};
    row.append(inp,b); chat.appendChild(row); toBottom(); inp.focus();
  });
}

/* =====================================================================
   3D VIEWER (3D LUNAR ROVING VEHICLE MODEL)
   ===================================================================== */
let viewer=null;
const PART_INFO={
  chassis:'<b>My Folding Aluminum Chassis.</b> An ultralight 3.1-meter welded aluminum frame hinged in three sections so I could fold up like an origami suitcase inside Falcon&rsquo;s descent bay!',
  wheels:'<b>My Four Wire-Mesh Wheels.</b> Instead of rubber tires—which would freeze, crack, or pop in a vacuum—my wheels are woven from zinc-coated piano wire with titanium chevron treads to grip loose lunar dust.',
  seats:'<b>My Folding Mesh Seats.</b> Two lightweight nylon-mesh lawn-style seats with seatbelts and footrests so Commander Dave Scott and Jim Irwin wouldn&rsquo;t bounce out in one-sixth gravity!',
  stick:'<b>My T-Shaped Hand Controller.</b> No steering wheel or foot pedals! Instead, a single T-stick between the seats: push forward to accelerate, tilt left or right to steer, and pull back to brake.',
  antenna:'<b>My High-Gain Umbrella Antenna.</b> Mounted on my front mast, this gold-mesh dish beamed live color TV directly from the Moon back to millions of living rooms on Earth.',
  camera:'<b>My Remote-Controlled TV Camera.</b> Flight controllers in Houston could tilt and zoom my front camera from 384,000 km away—even watching Falcon blast off when the mission ended!',
  batteries:'<b>My Dual Silver-Zinc Batteries.</b> Two non-rechargeable 36-volt batteries tucked behind my front grille gave me plenty of juice for 27.9 km of mountain climbing.',
  fenders:'<b>My Fiberglass Dust Fenders.</b> Curved guards over each wheel to stop sticky grey lunar dust from roostering onto my crew and cameras. (When one cracked, Dave fixed it with grey duct tape!)'
};

function buildViewer(box){
  const THREE=window.THREE;
  if(!THREE){box.innerHTML='<p class="pinfo">The 3D view needs an internet connection to load. Reconnect and reload the page.</p>';return null;}
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
  catch(e){ box.innerHTML='<p class="pinfo">Your browser could not start 3D graphics (WebGL).</p>'; return null; }
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
  box.appendChild(renderer.domElement);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(38,1,.1,100);
  scene.add(new THREE.AmbientLight(0xffffff,.78));
  const sun=new THREE.DirectionalLight(0xffffff,1.15); sun.position.set(6,9,5); scene.add(sun);
  const rim=new THREE.DirectionalLight(0x6fa8ff,.55); rim.position.set(-6,3,-6); scene.add(rim);

  const mats={}, parts={}, model=new THREE.Group(); scene.add(model);
  const mk=(n,c,o={})=>{mats[n]=new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:.55,roughness:.45},o));return mats[n];};
  const grp=n=>{const g=new THREE.Group();parts[n]=g;model.add(g);return g;};
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const strut=(a,b,r,m)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();
    const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),m);
    s.position.copy(a).addScaledVector(d,.5); s.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize()); return s;};

  const GROUND=-1.15;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(10,56),new THREE.MeshStandardMaterial({color:0x8d8b86,roughness:1,metalness:0}));
  ground.rotation.x=-Math.PI/2; ground.position.y=GROUND; model.add(ground);

  // chassis
  const cMat=mk('chassis',0xd4d9e2,{metalness:.65,roughness:.35});
  const chassis=grp('chassis');
  const deck=new THREE.Mesh(new THREE.BoxGeometry(3.4,.14,1.9),cMat); deck.position.y=-.35; chassis.add(deck);
  const rearRack=new THREE.Mesh(new THREE.BoxGeometry(.75,.55,1.65),cMat); rearRack.position.set(-1.35,-.02,0); chassis.add(rearRack);

  // batteries (front bay)
  const bat=grp('batteries'); const bMat=mk('batteries',0xd8a640,{metalness:.6,roughness:.35});
  const nose=new THREE.Mesh(new THREE.BoxGeometry(.75,.48,1.5),bMat); nose.position.set(1.38,-.06,0); bat.add(nose);

  // 4 wire-mesh wheels + suspension
  const wh=grp('wheels'); const wMat=mk('wheels',0x6b7280,{metalness:.75,roughness:.4});
  const hubMat=new THREE.MeshStandardMaterial({color:0xd8a640,metalness:.7,roughness:.3});
  const fen=grp('fenders'); const fMat=mk('fenders',0xf97316,{metalness:.2,roughness:.5});
  [[1.25,1.12],[1.25,-1.12],[-1.25,1.12],[-1.25,-1.12]].forEach(([x,z])=>{
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.52,.52,.32,24),wMat);
    tire.rotation.x=Math.PI/2; tire.position.set(x,GROUND+.52,z); wh.add(tire);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.35,16),hubMat);
    hub.rotation.x=Math.PI/2; hub.position.set(x,GROUND+.52,z); wh.add(hub);
    wh.add(strut(V(x,-.35,z*.7),V(x,GROUND+.52,z),.05,cMat));
    const arch=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.36,20,1,true,0,Math.PI),fMat);
    arch.rotation.set(Math.PI/2,Math.PI/2,0); arch.position.set(x,GROUND+.54,z); arch.material.side=THREE.DoubleSide;
    fen.add(arch);
  });

  // 2 seats
  const seats=grp('seats'); const sMat=mk('seats',0x334155,{metalness:.2,roughness:.75});
  [-.48,.48].forEach(z=>{
    const pan=new THREE.Mesh(new THREE.BoxGeometry(.55,.08,.52),sMat); pan.position.set(-.15,-.22,z); seats.add(pan);
    const back=new THREE.Mesh(new THREE.BoxGeometry(.08,.65,.52),sMat); back.position.set(-.42,.12,z); back.rotation.z=.15; seats.add(back);
  });

  // T-stick hand controller
  const stick=grp('stick'); const stMat=mk('stick',0xf8fafc,{metalness:.5,roughness:.3});
  stick.add(strut(V(.32,-.3,0),V(.28,.22,0),.035,stMat));
  const tbar=new THREE.Mesh(new THREE.BoxGeometry(.07,.07,.28),stMat); tbar.position.set(.28,.23,0); stick.add(tbar);

  // high-gain umbrella antenna
  const ant=grp('antenna'); const aMat=mk('antenna',0xfbbf24,{metalness:.75,roughness:.3});
  ant.add(strut(V(1.15,-.1,-.45),V(1.15,1.15,-.45),.035,cMat));
  const dish=new THREE.Mesh(new THREE.ConeGeometry(.65,.32,20,1,true),aMat);
  dish.position.set(1.15,1.22,-.45); dish.rotation.set(.45,0,-.35); dish.material.side=THREE.DoubleSide; ant.add(dish);

  // TV camera
  const cam=grp('camera'); const cmMat=mk('camera',0xe2e8f0,{metalness:.6,roughness:.3});
  cam.add(strut(V(1.25,-.1,.45),V(1.25,.55,.45),.03,cMat));
  const camBox=new THREE.Mesh(new THREE.BoxGeometry(.34,.24,.22),cmMat); camBox.position.set(1.25,.62,.45); cam.add(camBox);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.12,14),new THREE.MeshStandardMaterial({color:0x0f172a}));
  lens.rotation.z=Math.PI/2; lens.position.set(1.45,.62,.45); cam.add(lens);

  let yaw=.72,pitch=.34,dist=9.2,auto=true,hl=null;
  function setSkin(id){
    const k=RSKINS[id]||RSKINS.classic;
    mats.chassis.color.setHex(k.frame); mats.batteries.color.setHex(k.accent);
    ['chassis','batteries','wheels'].forEach(n=>{mats[n].emissive.setHex(k.em); mats[n].emissiveIntensity=k.em?.65:0;});
  }
  function highlight(name){hl={name,t0:performance.now()};auto=false;}
  function size(){const w=box.clientWidth||320,h=box.clientHeight||300; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();}
  new ResizeObserver(size).observe(box); size();
  let drag=null;
  box.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};auto=false;box.setPointerCapture(e.pointerId);});
  box.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.01;pitch=Math.max(.04,Math.min(1.2,pitch+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};});
  const end=()=>{drag=null;}; box.addEventListener('pointerup',end); box.addEventListener('pointercancel',end);
  box.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(5.5,Math.min(15,dist+e.deltaY*.008));},{passive:false});
  let visible=true; new IntersectionObserver(en=>{visible=en[0].isIntersecting;}).observe(box);
  (function loop(now){
    requestAnimationFrame(loop); if(!visible) return;
    if(auto) yaw+=.004;
    camera.position.set(dist*Math.cos(pitch)*Math.sin(yaw),dist*Math.sin(pitch)+.3,dist*Math.cos(pitch)*Math.cos(yaw)); camera.lookAt(0,-.15,0);
    Object.keys(mats).forEach(n=>{ if(hl&&hl.name===n){ const t=(now-hl.t0)/1000; if(t>2.6){hl=null;} else {mats[n].emissive.setHex(0xffc542); mats[n].emissiveIntensity=.35+.35*Math.sin(t*9);} }
      if(!hl||hl.name!==n){ const k=RSKINS[S.rover]||RSKINS.classic; const isGlow=(n==='chassis'||n==='batteries'||n==='wheels'); mats[n].emissive.setHex(isGlow?k.em:0x000000); mats[n].emissiveIntensity=isGlow&&k.em?.65:0; }});
    renderer.render(scene,camera);
  })(0);
  setSkin(S.rover);
  return {setSkin,highlight};
}

function modelWidget(){
  const wrap=el('div');
  wrap.appendChild(el('span','flag','3D ROVER VIEW'));
  const box=el('div','viewer'); wrap.appendChild(box);
  const info=el('div','pinfo','Drag to spin me around, zoom in, or tap any part below to see how I drove on the Moon.'); 
  const chips=el('div','chips');
  const names={chassis:'Chassis',wheels:'Wire Wheels',seats:'Seats',stick:'T-Stick',antenna:'Gold Antenna',camera:'TV Camera',batteries:'Batteries',fenders:'Fenders'};
  const onPart=k=>{
    info.innerHTML=PART_INFO[k]; chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
    if(viewer) viewer.highlight(k);
    S.parts[k]=1; save(); const n=Object.keys(S.parts).length;
    if(n>=3){ if(award('explore3',15,'Inspected 3 rover parts')) giveBadge('explore'); }
  };
  Object.keys(names).forEach(k=>{const b=el('button',null,names[k]); b.dataset.k=k; b.onclick=()=>onPart(k); chips.appendChild(b);});
  wrap.append(chips,info);
  box.appendChild(el('div','hint','Interactive teaching model'));
  return {wrap,box,mount(){ viewer=buildViewer(box); }};
}

/* =====================================================================
   INTERACTIVE LUNAR TRAVERSE SIMULATION
   ===================================================================== */
function traverseGame(){
  return new Promise(resolve=>{
    const wrap=el('div'); wrap.appendChild(el('span','flag','HADLEY RILLE TRAVERSE'));
    wrap.appendChild(el('div',null,'<b>Take the T-stick!</b> Drive me across the lunar plains, jump over craters, and collect <b>3 Moon rock samples</b> before my battery gets low.'));
    const cv=el('canvas','lg'); cv.width=340; cv.height=240; cv.style.marginTop='8px'; wrap.appendChild(cv);
    const ctl=el('div','ctl');
    const driveBtn=el('button','hold blue','HOLD TO DRIVE'); driveBtn.disabled=true;
    const hopBtn=el('button','hold','JUMP CRATER'); hopBtn.disabled=true;
    const start=el('button','btn','Start traverse'); const skip=el('button','btn','Continue story');
    ctl.append(driveBtn,hopBtn,start,skip); wrap.appendChild(ctl);
    const msg=el('div','pinfo','Batteries charged at 36 volts. Ready to roll!'); wrap.appendChild(msg);

    const c=cv.getContext('2d');
    const stars=Array.from({length:35},()=>[Math.random()*340,Math.random()*135,Math.random()*1.3+.3]);
    let running=false, finished=false, raf=0, last=0, gas=false;
    let st=null;
    const GY=195;

    function reset(){
      st={dist:0, goal:1000, y:0, vy:0, rocks:0, bat:100, hitTimer:0,
          items:[
            {x:240, type:'crater', done:false},
            {x:370, type:'rock',   done:false},
            {x:530, type:'crater', done:false},
            {x:660, type:'rock',   done:false},
            {x:820, type:'crater', done:false},
            {x:930, type:'rock',   done:false}
          ]};
    }

    function drawRover(x,y){
      c.save(); c.translate(x,y);
      c.fillStyle='#d4d9e2'; c.fillRect(-20,-12,40,5);
      c.fillStyle='#d8a640'; c.fillRect(12,-17,8,6);
      c.fillStyle='#334155'; c.fillRect(-10,-22,4,10);
      c.fillStyle='#f8fafc'; c.beginPath(); c.arc(-4,-24,5,0,6.28); c.fill();
      c.fillStyle='#c99a2e'; c.fillRect(-2,-26,4,3);
      c.strokeStyle='#fbbf24'; c.lineWidth=1.5; c.beginPath(); c.moveTo(8,-12); c.lineTo(8,-27); c.lineTo(15,-31); c.stroke();
      [-13,13].forEach(wx=>{
        c.fillStyle='#4b5563'; c.beginPath(); c.arc(wx,-4,6,0,6.28); c.fill();
        c.strokeStyle='#fbbf24'; c.lineWidth=1.5; c.stroke();
      });
      c.restore();
    }

    function draw(){
      c.clearRect(0,0,340,240); c.fillStyle='#02040b'; c.fillRect(0,0,340,240);
      c.fillStyle='#fff'; stars.forEach(s=>c.fillRect(s[0],s[1],s[2],s[2]));
      c.fillStyle='#1c2230'; c.beginPath(); c.moveTo(0,GY); c.lineTo(75,135); c.lineTo(155,165); c.lineTo(240,122); c.lineTo(340,160); c.lineTo(340,GY); c.fill();
      c.fillStyle='#8d8b86'; c.fillRect(0,GY,340,45);

      if(!st) return;
      st.items.forEach(it=>{
        const sx=75+(it.x-st.dist);
        if(sx<-40 || sx>380) return;
        if(it.type==='crater'){
          c.fillStyle='#4a4843'; c.beginPath(); c.ellipse(sx,GY+4,18,5,0,0,6.28); c.fill();
        } else if(!it.done){
          c.fillStyle='#ffc542'; c.beginPath(); c.moveTo(sx,GY-12); c.lineTo(sx+8,GY-2); c.lineTo(sx-8,GY-2); c.closePath(); c.fill();
        }
      });

      drawRover(75, GY - st.y);

      c.font='600 13px Barlow, sans-serif';
      c.fillStyle='#dce8ff'; c.fillText(`Samples: ${st.rocks} / 3`,12,20);
      c.fillText(`Distance: ${Math.min(1000,Math.floor(st.dist))} / 1000 m`,12,38);
      c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(225,11,102,9);
      c.fillStyle=st.bat>25?'#3ddc84':'#fc3d21'; c.fillRect(225,11,102*Math.max(0,st.bat)/100,9);
      c.fillStyle='#dce8ff'; c.fillText('36V Battery',225,35);
    }

    function hop(){
      if(running && st.y<=1) st.vy=145;
    }

    function step(now){
      if(!running) return;
      const dt=Math.min(.05,(now-last)/1000); last=now;
      if(st.hitTimer>0) st.hitTimer-=dt;

      const speed=gas?135:45;
      st.dist+=speed*dt;
      st.bat-= (gas?4.2:1.6)*dt;

      st.y+=st.vy*dt;
      if(st.y>0 || st.vy>0){ st.vy-=260*dt; if(st.y<=0){ st.y=0; st.vy=0; } }

      st.items.forEach(it=>{
        if(it.done) return;
        if(Math.abs(it.x - st.dist) < 16){
          if(it.type==='rock' && st.y<18){
            it.done=true; st.rocks++;
            msg.innerHTML=`<b>Sample collected!</b> (${st.rocks} of 3 lunar rocks secured)`;
          } else if(it.type==='crater' && st.y<10 && st.hitTimer<=0){
            it.done=true; st.bat=Math.max(10,st.bat-12); st.hitTimer=.6;
            msg.innerHTML='<b>Bumped a crater!</b> One-sixth gravity makes bounces floaty—tap Jump earlier!';
          }
        }
      });

      if(st.dist>=st.goal || st.bat<=0){
        running=false; finished=true; cancelAnimationFrame(raf);
        driveBtn.disabled=true; hopBtn.disabled=true; start.style.display='none'; skip.style.display='none'; cleanup();
        msg.innerHTML=`<b>Traverse complete!</b> You covered 1,000 meters and gathered <b>${st.rocks} sample(s)</b>. On Apollo 15, we drove 27.9 km and brought back 77.31 kg!`;
        draw(); resolve({success:true,rocks:st.rocks}); return;
      }
      draw(); raf=requestAnimationFrame(step);
    }

    function begin(){
      reset(); running=true; driveBtn.disabled=false; hopBtn.disabled=false; start.style.display='none';
      msg.textContent='Hold Drive to speed up and tap Jump over craters!';
      last=performance.now(); raf=requestAnimationFrame(step);
    }

    driveBtn.addEventListener('pointerdown',e=>{e.preventDefault();gas=true;});
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>driveBtn.addEventListener(ev,()=>gas=false));
    hopBtn.addEventListener('pointerdown',e=>{e.preventDefault();hop();});
    const kd=e=>{if(!running)return; if(e.code==='ArrowRight'||e.code==='KeyD')gas=true; if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();hop();}};
    const ku=e=>{if(e.code==='ArrowRight'||e.code==='KeyD')gas=false;};
    addEventListener('keydown',kd); addEventListener('keyup',ku);
    function cleanup(){removeEventListener('keydown',kd);removeEventListener('keyup',ku);}

    start.onclick=begin;
    skip.onclick=()=>{if(finished)return;finished=true;running=false;cancelAnimationFrame(raf);cleanup();[driveBtn,hopBtn,start,skip].forEach(b=>b.disabled=true);resolve({skipped:true});};
    reset(); draw();
    moduleRow(wrap,true);
  });
}

/* =====================================================================
   DIAGRAMS (APOLLO 15 LANDING SITE & 3 EVA TRAVERSES)
   ===================================================================== */
function moonMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY HOME AT HADLEY\u2013APENNINE'));
  const box=el('div','mapbox'); const img=el('img'); img.alt='The Moon, with Hadley-Apennine marked'; loadImg(img,IMG.moon,800); box.appendChild(img);
  const dot=el('div','dot'); dot.style.left='53%'; dot.style.top='29%'; box.appendChild(dot);
  box.appendChild(el('div','lab','Hadley&ndash;Apennine (Mare Imbrium): 26.13239&deg; N, 3.63330&deg; E.'));
  w.appendChild(box); return w;
}

function traverseMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY THREE LUNAR ROAD TRIPS'));
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 320 260'); svg.setAttribute('class','diag');
  const info=el('div','pinfo','Tap any route below to inspect the three geological drives we completed.');
  const routes={
    eva1:'<b>EVA 1 (31 July 1971 &middot; 10.3 km):</b> Our maiden drive southwest to the rim of <b>Hadley Rille</b>, past Elbow Crater and St. George Crater, then back to deploy ALSEP.',
    eva2:'<b>EVA 2 (1 August 1971 &middot; 12.5 km):</b> Our longest drive! Southeast along the towering <b>Apennine Mountain front</b> near Spur Crater, where we found the 4-billion-year-old Genesis Rock.',
    eva3:'<b>EVA 3 (2 August 1971 &middot; 5.1 km):</b> Northwest past Scarp Crater and right along the steep canyon edge of <b>Hadley Rille</b> before parking for the final TV broadcast.'
  };
  svg.innerHTML=`<rect width="320" height="260" fill="#232220"/>
    <!-- Hadley Rille canyon -->
    <path d="M 95,10 Q 115,95 65,175 T 45,255" fill="none" stroke="#11100f" stroke-width="18" stroke-linecap="round"/>
    <text x="20" y="135" style="fill:#94a3b8">Hadley Rille</text>
    <!-- Apennine Mountains -->
    <polygon points="180,255 255,155 320,175 320,255" fill="#3a3834"/>
    <text x="215" y="235" style="fill:#cbd5e1">Apennine Mts</text>
    <!-- EVA 1 -->
    <path class="hit" data-r="eva1" d="M 165,115 L 110,155 L 95,215 L 165,115" fill="none" stroke="#4aa3ff" stroke-width="3.5" stroke-dasharray="5 3"/>
    <!-- EVA 2 -->
    <path class="hit" data-r="eva2" d="M 165,115 L 210,165 L 250,205 L 165,115" fill="none" stroke="#ffc542" stroke-width="3.5"/>
    <!-- EVA 3 -->
    <path class="hit" data-r="eva3" d="M 165,115 L 115,85 L 105,55 L 165,115" fill="none" stroke="#3ddc84" stroke-width="3.5"/>
    <!-- Falcon LM -->
    <circle cx="165" cy="115" r="6" fill="#fc3d21" stroke="#fff" stroke-width="1.5"/>
    <text x="175" y="113" style="font-weight:600">Falcon LM</text>
    <text x="10" y="20" style="fill:#4aa3ff">--- EVA 1 (10.3 km)</text>
    <text x="10" y="36" style="fill:#ffc542">&mdash; EVA 2 (12.5 km)</text>
    <text x="10" y="52" style="fill:#3ddc84">&mdash; EVA 3 (5.1 km)</text>`;
  svg.querySelectorAll('.hit').forEach(p=>p.addEventListener('click',()=>{info.innerHTML=routes[p.dataset.r];}));
  w.append(svg,info); return w;
}

/* =====================================================================
   NARRATIVE STORY (FIRST-PERSON HARDWARE VOICE, NO GAME META-TALK)
   ===================================================================== */
async function story(){
  /* ---------------- Part 1 ---------------- */
  chapter(1,'Wheels on the Moon');
  await say('<i>*Bzzzt... whirrr...*</i> Greetings, Earth! My S-band umbrella dish just locked onto your receiver from the edge of <b>Mare Imbrium</b>.');
  await say('I&rsquo;m the <b>Apollo 15 Lunar Roving Vehicle</b>—the very first electric car ever driven on another world! Back in July 1971, I turned moonwalks from short strolls into full-blown mountain expeditions.');
  if(S.name){
    await say('Hey again, <b>{name}</b>! My wire wheels are still parked in the grey dust at Hadley&ndash;Apennine. Ready to roll back through my 1971 road trips?');
  } else {
    await say('Before I tell you how it felt to bounce across lunar craters at 13 kilometers an hour, who am I talking to?');
    S.name=await nameInput(); save();
    await youSay(S.name);
    await say('Awesome to meet you, <b>{name}</b>! Buckle your seatbelt—one-sixth gravity makes every bump feel like flying in slow motion.');
  }
  award('first',10,'First signal received'); giveBadge('first');
  const a1=await ask(['How did you fit inside a rocket?!','Tell me about your crew!']);
  await say(a1===0?'That was pure engineering magic! Let me tell you how I folded up like a suitcase.':'I carried two fearless explorers: Commander David Scott and Lunar Module Pilot James Irwin!');
  await say('Before Apollo 15, astronauts on Apollo 11, 12, and 14 had to walk everywhere in heavy spacesuits—so they could barely wander a few hundred meters from their lander. NASA needed wheels.');
  await say('To hitch a ride to the Moon on <b>30 July 1971</b>, I folded my frame in three places and tucked my wheels flat inside Quadrant 1 of the Lunar Module <b>&ldquo;Falcon.&rdquo;</b> Once we landed, Dave and Jim pulled a few release cords and I unfolded right onto the dust!');
  await photo(IMG.rover,'That&rsquo;s me parked near the edge of Hadley Rille in July 1971, with Mount Hadley Delta towering behind me!','REAL NASA PHOTO');
  await say('For the first time in history, humans had a personal off-road explorer waiting outside their spacecraft door.');
  award('c1',10,'Part 1 complete');
  await ask(['Show me how you were built!']);

  /* ---------------- Part 2 ---------------- */
  chapter(2,'Built for the Vacuum');
  await say('If you tried driving an Earth car on the Moon, its rubber tires would freeze and shatter, its engine would suffocate without air, and it would weigh way too much for a rocket to carry.');
  const mw=modelWidget(); await widget(mw.wrap); mw.mount();
  await say('Spin my 3D chassis around right here and tap my parts! Check out my <b>piano-wire mesh wheels</b>, my <b>T-shaped hand stick</b>, and the gold umbrella antenna on my nose.');
  await ask(['I inspected your parts!','Keep rolling with the story']);
  await say('I weighed only about <b>210 kg on Earth</b>—roughly 35 kg in lunar gravity—yet I could carry more than double my own weight in astronauts, cameras, tools, and Moon rocks!');
  deepDive('specs','My Engineering Specs (NASA NSSDCA 1971-063C)',[
    ['Mission','Apollo 15 (launched 26 July 1971, landed 30 July 1971)'],
    ['Landing site','Hadley&ndash;Apennine (26.13239&deg; N, 3.63330&deg; E)'],
    ['Total distance driven','27.9 km across 3 EVAs'],
    ['Max radius from LM','Within 5 km of Falcon'],
    ['Samples returned','77.31 kg of lunar rock and soil'],
    ['Drive system','Four individual electric wheel-drive motors + four-wheel steering'],
    ['Power source','Two 36-volt silver-zinc batteries'],
    ['Controls','Central T-shaped hand controller (no steering wheel or pedals)']
  ]);
  await quiz('wheels',"What were my four tires made of so they wouldn't pop or freeze on the Moon?",['Solid steel','Woven zinc-coated piano wire with titanium treads','Pressurized space rubber'],1,'Woven piano-wire mesh with titanium chevron treads—flexible, lightweight, and immune to vacuum temperatures!');
  award('c2',10,'Part 2 complete');
  await say('Now let&rsquo;s hit the lunar trail!');
  await ask(["Let's go for a drive!"]);

  /* ---------------- Part 3 ---------------- */
  chapter(3,'Cruising Hadley Rille');
  await say('On <b>31 July 1971</b>, Dave Scott slid into my left mesh seat, gripped my T-stick, and pushed forward. My four electric wheel motors hummed silently in the vacuum as my wire tires kicked up rooster tails of grey dust!');
  await say('Because there&rsquo;s no air on the Moon, dust doesn&rsquo;t swirl in clouds—every grain flies in a clean parabola and drops straight back down. Take the T-stick yourself and feel what driving across Hadley Plains was like!');
  const g=await traverseGame();
  if(g.success){
    if(award('drive',30,'Completed Hadley Rille traverse')){ giveBadge('driver'); }
    await say(`Nice driving, <b>{name}</b>! You snagged <b>${g.rocks} sample(s)</b> and handled that one-sixth gravity bounce like a pro.`);
  } else {
    await say('Driving on powdery regolith takes a gentle touch—even Commander Scott had to watch out for hidden craters!');
  }
  await widget(moonMap());
  await say('We were exploring <b>Hadley&ndash;Apennine</b>, a dramatic valley squeezed between the towering Apennine Mountains and a winding, mile-wide canyon called <b>Hadley Rille</b>.');
  await photo(IMG.rille,'Look at the edge of Hadley Rille—a giant ancient lava channel we drove right up to during our traverses!','REAL NASA PHOTO');
  deepDive('eva1','First Traverse Log (31 July 1971)',[
    ['EVA 1 duration','6 hours 32 minutes (13:13:10 to 19:45:59 UT)'],
    ['Traverse distance','10.3 km'],
    ['Key stops','Edge of Hadley Rille, Elbow Crater, near St. George Crater'],
    ['Deep core sample','Drilled 3 meters beneath the lunar surface at the LM site'],
    ['Surface station','Apollo Lunar Surface Experiments Package (ALSEP) deployed']
  ]);
  await quiz('dist','How far did I drive in total during the Apollo 15 mission?',['2.79 km','27.9 km','279 km'],1,'27.9 kilometers across three geological excursions—more than ten times farther than any previous Apollo crew!');
  award('c3',10,'Part 3 complete');
  await ask(['What did you discover on your drives?']);

  /* ---------------- Part 4 ---------------- */
  chapter(4,'Hunting Ancient Moon Rocks');
  await say('Because I could carry them up to <b>5 kilometers</b> away from Falcon, Dave and Jim became the first field geologists on another planet.');
  await widget(traverseMap());
  await say('On our second drive on <b>1 August 1971</b>, we climbed <b>12.5 kilometers</b> southeast along the base of the Apennine Mountains. Near <b>Spur Crater</b>, Dave spotted a glittering white crystal sitting on a pedestal of rock—the famous <b>&ldquo;Genesis Rock,&rdquo;</b> over four billion years old!');
  await photo(IMG.driver,'Jim Irwin standing beside me with Mount Hadley rising in the background while we loaded rock bags onto my rear rack.','REAL NASA PHOTO');
  await say('By the time we finished our third drive on <b>2 August</b>, my rear storage rack was packed with <b>77.31 kilograms</b> of lunar rocks and soil—including a deep core drilled <b>3 meters</b> straight into the Moon!');
  deepDive('eva23','Traverses 2 &amp; 3 Log (1–2 August 1971)',[
    ['EVA 2 (1 August)','12.5 km southeast along Apennine front (Index, Arbeit, Crescent, Dune, Spur craters)'],
    ['EVA 3 (2 August)','5.1 km northwest past Scarp Crater and along Hadley Rille'],
    ['Total EVA time','18 hours 35 minutes across all three moonwalks'],
    ['Total geological haul','77.31 kg of rock and regolith samples'],
    ['ALSEP instruments','7 experiments (seismometer, magnetometer, heat flow, solar wind, ion &amp; dust detectors)']
  ]);
  await quiz('haul','How much lunar rock and soil did we collect during our traverses?',['7.73 kg','21.55 kg','77.31 kg'],2,'77.31 kg of rocks and core samples—more than triple the haul of Apollo 11!');
  award('c4',10,'Part 4 complete');
  await ask(['Did you film any science experiments too?']);

  /* ---------------- Part 5 ---------------- */
  chapter(5,'The Hammer and the Feather');
  await say('One of my favorite moments happened right beside me after our final drive ended. My front TV camera was rolling live for viewers back on Earth.');
  await say('Dave Scott stepped in front of my lens holding a <b>1.32 kg geological hammer</b> in his right hand and a <b>0.03 kg falcon feather</b> in his left hand—testing Galileo&rsquo;s famous theory from 380 years earlier.');
  await say('Because the Moon has no air resistance to slow the feather down, when Dave let go of both at the exact same instant, <b>they hit the lunar dust together!</b> &ldquo;How about that!&rdquo; Dave cheered into my microphone. &ldquo;Mr. Galileo was correct!&rdquo;');
  deepDive('science','Special Surface Experiments &amp; Memorial',[
    ['Galileo demonstration','Hammer (1.32 kg) and falcon feather (0.03 kg) dropped simultaneously in vacuum'],
    ['Solar Wind Composition','Foil sheet exposed to trap solar wind particles for return to Earth'],
    ['Soil Mechanics','Trenching and penetrometer tests on lunar regolith'],
    ['Fallen Astronaut','Small aluminum sculpture &amp; plaque honoring 14 US and Soviet space explorers']
  ]);
  await quiz('galileo','Why did the hammer and the feather hit the Moon at the exact same time?',['The Moon has no air resistance (vacuum)','The feather was made of metal','Magnets pulled them down'],0,'Without air drag, gravity accelerates all objects equally regardless of their mass!');
  award('c5',10,'Part 5 complete');
  await ask(['What happened when Falcon blasted off?']);

  /* ---------------- Part 6 ---------------- */
  chapter(6,'Camera Duty at Liftoff');
  await say('Even after Dave and Jim climbed back inside Falcon on <b>2 August 1971</b>, my job wasn&rsquo;t over! They parked me about <b>100 meters east-southeast</b> of the lander so my camera had a front-row seat.');
  await say('At <b>17:11:22 UT</b>, flight controllers in Houston sent remote commands through my gold antenna to tilt my TV lens upward right as Falcon&rsquo;s ascent engine ignited!');
  await say('For the very first time, Earth watched a spacecraft blast off from the Moon live on television—sparks and Kapton foil flying everywhere as my crew rocketed up to dock with Al Worden aboard Endeavour.');
  deepDive('liftoff','Liftoff &amp; End of Surface Operations',[
    ['Surface stay duration','66 hours 55 minutes at Hadley&ndash;Apennine'],
    ['LM liftoff','17:11:22 UT, 2 August 1971 (filmed live by LRV camera)'],
    ['CSM docking','19:09:47 UT, 2 August 1971'],
    ['LM ascent impact','Jettisoned 3 August; impacted Moon at 26.36&deg; N, 0.25&deg; E'],
    ['ALSEP operation','Ran continuously until 30 September 1977']
  ]);
  await quiz('cam','How did my TV camera follow Falcon lifting off from the Moon after the astronauts were already inside?',['It moved automatically by timer','Flight controllers in Houston steered it by remote control','An astronaut stayed behind to film'],1,'Controllers on Earth commanded my pan-and-tilt camera over S-band radio across 384,000 km of space!');
  award('c6',10,'Part 6 complete');
  await ask(['Are you still parked on the Moon today?']);

  /* ---------------- Part 7 ---------------- */
  chapter(7,'Still Parked by Hadley Rille');
  await say('Right where Dave parked me in August 1971! My 36-volt batteries ran out decades ago, and my nylon seats have bleached white under fifty-plus years of unfiltered sunlight—but my aluminum frame and wire wheels are completely intact.');
  await say('Two younger brothers of mine followed right in my tire tracks: <b>Apollo 16&rsquo;s rover</b> drove 26.7 km in the Descartes Highlands, and <b>Apollo 17&rsquo;s rover</b> set the lunar distance record at 35.9 km in Taurus&ndash;Littrow!');
  await say('Before you head off to explore other worlds, want to take a quick three-question check on our Hadley&ndash;Apennine road trip?');
  await ask(['Bring it on!']);
  const q1=await quiz('f1','Which Apollo mission carried me to the Moon in July 1971?',['Apollo 11','Apollo 15','Apollo 17'],1,'Apollo 15—the first mission equipped with a Lunar Roving Vehicle!');
  const q2=await quiz('f2','What was the name of the winding canyon we explored during our drives?',['Hadley Rille','Sea of Tranquility','Gusev Crater'],0,'Hadley Rille, right beside the Apennine Mountains in Mare Imbrium.');
  const q3=await quiz('f3','How did the astronauts steer and drive me?',['With a central T-shaped hand stick','With a round steering wheel and foot pedals','By voice commands'],0,'A single T-shaped hand controller between the two seats controlled speed, steering, and braking.');
  award('c7',10,'Part 7 complete');
  const right=[q1,q2,q3].filter(Boolean).length;
  await say(right===3?'Three out of three! You&rsquo;re ready to drive on any world in the solar system, <b>{name}</b>.':`${right} out of 3! Great job riding shotgun with me across Mare Imbrium, <b>{name}</b>.`);
  giveBadge('friend'); award('end',40,'Traverse story completed');
  sysNote('Mission Complete! New badges and rover chassis finishes are now available in your sidebar profile.');
  await say('Ready for an even bigger road trip? My robotic cousins <b>Spirit</b> and <b>Opportunity</b> rolled across the red deserts of <b>Mars</b>—go hear their stories next!');
  const end=el('div'); end.appendChild(el('span','flag','CONTINUE EXPLORING'));
  const links=el('div','end',`<a class="btn red" href="${NEXT_PAGE}">Meet the Mars Rovers</a><a class="btn" href="${HOME}">Back to the roadmap</a><button class="btn" id="again">Replay this traverse</button>`);
  end.appendChild(links); await widget(end);
  $('#again').onclick=()=>location.reload();
}

/* ---------- start ---------- */
renderSide();
story().catch(err=>{console.error(err);moduleRow('Transmission interrupted. Please reload the page.');});