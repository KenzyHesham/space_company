const FAST = /[?&]fast=1/.test(location.search);
const NASA_GLB_URL = '';
const NEXT_PAGE = 'lunar_rover_vehicle.html', HOME = 'index.html';
const TOTAL_CHAPTERS = 7;

const IMG = {
  bg:     ['File:ESO - Milky Way.jpg'],
  eagle:  ['File:Apollo 11 Lunar Module Eagle in landing configuration in lunar orbit from the Command and Service Module Columbia.jpg',
           'File:Apollo 11 lunar module.jpg'],
  surface:['https://nssdc.gsfc.nasa.gov/planetary/image/ap11_lm_as11_40_5927.jpg',
           'search:Apollo 11 Lunar Module on Moon'],
  walker: ['File:Aldrin Apollo 11 original.jpg'],
  moon:   ['File:FullMoon2010.jpg']
};

/* =====================================================================
   HELPERS + SAVED STATE
   ===================================================================== */
const $  = (s,r=document)=>r.querySelector(s);
const el = (tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const esc = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms=>new Promise(r=>setTimeout(r,FAST?0:ms));

const KEY='astrotales.v1';
let S={name:'',score:0,done:{},badges:{},astro:'classic',eagle:'classic',deep:0,quizRight:0,parts:{},seenSkin:{}};
try{const r=JSON.parse(localStorage.getItem(KEY)||'null'); if(r) S=Object.assign(S,r);}catch(e){}
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
  rocket:'M12 2c3 3 4.5 7 4 12l2 3v3l-3-1.5L12 22l-3-3.5L6 20v-3l2-3c-.5-5 1-9 4-12zm0 6a2 2 0 100 4 2 2 0 000-4z',
  cube:'M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.3L5.6 7.8 12 11.4l6.4-3.6L12 4.3zM5 9.6v6.8l6 3.3v-6.8L5 9.6zm14 0l-6 3.3v6.8l6-3.3V9.6z',
  lens:'M10 3a7 7 0 015.6 11.2l5.1 5.1-1.4 1.4-5.1-5.1A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z',
  check:'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  moon:'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z'
};
const BADGES=[
  {id:'first',  name:'First Contact',          icon:'star',   color:'#4aa3ff', how:'Start the conversation'},
  {id:'pilot',  name:'Lunar Pilot',            icon:'rocket', color:'#fc3d21', how:'Complete the landing simulation'},
  {id:'explore',name:'Hardware Explorer',      icon:'cube',   color:'#3ddc84', how:'Inspect 3 parts of the 3D spacecraft'},
  {id:'detect', name:'Data Detective',         icon:'lens',   color:'#b48cff', how:'Open 5 NASA data sheets'},
  {id:'ace',    name:'Mission Ace',            icon:'check',  color:'#ffc542', how:'Answer 7 checkpoints correctly'},
  {id:'friend', name:'Tranquility Explorer',   icon:'moon',   color:'#dfe8ff', how:'Complete the full mission'}
];
const LEVELS=[[0,'New Contact'],[40,'Cadet'],[120,'Flight Specialist'],[220,'Mission Commander'],[320,'Crew Mate']];
const levelIdx=()=>{let k=0;LEVELS.forEach((l,i)=>{if(S.score>=l[0])k=i;});return k;};

const ASKINS={
  classic:{name:'Classic White',  suit:'#f2f4f8',visor:'#1b2b4d',acc:'#0b3d91',test:()=>true,                  req:'Starter'},
  orange: {name:'Orange Pioneer', suit:'#ff8a3d',visor:'#1b2b4d',acc:'#ffffff',test:()=>S.score>=40,           req:'Reach 40 pts'},
  blue:   {name:'Mission Blue',   suit:'#4aa3ff',visor:'#0d1a33',acc:'#ffffff',test:()=>!!S.badges.friend,     req:'Finish the mission'},
  gold:   {name:'Gold Visor',     suit:'#f2f4f8',visor:'#c99a2e',acc:'#fc3d21',test:()=>!!S.badges.ace,        req:'Earn Mission Ace'}
};
const ESKINS={
  classic:{name:'Kapton Gold',     descent:0xd8a640,ascent:0xcfd2d8,em:0x000000,glow:'#ffc542',sw:'#d8a640',test:()=>true,                 req:'Starter'},
  silver: {name:'Lunar Silver',    descent:0xc9ced6,ascent:0xeef1f5,em:0x000000,glow:'#dfe8ff',sw:'#c9ced6',test:()=>S.score>=120,         req:'Reach 120 pts'},
  blue:   {name:'Blueprint Blue',  descent:0x2d6fd8,ascent:0xe3e9f4,em:0x000000,glow:'#4aa3ff',sw:'#2d6fd8',test:()=>!!S.badges.explore,    req:'Inspect 3 parts'},
  night:  {name:'Earthshine Glow', descent:0x1c2c52,ascent:0x2a3556,em:0x0b4a7a,glow:'#3de1ff',sw:'#1c2c52',test:()=>!!S.badges.pilot,      req:'Complete landing'}
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
  $('#eagleSkins').innerHTML=skinBtn(ESKINS,S.eagle,'eagle');

  [['a',ASKINS],['e',ESKINS]].forEach(([p,map])=>Object.keys(map).forEach(id=>{
    const k=p+id; if(id!=='classic'&&map[id].test()&&!S.seenSkin[k]){S.seenSkin[k]=1;setTimeout(()=>popup(`New customization unlocked: ${esc(map[id].name)}`),1800);save();}
  }));
  document.documentElement.style.setProperty('--glow',ESKINS[S.eagle].glow);
  document.querySelectorAll('.uav').forEach(n=>{n.outerHTML=astroSVG(S.astro);});
}
document.addEventListener('click',e=>{
  const b=e.target.closest('.skin'); if(!b||b.classList.contains('lock')) return;
  if(b.dataset.kind==='astro') S.astro=b.dataset.id; else {S.eagle=b.dataset.id; if(viewer) viewer.setSkin(S.eagle);}
  save(); renderSide();
});
$('#openSide').onclick=()=>$('#side').classList.add('open');
$('#closeSide').onclick=()=>$('#side').classList.remove('open');
$('#hero').onclick=()=>zoom($('#heroImg').src);
loadImg($('#heroImg'),IMG.eagle); loadImg($('#headImg'),IMG.eagle);

