/* Soul Affinity Quiz — app */
const STORAGE_KEY = "soul-quiz-run-v2";

const $ = s => document.querySelector(s);
const screens = { splash: $("#s-splash"), talk: $("#s-talk"), question: $("#s-question"), result: $("#s-result") };
const bank = { BASELINE, SCENARIOS, FEEL_FIRST };
const pause = ms => new Promise(r => setTimeout(r, ms));

/* ---------- run state ---------- */
let run = null;
function newRun() {
  const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  const rng = mulberry32(seed);
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const seq = [
    ...shuffle(BASELINE.map((_, i) => ({ part: 1, i }))),
    ...shuffle(SCENARIOS.map((_, i) => ({ part: 2, i }))),
    ...shuffle(FEEL_FIRST.map((_, i) => ({ part: 3, i }))),
  ];
  return { seed, seq, pos: 0, baseline: new Array(BASELINE.length).fill(null), picks: new Array(SCENARIOS.length + FEEL_FIRST.length).fill(null), started: Date.now(), phase: "splash" };
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(run)); } catch (e) {} }
function load() { try { const r = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (r && r.seq && r.seq.length === BASELINE.length + SCENARIOS.length + FEEL_FIRST.length) return r; } catch (e) {} return null; }
function clear() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }

/* ---------- typewriter ---------- */
const typers = new Set();
function typeInto(el, text, speed = 16, cursorEl = el) {
  return new Promise(resolve => {
    el.textContent = ""; cursorEl.classList.add("typing");
    let i = 0, done = false, timer;
    const t = { skip: () => { if (done) return; done = true; clearTimeout(timer); el.textContent = text; cursorEl.classList.remove("typing"); typers.delete(t); resolve(); } };
    typers.add(t);
    const tick = () => {
      if (done) return;
      i++; el.textContent = text.slice(0, i);
      if (/\S/.test(text[i - 1])) Ambient.blip();
      if (i >= text.length) t.skip();
      else {
        const c = text[i - 1], ellipsis = c === "." && (text[i] === "." || text[i - 2] === ".");
        timer = setTimeout(tick, ellipsis ? speed * 14 : c === "." || c === "?" || c === "!" ? speed * 9 : c === "," || c === ";" ? speed * 4 : speed);
      }
    };
    tick();
  });
}
function skipTyping() { if (!typers.size) return false; [...typers].forEach(t => t.skip()); return true; }

/* Append lines one after another into a container, keeping earlier lines. */
async function sayLines(el, lines, speed = 16, gap = 550) {
  for (const line of lines) {
    const p = document.createElement("p"); p.className = "line"; el.appendChild(p);
    await typeInto(p, line, speed, p);
    el.closest(".box")?.scrollTo({ top: 1e6, behavior: "smooth" });
    await pause(gap);
  }
}
/* A header, then every named line typing at the same time. */
async function sayBlock(el, block) {
  const h = document.createElement("p"); h.className = "line"; el.appendChild(h);
  await typeInto(h, block.header, 24, h);
  await pause(400);
  const jobs = block.lines.map(l => {
    const p = document.createElement("p"); p.className = "line force";
    const name = document.createElement("span"); name.className = "force-name"; name.textContent = l.name + " ";
    const short = l.name.split(/[ /(]/)[0];
    name.style.color = FORCE_COLORS[short] || FORCE_COLORS[l.name] || "var(--gold)";
    const body = document.createElement("span");
    p.append(name, body); el.appendChild(p);
    return typeInto(body, l.text, 30, p);
  });
  await Promise.all(jobs);
  el.closest(".box")?.scrollTo({ top: 1e6, behavior: "smooth" });
  await pause(550);
}

/* ---------- screens ---------- */
function show(name) { Object.values(screens).forEach(s => s.classList.add("hidden")); screens[name].classList.remove("hidden"); window.scrollTo({ top: 0 }); }

/* ---------- choice lists (one cursor, keyboard + mouse) ---------- */
let active = null; // { n, selected, paint(), confirm(), back() }
function renderChoices(container, items, onPick, { initial = 0, plain = false } = {}) {
  container.innerHTML = "";
  const buttons = items.map((label, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = plain ? "plain" : "choice"; b.textContent = label;
    b.addEventListener("click", () => { if (skipTyping()) { active.selected = i; active.paint(); return; } if (active.selected === i || plain) { active.selected = i; active.confirm(); } else { active.selected = i; active.paint(); } });
    b.addEventListener("mouseenter", () => { if (!plain) { active.selected = i; active.paint(); } });
    container.appendChild(b); return b;
  });
  active = {
    n: items.length, selected: initial,
    paint() { buttons.forEach((b, i) => b.classList.toggle("selected", i === this.selected)); },
    confirm() { if (skipTyping()) return; Ambient.chime(); const k = this.selected; active = null; onPick(k); },
    back: null,
  };
  active.paint();
}

document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (!active) { if (e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "z") skipTyping(); return; }
  const k = e.key;
  if (k === "ArrowLeft" || k === "ArrowUp") { active.selected = (active.selected - 1 + active.n) % active.n; active.paint(); e.preventDefault(); }
  else if (k === "ArrowRight" || k === "ArrowDown") { active.selected = (active.selected + 1) % active.n; active.paint(); e.preventDefault(); }
  else if (/^[1-6]$/.test(k) && +k <= active.n) { active.selected = +k - 1; active.paint(); }
  else if (k === "Enter" || k === " " || k.toLowerCase() === "z") { active.confirm(); e.preventDefault(); }
  else if ((k.toLowerCase() === "x" || k === "Backspace") && active.back) { active.back(); e.preventDefault(); }
});

