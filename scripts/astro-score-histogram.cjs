const { createClient } = require('@supabase/supabase-js');
const { createCanvas } = require('canvas');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAstroScores() {
  console.log('Fetching astro scores from database...');
  const { data, error } = await supabase
    .from('nba_players')
    .select('astro_influence')
    .not('astro_influence', 'is', null);

  if (error) {
    console.error('Error fetching astro scores:', error);
    process.exit(1);
  }

  return data.map(item => item.astro_influence);
}

function generateHistogram(scores) {
  console.log('Generating histogram...');
  
  // Define score ranges and count frequencies
  const ranges = [
    { min: 0, max: 10, count: 0 },
    { min: 10, max: 20, count: 0 },
    { min: 20, max: 30, count: 0 },
    { min: 30, max: 40, count: 0 },
    { min: 40, max: 50, count: 0 },
    { min: 50, max: 60, count: 0 },
    { min: 60, max: 70, count: 0 },
    { min: 70, max: 80, count: 0 },
    { min: 80, max: 90, count: 0 },
    { min: 90, max: 100, count: 0 }
  ];

  // Count scores in each range
  scores.forEach(score => {
    const range = ranges.find(r => score >= r.min && score < r.max);
    if (range) range.count++;
  });

  // Create canvas
  const width = 800;
  const height = 400;
  const padding = 50;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw axes
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // Find max count for scaling
  const maxCount = Math.max(...ranges.map(r => r.count));
  
  // Draw bars
  const barWidth = (width - 2 * padding) / ranges.length;
  const scaleY = (height - 2 * padding) / (maxCount || 1);

  ranges.forEach((range, i) => {
    const x = padding + i * barWidth;
    const barHeight = range.count * scaleY;
    
    // Draw bar
    ctx.fillStyle = 'rgba(54, 162, 235, 0.7)';
    ctx.fillRect(x, height - padding - barHeight, barWidth - 2, barHeight);
    
    // Draw label
    ctx.fillStyle = 'black';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${range.min}-${range.max}`, 
      x + barWidth / 2, 
      height - padding / 2
    );
    
    // Draw count
    if (range.count > 0) {
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding - barHeight - 5);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'right';
      ctx.fillText(range.count.toString(), 0, 0);
      ctx.restore();
    }
  });

  // Add title and labels
  ctx.fillStyle = 'black';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Distribution of NBA Player Astro Scores', width / 2, 30);
  
  ctx.font = '12px Arial';
  ctx.fillText('Score Range', width / 2, height - 10);
  
  // Save to file
  const outputFile = 'astro-score-histogram.png';
  const out = fs.createWriteStream(outputFile);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve) => {
    out.on('finish', () => {
      console.log(`✅ Histogram saved as ${outputFile}`);
      resolve(outputFile);
    });
  });
}

async function main() {
  try {
    const scores = await fetchAstroScores();
    console.log(`Fetched ${scores.length} player scores`);
    
    console.log('Score Statistics:');
    console.log(`- Average: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)}`);
    console.log(`- Min: ${Math.min(...scores).toFixed(2)}`);
    console.log(`- Max: ${Math.max(...scores).toFixed(2)}`);
    
    await generateHistogram(scores);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
