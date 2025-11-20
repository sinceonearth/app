// generate-icons.js
import sharp from "sharp";
import fs from "fs";
import path from "path";

const input = path.join("client", "public", "face-alien.png");
const outputDir = path.join("client", "public", "icons");

const sizes = [192, 512, 180, 384, 72, 96, 144, 256]; // common PWA sizes

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sizes.forEach((size) => {
  const outFile = path.join(outputDir, `face-alien-${size}x${size}.png`);
  sharp(input)
    .resize(size, size)
    .toFile(outFile)
    .then(() => console.log(`Generated ${outFile}`))
    .catch((err) => console.error(err));
});