/* ---------- splash ---------- */
async function splash() {
  run.phase = "splash"; save();
  show("splash");
  $("#splash-choices").innerHTML = ""; active = null;
  await typeInto($("#splash-text"), READER.splash, 40);
  renderChoices($("#splash-choices"), [READER.splashYes], () => { if (soundOn) Ambient.start(); intro(); });
}

/* ---------- the Sent's dialogue tree ---------- */
const talkText = $("#talk-text"), talkChoices = $("#talk-choices");
function talkClear() { talkText.innerHTML = ""; talkChoices.innerHTML = ""; active = null; }

async function intro() {
  run.phase = "intro"; save();
  show("talk"); talkClear();
  await sayLines(talkText, READER.intro, 38);
  const c = READER.introChoices;
  renderChoices(talkChoices, [c.nature, c.yes], k => k === 0 ? nature() : interlude(1));
}
async function nature() {
  talkClear();
  await sayLines(talkText, READER.nature, 30);
  renderChoices(talkChoices, [READER.natureChoice], () => primal());
}
async function primal() {
  talkClear();
  await sayBlock(talkText, READER.primal);
  renderChoices(talkChoices, [READER.primalChoice], () => moral());
}
async function moral() {
  talkClear();
  await sayBlock(talkText, READER.moral);
  await sayLines(talkText, READER.moralEnd, 24);
  const c = READER.moralChoices;
  renderChoices(talkChoices, [c.other, c.yes], k => k === 0 ? meta() : interlude(1));
}
async function meta() {
  talkClear();
  await sayBlock(talkText, READER.meta);
  await sayLines(talkText, READER.metaEnd, 24);
  renderChoices(talkChoices, [READER.metaChoice], () => precreation());
}
async function precreation() {
  talkClear();
  await sayBlock(talkText, READER.precreation);
  await sayLines(talkText, READER.otherEnd, 24);
  renderChoices(talkChoices, [READER.yes], () => interlude(1));
}
async function interlude(part) {
  run.phase = "interlude" + part; save();
  show("talk"); talkClear();
  const lines = part === 1 ? READER.partOne : part === 2 ? READER.partTwo : READER.partThree;
  await sayLines(talkText, lines);
  renderChoices(talkChoices, ["Go on"], () => question());
}

/* ---------- questions ---------- */
let current = null;
const LIKERT = [
  { v: -2, label: "Strongly disagree" }, { v: -1, label: "Disagree" }, { v: 0, label: "Neutral" }, { v: 1, label: "Agree" }, { v: 2, label: "Strongly agree" },
];
function pickIndex(ref) { return ref.part === 2 ? ref.i : SCENARIOS.length + ref.i; }

