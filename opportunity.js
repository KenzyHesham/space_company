'use strict';
/* =====================================================================
   CONFIG - MARS EXPLORATION ROVER OPPORTUNITY (MER-B)
   ===================================================================== */
const FAST = /[?&]fast=1/.test(location.search);
const NEXT_PAGE = 'spirit.html', HOME = 'index.html';
const TOTAL_CHAPTERS = 7;

const IMG = {
  bg:        ['File:ESO - Milky Way.jpg'],
  rover:     ['search:PIA18079 Opportunity self portrait 2014', 'search:Opportunity rover self portrait solar panels', 'File:NASA Mars Rover.jpg'],
  eagle:     ['search:PIA05755 Lion King Eagle Crater Opportunity', 'search:Opportunity Eagle Crater panorama', 'File:NASA Mars Rover.jpg'],
  berries:   ['search:PIA05584 blueberries Opportunity Mars', 'search:Martian spherules blueberries Opportunity', 'File:NASA Mars Rover.jpg'],
  endeavour: ['search:Opportunity Endeavour Crater Marathon Valley', 'search:Opportunity Victoria Crater Mars', 'File:NASA Mars Rover.jpg'],
  mars:      ['File:OSIRIS Mars true color.jpg', 'search:Mars globe true color']
};

/* =====================================================================
   HELPERS + SAVED STATE
   ===================================================================== */
const $  = (s,r=document)=>r.querySelector(s);
const el = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms=>new Promise(r=>setTimeout(r,FAST?0:ms));

const KEY='astrotales.opportunity.v1';
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
  {id:'first',  name:'Hole-in-One!',        icon:'star',  color:'#ffc542', how:'Start the conversation'},
  {id:'driver', name:'Marathon Runner',     icon:'wheel', color:'#fc3d21', how:'Complete the Meridiani marathon drive'},
  {id:'explore',name:'Chassis Inspector',   icon:'cube',  color:'#3ddc84', how:'Inspect 3 parts of the 3D rover'},
  {id:'detect', name:'Blueberry Hunter',    icon:'lens',  color:'#4aa3ff', how:'Open 5 NASA telemetry sheets'},
  {id:'ace',    name:'Meridiani Ace',       icon:'check', color:'#b48cff', how:'Answer 7 memory checks correctly'},
  {id:'friend', name:'Oppy Champion',       icon:'mars',  color:'#ff8a3d', how:'Complete Opportunity’s full story'}
];
const LEVELS=[[0,'New Contact'],[40,'Eagle Scout'],[120,'Crater Navigator'],[220,'Marathon Runner'],[320,'Martian Legend']];
const levelIdx=()=>{let k=0;LEVELS.forEach((l,i)=>{if(S.score>=l[0])k=i;});return k;};

