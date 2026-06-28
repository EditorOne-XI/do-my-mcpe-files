import AdmZip from 'adm-zip';
import { unlinkSync } from 'fs';
import { basename, resolve } from 'path';
import { SIGNZQIB } from './global_variables.js';

const { argv } = process;
if (!argv[2] || argv[2].length === 0) {
  console.error("[Signature] Need at least 1 argument.");
  process.exit(1);
}
const filePath = argv[2];
const fileName = basename(filePath);

try {
  const realpath = resolve(filePath);
  const zip = new AdmZip(realpath);
  zip.addZipComment(SIGNZQIB);
  zip.writeZip(realpath, (error) => {
    zip = null;
    if (error) {
      console.error(`[Signature] Failed to write signature for ${fileName}. Removing the archive.`);
      if (existsSync(realpath)) unlinkSync(realpath);
      process.exit(1);
    }
  });
} catch (err) {
  console.error("[Signature] Failed to parse file: " + err.message);
  process.exit(1);
}
