# Soul Affinity Quiz

Static site. No build step. Open `index.html` or host the folder anywhere.

## Files
- `index.html`, `style.css` — the page.
- `questions.js` — the question bank and the Registrar's lines. Weights live here and are never shown.
- `scoring.js` — scoring and the soul gates, straight from the Magick System page. `CONFIG` holds every knob.
- `souls.js` — result readings for each soul (NEW text; edit freely).
- `audio.js` — ambient music synthesized in the browser. Set `MUSIC_FILE` to use a track of your own instead.
- `app.js` — screens, input, result, and ledger logging. Set `LEDGER_ENDPOINT` here.
- `Code.gs` — the Google Sheets receiver.
- `simulate.js` — `node simulate.js` checks bank balance, reachability of every soul, and a simulated population.

## Codes
- Reading code (`TIDE-S8QF`): hash of the answers + soul. Proves a screenshot matches an actual run. Two people with the same answers get the same code, which is fine; it's for verification, not identity.
- Return code (`R-MKSV-64VN`): identifies the run. A retester enters it on the intro screen and it is logged as `previousReturnCode`, so you can pair the two rows.

## Tuning blood weight
`CONFIG.blood` in `scoring.js` starts at all zeros: nobody carries a nudge, everyone gets their true result. Once you have rows in the sheet:
- Open too common → raise `muB` (0.5 is the canon "modern" default; Open needs |b| ≤ 0.15).
- Omni too rare → raise `muD` (it lowers Omni's floor and widens its spread).
- Dawn/Dusk too rare → raise `sigmaB` (more people get a helpful lean).
Blood is drawn per run from the run's seed, so a return code always rebuilds the same blood.

## Gates
`CONFIG.gates` are the "tight starting values" from the design page. The simulation shows the common four at ~80%, composites ~20%, Dawn/Dusk/Open ~1% each, Omni near 0 with blood at zero. Widen `compositeGap` if composites are too rare in real data.