const ASKINS={
  classic:{name:'Classic White',  suit:'#f2f4f8',visor:'#1b2b4d',acc:'#0b3d91',test:()=>true,                  req:'Starter'},
  orange: {name:'Meridiani Gold', suit:'#ff8a3d',visor:'#1b2b4d',acc:'#ffffff',test:()=>S.score>=40,           req:'Reach 40 pts'},
  blue:   {name:'Marathon Blue',  suit:'#4aa3ff',visor:'#0d1a33',acc:'#ffffff',test:()=>!!S.badges.friend,     req:'Finish the mission'},
  gold:   {name:'Gold Visor',     suit:'#f2f4f8',visor:'#c99a2e',acc:'#fc3d21',test:()=>!!S.badges.ace,        req:'Earn Meridiani Ace'}
};
const RSKINS={
  classic:{name:'Aerogel Gold',   frame:0xd8a640,accent:0x1e293b,em:0x000000,glow:'#ffc542',sw:'#d8a640',test:()=>true,                 req:'Starter'},
  blue:   {name:'Hematite Blue',  frame:0x3b82f6,accent:0xfbbf24,em:0x000000,glow:'#4aa3ff',sw:'#3b82f6',test:()=>S.score>=120,         req:'Reach 120 pts'},
  red:    {name:'Endeavour Red',  frame:0xdc2626,accent:0xf8fafc,em:0x000000,glow:'#fc3d21',sw:'#dc2626',test:()=>!!S.badges.explore,    req:'Inspect 3 parts'},
  night:  {name:'Sol 5000 Glow',  frame:0x1c2c52,accent:0x3de1ff,em:0x0b4a7a,glow:'#3de1ff',sw:'#1c2c52',test:()=>!!S.badges.driver,     req:'Complete the drive'}
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
  await sleep(ms); row.remove(); statusEl.textContent='online from Meridiani Planum'; 
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
  body:'<b>My Warm Electronics Box (WEB).</b> My gold-aerogel insulated body kept my brain and rechargeable lithium-ion batteries safe through more than 5,000 freezing Martian nights!',
  wheels:'<b>My Six Rocker-Bogie Wheels.</b> Each aluminum wheel has its own motor and cleats. Even when my steering actuator got stiff after 14 years, my drivetrain kept rolling for <b>45.16 kilometers</b>!',
  mast:'<b>My Panoramic Camera Mast (Pancam).</b> Standing 1.5 meters high, my twin stereo cameras captured massive color panoramas—including the 558-image &ldquo;Lion King&rdquo; panorama of Eagle Crater!',
  solar:'<b>My Triple-Junction Solar Wings.</b> Built for a 90-sol mission, Martian winds kept sweeping my solar arrays clean—allowing me to run an astonishing <b>14+ years</b> until the historic 2018 global dust storm!',
  arm:'<b>My Robotic Instrument Arm (IDD).</b> Carrying my Microscopic Imager, M&ouml;ssbauer &amp; APXS spectrometers, and Rock Abrasion Tool (RAT), I inspected tiny iron-rich &ldquo;blueberries&rdquo; up close!',
  antenna:'<b>My High-Gain & Low-Gain Antennas.</b> For over 14 years, I beamed over 217,000 images back to Earth—until my final signal on <b>June 10, 2018</b>.'
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
  const rim=new THREE.DirectionalLight(0xffb74d,.55); rim.position.set(-6,3,-6); scene.add(rim);

  const mats={}, parts={}, model=new THREE.Group(); scene.add(model);
  const mk=(n,c,o={})=>{mats[n]=new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:.55,roughness:.45},o));return mats[n];};
  const grp=n=>{const g=new THREE.Group();parts[n]=g;model.add(g);return g;};
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const strut=(a,b,r,m)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();
    const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),m);
    s.position.copy(a).addScaledVector(d,.5); s.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize()); return s;};

  const GROUND=-1.15;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(10,56),new THREE.MeshStandardMaterial({color:0x8a5a3c,roughness:1,metalness:0}));
  ground.rotation.x=-Math.PI/2; ground.position.y=GROUND; model.add(ground);

  // Warm Electronics Box
  const bMat=mk('body',0xd8a640,{metalness:.65,roughness:.35});
  const body=grp('body');
  const boxMesh=new THREE.Mesh(new THREE.BoxGeometry(1.55,.68,1.25),bMat); boxMesh.position.y=-.22; body.add(boxMesh);

  // Solar Wings
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

  // Robotic Arm
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
  const info=el('div','pinfo','Drag to spin me around, zoom in, or tap any part below to inspect the hardware that ran for 14+ years!'); 
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
   INTERACTIVE MERIDIANI MARATHON SIMULATOR (45.16 KM)
   ===================================================================== */
