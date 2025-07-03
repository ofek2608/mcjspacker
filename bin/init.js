#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function fixNamespace(str) {
  str = str.replace(/ /g, '_');
  str = str.replace(/(_|^)([A-Z])/g, match => match.toLowerCase());
  str = str.replace(/([A-Z])/g, match => '_' + match.toLowerCase());
  return str.match(/^[a-z0-9_-]+$/g) ? str : null;
}

const [,, dirArg, nameArg] = process.argv;

if (!dirArg) {
  console.error('Usage: npx mcjspacker <directory> [namespace]');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.join(__dirname, '../template');
const targetDir = path.resolve(process.cwd(), dirArg);

let namespace = nameArg || path.basename(targetDir);
namespace = fixNamespace(namespace);
if (!namespace) {
  console.error('Invalid namespace. Use only a-z, 0-9, _, or -');
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  const stat = fs.statSync(targetDir);
  if (!stat.isDirectory()) {
    console.error(`Path "${targetDir}" exists and is not a directory.`);
    process.exit(1);
  }
  const files = fs.readdirSync(targetDir);
  if (files.length > 0) {
    console.error(`Directory "${targetDir}" already exists and is not empty.`);
    process.exit(1);
  }
} else {
  fs.mkdirSync(targetDir, { recursive: true });
}

const replaceFileNames = {
  'gitignore': '.gitignore',
};

function copyAndReplace(src, dest, replacements) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      const newFile = replaceFileNames[file] || file;
      copyAndReplace(path.join(src, file), path.join(dest, newFile), replacements);
    }
  } else {
    let content = fs.readFileSync(src, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replaceAll(key, value);
    }
    fs.writeFileSync(dest, content);
  }
}

const mainPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
copyAndReplace(templateDir, targetDir, {
  '{namespace}': namespace,
  '{version}': mainPkg.version
});

const targetDirStr = JSON.stringify(targetDir);
console.log(`Datapack created in ${targetDirStr}`);
console.log('Run:');
console.log(`  cd ${targetDirStr}`);
console.log('  npm install');
console.log('  npm run build'); 