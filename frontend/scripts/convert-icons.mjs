import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "../public/icons");

mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Convert each SVG to PNG
for (const size of sizes) {
  const svgPath = join(iconsDir, `icon-${size}.svg`);
  const pngPath = join(iconsDir, `icon-${size}.png`);

  await sharp(readFileSync(svgPath))
    .resize(size, size)
    .png()
    .toFile(pngPath);

  console.log(`icon-${size}.png`);
}

// Feature graphic for Play Store (1024x500)
const featureSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="bg" cx="30%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e1040"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <ellipse cx="280" cy="250" rx="240" ry="240" fill="url(#glow)"/>
  <!-- App icon -->
  <rect x="80" y="100" width="300" height="300" rx="45" fill="#12121a"/>
  <text x="230" y="275" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-weight="900" font-size="160" fill="#7c3aed">A</text>
  <circle cx="342" cy="138" r="24" fill="#a78bfa" opacity="0.8"/>
  <!-- Text -->
  <text x="440" y="195" font-family="system-ui,sans-serif" font-weight="900" font-size="64" fill="#ffffff">Axis</text>
  <text x="440" y="255" font-family="system-ui,sans-serif" font-weight="400" font-size="28" fill="#a78bfa">The Life RPG</text>
  <text x="440" y="320" font-family="system-ui,sans-serif" font-weight="300" font-size="22" fill="#6b7280">Convierte tus hábitos en stats de RPG</text>
  <!-- Stat pills -->
  <rect x="440" y="355" width="80" height="32" rx="16" fill="#7c3aed" opacity="0.3"/>
  <text x="480" y="371" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#a78bfa">VIT</text>
  <rect x="534" y="355" width="80" height="32" rx="16" fill="#7c3aed" opacity="0.3"/>
  <text x="574" y="371" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#a78bfa">FOC</text>
  <rect x="628" y="355" width="80" height="32" rx="16" fill="#7c3aed" opacity="0.3"/>
  <text x="668" y="371" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#a78bfa">DIS</text>
</svg>`);

await sharp(featureSvg)
  .resize(1024, 500)
  .png()
  .toFile(join(iconsDir, "feature-graphic.png"));

console.log("feature-graphic.png (1024x500 para Play Store)");
console.log("\nListo. Todos los PNG generados en public/icons/");
