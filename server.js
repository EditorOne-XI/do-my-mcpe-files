import express from 'express';
import { exec } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, existsSync, mkdirSync, rmdirSync, unlinkSync } from 'fs';
import { itemSort } from './src/item_sort.js';
import console from 'console';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, '__uploads__');
const SETBUILD_DIR = join(__dirname, '__setbuild__');
const BUILD_SCRIPT = join(__dirname, 'transfer_build.sh');
const EXPORT_SCRIPT = join(__dirname, 'exportrun.sh');
const app = express();

// frontend
app.use(express.static(join(__dirname, 'app')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// backend upload extraction per pack
app.post('/upload', async (req, res) => {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  let fileName = req.headers['x-file-name'];
  if (!fileName) return res.status(500).json({
    success: false,
    error: "File Name header not found."
  });
  fileName = decodeURIComponent(fileName);
  const saveFilePath = join(UPLOAD_DIR, fileName);

  try {
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStream(saveFilePath);
      req.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', err => {
        console.error(`[ERROR] Write Stream: ${err.message}`);
        reject(new Error(`Failed to write file '${fileName}' to disk.`));
      });
    });

    await itemSort(saveFilePath);
    return res.json({ success: true });
  } catch (err) {
    console.error("[ERROR] Upload Runtime Error.");
    res.status(500).json({
      success: false,
      error: `${err.message}`
    });
  } finally {
    if (existsSync(saveFilePath))
      unlinkSync(saveFilePath);
    if (global.gc) global.gc();
  }
});

// backend register to targetPackage
// defaults to Minecraft if the value has an error.
app.post('/batch-complete', (req, res) => {
  const targetPackage = req.body.targetPackage || 'MINECRAFT_NATIVE';
  // App clear data defaults to true because it is recommended.
  const doClearData = req.body.clearData ?? true;
  try {
    if (existsSync(UPLOAD_DIR)) rmdirSync(UPLOAD_DIR);
  } catch (err) {
    console.warn(`[WARNING] ${UPLOAD_DIR} cannot be deleted. Skipping.`);
  }

  // ARGS: MAINDIR, SETBUILD_DIR, TARGET_PACKAGE, CLEAR_DATA
  exec(
    `bash "${BUILD_SCRIPT}" "${__dirname}" "${SETBUILD_DIR}" "${targetPackage}" "${doClearData}"`,
    (error, stdout, stderr) => {
      if (global.gc) global.gc();
      const errMessage = stderr.trim();
      if (error && errMessage !== "Success") {
        console.error(`[ERROR] Transfer Error: ${errMessage.length > 0 ? stderr : "Check Terminal."}`);
        return res.status(500).json({
          success: false, error: errMessage
        });
      }
      console.log(`\n${stdout}`);
      res.json({ success: true });
    });
});

// backend export targetPackage
app.post('/export', (req, res) => {
  const targetPackage = req.body.targetPackage || 'MINECRAFT_NATIVE';

  // ARGS: MAINDIR, TARGET_PACKAGE
  exec(
    `bash "${EXPORT_SCRIPT}" "${__dirname}" "${targetPackage}"`,
    (error, stdout, stderr) => {
      const errMessage = stderr.trim();
      if (error &&
        errMessage !== "Success" &&
        errMessage.replace(/\n/g, '') !== "com.mojang/"
      ) {
        console.error(`[ERROR] Export Error: ${errMessage.length > 0 ? stderr : "Check Terminal."}`);
        return res.status(500).json({
          success: false, error: errMessage
        });
      }
      console.log(`\n${stdout}`);
      res.json({ success: true });
    });
});

// parse localhost app
// 5312 was good but I'd do some trolling lol
// and chose this specific unassigned port from IANA
const PORT = 16767;
const serverInstance = app.listen(PORT, () => {
  console.log(`[*] Quilantia Import Builder App active at http://localhost:${PORT}`);
});

serverInstance.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[✗] Port ${PORT} is already occupied.`);
    console.error(`    Close the app (or other service) first before restarting it.`);
    process.exit(1);
  } else {
    throw error;
  }
});
