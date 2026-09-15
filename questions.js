/* Soul Affinity Quiz — question bank
 *
 * Axes: F Fire, W Water, E Earth, A Air, R Radiant, V Void.
 * Weights are never shown to the user. Edit freely; the scorer reads
 * whatever is here. Keep weights coarse (0.5, 1, 2). Most answers load
 * on two axes; a few load negatively on purpose.
 *
 * BASELINE: Likert, -2..+2. `axis` is the axis measured, `rev` flips it.
 * SCENARIOS: pick one. `w` is {F,W,E,A,R,V} nudges.
 * FEEL_FIRST: same shape as scenarios; quick gut items shown last.
 */

const BASELINE = [
  // Fire — approach drive, initiative, novelty, low persistence
  { axis: "F", text: "I'm at my best at the very start of something new." },
  { axis: "F", text: "I'd rather act on a rough plan now than a good plan later." },
  { axis: "F", text: "I get restless when a plan takes too long to begin." },
  { axis: "F", rev: true, text: "I finish what I start, even after it stops being interesting." },
  { axis: "F", rev: true, text: "I think things through carefully before I act." },

  // Water — empathy, accommodation, endurance, absorbing the room
  { axis: "W", text: "I feel other people's emotions as if they were my own." },
  { axis: "W", text: "I'd rather give way than win a fight." },
  { axis: "W", text: "I often know how someone feels before they've said a word." },
  { axis: "W", rev: true, text: "Other people's problems usually aren't mine to solve." },
  { axis: "W", rev: true, text: "The mood of the people around me doesn't change my own." },

  // Earth — conscientiousness, loyalty, tradition, risk aversion
  { axis: "E", text: "I keep my promises even when it's inconvenient." },
  { axis: "E", text: "I prefer the way things have always been done." },
  { axis: "E", text: "I'd rather do a thing the proven way than the fast way." },
  { axis: "E", rev: true, text: "I drop a plan the moment a better one appears." },
  { axis: "E", rev: true, text: "Rules exist to be questioned." },

  // Air — need for cognition, curiosity, detachment
  { axis: "A", text: "I'd rather understand something than be certain about it." },
  { axis: "A", text: "I enjoy taking ideas apart to see how they work." },
  { axis: "A", text: "I'd rather watch a thing happen than be in the middle of it." },
  { axis: "A", rev: true, text: "I don't need to know why something works, as long as it works." },
  { axis: "A", rev: true, text: "Abstract questions bore me." },

  // Radiant — moral clarity, principled action, willingness to be judged
  { axis: "R", text: "There are things I would not do even if no one would ever know." },
  { axis: "R", text: "When I'm sure I'm right, I don't back down, even when it costs me." },
  { axis: "R", text: "I'd rather be disliked for what I said than liked for what I didn't." },
  { axis: "R", rev: true, text: "I'd bend a rule for a better result if no one got hurt." },
  { axis: "R", rev: true, text: "I doubt my own judgment when others disagree with me." },

  // Void — appetite, reactance, paying unseen costs, patience that goes cold
  { axis: "V", text: "Being told I can't have something makes me want it more." },
  { axis: "V", text: "I'd pay a price I don't fully understand for something I truly wanted." },
  { axis: "V", text: "Getting what I want rarely satisfies me for long." },
  { axis: "V", rev: true, text: "I'm content with what I have." },
  { axis: "V", rev: true, text: "I can walk away from something I want without much trouble." },
];

