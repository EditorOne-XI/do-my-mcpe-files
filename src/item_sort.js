import { basename } from 'path';
import { InitPackBundle, worldTemplate_setup } from './is_pack_bundle.js';
import { backupFile_setup } from './is_backup.js';
import { mcOption_setup } from './is_mcoption.js';
import { screenshotsPack_setup } from './is_mcshots.js';
import { worldPack_setup } from './is_mcworld.js';

/**
  * @param {string} filename 
  */
function exitOnError(filename) {
  console.error(`[ImportSort] File ${filename} not a Minecraft pack nor bundle.`);
  return new Error(`File '${filename}' is not a Minecraft pack nor bundle.`);
}

/**
  * @param {string} filename 
  * @param {Symbol} symbol
  */
function exitOnERRNO(filename, symbol) {
  console.error(`[ImportSort] Runtime Error from ${filename}': ${symbol.toString()}`);
  return new Error(`Runtime Error from '${filename}' signal ${symbol.toString()}`);
}

/**
  * Processes FILEPATH if it is a valid Minecraft
  * file. Used to build the 'com.mojang' directory for 
  * Minecraft Bedrock Edition.
  * @param {string} FILEPATH A valid filepath to be read.
  * @throws Throws an error if not a valid Minecraft file.
  */
export async function itemSort(FILEPATH) {
  if (typeof FILEPATH !== 'string')
    throw new TypeError(`Argument not a string.`);
  const base = basename(FILEPATH);

  if (base === "com.mojang.zip") {
    const isBackup = backupFile_setup(FILEPATH);
    if (typeof isBackup === 'symbol')
      throw exitOnERRNO(base, isBackup);
    if (!isBackup)
      throw exitOnError(base);
  }

  else if (base === "options.txt") {
    const isOptions = mcOption_setup(FILEPATH);
    if (typeof isOptions === 'symbol')
      throw exitOnERRNO(base, isOptions);
    if (!isOptions)
      throw exitOnError(base);
  }

  else if (/\.(mcpack|mcaddon|zip)$/.test(FILEPATH)) {
    const initPack = new InitPackBundle(FILEPATH);
    initPack.recursePack();
    const isPack = initPack.status();
    if (typeof isPack === 'symbol')
      throw exitOnERRNO(base, isPack);
    if (!isPack)
      throw exitOnError(base);
  }

  else if (/\.(mcworld)$/.test(FILEPATH)) {
    const isWorld = worldPack_setup(FILEPATH);
    if (typeof isWorld === 'symbol')
      throw exitOnERRNO(base, isWorld);
    if (!isWorld)
      throw exitOnError(base);
  }

  else if (/\.(mctemplate)$/.test(FILEPATH)) {
    const isTemplate = worldTemplate_setup(FILEPATH);
    if (typeof isTemplate === 'symbol')
      throw exitOnERRNO(base, isTemplate);
    if (!isTemplate)
      throw exitOnError(base);
  }

  else if (/\.(mcshots)$/.test(FILEPATH)) {
    const isMcshots = screenshotsPack_setup(FILEPATH);
    if (typeof isMcshots === 'symbol')
      throw exitOnERRNO(base, isMcshots);
    if (!isMcshots)
      throw exitOnError(base);
  }

  else throw exitOnError(base);
};

// console.log("[ImportSort] Result: ", itemSort(process.argv[2]));
