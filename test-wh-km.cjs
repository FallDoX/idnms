// Test script to verify Wh/km calculations
const fs = require('fs');
const path = require('path');

// Parse CSV data
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const entry = {};
    headers.forEach((h, idx) => {
      const val = values[idx]?.trim();
      if (!val) {
        entry[h] = null;
      } else if (h === 'date' || h === 'time') {
        entry[h] = val; // Keep as string
      } else {
        entry[h] = parseFloat(val);
      }
    });
    
    // Create timestamp from date and time
    if (entry.date && entry.time) {
      const [year, month, day] = entry.date.split('-').map(Number);
      const timeParts = entry.time.split(':');
      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      const second = parseFloat(timeParts[2]);
      
      const date = new Date(year, month - 1, day, hour, minute, Math.floor(second), (second % 1) * 1000);
      entry.timestamp = date.getTime();
    }
    
    data.push(entry);
  }
  return data;
}

// Calculate consumption using current method
function calculateCurrentMethod(data) {
  const movingEntries = data.filter(e => e.speed > 5);
  
  if (movingEntries.length < 2) return { consumption: 0, method: 'current' };
  
  const movingDuration = movingEntries[movingEntries.length - 1].timestamp - movingEntries[0].timestamp;
  const movingDurationHours = movingDuration / 1000 / 3600;
  
  const avgPowerMoving = movingEntries.reduce((acc, e) => acc + e.power, 0) / movingEntries.length;
  const totalEnergyMovingWh = avgPowerMoving * movingDurationHours;
  
  const validMileage = data.filter(e => e.totaldistance > 0);
  const distanceMeters = validMileage[validMileage.length - 1].totaldistance - validMileage[0].totaldistance;
  const totalDistance = distanceMeters / 1000;
  
  const consumptionPerKm = totalDistance > 0 ? totalEnergyMovingWh / totalDistance : 0;
  
  return {
    consumption: consumptionPerKm,
    method: 'current',
    avgPower: avgPowerMoving,
    durationHours: movingDurationHours,
    distanceKm: totalDistance,
    energyWh: totalEnergyMovingWh
  };
}

// Calculate consumption using proper integration (trapezoidal)
function calculateProperMethod(data) {
  const movingEntries = data.filter(e => e.speed > 5);
  
  if (movingEntries.length < 2) return { consumption: 0, method: 'proper' };
  
  // Calculate energy by integrating power over time
  let totalEnergyWh = 0;
  for (let i = 1; i < movingEntries.length; i++) {
    const prev = movingEntries[i - 1];
    const curr = movingEntries[i];
    
    const dt = (curr.timestamp - prev.timestamp) / 1000 / 3600; // hours
    const avgPower = (prev.power + curr.power) / 2; // average power between points
    
    totalEnergyWh += avgPower * dt;
  }
  
  const validMileage = data.filter(e => e.totaldistance > 0);
  const distanceMeters = validMileage[validMileage.length - 1].totaldistance - validMileage[0].totaldistance;
  const totalDistance = distanceMeters / 1000;
  
  const consumptionPerKm = totalDistance > 0 ? totalEnergyWh / totalDistance : 0;
  
  // Calculate average power properly (energy / time)
  const totalDurationHours = (movingEntries[movingEntries.length - 1].timestamp - movingEntries[0].timestamp) / 1000 / 3600;
  const properAvgPower = totalDurationHours > 0 ? totalEnergyWh / totalDurationHours : 0;
  
  return {
    consumption: consumptionPerKm,
    method: 'proper',
    avgPower: properAvgPower,
    durationHours: totalDurationHours,
    distanceKm: totalDistance,
    energyWh: totalEnergyWh
  };
}

// Test files
const files = [
  '2026_04_04_15_43_41.csv',
  '2026_03_31_20_00_02.csv',
  '2026_03_22_11_30_36.csv'
];

console.log('Wh/km Calculation Verification\n');
console.log('=' .repeat(80));

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`\nFile not found: ${file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = parseCSV(content);
  
  const current = calculateCurrentMethod(data);
  const proper = calculateProperMethod(data);
  
  console.log(`\nFile: ${file}`);
  console.log(`Data points: ${data.length}, Moving: ${data.filter(e => e.speed > 5).length}`);
  console.log('-'.repeat(80));
  console.log('CURRENT METHOD (simple average):');
  console.log(`  Avg Power: ${current.avgPower.toFixed(2)} W`);
  console.log(`  Duration:  ${current.durationHours.toFixed(4)} h`);
  console.log(`  Distance:  ${current.distanceKm.toFixed(2)} km`);
  console.log(`  Energy:    ${current.energyWh.toFixed(2)} Wh`);
  console.log(`  Consumption: ${current.consumption.toFixed(2)} Wh/km`);
  console.log();
  console.log('PROPER METHOD (time integration):');
  console.log(`  Avg Power: ${proper.avgPower.toFixed(2)} W`);
  console.log(`  Duration:  ${proper.durationHours.toFixed(4)} h`);
  console.log(`  Distance:  ${proper.distanceKm.toFixed(2)} km`);
  console.log(`  Energy:    ${proper.energyWh.toFixed(2)} Wh`);
  console.log(`  Consumption: ${proper.consumption.toFixed(2)} Wh/km`);
  console.log();
  console.log(`DIFFERENCE: ${(current.consumption - proper.consumption).toFixed(2)} Wh/km (${((current.consumption / proper.consumption - 1) * 100).toFixed(1)}%)`);
  console.log('='.repeat(80));
});

console.log('\nTypical EUC consumption: 15-40 Wh/km');
console.log('Values outside this range may indicate calculation errors.');
