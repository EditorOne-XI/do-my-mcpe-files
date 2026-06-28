import AdmZip from 'adm-zip';
import { existsSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EINVAL, ENOENT, SETBUILD } from './global_variables.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORLDNBT = [
  "FlatWorldLayers", "Generator", "LevelName", "StorageVersion"
];

/**
 * @param {AdmZip.IZipEntry} entry
 */
function nbtWorldLevelName(entry) {
    const buf = entry.getData();
    const tag = "LevelName";
    
    const index = buf.indexOf(tag);
    if (index === -1) return null;

    const byteOffset = index + tag.length;
    if (byteOffset + 2 > buf.length) return null;

    // Minecraft Bedrock uses Little Endian
    const strlen = buf.readUInt16LE(byteOffset); 
    const stringStart = byteOffset + 2;
    const stringEnd = stringStart + strlen;

    if (stringEnd > buf.length) return null;
    const worldName = buf.toString('utf8', stringStart, stringEnd);
    return worldName.replace(/[\x00-\x1F\x7F]/g, "").replace(/[\/\\:*?"<>|]/g, "_").trim();
}

/**
  * @param {string} mainFile 
  */
export function worldPack_setup(mainFile) {
  /** @type {AdmZip} */
  let zip;
  const fileName = basename(mainFile);

  try {
    zip = new AdmZip(mainFile);
  } catch (err) {
    console.error("[WorldPack] AdmZip Error: " + err.message);
    return EINVAL;
  }

  const levelDat = zip.getEntry("level.dat");
  if (!levelDat) {
    console.error(`[WorldPack] File '${fileName}' not a Minecraft world level data.`);
    zip = null;
    return EINVAL;
  }

  const nbtData = levelDat.getData().toString('binary');
  if (!WORLDNBT.every(tag => nbtData.includes(tag))) {
    console.error(`[WorldPack] File '${fileName}' level.dat does not have a valid world level data.`);
    zip = null;
    return false;
  }

  const worldName = nbtWorldLevelName(levelDat) || fileName;
  console.log(`[WorldPack] Confirmed '${worldName}' a Minecraft world pack!`);

  const targetDir = join(__dirname, SETBUILD, "minecraftWorlds", worldName.replace(/\s+/g, ''));

  try {
    mkdirSync(targetDir, { recursive: true });
    if (!existsSync(targetDir)) throw new Error(`Directory for ${targetDir} does not exist.`);
    zip.extractAllTo(targetDir, true);
    console.log(`[WorldPack] Successfully extracted ${worldName}!`);
    return true;
  } catch (err) {
    console.error(`[WorldPack] Failed to write '${fileName}': ${err.message}`);
    zip = null;
    return ENOENT;
  } finally {
    zip = null;
  }
}

// console.log("Result: ", worldPack_setup(args[1]));
