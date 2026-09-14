/* Soul Affinity Quiz — app
 * Set LEDGER_ENDPOINT to your Google Apps Script web-app URL to record
 * results to a sheet. Leave it "" and the page still works; it just won't log.
 */
const LEDGER_ENDPOINT = "https://script.google.com/macros/s/AKfycbwGxYj-jPe6bQakxg-BPLTVuHtF5WXqrwfXBY8dLMCibG2MHsXK389t6D2qeP1esBgF/exec";
const STORAGE_KEY = "soul-quiz-run-v1";

const $ = s => document.querySelector(s);
const screens = { intro: $("#s-intro"), interlude: $("#s-interlude"), question: $("#s-question"), reading: $("#s-reading"), result: $("#s-result") };
const bank = { BASELINE, SCENARIOS, FEEL_FIRST };

/* ---------- run state ---------- */
let run = null;

function newRun() {
  const seed = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  const rng = mulberry32(seed);
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Sequence of question refs. Baseline shuffled; scenarios shuffled; feel-first shuffled; parts kept in order.
  const seq = [
    ...shuffle(BASELINE.map((_, i) => ({ part: 1, i }))),
    ...shuffle(SCENARIOS.map((_, i) => ({ part: 2, i }))),
    ...shuffle(FEEL_FIRST.map((_, i) => ({ part: 3, i }))),
  ];
  return {
    seed, seq, pos: 0,
    baseline: new Array(BASELINE.length).fill(null),
    picks: new Array(SCENARIOS.length + FEEL_FIRST.length).fill(null),
    prevCode: "", started: Date.now(), phase: "intro",
  };
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(run)); } catch (e) {} }
function load() { try { const r = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (r && r.seq && r.seq.length === BASELINE.length + SCENARIOS.length + FEEL_FIRST.length) return r; } catch (e) {} return null; }
function clear() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }

/* ---------- typewriter ---------- */
let typer = null;
function typeInto(el, text, speed = 16) {
  return new Promise(resolve => {
    if (typer) typer.skip();
    el.textContent = ""; el.classList.add("typing");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0, done = false, timer;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); el.textContent = text; el.classList.remove("typing"); typer = null; resolve(); };
    const tick = () => {
      if (done) return;
      i++; el.textContent = text.slice(0, i);
      if (i >= text.length) finish();
      else timer = setTimeout(tick, text[i - 1] === "." || text[i - 1] === "?" ? speed * 9 : text[i - 1] === "," ? speed * 4 : speed);
    };
    typer = { skip: finish };
    if (reduce) finish(); else tick();
  });
}
function skipTyping() { if (typer) { typer.skip(); return true; } return false; }

/* ---------- screens ---------- */
function show(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  window.scrollTo({ top: 0 });
}

async function sayLines(el, lines) {
  for (let k = 0; k < lines.length; k++) {
    await typeInto(el, lines.slice(0, k + 1).join("\n"));
    if (k < lines.length - 1) await pause(650);
  }
}
const pause = ms => new Promise(r => setTimeout(r, ms));

/* ---------- intro ---------- */
async function intro() {
  run.phase = "intro"; save();
  show("intro");
  $("#btn-begin").disabled = true;
  await sayLines($("#intro-text"), READER.intro);
  $("#btn-begin").disabled = false;
  $("#btn-begin").focus();
}

$("#btn-begin").addEventListener("click", () => {
  const code = $("#prev-code").value.trim().toUpperCase();
  run.prevCode = /^R-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) ? code : "";
  Ambient.start(); setAudioButton(true);
  interlude(1);
});

/* ---------- interludes ---------- */
let interludeNext = null;
async function interlude(part) {
  run.phase = "interlude" + part; save();
  const lines = part === 1 ? READER.partOne : part === 2 ? READER.partTwo : READER.partThree;
  show("interlude");
  $("#btn-interlude").disabled = true;
  interludeNext = () => question();
  await sayLines($("#interlude-text"), lines);
  $("#btn-interlude").disabled = false;
  $("#btn-interlude").focus();
}
$("#btn-interlude").addEventListener("click", () => { if (interludeNext) interludeNext(); });

