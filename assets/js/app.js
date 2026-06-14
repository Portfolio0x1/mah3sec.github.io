'use strict';

const GITHUB_USERNAME = 'Mah3Sec';
const MEDIUM_USERNAME = 'mah3sec';

/* ═══════════════════════════════════════════════════════
   PROCEDURAL TOPO CONTOUR MAP
   Pure JS noise → organic wavy contour lines on canvas
   ═══════════════════════════════════════════════════════ */
(function initTopo(){
  const canvas = document.getElementById('topo-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Permutation table (seeded, not random) ── */
  const P = new Uint8Array(512);
  const BASE = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,
    30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,
    203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,
    71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
    55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,
    169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,
    124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,
    28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
    129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,
    242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,
    31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,
    114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  for(let i=0;i<256;i++) P[i]=P[i+256]=BASE[i];

  function fade(t){ return t*t*t*(t*(t*6-15)+10) }
  function lerp(a,b,t){ return a+t*(b-a) }
  function grad(h,x,y){
    h &= 7;
    const u = h<4 ? x : y;
    const v = h<4 ? y : x;
    return ((h&1)?-u:u) + ((h&2)?-v:v);
  }
  function noise2d(x,y){
    const X=Math.floor(x)&255, Y=Math.floor(y)&255;
    const xf=x-Math.floor(x), yf=y-Math.floor(y);
    const u=fade(xf), v=fade(yf);
    const a=P[X]+Y, b=P[X+1]+Y;
    return lerp(
      lerp(grad(P[a],xf,yf),   grad(P[b],xf-1,yf),   u),
      lerp(grad(P[a+1],xf,yf-1),grad(P[b+1],xf-1,yf-1),u),
      v
    );
  }

  /* Fractal Brownian Motion — multiple octaves = more organic */
  function fbm(x, y, octaves){
    let v=0, amp=1, freq=1, max=0;
    for(let i=0;i<octaves;i++){
      v   += noise2d(x*freq, y*freq) * amp;
      max += amp;
      amp  *= 0.5;
      freq *= 2.1;
    }
    return v / max;
  }

  /* Build height field */
  let W, H, field, _scrollOffset = 0;

  function buildField(){
    const STEP = 3; // sample every 3px for performance
    const cols = Math.ceil(W/STEP)+1;
    const rows = Math.ceil(H/STEP)+1;
    field = { cols, rows, STEP, data: new Float32Array(cols*rows) };

    /* Multiple "peaks" — offset noise by several centres */
    const peaks = [
      {ox:0.3, oy:0.4, scale:0.9, weight:1.0},
      {ox:1.4, oy:0.2, scale:0.7, weight:0.75},
      {ox:0.8, oy:1.1, scale:0.6, weight:0.65},
      {ox:2.0, oy:0.7, scale:0.5, weight:0.5},
    ];

    const S = 0.0024; // base spatial scale
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const px = c*STEP, py = r*STEP;
        let h=0;
        for(const p of peaks){
          const nx = px*S*p.scale + p.ox;
          const ny = py*S*p.scale + p.oy + _scrollOffset;
          h += fbm(nx, ny, 5) * p.weight;
        }
        field.data[r*cols+c] = h;
      }
    }
  }

  /* Marching squares — extract one contour level */
  function marchLevel(level, lineColor){
    const {cols, rows, STEP, data} = field;
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth   = 0.9;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';

    function val(r,c){ return data[r*cols+c] - level }
    function interp(a,b){ return a/(a-b) }

    for(let r=0;r<rows-1;r++){
      for(let c=0;c<cols-1;c++){
        const v00=val(r,c), v10=val(r,c+1), v01=val(r+1,c), v11=val(r+1,c+1);
        const idx=(v00<0?0:8)|(v10<0?0:4)|(v11<0?0:2)|(v01<0?0:1);
        if(idx===0||idx===15) continue;

        const x0=c*STEP,    y0=r*STEP;
        const x1=(c+1)*STEP, y1=(r+1)*STEP;
        /* edge midpoints */
        const mT={ x:x0+interp(-v00,-v10)*(x1-x0), y:y0 };
        const mR={ x:x1, y:y0+interp(-v10,-v11)*(y1-y0) };
        const mB={ x:x0+interp(-v01,-v11)*(x1-x0), y:y1 };
        const mL={ x:x0, y:y0+interp(-v00,-v01)*(y1-y0) };

        /* lookup table → pairs of edge points */
        const segs = [
          [],            // 0
          [mL,mB],       // 1
          [mB,mR],       // 2
          [mL,mR],       // 3
          [mT,mR],       // 4
          [mL,mT,mB,mR], // 5 saddle
          [mT,mB],       // 6
          [mL,mT],       // 7
          [mL,mT],       // 8
          [mT,mB],       // 9
          [mL,mB,mT,mR], // 10 saddle
          [mT,mR],       // 11
          [mL,mR],       // 12
          [mB,mR],       // 13
          [mL,mB],       // 14
          [],            // 15
        ][idx];

        for(let i=0;i<segs.length;i+=2){
          ctx.moveTo(segs[i].x,   segs[i].y);
          ctx.lineTo(segs[i+1].x, segs[i+1].y);
        }
      }
    }
    ctx.stroke();
  }

  function draw(scrollY){
    canvas.width  = W = window.innerWidth;
    canvas.height = H = window.innerHeight;
    /* Fill bg — canvas IS the page background */
    ctx.fillStyle = '#080916';
    ctx.fillRect(0, 0, W, H);

    /* Shift noise origin by scroll so topo moves with page */
    _scrollOffset = (scrollY || 0) * 0.00015;
    buildField();

    /* Find min/max of field for normalisation */
    let mn=Infinity, mx=-Infinity;
    for(const v of field.data){ if(v<mn) mn=v; if(v>mx) mx=v; }

    const LEVELS = 22; /* number of contour lines — more = denser */
    const lineOpacity = 0.07; /* very subtle, like the reference images */

    for(let i=1;i<LEVELS;i++){
      const t   = i/LEVELS;
      const lvl = mn + t*(mx-mn);
      /* slightly thicker every 5th line — index contour */
      const isMajor = (i % 5 === 0);
      ctx.globalAlpha = isMajor ? lineOpacity * 1.6 : lineOpacity;
      ctx.lineWidth   = isMajor ? 1.1 : 0.75;
      marchLevel(lvl, isMajor ? '#7dd3fc' : '#a78bfa');
    }
    ctx.globalAlpha = 1;
  }

  /* Draw once on load */
  draw(0);

  /* Redraw on scroll (throttled with RAF) */
  let scrollRaf;
  window.addEventListener('scroll', () => {
    if(scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      draw(window.scrollY);
      scrollRaf = null;
    });
  }, {passive:true});

  /* Redraw on resize (debounced) */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => draw(window.scrollY), 250);
  }, {passive:true});
})();

