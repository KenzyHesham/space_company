'use strict';
const $ = id => document.getElementById(id);

/* ---------- profile saved by the story pages ---------- */
let suit = '#f2f4f8', pname = 'Explorer', basePts = 0, G = { done: {}, pts: 0, stars: 0, kid: false };
try {
  const s1 = JSON.parse(localStorage.getItem('astrotales.v1') || 'null'), s2 = JSON.parse(localStorage.getItem('astrotales.lrv.v1') || 'null');
  const suits = { classic: '#f2f4f8', orange: '#ff8a3d', blue: '#7dbbff', gold: '#f2f4f8' };
  const a = (s1 && s1.astro) || (s2 && s2.astro) || 'classic'; if (suits[a]) suit = suits[a];
  if (s1 && s1.name) pname = s1.name;
  basePts = (s1?.score || 0) + (s2?.score || 0);
  Object.assign(G, JSON.parse(localStorage.getItem('astrotales.game.v1') || '{}'));
} catch (e) {}
const save = () => { try { localStorage.setItem('astrotales.game.v1', JSON.stringify(G)); } catch (e) {} };

/* ---------- real NASA photos via Wikimedia (as in main.js) ---------- */
const uc = {};
async function wiki(t, w) {
  const k = t + w; if (uc[k]) return uc[k]; if (!/^(File:|search:)/.test(t)) return t;
  try {
    const q = t.startsWith('search:') ? `generator=search&gsrsearch=${encodeURIComponent(t.slice(7))}&gsrnamespace=6&gsrlimit=1` : `titles=${encodeURIComponent(t)}`;
    const r = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&${q}&prop=imageinfo&iiprop=url&iiurlwidth=${w}&format=json&origin=*`)).json();
    const i = Object.values(r?.query?.pages || {})[0]?.imageinfo?.[0]; return uc[k] = i?.thumburl || i?.url || null;
  } catch (e) { return null; }
}
async function img(list, w) {
  for (const t of list) { const s = await wiki(t, w); if (!s) continue; const im = new Image(); if (await new Promise(r => { im.onload = () => r(1); im.onerror = () => r(0); im.src = s; })) return im; }
  return null;
}

/* ---------- tiny sound engine ---------- */
let AC, mute = false;
function snd(f, d = .12, type = 'sine', v = .06, to) {
  if (mute) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d);
  } catch (e) {}
}
const ding = () => { snd(880, .14); setTimeout(() => snd(1320, .2), 80); };
const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => snd(f, .25, 'triangle', .08), i * 120));

/* ---------- missions (facts: NASA NSSDCA 1969-059C & 1971-063C, NASA Science MER page) ---------- */
const st = (x, y, h, p, m, f, o) => Object.assign({ x, y, r: 70, h, p, m, f }, o);
const M = [
{ name: 'Eagle', tag: 'MOON \u00b7 1969', title: 'Tranquility Base', blurb: 'Team up with Eagle and put science on the Moon.', kick: '20 JULY 1969 \u00b7 SEA OF TRANQUILITY',
  gr: [150, 147, 142], seed: 11, nc: 26, ww: 2400, wh: 1400, hw: [400, 760], start: [560, 900], stars: 12, mars: 0,
  av: ['File:Apollo 11 Lunar Module Eagle in landing configuration in lunar orbit from the Command and Service Module Columbia.jpg', 'File:Apollo 11 lunar module.jpg'],
  ph: ['File:Aldrin Apollo 11 original.jpg', 'search:Buzz Aldrin Apollo 11 visor reflection'],
  intro: `Hi ${pname}! I'm Eagle, the Apollo 11 lunar module. At 20:17:40 UT on 20 July 1969 I landed right here in the Sea of Tranquility, and the crew radioed: "The Eagle has landed." Come on, let's put science on the Moon together!`,
  st: [
    st(470, 830, 'Collect the experiments', 'Walk to my ladder and wait a moment to pick up the science boxes.', 'Got them! EASEP and the laser reflector were stowed inside my descent stage.', 'My descent stage carried the lunar equipment and experiments.'),
    st(1000, 900, 'Deploy EASEP', 'Carry EASEP out to the golden beacon and set it down.', 'EASEP is down! Its two solar panels face east and west, so it only works in lunar daylight.', 'EASEP weighed 48 kg and carried a seismometer and a dust detector. It was deployed about 17 m south of the lander and switched on from Earth at 04:40:39 UT on 21 July.', { put: 'easep' }),
    st(1130, 830, 'Place the laser reflector', 'Now set the laser reflector close by.', 'Reflector placed. It needs no power at all!', 'The laser ranging retroreflector sat about 5 m NNW of EASEP and needed no power.', { put: 'lrrr' }),
    st(1750, 520, 'Collect rocks', 'Walk out to the rocks and collect samples.', 'Rocks bagged! Scientists on Earth will love these.', 'The crew collected 21.55 kg of rock and soil, walked about 250 m and went up to about 100 m from me.', { put: 'rocks' }),
    st(470, 830, 'Back to Eagle', 'Head home to my ladder.', 'Hatch closed. Thank you, partner!', 'After 21 h 36 min on the surface my ascent stage lifted off at 17:54:01 UT on 21 July. EASEP kept reporting until 3 August 1969, shortly before lunar sunset.')] },
{ name: 'Lunar Rover', tag: 'MOON \u00b7 1971', title: 'Hadley\u2013Apennine', blurb: 'Drive the Lunar Roving Vehicle and build a science station.', kick: '30 JULY 1971 \u00b7 HADLEY\u2013APENNINE',
  gr: [138, 135, 129], seed: 23, nc: 18, ww: 2600, wh: 1400, hw: [420, 800], start: [520, 900], stars: 14, mars: 0, rille: 1,
  cr: [[900, 780, 80], [1400, 1050, 95], [1750, 760, 85], [2150, 1100, 90]],
  av: ['File:Apollo 15 Lunar Roving Vehicle.jpg'], ph: ['search:Apollo 15 Lunar Roving Vehicle Irwin Mount Hadley'],
  intro: `Beep beep, ${pname}! I'm the Lunar Roving Vehicle. Falcon landed at the foot of the Apennine mountains on 30 July 1971, and I'm going to take its crew farther than anyone had ever driven on the Moon. Hop in and steer!`,
  st: [
    st(420, 800, 'Hop in the rover', 'Walk to the rover and wait a moment to climb aboard.', 'Seat belt on! You drive now. Touch and hold the screen to steer!', 'I was used for the first time on Apollo 15 and explored within about 5 km of the landing site.', { ride: 1 }),
    st(1000, 420, 'Hadley Rille', 'Drive up to the edge of Hadley Rille. Craters make me bumpy!', 'Wow, look at that giant canyon!', 'The first drive covered 10.3 km: Hadley Rille, Elbow Crater and the area near St. George Crater.'),
    st(1500, 840, 'Deep core sample', 'Roll on to the drilling spot.', 'Core tube is full!', 'A core sample was taken from 3 m below the surface. In total the crew gathered 77.31 kg of rock and soil.', { put: 'core' }),
    st(1950, 560, 'Deploy ALSEP', 'Park at the beacon to set up the science station.', 'ALSEP is humming! It phones home to Earth.', 'The 25 kg central station runs on a SNAP-27 RTG (plutonium-238, about 70 W) and had seven instruments. It ran until 30 September 1977.', { put: 'alsep' }),
    st(2300, 980, 'Hammer and feather', 'Drive to the last stop for a famous experiment!', 'Both landed together. No air, no drag!', 'David Scott dropped a hammer and a feather and they fell at the same rate. Three moonwalks: 18 h 35 min and 27.9 km in total.', { fx: 'drop' })] },
{ name: 'Opportunity', tag: 'MARS \u00b7 2004', title: 'Meridiani Planum', blurb: 'Help Opportunity clean its panels and hunt for ancient water.', kick: '24 JANUARY 2004 \u00b7 MERIDIANI PLANUM, MARS',
  gr: [158, 80, 48], seed: 37, nc: 22, ww: 2600, wh: 1400, hw: [420, 800], start: [560, 900], stars: 14, mars: 1, big: [[620, 820, 480, 290, 'Eagle'], [2000, 1010, 330, 200, 'End']],
  av: ['https://photojournal.jpl.nasa.gov/jpeg/PIA04834.jpg', 'File:PIA07372-MarsOpportunityRover-SelfPortrait-20041220-crop-rotate-sm.jpg'],
  ph: ['File:PIA07372-MarsOpportunityRover-SelfPortrait-20041220-crop-rotate-sm.jpg'],
  intro: `Hello ${pname}! I'm Opportunity, one of NASA's twin Mars rovers. I landed on 24 January 2004 at Meridiani Planum, where minerals hint at a wet past. Dust is covering my solar panels, so I'm a little sleepy. Help me out?`,
  st: [
    st(440, 800, 'Clean the panels', 'Walk up to me and wait while you brush off my solar panels.', 'Ahh, sunshine! Panels clean and power back to 100%.', 'I run on solar power. Martian wind sometimes cleaned my panels too, as you can see in my 2014 self-portrait.', { pw: 1 }),
    st(1000, 640, 'Scan the rocks', 'Follow me! Stand near the rocks while I scan them.', 'Scan complete: these minerals formed in water!', 'Meridiani was chosen because mineral deposits hinted at a wet history. The rocks I studied show water was long standing there.', { scan: 1 }),
    st(1480, 500, 'Leave Eagle Crater', 'Climb out of Eagle Crater, my landing spot!', 'We made it out of the crater!', 'I landed inside a small crater called Eagle, and then drove on toward the bigger Endurance crater.'),
    st(2000, 1000, 'Endurance Crater', 'Roll down to the edge of Endurance Crater.', 'Look at those layers of rock!', 'My twin Spirit landed on 3 January 2004 at Gusev Crater, a possible former lake on the other side of Mars.'),
    st(2330, 520, 'One last look', 'Take one last look across the plains.', 'I kept exploring until the great dust storm of 2018.', 'My last contact was 10 June 2018, during a planet-wide dust storm. I drove 45.16 km, an off-Earth record until October 2026.')] }
];

