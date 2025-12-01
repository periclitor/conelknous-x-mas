#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

async function main() {
  const root = path.resolve(__dirname, "..");
  const src = path.join(root, "avatar.png");
  if (!fs.existsSync(src)) {
    console.error(
      "avatar.png not found in project root. Please add your avatar.png to the repository root and re-run."
    );
    process.exit(2);
  }

  let sharp;
  let pngToIco;
  try {
    sharp = require("sharp");
    pngToIco = require("png-to-ico");
  } catch (err) {
    console.error(
      "Required packages are not installed. Run `npm install` to install devDependencies and try again."
    );
    console.error(err && err.message ? err.message : err);
    process.exit(3);
  }

  const sizes = [16, 32, 48, 64, 96, 128, 256];
  try {
    console.log("Generating PNG favicons from avatar.png...");
    await Promise.all(
      sizes.map((s) => {
        const out = path.join(root, `favicon-${s}.png`);
        return sharp(src).resize(s, s).png().toFile(out);
      })
    );

    // Create a multi-resolution ICO from some PNGs (16,32,48).
    // png-to-ico is happier when given Buffers — read the generated PNGs and pass their buffers.
    const icoSourcePaths = [16, 32, 48].map((s) =>
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
    const buf = await pngToIco(buffers);
    fs.writeFileSync(path.join(root, "favicon.ico"), buf);

    console.log("Favicons generated: favicon.ico and favicon-<size>.png");
  } catch (err) {
    console.error(
      "Failed to generate favicons:",
      err && err.stack ? err.stack : err
    );
    process.exit(4);
  }
}

main();
