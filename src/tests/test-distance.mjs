/**
 * Test distance calculation for 2026_03_22_11_30_36.csv
 * Run: node src/tests/test-distance.mjs
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read CSV file
const csv = fs.readFileSync(path.join(__dirname, '../../2026_03_22_11_30_36.csv'), 'utf-8');
const result = Papa.parse(csv, { header: true, skipEmptyLines: true, dynamicTyping: true });

const data = result.data;
console.log('📊 Total rows:', data.length);

// Check totaldistance column
const firstRow = data[0];
const lastRow = data[data.length - 1];

console.log('\n📏 Distance analysis:');
console.log('  First row totaldistance:', firstRow.totaldistance);
console.log('  Last row totaldistance:', lastRow.totaldistance);

if (firstRow.totaldistance && lastRow.totaldistance) {
  const distanceMeters = lastRow.totaldistance - firstRow.totaldistance;
  const distanceKm = distanceMeters / 1000;
  console.log('  Distance traveled (meters):', distanceMeters);
  console.log('  Distance traveled (km):', distanceKm.toFixed(2));
} else {
  console.log('  No totaldistance data available');
}

// Check other distance fields
console.log('\n🔍 Available distance fields:');
const fields = Object.keys(firstRow);
fields.forEach(f => {
  if (f.toLowerCase().includes('dist') || f.toLowerCase().includes('mileage')) {
    console.log(`  ${f}: ${firstRow[f]} → ${lastRow[f]}`);
  }
});