/* ---------- state ---------- */
const cv = $('g'), c = cv.getContext('2d');
let vw = 0, vh = 0, Z = 1, DPR = 1, mode = 'menu', mi = 0, S = {}, T = 0, last = 0, kid = !!G.kid, gcv = null, ptr = null, dest = null, keys = {}, typer, factT;
const PI2 = Math.PI * 2;
function resize() { DPR = Math.min(2, devicePixelRatio || 1); vw = innerWidth; vh = innerHeight; cv.width = vw * DPR; cv.height = vh * DPR; Z = Math.max(.75, Math.min(1.4, Math.min(vw / 900, vh / 560))); }
addEventListener('resize', resize); resize();

function say(who, txt) {
  clearInterval(typer); $('who').textContent = who + ':'; $('sub').classList.remove('off'); const el = $('say'); let i = 0; S.talk = 90;
  typer = setInterval(() => { el.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(typer); }, 16);
}
function pop(t) { const p = $('pop'); p.textContent = t; p.classList.remove('on'); void p.offsetWidth; p.classList.add('on'); }
function fact(h, f) { const e = $('fact'); e.innerHTML = `<b>DID YOU KNOW? \u00b7 ${h.toUpperCase()}</b>${f}`; e.classList.add('on'); clearTimeout(factT); factT = setTimeout(() => e.classList.remove('on'), 11000); }
$('fact').onclick = () => $('fact').classList.remove('on');

