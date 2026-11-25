// The skill tree and the inputs for "what to learn next".
// Every course stays open to read. "Locked" only means the tree suggests it after its prerequisites.
// A prerequisite counts as met when the course is completed or the person rates themselves Practising or higher.

export const BRANCHES = [
  { id: "survivor", name: "Survivor", icon: "🔥", blurb: "Fire, water, shelter and finding your way.",
    tiers: [["build-a-campfire", "find-potable-water", "always-know-north", "tie-a-bowline", "predict-the-weather"],
            ["make-fire-without-matches", "build-a-shelter", "navigate-with-map-and-compass", "identify-poisonous-edible-plants"],
            ["survive-a-bear-attack"]] },
  { id: "ranger", name: "Ranger", icon: "🏹", blurb: "Woodcraft, archery and hunting, done safely.",
    tiers: [["shoot-a-bow-and-arrow", "split-firewood"],
            ["shoot-a-gun", "use-a-chainsaw-safely"],
            ["hunt", "fell-a-tree"],
            ["field-dress-game"]] },
  { id: "explorer", name: "Explorer", icon: "🛶", blurb: "On the water and in the saddle.",
    tiers: [["cast-a-fishing-line", "paddle-a-canoe", "ride-a-horse"], ["skipper-a-boat"]] },
  { id: "medic", name: "Medic", icon: "⛑️", blurb: "First aid that saves lives.",
    tiers: [["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn"],
            ["tie-a-tourniquet", "treat-frostbite", "treat-a-snakebite"],
            ["perform-the-firemans-carry"]] },
  { id: "guardian", name: "Guardian", icon: "🛡️", blurb: "Looking after the people around you.",
    tiers: [["practice-situational-awareness", "change-a-diaper"], ["calm-a-crying-baby", "break-down-a-door"]] },
  { id: "builder", name: "Builder", icon: "🔨", blurb: "Fixing and making things at home.",
    tiers: [["hammer-a-nail-correctly", "unclog-a-toilet", "sew-a-button", "shovel-snow"],
            ["hang-a-picture", "fix-a-leaky-faucet", "sharpen-a-knife", "grow-your-own-food"]] },
  { id: "mechanic", name: "Mechanic", icon: "🔧", blurb: "Driving well and keeping a car going.",
    tiers: [["jump-start-a-car", "change-a-flat-tire", "parallel-park"],
            ["change-your-cars-oil", "drive-in-snow", "drive-stick-shift"],
            ["get-a-car-unstuck", "hitch-back-up-a-trailer", "ride-a-motorcycle"]] },
  { id: "chef", name: "Chef", icon: "🍳", blurb: "Cooking, grilling and hosting.",
    tiers: [["cook-eggs", "brew-the-perfect-cup-of-coffee", "cook-bacon", "make-pancakes-from-scratch", "properly-pour-beer"],
            ["cook-a-steak", "grill-with-charcoal", "fillet-a-fish", "carve-a-turkey", "mix-two-classic-cocktails"],
            ["cook-a-signature-dish"]] },
  { id: "diplomat", name: "Diplomat", icon: "🤝", blurb: "Talking, listening and bringing people together.",
    tiers: [["shake-hands", "make-small-talk", "write-a-letter", "tell-a-joke"],
            ["tell-a-story", "negotiate-haggle", "ask-a-woman-on-a-date", "know-how-to-dance", "give-a-good-massage"],
            ["give-a-speech", "make-a-toast"]] },
  { id: "scholar", name: "Scholar", icon: "📚", blurb: "Reading, thinking and making things.",
    tiers: [["read-a-book", "write-in-cursive", "entertain-yourself-without-a-smartphone", "take-the-perfect-photo"],
            ["recite-a-poem-from-memory", "make-a-logical-argument", "play-one-song-on-the-guitar"],
            ["speak-a-foreign-language"]] },
  { id: "athlete", name: "Athlete", icon: "💪", blurb: "Strength, swimming and moving well.",
    tiers: [["do-a-proper-push-up", "do-a-squat-properly", "swim-the-front-crawl"],
            ["do-a-proper-pull-up", "do-a-deadlift-properly", "do-a-front-dive"],
            ["throw-a-knockout-punch"]] },
  { id: "dapper", name: "Dapper", icon: "👔", blurb: "Looking sharp for any occasion.",
    tiers: [["shine-your-shoes", "iron-your-clothes", "tie-a-necktie", "wet-shave"],
            ["dress-for-the-occasion"],
            ["buy-a-suit"]] },
  { id: "entertainer", name: "Entertainer", icon: "🃏", blurb: "Games, tricks and fun.",
    tiers: [["shuffle-cards", "whistle-with-your-fingers", "throw-a-spiral", "open-a-bottle-without-an-opener"],
            ["play-poker", "know-two-cool-uncle-tricks", "break-a-rack-of-pool-balls", "pick-a-lock"]] }
];

