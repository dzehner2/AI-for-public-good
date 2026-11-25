// All Useful Skills courses. 1-100 follow the Art of Manliness list; 101-150 round out the set from
// established programs (each names its source in src and srcUrl).
import { PART1 } from "./part1.js";
import { PART2 } from "./part2.js";
import { PART3 } from "./part3.js";
import { PART4 } from "./part4.js";
import { PART5 } from "./part5.js";
import { PART6 } from "./part6.js";

export const SKILLS = [...PART1, ...PART2, ...PART3, ...PART4, ...PART5, ...PART6];

export const CATEGORIES = ["All", "Home", "Outdoors", "First aid", "Safety", "Fitness", "Food and drink", "People", "Mind", "Vehicles", "Style", "Family", "Play", "Money", "Craft"];

// Stakes that work for any skill. Each course adds its own two ideas first.
export const GENERIC_STAKES = [
  "Show you what I learned, in person or on a video call, by my date.",
  "If I miss my date, I buy you coffee or lunch.",
  "If I miss my date, I do a chore of your choice."
];
