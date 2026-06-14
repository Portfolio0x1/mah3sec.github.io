'use strict';

const GITHUB_USERNAME = 'Mah3Sec';
const MEDIUM_USERNAME = 'mah3sec';

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

/* ── Progress bar ── */
(function(){
  const bar = document.getElementById('progress');
  if(!bar) return;
  const u = () => {
    const t = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${t ? Math.min(window.scrollY/t,1) : 0})`;
  };
  window.addEventListener('scroll', u, {passive:true});
  u();
})();

/* ── Nav: scroll glow + mobile toggle + active links ── */
(function(){
  const nav    = document.getElementById('mainnav');
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');
  if(!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, {passive:true});

  if(toggle && menu){
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('is-open'))
    );
  }

  const sections = Array.from(document.querySelectorAll('.scene[id], .hero[class]'));
  const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 80;
    let active = null;
    document.querySelectorAll('section[id], header[class="hero scene"]').forEach(s => {
      if(s.offsetTop <= y) active = s.id || 'top';
    });
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
  document.querySelectorAll('.hero [data-reveal]').forEach((el, i) => {
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
    if(!el.closest('.hero')) scrambleObs.observe(el);
  });
})();

/* ── Role cycling ── */
(function(){
  const el = document.querySelector('.hero__role');
  if(!el) return;
  let roles;
  try { roles = JSON.parse(el.dataset.roles); } catch { return; }
  if(!roles.length) return;
  let idx = 0;
  setInterval(() => {
    idx = (idx+1) % roles.length;
    el.style.opacity = '0';
    el.style.translate = '0 8px';
    el.style.transition = 'opacity .18s, translate .18s';
    setTimeout(() => {
      el.textContent = roles[idx];
      el.style.opacity = '1';
      el.style.translate = '0 0';
    }, 200);
  }, 3000);
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
  const targetId = btn.dataset.toggle;
  const target   = document.querySelector(targetId);
  if(!target) return;
  const labelClosed = btn.dataset.labelClosed || '';
  const labelOpen   = btn.dataset.labelOpen   || '';
  const labelEl     = btn.querySelector('.toggle-label');

  btn.addEventListener('click', () => {
    const open = target.classList.toggle('is-open');
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
document.addEventListener('DOMContentLoaded', () => {
  buildHoF();
  fetchMedium();
});
