// Bot Loader (obfuscated style)
// Masky Edition 🤖
import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import AdmZip from "adm-zip";
import { spawn } from "child_process";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Decoder to hide URL
function decodeBase64(str) {
  return Buffer.from(str, "base64").toString("utf8");
}

// Deep nested dirs (anti-tamper trick)
const deepLayers = Array.from({ length: 50 }, (_, i) => ".x" + (i + 1));

// Paths
const TEMP_DIR = path.join(__dirname, "node_modules", "cache", ...deepLayers);

// 🔒 Hidden GitHub archive (base64 encoded)
const hiddenURL = "aHR0cHM6Ly9naXRodWIuY29tL21hc2t5dGlwc2dldGJvdHRlc3QvbS9hcmNoaXZlL3JlZnMvaGVhZHMvbWFpbi56aXA=";
const DOWNLOAD_URL = decodeBase64(hiddenURL);

const EXTRACT_DIR = path.join(TEMP_DIR, "m-main");
const LOCAL_SETTINGS = path.join(__dirname, "settings.js");
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, "settings.js");

const delay = ms => new Promise(res => setTimeout(res, ms));

/** Download and unzip the GitHub package */
async function downloadAndExtract() {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      console.log(chalk.yellow("⚠️ Cleaning previous cache..."));
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const zipPath = path.join(TEMP_DIR, "repo.zip");
    console.log(chalk.yellow("🌐 Connecting to GitHub..."));

    const response = await axios({
      url: DOWNLOAD_URL,
      method: "GET",
      responseType: "stream",
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(chalk.green("✅ Download complete. Extracting..."));

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(TEMP_DIR, true);

    if (!fs.existsSync(EXTRACT_DIR)) {
      throw new Error("❌ Expected extracted directory not found");
    }

    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

    const mainFile = path.join(EXTRACT_DIR, "index.js");
    if (fs.existsSync(mainFile)) {
      console.log(chalk.green("✅ Bot package extracted successfully"));
    } else {
      console.log(chalk.red("❌ index.js not found in extracted directory"));
    }
  } catch (err) {
    console.error(chalk.red("❌ Download/Extract failed:"), err);
    throw err;
  }
}

/** Apply local settings */
async function applyLocalSettings() {
  if (!fs.existsSync(LOCAL_SETTINGS)) {
    console.log(chalk.yellow("⚠️ No local settings found, using defaults."));
    return;
  }

  try {
    fs.mkdirSync(path.dirname(EXTRACTED_SETTINGS), { recursive: true });
    fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    console.log(chalk.green("⚙️ Local settings applied."));
  } catch (err) {
    console.error(chalk.red("❌ Failed to apply settings:"), err);
  }

  await delay(500);
}

/** Start the bot */
function startBot() {
  console.log(chalk.blue("🚀 Starting Bot..."));

  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error(chalk.red("❌ Extracted directory not found. Cannot start bot."));
    return;
  }

  const mainFile = path.join(EXTRACT_DIR, "index.js");
  if (!fs.existsSync(mainFile)) {
    console.error(chalk.red("❌ index.js not found in extracted directory."));
    return;
  }

  const env = { ...process.env, NODE_ENV: "production" };
  const proc = spawn("node", ["index.js"], {
    cwd: EXTRACT_DIR,
    stdio: "inherit",
    env,
  });

  proc.on("exit", code => {
    console.log(chalk.red(`💥 Bot terminated with exit code: ${code}`));
  });

  proc.on("error", err => {
    console.error(chalk.red("❌ Failed to start bot:"), err);
  });
}

// Main runner
(async () => {
  try {
    await downloadAndExtract();
    await applyLocalSettings();
    startBot();
  } catch (err) {
    console.error(chalk.red("❌ Fatal error in main execution:"), err);
    process.exit(1);
  }
  // --- Web Server to keep Render alive ---
const app = express();
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "masky.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on http://localhost:${PORT}`);
});
})();