/* =====================================================================
   CHAT ENGINE
   ===================================================================== */
const chat=$('#chat'), statusEl=$('#status');
const toBottom=()=>{chat.scrollTop=chat.scrollHeight;};
const stamp=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
const T=s=>String(s).replace(/\{name\}/g,esc(S.name||'friend'));
const smallAv=()=>{const d=el('div','av');const i=el('img');i.alt='';loadImg(i,IMG.eagle);d.appendChild(i);return d;};

async function typing(ms){
  const row=el('div','row'); row.appendChild(smallAv()); row.appendChild(el('div','bub typing','<i></i><i></i><i></i>'));
  chat.appendChild(row); statusEl.textContent='transmitting...'; statusEl.className='live'; toBottom();
  await sleep(ms); row.remove(); statusEl.textContent='online from Tranquility Base'; 
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
  const a=el('div','photo'); const img=el('img'); img.alt=caption; loadImg(img,list); a.appendChild(img);
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
  await say(ok?`You remembered! ${explain}`:`Not quite—let me remind you! ${explain}`);
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
   3D VIEWER
   ===================================================================== */
let viewer=null;
const PART_INFO={
  descent:'<b>My Descent Stage (NSSDCA 1969-059D).</b> My lower octagonal body, about 4.2 m across and 1.7 m tall. Inside me, I carried my landing rocket, propellant tanks, water, oxygen, helium, and the science gear the crew unpacked onto the Moon.',
  legs:'<b>My Landing Legs.</b> Four wide-stance legs with round footpads that hold my belly 1.5 m above the lunar dust. Opposite footpads span 9.4 m so I wouldn&rsquo;t tip over on uneven ground.',
  ladder:'<b>My Ladder &amp; Porch.</b> Mounted to my forward landing leg is a small porch and ladder—the exact steps Neil Armstrong and Buzz Aldrin climbed down to reach the Moon.',
  engine:'<b>My Descent Engine.</b> A conical rocket nozzle tucked underneath my center. Unlike fixed-thrust rockets, I could throttle my thrust smoothly up to about 45,000 newtons so I could hover and land gently.',
  ascent:'<b>My Ascent Stage (NSSDCA 1969-059C).</b> My upper pressurized crew cabin, about 2.8 m tall and 4.0 by 4.3 m wide, with 6.65 cubic meters of space inside. No seats—while riding inside me, my crew stood upright!',
  windows:'<b>My Windows.</b> Two triangular windows angled downward so Neil and Buzz could look out and pick a safe, boulder-free landing spot.',
  antennas:'<b>My Radar &amp; Antennas.</b> A rendezvous radar dish for tracking Columbia in orbit, a steerable S-band parabolic dish that beamed live TV, voice, and telemetry back to Earth, plus two VHF antennas.',
  plaque:'<b>My Commemorative Plaque.</b> Mounted on the strut behind my ladder. During their moonwalk, my crew unveiled it and read aloud that we came in peace for all mankind.'
};

function buildViewer(box){
  const THREE=window.THREE;
  if(!THREE){box.innerHTML='<p class="pinfo">The 3D view needs an internet connection to load. Reconnect and reload the page.</p>';return null;}
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
  catch(e){ box.innerHTML='<p class="pinfo">Your browser could not start 3D graphics (WebGL).</p>'; return null; }
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
  box.appendChild(renderer.domElement);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(40,1,.1,100);
  scene.add(new THREE.AmbientLight(0xffffff,.75));
  const sun=new THREE.DirectionalLight(0xffffff,1.15); sun.position.set(6,9,5); scene.add(sun);
  const rim=new THREE.DirectionalLight(0x6fa8ff,.55); rim.position.set(-6,3,-6); scene.add(rim);

  const mats={}, parts={}, model=new THREE.Group(); scene.add(model);
  const mk=(n,c,o={})=>{mats[n]=new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:.55,roughness:.45},o));return mats[n];};
  const grp=n=>{const g=new THREE.Group();parts[n]=g;model.add(g);return g;};
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const strut=(a,b,r,m)=>{const d=new THREE.Vector3().subVectors(b,a),len=d.length();
    const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),m);
    s.position.copy(a).addScaledVector(d,.5); s.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize()); return s;};

  const GROUND=-2.4;
  const ground=new THREE.Mesh(new THREE.CircleGeometry(10,56),new THREE.MeshStandardMaterial({color:0x8d8b86,roughness:1,metalness:0}));
  ground.rotation.x=-Math.PI/2; ground.position.y=GROUND-.02; model.add(ground);

  const dMat=mk('descent',0xd8a640,{metalness:.7,roughness:.35});
  const descent=grp('descent');
  const oct=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,1.7,8),dMat); oct.rotation.y=Math.PI/8; descent.add(oct);

  const eng=grp('engine'); const em=mk('engine',0x2a2d33,{metalness:.3,roughness:.6});
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(.35,.8,1.1,28,1,true),em); bell.position.y=-1.4; bell.material.side=THREE.DoubleSide; eng.add(bell);

  const legs=grp('legs'); const lMat=mk('legs',0xd8a640,{metalness:.7,roughness:.35});
  const ladder=grp('ladder'); const lad=mk('ladder',0xb9bec6,{metalness:.5,roughness:.5});
  const plaque=grp('plaque'); const pm=mk('plaque',0xf3f0e6,{metalness:.2,roughness:.4});
  for(let i=0;i<4;i++){
    const leg=new THREE.Group(); leg.rotation.y=i*Math.PI/2;
    const top=V(2.0,.25,0), pad=V(4.7,GROUND+.1,0);
    leg.add(strut(top,pad,.1,lMat));
    leg.add(strut(V(2.0,-.7,0),V(top.x+(pad.x-top.x)*.62,top.y+(pad.y-top.y)*.62,0),.07,lMat));
    const foot=new THREE.Mesh(new THREE.CylinderGeometry(.55,.65,.12,28),lMat); foot.position.copy(pad).y=GROUND+.06; leg.add(foot);
    legs.add(leg);
    if(i===0){
      const porch=new THREE.Mesh(new THREE.BoxGeometry(1.0,.08,.9),lad); porch.position.set(2.7,-.05,0); ladder.add(porch);
      [-.28,.28].forEach(z=>ladder.add(strut(V(3.0,-.1,z),V(4.55,GROUND+.15,z),.04,lad)));
      for(let k=1;k<=6;k++){const t=k/7,x=3.0+1.55*t,y=-.1+(GROUND+.15+.1)*t;
        const r=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.58),lad); r.position.set(x,y,0); ladder.add(r);}
      const pl=new THREE.Mesh(new THREE.BoxGeometry(.5,.34,.05),pm); pl.position.set(3.35,-.55,.2); pl.rotation.y=.2; plaque.add(pl);
    }
  }

  const aMat=mk('ascent',0xcfd2d8,{metalness:.5,roughness:.5});
  const asc=grp('ascent');
  const cabin=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.75,2.4,12),aMat); cabin.position.y=2.05; asc.add(cabin);
  [-1,1].forEach(s=>{const bay=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.7,.9),aMat); bay.position.set(-.1,1.9,s*1.9); asc.add(bay);});
  const hatch=new THREE.Mesh(new THREE.BoxGeometry(.06,.95,.75),new THREE.MeshStandardMaterial({color:0x22252b})); hatch.position.set(1.72,1.55,0); asc.add(hatch);
  const dock=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.3,20),aMat); dock.position.y=3.35; asc.add(dock);
  for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4; const q=new THREE.Mesh(new THREE.BoxGeometry(.35,.35,.35),new THREE.MeshStandardMaterial({color:0x4a4e57}));
    q.position.set(Math.cos(a)*1.9,2.6,Math.sin(a)*1.9); q.rotation.y=-a; asc.add(q);}

  const win=grp('windows'); const wm_=mk('windows',0x0c1a2e,{metalness:.8,roughness:.15});
  [-1,1].forEach(s=>{const sh=new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(.8,0); sh.lineTo(.4,.8); sh.closePath();
    const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),wm_); m.material.side=THREE.DoubleSide;
    m.rotation.y=Math.PI/2; m.position.set(1.77,2.35,s*.55); win.add(m);});

  const ant=grp('antennas'); const am=mk('antennas',0xe9e6da,{metalness:.4,roughness:.5});
  const s1=new THREE.Mesh(new THREE.SphereGeometry(.65,20,10,0,Math.PI*2,0,Math.PI/2),am); s1.material.side=THREE.DoubleSide; s1.position.set(-.6,3.9,.7); s1.rotation.set(-.5,0,.6); ant.add(s1);
  ant.add(strut(V(-.6,3.4,.7),V(-.6,3.85,.7),.05,am));
  const s2=new THREE.Mesh(new THREE.SphereGeometry(.38,16,8,0,Math.PI*2,0,Math.PI/2),am); s2.material.side=THREE.DoubleSide; s2.position.set(.55,3.75,-.75); s2.rotation.set(.3,0,-.4); ant.add(s2);
  ant.add(strut(V(.55,3.4,-.75),V(.55,3.7,-.75),.04,am));
  ant.add(strut(V(-1.0,3.3,-.6),V(-1.9,4.5,-1.1),.03,am)); ant.add(strut(V(-1.0,3.3,.0),V(-2.0,4.3,.4),.03,am));

  let yaw=.7,pitch=.32,dist=17,auto=true,hl=null;
  function setSkin(id){
    const k=ESKINS[id]||ESKINS.classic;
    mats.descent.color.setHex(k.descent); mats.legs.color.setHex(k.descent); mats.ascent.color.setHex(k.ascent);
    ['descent','legs','ascent'].forEach(n=>{mats[n].emissive.setHex(k.em); mats[n].emissiveIntensity=k.em?.7:0;});
  }
  function highlight(name){hl={name,t0:performance.now()};auto=false;}
  function size(){const w=box.clientWidth||320,h=box.clientHeight||300; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();}
  new ResizeObserver(size).observe(box); size();
  let drag=null;
  box.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};auto=false;box.setPointerCapture(e.pointerId);});
  box.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.01;pitch=Math.max(.02,Math.min(1.2,pitch+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};});
  const end=()=>{drag=null;}; box.addEventListener('pointerup',end); box.addEventListener('pointercancel',end);
  box.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(9,Math.min(26,dist+e.deltaY*.01));},{passive:false});
  let visible=true; new IntersectionObserver(en=>{visible=en[0].isIntersecting;}).observe(box);
  (function loop(now){
    requestAnimationFrame(loop); if(!visible) return;
    if(auto) yaw+=.004;
    camera.position.set(dist*Math.cos(pitch)*Math.sin(yaw),dist*Math.sin(pitch)+1,dist*Math.cos(pitch)*Math.cos(yaw)); camera.lookAt(0,.4,0);
    Object.keys(mats).forEach(n=>{ if(hl&&hl.name===n){ const t=(now-hl.t0)/1000; if(t>2.6){hl=null;} else {mats[n].emissive.setHex(0xffc542); mats[n].emissiveIntensity=.35+.35*Math.sin(t*9);} }
      if(!hl||hl.name!==n){ const k=ESKINS[S.eagle]||ESKINS.classic; const isFoil=(n==='descent'||n==='legs'||n==='ascent'); mats[n].emissive.setHex(isFoil?k.em:0x000000); mats[n].emissiveIntensity=isFoil&&k.em?.7:0; }});
    renderer.render(scene,camera);
  })(0);
  setSkin(S.eagle);
  return {setSkin,highlight};
}

