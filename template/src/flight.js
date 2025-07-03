// flight.js
// This is an example file to show how to use mcf.

import mcf from './mcf.js';

// Let's put all the functions related to flight in a folder
const folder = mcf.flight;
// Declare and export the 'flightTick' function
export const { flightTick } = folder;
// Anonymous functions for inline logic
const { anonymous: a } = folder;

// Define the flightTick function's content
// The anonymous function declared by a`...` is going to be interpreted as "function {namespace}:..."
flightTick`
  execute as @a if score @s is_sneaking matches 1.. run ${a`
    scoreboard players reset @s is_sneaking
    effect give @s levitation 1 3
  `}
`;