const HOF = [
  {name:'Google',domain:'google.com'},{name:'Tesla',domain:'tesla.com'},
  {name:'Mastercard',domain:'mastercard.com'},{name:'Dell',domain:'dell.com'},
  {name:'Unilever',domain:'unilever.com'},{name:'Walmart',domain:'walmart.com'},
  {name:'Amazon',domain:'amazon.com'},{name:'Under Armour',domain:'underarmour.com'},
  {name:'SAP Concur',domain:'concur.com'},{name:'Coinbase',domain:'coinbase.com'},
  {name:'Indeed',domain:'indeed.com'},{name:'Zynga',domain:'zynga.com'},
  {name:'Shopify',domain:'shopify.com'},{name:'Sprout Social',domain:'sproutsocial.com'},
  {name:'Atlassian',domain:'atlassian.com'},{name:'Netgear',domain:'netgear.com'},
  {name:'PortSwigger',domain:'portswigger.net'},{name:'US DoD',domain:'defense.gov'},
  {name:'RealSelf',domain:'realself.com'},{name:'Hotstar',domain:'hotstar.com'},
  {name:'Huawei',domain:'huawei.com'},{name:'OnePlus',domain:'oneplus.com'},
  {name:'OLX',domain:'olx.com'},{name:'HackerEarth',domain:'hackerearth.com'},
  {name:'GeeksforGeeks',domain:'geeksforgeeks.org'},{name:'Crowdin',domain:'crowdin.com'},
  {name:'Klenty',domain:'klenty.com'},{name:'Buddy.works',domain:'buddy.works'},
  {name:'Overstock',domain:'overstock.com'},{name:'ECCouncil',domain:'eccouncil.org'},
  {name:'Cybrary',domain:'cybrary.it'},{name:'No-IP',domain:'noip.com'},
  {name:'Iterable',domain:'iterable.com'},{name:'Localize',domain:'localizejs.com'},
  {name:'Stripo',domain:'stripo.email'},{name:'Constant Contact',domain:'constantcontact.com'},
  {name:'Western Union',domain:'westernunion.com'},{name:'Convertkit',domain:'convertkit.com'},
  {name:'Healthunlocked',domain:'healthunlocked.com'},{name:'Pentestpartners',domain:'pentestpartners.com'},
  {name:'NCIIPC',domain:'nciipc.gov.in'},{name:'Befojji',domain:'befojji.in'},
  {name:'TheSouledStore',domain:'thesouledstore.com'},{name:'Sony',domain:'sony.com'},
  {name:'Electroneum',domain:'electroneum.com'},{name:'Caltex',domain:'caltex.com'},
  {name:'Majid Al Futtaim',domain:'majidalfuttaim.com'},
];