function modelWidget(){
  const wrap=el('div');
  wrap.appendChild(el('span','flag','3D SPACECRAFT VIEW'));
  const box=el('div','viewer'); wrap.appendChild(box);
  const info=el('div','pinfo','Drag to spin me around, zoom in, or tap any part below to see what it does.'); 
  const chips=el('div','chips');
  const names={descent:'Descent stage',legs:'Legs',ladder:'Ladder',engine:'Engine',ascent:'Ascent stage',windows:'Windows',antennas:'Radar & Antennas',plaque:'Plaque'};
  const onPart=k=>{
    info.innerHTML=PART_INFO[k]; chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
    if(viewer) viewer.highlight(k);
    S.parts[k]=1; save(); const n=Object.keys(S.parts).length;
    if(n>=3){ if(award('explore3',15,'Inspected 3 spacecraft parts')) giveBadge('explore'); }
  };
  Object.keys(names).forEach(k=>{const b=el('button',null,names[k]); b.dataset.k=k; b.onclick=()=>onPart(k); chips.appendChild(b);});
  wrap.append(chips,info);
  box.appendChild(el('div','hint','Interactive teaching model'));
  return {wrap,box,mount(){
    if(NASA_GLB_URL){
      box.innerHTML=''; const s=document.createElement('script'); s.type='module'; s.src='https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'; document.head.appendChild(s);
      const mv=document.createElement('model-viewer'); mv.setAttribute('src',NASA_GLB_URL); mv.setAttribute('camera-controls',''); mv.setAttribute('auto-rotate',''); mv.setAttribute('alt','NASA 3D model of the Apollo Lunar Module'); mv.style.cssText='width:100%;height:100%;--poster-color:transparent'; box.appendChild(mv);
    } else { viewer=buildViewer(box); }
  }};
}

