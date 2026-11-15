'use strict';
/* =====================================================================
   CONFIG - MARS EXPLORATION ROVER SPIRIT (MER-A)
   ===================================================================== */
const FAST = /[?&]fast=1/.test(location.search);
const NEXT_PAGE = 'opportunity.html', HOME = 'index.html';
const TOTAL_CHAPTERS = 7;

const IMG = {
  bg:      ['File:ESO - Milky Way.jpg'],
  rover:   ['File:NASA Mars Rover.jpg', 'search:Mars Exploration Rover Spirit artist', 'File:PIA04413 - Mars Exploration Rover.jpg'],
  lander:  ['search:PIA05138 Columbia Memorial Station', 'search:Spirit landing platform airbags Gusev', 'File:NASA Mars Rover.jpg'],
  hills:   ['search:Spirit Husband Hill Columbia Hills', 'search:PIA07269 Gusev Crater hills', 'File:NASA Mars Rover.jpg'],
  silica:  ['search:Home Plate Spirit Mars rover', 'search:PIA10214 Spirit silica Mars', 'File:NASA Mars Rover.jpg'],
  mars:    ['File:OSIRIS Mars true color.jpg', 'search:Mars globe true color']
};

/* =====================================================================
   HELPERS + SAVED STATE
   ===================================================================== */
const $  = (s,r=document)=>r.querySelector(s);
const el = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms=>new Promise(r=>setTimeout(r,FAST?0:ms));

const KEY='astrotales.spirit.v1';
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
   BADGES, LEVELS, SKINS
   ===================================================================== */
const ICON={
  star:'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z',
  wheel:'M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 110 12 6 6 0 010-12zm0 4a2 2 0 100 4 2 2 0 000-4z',
  cube:'M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.3L5.6 7.8 12 11.4l6.4-3.6L12 4.3zM5 9.6v6.8l6 3.3v-6.8L5 9.6zm14 0l-6 3.3v6.8l6-3.3V9.6z',
  lens:'M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z',
  check:'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  mars:'M12 2a10 10 0 100 20 10 10 0 000-20zm-3 6a3 3 0 110 6 3 3 0 010-6zm7 7a2 2 0 110 4 2 2 0 010-4z'
};
const BADGES=[
  {id:'first',  name:'First Signal',        icon:'star',  color:'#fc3d21', how:'Start the conversation'},
  {id:'driver', name:'Gusev Climber',       icon:'wheel', color:'#ff8a3d', how:'Complete the Columbia Hills drive'},
  {id:'explore',name:'Chassis Inspector',   icon:'cube',  color:'#3ddc84', how:'Inspect 3 parts of the 3D rover'},
  {id:'detect', name:'Silica Detective',    icon:'lens',  color:'#b48cff', how:'Open 5 NASA telemetry sheets'},
  {id:'ace',    name:'Gusev Ace',           icon:'check', color:'#ffc542', how:'Answer 7 memory checks correctly'},
  {id:'friend', name:'Spirit of Mars',      icon:'mars',  color:'#ff6b4a', how:'Complete Spirit’s full story'}
];
const LEVELS=[[0,'New Contact'],[40,'Gusev Scout'],[120,'Hill Climber'],[220,'Field Geologist'],[320,'Martian Pioneer']];
const levelIdx=()=>{let k=0;LEVELS.forEach((l,i)=>{if(S.score>=l[0])k=i;});return k;};

