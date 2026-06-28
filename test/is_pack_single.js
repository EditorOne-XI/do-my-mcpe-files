import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ENOENT, EOPRTRCRSV, MCBUILD } from './global_variables.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUILD_DIR = join(__dirname, MCBUILD);

const { argv } = process;
const args = argv.slice(1);

if (args.length < 2) {
  const cmdName = basename(args[0]);
  console.log(`${cmdName}: Usage: ${cmdName} <FILE>`);
  process.exit(2);
}
// const mainFile = args[1];
const isManifestReadOnly = args[2] || false;
const recurseScript = join(__dirname, './recurse_zip.sh');

/**
  * @param {{ name: string, uuid: string, version: Array | string }} headerJSON
  */
function headerCheck(headerJSON) {
  if (
    !headerJSON.name ||
    !headerJSON.uuid ||
    !headerJSON.version
  ) return false;
  return true;
}

/**
  * @param {string} mainFile
  * @returns {EOPRTRCRSV | Promise<boolean>}
  */
export async function singlePack_setup(mainFile) {
  /** @type {AdmZip} */
  let zip;
  /** @type {AdmZip.IZipEntry} */
  let manifestFile;
  const fileName = basename(mainFile);

  try {
    zip = new AdmZip(mainFile);
    manifestFile = zip.getEntry('manifest.json');
  } catch (err) {
    console.error(`[SCRIPT] Failed to read zip structure for ${fileName}: ${err.message}`);
    return EOPRTRCRSV;
  }
  if (!manifestFile) {
    console.error(`[SCRIPT] File ${fileName} does not have manifest file at root. Triggering recursion.`);
    return EOPRTRCRSV;
  }
  console.log(`[SCRIPT] singlePack_setup: ${mainFile}`);

  const root = JSON.parse(manifestFile.getData().toString('utf8'));
  const fv = root.format_version;
  const headerBlock = root.header;
  const modulesBlock = root.modules;
  if (!fv || !Array.isArray(modulesBlock) || !headerBlock) {
    console.error(`[SCRIPT] Manifest of ${fileName} does not have Mineraft Bedrock manifest format.`);
    return false;
  }

  if (!modulesBlock[0].uuid) return false;
  const modPackType = modulesBlock[0].type;
  let PACK_DIR, LOG_ID, PACK_TYPE, PACK_NAME;
  if (/^(data|script)$/.test(modPackType)) {
    PACK_DIR = 'behavior_packs';
    PACK_TYPE = 'behavior/script';
    LOG_ID = '[BP]';
  } else if (/^(resources)$/.test(modPackType)) {
    PACK_DIR = 'resource_packs';
    PACK_TYPE = 'resource';
    LOG_ID = '[RP]';
  } else if (/^(skin_pack)$/.test(modPackType)) {
    PACK_DIR = 'skin_packs';
    PACK_TYPE = 'skin';
    LOG_ID = '[SP]';
  } else return false;

  if (!headerCheck(headerBlock)) {
    console.error(`[SCRIPT] Manifest of ${fileName} does not have valid header data.`);
    return false;
  }
  if (!headerBlock.name || headerBlock.name === 'pack.name')
    PACK_NAME = fileName;
  else
    PACK_NAME = headerBlock.name;
  PACK_NAME = PACK_NAME.replace(/§.| /g, '');
  PACK_NAME = encodeURIComponent(PACK_NAME);
  console.log(`[SCRIPT] File '${PACK_NAME}' is confirmed a ${PACK_TYPE} pack.`);

  if (isManifestReadOnly) return true;
  const targetDir = join(__dirname, BUILD_DIR, PACK_DIR, PACK_NAME);
  return new Promise((resolve) => {
    try {
      mkdirSync(targetDir, { recursive: true });
      if (!existsSync(targetDir)) {
        console.error(`${LOG_ID} Failed to create target path.`);
        return resolve(false);
      }
      zip.extractAllTo(targetDir);
      console.log(`${LOG_ID} Successfully extracted ${fileName}!`);
      return resolve(true);
    } catch (err) {
      console.error(`${LOG_ID} Error: ${err.message}`);
      return resolve(false);
    }
  });
}

/**
  * @param {string} mainFile
  * @returns {Promise<boolean>}
  */
export async function initSinglePack(mainFile) {
  try {
    console.log(`[SCRIPT] main: ${mainFile}`);
    const isPack = await singlePack_setup(mainFile);
    if (isPack === true) process.exit(0);
    else if (isPack === EOPRTRCRSV) {
      console.log("[SCRIPT] Received EOPRTRCRSV ...");
      const retval = await new Promise((resolve) => {
        exec(`bash "${recurseScript}" "${mainFile}"`, async (err, stdout, stderr) => {
          if (err) {
            console.error("[SCRIPT:recursive] Failed to execute script: " + err.message);
            return resolve(false);
          }
          if (stderr.length > 0) {
            console.error("[SCRIPT:recursive] Runtime Error: " + stderr);
            return resolve(false);
          }
          const pathArray = stdout.split('\n').filter(line => line.trim() !== '');
          let isTrue;
          for (const path of pathArray) {
            console.log("[SCRIPT:recursive] Detected " + path);
            isTrue = await singlePack_setup(path);
            if (isTrue === true) continue;
            if (isTrue === ENOENT) resolve(ENOENT);
            console.error("[SCRIPT:recursive] Item not a Minecraft pack.");
            resolve(false);
          }
          resolve(false);
        });
      });
      return retval;
    }
    else if (isPack === ENOENT) return ENOENT;
    else return false;
  } catch (err) {
    console.error("[SCRIPT] Failed to read file: " + err.message);
    return false;
  }
};

// (async () => {
//   const isValid = await initSinglePack(mainFile);
//   if (isValid === ENOENT) {
//     console.error(`[SCRIPT] Runtime Error: ENOENT.`);
//     process.exit(1);
//   }
//   if (!isValid) {
//     console.error(`[SCRIPT] File ${mainFile} not a Minecraft pack nor bundle.`);
//     process.exit(1);
//   }
//   process.exit(0);
// })();