const SCENARIOS = [
  {
    id: "road",
    text: "Three days out from the nearest town, the man who taught you how to bank a fire dies of a wound none of you could close. The others build his cairn in silence. That night, after the last stone is set, you:",
    options: [
      { text: "Can't sit still. You're on the road again before anyone can talk you out of it.", w: { F: 2, W: -1 } },
      { text: "Sit with the others and let them talk him alive again until they run dry.", w: { W: 2 } },
      { text: "Go through his pack, sort what goes home and what goes on, and see the rites are done right. Someone has to.", w: { E: 2, R: 1 } },
      { text: "Keep asking what killed him, and whether it follows tracks.", w: { A: 1, V: 1 } },
    ],
  },
  {
    id: "magistrate",
    text: "In a river town you watch a magistrate take a purse under the table and rule a farmer off land his family has worked for four generations. The farmer doesn't argue. No one does. You:",
    options: [
      { text: "Call it what it is, there, in front of the hall. You'll pay for that before you leave town.", w: { F: 1, R: 2 } },
      { text: "Find the farmer that evening and help him however you can, quietly.", w: { W: 2 } },
      { text: "Write it down, take it to the district office, and wait for the slow wheel to turn.", w: { E: 2, R: 0.5 } },
      { text: "Find out what the magistrate owes, and to whom.", w: { V: 2, A: 1 } },
    ],
  },
  {
    id: "book",
    text: "A book sits on a lectern in an abandoned chapter house, wax seal unbroken, bound with a cord tied in a Faith knot. Someone thought it was dangerous. That someone is long gone. You:",
    options: [
      { text: "Open it. What is a book you can't read for?", w: { V: 2, A: 1 } },
      { text: "Leave it. It was sealed by someone who knew why.", w: { E: 2, R: 1 } },
      { text: "Carry it out, seal intact, to someone who would know what to do with it.", w: { W: 1, E: 1 } },
      { text: "Read enough to know what it is, then close it and never say what you saw.", w: { A: 2 } },
    ],
  },
  {
    id: "wait",
    text: "A contact tells you to wait for them in a mountain village. Three days. By the second afternoon you:",
    options: [
      { text: "Have left to find them yourself.", w: { F: 2 } },
      { text: "Know everyone's name and half their troubles.", w: { W: 2 } },
      { text: "Have fixed the well-rope and the gate that wouldn't latch.", w: { E: 2 } },
      { text: "Know the roads out, who's lying about the toll, and where the rumors start.", w: { A: 1, V: 1 } },
    ],
  },
  {
    id: "soldout",
    text: "A friend of ten years sold a secret of yours to someone who could use it. You hear it from a third party. The next time you see your friend:",
    options: [
      { text: "You say it to their face, all of it. By morning it's gone from you.", w: { F: 2 } },
      { text: "You keep them close, keep smiling, and never trust them again.", w: { W: 1, V: 1 } },
      { text: "You cut them off clean. No speech. You don't look back.", w: { E: 1, R: 1 } },
      { text: "You need to know what they got for it, and whether it was worth you.", w: { A: 1, V: 2 } },
    ],
  },
  {
    id: "command",
    text: "The captain is down with fever and hands you the company for one night. Forty people, most older than you, none of whom asked for this. You:",
    options: [
      { text: "Act on your own read and explain in the morning.", w: { F: 2 } },
      { text: "Go tent to tent and ask what each of them needs.", w: { W: 2 } },
      { text: "Set the watch and the rules, and hold them to it even when they grumble.", w: { E: 2, R: 1 } },
      { text: "Use the dark to learn what they won't say to a captain.", w: { A: 1, V: 1 } },
    ],
  },
  {
    id: "crossroads",
    text: "A stranger sits weeping at a crossroads at dusk. No pack, no horse. You have a day's walk left and no lantern. You:",
    options: [
      { text: "Sit down beside them and say nothing.", w: { W: 2 } },
      { text: "Ask what happened and what needs doing.", w: { F: 1, R: 1 } },
      { text: "Leave what food you can spare and keep walking.", w: { E: 1 } },
      { text: "Note it, and pass. It isn't yours to carry.", w: { A: 1, W: -1 } },
    ],
  },
  {
    id: "dark",
    text: "Deep in the wood the fire has burned low, and there is something out in the dark that shouldn't be there. It isn't moving. Neither are you. You:",
    options: [
      { text: "Go toward it.", w: { F: 2, V: 1 } },
      { text: "Go very still and listen for a long time.", w: { A: 2 } },
      { text: "Wake the others, quietly.", w: { W: 1, E: 1 } },
      { text: "Light every lamp you have and let it see you.", w: { R: 2 } },
    ],
  },
  {
    id: "failed",
    text: "You failed at a thing you said you could do, in front of everyone whose opinion you care about. The next morning you are:",
    options: [
      { text: "Already planning the next attempt.", w: { F: 2, V: 0.5 } },
      { text: "Thinking about who you let down, and what it cost them.", w: { W: 1, R: 1 } },
      { text: "Back at the fundamentals, from the beginning.", w: { E: 2 } },
      { text: "Taking it apart, piece by piece, to find exactly where it broke.", w: { A: 2 } },
    ],
  },
  {
    id: "technique",
    text: "A stranger on the road offers to teach you a technique. It works; you've watched it work. It also takes something from the user each time, and he won't say what. You:",
    options: [
      { text: "Accept. The cost is noted. You'll decide later whether it's too much.", w: { V: 2 } },
      { text: "Refuse, and warn the next town about him, knowing it makes you a liar if you're wrong.", w: { R: 2 } },
      { text: "Want to watch it used once more before you decide anything.", w: { A: 2 } },
      { text: "Ask him, plainly, what it has done to him.", w: { W: 1, A: 0.5 } },
    ],
  },
  {
    id: "alone",
    text: "Everyone you respect says you're wrong. Not enemies. The people who've earned the right to say it. You:",
    options: [
      { text: "Hold, and accept that it may cost you them.", w: { R: 2, E: 1 } },
      { text: "Fold. They know things you don't.", w: { W: 1, E: 1 } },
      { text: "Argue it once, lose interest, and move on.", w: { F: 1, A: 1 } },
      { text: "Doubt them quietly and go looking for proof.", w: { A: 1, V: 1 } },
    ],
  },
  {
    id: "paid",
    text: "A purse arrives with your name on it for a job you never did. No one has noticed. No one will. You:",
    options: [
      { text: "Send it back with a note.", w: { R: 2 } },
      { text: "Keep it. The world's ledger evens out in the end.", w: { V: 1, W: 0.5 } },
      { text: "Keep it, tell them, and offer to earn it.", w: { E: 2 } },
      { text: "Spend it before anyone thinks to ask.", w: { F: 2, V: 1 } },
    ],
  },
  {
    id: "quietyear",
    text: "Nothing happens for a year. No work, no war, no one calling. By the end of it you have:",
    options: [
      { text: "Left.", w: { F: 2 } },
      { text: "Put down roots and learned the neighbors' names.", w: { E: 2 } },
      { text: "Filled a shelf with things you finally had time to study.", w: { A: 2 } },
      { text: "Started something you know you can't finish.", w: { F: 1, V: 1 } },
    ],
  },
  {
    id: "losingfight",
    text: "Someone weaker than you asks for help with a fight they're going to lose. They know it. They're asking anyway. You:",
    options: [
      { text: "Fight it with them, and lose with them if it comes to that.", w: { F: 1, R: 2 } },
      { text: "Talk them out of it.", w: { W: 2 } },
      { text: "Tell them no, for now, and train them until it isn't a losing fight.", w: { E: 2 } },
      { text: "Find a way for it not to be a fight at all.", w: { A: 2 } },
    ],
  },
  {
    id: "dyingman",
    text: "A dying man asks you about his son, whom you know to be dead. He has moments to live. You give him:",
    options: [
      { text: "The truth. His son died after taking a local woman hostage, and killed her before he went.", w: { R: 2, A: 1 } },
      { text: "The kind answer: that his son died in battle.", w: { W: 2 } },
      { text: "Whatever answer he seems to want.", w: { W: 1, A: 0.5 } },
      { text: "Nothing. You hold his hand and stay.", w: { E: 1, W: 1 } },
    ],
  },
  {
    id: "arrival",
    text: "You've reached the thing you set out for. Years of it. It's in your hands. The first thing you feel is:",
    options: [
      { text: "That it isn't enough.", w: { V: 2, F: 1 } },
      { text: "Rest. You can put it down now.", w: { E: 2 } },
      { text: "The weight of what it cost, and who paid.", w: { R: 2, W: 1 } },
      { text: "Curiosity about what's past it.", w: { A: 2, V: 1 } },
    ],
  },
  {
    id: "rite",
    text: "The village keeps an old rite every spring: a bowl of milk left at the field's edge overnight. No one can tell you why. You're staying the season. You:",
    options: [
      { text: "Keep it, same as them.", w: { E: 2 } },
      { text: "Ask why until someone gives you a real answer.", w: { A: 2 } },
      { text: "Skip it once, to see what happens.", w: { F: 1, V: 1 } },
      { text: "Keep it for their sake, not yours.", w: { W: 2 } },
    ],
  },
  {
    id: "anger",
    text: "When you are truly angry, not annoyed, angry, it:",
    options: [
      { text: "Is out before you've decided anything.", w: { F: 2 } },
      { text: "Goes cold and waits.", w: { V: 2, W: 0.5 } },
      { text: "Sits in your chest for weeks.", w: { W: 1, E: 1 } },
      { text: "Gets taken apart until it's only information.", w: { A: 2 } },
    ],
  },
  {
    id: "promise",
    text: "A promise you made two years ago has become expensive. Nobody would blame you for letting it go. You:",
    options: [
      { text: "Keep it, and eat the cost.", w: { R: 2, E: 1 } },
      { text: "Go back to them and renegotiate honestly.", w: { W: 1, A: 1 } },
      { text: "Break it, and carry that.", w: { F: 1, V: 1 } },
      { text: "Keep it, and resent it.", w: { E: 2, W: -1 } },
    ],
  },
  {
    id: "split",
    text: "Half the party wants to press on. Half wants to turn back. Both halves are right. You:",
    options: [
      { text: "Go on. They can follow or not.", w: { F: 2 } },
      { text: "Go with whichever half is weaker.", w: { W: 2, R: 1 } },
      { text: "Say what you think is right, then go with the vote.", w: { E: 1, R: 1 } },
      { text: "Find the third road.", w: { A: 2 } },
    ],
  },
  {
    id: "luck",
    text: "Someone praises you for a thing you know was luck. They mean it. You:",
    options: [
      { text: "Correct them, even though it takes something from them.", w: { R: 2 } },
      { text: "Accept it. They need someone to believe in.", w: { W: 2 } },
      { text: "Say nothing, and use it.", w: { V: 2 } },
      { text: "Laugh it off.", w: { F: 1, A: 1 } },
    ],
  },
  {
    id: "hide",
    text: "What would you least want people to know about you?",
    options: [
      { text: "How fast I lose interest.", w: { F: 2 } },
      { text: "How much I need to be needed.", w: { W: 2 } },
      { text: "How afraid I am of change.", w: { E: 2 } },
      { text: "How little I feel in the moment.", w: { A: 2 } },
      { text: "How sure I am that I'm right.", w: { R: 2 } },
      { text: "How much I want.", w: { V: 2 } },
    ],
  },
  {
    id: "child",
    text: "A child asks what you're for. You say:",
    options: [
      { text: "\"To go first.\"", w: { F: 2 } },
      { text: "\"To stay.\"", w: { E: 2 } },
      { text: "\"To understand.\"", w: { A: 2 } },
      { text: "\"To hold what others can't.\"", w: { W: 2 } },
      { text: "\"To be right when it costs me.\"", w: { R: 2 } },
      { text: "\"To want more than I'm given.\"", w: { V: 2 } },
    ],
  },
  {
    id: "nightbefore",
    text: "The night before something terrible, you:",
    options: [
      { text: "Sleep.", w: { E: 2, R: 1 } },
      { text: "Keep everyone up talking.", w: { W: 1, F: 1 } },
      { text: "Check everything twice.", w: { E: 1, A: 1 } },
      { text: "Walk out alone to see it before dawn.", w: { F: 1, A: 1, V: 1 } },
    ],
  },
  {
    id: "sinwrought",
    text: "A man in the village square has begun to change. His grief has been eating him for months; now it's eating the people around him, and everyone can see what he's becoming. The Faith is two days away. You:",
    options: [
      { text: "Go to him now, while he's still someone you can reach.", w: { F: 2, W: 1 } },
      { text: "Get the children out first, then the rest. He's already gone.", w: { E: 2, A: 0.5 } },
      { text: "End it, in the open, and answer for it when the Faith arrives.", w: { R: 2 } },
      { text: "Watch what he becomes. You've never seen it happen.", w: { A: 1, V: 2 } },
    ],
  },
  {
    id: "berth",
    text: "A ship leaves at dawn for somewhere you've wanted to go your whole life. One berth left. The person beside you wants it just as badly and has waited longer. You:",
    options: [
      { text: "Take it. You'll come back for them.", w: { F: 1, V: 2 } },
      { text: "Let them have it and stay on the dock.", w: { W: 2 } },
      { text: "Flip a coin in front of them and abide by it.", w: { E: 1, R: 1 } },
      { text: "Find out if there's a second ship.", w: { A: 2 } },
    ],
  },
  {
    id: "smalllie",
    text: "A friend asks you to lie for them. A small lie, to someone who has done worse. It would cost you nothing but the lie. You:",
    options: [
      { text: "Refuse, and lose something with the friend.", w: { R: 2 } },
      { text: "Do it. It's for them, not for you.", w: { W: 2 } },
      { text: "Do it, and stop thinking about it.", w: { F: 1, V: 1 } },
      { text: "Tell them you'll say nothing at all, and hold to that whatever it costs either of you.", w: { E: 1, R: 1 } },
    ],
  },
  {
    id: "letter",
    text: "A letter arrives. Someone you loved once has died far away, years since you last spoke. You:",
    options: [
      { text: "Go.", w: { F: 2 } },
      { text: "Read it twice, put it away, and are strange all week.", w: { W: 2 } },
      { text: "Write to the family, send what money you can, and do the correct things.", w: { E: 1, R: 1 } },
      { text: "Feel less than you think you should, and wonder about that.", w: { A: 2, W: -1 } },
    ],
  },
  {
    id: "newway",
    text: "You're offered a new way of doing your work. Twice as fast, unproven, and it makes the old way look foolish, along with the people who taught it to you. You:",
    options: [
      { text: "Take it up today.", w: { F: 2, V: 0.5 } },
      { text: "Learn it quietly, and keep the old way in front of the people it matters to.", w: { W: 1, A: 1 } },
      { text: "Stay with the way you were taught.", w: { E: 2 } },
      { text: "Test it against the old way until one of them wins, and say so even if your teachers lose.", w: { A: 1, R: 1 } },
    ],
  },
  {
    id: "unseen",
    text: "You may have exactly what you asked for, or the thing you didn't know to ask for, unseen. One or the other, once. You:",
    options: [
      { text: "Take what you asked for.", w: { E: 2 } },
      { text: "Take the unseen thing.", w: { V: 2, F: 1 } },
      { text: "Ask what the last person chose, and how it went for them.", w: { W: 1, A: 1 } },
      { text: "Ask who's offering, and why. You'll take neither until they answer.", w: { A: 1, R: 1 } },
    ],
  },
];