/* =====================================================================
   INTERACTIVE DESCENT SIMULATION
   ===================================================================== */
function landingGame(){
  return new Promise(resolve=>{
    const wrap=el('div'); wrap.appendChild(el('span','flag','DESCENT SIMULATION'));
    wrap.appendChild(el('div',null,'<b>Take the controls!</b> Hold the thruster button to fire my descent engine and bring me down softer than 2.5 m/s before my fuel runs out.'));
    const cv=el('canvas','lg'); cv.width=340; cv.height=340; cv.style.marginTop='8px'; wrap.appendChild(cv);
    const ctl=el('div','ctl'); const hold=el('button','hold','HOLD TO FIRE ENGINE'); hold.disabled=true;
    const start=el('button','btn','Begin descent'); const skip=el('button','btn','Continue story'); const auto=el('button','btn','Let computer guide'); auto.style.display='none';
    ctl.append(hold,start,skip,auto); wrap.appendChild(ctl);
    const msg=el('div','pinfo','Thrusters armed and ready.'); wrap.appendChild(msg);
    const c=cv.getContext('2d'); const stars=Array.from({length:40},()=>[Math.random()*340,Math.random()*300,Math.random()*1.4+.3]);
    let st=null, thrust=false, raf=0, tries=0, running=false, finished=false, autopilot=false, last=0;
    const GY=300;
    const reset=()=>{st={alt:120,vy:10,fuel:100};};
    function drawLander(x,y,fire){
      c.save(); c.translate(x,y);
      c.strokeStyle='#cfd5df'; c.lineWidth=2; c.beginPath(); c.moveTo(-9,-8);c.lineTo(-20,4);c.moveTo(9,-8);c.lineTo(20,4); c.stroke();
      c.fillStyle='#e6e8ee'; c.fillRect(-23,3,8,2.5); c.fillRect(15,3,8,2.5);
      c.fillStyle='#3a3d45'; c.beginPath(); c.moveTo(-4,-1);c.lineTo(4,-1);c.lineTo(7,5);c.lineTo(-7,5);c.closePath(); c.fill();
      c.fillStyle='#d8a640'; c.fillRect(-14,-14,28,13);
      c.fillStyle='#cfd2d8'; c.fillRect(-9,-27,18,13); c.fillStyle='#0c1a2e'; c.fillRect(-3,-23,6,5);
      if(fire){c.fillStyle='#ffb347';c.beginPath();c.moveTo(-5,5);c.lineTo(5,5);c.lineTo(0,14+Math.random()*14);c.closePath();c.fill();}
      c.restore();
    }
    function draw(){
      c.clearRect(0,0,340,340); c.fillStyle='#02040b'; c.fillRect(0,0,340,340);
      c.fillStyle='#fff'; stars.forEach(s=>{c.globalAlpha=.4+.5*Math.random();c.fillRect(s[0],s[1],s[2],s[2]);}); c.globalAlpha=1;
      c.fillStyle='#8d8b86'; c.fillRect(0,GY,340,40); c.fillStyle='#74726d'; [[50,GY+14,26],[160,GY+22,34],[270,GY+12,22]].forEach(k=>{c.beginPath();c.ellipse(k[0],k[1],k[2],5,0,0,6.3);c.fill();});
      if(st){
        const y=GY-8-st.alt*2.2; drawLander(170,y,thrust&&st.fuel>0&&running);
        const sp=Math.max(0,st.vy); c.font='600 14px Barlow, sans-serif'; c.fillStyle=sp<=2.5?'#3ddc84':sp<=5?'#ffc542':'#fc3d21';
        c.fillText('Speed '+sp.toFixed(1)+' m/s',12,22); c.fillStyle='#dce8ff'; c.fillText('Height '+Math.max(0,st.alt).toFixed(0)+' m',12,42);
        c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(220,12,108,10); c.fillStyle=st.fuel>25?'#4aa3ff':'#fc3d21'; c.fillRect(220,12,108*Math.max(0,st.fuel)/100,10);
        c.fillStyle='#dce8ff'; c.fillText('Fuel',220,40);
      }
    }
    function end(ok){
      running=false; cancelAnimationFrame(raf); hold.disabled=true; thrust=false;
      const sp=st.vy;
      if(ok){
        finished=true; msg.innerHTML=`<b>Soft touchdown at ${sp.toFixed(1)} m/s!</b> In July 1969, my real descent burn lasted 756.3 seconds.`;
        start.style.display='none'; skip.style.display='none'; auto.style.display='none'; cleanup(); resolve({success:true,auto:autopilot});
      } else {
        tries++; msg.innerHTML=`<b>Hard impact at ${sp.toFixed(1)} m/s!</b> Fire the engine in steady bursts to slow down before reaching the dust.`; start.textContent='Try descent again'; start.style.display='';
        if(tries>=2) auto.style.display='';
      }
      draw();
    }
    function step(now){
      if(!running) return; const dt=Math.min(.05,(now-last)/1000)*1.5; last=now;
      let on=thrust;
      if(autopilot){ on = st.vy>2.0 && st.alt<(st.vy*st.vy)/(2*2.2)+6; }
      let a=1.62; if(on&&st.fuel>0){a-=4.0; st.fuel-=10*dt;}
      st.vy+=a*dt; st.alt-=st.vy*dt;
      if(st.alt<=0){ st.alt=0; end(st.vy<=2.5); return; }
      draw(); raf=requestAnimationFrame(step);
    }
    function begin(){ reset(); running=true; hold.disabled=autopilot; start.style.display='none'; auto.style.display='none'; msg.textContent=autopilot?'Guidance computer active—watch how it brakes near the surface.':'Descending! Hold the thruster to slow down.'; last=performance.now(); raf=requestAnimationFrame(step); }
    const down=e=>{e&&e.preventDefault();thrust=true;}, up=()=>{thrust=false;};
    hold.addEventListener('pointerdown',down); ['pointerup','pointerleave','pointercancel'].forEach(ev=>hold.addEventListener(ev,up));
    const kd=e=>{if((e.code==='Space'||e.code==='ArrowUp')&&running){e.preventDefault();thrust=true;}}, ku=e=>{if(e.code==='Space'||e.code==='ArrowUp')thrust=false;};
    addEventListener('keydown',kd); addEventListener('keyup',ku);
    function cleanup(){removeEventListener('keydown',kd);removeEventListener('keyup',ku);}
    start.onclick=begin; auto.onclick=()=>{autopilot=true;begin();};
    skip.onclick=()=>{ if(finished) return; finished=true; running=false; cancelAnimationFrame(raf); cleanup(); [hold,start,skip,auto].forEach(b=>b.disabled=true); resolve({skipped:true}); };
    reset(); draw();
    moduleRow(wrap,true);
  });
}

