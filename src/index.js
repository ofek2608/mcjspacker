import fs from 'fs/promises';
import path from 'path';

async function deleteDirectory(dir) {
  try {
    await fs.rm(dir, { recursive: true });
  } catch {}
}

async function saveFile(outputDir, functionName, content) {
  const filePath = path.normalize(path.join(outputDir, `${functionName}.mcfunction`));
  const normalizedDir = path.normalize(outputDir + '/');
  if (!filePath.startsWith(normalizedDir)) {
    console.error(`Invalid function name: ${functionName}`);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function combinePaths(path1, path2) {
  return `${path1}/${path2}`.replaceAll(/[:/]+/g, '/').replaceAll(/^\/|\/$/g, '');
}

function getFunctionContent(strings, ...values) {
  let functionContent;
  if (Array.isArray(strings)) {
    functionContent = `${strings[0]}`;
    for (let i = 0; i < values.length; i++) {
      functionContent += values[i];
      functionContent += strings[i + 1];
    }
  } else if (typeof strings === 'string') {
    functionContent = strings;
  } else {
    throw new Error('Invalid function content');
  }
  return functionContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

function isValidPathPart(part) {
  return part.match(/^[a-z0-9/:_-]+$/g);
}

function toSnakeCase(str) {
  return str.replace(/ /g, '_')
    .replace(/(_|^)([A-Z])/g, match => match.toLowerCase())
    .replace(/([A-Z])/g, match => '_' + match.toLowerCase());
}

export function createMCF({outputDir, functionCallPrefix}) {
  const deleteDirectoryPromise = deleteDirectory(outputDir);

  const nextAnonymousIds = {};

  function createAnonymousContext(functionPath) {
    if (functionPath === '') {
      functionPath = 'anonymous';
    }
    let id = nextAnonymousIds[functionPath] = (nextAnonymousIds[functionPath] || 0) + 1;
    return createContext(`${functionPath}/anonymous_${id}`);
  }

  function createContext(functionPath) {
    // replacing only the first / to :
    const createsAnonymousFunctions = functionPath === '' || functionPath === 'anonymous' || functionPath.endsWith('/anonymous');
    const asString = createsAnonymousFunctions ?
      '[ERR anonymous function]' :
      `function ${combinePaths(functionCallPrefix, functionPath).replace('/', ':')}`;
    

    function get(_target, prop) {
      if (prop === Symbol.toStringTag || prop === Symbol.toPrimitive) {
        return () => asString;
      }
      if (typeof prop === 'symbol') {
        return Reflect.get(_target, prop);
      }
      prop = toSnakeCase(`${prop}`);
      if (!isValidPathPart(prop)) {
        throw new Error(`Invalid path: '${prop}'`);
      }
      return createContext(combinePaths(functionPath, prop));
    }

    function set(_target) {
      return false;
    }

    function target(...args) {
      if (createsAnonymousFunctions) {
        return createAnonymousContext(functionPath)(...args);
      }
      const functionContent = getFunctionContent(...args);

      deleteDirectoryPromise.then(() => saveFile(outputDir, functionPath, functionContent));

      return proxy;
    }

    const proxy = new Proxy(target, {get, set});
    return proxy;
  }
  
  return createContext('');
}