function question() {
  if (run.pos >= run.seq.length) return reading();
  const ref = run.seq[run.pos];
  run.phase = "question"; save();
  show("question");
  const total = run.seq.length;
  $("#counter").textContent = String(run.pos + 1).padStart(2, "0") + " / " + total;
  $("#bar-fill").style.width = (run.pos / total * 100) + "%";
  const q = ref.part === 1 ? BASELINE[ref.i] : ref.part === 2 ? SCENARIOS[ref.i] : FEEL_FIRST[ref.i];
  current = { ref, q };
  renderAnswers();
  typeInto($("#q-text"), q.text, 14);
}

function renderAnswers() {
  const box = $("#answers"); box.innerHTML = "";
  if (current.ref.part === 1) {
    const stored = run.baseline[current.ref.i];
    const initial = stored == null ? 2 : stored + 2;
    const ends = document.createElement("div"); ends.className = "likert-ends";
    ends.innerHTML = "<span>Strongly disagree</span><span>Strongly agree</span>"; box.appendChild(ends);
    const grid = document.createElement("div"); grid.className = "likert";
    const cells = LIKERT.map((o, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "cell"; b.innerHTML = `<span class="tick"></span>`;
      b.addEventListener("click", () => { if (skipTyping()) { active.selected = i; active.paint(); return; } if (active.selected === i) active.confirm(); else { active.selected = i; active.paint(); } });
      b.addEventListener("mouseenter", () => { active.selected = i; active.paint(); });
      grid.appendChild(b); return b;
    });
    box.appendChild(grid);
    const label = document.createElement("div"); label.className = "likert-label"; box.appendChild(label);
    const next = document.createElement("button"); next.type = "button"; next.className = "plain next"; next.textContent = "Next";
    next.addEventListener("click", () => { if (skipTyping()) return; active.confirm(); });
    box.appendChild(next);
    active = {
      n: 5, selected: initial,
      paint() { cells.forEach((c, i) => c.classList.toggle("selected", i === this.selected)); label.textContent = LIKERT[this.selected].label; },
      confirm() { if (skipTyping()) return; Ambient.chime(); run.baseline[current.ref.i] = LIKERT[this.selected].v; advance(); },
      back,
    };
    active.paint();
  } else {
    const stored = run.picks[pickIndex(current.ref)];
    renderChoices(box, current.q.options.map(o => o.text), k => { run.picks[pickIndex(current.ref)] = k; advance(); }, { initial: stored == null ? 0 : stored });
    active.back = back;
  }
}
function advance() {
  const part = current.ref.part;
  run.pos++; save();
  const next = run.seq[run.pos];
  if (next && next.part !== part) interlude(next.part); else question();
}
function back() { if (run.pos === 0) return; run.pos--; save(); question(); }

/* ---------- reading + result ---------- */
async function reading() {
  run.phase = "reading"; save();
  show("talk"); talkClear();
  await sayLines(talkText, ["I'm quiet for a while.", "I turn your hand over.", ...READER.reading]);
  await pause(700);
  result();
}

