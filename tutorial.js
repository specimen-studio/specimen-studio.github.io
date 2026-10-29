/* Specimen Studio guided tutorial (21 Oct 2026).
   Loaded after the main script. Spotlights the real interface and waits for each action; can be left at any time.
   Uses the DOM ids/data attributes of index.html. The app's code is sealed in its own function, so the fabric canvas
   is picked up from its next render (or window.ssCanvas, if the app ever exposes it). */
(() => {
  if (typeof fabric === 'undefined') return;
  let canvas = window.ssCanvas || null;
  if (!canvas) {
    // catch the instance the next time fabric touches it (any render, hover or object lookup)
    [fabric.Canvas.prototype, fabric.StaticCanvas.prototype].forEach(P => ['renderAll', 'findTarget', 'getObjects'].forEach(m => {
      if (!Object.prototype.hasOwnProperty.call(P, m)) return;
      const orig = P[m];
      P[m] = function () { if (!canvas && this.lowerCanvasEl && this.lowerCanvasEl.id === 'cv') { canvas = this; setTimeout(boot); } return orig.apply(this, arguments); };
    }));
    const poke = () => { const up = document.querySelector('#cv') && document.querySelector('#cv').parentElement.querySelector('.upper-canvas'); if (up) up.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 1, clientY: 1 })); };
    poke(); setTimeout(() => { if (!canvas) poke(); }, 500);
  } else setTimeout(boot);
  function boot() {
  const $ = s => document.querySelector(s);
  const inClaude = !!window.claude;
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  /* ── what's on the page ── */
  const tops = () => canvas.getObjects();
  const icons = () => tops().filter(o => o.iconId || (o.type === 'group' && o.subTargetCheck && !o.table && !o.panelData && !o.labelShape)).length;
  const count = type => tops().filter(o => o.type === type).length;
  const walk = (o, f) => { f(o); if (o.getObjects) o.getObjects().forEach(c => walk(c, f)); };
  const colours = () => { const a = []; tops().forEach(o => walk(o, x => { if (typeof x.fill === 'string') a.push(x.fill); if (typeof x.stroke === 'string') a.push(x.stroke); })); return a.join('|'); };
  const hasGlow = () => tops().some(o => { let g = false; walk(o, x => { if (x.glow || x.part === 'glow') g = true; }); return g; });
  const openTab = t => { const b = $(`.rail [data-tab="${t}"]`); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); };
  const search = q => { const i = $('#libSearch'); if (i) { i.focus(); } };

  /* ── steps: target = what to spotlight; wait = done when true (else a Next button); start = runs when the step opens ── */
  const STEPS = [
    { title: 'Welcome to Specimen Studio', text: 'In about 2 minutes you\'ll build a small figure: a mouse, its liver and a liver cell, with an arrow, a label and a coloured detail. You can leave at any time with ✕.' },
    { title: 'The gallery', target: '.rail [data-tab="gallery"]', start: () => openTab('gallery'), text: 'All icons live here, sorted by category. They\'re free to use in your figures. When you export, you get the short credit line to put under your figure.' },
    { title: 'Search for an icon', target: '#libSearch', start: () => { openTab('gallery'); search(); }, text: 'Type <b>mouse</b> in the search box.', wait: () => /mouse/i.test(($('#libSearch') || {}).value || '') },
    { title: 'Put it on the page', target: '#libBody', snap: () => ({ n: icons() }), text: 'Click the mouse icon, or drag it onto the white page.', wait: s => icons() > s.n },
    { title: 'Add the liver', target: '#libSearch', start: () => openTab('gallery'), snap: () => ({ n: icons() }), text: 'Now search <b>liver</b> and add the mouse liver the same way.', wait: s => icons() > s.n },
    { title: 'Add a liver cell', target: '#libSearch', start: () => openTab('gallery'), snap: () => ({ n: icons() }), text: 'Search <b>steatotic hepatocyte</b> and add it: a liver cell with fat droplets.', wait: s => icons() > s.n },
    { title: 'Arrange them', target: '#stage', text: 'Drag the icons into a row: mouse → liver → cell. Pull a corner handle to resize. Click Next when you\'re happy.' },
    { title: 'Select the cell', target: '#stage', text: 'Click the liver cell once to select it. Its settings open in the panel on the right.', wait: () => !!canvas.getActiveObject() },
    { title: 'Recolour a part', target: '#inspector', snap: () => ({ c: colours() }), text: 'In the right panel, click one of the icon\'s colours and pick a new one, for example the fat droplets. Every shade of that part changes together.', wait: s => colours() !== s.c },
    { title: 'Show inflammation', target: '#inspector', text: 'Still in the right panel, scroll down to <b>Glow</b> and choose red, a quick way to mark inflammation. (Or click Next to skip.)', wait: () => hasGlow() },
    { title: 'Draw an arrow', target: '.tools [data-tool="arrow"]', snap: () => ({ n: count('connector') }), text: 'Pick the arrow tool, then drag on the page from the liver to the cell.', wait: s => count('connector') > s.n },
    { title: 'Add a label', target: '.tools [data-tool="text"]', snap: () => ({ n: count('textbox') + count('i-text') }), text: 'Pick the text tool, click under the cell and type, for example <b>Steatosis</b>.', wait: s => count('textbox') + count('i-text') > s.n },
    ...(inClaude ? [{ title: 'AI drawing (beta)', target: '.rail [data-tab="ai"]', text: 'Here Claude can draw simple schematic icons in the library style (beta: best for proteins, symbols and charts). For realistic pictures, use the gallery.' }] : []),
    { title: 'Export your figure', target: '#btnExport', text: 'Click <b>Export</b> to save it as PNG for Word or PowerPoint, SVG for Affinity or Illustrator, or PDF. The credit line for your legend is written for you.', wait: () => { const m = $('#exportModal'); return !!m && !m.hidden; } },
    { title: 'That\'s it!', text: 'Your figure is saved in this browser as you work. Use <b>Save</b> to keep it under a name, or save it to your computer. You can rerun this tour with the <b>Tutorial</b> button at the top.' }
  ];

  /* ── look ── */
  const css = document.createElement('style');
  css.textContent = `
  #tutSpot{position:fixed;z-index:9998;pointer-events:none;border-radius:10px;box-shadow:0 0 0 3px var(--accent,#B8336A),0 0 0 9999px rgba(36,27,33,.32);transition:all .25s ease}
  #tutCard{position:fixed;z-index:9999;width:min(320px,calc(100vw - 32px));background:var(--panel,#fff);color:var(--fg,#241B21);border:1px solid var(--line,#E5DCE1);border-radius:12px;box-shadow:0 12px 40px rgba(36,27,33,.25);padding:14px 16px 12px;font:13.5px/1.45 var(--font-ui,system-ui)}
  #tutCard h3{margin:0 24px 6px 0;font:600 15px/1.3 var(--font-display,Georgia,serif);color:var(--accent,#B8336A)}
  #tutCard p{margin:0 0 10px}
  #tutCard .tutrow{display:flex;align-items:center;gap:8px}
  #tutCard .tutn{flex:1;color:var(--fg-3,#9A8C95);font-size:12px}
  #tutCard button{font:inherit;font-size:12.5px;border-radius:7px;padding:5px 11px;cursor:pointer;border:1px solid var(--line-2,#D6CAD1);background:var(--panel,#fff);color:var(--fg,#241B21)}
  #tutCard button.pri{background:var(--accent,#B8336A);border-color:var(--accent,#B8336A);color:var(--accent-ink,#fff)}
  #tutCard .tutx{position:absolute;top:8px;right:8px;border:0;background:none;font-size:16px;line-height:1;padding:4px 6px;color:var(--fg-2,#6F6069)}
  #tutCard .tutwait{color:var(--fg-2,#6F6069);font-size:12px;font-style:italic}
  #tutCard.done h3::after{content:' ✓';color:var(--ok,#2E7D57)}`;
  document.head.appendChild(css);

  let i = -1, snap = {}, timer = null, spot = null, card = null;
  function place() {
    const s = STEPS[i]; if (!s) return;
    const el = s.target && $(s.target), r = el && el.getBoundingClientRect();
    const vis = r && r.width > 0 && r.height > 0;
    if (vis) { const p = 6; Object.assign(spot.style, { display: 'block', left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + 2 * p + 'px', height: r.height + 2 * p + 'px' }); }
    else spot.style.display = 'none';
    const W = innerWidth, H = innerHeight, cw = card.offsetWidth, ch = card.offsetHeight, m = 14;
    let x, y;
    if (!vis && i === STEPS.length - 1) { x = W - cw - 16; y = H - ch - 16; }   // last card: bottom right, clear of the Export window
    else if (!vis) { x = (W - cw) / 2; y = (H - ch) / 2; }
    else if (r.right + m + cw < W) { x = r.right + m; y = r.top; }            // right of the target
    else if (r.left - m - cw > 0) { x = r.left - m - cw; y = r.top; }         // left of it
    else if (r.bottom + m + ch < H) { x = r.left; y = r.bottom + m; }         // below
    else { x = r.left; y = r.top - m - ch; }                                  // above
    card.style.left = Math.max(16, Math.min(x, W - cw - 16)) + 'px';
    card.style.top = Math.max(16, Math.min(y, H - ch - 16)) + 'px';
  }
  function show(n) {
    clearInterval(timer); i = n; const s = STEPS[i];
    if (!s) return end(true);
    if (s.start) try { s.start(); } catch (e) {}
    snap = s.snap ? s.snap() : {};
    card.classList.remove('done');
    card.innerHTML = `<button class="tutx" aria-label="Close the tutorial">✕</button><h3>${s.title}</h3><p>${s.text}</p>
      <div class="tutrow"><span class="tutn">${i + 1} / ${STEPS.length}</span>
      ${i > 0 ? '<button data-t="back">Back</button>' : ''}
      ${s.wait ? '<button data-t="next">Skip</button>' : `<button class="pri" data-t="next">${i === 0 ? 'Start' : i === STEPS.length - 1 ? 'Finish' : 'Next'}</button>`}</div>
      ${s.wait ? '<div class="tutwait">Waiting for you to do this…</div>' : ''}`;
    requestAnimationFrame(place);
    if (s.wait) timer = setInterval(() => {
      let ok = false; try { ok = s.wait(snap); } catch (e) {}
      if (ok) { clearInterval(timer); card.classList.add('done'); const w = card.querySelector('.tutwait'); if (w) w.textContent = 'Done!'; setTimeout(() => { if (STEPS[i] === s) show(i + 1); }, 700); }
      else place();
    }, 400);
  }
  function start() {
    end(false); lsSet('ss.tutorialSeen', '1');
    spot = document.createElement('div'); spot.id = 'tutSpot';
    card = document.createElement('div'); card.id = 'tutCard'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Tutorial');
    document.body.append(spot, card);
    card.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('tutx')) return end(false); if (b.dataset.t === 'next') show(i + 1); if (b.dataset.t === 'back') show(i - 1); });
    addEventListener('resize', place); addEventListener('scroll', place, true);
    show(0);
  }
  function end() {
    clearInterval(timer); i = -1;
    removeEventListener('resize', place); removeEventListener('scroll', place, true);
    if (spot) spot.remove(); if (card) card.remove(); spot = card = null;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && card) end(false); });

  /* ── a Tutorial button next to About, and a first-visit offer ── */
  const about = $('#btnAbout');
  if (about) { const b = document.createElement('button'); b.className = about.className; b.id = 'btnTutorial'; b.title = 'A 2-minute guided tour'; b.textContent = 'Tutorial'; b.addEventListener('click', start); about.before(b); }
  window.startTutorial = start;
  if (!lsGet('ss.tutorialSeen') && !canvas.getObjects().length) setTimeout(() => { if (!card && !canvas.getObjects().length) start(); }, 1200);
  }
})();