const FEEL_FIRST = [
  {
    id: "ff_door",
    text: "A door you were told never to open is standing open. The first thing you feel:",
    options: [
      { text: "Pull. Forward.", w: { F: 1, V: 1 } },
      { text: "Dread, for whoever left it that way.", w: { W: 1 } },
      { text: "Suspicion. Who wants me to go in?", w: { A: 1 } },
      { text: "Certainty that it should be shut.", w: { E: 1, R: 1 } },
    ],
  },
  {
    id: "ff_notallowed",
    text: "Someone tells you that you're not allowed. The first thing you feel:",
    options: [
      { text: "Heat.", w: { F: 1 } },
      { text: "Hurt.", w: { W: 1 } },
      { text: "Interest.", w: { A: 1 } },
      { text: "Want.", w: { V: 2 } },
    ],
  },
  {
    id: "ff_fragile",
    text: "You're handed something fragile, precious, and not yours. The first thing you feel:",
    options: [
      { text: "Care. Hold still.", w: { E: 1, W: 1 } },
      { text: "A jolt. Let's go.", w: { F: 1 } },
      { text: "Curiosity. Turn it over.", w: { A: 1 } },
      { text: "The wish that it were yours.", w: { V: 2 } },
    ],
  },
  {
    id: "ff_cry",
    text: "Someone cries in front of you. The first thing you feel:",
    options: [
      { text: "Their grief, in your own chest.", w: { W: 2 } },
      { text: "The need to do something, anything.", w: { F: 1 } },
      { text: "Distance. You watch.", w: { A: 1, W: -1 } },
      { text: "Duty.", w: { E: 1, R: 1 } },
    ],
  },
  {
    id: "ff_right",
    text: "You're told you were right all along. The first thing you feel:",
    options: [
      { text: "Vindication.", w: { R: 1, V: 1 } },
      { text: "Relief.", w: { W: 1 } },
      { text: "Not much. You knew.", w: { A: 1, E: 0.5 } },
      { text: "Boredom. What's next.", w: { F: 1 } },
    ],
  },
  {
    id: "ff_given",
    text: "Something you wanted is given to someone else. The first thing you feel:",
    options: [
      { text: "Sharp, then gone.", w: { F: 1 } },
      { text: "Glad for them, mostly.", w: { W: 1 } },
      { text: "Cold.", w: { V: 2 } },
      { text: "Fine. There'll be another.", w: { E: 1 } },
    ],
  },
];

