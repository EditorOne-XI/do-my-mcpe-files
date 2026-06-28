import AdmZip from "adm-zip";
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { singlePack_setup } from './is_pack_single.js';

const args = process.argv.slice(2);
const cmdName = basename(process.argv[1]);

if (args.length < 1) {
  console.error(`${cmdName}: Usage: ${cmdName} <FILE.mcaddon>`);
  process.exit(2);
}

const __dirname = fileURLToPath(import.meta.url);
const TEMP_ZIPSORT = "../ubuild";

/**
  * @param {AdmZip.IZipEntry[]} entries 
  * @param {string} zipPath 
  */
async function checkoutDir(entries, zipPath) {
  const entriesToCheckout = entries.filter((e) => {
    e.entryName.startsWith(zipPath)
  });
  return new Promise((resolve) => {
    let tempPath = __dirname;
    try {
      for (const fe of entriesToCheckout) {
        if (fe.isDirectory) {
          tempPath = join(__dirname, TEMP_ZIPSORT, fe.entryName);
          mkdirSync(tempPath, { recursive: true });
        }
        else {
          tempPath = join(__dirname, TEMP_ZIPSORT, fe.entryName);
          mkdirSync(dirname(tempPath), { recursive: true });
          if (!existsSync(dirname(tempPath))) {
            console.error("[SCRIPT:mcaddon] checkoutDir: Failed to make directory.");
            return resolve(false);
          }
          writeFileSync(tempPath, fe.getData());
        }
      }
      console.log("[SCRIPT:mcaddon] checkoutDir: Extracted " + zipPath + " from zip file.");
      return resolve(true);
    } catch (err) {
      console.error("[SCRIPT:mcaddon] checkoutDir: " + err.message);
      return resolve(false);
    }
  });
}

/**
  * @param {string | AdmZip} data 
  * @param {string} [parentPath] 
  */
async function recurseEntries(data, parentPath) {
  const zip = new AdmZip(data);
  const entries = zip.getEntries();
  let tempEntry = '';
  for (const entry of entries) {
    if (entry.isDirectory) continue;

    tempEntry = entry.entryName;
    if (tempEntry.endsWith('.zip') || tempEntry.endsWith('.mcpack')) {
      const childPath = parentPath ? `${parentPath}/${entry.entryName}` : entry.entryName;
      await recurseEntries(entry.getData(), childPath);
    }

    if (tempEntry.endsWith('manifest.json')) {
      // const isPack = await singlePack_setup({
      //   name: entry.name,
      //   entryName: entry.entryName,
      //   data: entry.getData()
      // });
      // if (!isPack) continue;
      await checkoutDir(entries, dirname(entry.entryName));
    }
  }
}

(async () => {
  const isBundle = await recurseEntries(args[0]);
  if (isBundle) {
    console.error(`[SCRIPT:mcaddon] Not a minecraft addon.`);
    process.exit(1);
  }
  process.exit(0);
})();
// if (!recurseEntries(args[2])) {
//   
// }
