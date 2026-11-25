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
    tiers: [["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "help-someone-in-a-mental-health-crisis"],
            ["tie-a-tourniquet", "treat-frostbite", "treat-a-snakebite"],
            ["perform-the-firemans-carry"]] },
  { id: "guardian", name: "Guardian", icon: "🛡️", blurb: "Looking after the people around you.",
    tiers: [["practice-situational-awareness", "change-a-diaper", "babysit-safely", "care-for-someone-who-is-sick", "prepare-an-emergency-kit-and-plan"],
            ["calm-a-crying-baby", "break-down-a-door", "feed-and-burp-a-baby", "plan-activities-for-kids", "run-a-family-meeting"]] },
  { id: "builder", name: "Builder", icon: "🔨", blurb: "Fixing and making things at home.",
    tiers: [["hammer-a-nail-correctly", "unclog-a-toilet", "sew-a-button", "shovel-snow"],
            ["hang-a-picture", "fix-a-leaky-faucet", "sharpen-a-knife", "grow-your-own-food"]] },
  { id: "mechanic", name: "Mechanic", icon: "🔧", blurb: "Driving well and keeping a car going.",
    tiers: [["jump-start-a-car", "change-a-flat-tire", "parallel-park"],
            ["change-your-cars-oil", "drive-in-snow", "drive-stick-shift"],
            ["get-a-car-unstuck", "hitch-back-up-a-trailer", "ride-a-motorcycle"]] },
  { id: "chef", name: "Chef", icon: "🍳", blurb: "Cooking, grilling and hosting.",
    tiers: [["cook-eggs", "brew-the-perfect-cup-of-coffee", "cook-bacon", "make-pancakes-from-scratch", "properly-pour-beer", "use-basic-knife-skills"],
            ["cook-a-steak", "grill-with-charcoal", "fillet-a-fish", "carve-a-turkey", "mix-two-classic-cocktails"],
            ["cook-a-signature-dish", "host-a-dinner-party"]] },
  { id: "provider", name: "Provider", icon: "🥫", blurb: "Planning meals, food safety, baking and preserving.",
    tiers: [["plan-a-week-of-meals", "practise-kitchen-food-safety", "read-a-nutrition-label", "pack-a-healthy-lunch"],
            ["freeze-and-store-food-properly", "bake-a-loaf-of-bread", "bake-a-pie-from-scratch", "make-soup-from-scratch"],
            ["can-food-safely-in-a-water-bath"]] },
  { id: "diplomat", name: "Diplomat", icon: "🤝", blurb: "Talking, listening and bringing people together.",
    tiers: [["shake-hands", "make-small-talk", "write-a-letter", "tell-a-joke", "introduce-people-to-each-other"],
            ["tell-a-story", "negotiate-haggle", "ask-a-woman-on-a-date", "know-how-to-dance", "give-a-good-massage"],
            ["give-a-speech", "make-a-toast", "organize-a-community-event"]] },
  { id: "counselor", name: "Counselor", icon: "🫶", blurb: "Listening, calm, and being there for people.",
    tiers: [["listen-actively", "practise-mindful-breathing"],
            ["resolve-a-conflict-calmly", "set-boundaries-and-say-no", "comfort-someone-who-is-grieving"]] },
  { id: "scholar", name: "Scholar", icon: "📚", blurb: "Reading, thinking and making things.",
    tiers: [["read-a-book", "write-in-cursive", "entertain-yourself-without-a-smartphone", "take-the-perfect-photo", "manage-your-time-with-a-weekly-plan", "keep-a-journal", "sketch-what-you-see"],
            ["recite-a-poem-from-memory", "make-a-logical-argument", "play-one-song-on-the-guitar"],
            ["speak-a-foreign-language"]] },
  { id: "athlete", name: "Athlete", icon: "💪", blurb: "Strength, swimming and moving well.",
    tiers: [["do-a-proper-push-up", "do-a-squat-properly", "swim-the-front-crawl", "stretch-and-build-flexibility", "walk-or-run-a-5k"],
            ["do-a-proper-pull-up", "do-a-deadlift-properly", "do-a-front-dive"],
            ["throw-a-knockout-punch"]] },
  { id: "dapper", name: "Dapper", icon: "👔", blurb: "Looking sharp for any occasion.",
    tiers: [["shine-your-shoes", "iron-your-clothes", "tie-a-necktie", "wet-shave", "build-a-simple-skin-care-routine"],
            ["dress-for-the-occasion", "plan-a-wardrobe-on-a-budget"],
            ["buy-a-suit"]] },
  { id: "steward", name: "Steward", icon: "💰", blurb: "Budgeting, saving and protecting your money.",
    tiers: [["make-a-monthly-budget", "compare-prices-and-unit-prices", "spot-and-avoid-scams"],
            ["build-an-emergency-fund", "understand-a-paycheck-and-taxes", "check-your-credit-report"],
            ["start-saving-for-retirement"]] },
  { id: "maker", name: "Maker", icon: "🧵", blurb: "Mending, sewing, knitting and quilting.",
    tiers: [["mend-and-hem-clothes", "knit-a-scarf", "crochet-a-granny-square"],
            ["use-a-sewing-machine"],
            ["quilt-a-simple-block"]] },
  { id: "keeper", name: "Keeper", icon: "🧺", blurb: "A clean, calm, well-run home.",
    tiers: [["do-laundry-and-remove-stains", "clean-a-home-efficiently", "care-for-houseplants", "arrange-flowers"],
            ["declutter-and-organize-a-room", "compost-kitchen-scraps"]] },
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
  "know-two-cool-uncle-tricks": ["shuffle-cards"],
  "feed-and-burp-a-baby": ["change-a-diaper"],
  "plan-activities-for-kids": ["babysit-safely"],
  "host-a-dinner-party": ["cook-a-steak"],
  "freeze-and-store-food-properly": ["practise-kitchen-food-safety"],
  "make-soup-from-scratch": ["use-basic-knife-skills"],
  "can-food-safely-in-a-water-bath": ["freeze-and-store-food-properly"],
  "organize-a-community-event": ["make-small-talk"],
  "resolve-a-conflict-calmly": ["listen-actively"],
  "set-boundaries-and-say-no": ["listen-actively"],
  "comfort-someone-who-is-grieving": ["listen-actively"],
  "plan-a-wardrobe-on-a-budget": ["iron-your-clothes"],
  "build-an-emergency-fund": ["make-a-monthly-budget"],
  "understand-a-paycheck-and-taxes": ["make-a-monthly-budget"],
  "start-saving-for-retirement": ["build-an-emergency-fund"],
  "mend-and-hem-clothes": ["sew-a-button"],
  "use-a-sewing-machine": ["mend-and-hem-clothes"],
  "quilt-a-simple-block": ["use-a-sewing-machine"],
  "declutter-and-organize-a-room": ["clean-a-home-efficiently"]
};

