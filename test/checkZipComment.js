import AdmZip from 'adm-zip';
// import {  } from 'fs';
import { basename } from 'path';

try {
  const arg = process.argv[2];
  if (!arg) throw new Error("Script needs 1 argument.");
  const zip = new AdmZip(arg);
  const comment = zip.getZipComment();
  console.log(`${basename(arg)} ZIP Comment:
${comment}
${typeof comment}

${Buffer.from(comment, 'utf8')}`);
  process.exit(0);
} catch (err) {
  console.error("Failed to parse ZIP: " + err.message);
  process.exit(1);
}
