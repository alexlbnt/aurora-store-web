// Gera os ícones do app instalável (PWA) a partir do logo em src/app/icon.png.
// Uso: node scripts/generate-pwa-icons.mjs
// O sharp já vem instalado como dependência do Next.js.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "src/app/icon.png";
const OUT = "public/icons";
const BACKGROUND = "#232a3e"; // Tinta (azul-noite da paleta)

/**
 * Logo circular centralizado sobre um quadrado azul-noite.
 * `logoRatio` é a fração do lado ocupada pelo logo: ícones "maskable" precisam
 * caber no círculo seguro central (80% do lado), então usam um logo menor.
 */
async function makeIcon(size, logoRatio, file) {
  const logoSize = Math.round(size * logoRatio);
  const logo = await sharp(SOURCE).resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`${OUT}/${file}`);
  console.log(`✓ ${OUT}/${file}`);
}

await mkdir(OUT, { recursive: true });
await makeIcon(192, 0.84, "icon-192.png");
await makeIcon(512, 0.84, "icon-512.png");
await makeIcon(512, 0.66, "icon-maskable-512.png");
await makeIcon(180, 0.8, "apple-touch-icon.png"); // iOS arredonda os cantos sozinho