/* =====================================================================
   DIAGRAMS
   ===================================================================== */
function moonMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY LANDING SPOT'));
  const box=el('div','mapbox'); const img=el('img'); img.alt='The Moon, with the Sea of Tranquility marked'; loadImg(img,IMG.moon); box.appendChild(img);
  const dot=el('div','dot'); dot.style.left='69%'; dot.style.top='50%'; box.appendChild(dot);
  box.appendChild(el('div','lab','Tranquility Base: 0.67416&deg; N, 23.47314&deg; E, in the Sea of Tranquility.'));
  w.appendChild(box); return w;
}
function siteMap(){
  const w=el('div'); w.appendChild(el('span','flag','MY NEIGHBORHOOD ON THE MOON'));
  const NS='http://www.w3.org/2000/svg'; let zoomed=false;
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 320 300'); svg.setAttribute('class','diag');
  const info=el('div','pinfo','Tap my descent stage, the EASEP package, or the laser mirror to inspect our camp.');
  const btn=el('button','btn',''); btn.style.marginTop='8px';
  const items={
    eagle:'<b>My Descent Stage (Tranquility Base).</b> Neil and Buzz stayed within about 100 m of my legs and walked roughly 250 m in total.',
    easep:'<b>EASEP / PSEP Science Package.</b> Placed about 17 m south of me. The 48 kg Passive Seismic Experiment Package carried a seismometer, lunar dust detector, two solar panels, and an antenna.',
    mirror:'<b>Laser Ranging Retroreflector.</b> Deployed separately about 5 m north-northwest of EASEP. It needs zero batteries—it still bounces laser beams back to Earth!'
  };
  function draw(){
    const k=zoomed?6:1.4, cx=160, cy=zoomed?95:150;
    const p={eagle:[cx,cy],easep:[cx,cy+17*k],mirror:[cx-1.9*k,cy+17*k-4.6*k]};
    svg.innerHTML=`<rect width="320" height="300" fill="#2c2b29"/>`+
      (zoomed?'':`<circle cx="${cx}" cy="${cy}" r="${100*k}" fill="none" stroke="#4aa3ff" stroke-dasharray="4 5"/><text x="${cx+8}" y="${cy-100*k+14}">100 m</text>`)+
      `<g class="hit" data-k="eagle"><polygon points="${p.eagle[0]-9},${p.eagle[1]} ${p.eagle[0]},${p.eagle[1]-9} ${p.eagle[0]+9},${p.eagle[1]} ${p.eagle[0]},${p.eagle[1]+9}" fill="#d8a640" stroke="#fff"/><text x="${p.eagle[0]+14}" y="${p.eagle[1]+4}">Descent Stage</text></g>`+
      `<g class="hit" data-k="easep"><rect x="${p.easep[0]-6}" y="${p.easep[1]-5}" width="12" height="10" fill="#4aa3ff" stroke="#fff"/><text x="${p.easep[0]+12}" y="${p.easep[1]+4}">EASEP / PSEP</text></g>`+
      `<g class="hit" data-k="mirror"><circle cx="${p.mirror[0]}" cy="${p.mirror[1]}" r="4" fill="#3ddc84" stroke="#fff"/><text x="${p.mirror[0]-46}" y="${p.mirror[1]-7}">Mirror</text></g>`+
      `<text x="8" y="292">${zoomed?'Zoomed in: close-up of our gear':'Walking perimeter (north is up)'}</text>`;
    svg.querySelectorAll('.hit').forEach(g=>g.addEventListener('click',()=>{info.innerHTML=items[g.dataset.k];}));
    btn.textContent=zoomed?'Zoom out to full camp':'Zoom in on my neighbors';
  }
  btn.onclick=()=>{zoomed=!zoomed;draw();}; draw();
  w.append(svg,btn,info); return w;
}
function stagingDiagram(){
  const w=el('div'); w.appendChild(el('span','flag','HOW MY TWO HALVES SEPARATED'));
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 320 300'); svg.setAttribute('class','diag');
  svg.innerHTML=`<rect width="320" height="300" fill="#1d1d1f"/><rect y="262" width="320" height="38" fill="#8d8b86"/>
   <g id="descentG"><polygon points="95,214 225,214 213,250 107,250" fill="#d8a640" stroke="#fff"/>
     <line x1="105" y1="248" x2="70" y2="262" stroke="#cfd5df" stroke-width="3"/><line x1="215" y1="248" x2="250" y2="262" stroke="#cfd5df" stroke-width="3"/>
     <polygon points="150,250 170,250 178,262 142,262" fill="#3a3d45"/><text x="115" y="238" style="fill:#1b1200;font-weight:600">Descent stage</text></g>
   <g id="ascentG" class="stack-up"><polygon points="115,160 205,160 200,214 120,214" fill="#cfd2d8" stroke="#fff"/><rect x="150" y="175" width="20" height="16" fill="#0c1a2e"/>
     <text x="127" y="206" style="fill:#1b1f27;font-weight:600">Ascent stage</text>
     <g id="flame" style="display:none"><polygon points="145,214 175,214 160,248" fill="#ffb347"/></g></g>
   <text id="lbl" x="160" y="30" text-anchor="middle" style="font-size:14px">Both stages resting on the Moon</text>`;
  const btn=el('button','btn red','Ignite ascent engine'); btn.style.marginTop='8px';
  const info=el('div','pinfo','I landed as one complete spacecraft. Tap below to see how I launched my crew back to orbit.');
  let launched=false;
  btn.onclick=()=>{ if(launched) return; launched=true; btn.disabled=true;
    const a=svg.querySelector('#ascentG'), f=svg.querySelector('#flame'); f.style.display='';
    requestAnimationFrame(()=>{a.style.transform='translateY(-120px)';});
    svg.querySelector('#lbl').textContent='Liftoff from Tranquility Base!';
    setTimeout(()=>{f.style.display='none'; info.innerHTML='<b>My golden descent stage stayed behind as the launch pad.</b> My upper cabin carried Neil and Buzz back up to dock with Columbia.';},1500);
  };
  w.append(svg,btn,info); return w;
}