/* ---------- world generation ---------- */
function mkGround(m) {
  const g = document.createElement('canvas'); g.width = m.ww; g.height = m.wh; const x = g.getContext('2d');
  let s = m.seed; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647, [r, gg, b] = m.gr;
  x.fillStyle = `rgb(${r},${gg},${b})`; x.fillRect(0, 0, m.ww, m.wh);
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '0,0,0'},.04)`; x.beginPath(); x.ellipse(rnd() * m.ww, rnd() * m.wh, 100 + rnd() * 260, 60 + rnd() * 160, 0, 0, PI2); x.fill(); }
  for (let i = 0; i < 7000; i++) { x.fillStyle = rnd() > .5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.11)'; x.fillRect(rnd() * m.ww, rnd() * m.wh, 1 + rnd() * 3, 1 + rnd() * 2); }
  const crater = (cx, cy, rx, ry, d) => {
    const gr = x.createRadialGradient(cx + rx * .12, cy - ry * .12, rx * .15, cx, cy, rx); gr.addColorStop(0, `rgba(0,0,0,${d})`); gr.addColorStop(.8, `rgba(0,0,0,${d * .45})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, PI2); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.2)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, rx * .97, ry * .97, 0, 3.7, 5.7); x.stroke();
  };
  for (let i = 0; i < m.nc; i++) crater(rnd() * m.ww, rnd() * m.wh, 28 + rnd() * 70, (28 + rnd() * 70) * .62, .26);
  (m.cr || []).forEach(q => crater(q[0], q[1], q[2], q[2] * .62, .38));
  (m.big || []).forEach(q => { for (let k = 0; k < 4; k++) crater(q[0], q[1], q[2] - k * 40, q[3] - k * 24, .14); x.strokeStyle = 'rgba(0,0,0,.18)'; for (let k = 1; k < 4; k++) { x.lineWidth = 2; x.beginPath(); x.ellipse(q[0], q[1], q[2] - k * 30, q[3] - k * 18, 0, 0, PI2); x.stroke(); } });
  if (m.rille) { const gr = x.createLinearGradient(0, 220, 0, 330); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.3, 'rgba(0,0,0,.55)'); gr.addColorStop(.75, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(0, 270); for (let px = 0; px <= m.ww; px += 40) x.lineTo(px, 260 + 40 * Math.sin(px / 210) + 18 * Math.sin(px / 77)); for (let px = m.ww; px >= 0; px -= 40) x.lineTo(px, 340 + 30 * Math.sin(px / 190)); x.fill(); }
  if (m.mars) { x.strokeStyle = 'rgba(0,0,0,.07)'; x.lineWidth = 2; for (let i = 0; i < 90; i++) { const px = rnd() * m.ww, py = rnd() * m.wh; x.beginPath(); x.arc(px, py, 30 + rnd() * 60, 3.6, 5.6); x.stroke(); } }
  for (let i = 0; i < 260; i++) { const px = rnd() * m.ww, py = rnd() * m.wh, rr = 2 + rnd() * 7; x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(px - rr * .7, py + rr * .5, rr * 1.2, rr * .5, 0, 0, PI2); x.fill(); x.fillStyle = `rgb(${r + 32},${gg + 30},${b + 28})`; x.beginPath(); x.ellipse(px, py, rr, rr * .7, 0, 0, PI2); x.fill(); }
  [[0, 0, m.ww, 70, 0, 0, 0, 70], [0, m.wh - 70, m.ww, 70, 0, 70, 0, 0]].forEach(q => { const gr = x.createLinearGradient(q[4], q[5], q[6], q[7]); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(q[0], q[1], q[2], q[3]); });
  return g;
}

function start(i) {
  mi = i; const m = M[i]; let s = m.seed * 3; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
  S = { p: { x: m.start[0], y: m.start[1], vx: 0, vy: 0, d: 'd', wk: 0, mv: 0 }, i: 0, hold: 0, stars: 0, star: [], pt: [], placed: [], win: 0, ride: 0, clean: !m.mars, dust: m.mars ? 1 : 0, joy: 0, talk: 0, idle: 0, fx: null, t0: performance.now(), hw: { x: m.hw[0], y: m.hw[1], mv: 0, wk: 0, f: 1 }, cam: { x: m.start[0], y: m.start[1] }, carry: 0 };
  for (let k = 0; k < m.stars; k++) S.star.push({ x: 120 + rnd() * (m.ww - 240), y: 120 + rnd() * (m.wh - 240), ph: rnd() * 6, got: 0 });
  gcv = mkGround(m); $('stars').textContent = '0';
  const a = $('avImg'); a.removeAttribute('src'); img(m.av, 400).then(im => { if (im && mi === i) a.src = im.src; });
  const p = $('phImg'); p.removeAttribute('src'); img(m.ph, 800).then(im => { if (im && mi === i) p.src = im.src; });
  $('iKick').textContent = m.kick; $('iTitle').textContent = m.title; $('iText').textContent = m.intro;
  $('menu').classList.add('off'); $('end').classList.add('off'); $('intro').classList.remove('off'); $('sub').classList.add('off'); $('fact').classList.remove('on'); mode = 'intro'; hud();
}
function hud() { const m = M[mi], s = m.st[S.i]; $('obj').textContent = s ? `${S.i + 1}/${m.st.length} \u00b7 ${s.p}` : 'Mission complete!'; }

/* ---------- effects ---------- */
function burst(x, y, n, cols, sp = 150, up = 0) { for (let k = 0; k < n; k++) { const a = Math.random() * PI2, v = (.3 + Math.random()) * sp; S.pt.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, l: 1, d: .7 + Math.random() * .8, c: cols[k % cols.length], s: 2 + Math.random() * 4 }); } }
function complete() {
  const m = M[mi], s = m.st[S.i];
  ding(); burst(s.x, s.y - 20, 36, ['#ffc542', '#3ddc84', '#4aa3ff', '#fff'], 220, 60); S.joy = 70; S.hold = 0;
  if (s.put) S.placed.push({ t: s.put, x: s.x, y: s.y }); if (s.ride) S.ride = 1; if (s.fx) S.fx = { t: 0, x: s.x, y: s.y };
  say(m.name, s.m); fact(s.h, s.f); pop(`Chapter ${S.i + 1} \u00b7 ${s.h}`); S.i++; S.carry = (mi === 0 && (S.i === 1 || S.i === 2)) ? 1 : 0; S.idle = 0; hud();
  if (S.i >= m.st.length) win();
}
function win() {
  S.win = 1; fanfare(); const m = M[mi]; let bonus = 0;
  if (!G.done[mi]) { G.done[mi] = 1; bonus = 50; G.pts += 50; }
  G.pts += S.stars; G.stars += S.stars; save();
  setTimeout(() => { burst(S.p.x, S.p.y - 40, 90, ['#ffc542', '#fc3d21', '#3ddc84', '#4aa3ff', '#fff'], 320, 160); }, 200);
  setTimeout(() => {
    const t = Math.round((performance.now() - S.t0) / 1000);
    $('eTitle').textContent = `${m.title} complete!`;
    $('eText').textContent = `You found ${S.stars} of ${m.stars} stars in ${Math.floor(t / 60)}m ${t % 60}s. ${bonus ? '+' + bonus + ' bonus points! ' : ''}You earned ${S.stars} points for stars. Total: ${basePts + G.pts} pts.`;
    $('nextBtn').style.display = mi < 2 ? '' : 'none'; $('end').classList.remove('off'); mode = 'end'; buildMenu();
  }, 3200);
}

/* ---------- drawing helpers ---------- */
const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
const lg = (x0, y0, x1, y1, a) => { const g = c.createLinearGradient(x0, y0, x1, y1); a.forEach((s, i) => g.addColorStop(i / (a.length - 1), s)); return g; };
const shadowE = (x, y, w, h) => { c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(x - w * .22, y + 3, w, h || w * .32, 0, 0, PI2); c.fill(); };
function eyes(x, y, sp, look, blink, big) {
  [-sp, sp].forEach(o => { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + o, y, big, blink ? 1 : big * 1.1, 0, 0, PI2); c.fill(); if (!blink) { c.fillStyle = '#13213f'; c.beginPath(); c.arc(x + o + look.x * big * .45, y + look.y * big * .45, big * .55, 0, PI2); c.fill(); c.fillStyle = '#fff'; c.fillRect(x + o + look.x * big * .45 - 1.5, y + look.y * big * .45 - 2.5, 2, 2); } });
}
function lookAt(x, y) { const dx = S.p.x - x, dy = S.p.y - 40 - y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d }; }
function star(x, y, r, rot) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = rot + k * Math.PI / 5 - Math.PI / 2, rad = k % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath(); }

