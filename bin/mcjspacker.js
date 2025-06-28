#!/usr/bin/env node
import chokidar from 'chokidar';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { pathToFileURL } from 'url';
import { Worker } from 'worker_threads';
import fs from 'fs/promises';

let currentWorker = null;
let lastFiles = [];
let buildInProgress = false;
let pendingBuild = false;

function collectFromWorker(worker) {
  const requiredDirectories = [];
  const functionDefinitions = [];
  worker.on('message', (msg) => {
    if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'requestDir':
        if (typeof msg.path !== 'string') return;
        requiredDirectories.push(msg.path);
        break;
      case 'newFunction':
        if (typeof msg.dir !== 'string' || typeof msg.prefix !== 'string' || !Array.isArray(msg.parts)) return;
        for (const part of msg.parts) {
          if (typeof part !== 'string' && typeof part !== 'number') return;
        }
        functionDefinitions.push({ dir: msg.dir, prefix: msg.prefix, parts: msg.parts, names: [] });
        break;
      case 'functionName':
        if (typeof msg.id !== 'number' || typeof msg.name !== 'string') return;
        const functionIndex = Math.floor(msg.id);
        if (functionIndex < 0 || functionIndex >= functionDefinitions.length) return;
        functionDefinitions[functionIndex].names.push(msg.name);
        break;
    }
  });

  return async () => {
    let nextAnonymousFunctionIndex = 0;
    for (const def of functionDefinitions) {
      if (def.names.length === 0) {
        def.names.push(`anonymous/anonymous_${nextAnonymousFunctionIndex++}`);
      }
      def.call = `${def.prefix}${def.names[0]}`;
    }

    const promises = [];
    const files = [];
    for (const def of functionDefinitions) {
      const content = def.parts
        .map(part => typeof part === 'number' && 0 <= part && part < functionDefinitions.length ? functionDefinitions[part].call : part)
        .join('')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
      for (const name of def.names) {
        const filePath = path.normalize(path.join(def.dir, `${name}.mcfunction`));
        const normalizedDir = path.normalize(def.dir + '/');
        if (!filePath.startsWith(normalizedDir)) {
          console.log(`Skipping ${filePath} because it's not in ${normalizedDir}`);
          continue;
        }
        promises.push((async () => {
          try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content);
          } catch (err) {
            console.error(`Error writing ${filePath}:`, err);
          }
        })());
        files.push(filePath);
      }
    }
    await Promise.all(promises);

    return files;
  };
}

function build(entryPath) {
  if (buildInProgress) {
    pendingBuild = true;
    return;
  }
  buildInProgress = true;
  if (currentWorker) {
    currentWorker.terminate();
  }
  
  currentWorker = new Worker(pathToFileURL(entryPath));
  const createFunctions = collectFromWorker(currentWorker);
  
  
  currentWorker.on('error', (err) => console.error('Error while building:', err));
  currentWorker.on('exit', async (code) => {
    if (code !== 0) {
      console.error(`Failed to build with exit code ${code}`);
    } else {
      await Promise.all(lastFiles.map(file => fs.rm(file)));
      lastFiles = await createFunctions();
    }
    buildInProgress = false;
    if (pendingBuild) {
      pendingBuild = false;
      build(entryPath);
    }
  });
}


const parser = yargs(hideBin(process.argv))
  .scriptName('mcjspacker')
  .usage('Usage: $0 <entry> [--watch <watchdir>]')
  .command(
    '$0 <entry>',
    'Build or watch a Minecraft datapack',
    (yargs) => yargs
      .positional('entry', {
        describe: 'Main datapack entry file',
        type: 'string',
      })
      .option('watch', {
        type: 'string',
        describe: 'Directory to watch for changes (enables watch mode)',
      }),
    async (argv) => {
      if (argv.help) {
        parser.showHelp();
        process.exit(0);
      }
      const absEntry = path.resolve(process.cwd(), argv.entry);
      if (argv.watch) {
        const watchDir = path.resolve(process.cwd(), argv.watch);
        console.log(`Watching for changes in ${watchDir}...`);
        chokidar.watch(watchDir, {ignoreInitial: true}).on('all', async (event, filePath) => {
          console.log(`Change detected (${event}: ${filePath}), rebuilding...`);
          try {
            build(absEntry);
          } catch (err) {
            console.error('Build failed:', err);
          }
        });
        // Initial build
        try {
          build(absEntry);
        } catch (err) {
          console.error('Build failed:', err);
        }
      } else {
        build(absEntry);
      }
    }
  )
  .option('help', {
    alias: 'h',
    type: 'boolean',
    describe: 'Show help',
    global: false
  })
  .check(argv => {
    if (argv.version || argv.help) return true;
    if (!argv.entry) throw new Error('You must specify an entry');
    return true;
  })
  .help();

parser.argv; 