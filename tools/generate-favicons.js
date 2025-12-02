#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

async function main() {
  const root = path.resolve(__dirname, "..");
  const src = path.join(root, "avatar.png");
  if (!fs.existsSync(src)) {
    console.warn(
      "avatar.png not found in project root. Skipping favicon generation."
    );
    return; // non-fatal: continue build without favicons
  }

  let sharp;
  let pngToIco;
  try {
    sharp = require("sharp");
    pngToIco = require("png-to-ico");
  } catch (err) {
    console.warn(
      "Required packages are not installed. Skipping favicon generation. Run `npm install` to install devDependencies and try again."
    );
    console.warn(err && err.message ? err.message : err);
    return; // non-fatal
  }

  const sizes = [16, 32];
  try {
    console.log("Generating PNG favicons from avatar.png...");
    await Promise.all(
      sizes.map((s) => {
        const out = path.join(root, `favicon-${s}.png`);
        return sharp(src).resize(s, s).png().toFile(out);
      })
    );

    // Try to create a multi-resolution ICO from some PNGs (16,32,48).
    try {
      // png-to-ico is happier when given Buffers — read the generated PNGs and pass their buffers.
      const icoSourcePaths = [16, 32].map((s) =>
        path.join(root, `favicon-${s}.png`)
      );
      // sanity checks and read buffers
      const buffers = icoSourcePaths.map((p) => {
        if (!fs.existsSync(p)) {
          throw new Error(`Expected source PNG for ICO not found: ${p}`);
        }
        const b = fs.readFileSync(p);
        if (!b || b.length === 0) {
          throw new Error(`Source PNG is empty: ${p}`);
        }
        return b;
      });

      console.log("Creating favicon.ico...");
      const buf = await pngToIco(buffers[0]);
      fs.writeFileSync(path.join(root, "favicon.ico"), buf);
      console.log("favicon.ico created");
    } catch (icoErr) {
      console.warn("Could not create favicon.ico; continuing without it.");
      console.warn(icoErr && icoErr.message ? icoErr.message : icoErr);
    }

    console.log("PNG favicons generated: favicon-<size>.png");
  } catch (err) {
    console.warn("Failed to generate PNG favicons:");
    console.warn(err && err.stack ? err.stack : err);
    // Non-fatal: do not exit with error so CI continues and page updates.
  }
}

main();
