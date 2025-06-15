import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the public/images directory exists
const outputDir = join(__dirname, '../public/images');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');

// Background gradient
const gradient = context.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#1a202c');
gradient.addColorStop(1, '#2d3748');
context.fillStyle = gradient;
context.fillRect(0, 0, width, height);

// Add text
context.fillStyle = '#ffffff';
context.textAlign = 'center';
context.textBaseline = 'middle';

// Main title
context.font = 'bold 72px Arial';
context.fillText('Full Moon Odds', width / 2, height / 2 - 50);

// Subtitle
context.font = '32px Arial';
context.fillText('Astrological Sports Insights', width / 2, height / 2 + 50);

// Add a moon icon (simple circle)
context.beginPath();
context.arc(width - 150, 150, 80, 0, Math.PI * 2);
context.fillStyle = '#f6e05e';
context.fill();

// Save the image
const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
const outputPath = join(outputDir, 'og-default.jpg');
writeFileSync(outputPath, buffer);

console.log(`OG image generated at: ${outputPath}`);
