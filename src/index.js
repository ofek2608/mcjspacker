import fs from 'fs/promises';
import path from 'path';

async function deleteDirectory(dir) {
  if (await fs.exists(dir)) {
    await fs.rmdir(dir, { recursive: true });
  }
}

async function saveFile(outputDir, functionName, content) {
  const filePath = path.normalize(path.join(outputDir, functionName));
  const normalizedDir = path.normalize(outputDir + '/');
  if (!filePath.startsWith(normalizedDir)) {
    console.error(`Invalid function name: ${functionName}`);
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function cleanFunctionContent(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

export function createMCF({outputDir, functionCallPrefix}) {
  const deleteDirectoryPromise = deleteDirectory(outputDir);
  let anonymousFunctionId = 0;

  return (arg0, arg1) => {
    const functionContent = arg1 === undefined ? arg0 : arg1;
    const functionName = arg1 === undefined ? `anonymous/anonymous_${anonymousFunctionId++}` : arg0;

    deleteDirectoryPromise.then(() => saveFile(outputDir, functionName, cleanFunctionContent(functionContent)));

    return `${functionCallPrefix}${functionName}`
  }
}
