(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EX = window.EXERCISES;
  const byId = Object.fromEntries(EX.map(e => [e.id, e]));
  const EQUIP = { body: 'Bodyweight', dumbbell: 'Light dumbbells', box: 'Box or step', rack: 'Rack or pull-up bar' };
  const LEVEL = ['', 'Steady', 'Hard', 'All-out'];
  const READY_SECONDS = 10;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LIMITS = {
    count: { min: 1, max: 12, step: 1, fmt: v => `${v}` },
    defMin: { min: 0.5, max: 15, step: 0.5, fmt: v => `${v} min` },
    work: { min: 10, max: 120, step: 5, fmt: v => `${v} s` },
    rest: { min: 0, max: 120, step: 5, fmt: v => `${v} s` },
    brk: { min: 0, max: 120, step: 5, fmt: v => `${v} s` },
    rounds: { min: 1, max: 10, step: 1, fmt: v => `${v}` },
    roundBrk: { min: 0, max: 300, step: 15, fmt: v => `${v} s` },
  };
  const DEFAULTS = { modules: [], defMin: 3, mode: 'interval', work: 40, rest: 20, brk: 30, rounds: 1, roundBrk: 60, count: 5, filter: 'all', sound: true };
  const STORE = 'hiit-builder-v1';

  function load() {
    try {
      const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') };
      s.modules = (s.modules || []).filter(m => byId[m.id]);
      return s;
    } catch { return { ...DEFAULTS }; }
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode */ } }

  let state = load();

  const clamp = (v, key) => Math.min(LIMITS[key].max, Math.max(LIMITS[key].min, v));
  const clock = sec => {
    sec = Math.max(0, Math.ceil(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- schedule ---------- */

  function moduleSegments(seconds) {
    if (state.mode === 'continuous') return [{ type: 'work', dur: seconds }];
    const parts = [];
    let t = 0, work = true;
    while (t < seconds) {
      const d = Math.min(work ? state.work : state.rest, seconds - t);
      if (d > 0) parts.push({ type: work ? 'work' : 'rest', dur: d });
      t += d;
      work = !work;
    }
    // A sliver at the end is not worth a phase change: fold it into the phase before it.
    if (parts.length > 1 && parts[parts.length - 1].dur < 5) {
      const tail = parts.pop();
      parts[parts.length - 1].dur += tail.dur;
    }
    return parts;
  }

  function buildSchedule() {
    // A "lap" is one pass through the whole module list (shown to the user as a round);
    // "unit" numbers every module instance across all laps.
    const n = state.modules.length;
    const segs = [{ type: 'ready', dur: READY_SECONDS, mod: 0, lap: 0, unit: 0 }];
    for (let lap = 0; lap < state.rounds; lap++) {
      state.modules.forEach((m, i) => {
        const unit = lap * n + i;
        const parts = moduleSegments(m.min * 60);
        const rounds = parts.filter(p => p.type === 'work').length;
        let round = 0;
        parts.forEach(p => {
          if (p.type === 'work') round++;
          segs.push({ ...p, mod: i, lap, unit, round, rounds });
        });
        if (i < n - 1) {
          if (state.brk > 0) segs.push({ type: 'break', dur: state.brk, mod: i + 1, lap, unit: unit + 1 });
        } else if (lap < state.rounds - 1 && state.roundBrk > 0) {
          segs.push({ type: 'break', dur: state.roundBrk, mod: 0, lap: lap + 1, unit: unit + 1, newRound: true });
        }
      });
    }
    return segs;
  }

  function totalSeconds() {
    const n = state.modules.length;
    const r = state.rounds;
    return r * state.modules.reduce((s, m) => s + m.min * 60, 0) + r * Math.max(0, n - 1) * state.brk + (n ? (r - 1) * state.roundBrk : 0);
  }

  /* ---------- builder screen ---------- */

  function renderSteppers() {
    $$('.stepper[data-key]').forEach(node => {
      const key = node.dataset.key, lim = LIMITS[key], v = state[key];
      node.innerHTML =
        `<button type="button" data-d="-1" aria-label="Decrease" ${v <= lim.min ? 'disabled' : ''}>&minus;</button>` +
        `<output>${lim.fmt(v)}</output>` +
        `<button type="button" data-d="1" aria-label="Increase" ${v >= lim.max ? 'disabled' : ''}>+</button>`;
    });
    $$('#modeSeg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === state.mode));
    $$('.interval-only').forEach(n => { n.hidden = state.mode !== 'interval'; });
    $$('.rounds-only').forEach(n => { n.hidden = state.rounds < 2; });
  }

  function renderPlan() {
    const list = $('#planList');
    const n = state.modules.length;
    list.innerHTML = state.modules.map((m, i) => {
      const ex = byId[m.id];
      return `<li data-i="${i}">
        <span class="num">${i + 1}</span>
        <svg class="fig thumb" data-ex="${ex.id}"></svg>
        <div class="pl-main">
          <button type="button" class="linklike" data-act="info">${esc(ex.name)}</button>
          <span class="tag ${ex.equip}">${EQUIP[ex.equip]}</span>
        </div>
        <div class="stepper sm">
          <button type="button" data-act="less" aria-label="Shorter" ${m.min <= LIMITS.defMin.min ? 'disabled' : ''}>&minus;</button>
          <output>${m.min} min</output>
          <button type="button" data-act="more" aria-label="Longer" ${m.min >= LIMITS.defMin.max ? 'disabled' : ''}>+</button>
        </div>
        <div class="pl-tools">
          <button type="button" data-act="up" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>&uarr;</button>
          <button type="button" data-act="down" aria-label="Move down" ${i === n - 1 ? 'disabled' : ''}>&darr;</button>
          <button type="button" data-act="rm" aria-label="Remove ${esc(ex.name)}">&times;</button>
        </div>
      </li>`;
    }).join('');
    $$('svg[data-ex]', list).forEach(svg => Figure.mount(svg, byId[svg.dataset.ex], { animate: false }));
    $('#planEmpty').hidden = n > 0;
    $('#clearBtn').hidden = n === 0;
    const sizeText = `${n} module${n === 1 ? '' : 's'}` + (state.rounds > 1 ? ` × ${state.rounds} rounds` : '');
    $('#planSummary').textContent = n ? sizeText : '';

    const total = totalSeconds();
    $('#totalTime').textContent = clock(total);
    $('#totalMeta').textContent = n ? `${sizeText}, breaks included` : 'Add a module to begin';
    $('#startBtn').disabled = n === 0;
  }

  function filtered() {
    return state.filter === 'all' ? EX : EX.filter(e => e.equip === state.filter);
  }

  function renderLibrary() {
    const chips = [['all', 'All'], ...Object.entries(EQUIP)];
    $('#filters').innerHTML = chips.map(([k, label]) =>
      `<button type="button" class="chip" data-filter="${k}" aria-pressed="${state.filter === k}">${label}</button>`).join('');
    const list = filtered();
    $('#libCount').textContent = `${list.length} modules`;
    $('#grid').innerHTML = list.map(ex => `<article class="card" data-id="${ex.id}">
        <button type="button" class="card-open" data-act="info" aria-label="About ${esc(ex.name)}">
          <svg class="fig" data-ex="${ex.id}"></svg>
        </button>
        <div class="card-body">
          <h3>${esc(ex.name)}</h3>
          <p class="muted">${esc(ex.focus)}</p>
          <div class="card-foot">
            <span class="tag ${ex.equip}">${EQUIP[ex.equip]}</span>
            <button type="button" class="btn sm" data-act="add">Add</button>
          </div>
        </div>
      </article>`).join('');
    $$('svg[data-ex]', $('#grid')).forEach(svg => Figure.mount(svg, byId[svg.dataset.ex], { animate: !reduceMotion }));
  }

  function renderAll() { renderSteppers(); renderPlan(); renderLibrary(); }

  function addModule(id) {
    if (state.modules.length >= 30) return;
    state.modules.push({ id, min: state.defMin });
    save(); renderPlan();
  }

  function fillRandom() {
    const pool = filtered().slice();
    const picked = [];
    let bag = [];
    while (picked.length < state.count) {
      if (!bag.length) bag = pool.slice().sort(() => Math.random() - 0.5);
      const next = bag.pop();
      // avoid the same module twice in a row when the pool is reused
      if (picked.length && picked[picked.length - 1] === next.id && pool.length > 1) { bag.unshift(next); continue; }
      picked.push(next.id);
    }
    state.modules = picked.map(id => ({ id, min: state.defMin }));
    save(); renderPlan();
  }

  function openDetail(id) {
    const ex = byId[id], dlg = $('#detail');
    dlg.innerHTML = `
      <div class="detail-stage"><svg class="fig"></svg></div>
      <div class="detail-body">
        <div class="detail-head">
          <h2>${esc(ex.name)}</h2>
          <button type="button" class="icon-btn" data-act="close" aria-label="Close">&times;</button>
        </div>
        <p class="tags"><span class="tag ${ex.equip}">${EQUIP[ex.equip]}</span><span class="tag">${LEVEL[ex.level]}</span><span class="tag">${esc(ex.focus)}</span></p>
        <p>${esc(ex.desc)}</p>
        <ul class="cues">${ex.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        <p class="easier"><strong>Make it easier:</strong> ${esc(ex.easier)}</p>
        <button type="button" class="btn primary" data-act="add">Add to workout</button>
      </div>`;
    Figure.mount($('svg', dlg), ex);
    dlg.dataset.id = id;
    dlg.showModal();
  }

  /* ---------- sound ---------- */

  let audio = null;
  function beep(freq, ms, when = 0, gain = 0.18) {
    if (!state.sound || !audio) return;
    const t = audio.currentTime + when;
    const osc = audio.createOscillator(), g = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(g).connect(audio.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.05);
  }
  const SOUNDS = {
    tick: () => beep(880, 110),
    work: () => beep(1320, 420, 0, 0.22),
    rest: () => beep(520, 380),
    break: () => { beep(520, 220); beep(390, 380, 0.22); },
    done: () => { beep(660, 180); beep(880, 180, 0.2); beep(1320, 500, 0.4, 0.22); },
  };

  /* ---------- player ---------- */

  const PHASE_LABEL = { ready: 'Get ready', work: 'Work', rest: 'Rest', break: 'Break' };
  let run = null;
  let wakeLock = null;

  async function keepAwake() {
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* not supported or denied */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (run && !run.finished && document.visibilityState === 'visible') keepAwake();
  });

  function startWorkout() {
    if (!state.modules.length) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
    } catch { audio = null; }
    const segs = buildSchedule();
    run = {
      segs, idx: 0, left: segs[0].dur * 1000, paused: false, finished: false,
      lastTick: performance.now(), lastSec: null, fig: null, started: Date.now(),
      modTotals: state.modules.map(m => m.min * 60),
    };
    const p = $('#player');
    p.hidden = false;
    document.body.classList.add('in-player');
    p.innerHTML = `
      <div class="p-top">
        <button type="button" class="icon-btn" data-act="quit" aria-label="End workout">&times;</button>
        <div class="p-count" aria-live="polite"></div>
        <button type="button" class="btn ghost sm" data-act="sound"></button>
      </div>
      <div class="p-progress" aria-hidden="true">${state.modules.map(() => '<i><b></b></i>').join('')}</div>
      <div class="p-body">
        <div class="p-stage"><svg class="fig"></svg></div>
        <div class="p-info">
          <div class="p-phase"></div>
          <div class="p-time" role="timer"></div>
          <div class="p-round"></div>
          <h2 class="p-name"></h2>
          <p class="p-desc"></p>
          <ul class="cues p-cues"></ul>
          <p class="p-next muted"></p>
        </div>
      </div>
      <div class="p-controls">
        <button type="button" class="btn ghost" data-act="prev">Back</button>
        <button type="button" class="btn primary big" data-act="pause">Pause</button>
        <button type="button" class="btn ghost" data-act="skip">Skip</button>
      </div>`;
    keepAwake();
    enterSegment();
    run.timer = setInterval(tick, 100);
  }

  function enterSegment() {
    const p = $('#player'), seg = run.segs[run.idx], ex = byId[state.modules[seg.mod].id];
    const upcoming = seg.type === 'ready' || seg.type === 'break';
    p.dataset.phase = seg.type;
    const n = state.modules.length;
    $('.p-count', p).textContent = (state.rounds > 1 ? `Round ${seg.lap + 1} of ${state.rounds} · ` : '') + `Module ${seg.mod + 1} of ${n}`;
    $('.p-phase', p).textContent = seg.newRound ? `Break before round ${seg.lap + 1}` : PHASE_LABEL[seg.type];
    $('.p-round', p).textContent = upcoming
      ? 'Up next'
      : (seg.rounds > 1 ? `Interval ${seg.round} of ${seg.rounds}` : EQUIP[ex.equip]);
    $('.p-name', p).textContent = ex.name;
    $('.p-desc', p).textContent = ex.desc;
    $('.p-cues', p).innerHTML = ex.cues.map(c => `<li>${esc(c)}</li>`).join('');
    const nextUnit = seg.unit + 1;
    let nextText = 'Last module';
    if (nextUnit < n * state.rounds) {
      const name = byId[state.modules[nextUnit % n].id].name;
      nextText = nextUnit % n === 0 ? `Then: round ${seg.lap + 2}, starting with ${name}` : `Then: ${name}`;
    }
    $('.p-next', p).textContent = upcoming ? '' : nextText;
    if (run.figEx !== ex.id) {
      run.fig = Figure.mount($('.p-stage svg', p), ex);
      run.figEx = ex.id;
    }
    run.fig.setPlaying(seg.type !== 'rest' && !run.paused);
    run.lastSec = null;
    if (SOUNDS[seg.type] && seg.type !== 'ready') SOUNDS[seg.type]();
    paint();
  }

  function paint() {
    const p = $('#player'), seg = run.segs[run.idx];
    const secs = Math.ceil(run.left / 1000);
    $('.p-time', p).textContent = clock(run.left / 1000);
    $('[data-act="sound"]', p).textContent = state.sound ? 'Sound on' : 'Sound off';
    $('[data-act="pause"]', p).textContent = run.paused ? 'Resume' : 'Pause';
    if (secs !== run.lastSec) {
      if (run.lastSec !== null && secs > 0 && secs <= 3 && seg.dur > 3) SOUNDS.tick();
      run.lastSec = secs;
    }
    // per-module progress bars
    const bars = $$('.p-progress b', p);
    const done = new Array(bars.length).fill(0);
    run.segs.forEach((s, i) => {
      if (s.type === 'ready' || s.type === 'break' || s.lap !== seg.lap) return;
      if (i < run.idx) done[s.mod] += s.dur;
      else if (i === run.idx) done[s.mod] += s.dur - run.left / 1000;
    });
    bars.forEach((b, i) => { b.style.width = `${Math.min(100, (done[i] / run.modTotals[i]) * 100)}%`; });
  }

  function tick() {
    if (!run || run.finished) return;
    const now = performance.now(), dt = now - run.lastTick;
    run.lastTick = now;
    if (run.paused) return;
    run.left -= dt;
    let changed = false;
    while (run.left <= 0) {
      if (run.idx >= run.segs.length - 1) return finish();
      run.idx++;
      run.left += run.segs[run.idx].dur * 1000;
      changed = true;
    }
    if (changed) enterSegment(); else paint();
  }

  function goTo(idx) {
    run.idx = idx;
    run.left = run.segs[idx].dur * 1000;
    run.lastTick = performance.now();
    enterSegment();
  }

  function skip() {
    const seg = run.segs[run.idx];
    if (seg.type === 'ready' || seg.type === 'break') return goTo(run.idx + 1);
    const next = run.segs.findIndex((s, i) => i > run.idx && s.unit === seg.unit + 1 && s.type === 'work');
    if (next === -1) finish(); else goTo(next);
  }

  function back() {
    const seg = run.segs[run.idx];
    const firstOf = u => run.segs.findIndex(s => s.unit === u && s.type === 'work');
    const start = firstOf(seg.unit);
    const upcoming = seg.type === 'ready' || seg.type === 'break';
    // In a break, or right at the start of a module, "Back" means the previous module.
    const atStart = run.idx === start && seg.dur * 1000 - run.left < 3000;
    if ((upcoming || atStart) && seg.unit > 0) goTo(firstOf(seg.unit - 1));
    else if (upcoming) goTo(0);
    else goTo(start);
  }

  function finish() {
    run.finished = true;
    clearInterval(run.timer);
    SOUNDS.done();
    wakeLock?.release?.().catch(() => {});
    const mins = Math.max(1, Math.round((Date.now() - run.started) / 60000));
    const p = $('#player'), n = state.modules.length;
    p.dataset.phase = 'done';
    p.innerHTML = `<div class="p-done">
        <div class="p-phase">Done</div>
        <h2>Workout complete</h2>
        <p>${state.rounds > 1 ? `${state.rounds} rounds of ` : ''}${n} module${n === 1 ? '' : 's'} in about ${mins} minute${mins === 1 ? '' : 's'}. Nice work.</p>
        <ol class="done-list">${state.modules.map(m => `<li>${esc(byId[m.id].name)} <span class="muted">${m.min} min</span></li>`).join('')}</ol>
        <button type="button" class="btn primary big" data-act="quit">Back to builder</button>
      </div>`;
  }

  function closePlayer() {
    if (run) clearInterval(run.timer);
    run = null;
    wakeLock?.release?.().catch(() => {});
    wakeLock = null;
    $('#player').hidden = true;
    $('#player').innerHTML = '';
    document.body.classList.remove('in-player');
  }

  /* ---------- events ---------- */

  document.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const stepper = btn.closest('.stepper[data-key]');
    if (stepper && btn.dataset.d) {
      const key = stepper.dataset.key;
      state[key] = clamp(state[key] + Number(btn.dataset.d) * LIMITS[key].step, key);
      if (key === 'defMin') state.modules.forEach(m => { m.min = state.defMin; });
      save(); renderSteppers(); renderPlan();
      return;
    }
    if (btn.dataset.mode) { state.mode = btn.dataset.mode; save(); renderSteppers(); return; }
    if (btn.dataset.filter) { state.filter = btn.dataset.filter; save(); renderLibrary(); return; }
    if (btn.id === 'fillBtn') return fillRandom();
    if (btn.id === 'clearBtn') { state.modules = []; save(); renderPlan(); return; }
    if (btn.id === 'startBtn') return startWorkout();

    const act = btn.dataset.act;
    if (!act) return;

    const card = btn.closest('.card');
    if (card) { if (act === 'add') addModule(card.dataset.id); else openDetail(card.dataset.id); return; }

    const row = btn.closest('#planList li');
    if (row) {
      const i = Number(row.dataset.i), mods = state.modules, m = mods[i];
      if (act === 'info') return openDetail(m.id);
      if (act === 'less') m.min = clamp(m.min - 0.5, 'defMin');
      if (act === 'more') m.min = clamp(m.min + 0.5, 'defMin');
      if (act === 'up' && i > 0) [mods[i - 1], mods[i]] = [mods[i], mods[i - 1]];
      if (act === 'down' && i < mods.length - 1) [mods[i + 1], mods[i]] = [mods[i], mods[i + 1]];
      if (act === 'rm') mods.splice(i, 1);
      save(); renderPlan();
      return;
    }

    const dlg = btn.closest('#detail');
    if (dlg) { if (act === 'add') addModule(dlg.dataset.id); dlg.close(); return; }

    if (btn.closest('#player')) {
      if (act === 'quit') {
        if (run && !run.finished && !confirm('End this workout?')) return;
        return closePlayer();
      }
      if (act === 'sound') { state.sound = !state.sound; save(); return paint(); }
      if (act === 'pause') {
        run.paused = !run.paused;
        run.lastTick = performance.now();
        run.fig.setPlaying(!run.paused && run.segs[run.idx].type !== 'rest');
        return paint();
      }
      if (act === 'skip') return skip();
      if (act === 'prev') return back();
    }
  });

  // Click on the dialog backdrop closes it.
  $('#detail').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('#detail').addEventListener('close', e => { e.currentTarget.innerHTML = ''; });

  document.addEventListener('keydown', e => {
    if (!run || run.finished || e.target.closest('button')) return;
    if (e.code === 'Space') { e.preventDefault(); $('#player [data-act="pause"]').click(); }
    if (e.code === 'ArrowRight') skip();
    if (e.code === 'ArrowLeft') back();
  });

  renderAll();
})();
