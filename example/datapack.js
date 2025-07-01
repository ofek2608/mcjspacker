import mcf from './mcf.js';
import { sayFunc } from './test.js';


const test = mcf(`say Hello from datapack!`);
test.name('test');
mcf('example/in/folder',`execute as @a run ${sayFunc('Hello from another file!')}`);
mcf(`
execute as @a run ${test}
execute as @a run ${test}
execute as @a run ${test}
execute as @a run ${test}
`);

