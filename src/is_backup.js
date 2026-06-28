import AdmZip from 'adm-zip';
import { existsSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EINVAL, ENOENT, SETBUILD, SIGNZQIB } from './global_variables.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
  * @param {string} mainFile 
  */
export function backupFile_setup(mainFile) {
  /** @type {AdmZip} */
  let zip;
  const fileName = basename(mainFile);

  try {
    zip = new AdmZip(mainFile);
  } catch (err) {
    console.log("[BackupFile] AdmZip Error: " + err.message);
    return EINVAL;
  }

  const getBuffer = Buffer.from(zip.getZipComment(), 'utf8');
  if (Buffer.compare(getBuffer, SIGNZQIB) !== 0) {
    console.error(`[BackupFile] File '${fileName}' is not a valid Archive.`);
    zip = null;
    return false;
  }

  const targetDir = join(__dirname, SETBUILD);
  try {
    mkdirSync(targetDir, { recursive: true });
    if (!existsSync(targetDir)) return ENOENT;
    zip.extractAllTo(targetDir, true);
    console.log(`[BackupFile] Successfully extracted ${fileName}!`);
    return true;
  } catch (err) {
    console.error(`[BackupFile] Failed to write contents of ${fileName}`);
    zip = null;
    return ENOENT;
  } finally {
    zip = null;
  }
}

// console.log(backupFile_setup(process.argv[2]));
