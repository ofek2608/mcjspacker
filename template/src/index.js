// index.js
// This is the main entry point for your datapack generation.
// Import your mcf context and any functions you want to use.

import mcf from './mcf.js';
import { flightTick } from './flight.js';

// Declare the functions you want to use
const { tick, load } = mcf;

const ns = '{namespace}';

// Register the flightTick function to run every tick
tick`
  ${flightTick}
`;

// Register a load function to set up objectives and greet players
load`
  scoreboard objectives add is_sneaking minecraft.custom:sneak_time
  tellraw @a [{text:"Hello World from ",color:"green"},{text:"${ns}",color:"dark_aqua"}]
`;