# mcjspacker

A modern JavaScript-based generator for Minecraft datapack functions. Write Minecraft functions using template literals and JavaScript logic, and output them as `.mcfunction` files for your datapack. Perfect for automating repetitive tasks, generating dynamic content, and keeping your Minecraft projects DRY and maintainable.

## Features
- Write Minecraft functions using JavaScript template literals
- Supports named and anonymous functions
- Output to any directory, ready for use in datapacks
- Compose functions, use variables, and generate code dynamically
- Simple, intuitive API

## Quick Setup

### Prerequisites
- Node.js v16 or newer

### Create a New Project

You can quickly scaffold a new project using `npx`:

```sh
npx mcjspacker <directory> [namespace]
cd <directory>
npm install
```

- `<directory>`: The directory to create (relative or absolute path). If it exists and is not empty, the command will abort.
- `[namespace]` (optional): The namespace to use for the datapack. If omitted, the directory name is used (normalized).

> [!NOTE]  
> This will create a new directory `<directory>` with example files and all dependencies installed.

> [!TIP]
> It's recommended to pick `<directory>` as a directory in your world's datapacks directory. for example: `%APPDATA%/.minecraft/saves/TestingWorld/datapacks/mypack`

### Run the Project

To generate your datapack files, use the following commands:

```sh
npm run build
```
This will run your main script (default to `src/index.js`) and generate the Minecraft function files in the appropriate output directory (e.g., `data/<namespace>/function`).

```sh
npm run watch
```
This will watch your `src/` directory for changes and automatically rebuild your datapack whenever you save a file. This is useful for rapid development and iteration.

After running either command, you should see generated files in the `data/` directory, ready to be used as a Minecraft datapack.

## Documentation

### API

#### **Create context:** ``createMCF({ outputDir, functionCallPrefix })``
Initializes the generator.
  - `outputDir` (string): Output directory for generated files.
  - `functionCallPrefix` (string): Prefix for function calls (e.g., 'mydatapack:').

> [!WARNING]  
> Calling this function will delete the directory `outputDir` and all its contents.

> [!WARNING]
> Do not call this function twice with related `outputDir` as it will override eachother.

#### **Named function:** ``mcf.functionName`...` ``
- `{outputDir}/function_name.mcfunction`.

#### **Subfolders:** ``mcf.folder.functionName`...` ``
- `{outputDir}/folder/function_name.mcfunction`.

#### **Anonymous function:** ``mcf`...` ``
- `{outputDir}/anonymous/anonymous_{i}.mcfunction`

#### **Anonymous function in a folder:** ``mcf.folder.anonymous`...` ``
- `{outputDir}/folder/anonymous/anonymous_{i}.mcfunction`

#### **``mcf[dynamicName]`...` ``**
Use dynamic names for functions or folders.

#### **Function call:** `` `${mcf.funcName}` `` or `'' + mcf.funcName`
- Converts it into a function call string `'function {functionCallPrefix}func_name'`.
> [!TIP]
> mcjspacker will insert `:` or `/` after `functionCallPrefix` if needed

### Recommended Usage Style

```js
// ===== mcf.js =====

import { createMCF } from 'mcjspacker';

// if you want to have all functions generated
export const mcf = createMCF({
  outputDir: 'data/mynamespace/function',
  functionCallPrefix: 'mynamespace'
});

// if you want to have the generated functions in a folder
// ⚠️ do NOT call createMCF() with related folders as they will override eachother
export const mcfInAFolder = createMCF({
  outputDir: 'data/mynamespace/function/generated',
  functionCallPrefix: 'mynamespace:generated'
});



// ===== playerKit.js =====

import mcf from "./mcf.js";
const directory = mcf.playerKit;
// declare public functions
export const { giveStarterKit , giveAdvancedKit } = directory;
// declare private functions
const { equipArmor, anonymous: a } = directory;

/*
 * declaring the functions help you refer to them in other functions
 * and being free to order them as you want.
 * 
 * It also automatically names the functions because:
 *   export const {foo, bar} = mcf.dir;
 * is equvalent to:
 *   export const foo = mcf.dir.foo;
 *   export const bar = mcf.dir.bar;
 * 
 */

giveStarterKit`
  ${equipArmor}
  give @s wooden_sword
`;

const xpForGoldApple = 100;
giveAdvancedKit`
  ${equipArmor}
  give @s iron_sword
  execute if score @s experience matches ${xpForGoldApple}.. run ${a`
    give @s golden_apple
  `}
`;

equipArmor`
  item replace entity @s armor.chest with leather_chestplate
  item replace entity @s armor.legs with leather_leggings
  item replace entity @s armor.feet with leather_boots
  item replace entity @s armor.head with leather_helmet
`;

// if you prefer, you can also define something like
const equip = (slot, item) => `item replace entity @s armor.${slot} with ${item}`;
a`
  ${equip('chest', 'leather_chestplate')}
  ${equip('legs', 'leather_leggings')}
  ${equip('feet', 'leather_boots')}
  ${equip('head', 'leather_helmet')}
`;
```

### Dynamic Function Names

```js
const players = ['Steve', 'Alex'];
for (const player of players) {
  mcf[`greet_${player.toLowerCase()}`]`
    say Hello, ${player}!
  `;
}
```


### Advanced: Recursive Functions

```js
const {rec} = mcf.folder;
rec`
  scoreboard players add @s example 1
  say hello
  execute if score @s example matches ..10 run ${rec}
`;
```

### Advanced: Generating Multiple Functions Programmatically

```js
const items = [
  { name: 'platform', model: 'redstone_block' },
  { name: 'slime_block', model: 'slime_block' }
];

// for each item define 'give @s ...'
const functions = items.map(({ name, model }) => mcf[`give_${name}`]`
  give @s item_frame{item_name:'${name}',model:'${model}'}
`);

// call all of the functions
mcf.giveAll`
  ${functions.join('\n')}
`;
```

## Contributing

Contributions are welcome! Please open issues or pull requests for bugs, features, or questions.

## License

MIT

