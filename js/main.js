/* ============ mrvxn.psd — motion & interactions ============ */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, moved: false };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.moved = true; }, { passive: true });

  const frames = [];           // fonctions appelées à chaque frame
  const onFrame = fn => frames.push(fn);
  (function tick(t) { for (const f of frames) f(t); requestAnimationFrame(tick); })(0);

  /* ---------- transitions de page (rideau rouge) ---------- */
  const curtain = $('.curtain');
  const arriving = sessionStorage.getItem('mrvxn-tr') === '1';
  sessionStorage.removeItem('mrvxn-tr');
  if (curtain && arriving) {
    curtain.style.transition = 'none'; curtain.classList.add('up');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      curtain.style.transition = ''; curtain.classList.remove('up'); curtain.classList.add('off');
    }));
  }
  $$('a[data-transition]').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || !curtain) return;
    e.preventDefault();
    sessionStorage.setItem('mrvxn-tr', '1');
    curtain.classList.remove('off'); curtain.classList.add('up');
    setTimeout(() => { location.href = a.href; }, reduced ? 0 : 720);
  }));
  addEventListener('pageshow', e => { if (e.persisted && curtain) { curtain.classList.remove('up'); curtain.classList.add('off'); } });

  /* ---------- loader ---------- */
  const loader = $('.loader');
  const ready = () => { body.classList.remove('is-loading'); body.classList.add('is-ready'); };
  if (loader && !arriving && !reduced) {
    const count = $('.loader__count'), bar = $('.loader__bar i'), status = $('.loader__label');
    const steps = ['Initialisation…', 'Lecture des préférences…', 'Chargement des polices…', 'Chargement des calques…', 'Ouverture des affiches…', 'Ouverture des covers…', 'Création de l\'espace de travail…', 'Terminé'];
    let loaded = document.readyState === 'complete';
    addEventListener('load', () => loaded = true);
    const t0 = performance.now(); let p = 0;
    (function run(t) {
      const target = clamp((t - t0) / 2600) * (loaded ? 1 : 0.9);
      p = Math.max(p, lerp(p, target, 0.12));
      const v = Math.round(p * 100);
      count.textContent = String(v).padStart(3, '0') + ' %';
      status.textContent = steps[Math.min(steps.length - 1, Math.floor(p * (steps.length - 1)))];
      bar.style.transform = `scaleX(${p})`;
      if (v >= 100 || t - t0 > 7000) {
        count.textContent = '100 %'; status.textContent = steps[steps.length - 1];
        setTimeout(() => { loader.classList.add('done'); ready(); }, 320);
        setTimeout(() => loader.remove(), 1500);
      } else requestAnimationFrame(run);
    })(t0);
  } else { loader && loader.remove(); requestAnimationFrame(ready); }

  /* ---------- horloge ---------- */
  const clock = $('[data-clock]');
  if (clock) { const up = () => clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); up(); setInterval(up, 20000); }

  /* ---------- curseur ---------- */
  const cursor = $('.cursor');
  if (cursor && matchMedia('(hover:hover)').matches) {
    const label = $('.cursor__label'); let cx = mouse.x, cy = mouse.y;
    onFrame(() => {
      cx = lerp(cx, mouse.x, 0.22); cy = lerp(cy, mouse.y, 0.22);
      cursor.style.transform = `translate(${cx}px,${cy}px)`;
      cursor.classList.toggle('on', mouse.moved);
    });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor],[data-zoom]');
      cursor.classList.toggle('big', !!t);
      if (t) label.textContent = t.dataset.cursor || 'Voir';
    });
  }

  /* ---------- découpe du texte ---------- */
  $$('[data-split]').forEach(el => {
    const txt = el.textContent; el.textContent = ''; el.setAttribute('aria-label', txt);
    [...txt].forEach((c, i) => {
      const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      w.innerHTML = `<i style="transition-delay:${i * 45}ms">${c === ' ' ? '&nbsp;' : c}</i>`; el.append(w);
    });
  });
  $$('[data-words]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/); el.textContent = '';
    words.forEach((wd, i) => {
      const w = document.createElement('span'); w.className = 'w';
      w.innerHTML = `<i style="transition-delay:${i * 28}ms">${wd}</i>`; el.append(w, ' ');
    });
  });

  /* ---------- apparitions au scroll ---------- */
  let pending = $$('.rv,.clip,[data-split],[data-words],.cds,.a-sheet section');
  onFrame(() => {
    if (!pending.length || !body.classList.contains('is-ready')) return;
    pending = pending.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.88 && r.bottom > 0) { el.classList.add('in'); return false; }
      return true;
    });
  });

  /* ---------- hero : mot géant ---------- */
  const words = $$('.hero__word-in');
  const fitters = [];
  const fit = (inner, text) => {
    const box = inner.parentElement;
    const run = () => {
      inner.style.fontSize = '100px';
      const w = inner.getBoundingClientRect().width;
      if (w) inner.style.fontSize = (100 * box.clientWidth / w * 0.985) + 'px';
    };
    fitters.push(run); run();
  };
  let letters = [];
  if (words.length) {
    words.forEach(word => {
      [...'mrvxn.psd'].forEach((c, i) => {
        const l = document.createElement('span');
        l.className = 'l' + (c === '.' ? ' dot' : i > 5 ? ' ext' : '');
        l.innerHTML = `<i style="transition-delay:${120 + i * 70}ms">${c}</i>`;
        word.append(l);
      });
      fit(word);
    });
    letters = $$('.hero__word .l i').map(el => ({ el, w: 900 }));
    // graisse variable selon la proximité du curseur
    if (!reduced) onFrame(() => {
      if (!mouse.moved || scrollY > innerHeight) return;
      for (const L of letters) {
        const r = L.el.getBoundingClientRect();
        const d = Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2));
        const target = 900 - 620 * Math.pow(clamp(1 - d / (innerWidth * 0.2)), 1.4);
        L.w = lerp(L.w, target, 0.12);
        L.el.style.fontWeight = Math.round(L.w);
      }
    });
  }
  const footWord = $('.foot__word-in'); if (footWord) fit(footWord);
  const refit = () => fitters.forEach(f => f());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  addEventListener('load', refit);
  addEventListener('resize', refit);

  /* ---------- hero : formes liquides ---------- */
  const blobG = $('.hero__blobs-g');
  if (blobG) {
    const hero = $('.hero');
    const defs = [ // x, y (fraction), rayon (fraction de largeur), amplitude, vitesse, phase
      [.06, .80, .095, .05, .21, 0], [.25, .64, .06, .07, .17, 1.7], [.42, .90, .085, .06, .13, 3.1],
      [.61, .68, .055, .08, .19, 4.4], [.80, .86, .1, .05, .15, 5.6], [.94, .60, .05, .07, .23, 2.3],
      [.5, .5, .045, 0, 0, 0] // suit le curseur
    ];
    const circles = defs.map(() => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); blobG.append(c); return c; });
    let fx = innerWidth / 2, fy = innerHeight * .6, intro = 0;
    onFrame(t => {
      if (scrollY > innerHeight) return;
      const W = hero.clientWidth, H = hero.clientHeight, s = t / 1000;
      const k = Math.max(W, 700);
      intro = lerp(intro, body.classList.contains('is-ready') ? 1 : 0, 0.03);
      const r = hero.getBoundingClientRect();
      fx = lerp(fx, mouse.x - r.left, 0.07); fy = lerp(fy, mouse.moved ? mouse.y - r.top : H * .6, 0.07);
      defs.forEach(([x, y, rad, amp, sp, ph], i) => {
        const c = circles[i], last = i === defs.length - 1;
        const m = reduced ? 0 : 1;
        const cx = last ? fx : W * x + Math.sin(s * sp * 2 + ph) * k * amp * m;
        const cy = last ? fy : H * y + Math.cos(s * sp * 1.6 + ph * 1.3) * k * amp * .8 * m + (1 - intro) * H * .6;
        c.setAttribute('cx', cx); c.setAttribute('cy', cy);
        c.setAttribute('r', k * rad * (last ? 1 : .85 + .15 * Math.sin(s * sp * 3 + ph)) * (last ? intro : 1));
      });
    });
  }

  /* ---------- panneau calques ---------- */
  $$('.layers__row').forEach(row => row.addEventListener('click', () => {
    const on = row.classList.toggle('is-on'), key = row.dataset.toggle;
    if (key === 'grain') $('.grain').classList.toggle('off', !on);
    else $$(`[data-layer="${key}"]`).forEach(el => el.classList.toggle('hidden', !on));
  }));

  /* ---------- bande horizontale (affiches) ---------- */
  const strip = $('.strip');
  if (strip) {
    const track = $('.strip__track', strip), cards = $$('.card', strip);
    const idx = $('[data-strip-i]'), total = $('[data-strip-n]');
    total.textContent = String(cards.length).padStart(2, '0');
    let dist = 0, x = 0;
    const measure = () => {
      cards.forEach(c => { c.style.setProperty('--s', 1); c.style.setProperty('--w', c.offsetWidth + 'px'); });
      dist = track.scrollWidth - innerWidth;
      strip.style.height = (innerHeight + dist) + 'px';
    };
    cards.forEach(c => $('img', c).addEventListener('load', measure));
    addEventListener('resize', measure); addEventListener('load', measure); measure();
    const state = cards.map(() => 1);
    onFrame(() => {
      const r = strip.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const p = clamp(-r.top / (r.height - innerHeight));
      x = reduced ? p * dist : lerp(x, p * dist, 0.1);
      track.style.transform = `translate3d(${-x}px,0,0)`;
      const mid = innerWidth / 2, maxS = innerWidth < 760 ? 1.45 : 1.85, range = Math.max(innerWidth * 0.2, 180);
      let best = 0, bestD = 1e9;
      cards.forEach((c, i) => {
        const b = c.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
        const f = Math.pow(clamp(1 - d / range), 1.6);
        state[i] = lerp(state[i], 1 + (maxS - 1) * f, 0.14);
        c.style.setProperty('--s', state[i].toFixed(4));
        c.style.setProperty('--o', clamp((state[i] - 1) / (maxS - 1) * 1.6 - .5).toFixed(3));
      });
      idx.textContent = String(best + 1).padStart(2, '0');
    });
  }

  /* ---------- parallaxe ---------- */
  const par = $$('[data-parallax]');
  if (par.length && !reduced) onFrame(() => par.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    el.style.translate = `0 ${(-p * parseFloat(el.dataset.parallax) * 100 - 7).toFixed(2)}%`;
  }));

  /* ---------- pile de boîtiers CD ---------- */
  const cds = $('.cds');
  if (cds) {
    const items = $$('.cd', cds), rows = $$('.covers__list li'), scene = $('.cds__scene', cds);
    let active = -1, spread = 0.2, rot = 38, tilt = -24;
    const lift = items.map(() => 0);
    const setActive = i => {
      active = i;
      items.forEach((c, k) => c.classList.toggle('on', k === i));
      rows.forEach((r, k) => r.classList.toggle('on', k === i));
    };
    items.forEach((c, i) => { c.style.transitionDelay = (i * 70) + 'ms'; c.addEventListener('pointerenter', () => setActive(i)); });
    rows.forEach((r, i) => { r.addEventListener('pointerenter', () => setActive(i)); r.addEventListener('click', () => items[i].click()); });
    cds.addEventListener('pointerleave', () => setActive(-1));
    $('.covers__list').addEventListener('pointerleave', () => setActive(-1));
    onFrame(() => {
      const r = cds.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = clamp(1 - (r.top + r.height * .25) / innerHeight);
      const shown = cds.classList.contains('in');
      spread = lerp(spread, shown ? lerp(0.16, 0.5, clamp(p * 1.4)) : 0.02, 0.08);
      const size = scene.offsetWidth, n = items.length;
      items.forEach((c, i) => {
        lift[i] = lerp(lift[i], i === active ? -0.36 : 0, 0.12);
        c.style.transform = `translate3d(0,${(lift[i] * size).toFixed(1)}px,${(((n - 1) / 2 - i) * size * spread).toFixed(1)}px)`;
      });
      if (!reduced) {
        const mx = (mouse.x / innerWidth - .5), my = (mouse.y / innerHeight - .5);
        rot = lerp(rot, 38 + mx * 16, 0.06); tilt = lerp(tilt, -24 - my * 10, 0.06);
        scene.style.transform = `rotateX(${tilt}deg) rotateY(${rot}deg)`;
      }
    });
  }

  /* ---------- vidéo : lecture seulement à l'écran ---------- */
  $$('video').forEach(v => new IntersectionObserver(es => es.forEach(e => {
    e.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }), { threshold: 0.25 }).observe(v));

  /* ---------- lightbox ---------- */
  const lb = $('.lb');
  if (lb) {
    const img = $('img', lb);
    const close = () => lb.classList.remove('on');
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-zoom]');
      if (t) { img.src = t.dataset.zoom; lb.classList.add('on'); }
      else if (lb.classList.contains('on')) close();
    });
    addEventListener('keydown', e => e.key === 'Escape' && close());
    addEventListener('scroll', () => lb.classList.contains('on') && close(), { passive: true });
  }

  /* ============ ARCHIVE ============ */
  const sheet = $('.a-sheet');
  if (sheet) {
    const secs = $$('section', sheet), links = $$('.a-chapters a'), pct = $('.a-progress b'), bar = $('.a-bar'), year = $('.a-hero__year');
    onFrame(() => {
      const r = sheet.getBoundingClientRect();
      const p = clamp((innerHeight * .5 - r.top) / r.height);
      if (pct) pct.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (bar) bar.style.transform = `scaleX(${p})`;
      let cur = -1;
      secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .5) cur = i; });
      links.forEach((l, i) => l.classList.toggle('on', i === cur));
      if (year && !reduced) year.style.transform = `translateY(${scrollY * .35}px)`;
    });
    // zoom : garde le même point de l'image sous les yeux
    sheet.addEventListener('click', () => {
      const r = sheet.getBoundingClientRect();
      const frac = (innerHeight / 2 - r.top) / r.height;
      body.classList.toggle('zoomed');
      const t0 = performance.now();
      (function hold(t) {
        const b = sheet.getBoundingClientRect();
        scrollTo(0, scrollY + b.top + frac * b.height - innerHeight / 2);
        if (t - t0 < 1000) requestAnimationFrame(hold);
      })(t0);
    });
  }
})();