function astro(x, y, d, wk, mv, sit) {
  const sc = kid ? .84 : 1, side = d === 'l' || d === 'r', f = d === 'l' ? -1 : 1;
  if (!sit) shadowE(x, y, 17 * sc);
  c.save(); c.translate(x, y); c.scale(sc, sc);
  const amp = mi < 2 ? 3.4 : 2, joy = S.joy > 0 && !sit;
  c.translate(0, -((mv ? Math.abs(Math.sin(wk)) * amp : Math.sin(T / 28)) + (joy ? Math.abs(Math.sin(T / 5)) * 10 : 0)));
  const sw = mv ? Math.sin(wk) * 7 : 0; if (side) c.scale(f, 1);
  const body = (px, py, w, h, r) => { c.fillStyle = suit; rr(px, py, w, h, r); c.fill(); c.fillStyle = lg(px, 0, px + w, 0, ['rgba(255,255,255,.28)', 'rgba(0,0,0,0)', 'rgba(0,0,40,.42)']); rr(px, py, w, h, r); c.fill(); };
  if (d === 'u') { c.fillStyle = lg(-13, 0, 13, 0, ['#e9ebef', '#a8aeb8']); rr(-14, -54, 28, 34, 5); c.fill(); c.fillStyle = '#8a909a'; c.fillRect(-8, -45, 16, 3); }
  if (side) { c.fillStyle = lg(-20, 0, -7, 0, ['#e9ebef', '#a8aeb8']); rr(-20, -52, 13, 31, 4); c.fill(); }
  c.fillStyle = '#34373d';
  if (side) { body(-4 + sw, -24, 9, 22, 3); body(-4 - sw, -24, 9, 22, 3); rr(-3 + sw, -4, 13, 6, 2); c.fill(); rr(-3 - sw, -4, 13, 6, 2); c.fill(); }
  else { body(-10, -24 + Math.max(0, sw / 2), 9, 22 - Math.max(0, sw / 2), 3); body(1, -24 + Math.max(0, -sw / 2), 9, 22 - Math.max(0, -sw / 2), 3); rr(-11, -4 + Math.max(0, sw / 2) * .3, 11, 6, 2); c.fill(); rr(0, -4, 11, 6, 2); c.fill(); }
  body(side ? -9 : -12, -52, side ? 18 : 24, 32, 6);
  if (d === 'd') { c.fillStyle = '#9ca3ad'; rr(-6, -44, 12, 9, 2); c.fill(); c.fillStyle = '#e04'; c.fillRect(-4, -42, 3, 2); c.fillStyle = '#3d9'; c.fillRect(1, -42, 3, 2); c.fillStyle = '#b3261e'; c.fillRect(-11, -47, 5, 2); c.fillStyle = '#1c3d8f'; c.fillRect(-11, -45, 5, 2); }
  const as = mv ? Math.sin(wk) * 6 : 0, ay = joy ? -18 : 0; c.fillStyle = '#3d4047';
  if (side) { body(-3 - as, -50 + ay, 7, 22, 3); c.fillStyle = '#3d4047'; c.fillRect(-3 - as, -30 + ay, 7, 6); }
  else { body(-19, -50 + ay + as / 2, 7, 22, 3); body(12, -50 + ay - as / 2, 7, 22, 3); c.fillStyle = '#3d4047'; c.fillRect(-19, -30 + ay + as / 2, 7, 6); c.fillRect(12, -30 + ay - as / 2, 7, 6); }
  const hx = side ? 3 : 0, hy = -63; c.fillStyle = suit; c.beginPath(); c.arc(hx, hy, 16, 0, PI2); c.fill();
  c.fillStyle = lg(hx - 14, hy - 14, hx + 14, hy + 14, ['rgba(255,255,255,.35)', 'rgba(0,0,0,0)', 'rgba(0,0,40,.45)']); c.beginPath(); c.arc(hx, hy, 16, 0, PI2); c.fill();
  if (d !== 'u') {
    const fx = side ? hx + 5 : hx, fw = side ? 9 : 11, bl = T % 220 < 7;
    c.fillStyle = '#10182c'; c.beginPath(); c.ellipse(fx, hy + 1, fw + 2, 13.5, 0, 0, PI2); c.fill();
    c.fillStyle = '#e3ad85'; c.beginPath(); c.ellipse(fx, hy + 1, fw, 12, 0, 0, PI2); c.fill();
    c.fillStyle = 'rgba(255,120,110,.4)'; [side ? [fx + 2, hy + 5] : [fx - 6, hy + 5], [fx + 6, hy + 5]].forEach(q => { c.beginPath(); c.arc(q[0], q[1], 2.6, 0, PI2); c.fill(); });
    c.fillStyle = '#2a1a12'; c.strokeStyle = '#2a1a12'; c.lineWidth = 1.5;
    (side ? [fx + 3] : [fx - 4.5, fx + 4.5]).forEach(ex => { if (bl) { c.beginPath(); c.moveTo(ex - 2, hy - 2); c.lineTo(ex + 2, hy - 2); c.stroke(); } else { c.beginPath(); c.ellipse(ex, hy - 2, 1.9, 2.6, 0, 0, PI2); c.fill(); c.fillStyle = '#fff'; c.fillRect(ex - .5, hy - 3.6, 1.2, 1.2); c.fillStyle = '#2a1a12'; } });
    c.beginPath(); c.arc(side ? fx + 3 : fx, hy + 4, joy || S.talk > 0 ? 3.6 : 3, .1, 3.04); c.stroke();
    c.fillStyle = lg(fx - 12, hy - 14, fx + 12, hy + 14, ['rgba(255,226,140,.5)', 'rgba(120,90,20,.15)', 'rgba(255,215,120,.38)']); c.beginPath(); c.ellipse(fx, hy + 1, fw, 12, 0, 0, PI2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(fx - 4, hy - 6, 2.2, 5, .6, 0, PI2); c.fill();
  }
  c.restore();
  if (S.carry && !sit) { const bb = Math.sin(T / 12) * 3; c.fillStyle = '#3ddc84'; c.fillRect(x - 12, y - 118 * sc + bb, 11, 9); c.fillStyle = '#4aa3ff'; c.fillRect(x + 1, y - 118 * sc + bb, 11, 9); }
}
function eagle(x, y) {
  shadowE(x, y, 80, 20); c.save(); c.translate(x, y); const lk = lookAt(x, y - 120), bl = T % 240 < 8;
  c.strokeStyle = '#c9ccd2'; c.lineWidth = 5; c.beginPath(); c.moveTo(-40, -42); c.lineTo(-84, 0); c.moveTo(40, -42); c.lineTo(84, 0); c.moveTo(0, -42); c.lineTo(0, 0); c.stroke();
  c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(-82 + k * 6, -4 - k * 7); c.lineTo(-72 + k * 6, -7 - k * 7); } c.stroke();
  c.fillStyle = '#d7dae0'; [-84, 0, 84].forEach(a => { c.beginPath(); c.ellipse(a, 0, 13, 4, 0, 0, PI2); c.fill(); });
  c.fillStyle = lg(-56, 0, 56, 0, ['#7c5c1a', '#e8c35c', '#b88a2b', '#6b4f15']); c.beginPath(); c.moveTo(-58, -40); c.lineTo(58, -40); c.lineTo(46, -82); c.lineTo(-46, -82); c.fill();
  c.strokeStyle = 'rgba(255,240,170,.35)'; c.lineWidth = 1; c.beginPath(); for (let k = 0; k < 16; k++) { c.moveTo(-52 + k * 7, -42); c.lineTo(-44 + k * 6, -78); } c.stroke();
  c.fillStyle = lg(-46, 0, 46, 0, ['#f4f5f8', '#c3c7ce', '#8e949e']); c.beginPath(); c.moveTo(-40, -82); c.lineTo(40, -82); c.lineTo(46, -118); c.lineTo(-46, -118); c.fill(); rr(-30, -134, 60, 18, 5); c.fill();
  [-1, 1].forEach(sg => { c.fillStyle = '#0d1426'; c.beginPath(); c.moveTo(sg * 8, -112); c.lineTo(sg * 34, -112); c.lineTo(sg * 21, -90); c.fill(); if (!bl) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sg * 21 + lk.x * 4, -105 + lk.y * 3, 4.6, 0, PI2); c.fill(); c.fillStyle = '#0d1426'; c.beginPath(); c.arc(sg * 21 + lk.x * 5.5, -105 + lk.y * 3.5, 2.2, 0, PI2); c.fill(); } });
  c.strokeStyle = '#4a4f59'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -96, S.talk > 0 ? 8 : 7, .15, 2.99); c.stroke();
  c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(22, -134); c.lineTo(22, -150); c.stroke(); c.fillStyle = '#e5e7eb'; c.beginPath(); c.ellipse(22, -152, 15, 5, -.2, 0, PI2); c.fill();
  c.restore();
}
function wheelM(x, y, r, a) { c.save(); c.translate(x, y); c.strokeStyle = '#a0a6af'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, PI2); c.stroke(); c.lineWidth = 1; c.strokeStyle = '#757b84'; c.beginPath(); for (let k = 0; k < 8; k++) { const q = a + k * .785; c.moveTo(0, 0); c.lineTo(Math.cos(q) * r, Math.sin(q) * r); } c.stroke(); c.restore(); }
function lrv(x, y, f, wk, rider) {
  shadowE(x, y, 60, 14); c.save(); c.translate(x, y); c.scale(f, 1);
  c.fillStyle = lg(0, -34, 0, -26, ['#eceef2', '#a9afb9']); rr(-50, -34, 100, 8, 3); c.fill();
  c.fillStyle = '#7c828c'; [-22, 4].forEach(sx => { rr(sx, -42, 17, 10, 3); c.fill(); });
  c.fillStyle = lg(0, -52, 0, -34, ['#f1d27a', '#9a7420']); rr(30, -54, 20, 22, 4); c.fill();
  const lk = lookAt(x, y - 40), bl = T % 230 < 8; eyes(40, -45, 5, { x: lk.x * f, y: lk.y }, bl, 4.2);
  c.strokeStyle = '#5a3b10'; c.lineWidth = 1.6; c.beginPath(); c.arc(40, -40, 4, .2, 2.9); c.stroke();
  c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(-42, -34); c.lineTo(-42, -70); c.stroke(); c.fillStyle = '#e6e8ec'; c.beginPath(); c.ellipse(-42, -72, 16, 5, -.25, 0, PI2); c.fill();
  wheelM(-34, -13, 13, wk); wheelM(34, -13, 13, wk); c.restore();
  if (rider) astro(x - 8 * f, y - 14, f > 0 ? 'r' : 'l', 0, 0, 1);
}
function rover(x, y, f, wk, mv) {
  shadowE(x, y, 58, 15); c.save(); c.translate(x, y); c.scale(f, 1);
  c.strokeStyle = '#8b929c'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-40, -12); c.lineTo(-14, -34); c.moveTo(2, -12); c.lineTo(-14, -34); c.moveTo(40, -12); c.lineTo(16, -34); c.stroke();
  [-40, 2, 40].forEach(wx => { c.fillStyle = '#23272e'; c.beginPath(); c.arc(wx, -12, 12, 0, PI2); c.fill(); c.strokeStyle = '#6e7580'; c.lineWidth = 2; c.stroke(); c.save(); c.translate(wx, -12); c.rotate(wk); c.fillStyle = '#6e7580'; c.fillRect(-1, -9, 2, 18); c.fillRect(-9, -1, 18, 2); c.restore(); });
  c.fillStyle = lg(0, -46, 0, -32, ['#f1d27a', '#a67c24']); rr(-38, -46, 76, 14, 4); c.fill();
  c.fillStyle = lg(-52, -48, 52, -60, ['#1a2e63', '#3a66c8', '#1a2e63']); c.beginPath(); c.moveTo(-54, -47); c.lineTo(54, -47); c.lineTo(42, -62); c.lineTo(-42, -62); c.fill();
  c.strokeStyle = 'rgba(170,200,255,.45)'; c.lineWidth = 1; c.beginPath(); for (let k = -5; k <= 5; k++) { c.moveTo(k * 10, -47); c.lineTo(k * 8, -62); } c.stroke();
  if (S.dust > .01) { c.fillStyle = `rgba(178,98,60,${.66 * S.dust})`; c.beginPath(); c.moveTo(-54, -47); c.lineTo(54, -47); c.lineTo(42, -62); c.lineTo(-42, -62); c.fill(); c.fillStyle = `rgba(120,60,36,${.6 * S.dust})`; for (let k = 0; k < 44; k++) c.fillRect(-44 + (k * 37 % 88), -61 + (k * 13 % 13), 3, 2); }
  c.fillStyle = '#e5e7eb'; c.fillRect(18, -94, 4, 34); rr(6, -108, 28, 16, 4); c.fill(); c.scale(f, 1);
  const lk = lookAt(x, y - 100), bl = T % 200 < 8; eyes(20 * f, -100, 6, lk, bl, 5.4); c.strokeStyle = '#5a3b10'; c.lineWidth = 1.5; c.beginPath(); c.arc(20 * f, -96, 4.2, .15, 3), c.stroke();
  if (S.dust > .3) { c.fillStyle = '#1b2b4d'; c.fillRect(12 * f - 11, -106, 22, 3); }
  c.restore();
}
function placed(o) {
  c.save(); c.translate(o.x, o.y);
  if (o.t === 'easep') { shadowE(0, 0, 36, 9); c.fillStyle = lg(0, -20, 0, 0, ['#f1d27a', '#8a6a1f']); c.fillRect(-18, -20, 36, 20); c.fillStyle = '#2a4a9c'; c.fillRect(-48, -28, 28, 26); c.fillRect(20, -28, 28, 26); c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -20); c.lineTo(0, -48); c.stroke(); c.fillStyle = '#e04'; c.fillRect(-2, -50, 4, 4); if (T % 90 < 45) { c.fillStyle = '#3ddc84'; c.fillRect(8, -12, 3, 3); } }
  if (o.t === 'lrrr') { shadowE(0, 0, 22, 6); c.fillStyle = '#9aa0a9'; c.save(); c.rotate(-.3); c.fillRect(-18, -26, 36, 20); c.fillStyle = '#555'; for (let k = 0; k < 8; k++) c.fillRect(-16 + k * 4.4, -22, 2.4, 12); c.restore(); c.fillStyle = 'rgba(255,60,60,.9)'; if (T % 60 < 8) { c.fillRect(-1, -100, 2, 80); } }
  if (o.t === 'rocks') for (let k = 0; k < 5; k++) { c.fillStyle = '#6a6761'; c.beginPath(); c.ellipse(-30 + k * 16, 6 - (k % 2) * 8, 6 + k % 3, 4, 0, 0, PI2); c.fill(); }
  if (o.t === 'core') { c.fillStyle = '#ccd'; c.fillRect(-2, -34, 4, 36); c.fillStyle = '#777'; c.fillRect(-9, -36, 18, 5); }
  if (o.t === 'alsep') { shadowE(0, 0, 50, 12); c.fillStyle = lg(0, -26, 0, 0, ['#e5e7eb', '#8a8f99']); c.fillRect(-26, -26, 36, 26); c.fillStyle = '#2b2b2f'; c.fillRect(24, -30, 16, 30); c.fillStyle = '#9a9fa8'; for (let k = 0; k < 4; k++) c.fillRect(14 + k * 4, -30 + k * 3, 2, 28 - k * 6); c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -26); c.lineTo(-8, -58); c.stroke(); c.fillStyle = '#e8e8ee'; c.beginPath(); c.ellipse(-8, -60, 12, 4, 0, 0, PI2); c.fill(); }
  c.restore();
}
function drawFlag(x, y) { shadowE(x, y, 18, 5); c.strokeStyle = '#ccd'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 90); c.moveTo(x, y - 88); c.lineTo(x + 52, y - 88); c.stroke(); c.fillStyle = '#fff'; c.fillRect(x, y - 86, 52, 34); c.fillStyle = '#b3261e'; for (let k = 0; k < 4; k++) c.fillRect(x, y - 86 + k * 10, 52, 5); c.fillStyle = '#1c3d8f'; c.fillRect(x, y - 86, 22, 19); }

