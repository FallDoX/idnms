/**
 * GPS Anomaly Analyzer - Find unrealistic GPS jumps and distance issues
 * Run: node src/tests/analyze-gps.mjs
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Calculate distance between two GPS points using Haversine formula
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}

function detectFormat(headers) {
  if (headers.includes('date') && headers.includes('time')) {
    return 'new';
  }
  return 'old';
}

function parseTripData(csv) {
  const result = Papa.parse(csv, { header: true, skipEmptyLines: true, dynamicTyping: true });
  if (!result.data || result.data.length === 0) return [];
  
  const headers = Object.keys(result.data[0]);
  const format = detectFormat(headers);
  
  return result.data.map(row => ({
    timestamp: format === 'new' 
      ? new Date(`${row.date}T${row.time}`).getTime()
      : new Date(row.Date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1')).getTime(),
    latitude: format === 'new' ? row.latitude : row.Latitude,
    longitude: format === 'new' ? row.longitude : row.Longitude,
    gpsDistance: format === 'new' ? row.gps_distance : null,
    speed: format === 'new' ? row.speed : row.Speed,
    gpsSpeed: format === 'new' ? row.gps_speed : row['GPS Speed'],
  })).filter(e => !isNaN(e.timestamp));
}

function analyzeGPSAnomalies(data, filename) {
  console.log(`\n📁 ${filename}`);
  console.log(`  📊 Всего точек: ${data.length}`);
  
  const issues = [];
  
  // 1. Check for GPS teleportation (large jumps in short time)
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1];
    const curr = data[i];
    
    if (prev.latitude === null || prev.longitude === null || 
        curr.latitude === null || curr.longitude === null) continue;
    
    const distance = haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    const timeGap = (curr.timestamp - prev.timestamp) / 1000; // seconds
    
    if (timeGap > 0) {
      const speed = (distance / timeGap) * 3.6; // km/h
      
      // Teleportation: moving faster than 200 km/h or jumping > 500m in < 5 seconds
      if (speed > 200 || (distance > 500 && timeGap < 5)) {
        issues.push({
          type: 'teleportation',
          index: i,
          distance,
          timeGap,
          speed,
          from: { lat: prev.latitude, lon: prev.longitude },
          to: { lat: curr.latitude, lon: curr.longitude }
        });
      }
    }
  }
  
  // 2. Check GPS distance consistency
  let gpsDistanceIssues = 0;
  let totalGPSDistance = 0;
  let calculatedDistance = 0;
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1];
    const curr = data[i];
    
    if (prev.latitude === null || prev.longitude === null || 
        curr.latitude === null || curr.longitude === null) continue;
    
    const stepDistance = haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    calculatedDistance += stepDistance;
    
    // Check reported GPS distance if available
    if (curr.gpsDistance !== null && prev.gpsDistance !== null) {
      const reportedDelta = curr.gpsDistance - prev.gpsDistance;
      totalGPSDistance += Math.abs(reportedDelta);
      
      // Large discrepancy between calculated and reported
      if (Math.abs(reportedDelta - stepDistance) > 100) { // > 100m difference
        gpsDistanceIssues++;
      }
    }
  }
  
  // 3. Find stuck GPS (same coordinates for long time)
  let stuckCount = 0;
  let stuckStart = null;
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1];
    const curr = data[i];
    
    if (prev.latitude === curr.latitude && prev.longitude === curr.longitude) {
      if (!stuckStart) stuckStart = i-1;
    } else {
      if (stuckStart && i - stuckStart > 10) { // Same position for > 10 points
        stuckCount++;
      }
      stuckStart = null;
    }
  }
  
  // 4. Check for decreasing gps_distance
  let backwardDistance = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].gpsDistance !== null && data[i-1].gpsDistance !== null) {
      if (data[i].gpsDistance < data[i-1].gpsDistance - 10) { // Decreased by > 10m
        backwardDistance++;
      }
    }
  }
  
  // Print results
  if (issues.length > 0) {
    console.log(`  ⚠️  GPS телепортации: ${issues.length}`);
    issues.slice(0, 3).forEach(issue => {
      console.log(`    • Индекс ${issue.index}: ${issue.distance.toFixed(0)}м за ${issue.timeGap.toFixed(1)}с (${issue.speed.toFixed(0)} км/ч)`);
    });
  }
  
  if (gpsDistanceIssues > 0) {
    console.log(`  ⚠️  Расхождение GPS дистанции: ${gpsDistanceIssues} случаев`);
  }
  
  if (stuckCount > 0) {
    console.log(`  ⚠️  Застрявший GPS: ${stuckCount} сегментов`);
  }
  
  if (backwardDistance > 0) {
    console.log(`  ⚠️  Откат GPS дистанции назад: ${backwardDistance} случаев`);
  }
  
  console.log(`  📏 Общая дистанция (рассчитана): ${(calculatedDistance/1000).toFixed(2)} км`);
  console.log(`  📏 Общая дистанция (GPS): ${(totalGPSDistance/1000).toFixed(2)} км`);
  
  if (issues.length === 0 && gpsDistanceIssues === 0 && stuckCount === 0 && backwardDistance === 0) {
    console.log('  ✅ GPS аномалий не найдено');
  }
  
  return { issues, gpsDistanceIssues, stuckCount, backwardDistance, calculatedDistance };
}

console.log('\n🔍 Анализ GPS аномалий в CSV логах\n');

const files = [
  '2026_03_22_11_30_36.csv',
  '2026_04_04_15_43_41.csv',
  'Trip (02.04.2026 09_33).csv',
  'Trip (04.04.2026 00_21).csv'
];

const results = [];
files.forEach(f => {
  const csv = fs.readFileSync(path.join(__dirname, '../../', f), 'utf-8');
  const data = parseTripData(csv);
  const result = analyzeGPSAnomalies(data, f);
  results.push({ file: f, ...result });
});

console.log('\n📋 Итоговый отчет по GPS:');
console.log('='.repeat(60));
results.forEach(r => {
  const totalIssues = r.issues.length + r.gpsDistanceIssues + r.stuckCount + r.backwardDistance;
  console.log(`${r.file}: ${totalIssues > 0 ? '⚠️ ' + totalIssues + ' проблем' : '✅ OK'} (${(r.calculatedDistance/1000).toFixed(1)} км)`);
});
console.log('='.repeat(60));