// Prerequisites. A skill with none listed is open from the start.
export const REQUIRES = {
  "make-fire-without-matches": ["build-a-campfire"],
  "build-a-shelter": ["tie-a-bowline"],
  "navigate-with-map-and-compass": ["always-know-north"],
  "identify-poisonous-edible-plants": ["find-potable-water"],
  "survive-a-bear-attack": ["navigate-with-map-and-compass", "build-a-shelter"],
  "split-firewood": ["build-a-campfire"],
  "use-a-chainsaw-safely": ["split-firewood"],
  "hunt": ["shoot-a-gun", "navigate-with-map-and-compass"],
  "fell-a-tree": ["use-a-chainsaw-safely"],
  "field-dress-game": ["hunt"],
  "skipper-a-boat": ["paddle-a-canoe"],
  "tie-a-tourniquet": ["perform-cpr"],
  "treat-frostbite": ["treat-a-burn"],
  "treat-a-snakebite": ["treat-a-burn"],
  "perform-the-firemans-carry": ["perform-cpr"],
  "calm-a-crying-baby": ["change-a-diaper"],
  "break-down-a-door": ["practice-situational-awareness"],
  "hang-a-picture": ["hammer-a-nail-correctly"],
  "fix-a-leaky-faucet": ["unclog-a-toilet"],
  "change-your-cars-oil": ["change-a-flat-tire"],
  "drive-in-snow": ["parallel-park"],
  "drive-stick-shift": ["parallel-park"],
  "get-a-car-unstuck": ["drive-in-snow"],
  "hitch-back-up-a-trailer": ["parallel-park", "change-a-flat-tire"],
  "ride-a-motorcycle": ["drive-stick-shift"],
  "cook-a-steak": ["cook-eggs"],
  "grill-with-charcoal": ["cook-bacon"],
  "fillet-a-fish": ["sharpen-a-knife"],
  "carve-a-turkey": ["sharpen-a-knife"],
  "mix-two-classic-cocktails": ["properly-pour-beer"],
  "cook-a-signature-dish": ["cook-a-steak"],
  "tell-a-story": ["tell-a-joke"],
  "negotiate-haggle": ["make-small-talk"],
  "ask-a-woman-on-a-date": ["make-small-talk"],
  "give-a-speech": ["tell-a-story"],
  "make-a-toast": ["tell-a-story"],
  "recite-a-poem-from-memory": ["read-a-book"],
  "make-a-logical-argument": ["read-a-book"],
  "speak-a-foreign-language": ["recite-a-poem-from-memory"],
  "do-a-proper-pull-up": ["do-a-proper-push-up"],
  "do-a-deadlift-properly": ["do-a-squat-properly"],
  "do-a-front-dive": ["swim-the-front-crawl"],
  "throw-a-knockout-punch": ["do-a-proper-pull-up"],
  "dress-for-the-occasion": ["tie-a-necktie", "iron-your-clothes"],
  "buy-a-suit": ["dress-for-the-occasion"],
  "play-poker": ["shuffle-cards"],
  "know-two-cool-uncle-tricks": ["shuffle-cards"]
};

// ---------- Interview options ----------

export const AGE_BANDS = [
  { id: "13-17", label: "13 to 17" }, { id: "18-24", label: "18 to 24" }, { id: "25-34", label: "25 to 34" },
  { id: "35-49", label: "35 to 49" }, { id: "50-64", label: "50 to 64" }, { id: "65+", label: "65 or older" }
];

