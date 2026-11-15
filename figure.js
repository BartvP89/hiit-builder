/* Animated stick figure renderer. Figure.mount(svg, exercise, {animate}) -> handle with setPlaying(). */
window.Figure = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const active = new Set();
  let last = 0;
  let looping = false;

  const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

  function poseAt(ex, t) {
    const fr = ex.frames;
    if (!ex._total) ex._total = fr.reduce((s, f) => s + f[1], 0);
    let x = t % ex._total;
    for (let i = 0; i < fr.length; i++) {
      if (x < fr[i][1]) {
        const a = fr[i][0], b = fr[(i + 1) % fr.length][0], u = ease(x / fr[i][1]);
        return a.map((v, j) => v + (b[j] - v) * u);
      }
      x -= fr[i][1];
    }
    return fr[0][0];
  }

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }

  const r = v => Math.round(v * 10) / 10;
  const pts = (p, ...idx) => idx.map(i => `${r(p[i])},${r(p[i + 1])}`).join(' ');

  function draw(f, p) {
    const s = f.parts;
    s.leg2.setAttribute('points', pts(p, 4, 18, 20));
    s.arm2.setAttribute('points', pts(p, 2, 10, 12));
    s.torso.setAttribute('points', pts(p, 2, 4));
    s.head.setAttribute('cx', r(p[0]));
    s.head.setAttribute('cy', r(p[1]));
    s.leg1.setAttribute('points', pts(p, 4, 14, 16));
    s.arm1.setAttribute('points', pts(p, 2, 6, 8));
    s.db.forEach(([node, w]) => {
      const i = w === 1 ? 8 : 12;
      node.setAttribute('x1', r(p[i] - 5)); node.setAttribute('x2', r(p[i] + 5));
      node.setAttribute('y1', r(p[i + 1])); node.setAttribute('y2', r(p[i + 1]));
    });
  }

  function loop(now) {
    const dt = Math.min(now - last, 100);
    last = now;
    for (const f of active) {
      if (!f.svg.isConnected) { active.delete(f); continue; }
      if (!f.playing) continue;
      f.t += dt;
      draw(f, poseAt(f.ex, f.t));
    }
    if (active.size) requestAnimationFrame(loop); else looping = false;
  }

  function mount(svg, ex, opts = {}) {
    for (const f of active) if (f.svg === svg) active.delete(f);
    svg.setAttribute('viewBox', '0 -8 200 156');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${ex.name} demonstration`);
    svg.textContent = '';
    el('line', { x1: 8, x2: 192, y1: 144, y2: 144, class: 'fig-ground' }, svg);
    const props = ex.props || {};
    if (props.box) {
      const [x, w, h] = props.box;
      el('rect', { x, y: 143 - h, width: w, height: h, rx: 3, class: 'fig-box' }, svg);
    }
    if (props.rack) {
      const [bx, by, px] = props.rack;
      el('line', { x1: px, x2: px, y1: by - 8, y2: 143, class: 'fig-rack' }, svg);
      if (px !== bx) el('line', { x1: px, x2: bx, y1: by, y2: by, class: 'fig-rack' }, svg);
      el('circle', { cx: bx, cy: by, r: 4, class: 'fig-bar' }, svg);
    }
    const back = ex.front ? 'fig-front' : 'fig-back';
    const parts = {
      leg2: el('polyline', { class: back }, svg),
      arm2: el('polyline', { class: back }, svg),
      torso: el('polyline', { class: 'fig-front' }, svg),
      head: el('circle', { r: 9, class: 'fig-head' }, svg),
      leg1: el('polyline', { class: 'fig-front' }, svg),
      arm1: el('polyline', { class: 'fig-front' }, svg),
      db: (props.db || []).map(w => [el('line', { class: 'fig-db' }, svg), w]),
    };
    // Start time lands on the "still" keyframe so static thumbnails show a telling pose.
    let t0 = 0;
    for (let i = 0; i < (ex.still || 0); i++) t0 += ex.frames[i][1];
    const f = { svg, ex, parts, t: t0, playing: opts.animate !== false };
    draw(f, poseAt(ex, f.t));
    active.add(f);
    if (!looping) { looping = true; last = performance.now(); requestAnimationFrame(loop); }
    return { setPlaying(v) { f.playing = v; } };
  }

  return { mount };
})();
