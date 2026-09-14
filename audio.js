/* Ambient music, generated in the browser. No files, no licenses.
 * A low drone, a slow pad that drifts between three chords, a sparse
 * pentatonic bell, and a little filtered wind. Starts only on a user
 * gesture (browsers require that).
 *
 * To use your own track instead: set MUSIC_FILE to a path like
 * "assets/music.ogg" and this module will loop it instead of synthesizing.
 */
const MUSIC_FILE = "";

const Ambient = (() => {
  let ctx, master, running = false, timers = [], el;

  const A2 = 110;
  // Chords as ratios over the root: Am9-ish, Fmaj7-ish, Cadd9-ish, all soft.
  const CHORDS = [
    [1, 1.5, 1.782, 2.25, 2.997],       // A C E G B  (minor 9)
    [0.8, 1.2, 1.5, 1.782, 2.4],        // F A C E    (maj7)  (0.8 = F below)
    [1.189, 1.5, 1.782, 2.25, 2.669],   // C E G B D  (maj9)
    [0.9, 1.5, 1.782, 2.25],            // G B D  A?  (sus-ish)
  ];
  const BELL_NOTES = [3, 3.375, 4, 4.5, 5.339, 6, 6.75, 8]; // A pentatonic, high

  function mk() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  }

  function drone() {
    const g = ctx.createGain(); g.gain.value = 0.08;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220; lp.Q.value = 0.7;
    [0, 3, -3].forEach(det => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = A2 / 2; o.detune.value = det;
      o.connect(lp); o.start();
    });
    const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = A2 / 4; sub.connect(g); sub.start();
    lp.connect(g); g.connect(master);
    // slow filter wander
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.03;
    const lg = ctx.createGain(); lg.gain.value = 80; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  }

  function padChord(ratios, at, len) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.045, at + len * 0.35);
    g.gain.setValueAtTime(0.045, at + len * 0.65);
    g.gain.linearRampToValueAtTime(0, at + len);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900;
    ratios.forEach(r => {
      [-4, 4].forEach(det => {
        const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = A2 * 2 * r; o.detune.value = det;
        o.connect(lp); o.start(at); o.stop(at + len + 0.1);
      });
    });
    lp.connect(g); g.connect(master);
  }

  function bell(at) {
    const r = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)];
    const f = A2 * r;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.06, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, at + 5);
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.76; // inharmonic partial
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.02, at); g2.gain.exponentialRampToValueAtTime(0.0005, at + 1.2);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    o.start(at); o2.start(at); o.stop(at + 5.2); o2.stop(at + 5.2);
  }

  function wind() {
    const len = 4, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0.012;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 0.008; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(bp); bp.connect(g); g.connect(master); src.start();
  }

  function schedule() {
    let t = ctx.currentTime + 0.5, i = 0;
    const loop = () => {
      const len = 14 + Math.random() * 4;
      padChord(CHORDS[i % CHORDS.length], t, len);
      i++; t += len * 0.8;
      timers.push(setTimeout(loop, (t - ctx.currentTime - 2) * 1000));
    };
    loop();
    const bells = () => {
      bell(ctx.currentTime + 0.05);
      timers.push(setTimeout(bells, 6000 + Math.random() * 9000));
    };
    timers.push(setTimeout(bells, 3000));
  }

  function start() {
    if (running) return;
    running = true;
    if (MUSIC_FILE) {
      el = el || Object.assign(new Audio(MUSIC_FILE), { loop: true, volume: 0.35 });
      el.play().catch(() => {});
      return;
    }
    if (!ctx) mk();
    if (ctx.state === "suspended") ctx.resume();
    drone(); wind(); schedule();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (MUSIC_FILE) { el && el.pause(); return; }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    timers.forEach(clearTimeout); timers = [];
    setTimeout(() => { if (!running && ctx) { ctx.close(); ctx = null; } }, 1500);
  }

  return { start, stop, isRunning: () => running };
})();