export const LIFE_STAGES = [
  { id: "student", label: "Student", skills: ["read-a-book", "make-a-logical-argument", "give-a-speech", "speak-a-foreign-language", "cook-eggs", "sew-a-button", "iron-your-clothes", "make-small-talk", "swim-the-front-crawl", "entertain-yourself-without-a-smartphone"] },
  { id: "starting-out", label: "First job or living on my own", skills: ["cook-eggs", "cook-a-signature-dish", "unclog-a-toilet", "fix-a-leaky-faucet", "hang-a-picture", "iron-your-clothes", "dress-for-the-occasion", "buy-a-suit", "shake-hands", "negotiate-haggle", "change-a-flat-tire", "jump-start-a-car", "perform-cpr"] },
  { id: "single", label: "Single and dating", skills: ["ask-a-woman-on-a-date", "make-small-talk", "know-how-to-dance", "tell-a-joke", "cook-a-steak", "dress-for-the-occasion", "wet-shave"] },
  { id: "partnered", label: "In a relationship", skills: ["cook-a-signature-dish", "know-how-to-dance", "give-a-good-massage", "make-a-toast", "write-a-letter", "brew-the-perfect-cup-of-coffee"] },
  { id: "new-parent", label: "Expecting or new parent", skills: ["change-a-diaper", "calm-a-crying-baby", "perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "practice-situational-awareness", "cook-eggs", "make-pancakes-from-scratch"] },
  { id: "parent-kids", label: "Parent of school-age kids", skills: ["throw-a-spiral", "cast-a-fishing-line", "build-a-campfire", "know-two-cool-uncle-tricks", "tell-a-story", "make-pancakes-from-scratch", "treat-a-burn", "perform-cpr", "swim-the-front-crawl", "shuffle-cards", "read-a-book"] },
  { id: "homeowner", label: "Homeowner", skills: ["hammer-a-nail-correctly", "unclog-a-toilet", "fix-a-leaky-faucet", "hang-a-picture", "sharpen-a-knife", "grow-your-own-food", "shovel-snow", "split-firewood", "use-a-chainsaw-safely"] },
  { id: "renter", label: "Renter", skills: ["unclog-a-toilet", "hang-a-picture", "sew-a-button", "sharpen-a-knife", "cook-a-signature-dish", "negotiate-haggle"] },
  { id: "driver", label: "I drive regularly", skills: ["jump-start-a-car", "change-a-flat-tire", "parallel-park", "change-your-cars-oil", "drive-in-snow", "get-a-car-unstuck", "hitch-back-up-a-trailer"] },
  { id: "rural", label: "I live in the country", skills: ["split-firewood", "use-a-chainsaw-safely", "fell-a-tree", "drive-in-snow", "get-a-car-unstuck", "hitch-back-up-a-trailer", "shovel-snow", "find-potable-water", "identify-poisonous-edible-plants", "survive-a-bear-attack", "grow-your-own-food"] },
  { id: "caregiver", label: "Caring for a relative", skills: ["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "perform-the-firemans-carry", "practice-situational-awareness", "cook-a-signature-dish", "give-a-good-massage"] },
  { id: "retired", label: "Retired", skills: ["grow-your-own-food", "write-a-letter", "read-a-book", "play-one-song-on-the-guitar", "speak-a-foreign-language", "take-the-perfect-photo", "tell-a-story", "perform-cpr", "know-how-to-dance", "cook-a-signature-dish"] }
];

export const GOALS = [
  { id: "emergencies", label: "Be ready for emergencies", skills: ["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "tie-a-tourniquet", "treat-frostbite", "treat-a-snakebite", "perform-the-firemans-carry", "practice-situational-awareness", "break-down-a-door", "jump-start-a-car", "change-a-flat-tire", "find-potable-water", "build-a-campfire", "make-fire-without-matches", "always-know-north", "navigate-with-map-and-compass", "get-a-car-unstuck", "drive-in-snow", "swim-the-front-crawl"] },
  { id: "save-money", label: "Fix things myself and save money", skills: ["hammer-a-nail-correctly", "unclog-a-toilet", "fix-a-leaky-faucet", "hang-a-picture", "sew-a-button", "sharpen-a-knife", "change-your-cars-oil", "change-a-flat-tire", "jump-start-a-car", "cook-a-signature-dish", "grow-your-own-food", "negotiate-haggle", "brew-the-perfect-cup-of-coffee", "iron-your-clothes", "shovel-snow"] },
  { id: "outdoors", label: "Spend more time outdoors", skills: ["build-a-campfire", "find-potable-water", "always-know-north", "tie-a-bowline", "predict-the-weather", "make-fire-without-matches", "build-a-shelter", "navigate-with-map-and-compass", "identify-poisonous-edible-plants", "survive-a-bear-attack", "cast-a-fishing-line", "paddle-a-canoe", "ride-a-horse", "skipper-a-boat", "shoot-a-bow-and-arrow"] },
  { id: "fitness", label: "Get fit and strong", skills: ["do-a-proper-push-up", "do-a-squat-properly", "swim-the-front-crawl", "do-a-proper-pull-up", "do-a-deadlift-properly", "do-a-front-dive", "throw-a-knockout-punch", "paddle-a-canoe", "know-how-to-dance", "split-firewood"] },
  { id: "cooking", label: "Cook and host better", skills: ["cook-eggs", "brew-the-perfect-cup-of-coffee", "cook-bacon", "make-pancakes-from-scratch", "cook-a-steak", "grill-with-charcoal", "fillet-a-fish", "carve-a-turkey", "cook-a-signature-dish", "mix-two-classic-cocktails", "properly-pour-beer", "make-a-toast"] },
  { id: "social", label: "Feel confident with people", skills: ["shake-hands", "make-small-talk", "tell-a-joke", "tell-a-story", "know-how-to-dance", "make-a-toast", "give-a-speech", "dress-for-the-occasion", "ask-a-woman-on-a-date", "write-a-letter"] },
  { id: "career", label: "Grow my career", skills: ["give-a-speech", "negotiate-haggle", "make-a-logical-argument", "write-a-letter", "shake-hands", "make-small-talk", "dress-for-the-occasion", "buy-a-suit", "tie-a-necktie", "speak-a-foreign-language", "tell-a-story"] },
  { id: "family", label: "Take care of my family", skills: ["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "change-a-diaper", "calm-a-crying-baby", "practice-situational-awareness", "cook-eggs", "make-pancakes-from-scratch", "tell-a-story", "read-a-book", "sew-a-button", "unclog-a-toilet", "jump-start-a-car"] },
  { id: "community", label: "Help on community projects", skills: ["give-a-speech", "write-a-letter", "make-a-logical-argument", "take-the-perfect-photo", "negotiate-haggle", "tell-a-story", "perform-cpr", "grow-your-own-food", "hammer-a-nail-correctly", "make-small-talk"] },
  { id: "mind", label: "Learn and create", skills: ["read-a-book", "write-in-cursive", "take-the-perfect-photo", "recite-a-poem-from-memory", "make-a-logical-argument", "play-one-song-on-the-guitar", "speak-a-foreign-language", "entertain-yourself-without-a-smartphone"] },
  { id: "fun", label: "Have more fun", skills: ["shuffle-cards", "whistle-with-your-fingers", "throw-a-spiral", "play-poker", "know-two-cool-uncle-tricks", "break-a-rack-of-pool-balls", "tell-a-joke", "know-how-to-dance", "play-one-song-on-the-guitar", "cast-a-fishing-line", "grill-with-charcoal"] }
];

export const WEEKLY_TIME = [
  { id: "1h", label: "About an hour" }, { id: "2-4h", label: "2 to 4 hours" }, { id: "5h+", label: "5 hours or more" }
];

export const SKIP_OPTIONS = [
  { id: "firearms", label: "Firearms and hunting", skills: ["shoot-a-gun", "hunt", "field-dress-game"] },
  { id: "alcohol", label: "Alcohol", skills: ["properly-pour-beer", "mix-two-classic-cocktails", "open-a-bottle-without-an-opener"] },
  { id: "driving", label: "Driving (I don't drive)", skills: ["parallel-park", "change-a-flat-tire", "drive-in-snow", "hitch-back-up-a-trailer", "drive-stick-shift", "change-your-cars-oil", "get-a-car-unstuck", "jump-start-a-car", "ride-a-motorcycle"] },
  { id: "physical", label: "Very physical skills", skills: ["do-a-deadlift-properly", "do-a-proper-pull-up", "throw-a-knockout-punch", "do-a-front-dive", "fell-a-tree", "split-firewood", "perform-the-firemans-carry", "shovel-snow"] },
  { id: "water", label: "Water activities", skills: ["swim-the-front-crawl", "do-a-front-dive", "paddle-a-canoe", "skipper-a-boat"] },
  { id: "dating", label: "Dating", skills: ["ask-a-woman-on-a-date"] }
];

// Never suggested to anyone under 18 (the courses stay readable).
export const ADULT_ONLY = ["properly-pour-beer", "mix-two-classic-cocktails", "shoot-a-gun", "hunt", "field-dress-game",
  "use-a-chainsaw-safely", "fell-a-tree", "ride-a-motorcycle", "give-a-good-massage", "open-a-bottle-without-an-opener"];

// A light nudge by age range, on top of goals and life stage.
export const AGE_NUDGE = {
  "13-17": ["read-a-book", "swim-the-front-crawl", "cook-eggs", "make-small-talk", "shake-hands", "give-a-speech", "sew-a-button", "perform-cpr"],
  "18-24": ["cook-eggs", "unclog-a-toilet", "change-a-flat-tire", "jump-start-a-car", "shake-hands", "dress-for-the-occasion", "negotiate-haggle", "perform-cpr"],
  "25-34": ["cook-a-signature-dish", "negotiate-haggle", "fix-a-leaky-faucet", "perform-cpr"],
  "35-49": ["perform-cpr", "fix-a-leaky-faucet", "tell-a-story", "grow-your-own-food"],
  "50-64": ["perform-cpr", "grow-your-own-food", "write-a-letter", "take-the-perfect-photo", "speak-a-foreign-language"],
  "65+": ["perform-cpr", "grow-your-own-food", "write-a-letter", "take-the-perfect-photo", "tell-a-story", "play-one-song-on-the-guitar"]
};
