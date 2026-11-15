
const urlCache = {};
async function resolveWikiUrl(fileTitle, width = 900) {
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

const IMG = {
  bg:     ['File:ESO - Milky Way.jpg'],
  earth:  ['File:The Earth seen from Apollo 17.jpg'],
  moon:   ['File:FullMoon2010.jpg'],
  mars:   ['File:OSIRIS Mars true color.jpg'],
  eagle:  ['File:Apollo 11 Lunar Module Eagle in landing configuration in lunar orbit from the Command and Service Module Columbia.jpg',
           'File:Apollo 11 lunar module.jpg'],
  opp:    ['https://photojournal.jpl.nasa.gov/jpeg/PIA04834.jpg',
           'File:PIA07372-MarsOpportunityRover-SelfPortrait-20041220-crop-rotate-sm.jpg'],
  spirit: ['https://photojournal.jpl.nasa.gov/jpeg/PIA04835.jpg',
           'File:Spirit Rover Cleaned.jpg'],
  lrv: ['File:Apollo 15 Lunar Roving Vehicle.jpg', 'File:AS15-88-11901.jpg'],
};

async function loadImg(img, list, width = 900) {
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

document.querySelectorAll('img[data-key]').forEach(im => {
  if (IMG[im.dataset.key]) loadImg(im, IMG[im.dataset.key], 900);
});


resolveWikiUrl(IMG.bg[0], 2000).then(src => {
  if (!src) return;
  const bgImg = new Image();
  bgImg.onload = () => { document.body.style.backgroundImage = `url("${bgImg.src}")`; };
  bgImg.src = src;
});

/* ---------- twinkling stars over the photo ---------- */
const cv=document.getElementById('stars'),cx=cv.getContext('2d');let S=[];
function sizeStars(){cv.width=innerWidth;cv.height=innerHeight;
  S=Array.from({length:Math.min(130,innerWidth/8)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.3+.3,p:Math.random()*6.3,s:Math.random()*.03+.01}));}
sizeStars();addEventListener('resize',sizeStars);
(function tw(){cx.clearRect(0,0,cv.width,cv.height);
  for(const s of S){s.p+=s.s;cx.globalAlpha=.3+.65*Math.abs(Math.sin(s.p));cx.fillStyle='#fff';cx.beginPath();cx.arc(s.x,s.y,s.r,0,6.3);cx.fill();}
  requestAnimationFrame(tw);})();

/* ---------- roadmap paths + rocket ---------- */
const map=document.getElementById('map'),svg=document.getElementById('path'),rocket=document.getElementById('rocket');
const planets={earth:earth,moon:moon,mars:mars};
function center(el){const o=el.querySelector('.orb').getBoundingClientRect(),m=map.getBoundingClientRect();
  return {x:o.left-m.left+o.width/2,y:o.top-m.top+o.height/2};}
function curve(a,b,lift){return {a,b,c:{x:(a.x+b.x)/2,y:(a.y+b.y)/2-lift}};}
function bez(q,t){const u=1-t;return {x:u*u*q.a.x+2*u*t*q.c.x+t*t*q.b.x,y:u*u*q.a.y+2*u*t*q.c.y+t*t*q.b.y};}
function route(name){return curve(center(earth),center(planets[name]),name==='mars'?80:30);}
let flying=false,here=null;
function place(x,y,deg){rocket.style.opacity=1;rocket.style.transform=`translate(${x}px,${y}px) rotate(${deg}deg)`;}
function drawPaths(){
  const mk=n=>{const q=route(n);return `<path d="M${q.a.x} ${q.a.y} Q${q.c.x} ${q.c.y} ${q.b.x} ${q.b.y}"/>`};
  svg.innerHTML=mk('moon')+mk('mars');
  if(!flying&&here){const p=center(planets[here]);place(p.x,p.y-68,0);}
}
function spark(x,y){const s=document.createElement('i');s.className='spark';s.style.left=x+'px';s.style.top=y+'px';map.appendChild(s);
  s.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:`translate(${(Math.random()-.5)*20}px,16px) scale(.2)`}],{duration:700}).onfinish=()=>s.remove();}

let pts=0,xp=8;
function reward(n){pts+=n;xp=Math.min(100,xp+n*2);document.getElementById('coins').textContent=pts;document.getElementById('xp').style.width=xp+'%';}
const toast=document.getElementById('toast');let tt;
function say(msg){toast.innerHTML=msg;toast.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('show'),3800);}

function travel(name){
  if(flying)return; flying=true;
  document.querySelectorAll('.char').forEach(c=>c.classList.remove('unlocked'));
  const q=route(name),dur=2600,t0=performance.now();
  say(`Launching to ${name==='moon'?'the Moon':'Mars'}. 3... 2... 1...`);
  let last=0;
  (function step(now){
    const t=Math.min(1,(now-t0)/dur), e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const p=bez(q,e),p2=bez(q,Math.min(1,e+.01));
    const deg=Math.atan2(p2.y-p.y,p2.x-p.x)*180/Math.PI+90;
    place(p.x,p.y,deg);
    if(now-last>45){last=now;const r=(deg-90)*Math.PI/180;spark(p.x-Math.cos(r)*18,p.y-Math.sin(r)*18);}
    if(t<1)requestAnimationFrame(step); else arrive(name);
  })(t0);
}
function arrive(name){
  flying=false;here=name;const el=planets[name];
  el.classList.add('hit');setTimeout(()=>el.classList.remove('hit'),800);
  const p=center(el);place(p.x,p.y-68,0);
  document.querySelectorAll(`.char[data-planet="${name}"]`).forEach(c=>c.classList.add('unlocked'));
  reward(10);
  say(name==='moon'?'Touchdown on the Moon. Meet <b>Eagle</b>. +10 pts':'Touchdown on Mars. Meet <b>Opportunity</b> and <b>Spirit</b>. +10 pts');
}
moon.addEventListener('click',()=>travel('moon'));
mars.addEventListener('click',()=>travel('mars'));
earth.addEventListener('click',()=>{if(flying)return;here=null;rocket.style.opacity=0;say('You are on Earth. Choose the Moon or Mars to begin.');});
document.querySelectorAll('.char').forEach(c=>c.addEventListener('click',()=>{
  if(here!==c.dataset.planet){say(c.dataset.planet==='moon'?'Travel to the Moon first to meet this explorer.':'Travel to Mars first to meet these explorers.');return;}
  location.href=c.dataset.href;
}));
addEventListener('resize',drawPaths);addEventListener('load',()=>{drawPaths();setTimeout(drawPaths,700);});
drawPaths();

/* Sync total points earned from stories on the main roadmap HUD */

try {
const keysToSum = [
  'astrotales.v1',
  'astrotales.lrv.v1',
  'astrotales.opportunity.v1',
  'astrotales.spirit.v1',
  'astrotales.game.v1'
];
  let savedTotal = 0;
  keysToSum.forEach(k => {
    const data = JSON.parse(localStorage.getItem(k) || 'null');
    if (data) savedTotal += (data.score || 0) + (data.pts || 0);
  });
  if (savedTotal > 0) reward(savedTotal);
} catch (e) {}