/* ---------- questions ---------- */
let selected = 0;
let current = null; // { ref, q, kind }

function question() {
  if (run.pos >= run.seq.length) return reading();
  const ref = run.seq[run.pos];
  run.phase = "question"; save();
  show("question");

  const total = run.seq.length;
  $("#counter").textContent = String(run.pos + 1).padStart(2, "0") + " / " + total;
  $("#bar-fill").style.width = (run.pos / total * 100) + "%";

  const q = ref.part === 1 ? BASELINE[ref.i] : ref.part === 2 ? SCENARIOS[ref.i] : FEEL_FIRST[ref.i];
  current = { ref, q, kind: ref.part === 1 ? "likert" : "pick" };
  renderAnswers();
  typeInto($("#q-text"), q.text, 14);
}

const LIKERT = [
  { v: -2, label: "Strongly disagree" }, { v: -1, label: "Disagree" }, { v: 0, label: "Neutral" }, { v: 1, label: "Agree" }, { v: 2, label: "Strongly agree" },
];

function renderAnswers() {
  const box = $("#answers"); box.innerHTML = "";
  if (current.kind === "likert") {
    const stored = run.baseline[current.ref.i];
    selected = stored == null ? 2 : stored + 2;
    const ends = document.createElement("div"); ends.className = "likert-ends";
    ends.innerHTML = "<span>Strongly disagree</span><span>Strongly agree</span>"; box.appendChild(ends);
    const grid = document.createElement("div"); grid.className = "likert";
    LIKERT.forEach((o, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "cell" + (i === selected ? " selected" : "");
      b.innerHTML = `<span class="tick"></span><span>${i === selected ? o.label : ""}</span>`;
      b.addEventListener("click", () => { if (typer) { skipTyping(); selected = i; paint(); return; } if (selected === i) confirm(); else { selected = i; paint(); } });
      grid.appendChild(b);
    });
    box.appendChild(grid);
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "choice primary likert-confirm"; ok.textContent = "Next";
    ok.addEventListener("click", confirm); box.appendChild(ok);
  } else {
    const stored = run.picks[pickIndex(current.ref)];
    selected = stored == null ? 0 : stored;
    current.q.options.forEach((o, i) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "choice" + (i === selected ? " selected" : "");
      b.textContent = o.text;
      b.addEventListener("click", () => { if (typer) { skipTyping(); selected = i; paint(); return; } if (selected === i) confirm(); else { selected = i; paint(); } });
      box.appendChild(b);
    });
  }
}
function pickIndex(ref) { return ref.part === 2 ? ref.i : SCENARIOS.length + ref.i; }

function paint() {
  const box = $("#answers");
  if (current.kind === "likert") {
    box.querySelectorAll(".cell").forEach((c, i) => {
      c.classList.toggle("selected", i === selected);
      c.querySelector("span:last-child").textContent = i === selected ? LIKERT[i].label : "";
    });
  } else {
    box.querySelectorAll(".choice").forEach((c, i) => c.classList.toggle("selected", i === selected));
  }
}

function confirm() {
  if (!current) return;
  if (skipTyping()) { /* let them see the whole question first */ return; }
  if (current.kind === "likert") run.baseline[current.ref.i] = LIKERT[selected].v;
  else run.picks[pickIndex(current.ref)] = selected;
  run.pos++; save();
  const next = run.seq[run.pos];
  if (next && next.part !== current.ref.part) interlude(next.part);
  else question();
}
function back() {
  if (run.pos === 0) return;
  run.pos--; save();
  question();
}