/* =====================================================================
   NARRATIVE STORY (FIRST-PERSON HARDWARE VOICE, ACCURATE NASA DATA)
   ===================================================================== */
async function story(){
  /* ---------------- Part 1 ---------------- */
  chapter(1,'Signal Received');
  await say('<i>*Crackles through the static...*</i> Hello down there on Earth! Someone finally tuned into my frequency.');
  await say('I&rsquo;m the <b>Apollo 11 Lunar Module</b>—though you probably know me by the radio callsign my crew used on landing day: <b>&ldquo;Eagle.&rdquo;</b> Back in July 1969, I was the very first crewed spacecraft to touch down on the Moon.');
  if(S.name){
    await say('Wait a second—I recognize your signal, <b>{name}</b>! Good to hear from you again. Want me to take you back through how we pulled off that landing?');
  } else {
    await say('Before I tell you how it felt to touch lunar dust for the first time, who am I talking to?');
    S.name=await nameInput(); save();
    await youSay(S.name);
    await say('Nice to meet you, <b>{name}</b>! It gets pretty quiet out here in the Sea of Tranquility, so having someone to share my story with means a lot.');
  }
  award('first',10,'First contact established'); giveBadge('first');
  const a1=await ask(['Tell me the whole adventure!','How did you get to the Moon?']);
  await say(a1===0?'I like your curiosity! Let&rsquo;s rewind all the way back to July 1969.':'That&rsquo;s the best place to start. Let&rsquo;s go back to launch day.');
  await say('On <b>16 July 1969</b>, a giant Saturn V rocket launched us from Cape Canaveral. For the three-day trip to the Moon, my crew rode inside the Command Module <b>Columbia</b>—and once we entered lunar orbit, Neil Armstrong and Buzz Aldrin crawled through the docking tunnel into me!');
  await say('Unlike Columbia, I wasn&rsquo;t built for Earth&rsquo;s atmosphere: I had no wings, no heat shield, and <b>no seats!</b> While flying inside me, my two astronauts stood upright, strapped in with restraint cables so they could look right out my triangular windows.');
  await photo(IMG.eagle,'Michael Collins snapped this photo of me from Columbia right after we undocked in lunar orbit. Notice my four legs stretched out and ready!','REAL NASA PHOTO');
  await say('That was the moment of truth—flying solo above the craters with zero air and nowhere to glide.');
  award('c1',10,'Part 1 complete');
  await ask(['How were you built for that?']);

  /* ---------------- Part 2 ---------------- */
  chapter(2,'Under My Gold Foil');
  await say('If you look closely at me, you&rsquo;ll see I&rsquo;m actually <b>two spacecraft stacked together</b>. My top half is my pressurized crew cabin—the <b>ascent stage</b>—and my golden bottom half is my <b>descent stage</b>, packed with fuel tanks, landing legs, and science gear.');
  const mw=modelWidget(); await widget(mw.wrap); mw.mount();
  await say('Go ahead and spin me around right here. Tap my legs, my engine bell, or my radar and antennas—I&rsquo;ll show you how every piece kept my crew alive.');
  await ask(['I checked out your parts!','Keep going with the story']);
  await say('From one round footpad to the opposite one, I stretch <b>9.4 meters</b> wide. That wide stance was my secret weapon against tipping over on uneven lunar terrain.');
  deepDive('body','My Engineering Specs (NASA NSSDCA 1969-059C / 059D)',[
    ['Total launch mass','15,103 kg (both stages fully fueled)'],
    ['Ascent stage (1969-059C)','2,445 kg dry + 2,376 kg propellant'],
    ['Descent stage (1969-059D)','2,034 kg dry + 8,248 kg propellant'],
    ['Descent engine','Up to ~45,000 N, deep-throttling'],
    ['Ascent engine','~15,000 N, fixed thrust'],
    ['Attitude thrusters','4 clusters of four 450 N thrusters'],
    ['Electrical power','6 silver-zinc batteries'],
    ['Guidance &amp; radar','Landing radar, inertial platform, and Apollo Guidance Computer'],
    ['Life support','Oxygen supply with cabin pressure and thermal control'],
    ['Communications','Steerable S-band dish to Earth; VHF radios to crew and Columbia']
  ]);
  await quiz('legs','How many landing legs hold me up on the lunar surface?',['Two','Three','Four','Six'],2,'Four wide legs with round footpads, keeping my belly 1.5 meters above the lunar soil.');
  award('c2',10,'Part 2 complete');
  await say('Now comes the tensest twelve minutes of my entire life.');
  await ask(['Tell me about the landing!']);

  /* ---------------- Part 3 ---------------- */
  chapter(3,'Twelve Minutes to Touchdown');
  await say('It was <b>20 July 1969</b>. At <b>17:44 UT</b>, the latches popped open and I undocked from Columbia. Michael Collins flew around me to check that all four of my legs were locked in place.');
  await say('At <b>19:08 UT</b>, I fired my descent engine for 30 seconds, dropping myself down to just <b>14.5 kilometers</b> above the lunar surface.');
  await say('Then, at <b>20:05 UT</b>, I lit my engine for the final powered descent—a <b>756.3-second</b> burn, about 12 and a half minutes of continuous braking while dodging boulders and watching my fuel gauge tick down. Want to feel what that descent was like?');
  const g=await landingGame();
  if(g.success){
    if(award('land',30,g.auto?'Guided descent complete':'Manual touchdown complete')){ giveBadge('pilot'); }
    await say(g.auto?'Smooth work! Even with computer guidance, timing that final braking burn takes nerves of steel.':'What a touchdown, <b>{name}</b>! You brought me down gently without wasting a drop of propellant.');
  } else {
    await say('Landing in one-sixth gravity without air resistance is tricky business—even our real guidance computer had alarms ringing on the way down!');
  }
  await say('At <b>20:17:40 UT</b>, blue contact probes under my footpads brushed the dust, my engine shut off, and I settled onto the Moon. Neil keyed his mic and told Houston: <i>&ldquo;Tranquility Base here, the Eagle has landed.&rdquo;</i>');
  await widget(moonMap());
  await say('They named our landing site <b>Tranquility Base</b>, inside the <b>Sea of Tranquility</b>. Despite the name, there isn&rsquo;t a drop of ocean water here—just ancient, dark volcanic plains.');
  await photo(IMG.surface,'That&rsquo;s my descent stage standing on the Moon right after touchdown—my gold Kapton thermal foil gleaming in the harsh sunlight.','REAL NASA PHOTO');
  deepDive('landing','Descent Timeline (20 July 1969)',[
    ['17:44 UT','Undocked from Command Module Columbia'],
    ['18:11 UT','Separation maneuver'],
    ['19:08 UT','30-second descent orbit insertion burn'],
    ['Perilune altitude','14.5 km above the lunar surface'],
    ['20:05 UT','756.3-second powered descent begins'],
    ['20:17:40 UT','Touchdown (4:17:40 p.m. EDT)'],
    ['Coordinates','0.67416&deg; N, 23.47314&deg; E (verified by LRO imagery)']
  ]);
  await quiz('burn','Roughly how long did my final powered landing burn last?',['About 30 seconds','About 12 and a half minutes','About 3 hours'],1,'756.3 seconds—just over 12 and a half minutes from lunar orbit to touchdown.');
  award('c3',10,'Part 3 complete');
  await ask(['What happened when the hatch opened?']);

  /* ---------------- Part 4 ---------------- */
  chapter(4,'Footprints Around My Legs');
  await say('For over six hours after landing, my cabin buzzed with preparation as Neil Armstrong and Buzz Aldrin suited up and depressurized my interior. At <b>02:39:35 UT on 21 July</b>, Neil pushed open my forward hatch.');
  await say('Neil emerged onto my porch at <b>02:51:16 UT</b>, climbed down my ladder, and at <b>02:56:15 UT</b> pressed his left boot into the lunar dust—speaking those famous words about one small step and one giant leap. Right away, he scooped a quick contingency soil sample into his pocket in case we had to leave early.');
  await say('Nineteen minutes later, at <b>03:15:15 UT</b>, Buzz stepped onto the surface beside him, looking out across the silent horizon and calling it <b>&ldquo;magnificent desolation.&rdquo;</b>');
  await photo(IMG.walker,'Neil took this shot of Buzz standing beside me—you can actually see me and Neil reflected right inside Buzz&rsquo;s gold visor!','REAL NASA PHOTO');
  await say('Together, they unveiled the commemorative plaque on my forward leg strut, planted the U.S. flag, took a phone call from the President, and collected <b>21.55 kg</b> of Moon rocks and core samples.');
  await say('They never wandered more than about <b>100 meters</b> away from my legs—walking roughly <b>250 meters</b> in total—so I stayed right in sight as their safe home base.');
  await say('When their oxygen supplies ran low, they hoisted the sample boxes up into my cabin with a conveyor strap, climbed back inside, and sealed my hatch around <b>05:11:12 UT</b>.');
  deepDive('walk','Extravehicular Activity (EVA) Log (21 July 1969)',[
    ['Hatch opened','02:39:35 UT'],
    ['Armstrong egress','02:51:16 UT'],
    ['First step on Moon','02:56:15 UT'],
    ['Aldrin on surface','03:15:15 UT'],
    ['EVA durations','Armstrong: 2 h 31 min 37 sec (hatch-to-hatch); Aldrin: 1 h 50 min 24 sec'],
    ['Exploration radius','Within ~100 m of my legs (~250 m total distance)'],
    ['Geological haul','21.55 kg of lunar rock and soil + 2 core tubes'],
    ['Hatch closed','~05:11:12 UT']
  ]);
  await quiz('range','How far from my landing legs did Neil and Buzz venture?',['Within about 100 meters','About 5 kilometers','Over 20 kilometers'],0,'They stayed within roughly 100 meters of me—about the length of a football field.');
  award('c4',10,'Part 4 complete');
  await ask(['Did they leave any science gear behind?']);

  /* ---------------- Part 5 ---------------- */
  chapter(5,'My Silent Science Neighbors');
  await say('They sure did! Before climbing back inside, they unpacked a set of scientific instruments near my descent stage so Tranquility Base would keep studying the Moon after liftoff.');
  await say('The centerpiece was <b>EASEP</b> (the Early Apollo Scientific Experiment Package), including the <b>48 kg Passive Seismic Experiment Package (PSEP)</b>—a seismometer to feel for moonquakes, a lunar dust detector, two solar panels, and an antenna to beam measurements back to Earth.');
  await widget(siteMap());
  await say('Separately, about 5 meters north-northwest of EASEP, they set down a <b>Laser Ranging Retroreflector</b>—a special array of corner-cube mirrors that needs zero batteries. Even today, observatories on Earth bounce laser pulses off it to measure the Moon&rsquo;s distance!');
  await say('During the harsh lunar noon, PSEP ran about <b>30 degrees Celsius hotter</b> than engineers had designed for and paused sending data on <b>3 August 1969</b>. After cooling down, it resumed operating in the next lunar day until commands ended permanently on <b>27 August 1969</b>.');
  deepDive('easep','EASEP &amp; Surface Experiments Telemetry',[
    ['PSEP mass','48 kg (Passive Seismic Experiment Package &amp; dust detector)'],
    ['Separate packages','Laser Ranging Retroreflector (LRRR) &amp; Solar Wind Composition foil (returned to Earth)'],
    ['Power supply','Two solar panels + radioisotope heaters'],
    ['Location','PSEP ~17 m south of descent stage; LRRR ~5 m north-northwest of PSEP'],
    ['Frequencies','2119 MHz uplink / 2276.5 MHz downlink'],
    ['Activated','04:40:39 UT, 21 July 1969'],
    ['Operations log','Paused 3 August 1969 (lunar noon heat); resumed next lunar day until 27 August 1969']
  ]);
  await quiz('seis','Which instrument listened for vibrations and moonquakes inside the lunar crust?',['The dust detector','The laser retroreflector','The passive seismometer'],2,'The passive seismometer detected vibrations in the lunar crust and helped scientists study the Moon&rsquo;s interior.');
  award('c5',10,'Part 5 complete');
  await ask(['How did your crew fly back home?']);

  /* ---------------- Part 6 ---------------- */
  chapter(6,'The Great Separation');
  await say('After <b>21 hours and 36 minutes</b> on the Moon, it was time for my crew to head back to Earth—and that meant my two stages had to part ways forever.');
  await say('At <b>17:54:01 UT on 21 July</b>, explosive bolts severed the connections between my upper cabin and my lower stage. My golden descent stage stayed anchored to the dust as a <b>launch pad</b> while my ascent stage rocketed back into lunar orbit!');
  await widget(stagingDiagram());
  await say('My upper cabin rendezvoused and docked with Columbia at <b>21:35 UT on 21 July</b>. Once Neil, Buzz, and their 21.55 kg of Moon rocks floated safely across, Columbia jettisoned my empty ascent stage into lunar orbit at <b>23:41:31 UT</b> (followed by Columbia&rsquo;s separation maneuver at <b>00:02:01 UT on 22 July</b>).');
  await say('What happened to my upper cabin after that? It remained in lunar orbit for several months before its orbit decayed and it impacted the Moon at an unknown location. Meanwhile, my golden lower half stayed right where we landed.');
  deepDive('lift','Ascent &amp; Rendezvous Log',[
    ['Surface stay','21 hours 36 minutes'],
    ['Lunar liftoff','17:54:01 UT, 21 July 1969'],
    ['Columbia docking','21:35 UT, 21 July 1969'],
    ['Ascent stage jettison','23:41:31 UT, 21 July 1969 (CSM separation at 00:02:01 UT, 22 July)'],
    ['Ascent stage (1969-059C) fate','Remained in lunar orbit for several months before impacting the Moon (impact site unknown)'],
    ['Descent stage (1969-059D) fate','Intact on the lunar surface at Tranquility Base']
  ]);
  await quiz('stay','Which half of me remained permanently at Tranquility Base on the Moon?',['My ascent cabin','My golden descent stage','Neither—both flew back to Earth'],1,'My golden descent stage stayed behind at Tranquility Base, serving as the launch platform for my upper cabin.');
  award('c6',10,'Part 6 complete');
  await ask(['What is it like at Tranquility Base now?']);

  /* ---------------- Part 7 ---------------- */
  chapter(7,'Still Resting in Tranquility');
  await say('My golden descent stage still rests right where my four footpads settled in July 1969! Up here, a single lunar day-and-night cycle takes about <b>29.5 Earth days</b>—two weeks of intense sunlight followed by two weeks of pitch-black, freezing night.');
  await say('My descent stage has watched roughly <b>700 sunrises and sunsets</b> roll across the Sea of Tranquility since Apollo 11. Not bad for hardware built for a single weekend!');
  await say('And later Lunar Modules on Apollo 15, 16, and 17 carried folded-up electric <b>Lunar Roving Vehicles</b> tucked right inside their descent bays so astronauts could drive miles across the mountains.');
  await say('Whenever you step outside tonight and look up at the Moon, find the dark smooth patch on its upper right side—that&rsquo;s Tranquility Base. Before you sign off, want to see how much of my mission you remember?');
  await ask(['Ask me anything!']);
  const q1=await quiz('f1','On what date did my footpads touch down on the Moon?',['20 July 1969','16 July 1969','2 August 1971'],0,'20 July 1969 at 20:17:40 UT—four days after launching from Earth on 16 July.');
  const q2=await quiz('f2','How much Moon rock and soil did Neil and Buzz bring back inside me?',['2.1 kg','21.55 kg','215 kg'],1,'21.55 kg of lunar rocks and soil, plus two core tubes.');
  const q3=await quiz('f3','What happened to my two stages after the mission?',['Both flew back to Earth','My descent stage stayed at Tranquility Base; my ascent stage later impacted the Moon','Both stayed on the launch pad'],1,'My golden descent stage remained at Tranquility Base, while my ascent stage was jettisoned in lunar orbit and later impacted the Moon.');
  award('c7',10,'Part 7 complete');
  const right=[q1,q2,q3].filter(Boolean).length;
  await say(right===3?'Three for three! You know my mission inside and out, <b>{name}</b>.':`${right} out of 3! Great job following my mission log, <b>{name}</b>.`);
  giveBadge('friend'); award('end',40,'Mission story completed');
  sysNote('Mission Complete! New badges and customization finishes are now available in your sidebar profile.');
  await say('My younger cousins—the electric <b>Lunar Rovers</b>—are parked at later Apollo landing sites across the Moon. Go say hello to them for me, and tell them Tranquility Base says hi!');
  const end=el('div'); end.appendChild(el('span','flag','CONTINUE EXPLORING'));
  const links=el('div','end',`<a class="btn red" href="${NEXT_PAGE}">Meet the Lunar Rovers</a><a class="btn" href="${HOME}">Back to the roadmap</a><button class="btn" id="again">Replay this story</button>`);
  end.appendChild(links); await widget(end);
  $('#again').onclick=()=>location.reload();
}

/* ---------- start ---------- */
renderSide();
story().catch(err=>{console.error(err);moduleRow('Transmission interrupted. Please reload the page.');});

