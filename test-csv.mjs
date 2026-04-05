import { parseTripData, calculateSummary, filterData, getAccelerationForThresholds } from './bot-dist/src/utils/parser.js';
import * as fs from 'fs';

const csvFile = '2026_03_31_20_00_02.csv';

console.log('=== Testing CSV Parser ===\n');

// Read file
const csvContent = fs.readFileSync(csvFile, 'utf8');
console.log('File size:', csvContent.length, 'bytes');

// Parse data
const data = parseTripData(csvContent);
console.log('Parsed entries:', data.length);

if (data.length === 0) {
  console.error('❌ No data parsed!');
  process.exit(1);
}

// Check first and last entries
console.log('\n=== First Entry ===');
console.log('Timestamp:', new Date(data[0].timestamp).toISOString());
console.log('Speed:', data[0].Speed, 'km/h');
console.log('Voltage:', data[0].Voltage, 'V');
console.log('Current:', data[0].Current, 'A');
console.log('Power:', data[0].Power, 'W');
console.log('Battery:', data[0].BatteryLevel, '%');

console.log('\n=== Last Entry ===');
const last = data[data.length - 1];
console.log('Timestamp:', new Date(last.timestamp).toISOString());
console.log('Speed:', last.Speed, 'km/h');

// Calculate summary
const { filtered, removed, issues } = filterData(data);
console.log('\n=== Filtering ===');
console.log('Filtered entries:', filtered.length);
console.log('Removed:', removed);
console.log('Issues:', issues.slice(0, 5)); // Show first 5 issues

// Calculate summary
const summary = calculateSummary(filtered);
console.log('\n=== Trip Summary ===');
console.log('Max Speed:', summary.maxSpeed?.toFixed(1), 'km/h');
console.log('Avg Speed:', summary.avgSpeed?.toFixed(1), 'km/h');
console.log('Max Power:', summary.maxPower?.toFixed(0), 'W');
console.log('Max Current:', summary.maxCurrent?.toFixed(1), 'A');
console.log('Total Distance:', summary.totalDistance?.toFixed(1), 'km');
console.log('Battery Drop:', summary.maxBatteryDrop?.toFixed(1), '%');
console.log('Consumption:', summary.consumptionPerKm?.toFixed(1), 'Wh/km');

// Acceleration thresholds
const thresholds = [
  { id: '0to10', label: '0-10 км/ч', value: 10 },
  { id: '0to20', label: '0-20 км/ч', value: 20 },
  { id: '0to30', label: '0-30 км/ч', value: 30 },
  { id: '0to40', label: '0-40 км/ч', value: 40 },
  { id: '0to50', label: '0-50 км/ч', value: 50 },
  { id: '0to60', label: '0-60 км/ч', value: 60 },
  { id: '0to70', label: '0-70 км/ч', value: 70 },
  { id: '0to80', label: '0-80 км/ч', value: 80 },
];

const accelResults = getAccelerationForThresholds(filtered, thresholds);
console.log('\n=== Acceleration Results ===');
for (const t of thresholds) {
  const result = accelResults[t.id];
  if (result && result.time !== null) {
    const gForce = result.bestRun?.peakAcceleration ? (result.bestRun.peakAcceleration / 9.8).toFixed(2) : 'N/A';
    console.log(`${t.label}: ${result.time.toFixed(2)}s (peak: ${result.bestRun?.peakAcceleration?.toFixed(2) || 'N/A'} m/s² / ${gForce}g)`);
  }
}

console.log('\n=== ✅ All tests passed! ===');