// ---------- Interview options ----------

export const AGE_BANDS = [
  { id: "13-17", label: "13 to 17" }, { id: "18-24", label: "18 to 24" }, { id: "25-34", label: "25 to 34" },
  { id: "35-49", label: "35 to 49" }, { id: "50-64", label: "50 to 64" }, { id: "65+", label: "65 or older" }
];

export const LIFE_STAGES = [
  { id: "student", label: "Student", skills: ["read-a-book", "make-a-logical-argument", "give-a-speech", "speak-a-foreign-language", "cook-eggs", "sew-a-button", "iron-your-clothes", "make-small-talk", "swim-the-front-crawl", "entertain-yourself-without-a-smartphone", "make-a-monthly-budget", "practise-kitchen-food-safety", "do-laundry-and-remove-stains", "plan-a-week-of-meals", "manage-your-time-with-a-weekly-plan", "spot-and-avoid-scams", "compare-prices-and-unit-prices"] },
  { id: "starting-out", label: "First job or living on my own", skills: ["cook-eggs", "cook-a-signature-dish", "unclog-a-toilet", "fix-a-leaky-faucet", "hang-a-picture", "iron-your-clothes", "dress-for-the-occasion", "buy-a-suit", "shake-hands", "negotiate-haggle", "change-a-flat-tire", "jump-start-a-car", "perform-cpr", "make-a-monthly-budget", "build-an-emergency-fund", "understand-a-paycheck-and-taxes", "check-your-credit-report", "do-laundry-and-remove-stains", "clean-a-home-efficiently", "plan-a-week-of-meals", "practise-kitchen-food-safety", "start-saving-for-retirement", "spot-and-avoid-scams"] },
  { id: "single", label: "Single and dating", skills: ["ask-a-woman-on-a-date", "make-small-talk", "know-how-to-dance", "tell-a-joke", "cook-a-steak", "dress-for-the-occasion", "wet-shave"] },
  { id: "partnered", label: "In a relationship", skills: ["cook-a-signature-dish", "know-how-to-dance", "give-a-good-massage", "make-a-toast", "write-a-letter", "brew-the-perfect-cup-of-coffee", "host-a-dinner-party", "resolve-a-conflict-calmly", "listen-actively"] },
  { id: "new-parent", label: "Expecting or new parent", skills: ["change-a-diaper", "calm-a-crying-baby", "perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "practice-situational-awareness", "cook-eggs", "make-pancakes-from-scratch", "feed-and-burp-a-baby", "plan-a-week-of-meals", "freeze-and-store-food-properly", "prepare-an-emergency-kit-and-plan", "care-for-someone-who-is-sick"] },
  { id: "parent-kids", label: "Parent of school-age kids", skills: ["throw-a-spiral", "cast-a-fishing-line", "build-a-campfire", "know-two-cool-uncle-tricks", "tell-a-story", "make-pancakes-from-scratch", "treat-a-burn", "perform-cpr", "swim-the-front-crawl", "shuffle-cards", "read-a-book", "plan-activities-for-kids", "pack-a-healthy-lunch", "run-a-family-meeting", "prepare-an-emergency-kit-and-plan"] },
  { id: "homeowner", label: "Homeowner", skills: ["hammer-a-nail-correctly", "unclog-a-toilet", "fix-a-leaky-faucet", "hang-a-picture", "sharpen-a-knife", "grow-your-own-food", "shovel-snow", "split-firewood", "use-a-chainsaw-safely", "compost-kitchen-scraps", "clean-a-home-efficiently", "declutter-and-organize-a-room", "prepare-an-emergency-kit-and-plan", "care-for-houseplants"] },
  { id: "renter", label: "Renter", skills: ["unclog-a-toilet", "hang-a-picture", "sew-a-button", "sharpen-a-knife", "cook-a-signature-dish", "negotiate-haggle", "do-laundry-and-remove-stains", "clean-a-home-efficiently", "declutter-and-organize-a-room", "care-for-houseplants", "compare-prices-and-unit-prices"] },
  { id: "driver", label: "I drive regularly", skills: ["jump-start-a-car", "change-a-flat-tire", "parallel-park", "change-your-cars-oil", "drive-in-snow", "get-a-car-unstuck", "hitch-back-up-a-trailer"] },
  { id: "rural", label: "I live in the country", skills: ["split-firewood", "use-a-chainsaw-safely", "fell-a-tree", "drive-in-snow", "get-a-car-unstuck", "hitch-back-up-a-trailer", "shovel-snow", "find-potable-water", "identify-poisonous-edible-plants", "survive-a-bear-attack", "grow-your-own-food", "can-food-safely-in-a-water-bath", "freeze-and-store-food-properly", "bake-a-loaf-of-bread", "compost-kitchen-scraps", "prepare-an-emergency-kit-and-plan"] },
  { id: "caregiver", label: "Caring for a relative", skills: ["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "perform-the-firemans-carry", "practice-situational-awareness", "cook-a-signature-dish", "give-a-good-massage", "care-for-someone-who-is-sick", "help-someone-in-a-mental-health-crisis", "listen-actively", "comfort-someone-who-is-grieving", "set-boundaries-and-say-no", "plan-a-week-of-meals", "spot-and-avoid-scams"] },
  { id: "retired", label: "Retired", skills: ["grow-your-own-food", "write-a-letter", "read-a-book", "play-one-song-on-the-guitar", "speak-a-foreign-language", "take-the-perfect-photo", "tell-a-story", "perform-cpr", "know-how-to-dance", "cook-a-signature-dish", "knit-a-scarf", "crochet-a-granny-square", "quilt-a-simple-block", "sketch-what-you-see", "arrange-flowers", "keep-a-journal", "spot-and-avoid-scams", "stretch-and-build-flexibility"] }
];

export const GOALS = [
  { id: "emergencies", label: "Be ready for emergencies", skills: ["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "tie-a-tourniquet", "treat-frostbite", "treat-a-snakebite", "perform-the-firemans-carry", "practice-situational-awareness", "break-down-a-door", "jump-start-a-car", "change-a-flat-tire", "find-potable-water", "build-a-campfire", "make-fire-without-matches", "always-know-north", "navigate-with-map-and-compass", "get-a-car-unstuck", "drive-in-snow", "swim-the-front-crawl", "prepare-an-emergency-kit-and-plan", "help-someone-in-a-mental-health-crisis", "care-for-someone-who-is-sick"] },
  { id: "save-money", label: "Fix things myself and save money", skills: ["hammer-a-nail-correctly", "unclog-a-toilet", "fix-a-leaky-faucet", "hang-a-picture", "sew-a-button", "sharpen-a-knife", "change-your-cars-oil", "change-a-flat-tire", "jump-start-a-car", "cook-a-signature-dish", "grow-your-own-food", "negotiate-haggle", "brew-the-perfect-cup-of-coffee", "iron-your-clothes", "shovel-snow", "make-a-monthly-budget", "build-an-emergency-fund", "compare-prices-and-unit-prices", "plan-a-week-of-meals", "mend-and-hem-clothes", "freeze-and-store-food-properly", "plan-a-wardrobe-on-a-budget", "do-laundry-and-remove-stains", "spot-and-avoid-scams"] },
  { id: "outdoors", label: "Spend more time outdoors", skills: ["build-a-campfire", "find-potable-water", "always-know-north", "tie-a-bowline", "predict-the-weather", "make-fire-without-matches", "build-a-shelter", "navigate-with-map-and-compass", "identify-poisonous-edible-plants", "survive-a-bear-attack", "cast-a-fishing-line", "paddle-a-canoe", "ride-a-horse", "skipper-a-boat", "shoot-a-bow-and-arrow", "compost-kitchen-scraps", "walk-or-run-a-5k"] },
  { id: "fitness", label: "Get fit and strong", skills: ["do-a-proper-push-up", "do-a-squat-properly", "swim-the-front-crawl", "do-a-proper-pull-up", "do-a-deadlift-properly", "do-a-front-dive", "throw-a-knockout-punch", "paddle-a-canoe", "know-how-to-dance", "split-firewood", "stretch-and-build-flexibility", "walk-or-run-a-5k"] },
  { id: "cooking", label: "Cook and host better", skills: ["cook-eggs", "brew-the-perfect-cup-of-coffee", "cook-bacon", "make-pancakes-from-scratch", "cook-a-steak", "grill-with-charcoal", "fillet-a-fish", "carve-a-turkey", "cook-a-signature-dish", "mix-two-classic-cocktails", "properly-pour-beer", "make-a-toast", "plan-a-week-of-meals", "practise-kitchen-food-safety", "use-basic-knife-skills", "bake-a-loaf-of-bread", "make-soup-from-scratch", "bake-a-pie-from-scratch", "host-a-dinner-party", "freeze-and-store-food-properly", "can-food-safely-in-a-water-bath", "pack-a-healthy-lunch", "read-a-nutrition-label"] },
  { id: "social", label: "Feel confident with people", skills: ["shake-hands", "make-small-talk", "tell-a-joke", "tell-a-story", "know-how-to-dance", "make-a-toast", "give-a-speech", "dress-for-the-occasion", "ask-a-woman-on-a-date", "write-a-letter", "listen-actively", "introduce-people-to-each-other", "resolve-a-conflict-calmly", "set-boundaries-and-say-no", "host-a-dinner-party", "organize-a-community-event"] },
  { id: "career", label: "Grow my career", skills: ["give-a-speech", "negotiate-haggle", "make-a-logical-argument", "write-a-letter", "shake-hands", "make-small-talk", "dress-for-the-occasion", "buy-a-suit", "tie-a-necktie", "speak-a-foreign-language", "tell-a-story", "manage-your-time-with-a-weekly-plan", "listen-actively", "resolve-a-conflict-calmly", "understand-a-paycheck-and-taxes"] },
  { id: "family", label: "Take care of my family", skills: ["perform-cpr", "perform-the-heimlich-maneuver", "treat-a-burn", "change-a-diaper", "calm-a-crying-baby", "practice-situational-awareness", "cook-eggs", "make-pancakes-from-scratch", "tell-a-story", "read-a-book", "sew-a-button", "unclog-a-toilet", "jump-start-a-car", "babysit-safely", "feed-and-burp-a-baby", "plan-activities-for-kids", "care-for-someone-who-is-sick", "run-a-family-meeting", "prepare-an-emergency-kit-and-plan", "practise-kitchen-food-safety", "plan-a-week-of-meals", "pack-a-healthy-lunch", "comfort-someone-who-is-grieving"] },
  { id: "community", label: "Help on community projects", skills: ["give-a-speech", "write-a-letter", "make-a-logical-argument", "take-the-perfect-photo", "negotiate-haggle", "tell-a-story", "perform-cpr", "grow-your-own-food", "hammer-a-nail-correctly", "make-small-talk", "organize-a-community-event", "listen-actively", "help-someone-in-a-mental-health-crisis", "compost-kitchen-scraps", "introduce-people-to-each-other"] },
  { id: "mind", label: "Learn and create", skills: ["read-a-book", "write-in-cursive", "take-the-perfect-photo", "recite-a-poem-from-memory", "make-a-logical-argument", "play-one-song-on-the-guitar", "speak-a-foreign-language", "entertain-yourself-without-a-smartphone", "keep-a-journal", "sketch-what-you-see", "practise-mindful-breathing", "manage-your-time-with-a-weekly-plan"] },
  { id: "money", label: "Get on top of my money", skills: ["make-a-monthly-budget", "build-an-emergency-fund", "check-your-credit-report", "compare-prices-and-unit-prices", "understand-a-paycheck-and-taxes", "spot-and-avoid-scams", "start-saving-for-retirement", "plan-a-week-of-meals"] },
  { id: "wellbeing", label: "Look after my wellbeing", skills: ["practise-mindful-breathing", "keep-a-journal", "stretch-and-build-flexibility", "walk-or-run-a-5k", "build-a-simple-skin-care-routine", "set-boundaries-and-say-no", "entertain-yourself-without-a-smartphone", "read-a-book"] },
  { id: "make", label: "Make and mend things by hand", skills: ["mend-and-hem-clothes", "use-a-sewing-machine", "knit-a-scarf", "crochet-a-granny-square", "quilt-a-simple-block", "bake-a-loaf-of-bread", "sketch-what-you-see", "arrange-flowers", "sew-a-button", "hammer-a-nail-correctly"] },
  { id: "fun", label: "Have more fun", skills: ["shuffle-cards", "whistle-with-your-fingers", "throw-a-spiral", "play-poker", "know-two-cool-uncle-tricks", "break-a-rack-of-pool-balls", "tell-a-joke", "know-how-to-dance", "play-one-song-on-the-guitar", "cast-a-fishing-line", "grill-with-charcoal", "knit-a-scarf", "crochet-a-granny-square", "sketch-what-you-see", "arrange-flowers", "host-a-dinner-party", "quilt-a-simple-block"] }
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
  "13-17": ["read-a-book", "swim-the-front-crawl", "cook-eggs", "make-small-talk", "shake-hands", "give-a-speech", "sew-a-button", "perform-cpr", "babysit-safely", "plan-activities-for-kids", "make-a-monthly-budget", "listen-actively", "do-laundry-and-remove-stains"],
  "18-24": ["cook-eggs", "unclog-a-toilet", "change-a-flat-tire", "jump-start-a-car", "shake-hands", "dress-for-the-occasion", "negotiate-haggle", "perform-cpr", "make-a-monthly-budget", "build-an-emergency-fund", "do-laundry-and-remove-stains", "plan-a-week-of-meals", "check-your-credit-report", "understand-a-paycheck-and-taxes"],
  "25-34": ["cook-a-signature-dish", "negotiate-haggle", "fix-a-leaky-faucet", "perform-cpr", "start-saving-for-retirement", "build-an-emergency-fund"],
  "35-49": ["perform-cpr", "fix-a-leaky-faucet", "tell-a-story", "grow-your-own-food", "prepare-an-emergency-kit-and-plan", "start-saving-for-retirement"],
  "50-64": ["perform-cpr", "grow-your-own-food", "write-a-letter", "take-the-perfect-photo", "speak-a-foreign-language", "start-saving-for-retirement", "spot-and-avoid-scams"],
  "65+": ["perform-cpr", "grow-your-own-food", "write-a-letter", "take-the-perfect-photo", "tell-a-story", "play-one-song-on-the-guitar", "spot-and-avoid-scams", "stretch-and-build-flexibility"]
};
