// mcf.js
// This file sets up your datapack context using mcjspacker.
// You can create multiple contexts for different data/namespace/function if needed.
// You can also decide to have the generated functions in a folder
// (add a subfolder to the outputDir and functionCallPrefix)

import { createMCF } from 'mcjspacker';

// simplest way to create a mcf context
const mcf = createMCF({
  outputDir: 'data/{namespace}/function',
  functionCallPrefix: '{namespace}'
});

export default mcf; 