let lastResult = null;
function result() {
  run.phase = "result"; save();
  const blood = drawBlood(run.seed);
  const answers = { baseline: run.baseline.map(v => v ?? 0), picks: run.picks };
  const r = score(bank, answers, blood);
  const soul = SOULS[r.soul];
  lastResult = { r, soul };
  show("result"); active = null;
  $("#r-resonance").textContent = "";
  $("#r-glyph").textContent = soul.glyph;
  $("#r-name").textContent = soul.name;
  $("#r-means").textContent = soul.means;
  $("#r-hook").textContent = soul.hook;
  const bars = $("#r-bars"); bars.innerHTML = "";
  const scale = Math.max(4, ...AXES.map(a => r.axes[a]));
  AXES.forEach(a => {
    const v = Math.min(10, r.axes[a]);
    const row = document.createElement("div"); row.className = "axis";
    row.innerHTML = `<div class="aname">${AXIS_INFO[a].name}<small>${AXIS_INFO[a].short}</small></div><div class="track"><div class="val" style="background:${FORCE_COLORS[AXIS_INFO[a].name]}"></div></div><div class="num">${v.toFixed(1)}</div>`;
    bars.appendChild(row);
    requestAnimationFrame(() => requestAnimationFrame(() => { row.querySelector(".val").style.width = (v / scale * 100) + "%"; }));
  });
  const m = r.magnitude;
  $("#r-magnitude").textContent = "How hard you press: " + (m >= 0.8 ? "very hard. You don't do neutral." : m >= 0.6 ? "hard. You know what you think." : m >= 0.4 ? "evenly. You weigh things." : "lightly. You keep your options open.");
  const tallest = AXES.slice().sort((x, y) => r.axes[y] - r.axes[x])[0];
  if ((tallest === "R" || tallest === "V") && !["dawn", "dusk", "open", "omni"].includes(r.soul)) {
    $("#r-magnitude").textContent += tallest === "R"
      ? " Conviction runs strong in you, but conviction alone doesn't hold a soul; yours settles on its primal pull."
      : " Hunger runs strong in you, but hunger alone doesn't hold a soul; yours settles on its primal pull.";
  }
  (async () => { await typeInto($("#r-resonance"), RESONANCE[r.soul], 18); await typeInto($("#r-reading"), soul.reading, 18); })();
}

$("#btn-copy").addEventListener("click", async () => {
  if (!lastResult) return;
  const { r, soul } = lastResult;
  const lines = [RESONANCE[r.soul], `${soul.glyph} ${soul.name}`, AXES.map(a => `${AXIS_INFO[a].name} ${Math.min(10, r.axes[a]).toFixed(1)}`).join(" · "), location.href.split("#")[0]];
  try { await navigator.clipboard.writeText(lines.join("\n")); $("#btn-copy").textContent = "Copied"; setTimeout(() => $("#btn-copy").textContent = "Copy result", 1500); } catch (e) {}
});
$("#btn-again").addEventListener("click", () => { clear(); run = newRun(); splash(); });
$("#btn-restart").addEventListener("click", () => { if (run.pos === 0 || window.confirm("Start over? Your answers so far will be lost.")) { clear(); run = newRun(); splash(); } });

/* ---------- audio ---------- */
let soundOn = true; // browsers only let sound start after a click or key; the splash "Yes" is that click
function setAudioButton(on) { const b = $("#btn-audio"); b.setAttribute("aria-pressed", on ? "true" : "false"); b.textContent = on ? "♪ on" : "♪ off"; }
$("#btn-audio").addEventListener("click", e => { e.stopPropagation(); soundOn = !soundOn; if (soundOn) Ambient.start(); else Ambient.stop(); setAudioButton(soundOn); });
const gesture = () => { if (soundOn && run.phase !== "splash") Ambient.start(); };
document.addEventListener("pointerdown", gesture);
document.addEventListener("keydown", gesture);

/* ---------- embers ---------- */
(function embers() {
  const c = $("#embers"), x = c.getContext("2d");
  let W, H, P = [];
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  addEventListener("resize", resize); resize();
  const N = Math.min(70, Math.floor(W * H / 22000));
  function spawn(any) { return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: 0.8 + Math.random() * 1.8, vy: 0.15 + Math.random() * 0.35, vx: (Math.random() - 0.5) * 0.2, a: 0.15 + Math.random() * 0.35, t: Math.random() * 6.28 }; }
  for (let i = 0; i < N; i++) P.push(spawn(true));
  (function frame() {
    x.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      p.t += 0.01; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.15;
      if (p.y < -10) P[i] = spawn(false);
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28);
      x.fillStyle = `rgba(217,164,65,${p.a * (0.6 + 0.4 * Math.sin(p.t * 3))})`; x.fill();
    });
    requestAnimationFrame(frame);
  })();
})();

/* ---------- boot ---------- */
(function boot() {
  const saved = load();
  if (saved && saved.phase !== "result" && saved.pos > 0) {
    run = saved;
    if (run.phase.startsWith("interlude")) interlude(+run.phase.slice(-1)); else question();
  } else { run = newRun(); splash(); }
})();