function oppyGame(){
  return new Promise(resolve=>{
    const wrap=el('div'); wrap.appendChild(el('span','flag','THE 45.16-KM MARS MARATHON'));
    wrap.appendChild(el('div',null,'<b>Roll across Meridiani Planum!</b> Hop over deep sand ripples (like Purgatory Dune!) and collect <b>3 hematite &ldquo;blueberries&rdquo;</b> on your marathon trek to Endeavour Crater!'));
    const cv=el('canvas','lg'); cv.width=340; cv.height=240; cv.style.marginTop='8px'; wrap.appendChild(cv);
    const ctl=el('div','ctl');
    const driveBtn=el('button','hold blue','HOLD TO ROLL'); driveBtn.disabled=true;
    const hopBtn=el('button','hold','CROSS DUNE'); hopBtn.disabled=true;
    const start=el('button','btn','Start marathon'); const skip=el('button','btn','Continue story');
    ctl.append(driveBtn,hopBtn,start,skip); wrap.appendChild(ctl);
    const msg=el('div','pinfo','All 6 wheels ready! Let&rsquo;s set the off-Earth driving record.'); wrap.appendChild(msg);

    const c=cv.getContext('2d');
    let running=false, finished=false, raf=0, last=0, gas=false;
    let st=null;
    const GY=195;

    function reset(){
      st={dist:0, goal:45.16, y:0, vy:0, berries:0, hitTimer:0,
          items:[
            {x:9.0,  type:'dune',  done:false},
            {x:15.5, type:'berry', done:false},
            {x:22.0, type:'dune',  done:false},
            {x:28.5, type:'berry', done:false},
            {x:35.0, type:'dune',  done:false},
            {x:41.0, type:'berry', done:false}
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
      sky.addColorStop(0,'#1f1712'); sky.addColorStop(1,'#7c5338');
      c.fillStyle=sky; c.fillRect(0,0,340,240);

      // Endeavour Crater rim on the horizon
      c.fillStyle='#4a3020'; c.beginPath(); c.moveTo(0,GY); c.lineTo(130,152); c.lineTo(240,145); c.lineTo(340,162); c.lineTo(340,GY); c.fill();
      c.fillStyle='#8c5a3c'; c.fillRect(0,GY,340,45);

      if(!st) return;
      st.items.forEach(it=>{
        const sx=75+(it.x-st.dist)*22;
        if(sx<-40 || sx>380) return;
        if(it.type==='dune'){
          c.fillStyle='#5c3822'; c.beginPath(); c.ellipse(sx,GY+2,20,6,0,Math.PI,0); c.fill();
        } else if(!it.done){
          c.fillStyle='#3b82f6'; c.beginPath(); c.arc(sx,GY-7,6,0,6.28); c.fill();
          c.fillStyle='#93c5fd'; c.beginPath(); c.arc(sx-2,GY-9,2,0,6.28); c.fill();
        }
      });

      drawRover(75, GY - st.y);

      c.font='600 13px Barlow, sans-serif';
      c.fillStyle='#fff'; c.fillText(`Blueberries found: ${st.berries} / 3`,12,20);
      c.fillText(`Odometer: ${Math.min(45.16,st.dist).toFixed(2)} / 45.16 km`,12,38);
      c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(225,11,102,9);
      c.fillStyle='#ffc542'; c.fillRect(225,11,102*Math.min(1,st.dist/45.16),9);
      c.fillStyle='#fff'; c.fillText('Marathon Goal',225,35);
    }

    function hop(){
      if(running && st.y<=1) st.vy=145;
    }

    function step(now){
      if(!running) return;
      const dt=Math.min(.05,(now-last)/1000); last=now;
      if(st.hitTimer>0) st.hitTimer-=dt;

      const speed=gas?6.2:2.1;
      st.dist+=speed*dt;

      st.y+=st.vy*dt;
      if(st.y>0 || st.vy>0){ st.vy-=265*dt; if(st.y<=0){ st.y=0; st.vy=0; } }

      st.items.forEach(it=>{
        if(it.done) return;
        if(Math.abs(it.x - st.dist) < 0.75){
          if(it.type==='berry' && st.y<18){
            it.done=true; st.berries++;
            msg.innerHTML=`<b>Hematite &ldquo;blueberry&rdquo; collected!</b> (${st.berries} of 3 water-formed spherules)`;
          } else if(it.type==='dune' && st.y<10 && st.hitTimer<=0){
            it.done=true; st.hitTimer=.6;
            msg.innerHTML='<b>Soft sand ripple!</b> Just like escaping Purgatory Dune in 2005—keep rolling!';
          }
        }
      });

      if(st.dist>=st.goal){
        running=false; finished=true; cancelAnimationFrame(raf);
        driveBtn.disabled=true; hopBtn.disabled=true; start.style.display='none'; skip.style.display='none'; cleanup();
        msg.innerHTML=`<b>45.16 kilometers reached!</b> You collected <b>${st.berries} blueberry sample(s)</b> and completed a full Martian marathon—a record that stood on Mars for over eight years after I fell silent!`;
        draw(); resolve({success:true,berries:st.berries}); return;
      }
      draw(); raf=requestAnimationFrame(step);
    }

    function begin(){
      reset(); running=true; driveBtn.disabled=false; hopBtn.disabled=false; start.style.display='none';
      msg.textContent='Hold Roll to cruise Meridiani Planum and tap Cross Dune over sand ripples!';
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
   DIAGRAMS (MERIDIANI PLANUM & 45.16-KM CRATER-HOPPING ROUTE)
   ===================================================================== */
function marsMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY HOME AT MERIDIANI PLANUM'));
  const box=el('div','mapbox'); const img=el('img'); img.alt='Mars globe with Meridiani Planum marked'; loadImg(img,IMG.mars,800); box.appendChild(img);
  const dot=el('div','dot'); dot.style.left='36%'; dot.style.top='52%'; box.appendChild(dot);
  box.appendChild(el('div','lab','Meridiani Planum (1.95&deg; S, 354.47&deg; E): rich in grey hematite—a mineral that forms in liquid water.'));
  w.appendChild(box); return w;
}

function oppyTraverseMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY 45.16-KM CRATER-HOPPING JOURNEY'));
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 320 250'); svg.setAttribute('class','diag');
  const info=el('div','pinfo','Tap any crater along my 14-year route to see how far beyond my 90-day plan I traveled.');
  const stops={
    eagle:'<b>Eagle Crater (Jan 24, 2004):</b> My cosmic &ldquo;hole-in-one!&rdquo; I bounced right inside a 22-meter crater and immediately saw layered bedrock and hematite blueberries.',
    endurance:'<b>Endurance Crater (2004):</b> I drove right down into this 130-meter crater, studying thick rock layers formed by ancient standing water and wind.',
    victoria:'<b>Victoria Crater (2006&ndash;2008):</b> After surviving Purgatory Dune, I explored this dramatic 750-meter scalloped crater for two full years!',
    endeavour:'<b>Endeavour Crater &amp; Perseverance Valley (2011&ndash;2018):</b> After driving 21 km just to reach this 22-km-wide crater rim, I found clay minerals formed in fresh, neutral water!'
  };
  svg.innerHTML=`<rect width="320" height="250" fill="#211812"/>
    <!-- Endeavour Crater giant rim -->
    <path d="M 245,25 Q 200,130 255,235" fill="none" stroke="#6e4b35" stroke-width="14" stroke-linecap="round"/>
    <text x="225" y="135" style="fill:#fed7aa;font-weight:600">Endeavour</text>
    <text x="232" y="148" style="fill:#fed7aa">Crater</text>
    <!-- Route -->
    <path d="M 38,55 L 78,78 L 135,122 L 222,165" fill="none" stroke="#4aa3ff" stroke-width="3.5" stroke-dasharray="5 3"/>
    <!-- Craters -->
    <circle class="hit" data-s="eagle" cx="38" cy="55" r="7" fill="#fc3d21" stroke="#fff" stroke-width="1.5"/>
    <text x="16" y="42" style="font-weight:600">Eagle Crater</text>
    <circle class="hit" data-s="endurance" cx="78" cy="78" r="8" fill="#ffc542" stroke="#fff" stroke-width="1.5"/>
    <text x="54" y="100" style="font-weight:600;fill:#ffc542">Endurance</text>
    <circle class="hit" data-s="victoria" cx="135" cy="122" r="10" fill="#3ddc84" stroke="#fff" stroke-width="1.5"/>
    <text x="102" y="146" style="font-weight:600;fill:#3ddc84">Victoria Crater</text>
    <circle class="hit" data-s="endeavour" cx="222" cy="165" r="8" fill="#4aa3ff" stroke="#fff" stroke-width="1.5"/>
    <text x="148" y="195" style="font-weight:600;fill:#4aa3ff">Perseverance Valley</text>
    <text x="12" y="235" style="fill:#ffc542">Total Odometer: 45.16 km (28.06 miles)</text>`;
  svg.querySelectorAll('.hit').forEach(p=>p.addEventListener('click',()=>{info.innerHTML=stops[p.dataset.s];}));
  w.append(svg,info); return w;
}

/* =====================================================================
   NARRATIVE STORY (PROUD FIRST-PERSON HARDWARE VOICE)
   ===================================================================== */
async function story(){
  /* ---------------- Part 1 ---------------- */
  chapter(1,'A Cosmic Hole-in-One');
  await say('<i>*Bzzzt... chime... telemetry locked!*</i> Greetings from Meridiani Planum, Earth! I&rsquo;m <b>Opportunity</b>—NASA&rsquo;s Mars Exploration Rover <b>MER-B</b>—and let me tell you, nobody ever had an entrance quite like mine!');
  await say('Three weeks after my twin brother <b>Spirit</b> landed on the far side of Mars, I arrived on <b>January 24, 2004</b>, wrapped in giant airbags—and bounced <b>straight inside a small impact crater</b>!');
  if(S.name){
    await say('Great to see you again, <b>{name}</b>! After 14 years of rolling across Mars and smashing distance records, I&rsquo;m still beaming with pride over what we discovered.');
  } else {
    await say('Scientists at JPL called my landing an &ldquo;interplanetary hole-in-one!&rdquo; Before I share how I turned a 90-day mission into a 14-year marathon, who am I speaking with?');
    S.name=await nameInput(); save();
    await youSay(S.name);
    await say('Welcome aboard, <b>{name}</b>! Let&rsquo;s roll right out onto the ancient plains of Meridiani Planum.');
  }
  award('first',10,'First signal received'); giveBadge('first');
  const a1=await ask(['What did you see inside Eagle Crater?!','How long were you supposed to last?']);
  await say(a1===0?'Layered bedrock right in front of my cameras—something no Mars lander had ever seen before!':'Only 90 Martian days! Nobody dreamed I would still be roving 14 years later!');
  await say('When my lander petals opened inside 22-meter-wide <b>Eagle Crater</b>, I didn&rsquo;t even have to drive far to strike scientific gold. Right in front of me stood a shelf of layered rock—and the soil was sprinkled with millions of tiny grey spheres!');
  await photo(IMG.eagle,'My famous &ldquo;Lion King&rdquo; color panorama of Eagle Crater (Sols 58&ndash;60)—558 frames showing my lander, layered bedrock, and the plains of Meridiani Planum!','REAL NASA PHOTO');
  await say('From my very first days on Mars, I knew Meridiani Planum was hiding a watery secret.');
  award('c1',10,'Part 1 complete');
  await ask(['Show me your 3D rover hardware!']);

  /* ---------------- Part 2 ---------------- */
  chapter(2,'Built Tough for the Long Haul');
  await say('My twin <b>Spirit</b> and I were built to be agile, solar-powered field geologists—185 kilograms of cameras, spectrometers, rock grinders, and pure stubbornness!');
  const mw=modelWidget(); await widget(mw.wrap); mw.mount();
  await say('Spin my 3D chassis around and tap my parts! Notice my <b>triple-junction solar wings</b>—kept clean year after year by helpful Martian gusts—and my <b>robotic instrument arm</b>.');
  await ask(['I inspected your hardware!','Keep rolling with the story']);
  await say('Orbiters had spotted the mineral <b>hematite</b> at Meridiani Planum before I launched—and my job was to prove whether liquid water had created it.');
  deepDive('specs','Opportunity (MER-B) Engineering Profile (NASA/JPL-Caltech)',[
    ['Mission','Mars Exploration Rover &ndash; B (Opportunity)'],
    ['Launch &amp; Landing','Launched July 7, 2003 &middot; Landed January 24, 2004'],
    ['Landing Site','Eagle Crater, Meridiani Planum (1.95&deg; S, 354.47&deg; E)'],
    ['Planned vs. Actual Life','Designed for 90 sols; communicated for 5,111 sols (14+ Earth years)'],
    ['Total Distance Driven','45.16 kilometers (28.06 miles) &mdash; off-Earth record until Oct 2026'],
    ['Images Returned','Over 217,000 raw images beamed to Earth']
  ]);
  await quiz('hole','What made my landing on January 24, 2004 an &ldquo;interplanetary hole-in-one&rdquo;?',['I bounced directly inside Eagle Crater','I landed on top of Olympus Mons','I landed on Phobos'],0,'I bounced right into 22-meter-wide Eagle Crater—putting layered bedrock right within arm’s reach!');
  award('c2',10,'Part 2 complete');
  await say('Now let&rsquo;s zoom in on those mysterious Martian &ldquo;blueberries&rdquo;!');
  await ask(['Tell me about the Martian blueberries!']);

  /* ---------------- Part 3 ---------------- */
  chapter(3,'Blueberries & Ancient Seas');
  await say('When I extended my robotic arm and aimed my Microscopic Imager at the soil around Eagle Crater, the ground looked like a blueberry muffin! Millions of BB-sized spherical pebbles were eroding out of the layered rock.');
  await photo(IMG.berries,'Close-up NASA view of Martian &ldquo;blueberries&rdquo;—iron-rich hematite concretions formed when groundwater soaked through ancient rocks!','REAL NASA PHOTO');
  await say('My spectrometers confirmed they were rich in <b>hematite</b>—mineral concretions that form when <b>liquid groundwater</b> flows through porous rock! Even better, the layered bedrock showed ripples sculpted by <b>flowing surface water</b>!');
  await widget(marsMap());
  await say('Within two months of landing, I had fulfilled my primary goal: proving that ancient Meridiani Planum once had <b>standing, flowing liquid water</b>!');
  deepDive('berries','Water &amp; Mineral Discoveries at Meridiani Planum',[
    ['Martian &ldquo;Blueberries&rdquo;','Hematite-rich concretions formed in wet sediments'],
    ['Cross-Bedded Rock','Ripple patterns proving shallow water once flowed across the surface'],
    ['Sulfate Salts','Jarosite and other sulfates confirming acidic ancient lakes/groundwater'],
    ['Endeavour Clay Minerals','Smectite clays discovered later, formed in milder, neutral-pH water']
  ]);
  await quiz('berriesq','What are the tiny Martian &ldquo;blueberries&rdquo; I discovered scattered across Meridiani Planum?',['Hematite spheres formed in ancient groundwater','Frozen drops of water','Tiny meteorites'],0,'Iron-rich hematite concretions—rock-solid proof that groundwater once soaked Meridiani Planum!');
  award('c3',10,'Part 3 complete');
  await ask(['Now let’s go for the 45-km marathon!']);

  /* ---------------- Part 4 ---------------- */
  chapter(4,'The 45.16-Kilometer Mars Marathon');
  await say('Once my 90-day mission ended, I didn&rsquo;t slow down—I went crater-hopping! First <b>Endurance Crater</b>, then a two-year trek to massive <b>Victoria Crater</b>, and finally a 21-kilometer cross-country dash to the rim of <b>Endeavour Crater</b>!');
  await say('Even when I got stuck in a sand ripple called <b>Purgatory Dune</b> in 2005, my team and I wiggled free inch by inch over five weeks. Take my controls and run the full <b>45.16-km Martian marathon</b>!');
  const g=await oppyGame();
  if(g.success){
    if(award('drive',30,'Completed 45.16-km Mars marathon')){ giveBadge('driver'); }
    await say(`Unstoppable, <b>{name}</b>! You gathered <b>${g.berries} hematite sample(s)</b> and crossed the <b>45.16-km</b> marathon finish line!`);
  } else {
    await say('Crossing Meridiani&rsquo;s sand ripples took careful navigation—every kilometer brought us closer to older, clay-bearing rocks!');
  }
  await widget(oppyTraverseMap());
  await photo(IMG.endeavour,'Looking across the sweeping rim of 22-kilometer-wide Endeavour Crater—my home during the final years of my epic marathon!','REAL NASA PHOTO');
  await say('When I crossed <b>42.195 kilometers</b> in March 2015, I had officially run a <b>full marathon on Mars</b>—and I kept going all the way to <b>45.16 kilometers (28.06 miles)</b>!');
  deepDive('marathon','Endurance, Victoria &amp; Endeavour Milestones',[
    ['Endurance Crater (2004)','Explored interior rock layers for 6 months'],
    ['Purgatory Dune (2005)','Escaped after 5 weeks of careful wheel turns in deep sand'],
    ['Victoria Crater (2006&ndash;2008)','Studied 750-meter scalloped crater rim and cliffs'],
    ['Endeavour Crater (2011&ndash;2018)','22-km-wide ancient crater; found clay minerals formed in neutral water'],
    ['Distance Record','45.16 km (28.06 mi) &mdash; stood until Perseverance passed it on Oct 11, 2026']
  ]);
  await quiz('dist','What off-Earth driving distance record did I set on Mars before my mission ended?',['45.16 kilometers (28.06 miles)','7.7 kilometers (4.8 miles)','100 kilometers'],0,'45.16 kilometers (28.06 miles)—more than a full marathon on another planet, a record that stood until October 2026!');
  award('c4',10,'Part 4 complete');
  await ask(['How did your 14-year journey finally end?']);

  /* ---------------- Part 5 ---------------- */
  chapter(5,'The Planet-Wide Dust Storm of 2018');
  await say('By May 2018, I was exploring <b>Perseverance Valley</b> on the western rim of Endeavour Crater—over <b>14 years</b> into a 90-day mission! Then, in late May, a local dust storm exploded into a monster <b>planet-wide dust storm</b>.');
  await say('Dust blotted out the Sun over Meridiani Planum, turning Martian noon into pitch-black night. Without sunlight for my solar wings, I went into low-power hibernation to ride out the storm.');
  await say('I sent my final transmission on <b>June 10, 2018</b> (Sol 5111). For eight months, NASA sent over a thousand recovery commands—even beaming the song <i>&ldquo;Wake Me Up Before You Go-Go&rdquo;</i>—before concluding my historic mission on <b>February 13, 2019</b>.');
  deepDive('farewell','Final Signals &amp; Historic Longevity (NASA/JPL)',[
    ['Last Communication','June 10, 2018 (Sol 5111) during a planet-wide dust storm'],
    ['Mission Concluded','February 13, 2019 after more than 1,000 recovery commands'],
    ['Total Operating Span','Nearly 15 Earth years (over 55 times the planned 90-sol mission)'],
    ['Final Resting Spot','Perseverance Valley, western rim of Endeavour Crater']
  ]);
  await quiz('storm','What forced me to fall silent in June 2018 after more than 14 years on Mars?',['A planet-wide dust storm blocked sunlight to my solar panels','A meteor impact','I drove into a lake'],0,'A massive planet-wide dust storm blocked the Sun over Meridiani Planum, starving my solar arrays of power.');
  award('c5',10,'Part 5 complete');
  await ask(['How did you and Spirit change Mars exploration forever?']);

  /* ---------------- Part 6 ---------------- */
  chapter(6,'Rewriting the History of Mars');
  await say('Before my twin <b>Spirit</b> and I landed in January 2004, Mars looked like a cold, dry desert. Together, we proved beyond a shadow of a doubt that <b>ancient Mars had abundant liquid water</b>—both underground and standing on the surface!');
  await say('Even my distance record of <b>45.16 kilometers</b> stood unbroken on Mars for more than eight years after my final signal—until NASA&rsquo;s nuclear-powered rover <b>Perseverance</b> finally rolled past my mark on <b>October 11, 2026</b>!');
  await say('Every discovery Curiosity and Perseverance make today builds directly on the trails Spirit and I blazed across Gusev Crater and Meridiani Planum.');
  deepDive('legacy','Twin Rover Legacy (Spirit &amp; Opportunity)',[
    ['Spirit (MER-A)','Gusev Crater &middot; 7.7 km &middot; Proved ancient hot springs &amp; volcanic diversity'],
    ['Opportunity (MER-B)','Meridiani Planum &middot; 45.16 km &middot; Proved ancient surface &amp; groundwater'],
    ['Record Broken','Perseverance surpassed 45.16 km on October 11, 2026 (reaching 45.22 km)']
  ]);
  await quiz('leg','Which NASA rover finally surpassed my 45.16-km Martian driving record in October 2026?',['Perseverance','Sojourner','Viking 1'],0,'NASA’s Perseverance rover rolled past my 45.16-km mark on October 11, 2026—passing the torch to a new generation!');
  award('c6',10,'Part 6 complete');
  await ask(['Ready for the final mission check!']);

  /* ---------------- Part 7 ---------------- */
  chapter(7,'Forever Rolling in Spirit');
  await say('Resting in <b>Perseverance Valley</b> on the rim of Endeavour Crater, <b>{name}</b>, I look back with pure joy. Ninety days planned, <b>14+ years</b> delivered, <b>45.16 kilometers</b> driven, and a whole watery chapter of Mars&rsquo;s past unlocked!');
  await say('Before you head back to the roadmap or visit my twin brother <b>Spirit</b>, let&rsquo;s complete a quick three-question debrief!');
  await ask(['Bring it on!']);
  const q1=await quiz('f1','On what date did I make my &ldquo;hole-in-one&rdquo; landing inside Eagle Crater on Mars?',['January 24, 2004','July 20, 1969','August 6, 2012'],0,'January 24, 2004—three weeks after my twin Spirit landed in Gusev Crater!');
  const q2=await quiz('f2','What huge crater did I spend years driving to reach, arriving in 2011 to find ancient clay minerals?',['Endeavour Crater','Tycho Crater','Gusev Crater'],0,'Endeavour Crater—a 22-kilometer-wide ancient crater on Meridiani Planum.');
  const q3=await quiz('f3','How many kilometers did I drive across Mars during my mission?',['45.16 kilometers (28.06 miles)','4.5 kilometers','12.5 kilometers'],0,'45.16 kilometers (28.06 miles)—over a full marathon across the Red Planet!');
  award('c7',10,'Part 7 complete');
  const right=[q1,q2,q3].filter(Boolean).length;
  await say(right===3?'Three out of three! You&rsquo;re officially an honorary MER flight director, <b>{name}</b>!':`${right} out of 3! Thanks for running the Martian marathon with me, <b>{name}</b>.`);
  giveBadge('friend'); award('end',40,'Opportunity story completed');
  sysNote('Mission Complete! New badges and rover chassis finishes are now available in your sidebar profile.');
  await say('Want to hear the other half of our twin adventure? Go visit my brother <b>Spirit</b> in Gusev Crater—or head back to the mission roadmap!');
  const end=el('div'); end.appendChild(el('span','flag','CONTINUE EXPLORING'));
  const links=el('div','end',`<a class="btn red" href="${NEXT_PAGE}">Meet Spirit (MER-A)</a><a class="btn" href="${HOME}">Back to the roadmap</a><button class="btn" id="again">Replay Opportunity&rsquo;s story</button>`);
  end.appendChild(links); await widget(end);
  $('#again').onclick=()=>location.reload();
}

/* ---------- start ---------- */
renderSide();
story().catch(err=>{console.error(err);moduleRow('Transmission interrupted. Please reload the page.');});