const ASKINS={
  classic:{name:'Classic White',  suit:'#f2f4f8',visor:'#1b2b4d',acc:'#fc3d21',test:()=>true,                  req:'Starter'},
  orange: {name:'Ares Orange',    suit:'#ff8a3d',visor:'#1b2b4d',acc:'#ffffff',test:()=>S.score>=40,           req:'Reach 40 pts'},
  blue:   {name:'JPL Flight Blue',suit:'#4aa3ff',visor:'#0d1a33',acc:'#ffffff',test:()=>!!S.badges.friend,     req:'Finish the mission'},
  gold:   {name:'Gold Visor',     suit:'#f2f4f8',visor:'#c99a2e',acc:'#fc3d21',test:()=>!!S.badges.ace,        req:'Earn Gusev Ace'}
};
const RSKINS={
  classic:{name:'Aerogel Gold',   frame:0xd8a640,accent:0x1e293b,em:0x000000,glow:'#fc3d21',sw:'#d8a640',test:()=>true,                 req:'Starter'},
  dust:   {name:'Gusev Red Dust', frame:0xc85a32,accent:0xfbbf24,em:0x000000,glow:'#ff8a3d',sw:'#c85a32',test:()=>S.score>=120,         req:'Reach 120 pts'},
  white:  {name:'Cleanroom White',frame:0xe5ebf5,accent:0x0b3d91,em:0x000000,glow:'#4aa3ff',sw:'#e5ebf5',test:()=>!!S.badges.explore,    req:'Inspect 3 parts'},
  night:  {name:'Sol 2000 Glow',  frame:0x1c2c52,accent:0x3de1ff,em:0x0b4a7a,glow:'#3de1ff',sw:'#1c2c52',test:()=>!!S.badges.driver,     req:'Complete the drive'}
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
  chat.appendChild(row); statusEl.textContent='transmitting via Deep Space Network...'; statusEl.className='live'; toBottom();
  await sleep(ms); row.remove(); statusEl.textContent='online from Gusev Crater'; 
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
   3D VIEWER (3D MARS EXPLORATION ROVER MODEL)
   ===================================================================== */
let viewer=null;
const PART_INFO={
  body:'<b>My Warm Electronics Box (WEB).</b> My gold-foil-wrapped insulated torso protected my computer brain and lithium-ion batteries from Martian winter nights that plunge below &minus;90&deg;C!',
  wheels:'<b>My Six Rocker-Bogie Wheels.</b> Each aluminum wheel has its own motor and cleats—and my front and rear wheels steer independently so I could spin 360&deg; in place or climb steep rocky slopes!',
  mast:'<b>My Panoramic Camera Mast (Pancam).</b> Standing 1.5 meters tall—human eye level!—my twin stereo color cameras and Mini-TES infrared spectrometer gave Earth its sharpest views of Mars.',
  solar:'<b>My Triple-Junction Solar Wings.</b> Spread like butterfly wings across my back, these solar arrays powered me for over six years—even after Martian whirlwinds ("dust devils") surprisingly swept them clean!',
  arm:'<b>My Robotic Instrument Arm (IDD).</b> Folded neatly under my front bumper while driving, it unfolded like a geologist’s hand carrying a microscope, two spectrometers, and a rock grinder (RAT).',
  antenna:'<b>My High-Gain & Low-Gain Antennas.</b> My steerable dish beamed high-rate data straight to NASA’s Deep Space Network on Earth, while my UHF antenna relayed photos through Mars Odyssey overhead.'
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
  const sun=new THREE.DirectionalLight(0xfff2e0,1.2); sun.position.set(6,9,5); scene.add(sun);
  const rim=new THREE.DirectionalLight(0xff7847,.55); rim.position.set(-6,3,-6); scene.add(rim);

  const mats={}, parts={}, model=new THREE.Group(); scene.add(model);
  const mk=(n,c,o={})=>{mats[n]=new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:.55,roughness:.45},o));return mats[n];};
  const grp=n=>{const g=new THREE.Group();parts[n]=g;model.add(g);return g;};
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const strut=(a,b,r,m)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();
    const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),m);
    s.position.copy(a).addScaledVector(d,.5); s.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize()); return s;};

  const GROUND=-1.15;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(10,56),new THREE.MeshStandardMaterial({color:0x9c4a32,roughness:1,metalness:0}));
  ground.rotation.x=-Math.PI/2; ground.position.y=GROUND; model.add(ground);

  // Warm Electronics Box (body)
  const bMat=mk('body',0xd8a640,{metalness:.65,roughness:.35});
  const body=grp('body');
  const boxMesh=new THREE.Mesh(new THREE.BoxGeometry(1.55,.68,1.25),bMat); boxMesh.position.y=-.22; body.add(boxMesh);

  // Solar Wings (deck)
  const sMat=mk('solar',0x182848,{metalness:.7,roughness:.25});
  const solar=grp('solar');
  const centerDeck=new THREE.Mesh(new THREE.BoxGeometry(1.75,.07,1.45),sMat); centerDeck.position.y=.15; solar.add(centerDeck);
  const leftWing=new THREE.Mesh(new THREE.BoxGeometry(1.4,.06,.85),sMat); leftWing.position.set(-.1,.13,1.12); leftWing.rotation.x=.12; solar.add(leftWing);
  const rightWing=new THREE.Mesh(new THREE.BoxGeometry(1.4,.06,.85),sMat); rightWing.position.set(-.1,.13,-1.12); rightWing.rotation.x=-.12; solar.add(rightWing);

  // 6 Rocker-Bogie Wheels
  const wh=grp('wheels'); const wMat=mk('wheels',0x374151,{metalness:.75,roughness:.45});
  const hubMat=new THREE.MeshStandardMaterial({color:0xd8a640,metalness:.7,roughness:.3});
  const legMat=new THREE.MeshStandardMaterial({color:0xcbd5e1,metalness:.7,roughness:.35});
  [[1.15,1.08],[1.15,-1.08],[0,1.14],[0,-1.14],[-1.15,1.08],[-1.15,-1.08]].forEach(([x,z])=>{
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.26,22),wMat);
    tire.rotation.x=Math.PI/2; tire.position.set(x,GROUND+.36,z); wh.add(tire);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.29,14),hubMat);
    hub.rotation.x=Math.PI/2; hub.position.set(x,GROUND+.36,z); wh.add(hub);
    wh.add(strut(V(x*.45,-.22,z*.62),V(x,GROUND+.36,z),.045,legMat));
  });

  // Pancam Mast
  const mast=grp('mast'); const mMat=mk('mast',0xe2e8f0,{metalness:.6,roughness:.35});
  mast.add(strut(V(.65,.15,.35),V(.65,1.25,.35),.05,mMat));
  const head=new THREE.Mesh(new THREE.BoxGeometry(.28,.22,.56),mMat); head.position.set(.68,1.32,.35); mast.add(head);
  [-.16,.16].forEach(ez=>{
    const eye=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.08,14),new THREE.MeshStandardMaterial({color:0x0f172a}));
    eye.rotation.z=Math.PI/2; eye.position.set(.83,1.34,.35+ez); mast.add(eye);
  });

  // Robotic Arm (IDD)
  const arm=grp('arm'); const aMat=mk('arm',0x94a3b8,{metalness:.75,roughness:.3});
  arm.add(strut(V(.78,-.28,0),V(1.35,-.42,.22),.04,aMat));
  arm.add(strut(V(1.35,-.42,.22),V(1.55,-.65,0),.035,aMat));
  const turret=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.18,16),new THREE.MeshStandardMaterial({color:0xfbbf24,metalness:.6,roughness:.3}));
  turret.position.set(1.58,-.68,0); arm.add(turret);

  // High-Gain & UHF Antennas
  const ant=grp('antenna'); const antMat=mk('antenna',0xf8fafc,{metalness:.5,roughness:.3});
  const dish=new THREE.Mesh(new THREE.CylinderGeometry(.32,.26,.06,20),antMat);
  dish.position.set(-.45,.32,-.38); dish.rotation.z=.35; ant.add(dish);
  ant.add(strut(V(-.65,.15,.45),V(-.65,.78,.45),.025,antMat));

  let yaw=.72,pitch=.34,dist=8.5,auto=true,hl=null;
  function setSkin(id){
    const k=RSKINS[id]||RSKINS.classic;
    mats.body.color.setHex(k.frame); mats.solar.color.setHex(k.accent);
    ['body','solar','wheels'].forEach(n=>{mats[n].emissive.setHex(k.em); mats[n].emissiveIntensity=k.em?.65:0;});
  }
  function highlight(name){hl={name,t0:performance.now()};auto=false;}
  function size(){const w=box.clientWidth||320,h=box.clientHeight||300; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();}
  new ResizeObserver(size).observe(box); size();
  let drag=null;
  box.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};auto=false;box.setPointerCapture(e.pointerId);});
  box.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.01;pitch=Math.max(.04,Math.min(1.2,pitch+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};});
  const end=()=>{drag=null;}; box.addEventListener('pointerup',end); box.addEventListener('pointercancel',end);
  box.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(5.0,Math.min(14,dist+e.deltaY*.008));},{passive:false});
  let visible=true; new IntersectionObserver(en=>{visible=en[0].isIntersecting;}).observe(box);
  (function loop(now){
    requestAnimationFrame(loop); if(!visible) return;
    if(auto) yaw+=.004;
    camera.position.set(dist*Math.cos(pitch)*Math.sin(yaw),dist*Math.sin(pitch)+.3,dist*Math.cos(pitch)*Math.cos(yaw)); camera.lookAt(0,-.15,0);
    Object.keys(mats).forEach(n=>{ if(hl&&hl.name===n){ const t=(now-hl.t0)/1000; if(t>2.6){hl=null;} else {mats[n].emissive.setHex(0xffc542); mats[n].emissiveIntensity=.35+.35*Math.sin(t*9);} }
      if(!hl||hl.name!==n){ const k=RSKINS[S.rover]||RSKINS.classic; const isGlow=(n==='body'||n==='solar'||n==='wheels'); mats[n].emissive.setHex(isGlow?k.em:0x000000); mats[n].emissiveIntensity=isGlow&&k.em?.65:0; }});
    renderer.render(scene,camera);
  })(0);
  setSkin(S.rover);
  return {setSkin,highlight};
}

