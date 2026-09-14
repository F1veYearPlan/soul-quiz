/* Soul Affinity Quiz — scoring
 * Implements the "Scoring notes (detailed)" and gates from 02 Magick System.
 * Everything tunable lives in CONFIG. Nothing here is shown to the user.
 */

const AXES = ["F", "W", "E", "A", "R", "V"];

const CONFIG = {
  /* Blood weight the world hands out. With all four at 0 nobody carries
   * a nudge, so people get their "true" result. As data comes in, raise
   * muB to make Open rarer, raise muD to make Omni easier, raise sigmaB
   * to make Dawn/Dusk convert more borderline profiles. See README. */
  blood: { muB: 0.0, sigmaB: 0.0, muD: 0.0, sigmaD: 0.0 },

  /* Gates from 02 ("tight starting values; the pilot recalibrates"). */
  gates: {
    moral: { floor: 6.0, magnitude: 0.65, lead: 2.5, leadPerAgreement: 0.6 },
    omni: { floor: 5.0, floorPerDensity: 1.0, spread: 1.2, spreadPerDensity: 0.5, magnitude: 0.65 },
    open: { ceiling: 2.5, magnitude: 0.35, balance: 0.15 },
    compositeGap: 1.0,
  },

  /* How much Part I (statements) counts against Part II (scenarios). */
  partOneWeight: 0.5,
};

/* Deterministic RNG so a run's blood can be rebuilt from its return code. */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(rng, mu, sigma) {
  if (sigma <= 0) return mu;
  const u = 1 - rng(), v = rng();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

function drawBlood(seed, blood = CONFIG.blood) {
  const rng = mulberry32(seed);
  const sign = rng() < 0.5 ? -1 : 1;
  const b = clamp(sign * normal(rng, blood.muB, blood.sigmaB), -1, 1);
  const d = clamp(normal(rng, blood.muD, blood.sigmaD), 0, 1);
  return { b, d };
}

/* answers.baseline: array of -2..2 aligned with BASELINE order
 * answers.picks:   array of option indices aligned with SCENARIOS then FEEL_FIRST
 */
function score(bank, answers, blood) {
  const { BASELINE, SCENARIOS, FEEL_FIRST } = bank;
  const picks = SCENARIOS.concat(FEEL_FIRST);

  // Part I: per axis, sum(response × loading) / max possible × 10 → -10..10
  const p1 = {}, p1max = {};
  AXES.forEach(a => { p1[a] = 0; p1max[a] = 0; });
  BASELINE.forEach((q, i) => {
    const r = answers.baseline[i] ?? 0;
    p1[q.axis] += r * (q.rev ? -1 : 1);
    p1max[q.axis] += 2;
  });
  AXES.forEach(a => { p1[a] = p1max[a] ? (p1[a] / p1max[a]) * 10 : 0; });

  // Magnitude: mean |response| / 2 → 0..1
  const absSum = answers.baseline.reduce((s, r) => s + Math.abs(r ?? 0), 0);
  const magnitude = BASELINE.length ? absSum / BASELINE.length / 2 : 0;

  // Part II: sum weights / number drawn × 5
  const p2 = {};
  AXES.forEach(a => { p2[a] = 0; });
  let drawn = 0;
  picks.forEach((q, i) => {
    const idx = answers.picks[i];
    if (idx == null) return;
    drawn++;
    const w = q.options[idx].w;
    for (const a in w) p2[a] += w[a];
  });
  AXES.forEach(a => { p2[a] = drawn ? (p2[a] / drawn) * 5 : 0; });

  const axes = {};
  AXES.forEach(a => { axes[a] = Math.max(0, p2[a] + CONFIG.partOneWeight * p1[a]); });

  return { axes, magnitude, p1, p2, blood, soul: classify(axes, magnitude, blood) };
}

function classify(axes, magnitude, blood, gates = CONFIG.gates) {
  const { b, d } = blood;
  const sorted = AXES.slice().sort((x, y) => axes[y] - axes[x]);
  const top = sorted[0];
  const primals = ["F", "W", "E", "A"].sort((x, y) => axes[y] - axes[x]);
  const [p1, p2] = primals;
  const primalVals = primals.map(a => axes[a]);

  // Rule 1: Dawn / Dusk
  if (top === "R" || top === "V") {
    const agreement = top === "R" ? b : -b;
    const needLead = gates.moral.lead - gates.moral.leadPerAgreement * agreement;
    const lead = axes[top] - axes[sorted[1]];
    if (axes[top] >= gates.moral.floor && magnitude >= gates.moral.magnitude && lead >= needLead) {
      return top === "R" ? "dawn" : "dusk";
    }
  }

  // Rule 2: Omni
  const floor = gates.omni.floor - gates.omni.floorPerDensity * d;
  const spreadMax = gates.omni.spread + gates.omni.spreadPerDensity * d;
  const spread = Math.max(...primalVals) - Math.min(...primalVals);
  if (primalVals.every(v => v >= floor) && spread <= spreadMax && magnitude >= gates.omni.magnitude) {
    return "omni";
  }

  // Rule 3: Open
  if (axes[top] <= gates.open.ceiling && magnitude <= gates.open.magnitude && Math.abs(b) <= gates.open.balance) {
    return "open";
  }

  // Rule 4: pure or composite
  if (axes[p1] - axes[p2] <= gates.compositeGap) {
    return COMPOSITE[[p1, p2].sort().join("")];
  }
  return PURE[p1];
}

const PURE = { F: "flame", W: "tide", E: "stone", A: "wind" };
const COMPOSITE = {
  FW: "mist", EF: "forge", AF: "ash", EW: "life", AW: "storm", AE: "dust",
};

/* Codes.
 * Return code: identifies the run so a retest can be linked. R-XXXX-XXXX.
 * Reading code: verifies the result. SOUL-XXXX, hash of the answers + soul.
 * They are built differently on purpose so they never look alike. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function makeReturnCode(seed) {
  const rng = mulberry32(seed ^ 0x5EED);
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return "R-" + s.slice(0, 4) + "-" + s.slice(4);
}
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function makeReadingCode(soulKey, answers) {
  const raw = answers.baseline.join(",") + "|" + answers.picks.join(",") + "|" + soulKey;
  let h = fnv1a(raw), s = "";
  for (let i = 0; i < 4; i++) { s += CODE_ALPHABET[h % CODE_ALPHABET.length]; h = Math.floor(h / CODE_ALPHABET.length); }
  return soulKey.toUpperCase() + "-" + s;
}

if (typeof module !== "undefined") {
  module.exports = { AXES, CONFIG, score, classify, drawBlood, makeReturnCode, makeReadingCode, mulberry32 };
}
