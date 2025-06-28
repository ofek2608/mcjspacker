import { parentPort } from 'worker_threads';

let nextFunctionId = 0;

export function createMCF({outputDir, functionCallPrefix}) {
  parentPort.postMessage({ type: 'requestDir', path: outputDir });

  return (strings, ...values) => {
    const id = nextFunctionId++;
    const parts = [];
    function addStringPart(str) {
      if (parts.length > 0 && typeof parts[parts.length - 1] === 'string') {
        parts[parts.length - 1] += str;
      } else {
        parts.push(str);
      }
    }

    for (let i = 0; i < strings.length; i++) {
      addStringPart(strings[i]);
      if (i < values.length) {
        const value = values[i];
        if (typeof value === 'object' && value !== null && typeof value._id === 'number') {
          parts.push(value._id);
        } else {
          addStringPart(`${value}`);
        }
      }
    }
    parentPort.postMessage({ type: 'newFunction', dir: outputDir, prefix: functionCallPrefix, parts });
    return {
      _id: id,
      name: (newName) => {
        parentPort.postMessage({ type: 'functionName', id, name: newName });
      }
    };
  }
} 