document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  const onQ = !screens.question.classList.contains("hidden");
  if (!onQ) {
    if ((e.key === "Enter" || e.key.toLowerCase() === "z" || e.key === " ")) {
      if (skipTyping()) { e.preventDefault(); return; }
      const btn = document.querySelector(".screen:not(.hidden) .choice.primary:not(:disabled)");
      if (btn && document.activeElement !== btn) { btn.click(); e.preventDefault(); }
    }
    return;
  }
  const n = current.kind === "likert" ? 5 : current.q.options.length;
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") { selected = (selected - 1 + n) % n; paint(); e.preventDefault(); }
  else if (e.key === "ArrowRight" || e.key === "ArrowDown") { selected = (selected + 1) % n; paint(); e.preventDefault(); }
  else if (/^[1-6]$/.test(e.key) && +e.key <= n) { selected = +e.key - 1; paint(); }
  else if (e.key === "Enter" || e.key.toLowerCase() === "z") { confirm(); e.preventDefault(); }
  else if (e.key.toLowerCase() === "x" || e.key === "Backspace") { back(); e.preventDefault(); }
});

/* ---------- reading ---------- */
async function reading() {
  run.phase = "reading"; save();
  show("reading");
  const lines = ["The Registrar is quiet for a while.", "He turns your hand over.", ...READER.reading];
  await sayLines($("#reading-text"), lines);
  await pause(700);
  result();
}

/* ---------- result ---------- */
let lastResult = null;
function result() {
  run.phase = "result"; save();
  const blood = drawBlood(run.seed);
  const answers = { baseline: run.baseline.map(v => v ?? 0), picks: run.picks };
  const r = score(bank, answers, blood);
  const soul = SOULS[r.soul];
  const readingCode = makeReadingCode(r.soul, answers);
  const returnCode = makeReturnCode(run.seed);
  lastResult = { r, soul, readingCode, returnCode, answers };

  show("result");
  $("#r-glyph").textContent = soul.glyph;
  $("#r-name").textContent = soul.name;
  $("#r-element").textContent = soul.element;
  $("#r-means").textContent = soul.means;
  $("#r-hook").textContent = soul.hook;
  $("#r-reading-code").textContent = readingCode;
  $("#r-return-code").textContent = returnCode;
  $("#r-note").textContent = READER.resultNote;
  $("#record-status").textContent = LEDGER_ENDPOINT ? "" : "The ledger isn't open yet. Post your reading code in Discord instead.";
  $("#btn-record").disabled = !LEDGER_ENDPOINT;

  const bars = $("#r-bars"); bars.innerHTML = "";
  const scale = Math.max(4, ...AXES.map(a => r.axes[a])); // bars are relative to the tallest axis
  AXES.forEach(a => {
    const v = Math.min(10, r.axes[a]);
    const row = document.createElement("div"); row.className = "axis";
    row.innerHTML = `<div class="aname">${AXIS_INFO[a].name}<small>${AXIS_INFO[a].short}</small></div><div class="track"><div class="val" style="background:${axisColor(a)}"></div></div><div class="num">${v.toFixed(1)}</div>`;
    bars.appendChild(row);
    requestAnimationFrame(() => requestAnimationFrame(() => { row.querySelector(".val").style.width = (v / scale * 100) + "%"; }));
  });
  const m = r.magnitude;
  $("#r-magnitude").textContent = "How hard you press: " + (m >= 0.8 ? "very hard. You don't do neutral." : m >= 0.6 ? "hard. You know what you think." : m >= 0.4 ? "evenly. You weigh things." : "lightly. You keep your options open.");

  // When Radiant or Void is the tallest bar but didn't pass the Dawn/Dusk gate,
  // say so, or the bars look like they contradict the result.
  const tallest = AXES.slice().sort((x, y) => r.axes[y] - r.axes[x])[0];
  if ((tallest === "R" || tallest === "V") && r.soul !== "dawn" && r.soul !== "dusk") {
    $("#r-magnitude").textContent += tallest === "R"
      ? " Conviction runs strong in you, but conviction alone doesn't hold a soul; yours settles on its primal pull."
      : " Hunger runs strong in you, but hunger alone doesn't hold a soul; yours settles on its primal pull.";
  }

  typeInto($("#r-reading"), soul.reading, 18);
}
function axisColor(a) { return { F: "#e0713a", W: "#3f8fd2", E: "#a07a4a", A: "#9fc4d8", R: "#f0d878", V: "#6b4d8f" }[a]; }

