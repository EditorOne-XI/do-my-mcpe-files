import AdmZip from 'adm-zip';
import { existsSync, mkdirSync } from "fs";
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EINVAL, ENOENT, SETBUILD } from './global_variables.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
  * @param {string} mainFile 
  */
export function screenshotsPack_setup(mainFile) {
  /** @type {AdmZip} */
  let zip;
  /** @type {AdmZip.IZipEntry[]} */
  let entries;
  const fileName = basename(mainFile);

  try {
    zip = new AdmZip(mainFile);
    entries = zip.getEntries();
  } catch (err) {
    console.error(`[ScreenshotsPack] AdmZip Error: ${err.message}`);
    zip = entries = null;
    return EINVAL;
  }
  const SSP_FORMAT = /^[0-9]+\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\.(json|mc|jpeg)$/;

  /** @type {Map<string, string[]>} */
  const uuidMap = new Map();
  let totalGet = 0;
  let isValid = false;

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    if (SSP_FORMAT.test(entry.entryName)) {
      console.log(`[ScreenshotsPack] Checkdng ${entry.entryName} ...`);
      /** @type {RegExpMatchArray} */
      const [path, _, ext] = entry.entryName.match(SSP_FORMAT);
      const uuid = path.replace(ext, '');
      if (!uuidMap.has(uuid)) {
        uuidMap.set(uuid, [path]);
        continue;
      }
      const getPaths = uuidMap.get(uuid);
      if (!getPaths.some(p => path === p))
        getPaths.push(path);
      if (getPaths.length === 3) {
        console.log(`[ScreenshotsPack] Confirmed '${uuid}' as a valid Minecraft screenshot.`);
        totalGet++;
        isValid = true;
      }
    }
  }
  if (!isValid) {
    console.error(`[ScreenshotsPack] File '${fileName}' not a valid screenshots pack.`);
    zip = entries = null;
    return false;
  }

  const targetDir = join(__dirname, SETBUILD, "Screenshots");
  try {
    mkdirSync(targetDir, { recursive: true });
    if (!existsSync(targetDir)) throw new Error(`Directory for ${targetDir} does not exist.`);
    console.log(`[ScreenshotsPack] Extracting ${totalGet} screenshots.`);
    uuidMap.forEach((paths) => {
      if (paths.length >= 3)
        paths.forEach(p => zip.extractEntryTo(p, targetDir));
    });
    console.log(`[ScreenshotsPack] Successfully extracted ${fileName}!`);
    return true;
  } catch (err) {
    console.error(`[ScreenshotsPack] Failed to write '${fileName}': ${err.message}`);
    zip = entries = null;
    return ENOENT;
  } finally {
    zip = entries = null;
  }
}

// console.log("Return Value: ", screenshotsPack_setup(process.argv[2]));
