# Soul Affinity Quiz

Static site. No build step. Open `index.html` or host the folder anywhere.

## Files
- `index.html`, `style.css` — the page.
- `questions.js` — the question bank, the Sent's dialogue tree (`READER`), and the force colors. Weights are never shown.
- Flow: splash ("Are you awake?") → five intro lines → choices → optional forces explanation → three quiz parts with interludes → result. Bump every `?v=N` in `index.html` when you change a file so browsers don't cache the old one.
- `scoring.js` — scoring and the soul gates, straight from the Magick System page. `CONFIG` holds every knob.
- `souls.js` — result readings for each soul (NEW text; edit freely).
- `audio.js` — ambient music synthesized in the browser. Set `MUSIC_FILE` to use a track of your own instead.
- `app.js` — screens, input, and the result screen.
- `simulate.js` — `node simulate.js` checks bank balance, reachability of every soul, and a simulated population.

## Tuning blood weight
`CONFIG.blood` in `scoring.js` starts at all zeros: nobody carries a nudge, everyone gets their true result. Once you have rows in the sheet:
- Open too common → raise `muB` (0.5 is the canon "modern" default; Open needs |b| ≤ 0.15).
- Omni too rare → raise `muD` (it lowers Omni's floor and widens its spread).
- Dawn/Dusk too rare → raise `sigmaB` (more people get a helpful lean).
Blood is drawn per run from the run's seed, so a return code always rebuilds the same blood.

## Gates
`CONFIG.gates` are the "tight starting values" from the design page. The simulation shows the common four at ~80%, composites ~20%, Dawn/Dusk/Open ~1% each, Omni near 0 with blood at zero. Widen `compositeGap` if composites are too rare in real data.
