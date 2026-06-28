import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, dirname, join, parse } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(1);
const cmdName = basename(args[0]);

if (args.length < 2) {
  console.error(`${cmdName}: Usage: ${cmdName} <FILE>`);
  process.exit(2);
};
const FILE_ARG = args[1];

const UUIDformat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
  * @param {{ name: string, uuid: string, version: string | number[]}} headerJSON
  * @returns {boolean}
  */
function headerCheck(headerJSON) {
  if (!headerJSON.name || typeof headerJSON.name !== 'string')
    return false;
  if (!headerJSON.uuid ||
    typeof headerJSON.uuid !== 'string' ||
    !UUIDformat.test(headerJSON.uuid)
  )
    return false;
  if (
    headerJSON.version &&
    (typeof headerJSON.version === 'string' ||
      Array.isArray(headerJSON.version))
  ) return true;
  return false;
}

/**
  * @param {AdmZip.IZipEntry} manifest
  * @returns {boolean | { packDir: string, packName: string, packLog: string }}
  */
function manifestCheck(manifest) {
  const logID = "[Manifest Check]";
  const fileName = manifest.entryName;
  const root = JSON.parse(manifest.getData().toString('utf8'));
  if (!root) {
    console.error(`${logID} 'manifest.json' of '${fileName}' is not a JSON file.`);
    return false;
  }

  const fv = root.format_version;
  const headerBlock = root.header;
  const modulesBlock = root.modules;
  if (!fv || !Array.isArray(modulesBlock) || !headerBlock) {
    console.error(`${logID} Manifest of '${fileName}' does not have Mineraft Bedrock manifest format.`);
    return false;
  }

  if (!headerCheck(headerBlock)) {
    console.error(`${logID} Manifest of '${fileName}' does not have valid header format.`);
    return false;
  }

  /** @type {{ type: string, uuid: string }} */
  const moduleItem0 = modulesBlock[0];
  if (
    !moduleItem0 ||
    typeof moduleItem0.type !== 'string' ||
    typeof moduleItem0.uuid !== 'string' ||
    !UUIDformat.test(moduleItem0.uuid)
  ) {
    console.error(`${logID} Manifest of '${fileName}' does not have valid modules format.`);
    return false;
  }

  const moduleType = moduleItem0.type;
  let PACK_DIR, LOG_ID, PACK_TYPE, PACK_NAME;
  if (/^(data|script)$/.test(moduleType)) {
    PACK_DIR = 'behavior_packs';
    PACK_TYPE = 'behavior/script';
    LOG_ID = '[BP]';
  } else if (/^(resources)$/.test(moduleType)) {
    PACK_DIR = 'resource_packs';
    PACK_TYPE = 'resource';
    LOG_ID = '[RP]';
  } else if (/^(skin_pack)$/.test(moduleType)) {
    PACK_DIR = 'skin_packs';
    PACK_TYPE = 'skin';
    LOG_ID = '[SP]';
  } else {
    console.error(`${logID} Manifest of '${fileName}' does not have a valid module type.`);
    return false;
  }

  console.log(`${logID} Confirmed Manifest of '${fileName}' is a ${PACK_TYPE} pack!`);
  return {
    packDir: PACK_DIR,
    packName: PACK_NAME,
    packLog: LOG_ID
  }
}

/** @type {{ name: string, data: Buffer<ArrayBufferLike> }[]} */
// let innerPathsArr = [];
let isMainFileValid = false;

/**
  * @param {string | Buffer<ArrayBufferLike>} mainFile
  */