/* ---------- main loop ---------- */
function update(dt) {
  const m = M[mi], p = S.p, hw = S.hw; let ix = 0, iy = 0;
  if (!S.win) {
    ix = (keys.R ? 1 : 0) - (keys.L ? 1 : 0); iy = (keys.D ? 1 : 0) - (keys.U ? 1 : 0);
    if (!ix && !iy && ptr) { const dx = ptr.x - vw / 2 - (p.x - S.cam.x) * Z + vw / 2 - vw / 2, sx = (p.x - S.cam.x) * Z + vw / 2, sy = (p.y - 30 - S.cam.y) * Z + vh / 2, ex = ptr.x - sx, ey = ptr.y - sy, d = Math.hypot(ex, ey); if (d > 14) { const k = Math.min(1, d / 90) / d; ix = ex * k; iy = ey * k; } }
    if (!ix && !iy && dest) { const ex = dest.x - p.x, ey = dest.y - p.y, d = Math.hypot(ex, ey); if (d < 10) dest = null; else { ix = ex / d; iy = ey / d; } }
    if (ix && iy && Math.abs(ix) === 1 && Math.abs(iy) === 1) { ix *= .707; iy *= .707; }
  }
  let sp = S.ride ? 330 : 190, slow = 1;
  if (S.ride && m.cr) m.cr.forEach(q => { if (Math.hypot(p.x - q[0], (p.y - q[1]) / .62) < q[2] * .8) { slow = .55; if (T % 5 === 0) burst(p.x, p.y, 3, ['#9a968f'], 70, 20); } });
  const ax = Math.min(1, dt * (S.ride ? 3 : 7));
  p.vx += (ix * sp * slow - p.vx) * ax; p.vy += (iy * sp * slow - p.vy) * ax;
  p.x = Math.max(60, Math.min(m.ww - 60, p.x + p.vx * dt)); p.y = Math.max(110, Math.min(m.wh - 40, p.y + p.vy * dt));
  const spd = Math.hypot(p.vx, p.vy); p.mv = spd > 18;
  if (p.mv) { p.wk += dt * spd / (S.ride ? 14 : 15); p.d = Math.abs(p.vx) > Math.abs(p.vy) ? (p.vx > 0 ? 'r' : 'l') : (p.vy > 0 ? 'd' : 'u'); p.f = p.vx >= 0 ? 1 : -1; if (!S.ride && T % 7 === 0) burst(p.x, p.y, 1, [m.mars ? '#c07a55' : '#b4b0a8'], 40, 10); if (S.ride && T % 3 === 0) { burst(p.x - p.f * 40, p.y, 2, [m.mars ? '#c07a55' : '#b4b0a8'], 60, 14); S.tr = S.tr || []; S.tr.push([p.x, p.y]); if (S.tr.length > 260) S.tr.shift(); } }
  if (mi === 0 && p.mv && !S.ride && T % 14 === 0) { S.tr = S.tr || []; S.tr.push([p.x, p.y + 2]); if (S.tr.length > 140) S.tr.shift(); }
  // buddy
  if (mi === 2 && S.i > 0) { const tx = p.x - 100, ty = p.y + 14, ex = tx - hw.x, ey = ty - hw.y, d = Math.hypot(ex, ey); hw.mv = d > 8; if (d > 8) { const v = Math.min(d * 2.2, 170) / d * dt; hw.x += ex * v; hw.y += ey * v; hw.wk += dt * 8; hw.f = ex >= 0 ? 1 : -1; } }
  else if (mi === 1 && S.ride) { hw.x = p.x; hw.y = p.y; }
  // dust cleaning
  if (S.clean) S.dust = Math.max(0, S.dust - dt * .8);
  // star pickups
  S.star.forEach(s => { if (!s.got && Math.hypot(p.x - s.x, p.y - 20 - s.y) < 38) { s.got = 1; S.stars++; $('stars').textContent = S.stars; ding(); burst(s.x, s.y, 14, ['#ffc542', '#fff'], 120, 40); if (Math.random() < .35) say(m.name, ['Ooh, shiny!', 'Nice catch!', 'Star power!', 'You found one!'][S.stars % 4]); } });
  // mission target
  const s = m.st[S.i];
  if (s && !S.win) {
    const tx = s.x, ty = s.y, d = Math.hypot(p.x - (mi === 2 && S.i === 0 ? hw.x + 40 : tx), p.y - (mi === 2 && S.i === 0 ? hw.y : ty));
    const near = d < (s.r + (S.ride ? 20 : 0));
    S.hold = near ? S.hold + dt : Math.max(0, S.hold - dt * 1.5);
    if (near && s.pw && !S.clean && S.hold > .3 && T % 4 === 0) burst(hw.x + (Math.random() - .5) * 70, hw.y - 56, 2, ['#c07a55', '#a86038'], 60, 40);
    if (S.hold >= (s.pw ? 1.8 : 1.2)) { if (s.pw) { S.clean = 1; } complete(); }
    S.idle += dt; if (S.idle > 14) { S.idle = 0; say(m.name, 'Psst! ' + s.p); }
  }
  if (mi === 0 && Math.hypot(p.x - hw.x, p.y - hw.y) < 230 && !S.greet) { S.greet = 1; say(m.name, `Hi ${pname}! ${m.st[0].p}`); }
  if (mi === 1 && !S.greet && S.p.x > 0) { S.greet = 1; say(m.name, m.st[0].p); }
  if (mi === 2 && !S.greet) { S.greet = 1; say(m.name, m.st[0].p); }
  if (S.fx) S.fx.t += dt; if (S.talk > 0) S.talk--; if (S.joy > 0) S.joy--;
  S.pt.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; q.l -= dt / q.d; }); S.pt = S.pt.filter(q => q.l > 0);
  const tgx = Math.max(vw / 2 / Z, Math.min(m.ww - vw / 2 / Z, p.x)), tgy = Math.max(vh / 2 / Z, Math.min(m.wh - vh / 2 / Z, p.y - 30));
  S.cam.x += (tgx - S.cam.x) * Math.min(1, dt * 5); S.cam.y += (tgy - S.cam.y) * Math.min(1, dt * 5);
}
function render() {
  const m = M[mi], p = S.p, hw = S.hw;
  c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = m.mars ? '#2a120c' : '#02040b'; c.fillRect(0, 0, vw, vh);
  c.save(); c.translate(vw / 2, vh / 2); c.scale(Z, Z); c.translate(-S.cam.x, -S.cam.y);
  c.drawImage(gcv, 0, 0);
  if (S.tr) { c.fillStyle = 'rgba(0,0,0,.2)'; S.tr.forEach(t => { if (mi === 0) { c.beginPath(); c.ellipse(t[0], t[1], 8, 3, 0, 0, PI2); c.fill(); } else { c.fillRect(t[0] - 3, t[1] - 4, 6, 2); c.fillRect(t[0] - 3, t[1] + 6, 6, 2); } }); }
  const s = m.st[S.i];
  if (s && !S.win) {
    const bx = s.x, by = s.y, pulse = 1 + Math.sin(T / 12) * .08, ex = (mi === 2 && S.i === 0) ? hw.x + 40 : bx, ey = (mi === 2 && S.i === 0) ? hw.y : by;
    c.strokeStyle = 'rgba(255,197,66,.9)'; c.lineWidth = 3; c.beginPath(); c.ellipse(ex, ey + 4, 60 * pulse, 20 * pulse, 0, 0, PI2); c.stroke();
    c.fillStyle = 'rgba(255,197,66,.14)'; c.fill();
    if (S.hold > 0) { c.strokeStyle = '#3ddc84'; c.lineWidth = 6; c.beginPath(); c.arc(ex, ey - 40, 24, -Math.PI / 2, -Math.PI / 2 + PI2 * Math.min(1, S.hold / (s.pw ? 1.8 : 1.2))); c.stroke(); }
    c.fillStyle = lg(0, ey - 190, 0, ey, ['rgba(255,197,66,0)', 'rgba(255,197,66,.3)']); c.fillRect(ex - 24, ey - 190, 48, 190);
  }
  const ents = [];
  S.placed.forEach(o => ents.push({ y: o.y, d: () => placed(o) }));
  if (mi === 0) { ents.push({ y: hw.y, d: () => eagle(hw.x, hw.y) }); ents.push({ y: 770, d: () => drawFlag(620, 770) }); }
  if (mi === 1 && !S.ride) ents.push({ y: hw.y, d: () => lrv(hw.x, hw.y, 1, 0, 0) });
  if (mi === 2) ents.push({ y: hw.y, d: () => rover(hw.x, hw.y, hw.f, hw.wk, hw.mv) });
  if (mi === 2 && S.i <= 1 || (mi === 2 && S.i === 2 && s)) ents.push({ y: 640, d: () => { for (let k = 0; k < 14; k++) { const bx = 960 + k * 10, by = 640 + (k % 3) * 2; c.fillStyle = '#2d2d36'; c.beginPath(); c.arc(bx, by, 4, 0, PI2); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx - 1.5, by - 2.5, 2, 2); } } });
  S.star.forEach(q => { if (!q.got) ents.push({ y: q.y, d: () => { const b = Math.sin(T / 20 + q.ph) * 4; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(q.x, q.y + 6, 10, 3, 0, 0, PI2); c.fill(); c.save(); c.shadowColor = '#ffc542'; c.shadowBlur = 14; c.fillStyle = '#ffd34d'; star(q.x, q.y - 12 + b, 12, T / 40 + q.ph); c.fill(); c.restore(); } }); });
  ents.push({ y: p.y, d: () => S.ride ? lrv(p.x, p.y, p.f || 1, p.wk, 1) : astro(p.x, p.y, p.d, p.wk, p.mv) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.d());
  if (mi === 2 && S.hold > 0.3 && s && s.pw) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); const bx = hw.x + Math.sin(T / 3) * 24; c.moveTo(bx - 8, hw.y - 66); c.lineTo(bx + 8, hw.y - 56); c.stroke(); }
  if (mi === 2 && S.hold > 0 && s && s.scan) { c.strokeStyle = 'rgba(255,80,80,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hw.x + hw.f * 20, hw.y - 96); c.lineTo(s.x, s.y - 4); c.stroke(); c.fillStyle = 'rgba(255,80,80,.5)'; c.beginPath(); c.ellipse(s.x, s.y - 2, 16, 6, 0, 0, PI2); c.fill(); }
  if (S.fx) { const t = Math.min(1, S.fx.t / 1.6), y = S.fx.y - 190 + 190 * t * t; c.fillStyle = '#6b4a2a'; c.fillRect(S.fx.x - 30, y - 26, 6, 28); c.fillStyle = '#8a8f99'; c.fillRect(S.fx.x - 38, y - 32, 22, 9); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(S.fx.x + 30, y - 10, 4, 14, .3, 0, PI2); c.fill(); c.strokeStyle = '#ddd'; c.beginPath(); c.moveTo(S.fx.x + 30, y - 22); c.lineTo(S.fx.x + 30, y + 2); c.stroke(); }
  S.pt.forEach(q => { c.globalAlpha = Math.max(0, Math.min(1, q.l)); c.fillStyle = q.c; c.fillRect(q.x, q.y, q.s, q.s); }); c.globalAlpha = 1;
  c.restore();
  const v = c.createRadialGradient(vw / 2, vh / 2, vh * .4, vw / 2, vh / 2, vh * .95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = v; c.fillRect(0, 0, vw, vh);
  if (s && !S.win) { // compass arrow
    const sx = (s.x - S.cam.x) * Z + vw / 2, sy = (s.y - S.cam.y) * Z + vh / 2;
    if (sx < 30 || sx > vw - 30 || sy < 90 || sy > vh - 100) { const a = Math.atan2(sy - vh / 2, sx - vw / 2), ex = Math.max(36, Math.min(vw - 36, sx)), ey = Math.max(100, Math.min(vh - 110, sy)); c.save(); c.translate(ex, ey); c.rotate(a); c.fillStyle = '#ffc542'; c.shadowColor = '#000'; c.shadowBlur = 8; c.beginPath(); c.moveTo(18, 0); c.lineTo(-10, -13); c.lineTo(-4, 0); c.lineTo(-10, 13); c.fill(); c.restore(); }
    else { c.font = '600 14px Barlow,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.shadowColor = '#000'; c.shadowBlur = 6; c.fillText(s.h.toUpperCase(), sx, sy - 210 * Z + Math.sin(T / 12) * 4); c.shadowBlur = 0; c.fillStyle = '#ffc542'; const ty = sy - 200 * Z + Math.sin(T / 12) * 4; c.beginPath(); c.moveTo(sx, ty + 14); c.lineTo(sx - 8, ty); c.lineTo(sx + 8, ty); c.fill(); }
  }
  if (ptr) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); c.arc(ptr.x, ptr.y, 22, 0, PI2); c.stroke(); }
  if (dest) { const dx = (dest.x - S.cam.x) * Z + vw / 2, dy = (dest.y - S.cam.y) * Z + vh / 2; c.strokeStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(dx, dy, 14, 6, 0, 0, PI2); c.stroke(); }
}
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; T++;
  if (mode === 'play') update(dt); else if (mode !== 'menu' && S.p) { if (S.pt) { S.pt.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; q.l -= dt / q.d; }); } }
  if (S.p && mode !== 'menu') render(); else { c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = '#02040b'; c.fillRect(0, 0, vw, vh); }
  requestAnimationFrame(loop);
}

