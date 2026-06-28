import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EINVAL, ENOENT, SETBUILD } from './global_variables.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import console from 'console';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
  * @param {string} mainFile 
  */
export function mcOption_setup(mainFile) {
  const fileName = basename(mainFile);
  const fileContent = readFileSync(mainFile, { encoding: 'utf8' });
  if (fileName !== "options.txt" || !fileContent || fileContent.length == 0) {
    console.error(`[OptionFile] File is not a valid register.`);
    return EINVAL;
  }
  const optionMap = /^[^:]+:/;
  if (!fileContent.split('\n')
    .filter(line => line.length > 0)
    .every(line => optionMap.test(line))
  ) {
    console.error(`[OptionFile] File is not a valid option format.`);
    return false;
  }

  const targetPath = join(__dirname, SETBUILD, "minecraftpe", fileName);
  const targetDir = dirname(targetPath);
  try {
    mkdirSync(targetDir, { recursive: true });
    if (!existsSync(targetDir)) return ENOENT;
    writeFileSync(targetPath, fileContent);
    console.log("[OptionFile] Successfully added options.txt to the build!");
    return true;
  } catch (err) {
    console.error(`[OptionFile] Failed to write 'option.txt'. Stopped.`);
    return ENOENT;
  }
}

// console.log("Result:", mcOption_setup(process.argv[2]));