/* The speaker's lines: one of the Sent, unnamed, talking to you in a dream.
 * Quiz flavor only; not canon for the game or world. Edit freely. */
const FORCE_COLORS = { Fire: "#e0503a", Water: "#3f8fd2", Earth: "#a07a4a", Air: "#5fb37a", Void: "#8a5fc7", Radiant: "#f0d878", Spacetime: "#7b62d9", Mind: "#e58ac2", Living: "#8fd4a8", Null: "#9aa3b5" };

const READER = {
  title: "Soul Affinity Quiz",
  splash: "Hello...? Are you awake?",
  splashYes: "Yes",
  intro: [
    "I can see you've been met with a terrible fate.",
    "The world you are about to wake up in is much different from your own...",
    "It's dangerous, and for much of it you will be alone. You will need to be strong.",
    "I have nothing I can offer you but this humble warning, for I am only a Soul, just like you.",
    "Ah... there may be one thing I can do... this world, Vaeloria, is full of Magick. If you'll allow me, I can peer into your soul and impart the knowledge of your nature upon you.",
  ],
  introChoices: { nature: "What do you mean my \"nature\"?", yes: "Yes, please do." },
  nature: [
    "Magick hangs in the air of Vaeloria like water hangs in the sea. The living breathe magick into their lungs and their bodies refine it into something that answers their will.",
    "But a body only makes the power. It is the soul that spends it. To understand Magick, you must first feel the force you're trying to control, press your will into it, and let it go into the world.",
  ],
  natureChoice: "What does Magick feel like?",
  /* Blocks: a header, then every named line typing at the same time. `name` is colored. */
  primal: {
    header: "The Primal Forces are the elemental forces sewn into the fabric of reality as its building blocks; Everything is made from these elements.",
    lines: [
      { name: "Fire", text: "feels exciting, thrilling, all-consuming, and wild. It begins things, but lacks staying power. It is the warmth of the hearth, and the flames that raze kingdoms." },
      { name: "Water", text: "feels empathetic, engrossing, accepting, enduring, and immortal. It reflects what looks into it and gives way when opposed. Enveloping, smothering, and drowning; Sometimes with kindness, sometimes with cruelty." },
      { name: "Earth", text: "feels steadfast, supportive, and unyielding. It carries the weight of tradition; feeding and nourishing. It is stubborn in its defense and slow to change. It resists influence, offering stability and embodying strength and confidence." },
      { name: "Air", text: "feels restless, everchanging, clever, and analytical. It is freedom in motion, it can scatter or coalesce to form powerful storms. Rarely able to remain still but always adaptable to change. Air is a careful observer, and a quick learner." },
    ],
  },
  primalChoice: "Okay, anything else?",
  moral: {
    header: "There are the Moral Forces, which require immense strength of will and clarity of desire to utilize, the mind must be strong as both risk corrupting their users with power that greatly exceeds that of the primal forces.",
    lines: [
      { name: "Void", text: "magick feels like hunger, allure, and temptation. Born from darkness, the void exists everywhere the light cannot reach. Void magick often involves a price for its use, risking madness in those who choose to wield it. It is the veil between freedom and restraint, fail to remain mentally strong and the void will consume you." },
      { name: "Radiant", text: "magick feels like purpose, hope, and conviction. The Light that embodies purity, illumination, and standing for ideals greater than the self; It provides guidance and clarity. When taken to extremes Light can burn with strict judgement or blinding justice, becoming strict and oppressive. Fail to remain mentally strong and the light will dominate you." },
    ],
  },
  moralEnd: [
    "The Nature of your soul will tell us which element best suits you.",
    "There are other forces of Magick, but souls of those natures are... not possible. Not for you.",
    "That is all I can share.",
    "Shall I read your soul now?",
  ],
  moralChoices: { other: "Wait, I want to know about the other forces.", yes: "Yes, go ahead." },
  meta: {
    header: "The Meta Forces of magick are those that bend, distort, and reinterpret reality and how it behaves.",
    lines: [
      { name: "Spacetime", text: "is the magick of infinity. It is timeless, formless, and strange. It bends space, halts or hastens time, and exists beyond mortal capability; Like wielding a tool you're not capable of understanding. It can glimpse truths not meant for minds bound to flesh, offering mastery over the weave of existence itself or intoxicating madness in the face of eternity. It is not inherently good or evil, but neutral, uncaring, and terrifying in scale." },
      { name: "Mind", text: "magick consists of thought, will, memory, and perception. Projecting influence and will onto the world, rewriting how others perceive reality, or how reality itself behaves." },
    ],
  },
  metaEnd: ["If Cosmic is the external fabric of reality, mind is the internal."],
  metaChoice: "...",
  precreation: {
    header: "Lastly there is Pre-Creation Magick, which creates, deletes, or defines existence itself; If The Meta Forces alter how reality behaves, Pre-Creation Magick alters what reality even is.",
    lines: [
      { name: "Living Magick", text: "is wielded and understood only by omniscient, godlike beings. It is the raw, animating force of reality and life itself, the power that gives beings life, will, identity, and persistence in reality. The mortal plane itself cannot sustain it." },
      { name: "Null Magick (Mu)", text: "is not a force, but the absence that all forces are written into. Where fire transforms and the void consumes, Mu subtracts. Whatever it touches is simply unmade from reality. It is impossible to enter a state of resonance, as no matter aligns with its own deletion. To conjure Mu, one must feel emptiness beyond emptiness; A grief that has finished grieving, a sincere will that something end. Relinquishing everything, as any flicker of emotion or thought contaminates the inversion. Most mortal minds cannot structurally hold a genuine feeling of nothingness." },
    ],
  },
  otherEnd: ["That is all I can share.", "May I?"],
  yes: "Yes, go ahead.",
  partOne: ["Good. I'll say something about you, and you tell me how true it is, understand?"],
  partTwo: ["Good, I'm getting an idea of your true nature. Now you'll be presented with scenarios, to you they will feel very real. I want you to imagine how you would act in them."],
  partThree: ["Got it. Just a few more questions."],
  reading: ["There it is."],
};

if (typeof module !== "undefined") {
  module.exports = { BASELINE, SCENARIOS, FEEL_FIRST, READER, FORCE_COLORS };
}