/* ---------- input & UI ---------- */
const KM = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', ArrowUp: 'U', KeyW: 'U', ArrowDown: 'D', KeyS: 'D' };
addEventListener('keydown', e => { if (KM[e.code]) { keys[KM[e.code]] = 1; dest = null; if (mode === 'play') e.preventDefault(); } });
addEventListener('keyup', e => { if (KM[e.code]) keys[KM[e.code]] = 0; });
let pd = null;
cv.addEventListener('pointerdown', e => { ptr = { x: e.clientX, y: e.clientY }; pd = { x: e.clientX, y: e.clientY, t: performance.now() }; cv.setPointerCapture(e.pointerId); dest = null; try { AC && AC.resume(); } catch (er) {} });
cv.addEventListener('pointermove', e => { if (ptr) ptr = { x: e.clientX, y: e.clientY }; });
const up = e => { if (pd && performance.now() - pd.t < 220 && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 10 && S.p) { dest = { x: (e.clientX - vw / 2) / Z + S.cam.x, y: (e.clientY - vh / 2) / Z + S.cam.y }; } ptr = null; pd = null; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { ptr = null; pd = null; });

function buildMenu() {
  const box = $('cards'); box.innerHTML = '';
  M.forEach((m, i) => { const b = document.createElement('button'); b.className = 'mc' + (m.mars ? ' mars' : '') + (G.done[i] ? ' done' : ''); b.innerHTML = `<span class="tag">${m.tag}</span><h3>${m.title}</h3><p>${m.blurb}</p>`; b.onclick = () => { fs(); start(i); }; box.appendChild(b); });
  $('kidBtn').textContent = kid ? 'Explorer: Kid' : 'Explorer: Astronaut';
}
function fs() { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(() => {}); }
$('fsBtn').onclick = () => document.fullscreenElement ? document.exitFullscreen() : fs();
$('muteBtn').onclick = () => { mute = !mute; $('muteBtn').innerHTML = mute ? '&#128263;' : '&#128266;'; };
$('kidBtn').onclick = () => { kid = !kid; G.kid = kid; save(); buildMenu(); };
$('goBtn').onclick = () => { $('intro').classList.add('off'); mode = 'play'; snd(440, .2, 'triangle', .08, 880); };
$('menuBtn').onclick = () => { mode = 'menu'; $('menu').classList.remove('off'); $('sub').classList.add('off'); buildMenu(); };
$('againBtn').onclick = () => { $('end').classList.add('off'); $('menuBtn').click(); };
$('nextBtn').onclick = () => start(mi + 1);
$('sub').classList.add('off'); buildMenu(); requestAnimationFrame(loop);