$("#btn-record").addEventListener("click", async () => {
  if (!LEDGER_ENDPOINT || !lastResult) return;
  const btn = $("#btn-record"); btn.disabled = true;
  $("#record-status").textContent = "Writing...";
  const { r, readingCode, returnCode, answers } = lastResult;
  const payload = {
    ts: new Date().toISOString(), returnCode, readingCode, previousReturnCode: run.prevCode,
    handle: $("#handle").value.trim().slice(0, 64),
    soul: r.soul, magnitude: +r.magnitude.toFixed(3),
    axes: Object.fromEntries(AXES.map(a => [a, +r.axes[a].toFixed(2)])),
    blood: { b: +r.blood.b.toFixed(3), d: +r.blood.d.toFixed(3) },
    baseline: answers.baseline, picks: answers.picks,
    secondsTaken: Math.round((Date.now() - run.started) / 1000),
    ua: navigator.userAgent.slice(0, 120),
  };
  try {
    await fetch(LEDGER_ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
    $("#record-status").textContent = "Recorded. Post your reading code in Discord and Connor will assign your role.";
  } catch (e) {
    $("#record-status").textContent = "The ledger didn't answer. Post your reading code in Discord instead.";
    btn.disabled = false;
  }
});

$("#btn-copy").addEventListener("click", async () => {
  if (!lastResult) return;
  const { r, soul, readingCode } = lastResult;
  const lines = [
    `${soul.glyph} ${soul.name} (${soul.element})`,
    AXES.map(a => `${AXIS_INFO[a].name} ${Math.min(10, r.axes[a]).toFixed(1)}`).join(" · "),
    `Reading code: ${readingCode}`,
    location.href.split("#")[0],
  ];
  try { await navigator.clipboard.writeText(lines.join("\n")); $("#btn-copy").textContent = "Copied"; setTimeout(() => $("#btn-copy").textContent = "Copy result", 1500); } catch (e) {}
});

$("#btn-again").addEventListener("click", () => { clear(); run = newRun(); intro(); });
$("#btn-restart").addEventListener("click", () => { if (run.pos === 0 || window.confirm("Start over? Your answers so far will be lost.")) { clear(); run = newRun(); intro(); } });

/* ---------- audio button ---------- */
function setAudioButton(on) { const b = $("#btn-audio"); b.setAttribute("aria-pressed", on ? "true" : "false"); b.textContent = on ? "♪ on" : "♪ off"; }
$("#btn-audio").addEventListener("click", () => { if (Ambient.isRunning()) { Ambient.stop(); setAudioButton(false); } else { Ambient.start(); setAudioButton(true); } });

/* ---------- embers ---------- */
(function embers() {
  const c = $("#embers"), x = c.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W, H, P = [];
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  addEventListener("resize", resize); resize();
  const N = reduce ? 0 : Math.min(70, Math.floor(W * H / 22000));
  for (let i = 0; i < N; i++) P.push(spawn(true));
  function spawn(any) { return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: 0.8 + Math.random() * 1.8, vy: 0.15 + Math.random() * 0.35, vx: (Math.random() - 0.5) * 0.2, a: 0.15 + Math.random() * 0.35, t: Math.random() * 6.28 }; }
  function frame() {
    x.clearRect(0, 0, W, H);
    P.forEach((p, i) => {
      p.t += 0.01; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.15;
      if (p.y < -10) P[i] = spawn(false);
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.28);
      x.fillStyle = `rgba(217,164,65,${p.a * (0.6 + 0.4 * Math.sin(p.t * 3))})`; x.fill();
    });
    requestAnimationFrame(frame);
  }
  if (N) frame();
})();

/* ---------- boot ---------- */
(function boot() {
  const saved = load();
  if (saved && saved.phase !== "result" && saved.pos > 0) {
    run = saved;
    if (run.phase.startsWith("interlude")) interlude(+run.phase.slice(-1)); else question();
  } else {
    run = newRun(); intro();
  }
})();