/* ── Progress bar + trail thread ── */
(function(){
  const bar    = document.getElementById('progress');
  const thread = document.getElementById('trail-thread');
  const update = () => {
    const t   = document.documentElement.scrollHeight - window.innerHeight;
    const pct = t ? Math.min(window.scrollY / t, 1) : 0;
    if(bar)    bar.style.transform = `scaleX(${pct})`;
    if(thread) thread.style.setProperty('--trail-progress', `${pct * 100}%`);
  };
  window.addEventListener('scroll', update, {passive:true});
  update();
})();

/* ── Nav: scroll glow + mobile toggle + active links ── */
(function(){
  const nav    = document.getElementById('mainnav');
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navLinks');
  if(!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, {passive:true});

  if(toggle && menu){
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('open'))
    );
  }

  const allSections = Array.from(document.querySelectorAll('section[id], header[id]'));
  const navLinks    = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 100;
    let active = 'top';
    allSections.forEach(s => { if(s.offsetTop <= y) active = s.id });
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${active}`));
  }, {passive:true});
})();

/* ── Text scramble ── */
function scramble(el, final){
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  const len = final.length;
  let frame = 0;
  const total = len * 1.8;
  const id = setInterval(() => {
    let out = '';
    for(let i=0; i<len; i++){
      if(i < frame * 0.7) out += final[i];
      else if(final[i]===' ') out += ' ';
      else out += CHARS[Math.floor(Math.random()*CHARS.length)];
    }
    el.textContent = out;
    if(++frame > total){ el.textContent = final; clearInterval(id); }
  }, 28);
}

/* ── Scroll reveal + scramble trigger ── */
(function(){
  if(!window.IntersectionObserver){
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el = e.target;
      const delay = parseFloat(el.dataset.revealDelay || 0) * 1000;
      setTimeout(() => {
        el.classList.add('is-visible');
        if(el.dataset.scramble !== undefined){
          const text = el.dataset.scramble || el.textContent.trim();
          scramble(el, text);
        }
      }, delay);
      obs.unobserve(el);
    });
  }, {threshold:0.12, rootMargin:'0px 0px -52px 0px'});

  document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));

  // Hero fires immediately on load, staggered
  document.querySelectorAll('#hero [data-reveal]').forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('is-visible');
      if(el.dataset.scramble !== undefined) scramble(el, el.dataset.scramble || el.textContent.trim());
    }, 120 + i * 110);
  });

  // Scramble section titles on scroll
  const scrambleObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el = e.target;
      const text = el.dataset.scramble || el.textContent.trim();
      el.classList.add('is-visible');
      scramble(el, text);
      scrambleObs.unobserve(el);
    });
  }, {threshold:0.15});
  document.querySelectorAll('[data-scramble]').forEach(el => {
    if(!el.closest('#hero')) scrambleObs.observe(el);
  });
})();

/* ── Role cycling ── */
(function(){
  const el = document.querySelector('.hero-role');
  if(!el) return;
  let roles;
  try { roles = JSON.parse(el.dataset.roles); } catch { return; }
  if(!roles.length) return;
  let idx = 0;

  function swap(){
    idx = (idx + 1) % roles.length;
    /* fade out */
    el.style.transition = 'opacity .2s ease, transform .2s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      /* swap text — force gradient repaint by toggling display */
      el.textContent = roles[idx];
      el.style.display = 'none';
      void el.offsetHeight; /* reflow */
      el.style.display = 'inline-block';
      /* fade in */
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 220);
  }

  setInterval(swap, 2800);
})();

/* ── Counter animation ── */
(function(){
  if(!window.IntersectionObserver) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el  = e.target;
      const end = parseInt(el.dataset.count, 10);
      let   cur = 0;
      const inc = Math.ceil(end / 55);
      const t = setInterval(() => {
        cur = Math.min(cur+inc, end);
        el.textContent = cur;
        if(cur >= end){ el.textContent = end; clearInterval(t); }
      }, 18);
      obs.unobserve(el);
    });
  }, {threshold:0.5});
  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
})();

/* ── Tilt effect ── */
function applyTilt(root){
  (root || document).querySelectorAll('[data-tilt]').forEach(el => {
    const max   = parseFloat(el.dataset.tilt) || 6;
    const glare = el.querySelector('.tilt-glare');
    el.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width;
      const cy = (e.clientY - r.top)  / r.height;
      el.style.transform  = `perspective(900px) rotateX(${(cy-.5)*-max}deg) rotateY(${(cx-.5)*max}deg) translateZ(5px)`;
      el.style.transition = 'transform .05s';
      if(glare){
        glare.style.setProperty('--mx', `${cx*100}%`);
        glare.style.setProperty('--my', `${cy*100}%`);
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform  = '';
      el.style.transition = 'transform .45s ease';
    });
  });
}
applyTilt(document);

/* ── Magnetic buttons ── */
(function(){
  document.querySelectorAll('.btn-magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width/2)  * .28;
      const dy = (e.clientY - r.top  - r.height/2) * .28;
      el.style.transform  = `translate(${dx}px,${dy}px)`;
      el.style.transition = 'transform .08s';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform  = '';
      el.style.transition = 'transform .45s ease';
    });
  });
})();

/* ── Social stagger ── */
(function(){
  document.querySelectorAll('.social[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = `${i * 55}ms`;
  });
})();

/* ── Toggle / collapse ── */
document.querySelectorAll('.toggle-btn').forEach(btn => {
  const targetId = btn.dataset.target;
  const target   = document.querySelector(targetId);
  if(!target) return;
  const labelClosed = btn.dataset.labelClosed || '';
  const labelOpen   = btn.dataset.labelOpen   || '';
  const labelEl     = btn.querySelector('.toggle-label');

  btn.addEventListener('click', () => {
    const open = target.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    if(labelEl) labelEl.textContent = open ? labelOpen : labelClosed;
    // apply tilt to newly revealed cards
    if(open) applyTilt(target);
  });
});

/* ── Hall of Fame ticker ── */
function buildHoF(){
  const ticker = document.getElementById('hofTicker');
  if(!ticker) return;
  const mkImg = c =>
    `<img src="https://logo.clearbit.com/${c.domain}" alt="${esc(c.name)}" loading="lazy"
      onerror="this.style.display='none'" onload="this.classList.add('loaded')" />`;
  ticker.innerHTML = [...HOF,...HOF]
    .map(c => `<div class="hof-item">${mkImg(c)}<span>${esc(c.name)}</span></div>`)
    .join('');
}

/* ── Medium writeups ── */
async function fetchMedium(){
  const el = document.getElementById('mediumPosts');
  if(!el) return;
  const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://medium.com/feed/@'+MEDIUM_USERNAME)}`;
  try {
    const res  = await fetch(api);
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    if(data.status !== 'ok' || !data.items?.length) throw new Error('empty');
    el.innerHTML = data.items.slice(0,6).map(p => {
      const thumb = p.thumbnail || firstImg(p.content||p.description||'');
      const rt    = readTime(p.content||p.description||'');
      return `
        <a class="panel wu-card" href="${p.link}" target="_blank" rel="noopener" data-tilt="4">
          <span class="tilt-glare"></span>
          ${thumb ? `<img class="wu-thumb" src="${esc(thumb)}" alt="${esc(p.title)}" loading="lazy" onerror="this.style.display='none'" />` : ''}
          <div class="wu-body">
            <div class="wu-meta">${p.pubDate ? fmt(p.pubDate) : ''}${rt ? ' · '+rt : ''}</div>
            <h3 class="wu-title">${esc(p.title)}</h3>
            <span class="wu-read">Read on Medium ↗</span>
          </div>
        </a>`;
    }).join('');
    applyTilt(el);
  } catch {
    el.innerHTML = `<div class="loading-state">Could not load — <a href="https://medium.com/@${MEDIUM_USERNAME}" target="_blank" rel="noopener" style="color:var(--purple);margin-left:6px">read on Medium ↗</a></div>`;
  }
}

