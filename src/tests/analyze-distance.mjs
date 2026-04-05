/**
 * Analyze specific CSV for distance anomalies
 * Run: node src/tests/analyze-distance.mjs
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const csv = fs.readFileSync(path.join(__dirname, '../../2026_04_04_15_43_41.csv'), 'utf-8');
const result = Papa.parse(csv, { header: true, skipEmptyLines: true, dynamicTyping: true });

console.log('🔍 Анализ дистанции в 2026_04_04_15_43_41.csv\n');

// Find GPS distance anomalies
const data = result.data;
let maxDistance = 0;
let maxIndex = 0;
let lastDistance = 0;
let largeJumps = [];

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const dist = row.gps_distance !== undefined ? row.gps_distance : row.GPSDistance;
  
  if (dist !== null && dist !== undefined) {
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
    
    // Check for large jumps
    if (lastDistance > 0) {
      const jump = dist - lastDistance;
      if (jump > 1000) { // Jump > 1km
        largeJumps.push({ index: i, from: lastDistance, to: dist, jump });
      }
    }
    lastDistance = dist;
  }
}

console.log(`📊 Всего точек: ${data.length}`);
console.log(`📏 Максимальная дистанция: ${maxDistance} м (${(maxDistance/1000).toFixed(2)} км) на индексе ${maxIndex}`);

if (largeJumps.length > 0) {
  console.log(`\n⚠️  Обнаружены скачки дистанции >1км:`);
  largeJumps.forEach(j => {
    console.log(`  Индекс ${j.index}: ${j.from}м → ${j.to}м (+${j.jump}м)`);
  });
}

// Show context around max distance
console.log(`\n📍 Контекст вокруг максимума (индекс ${maxIndex}):`);
const start = Math.max(0, maxIndex - 3);
const end = Math.min(data.length, maxIndex + 4);
for (let i = start; i < end; i++) {
  const row = data[i];
  const dist = row.gps_distance !== undefined ? row.gps_distance : row.GPSDistance;
  const time = row.time || row.Time;
  const speed = row.speed || row.Speed;
  const marker = i === maxIndex ? ' <-- МАКСИМУМ' : '';
  console.log(`  [${i}] ${time}: ${dist}м, ${speed} км/ч${marker}`);
}
