/* node tools/simulate.js
 * 1. Bank balance: total absolute weight per axis across all pick items.
 * 2. Reachability: an archetype who leans one way (or two) on everything.
 * 3. Population: random-ish respondents, to see the soul distribution.
 */
const bank = require("./questions.js");
const { AXES, CONFIG, score, drawBlood } = require("./scoring.js");
const { SOULS } = require("./souls.js");

const picks = bank.SCENARIOS.concat(bank.FEEL_FIRST);

// 1. Balance
const tot = {}; AXES.forEach(a => tot[a] = 0);
const optCount = {}; AXES.forEach(a => optCount[a] = 0);
picks.forEach(q => q.options.forEach(o => { for (const a in o.w) { tot[a] += Math.abs(o.w[a]); if (o.w[a] > 0) optCount[a]++; } }));
console.log("Bank balance (abs weight per axis):", tot);
console.log("Options with positive load per axis:", optCount);
const vals = Object.values(tot); console.log("Max/min ratio:", (Math.max(...vals) / Math.min(...vals)).toFixed(2), "(target ≤ 1.15)");

// Helper: respondent that prefers a set of axes with a given strength
function respond(prefs, strength, rng) {
  // prefs: {F:1, R:0.5} — how much each axis attracts this person
  const baseline = bank.BASELINE.map(q => {
    const lean = ((prefs[q.axis] || 0) * 2 - 1) * (q.rev ? -1 : 1);
    const v = lean * 2 * strength + (rng() - 0.5) * 2 * (1 - strength);
    return Math.max(-2, Math.min(2, Math.round(v)));
  });
  const pk = picks.map(q => {
    const scores = q.options.map(o => {
      let s = 0; for (const a in o.w) s += o.w[a] * (prefs[a] || 0);
      return s * strength + rng() * (1 - strength) * 2;
    });
    return scores.indexOf(Math.max(...scores));
  });
  return { baseline, picks: pk };
}

function rngFrom(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// 2. Reachability
console.log("\nArchetypes (strength 0.9):");
const archetypes = {
  F: { F: 1 }, W: { W: 1 }, E: { E: 1 }, A: { A: 1 }, R: { R: 1 }, V: { V: 1 },
  FW: { F: 1, W: 1 }, FE: { F: 1, E: 1 }, FA: { F: 1, A: 1 }, WE: { W: 1, E: 1 }, WA: { W: 1, A: 1 }, EA: { E: 1, A: 1 },
  ALL4: { F: 1, W: 1, E: 1, A: 1 },
  NONE: {},
};
for (const k in archetypes) {
  const rng = rngFrom(7);
  const ans = respond(archetypes[k], k === "NONE" ? 0.05 : 0.9, rng);
  if (k === "NONE") { ans.baseline = ans.baseline.map(() => 0); }
  const r = score(bank, ans, drawBlood(1));
  const ax = AXES.map(a => a + ":" + r.axes[a].toFixed(1)).join(" ");
  console.log(k.padEnd(5), "→", r.soul.padEnd(6), "mag", r.magnitude.toFixed(2), " ", ax);
}

// 3. Population
console.log("\nPopulation of 5000 with random leans:");
const counts = {}; const N = 5000;
const rng = rngFrom(42);
for (let i = 0; i < N; i++) {
  const prefs = {}; AXES.forEach(a => prefs[a] = Math.pow(rng(), 1.6));
  const strength = 0.4 + rng() * 0.5;
  const ans = respond(prefs, strength, rng);
  const r = score(bank, ans, drawBlood(i));
  counts[r.soul] = (counts[r.soul] || 0) + 1;
}
Object.keys(SOULS).forEach(k => console.log(k.padEnd(6), ((counts[k] || 0) / N * 100).toFixed(1) + "%"));
console.log("blood config:", CONFIG.blood);
