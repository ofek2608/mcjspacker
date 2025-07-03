import mcf from './mcf.js';

// defining functions called a and b
const funcA = mcf.a`say hello`;
const funcB = mcf.b`say world`;

// defining a function called test that calls funcA and funcB
mcf.test`
${funcA}
${funcB}
`;

// defining an anonymous function
const anonymous = mcf`
say hello from anonymous function
`

// inline anonymous function
mcf.example_inline_anonymous`
execute as @a[tag=test] run ${mcf`
  say hello from inner function
`}
say hello from outer function
`

// minecraft macro in javascript template XD

mcf.example_macro`
${mcf`
  $say $(message)
`} with {message: 'hello'}
`

// example of generating code dynamically

const items = [
  {
    name: 'platform',
    model: 'redstone_block',
  },
  {
    name: 'slime_block',
    model: 'slime_block',
  }
];

let book = '';
for (const item of items) {
  book += `
  give @s itemframe{item_name:'${item.name}',model:'${item.model}'}
  `
}
mcf.book`
${book}
`

const rec = mcf.recursive;
rec`
scoreboard players add @s example 1
say hello
execute if score @s example matches ..10 run ${rec}
`

mcf.recursive2`
scoreboard players add @s example 1
say hello
execute if score @s example matches ..10 run ${mcf.recursive2}
`

mcf.wow.testAnonymous2`
${mcf.wow.anonymous`
  say hello from anonymous function
`}
`

mcf`
say testing anonymous functions from different sources 1
`

mcf.anonymous`
say testing anonymous functions from different sources 2
`

mcf.a.anonymous`
say testing a.anonymous functions from different sources 1
`
mcf.a.anonymous`
say testing a.anonymous functions from different sources 2
`