function modelWidget(){
  const wrap=el('div');
  wrap.appendChild(el('span','flag','3D ROVER VIEW'));
  const box=el('div','viewer'); wrap.appendChild(box);
  const info=el('div','pinfo','Drag to spin me around, zoom in, or tap any part below to inspect my geologist hardware.'); 
  const chips=el('div','chips');
  const names={body:'Warm Box',wheels:'6 Wheels',mast:'Pancam Mast',solar:'Solar Wings',arm:'Robot Arm',antenna:'Antennas'};
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
   INTERACTIVE COLUMBIA HILLS CLIMB & DUST DEVIL SIMULATOR
   ===================================================================== */
function spiritGame(){
  return new Promise(resolve=>{
    const wrap=el('div'); wrap.appendChild(el('span','flag','CLIMBING HUSBAND HILL'));
    wrap.appendChild(el('div',null,'<b>Guide me up the Columbia Hills!</b> Climb over sharp Martian boulders, catch <b>passing Dust Devils</b> to sweep dust off my solar wings, and examine <b>3 ancient rocks</b>!'));
    const cv=el('canvas','lg'); cv.width=340; cv.height=240; cv.style.marginTop='8px'; wrap.appendChild(cv);
    const ctl=el('div','ctl');
    const driveBtn=el('button','hold blue','HOLD TO CLIMB'); driveBtn.disabled=true;
    const hopBtn=el('button','hold','CLIMB ROCK'); hopBtn.disabled=true;
    const start=el('button','btn','Start climb'); const skip=el('button','btn','Continue story');
    ctl.append(driveBtn,hopBtn,start,skip); wrap.appendChild(ctl);
    const msg=el('div','pinfo','Solar arrays charged and Pancam calibrated. Ready to roll out of Gusev plains!'); wrap.appendChild(msg);

    const c=cv.getContext('2d');
    let running=false, finished=false, raf=0, last=0, gas=false;
    let st=null;
    const GY=195;

    function reset(){
      st={dist:0, goal:1000, y:0, vy:0, rocks:0, power:82, hitTimer:0,
          items:[
            {x:210, type:'boulder', done:false},
            {x:330, type:'rock',    done:false},
            {x:470, type:'devil',   done:false},
            {x:600, type:'boulder', done:false},
            {x:720, type:'rock',    done:false},
            {x:840, type:'devil',   done:false},
            {x:930, type:'rock',    done:false}
          ]};
    }

    function drawRover(x,y){
      c.save(); c.translate(x,y);
      c.fillStyle='#d8a640'; c.fillRect(-16,-15,32,8);
      c.fillStyle='#1e3a8a'; c.fillRect(-20,-17,40,3);
      c.strokeStyle='#e2e8f0'; c.lineWidth=2.5; c.beginPath(); c.moveTo(8,-17); c.lineTo(8,-30); c.stroke();
      c.fillStyle='#f8fafc'; c.fillRect(4,-33,10,5);
      [-13,0,13].forEach(wx=>{
        c.fillStyle='#374151'; c.beginPath(); c.arc(wx,-4,5,0,6.28); c.fill();
        c.strokeStyle='#fbbf24'; c.lineWidth=1.2; c.stroke();
      });
      c.restore();
    }

    function draw(){
      c.clearRect(0,0,340,240);
      const sky=c.createLinearGradient(0,0,0,GY);
      sky.addColorStop(0,'#2b120c'); sky.addColorStop(1,'#8c3b24');
      c.fillStyle=sky; c.fillRect(0,0,340,240);

      // Husband Hill silhouette
      c.fillStyle='#5c2416'; c.beginPath(); c.moveTo(0,GY); c.lineTo(95,125); c.lineTo(190,148); c.lineTo(285,105); c.lineTo(340,135); c.lineTo(340,GY); c.fill();
      c.fillStyle='#a8442a'; c.fillRect(0,GY,340,45);

      if(!st) return;
      st.items.forEach(it=>{
        const sx=75+(it.x-st.dist);
        if(sx<-40 || sx>380) return;
        if(it.type==='boulder'){
          c.fillStyle='#4a1c11'; c.beginPath(); c.arc(sx,GY,12,Math.PI,0); c.fill();
        } else if(it.type==='rock' && !it.done){
          c.fillStyle='#38bdf8'; c.beginPath(); c.moveTo(sx,GY-14); c.lineTo(sx+9,GY-2); c.lineTo(sx-9,GY-2); c.closePath(); c.fill();
        } else if(it.type==='devil' && !it.done){
          c.strokeStyle='rgba(255,220,180,.75)'; c.lineWidth=2;
          c.beginPath(); c.moveTo(sx,GY); c.lineTo(sx-7,GY-22); c.lineTo(sx+8,GY-42); c.stroke();
        }
      });

      drawRover(75, GY - st.y);

      c.font='600 13px Barlow, sans-serif';
      c.fillStyle='#fff'; c.fillText(`Targets studied: ${st.rocks} / 3`,12,20);
      c.fillText(`Climb: ${Math.min(1000,Math.floor(st.dist))} / 1000 m`,12,38);
      c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(225,11,102,9);
      c.fillStyle=st.power>30?'#3ddc84':'#ffc542'; c.fillRect(225,11,102*Math.min(100,Math.max(0,st.power))/100,9);
      c.fillStyle='#fff'; c.fillText('Solar Power',225,35);
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
      st.power=Math.max(15, st.power - (gas?2.4:1.0)*dt);

      st.y+=st.vy*dt;
      if(st.y>0 || st.vy>0){ st.vy-=265*dt; if(st.y<=0){ st.y=0; st.vy=0; } }

      st.items.forEach(it=>{
        if(it.done) return;
        if(Math.abs(it.x - st.dist) < 16){
          if(it.type==='rock' && st.y<18){
            it.done=true; st.rocks++;
            msg.innerHTML=`<b>Mineral target analyzed!</b> (${st.rocks} of 3 water-altered rocks studied)`;
          } else if(it.type==='devil' && st.y<25){
            it.done=true; st.power=Math.min(100,st.power+22);
            msg.innerHTML='<b>Dust devil cleaning event!</b> Martian wind swept my solar panels clean—power boosted!';
          } else if(it.type==='boulder' && st.y<10 && st.hitTimer<=0){
            it.done=true; st.power=Math.max(15,st.power-10); st.hitTimer=.6;
            msg.innerHTML='<b>Steep basalt boulder!</b> Rocker-bogie suspension kept all 6 wheels grounded.';
          }
        }
      });

      if(st.dist>=st.goal){
        running=false; finished=true; cancelAnimationFrame(raf);
        driveBtn.disabled=true; hopBtn.disabled=true; start.style.display='none'; skip.style.display='none'; cleanup();
        msg.innerHTML=`<b>Summit reached!</b> You studied <b>${st.rocks} target(s)</b> and harnessed Martian winds. In real life, I climbed Husband Hill and drove <b>7.7 km</b> across Gusev Crater!`;
        draw(); resolve({success:true,rocks:st.rocks}); return;
      }
      draw(); raf=requestAnimationFrame(step);
    }

    function begin(){
      reset(); running=true; driveBtn.disabled=false; hopBtn.disabled=false; start.style.display='none';
      msg.textContent='Hold Climb to drive up Husband Hill and tap Climb Rock over boulders!';
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
   DIAGRAMS (GUSEV CRATER LANDING SITE & SPIRIT TRAVERSE)
   ===================================================================== */
function marsMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY HOME AT GUSEV CRATER'));
  const box=el('div','mapbox'); const img=el('img'); img.alt='Mars globe with Gusev Crater marked'; loadImg(img,IMG.mars,800); box.appendChild(img);
  const dot=el('div','dot'); dot.style.left='68%'; dot.style.top='58%'; box.appendChild(dot);
  box.appendChild(el('div','lab','Gusev Crater (14.57&deg; S, 175.47&deg; E): a 166-km ancient impact crater fed by Ma&rsquo;adim Vallis.'));
  w.appendChild(box); return w;
}

function spiritTraverseMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY 7.7-KM EXPEDITION MAP'));
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 320 250'); svg.setAttribute('class','diag');
  const info=el('div','pinfo','Tap any landmark along my route to see how I turned a 90-day mission into 6 years of discovery.');
  const stops={
    lander:'<b>Columbia Memorial Station (Jan 3, 2004):</b> Where I bounced to a stop inside giant airbags and rolled off my lander on Sol 12!',
    bonneville:'<b>Bonneville Crater (Sol 65):</b> After crossing basaltic plains, I peered into this 200-meter impact crater—and realized the real water clues lay in the distant hills!',
    husband:'<b>Husband Hill Summit (Sol 582, Aug 2005):</b> I became the first robot ever to summit a mountain on another planet—climbing 82 meters above the plains!',
    homeplate:'<b>Home Plate &amp; Troy (2006&ndash;2010):</b> Beside this layered volcanic plateau, my dragging wheel uncovered 90% pure silica—proof of ancient hot springs!'
  };
  svg.innerHTML=`<rect width="320" height="250" fill="#2b140e"/>
    <!-- Columbia Hills -->
    <polygon points="150,245 220,90 315,120 315,245" fill="#4f2216"/>
    <text x="205" y="185" style="fill:#fed7aa">Columbia Hills</text>
    <!-- Bonneville Crater -->
    <circle cx="115" cy="70" r="24" fill="none" stroke="#9a4b34" stroke-width="3"/>
    <text x="72" y="40" style="fill:#cbd5e1">Bonneville Crater</text>
    <!-- Route -->
    <path d="M 48,95 L 115,75 L 185,125 L 235,112 L 245,165" fill="none" stroke="#ffc542" stroke-width="3.5" stroke-dasharray="5 3"/>
    <!-- Interactive Nodes -->
    <circle class="hit" data-s="lander" cx="48" cy="95" r="7" fill="#fc3d21" stroke="#fff" stroke-width="1.5"/>
    <text x="16" y="116" style="font-weight:600">Lander</text>
    <circle class="hit" data-s="bonneville" cx="115" cy="75" r="6" fill="#4aa3ff" stroke="#fff" stroke-width="1.5"/>
    <circle class="hit" data-s="husband" cx="235" cy="112" r="7" fill="#3ddc84" stroke="#fff" stroke-width="1.5"/>
    <text x="200" y="98" style="font-weight:600;fill:#3ddc84">Husband Hill</text>
    <circle class="hit" data-s="homeplate" cx="245" cy="165" r="7" fill="#ffc542" stroke="#fff" stroke-width="1.5"/>
    <text x="195" y="183" style="font-weight:600;fill:#ffc542">Home Plate</text>
    <text x="12" y="22" style="fill:#ffc542">Total Distance: 7.7 km (4.8 miles)</text>`;
  svg.querySelectorAll('.hit').forEach(p=>p.addEventListener('click',()=>{info.innerHTML=stops[p.dataset.s];}));
  w.append(svg,info); return w;
}

/* =====================================================================
   NARRATIVE STORY (PROUD FIRST-PERSON HARDWARE VOICE)
   ===================================================================== */
async function story(){
  /* ---------------- Part 1 ---------------- */
  chapter(1,'Bouncing onto the Red Planet');
  await say('<i>*Kzzzz... beep-beep-whirrr!*</i> Deep Space Network, do you copy? This is <b>Spirit</b>—NASA&rsquo;s Mars Exploration Rover <b>MER-A</b>—calling from the rust-red floor of <b>Gusev Crater</b>!');
  await say('They built my twin sister <b>Opportunity</b> and me for a 90-day sprint across Mars. Instead, I refused to quit—rolling, climbing, and rewriting Martian history for <b>more than six years</b>!');
  if(S.name){
    await say('Welcome back to Gusev Crater, <b>{name}</b>! My six cleats are still parked near Home Plate, and I&rsquo;m proud as ever to share every kilometer of my adventure.');
  } else {
    await say('Before I tell you how I survived a wild airbag bounce onto Mars and climbed a mountain on another world, who am I talking to?');
    S.name=await nameInput(); save();
    await youSay(S.name);
    await say('Thrilled to have you on the science team, <b>{name}</b>! Let&rsquo;s rewind to the night I arrived on the Red Planet.');
  }
  award('first',10,'First signal received'); giveBadge('first');
  const a1=await ask(['How did you survive landing on Mars?!','Why did NASA pick Gusev Crater?']);
  await say(a1===0?'Six minutes of pure rocket-and-airbag adrenaline! Let me tell you how we pulled it off.':'Because from orbit, Gusev looked like a giant ancient lakebed!');
  await say('On <b>January 3, 2004</b>, I slammed into the Martian atmosphere at over 19,000 kilometers per hour. After my heat shield and supersonic parachute slowed me down, retro-rockets fired and giant <b>Vectran airbags</b> inflated around me like a 24-lobed beach ball!');
  await say('I bounced nearly 28 times across Gusev Crater before rolling to a stop. When my petals unfolded and I stood up on my six wheels, I sent home the sharpest color panorama ever taken on Mars!');
  await photo(IMG.lander,'Look back at my landing platform—named Columbia Memorial Station—surrounded by my deflated airbags on Sol 16 (January 2004)!','REAL NASA PHOTO');
  await say('Engineers at JPL cheered like they had just won the World Series. And my journey had only just begun!');
  award('c1',10,'Part 1 complete');
  await ask(['Show me how you were built!']);

  /* ---------------- Part 2 ---------------- */
  chapter(2,'A Robot Geologist with Six Wheels');
  await say('I wasn&rsquo;t just a remote-control car—I was a 185-kilogram robotic field geologist! Every camera, spectrometer, and rock-grinding tool on my body replaced the eyes, hands, and rock hammer of a human scientist.');
  const mw=modelWidget(); await widget(mw.wrap); mw.mount();
  await say('Spin my 3D chassis around and tap my hardware! Check out my <b>1.5-meter Pancam mast</b>, my <b>rocker-bogie wheels</b>, and the <b>Instrument Deployment Device</b> folded under my chin.');
  await ask(['I inspected your hardware!','Keep rolling with the story']);
  await say('My twin <b>Opportunity</b> and I were identical twins built at NASA&rsquo;s Jet Propulsion Laboratory—launched separately in June and July 2003 to land on <b>opposite sides of Mars</b>.');
  deepDive('specs','Spirit (MER-A) Engineering Profile (NASA/JPL-Caltech)',[
    ['Mission','Mars Exploration Rover &ndash; A (Spirit)'],
    ['Launch &amp; Landing','Launched June 10, 2003 &middot; Landed January 3, 2004'],
    ['Landing Site','Gusev Crater (14.57&deg; S, 175.47&deg; E)'],
    ['Planned vs. Actual Life','Designed for 90 sols (~3 months); operated 2,208 sols (over 6 years)'],
    ['Total Distance Driven','7.7 kilometers (4.8 miles)'],
    ['Mobility System','6-wheel rocker-bogie suspension with 4-wheel steering'],
    ['Science Payload','Pancam, Mini-TES, M&ouml;ssbauer, APXS, Microscopic Imager, RAT grinder']
  ]);
  await quiz('planned','How long was my original primary mission supposed to last on Mars?',['90 Martian days (sols)','10 Earth years','14 days'],0,'Just 90 sols—about three months! Yet I kept exploring Gusev Crater for 2,208 sols—more than 20 times my warranty!');
  award('c2',10,'Part 2 complete');
  await say('Now let&rsquo;s head toward the mountains!');
  await ask(["Let's climb the Columbia Hills!"]);

  /* ---------------- Part 3 ---------------- */
  chapter(3,'First Mountain Climber on Mars');
  await say('When I first rolled across Gusev&rsquo;s flat plains, I found mostly volcanic basalt—not the lakebed mud scientists expected. So my team pointed my cameras three kilometers east toward the <b>Columbia Hills</b>!');
  await say('Even after my right-front wheel failed in 2006, I refused to stop—driving <b>backward</b> and dragging that wheel like a plow! Take my controls and help me climb <b>Husband Hill</b> while catching Martian dust devils to clean my solar wings!');
  const g=await spiritGame();
  if(g.success){
    if(award('drive',30,'Climbed Husband Hill')){ giveBadge('driver'); }
    await say(`What a climb, <b>{name}</b>! You studied <b>${g.rocks} mineral target(s)</b> and used passing whirlwinds to keep my solar arrays humming.`);
  } else {
    await say('Climbing loose Martian scree takes patience—every meter up Husband Hill revealed rocks older than the lava plains below!');
  }
  await widget(marsMap());
  await say('In <b>August 2005</b>, I stood proudly on the summit of <b>Husband Hill</b>—becoming the very first spacecraft in human history to summit a mountain on another planet!');
  await photo(IMG.hills,'The panoramic view from Husband Hill in Gusev Crater—a vista no human eyes had ever seen before I climbed there!','REAL NASA PHOTO');
  deepDive('hills','Columbia Hills &amp; Husband Hill Milestones',[
    ['Bonneville Crater','Reached on Sol 65 (200-meter-wide impact crater)'],
    ['Husband Hill Summit','Reached August 2005 (Sol 582), 82 meters above the surrounding plains'],
    ['Dust Devil Cleaning','Passing Martian whirlwinds swept dust off solar arrays, boosting power'],
    ['5-Wheel Driving','After right-front wheel stopped in March 2006, Spirit drove backward successfully']
  ]);
  await quiz('climb','How did I keep exploring for years after my right-front wheel stopped turning in 2006?',['I drove backward dragging the wheel','Astronauts repaired it','I used rocket thrusters'],0,'I drove backward and dragged my stuck wheel through the soil—which accidentally uncovered one of my greatest discoveries!');
  award('c3',10,'Part 3 complete');
  await ask(['What did your dragging wheel uncover?!']);

  /* ---------------- Part 4 ---------------- */
  chapter(4,'The Accidental Hot-Spring Discovery');
  await say('In May 2007, near a layered plateau called <b>Home Plate</b>, my dragging right-front wheel carved a trench into the Martian soil—and revealed a streak of bright, snow-white powder!');
  await widget(spiritTraverseMap());
  await say('When I aimed my spectrometers at that bright soil, my instruments lit up: it was <b>90% pure silica</b>! On Earth, concentrated silica like that forms in <b>hot springs or volcanic steam vents</b>—places where liquid water and heat once mixed!');
  await photo(IMG.silica,'My tracks beside Home Plate in Gusev Crater, where my dragging wheel churned up bright silica-rich soil proving ancient hydrothermal water existed here!','REAL NASA PHOTO');
  await say('I had done it! Even though Gusev&rsquo;s surface looked dry at first, I proved that ancient Mars once had <b>hot, watery environments</b> capable of supporting microbial life!');
  deepDive('water','Water &amp; Hydrothermal Discoveries by Spirit',[
    ['Pure Silica Deposit','Discovered in May 2007 near Home Plate; 90% pure silica'],
    ['Scientific Meaning','Forms only in hot springs or acidic steam vents—strong evidence of past water'],
    ['Comanche Outcrop','Carbonate-rich rocks showing neutral-pH water also flowed in ancient Gusev'],
    ['Gusev Conclusion','Confirmed early Mars had warm, wet, potentially habitable environments']
  ]);
  await quiz('silica','What major discovery did my dragging wheel uncover near Home Plate in 2007?',['90% pure silica formed by ancient hot water','Liquid oceans on the surface today','Fossilized trees'],0,'90% pure silica—a mineral signature of ancient hot springs or volcanic steam vents!');
  award('c4',10,'Part 4 complete');
  await ask(['How did your journey finally come to an end?']);

  /* ---------------- Part 5 ---------------- */
  chapter(5,'Trapped at Troy, Proud to the End');
  await say('In May 2009, while driving south past the western edge of Home Plate at a spot called <b>Troy</b>, my wheels broke through a thin crust into a hidden pit of soft sulfate sand.');
  await say('For months, my engineers at JPL tested escape maneuvers in a sandbox on Earth while I spun my remaining wheels with every ounce of strength I had. I couldn&rsquo;t break free—so NASA turned me into a <b>stationary science station</b>!');
  await say('Even trapped in the sand, I kept studying Mars&rsquo;s core wobble and weather until my <b>fourth Martian winter</b> arrived in <b>March 2010</b>. Unable to tilt my solar panels toward the low winter sun, I sent my final transmission on <b>March 22, 2010</b> (Sol 2208).');
  deepDive('end','Spirit Final Mission Summary (NASA Science)',[
    ['Total Operating Time','2,208 sols (January 3, 2004 &ndash; March 22, 2010)'],
    ['Total Distance Driven','7.7 kilometers (4.8 miles)'],
    ['Images Returned','Over 124,000 raw images beamed to Earth'],
    ['Final Location','Troy, west of Home Plate in the Columbia Hills, Gusev Crater'],
    ['Mission Conclusion','NASA concluded recovery efforts in May 2011 after 4 Martian winters']
  ]);
  await quiz('endq','How far did I drive across Gusev Crater before my mission concluded in 2010?',['7.7 kilometers (4.8 miles)','770 meters','45.16 kilometers'],0,'7.7 kilometers (4.8 miles) across plains and mountains—more than ten times my original goal!');
  award('c5',10,'Part 5 complete');
  await ask(['What about your twin sister Opportunity?']);

  /* ---------------- Part 6 ---------------- */
  chapter(6,'Twin Geologists Across a Planet');
  await say('While I was climbing mountains in Gusev Crater, my identical twin <b>Opportunity</b> landed three weeks after me on the exact opposite side of Mars—at <b>Meridiani Planum</b>!');
  await say('Together, we were NASA&rsquo;s dynamic duo. I proved ancient Mars had hot volcanic springs and diverse volcanic rocks, while Opportunity uncovered vast ancient lakes and groundwater across the Meridiani plains!');
  await say('Without the lessons my engineers learned keeping me alive through four brutal Martian winters, future rovers like <b>Curiosity</b> and <b>Perseverance</b> could never have roamed so boldly.');
  deepDive('twins','Twin Rover Comparison: Spirit vs. Opportunity',[
    ['Spirit (MER-A)','Landed Jan 3, 2004 at Gusev Crater &middot; Drove 7.7 km &middot; Operated until 2010'],
    ['Opportunity (MER-B)','Landed Jan 24, 2004 at Meridiani Planum &middot; Drove 45.16 km &middot; Operated until 2018'],
    ['Shared Legacy','Confirmed ancient Mars had long-standing liquid water on its surface']
  ]);
  await quiz('twin','Where on Mars did my twin sister Opportunity land three weeks after me?',['Meridiani Planum','Gusev Crater','Olympus Mons'],0,'Meridiani Planum—on the opposite side of Mars from Gusev Crater!');
  award('c6',10,'Part 6 complete');
  await ask(['Ready for the final mission check!']);

  /* ---------------- Part 7 ---------------- */
  chapter(7,'A Legacy Carved in Martian Dust');
  await say('I may be resting quietly at Troy beneath the pink skies of Gusev Crater, <b>{name}</b>, but I couldn&rsquo;t be prouder. A 90-day rover that lasted six years, climbed a Martian mountain, and proved ancient water flowed on Mars—not bad for a robot the size of a golf cart!');
  await say('Before you blast off to meet my record-smashing twin <b>Opportunity</b>, let&rsquo;s run a quick three-question mission debrief!');
  await ask(['Bring it on!']);
  const q1=await quiz('f1','What is the name of the giant impact crater where I landed on January 3, 2004?',['Gusev Crater','Jezero Crater','Tycho Crater'],0,'Gusev Crater—a 166-kilometer-wide crater in Mars’s southern hemisphere.');
  const q2=await quiz('f2','What mountain did I become the first robot to summit on another planet in 2005?',['Husband Hill','Mount Sharp','Mons Huygens'],0,'Husband Hill in the Columbia Hills, rising 82 meters above the Gusev plains.');
  const q3=await quiz('f3','What unexpected Martian weather event repeatedly cleaned dust off my solar panels?',['Passing dust devils (whirlwinds)','Rainstorms','Snowfall'],0,'Passing Martian dust devils swept fine dust off my solar arrays and gave me fresh bursts of power!');
  award('c7',10,'Part 7 complete');
  const right=[q1,q2,q3].filter(Boolean).length;
  await say(right===3?'Three out of three! You&rsquo;ve earned your wings as a true Gusev Crater explorer, <b>{name}</b>!':`${right} out of 3! Thanks for riding across Gusev Crater with me, <b>{name}</b>.`);
  giveBadge('friend'); award('end',40,'Spirit story completed');
  sysNote('Mission Complete! New badges and rover chassis finishes are now available in your sidebar profile.');
  await say('Now go meet my twin sister <b>Opportunity</b>—she rolled an unbelievable <b>45.16 kilometers</b> and kept going for over 14 years!');
  const end=el('div'); end.appendChild(el('span','flag','CONTINUE EXPLORING'));
  const links=el('div','end',`<a class="btn red" href="${NEXT_PAGE}">Meet Opportunity (MER-B)</a><a class="btn" href="${HOME}">Back to the roadmap</a><button class="btn" id="again">Replay Spirit&rsquo;s story</button>`);
  end.appendChild(links); await widget(end);
  $('#again').onclick=()=>location.reload();
}

/* ---------- start ---------- */
renderSide();
story().catch(err=>{console.error(err);moduleRow('Transmission interrupted. Please reload the page.');});
