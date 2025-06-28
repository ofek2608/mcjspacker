import mcf from './mcf.js';
import { sayFunc } from './test.js';


const test = mcf`say Hello from datapack!`;
test.name('test');
mcf`execute as @a run ${sayFunc('Hello from another file!')}`.name('example/in/folder');
mcf`
execute as @a run ${test}
execute as @a run ${test}
execute as @a run ${test}
execute as @a run ${test}
`;

