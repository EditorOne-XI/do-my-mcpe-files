import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, dirname, join, parse } from 'path';
import { fileURLToPath } from 'url';
import { EINVAL, ENOENT, SETBUILD } from './global_variables.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __setbuild = join(__dirname, SETBUILD);
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
  ) return false;
  if (
    headerJSON.version &&
    (typeof headerJSON.version === 'string' ||
      Array.isArray(headerJSON.version))
  ) return true;
  return false;
}

/**
  * @param {AdmZip.IZipEntry} manifest
  * @param {string | null} [source] 
  * @returns {boolean | { packDir: string, packName: string, packLog: string }}
  */
function manifestCheck(manifest, source) {
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
    console.error(`${logID} Manifest of '${fileName}' does not have Minecraft Bedrock manifest format.`);
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

  if (headerBlock.name && headerBlock.name !== "pack.name")
    PACK_NAME = headerBlock.name;
  else
    PACK_NAME = source ?? `${Date.now()}`;
  console.log(`${logID} Confirmed Manifest of '${fileName}' is a ${PACK_TYPE} pack!`);
  return {
    packDir: PACK_DIR,
    packName: PACK_NAME.replace(/§.| /g, '').replace(/\W/g, '_'),
    packLog: LOG_ID
  }
}

/**
  * @param {AdmZip.IZipEntry} manifest
  * @param {string | null} [source] 
  * @returns {boolean | { packDir: string, packName: string, packLog: string }}
  */
function mcwtManifestCheck(manifest, source) {
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
    console.error(`${logID} Manifest of '${fileName}' does not have Minecraft Bedrock manifest format.`);
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
  if (!(/^(world_template)$/.test(moduleType))) {
    console.error(`${logID} Manifest of '${fileName}' does not have a valid world template type.`);
    return false;
  }
  const PACK_DIR = 'world_templates';
  const LOG_ID = '[WT]';

  let PACK_NAME;
  if (headerBlock.name && headerBlock.name !== "pack.name")
    PACK_NAME = headerBlock.name;
  else
    PACK_NAME = source ?? `${Date.now()}`;
  console.log(`${logID} Confirmed Manifest of '${fileName}' is a template pack!`);
  return {
    packDir: PACK_DIR,
    packName: PACK_NAME,
    packLog: LOG_ID
  }
}

/**
  * @param {string} string
  * @returns {string | null}
  */
function fileNameOnly(string) {
  if (!string || string.length < 1) return null;
  const parsed = parse(string);
  return parsed.name;
}

// Main Pack Entry
export class InitPackBundle {
  file = '';
  /** @type {boolean | symbol} */
  isValid = false;
  /** @type {{ symbol: symbol, item: string }[]} */
  errnoLog = [];

  /**
    * @param {string} mainFile 
    */
  constructor(mainFile) {
    if (typeof mainFile === 'string')
      this.file = mainFile;
  }

