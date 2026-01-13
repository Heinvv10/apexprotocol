/**
 * Generate LinkedIn-compatible PNG logo from SVG
 * LinkedIn requirements:
 * - Minimum: 300x300px (recommended)
 * - Maximum: 4MB file size
 * - Format: PNG or JPEG
 */

const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function generateLinkedInLogo() {
  const width = 400;
  const height = 400;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0d1224';
  ctx.fillRect(0, 0, width, height);

  // Triangle
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.moveTo(200, 120);
  ctx.lineTo(250, 200);
  ctx.lineTo(150, 200);
  ctx.closePath();
  ctx.fill();

  // APEX Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('APEX', 200, 250);

  // Tagline
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px Arial';
  ctx.fillText('AI Visibility Platform', 200, 280);

  // Save PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('public/apex-linkedin-logo.png', buffer);

  console.log('✅ LinkedIn logo generated: public/apex-linkedin-logo.png');
  console.log(`   Size: ${width}x${height}px`);
  console.log(`   File size: ${(buffer.length / 1024).toFixed(2)} KB`);
}

generateLinkedInLogo().catch(console.error);