/* ── Helpers ── */
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function strip(h){ const d=document.createElement('div'); d.innerHTML=h; return d.textContent||'' }
function firstImg(h){ const m=h.match(/<img[^>]+src=["']([^"']+)["']/i); return m?m[1]:'' }
function fmt(s){ try{ return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) }catch{ return '' } }
function readTime(h){ const w=strip(h).split(/\s+/).length; const m=Math.ceil(w/200); return m>0?`${m} min read`:'' }

/* ── Init ── */
/* ═══════════════════════════════════════════════════════
   ADVENTURE STICKY SCROLL — Google Maps route experience
   ═══════════════════════════════════════════════════════ */
function initAdventure(){
  const outer    = document.querySelector('.adv-sticky-outer');
  const slides   = document.querySelectorAll('.adv-bg-slide');
  const contents = document.querySelectorAll('.adv-wp-content');
  const dots     = document.querySelectorAll('.adv-dot');
  const progress = document.getElementById('advRouteProgress');
  const ring     = document.getElementById('advWpRing');
  const wpDots   = document.querySelectorAll('.adv-wp-dot');
  if(!outer || !slides.length) return;

  const WP_COUNT = 4;
  let currentWp = -1;

  /* Waypoint SVG positions (matching viewBox 0 0 100 100) */
  const WP_COORDS = [
    {cx:15, cy:85},
    {cx:50, cy:50},
    {cx:72, cy:35},
    {cx:85, cy:20},
  ];

  /* Total dash length of the route path (approx) */
  const ROUTE_LEN = 150;

  function goTo(wp){
    if(wp === currentWp) return;
    currentWp = wp;

    /* Swap background photo */
    slides.forEach((s,i) => s.classList.toggle('active', i===wp));

    /* Swap info content */
    contents.forEach((c,i) => c.classList.toggle('active', i===wp));

    /* Progress dots */
    dots.forEach((d,i) => d.classList.toggle('active', i===wp));

    /* Move ring to current waypoint */
    if(ring){
      const c = WP_COORDS[wp];
      ring.setAttribute('cx', c.cx);
      ring.setAttribute('cy', c.cy);
      ring.classList.add('visible');
    }

    /* Light up reached dots */
    wpDots.forEach((d,i) => d.classList.toggle('reached', i<=wp));
  }

  function onScroll(){
    const rect    = outer.getBoundingClientRect();
    const total   = outer.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    if(scrolled < 0 || scrolled > total + 100) return;

    const pct = Math.max(0, Math.min(1, scrolled / total));

    /* Draw route progress */
    if(progress){
      const offset = ROUTE_LEN * (1 - pct);
      progress.style.strokeDashoffset = offset;
    }

    /* Which waypoint are we at */
    const wpIndex = Math.min(WP_COUNT-1, Math.floor(pct * WP_COUNT));
    goTo(wpIndex);
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  goTo(0); /* init */
}

document.addEventListener('DOMContentLoaded', () => {
  buildHoF();
  fetchMedium();
  initAdventure();
});