  /**
    * @param {string | Buffer<ArrayBufferLike>} [mainFile] 
    * @param {string} [mainFileName]
    */
  recursePack(mainFile = this.file, mainFileName) {
    if (!mainFile || mainFile.length < 1) {
      this.isValid = EINVAL;
      this.errnoLog.push({
        symbol: EINVAL, item: "main_file"
      });
      return;
    }
    /** @type {AdmZip} */
    let zip;
    /** @type {AdmZip.IZipEntry[]} */
    let entries;

    try {
      zip = new AdmZip(mainFile);
      entries = zip.getEntries();
    } catch (err) {
      console.error("[PackBundle] AdmZip Error: " + err.message);
      this.isValid = EINVAL
      this.errnoLog.push({
        symbol: EINVAL, item: mainFile
      });
      zip = entries = null;
      return;
    }

    /** @type {string[]} */
    let excludePaths = [];
    let fileName = fileNameOnly(mainFileName);
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      if (excludePaths.some(path => entry.entryName.startsWith(path))) continue;

      if (entry.name === "manifest.json") {
        const fetchDir = dirname(entry.entryName);
        const isPack = manifestCheck(entry, fileName || basename(fetchDir));
        if (!isPack) continue;
        this.isValid = true;
        const getEntries = entries.filter(e => {
          if (e.isDirectory) return false;
          if (excludePaths.some(path => e.entryName.startsWith(path))) return false;
          return fetchDir === '.' || e.entryName.startsWith(fetchDir);
        });
        fileName = basename(isPack.packName);

        for (const getEntry of getEntries) {
          const relativePath = (fetchDir === '.' || fetchDir.length === 0)
            ? getEntry.entryName
            : getEntry.entryName.substring(fetchDir.length + 1);
          console.log(`${isPack.packLog} Starting: ${relativePath} ...`);

          try {
            const destPath = join(__dirname, SETBUILD, isPack.packDir, fileName, relativePath);
            const destDir = dirname(destPath);
            mkdirSync(destDir, { recursive: true });
            if (!existsSync(destDir)) {
              this.isValid = ENOENT;
              this.errnoLog.push({
                symbol: ENOENT, item: fileName
              });
              zip = entries = null;
              return;
            }
            writeFileSync(destPath, getEntry.getData());
            console.log(`${isPack.packLog} Extracted as '${destPath.substring(__setbuild.length)}' from '${isPack.packName}'`);
          } catch (err) {
            console.error(`${isPack.packLog} Failed to write '${getEntry.name}': ${err.message}`);
            this.isValid = ENOENT;
            this.errnoLog.push({
              symbol: ENOENT, item: fileName
            });
            zip = entries = null;
            return;
          }
        }
        excludePaths.push(fetchDir);
      }

      if (/\.(mcpack|zip|mcaddon)$/.test(entry.name)) {
        const tempPath = join(__dirname, SETBUILD, `_temp_${Date.now()}_${entry.name}`);
        const tempDir = dirname(tempPath);

        try {
          mkdirSync(tempDir, { recursive: true });
          writeFileSync(tempPath, entry.getData());
          this.recursePack(tempPath, entry.name.replace(/\.[0-9a-zA-Z]$/, ''));
        } catch (err) {
          console.error(`[PackBundle] Failed to recurse ${entry.entryName}`);
          this.isValid = ENOENT;
          this.errnoLog.push({
            symbol: ENOENT, item: entry.name
          });
        } finally {
          if (existsSync(tempPath)) unlinkSync(tempPath);
          zip = entries = null;
          return;
        }
      }
    }
  }

  status() {
    const filename = basename(this.file);
    if (this.isValid === true) {
      console.log(`[PackBundle] File '${filename}' contains Minecraft Pack/s!`);
      return true;
    }
    if (typeof this.isValid === 'symbol') {
      console.error(`[PackBundle] File operation of ${filename} halted. Returned ${this.isValid.toString()} on error.`);
      return this.isValid;
    }
    if (this.errnoLog.length > 0) {
      console.error(`[PackBundle] File operation from part '${this.errnoLog[0].item}' halted. Returned ${this.errnoLog[0].symbol.toString()} on error.`);
      return this.errnoLog[0].symbol;
    }
    console.error(`[PackBundle] File '${filename}' is not a Minecraft Pack/Bundle.`);
    return false;
  }
}

export function worldTemplate_setup(mainFile) {
  /** @type {AdmZip} */
  let zip;
  const fileName = basename(mainFile);

  try {
    zip = new AdmZip(mainFile);
  } catch (err) {
    console.error("[WorldTemplate] AdmZip Error: " + err.message);
    return EINVAL;
  }

  const manifest = zip.getEntry("manifest.json");
  const packManifest = zip.getEntry("pack_manifest.json");
  if (!manifest && !packManifest) {
    console.error(`[WorldTemplate] Manifest of '${fileName}' does not have Minecraft Bedrock manifest format.`);
    zip = null;
    return false;
  }

  const manifestFile = manifest || packManifest;
  const isTemplate = mcwtManifestCheck(manifestFile);
  if (!isTemplate) {
    console.error(`[WorldTemplate] Manifest of '${fileName}' is not a valid Minecraft world template.`);
    zip = null;
    return false;
  }

  const targetDir = join(__dirname, SETBUILD, isTemplate.packDir, isTemplate.packName);
  try {
    mkdirSync(targetDir, { recursive: true });
    if (!existsSync(targetDir)) throw new Error(`Directory for ${targetDir} does not exist.`);
    zip.extractAllTo(targetDir, true);
    console.log(`[WorldTemplate] Successfully extracted ${isTemplate.packName}!`);
    return true;
  } catch (err) {
    console.error(`[WorldTemplate] Failed to write '${fileName}': ${err.message}`);
    return ENOENT;
  } finally {
    zip = null;
  }
}

// const args = process.argv.slice(1);
// const cmdName = basename(args[0]);
//
// if (args.length < 2) {
//   console.error(`${cmdName}: Usage: ${cmdName} <FILE>`);
//   process.exit(2);
// };
// const parentProcess = new InitPackBundle(args[1]);
// parentProcess.recursePack();
// process.exit(parentProcess.status() ? 1 : 0);