// function recursePack(mainFile) {
//   /** @type {AdmZip} */
//   let zip;
//   /** @type {AdmZip.IZipEntry[]} */
//   let entries;
//
//   try {
//     zip = new AdmZip(mainFile);
//     entries = zip.getEntries();
//   } catch (err) {
//     console.error("[Test] AdmZip Error: " + err.message);
//     process.exit(1);
//   }
//   let manifestPaths = [];
//
//   for (const entry of entries) {
//     console.log("[Test] Entry: " + entry.entryName);
//     if (entry.isDirectory) continue;
//
//     if (entry.name === "manifest.json") {
//       if (!manifestCheck(entry)) continue;
//       console.log("\x1b[92m[Success] Manifest Entry: " + entry.entryName + "\x1b[0m");
//       const entryDir = dirname(entry.entryName);
//       manifestPaths.push(entryDir);
//       isMainFileValid = true;
//       continue;
//     }
//
//     if (/\.(mcpack|zip|mcaddon)$/.test(entry.name)) {
//       console.log(`[Test] InnerPath Saved: ${entry.entryName}`);
//       innerPathsArr.push({
//         name: entry.name,
//         data: entry.getData()
//       });
//     }
//   }
//
//   console.log("Found ZIP Paths with manifest.json: ", manifestPaths);
//
//   for (const entry of entries) {
//     if (!entry.isDirectory && manifestPaths.some(path => entry.entryName.startsWith(path))) {
//       zip.extractEntryTo(entry, './BUNDLE');
//       console.log("Extracted " + entry.entryName);
//     }
//   }
// }
//
// recursePack(FILE_ARG);
//
// while (innerPathsArr.length > 0) {
//   for (const item of innerPathsArr) {
//     recursePack(item.data);
//     innerPathsArr.shift();
//   }
// }

/**
  * @param {string} string
  * @returns {string | null}
  */
function fileNameOnly(string) {
  if (!string || string.length < 1) return null;
  const parsed = parse(string);
  return parsed.name;
}

/**
  * @param {string | Buffer<ArrayBufferLike>} mainFile 
  * @param {string} [filename]
  */
function recursePack(mainFile, filename) {
  /** @type {AdmZip} */
  let zip;
  /** @type {AdmZip.IZipEntry[]} */
  let entries;

  try {
    zip = new AdmZip(mainFile);
    entries = zip.getEntries();
  } catch (err) {
    console.error("[Test] AdmZip Error: " + err.message);
    process.exit(1);
  }

  /** @type {string[]} */
  let excludePaths = [];
  let fileName = fileNameOnly(filename);
  console.log(`[DEBUG] Entries received from '${fileName}' = ${entries.length}`);
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (excludePaths.some(path => entry.entryName.startsWith(path))) continue;

    if (entry.name === "manifest.json") {
      const isPack = manifestCheck(entry);
      if (!isPack) continue;
      isMainFileValid = true;
      const fetchDir = dirname(entry.entryName);
      if (!fileName)
        fileName = basename(fetchDir);
      const getEntries = entries.filter(e => {
        if (e.isDirectory) return false;
        return fetchDir === '.' || e.entryName.startsWith(fetchDir);
      });

      console.log("Finished fetch variables:")
      for (const getEntry of getEntries) {
        console.log("Starting " + getEntry.entryName.substring(fetchDir.length + 1));
        const relativePath = (fetchDir === '.' || fetchDir.length === 0)
          ? getEntry.entryName
          : getEntry.entryName.substring(fetchDir.length + 1);

        try {
          const destPath = join(__dirname, "BUNDLE", fileName, relativePath);
          const destDir = dirname(destPath);

          mkdirSync(destDir, { recursive: true });
          writeFileSync(destPath, getEntry.getData());
          console.log(`${isPack.packLog} Extracted ${getEntry.entryName} from ${isPack.packName}`);
        } catch (err) {
          console.log(`${isPack.packLog} Failed to write '${getEntry.name}'.`);
        }       
      }
      excludePaths.push(fetchDir);
    }

    if (/\.(mcpack|zip|mcaddon)$/.test(entry.name)) {
      const tempPath = join(__dirname, `_temp_${Date.now()}_${entry.name}`);
      const tempDir = dirname(tempPath);

      try {
        mkdirSync(tempDir, { recursive: true });
        writeFileSync(tempPath, entry.getData());
        recursePack(tempPath, entry.name.replace(/\.[0-9a-zA-Z]$/, ''));
      } catch (err) {
        console.error(`Failed to recurse ${entry.entryName}`);
      }  finally {
        if (existsSync(tempPath)) unlinkSync(tempPath);
      }
    }
  }
}

recursePack(FILE_ARG);

if (isMainFileValid) {
  console.log("[Test] Success.");
  process.exit(0);
}
else {
  console.error("[Test] File not a Minecraft Pack/Bundle.");
  process.exit(1);
}
