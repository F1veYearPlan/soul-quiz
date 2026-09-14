/* Soul Affinity Quiz — result readings
 * NEW text. Built from the soul table and emotional registers in 02.
 * Eclipse and Mu are not reachable from the quiz by design (they need an
 * Open Soul plus something the world does to it), so they aren't here.
 * Edit freely. `reading` is what the Registrar says. `means` is the plain
 * explanation. `hook` is who in Vaeloria takes notice.
 */

const SOULS = {
  flame: {
    name: "Soul of Flame", element: "Fire", glyph: "🔥",
    reading: "You go first. Not because you're brave, though sometimes you are; because waiting is the one thing you can't stand.",
    means: "Your soul leans hardest toward Fire. You start things easily and start them well. Excitement is your resting state, and it decays; the middle of a long task is where you're weakest. You will learn Fire magick faster than anything else, and you will need people around you who finish.",
    hook: "The Ardari respect it. The Faith calls it zeal and isn't always paying a compliment.",
    color: "#e0713a",
  },
  tide: {
    name: "Soul of Tide", element: "Water", glyph: "🌊",
    reading: "You feel the room before you've read it. You give way, and somehow you're still standing when the others have worn themselves out.",
    means: "Your soul leans toward Water. You absorb what's around you: other people's moods, their grief, their wants. You get your way by yielding first and enduring longest. Water magick, and the healing arts that grow from it, will come easily. The cost is that you carry what isn't yours.",
    hook: "Healers know you on sight.",
    color: "#3f8fd2",
  },
  stone: {
    name: "Soul of Stone", element: "Earth", glyph: "🪨",
    reading: "You keep your word after it stops being convenient. You don't change quickly, and you're not sorry about it.",
    means: "Your soul leans toward Earth. Structure, loyalty, tradition, the long way that works. You're slow to move and hard to move once you have. Earth magick will come easily. What it costs you is every good idea you dismissed because it was new.",
    hook: "The Stonebound respect it, and they don't respect much.",
    color: "#a07a4a",
  },
  wind: {
    name: "Soul of Wind", element: "Air", glyph: "💨",
    reading: "You'd rather understand a thing than be sure of it. You watch. You take it apart. You're a step back from your own feelings, and you know it.",
    means: "Your soul leans toward Air. Curiosity as analysis, restlessness, a distance from the moment that lets you see it clearly. Air magick will come easily. The cost is that the people around you sometimes need you to be in it with them, and you aren't.",
    hook: "Scholars and Skyriders. Anyone who needs someone to notice what everyone else missed.",
    color: "#9fc4d8",
  },
  mist: {
    name: "Soul of Mist", element: "Fire and Water", glyph: "🌧️",
    reading: "Passion, under control. Pressure that hides. People underestimate you right up until they don't.",
    means: "Your soul is pulled almost equally by Fire and Water: the drive to act, and the pull to feel what the room feels. Together they make someone who can read people and move on them. Both elements come faster to you than they would to most, though neither as fast as to a pure soul.",
    hook: "Rogues, diplomats, and everyone who works in the space between what's said and what's meant.",
    color: "#7a8fb5",
  },
  forge: {
    name: "Soul of Forge", element: "Fire and Earth", glyph: "🛠️",
    reading: "You're driven, and you're disciplined, and those two things fight inside you every day. You build what you burn.",
    means: "Fire and Earth pull on you about equally: the need to begin and the need to finish. That's rarer than it sounds; most people get one or the other. Both elements come to you faster than to most.",
    hook: "Stonebound and Ardari smiths. Anyone who makes things that last.",
    color: "#c8873c",
  },
  ash: {
    name: "Soul of Ash", element: "Fire and Air", glyph: "🕯️",
    reading: "Fast, volatile, brilliant, brief. You see it before anyone and you're already gone by the time they catch up.",
    means: "Fire and Air pull on you about equally: initiative and analysis, speed of body and speed of mind. You burn bright and you burn through. Both elements come faster to you than to most. Staying power is what you'll have to build on purpose.",
    hook: "Nobody claims you. That's the point.",
    color: "#d9a441",
  },
  life: {
    name: "Soul of Life", element: "Water and Earth", glyph: "🌳",
    reading: "Patient. Nurturing. Grinding. You outlast problems rather than solve them, and things grow where you stand.",
    means: "Water and Earth pull on you about equally: feeling with people, and staying with them. That combination heals, in the slow way that actually holds. Both elements come faster to you than to most.",
    hook: "Druids, the Caelari, and every healer who's tired of the quick fix.",
    color: "#5f9c5a",
  },
  storm: {
    name: "Soul of Storm", element: "Water and Air", glyph: "⛈️",
    reading: "Clever, and more power under it than looks safe. You feel everything and you understand it at the same time, which is a lot to hold.",
    means: "Water and Air pull on you about equally: absorption and analysis. You read people and you read systems, and you're rarely wrong about either. Both elements come faster to you than to most.",
    hook: "Sailors and Skyriders. People who work with things bigger than themselves.",
    color: "#5b6fd6",
  },
  dust: {
    name: "Soul of Dust", element: "Earth and Air", glyph: "🍂",
    reading: "You erode rather than strike. You outlast. You've watched harder things than you wear down and blow away.",
    means: "Earth and Air pull on you about equally: patience and curiosity, structure and detachment. You don't win fights; you make them stop mattering. Both elements come faster to you than to most.",
    hook: "The desert clans, and the edges of the Vanthe expanse, where only what lasts is left.",
    color: "#b89a6a",
  },
  dawn: {
    name: "Soul of Dawn", element: "Radiant", glyph: "☀️",
    reading: "One conviction, nothing competing. You would rather be judged than be wrong, and you have been, and you held.",
    means: "Your soul is aligned to Radiant alone. Moral clarity: principled action, willingness to be judged, holding when everyone says you're wrong. Radiant magick will come to you faster than anything else, and nothing else will come easily. The cost is rigidity. Be careful who you break over it.",
    hook: "Rare. Most who take this reading do not get it, and the Registrar will look at you for a while.",
    color: "#f0d878",
  },
  dusk: {
    name: "Soul of Dusk", element: "Void", glyph: "🌑",
    reading: "One hunger, nothing competing. You want, and you don't stop wanting when you get it, and you'll pay for it without asking the price.",
    means: "Your soul is aligned to Void alone. Appetite: wanting what's withheld, patience that goes cold, paying costs you can't see. This isn't malice. A Void soul can be kind. It just always wants more. Void magick will come faster than anything else, and nothing else will come easily.",
    hook: "Rare. Keep it to yourself in a Faith town.",
    color: "#6b4d8f",
  },
  omni: {
    name: "Omnisoul", element: "All four", glyph: "4️⃣",
    reading: "Pulled every way at once, and hard. Fire, Water, Earth, and Air all claim you and none of them wins.",
    means: "All four primal forces pull on you strongly and about equally. Composites are easier for you than for anyone; every primal element comes faster than to most, though not as fast as to a pure soul. The cost is that you will never be the best at one thing, and you will want to be.",
    hook: "Very rare. Guild masters argue about whether it's a gift.",
    color: "#e8e0c8",
  },
  open: {
    name: "Open Soul", element: "No pull", glyph: "📖",
    reading: "Nothing pulls. The Registrar looks at your hand a second time. Then a third.",
    means: "No force claims you. That was common once, among the first Nephilim, and it is nearly impossible now. Healing and Wild magick come naturally to an Open Soul, and an Open Soul can be shaped by what happens to it. That is a gift or a danger depending entirely on what happens next.",
    hook: "Nearly impossible. If you got this, someone in the Guild is going to want a word.",
    color: "#f2e8d5",
  },
};

const AXIS_INFO = {
  F: { name: "Fire", short: "Drive", desc: "Initiative. Starting. Going first." },
  W: { name: "Water", short: "Feeling", desc: "Empathy. Yielding. Enduring." },
  E: { name: "Earth", short: "Steadiness", desc: "Structure. Loyalty. Tradition." },
  A: { name: "Air", short: "Understanding", desc: "Curiosity. Analysis. Distance." },
  R: { name: "Radiant", short: "Conviction", desc: "Principle. Holding. Being judged." },
  V: { name: "Void", short: "Hunger", desc: "Wanting. Paying. Waiting cold." },
};

if (typeof module !== "undefined") {
  module.exports = { SOULS, AXIS_INFO };
}
