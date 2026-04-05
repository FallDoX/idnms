/**
 * Data Analyzer - Find unrealistic values in CSV logs
 * Run: node src/tests/analyze-logs.mjs
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline parser (same as user-tests.mjs)
function parseOptional(val) {
  if (val === "" || val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseNewDate(dateStr, timeStr) {
  try {
    const datePart = String(dateStr).trim();
    const timePart = String(timeStr).trim();
    const dateParts = datePart.split('-');
    if (dateParts.length < 3) return NaN;
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    const timeParts = timePart.split(':');
    if (timeParts.length < 2) return NaN;
    const hour = parseInt(timeParts[0]);
    const min = parseInt(timeParts[1]);
    const secParts = timeParts[2]?.split('.') || ['0', '0'];
    const sec = parseInt(secParts[0]);
    const ms = secParts.length > 1 ? parseInt(secParts[1].padEnd(3, '0').substring(0, 3)) : 0;
    return new Date(year, month - 1, day, hour, min, sec, ms).getTime();
  } catch (e) {
    return NaN;
  }
}

function parseOldDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return NaN;
  try {
    const trimmed = dateStr.trim();
    const parts = trimmed.split(' ');
    if (parts.length < 2) return NaN;
    const [datePart, timePart] = parts;
    const dateParts = datePart.split('.');
    if (dateParts.length < 3) return NaN;
    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const year = parseInt(dateParts[2]);
    const timeParts = timePart.split(':');
    if (timeParts.length < 3) return NaN;
    const hour = parseInt(timeParts[0]);
    const min = parseInt(timeParts[1]);
    const secParts = timeParts[2].split('.');
    const sec = parseInt(secParts[0]);
    const ms = secParts.length > 1 ? parseInt(secParts[1]) : 0;
    return new Date(year, month - 1, day, hour, min, sec, ms).getTime();
  } catch (e) {
    return NaN;
  }
}

function detectFormat(headers) {
  if (headers.includes('date') && headers.includes('time') && headers.includes('phase_current')) {
    return 'new';
  }
  return 'old';
}

function parseTripData(csv) {
  const result = Papa.parse(csv, { header: true, skipEmptyLines: true, dynamicTyping: true });
  if (!result.data || result.data.length === 0) return [];
  
  const headers = Object.keys(result.data[0]);
  const format = detectFormat(headers);
  
  const parsed = result.data.map((row) => {
    const entry = {};
    
    if (format === 'new') {
      entry.timestamp = parseNewDate(row.date, row.time);
      entry.Speed = Number(row.speed) || 0;
      entry.Voltage = Number(row.voltage) || 0;
      entry.Current = Number(row.current) || 0;
      entry.Power = Number(row.power) || 0;
      entry.BatteryLevel = Number(row.battery_level) || 0;
      entry.TotalDistance = Number(row.totaldistance) || 0;
      entry.Temperature = Number(row.system_temp) || 0;
      entry.PWM = Number(row.pwm) || 0;
      entry.GPSSpeed = parseOptional(row.gps_speed);
      entry.Latitude = parseOptional(row.latitude);
      entry.Longitude = parseOptional(row.longitude);
      entry.Altitude = parseOptional(row.gps_alt);
      entry.PhaseCurrent = parseOptional(row.phase_current);
      entry.Torque = parseOptional(row.torque);
      entry.Temp2 = parseOptional(row.temp2);
      entry.Distance = parseOptional(row.distance);
      entry.GPSHeading = parseOptional(row.gps_heading);
      entry.GPSDistance = parseOptional(row.gps_distance);
      entry.Tilt = parseOptional(row.tilt);
      entry.Roll = parseOptional(row.roll);
    } else {
      entry.timestamp = parseOldDate(row.Date);
      entry.Speed = Number(row.Speed) || 0;
      entry.Voltage = Number(row.Voltage) || 0;
      entry.Current = Number(row.Current) || 0;
      entry.Power = Number(row.Power) || 0;
      entry.BatteryLevel = Number(row['Battery level']) || 0;
      entry.TotalDistance = Number(row['Total mileage']) || 0;
      entry.Temperature = Number(row.Temperature) || 0;
      entry.PWM = Number(row.PWM) || 0;
      entry.GPSSpeed = parseOptional(row['GPS Speed']);
      entry.Latitude = parseOptional(row.Latitude);
      entry.Longitude = parseOptional(row.Longitude);
      entry.Altitude = parseOptional(row.Altitude);
    }
    
    return entry;
  }).filter(e => !isNaN(e.timestamp));
  
  return parsed.sort((a, b) => a.timestamp - b.timestamp);
}

// Analyze for unrealistic values
function analyzeFile(filepath) {
  const filename = path.basename(filepath);
  console.log(`\n📁 ${filename}`);
  
  try {
    const csv = fs.readFileSync(filepath, 'utf-8');
    const data = parseTripData(csv);
    
    if (data.length === 0) {
      console.log('  ⚠️ Нет данных');
      return null;
    }
    
    console.log(`  📊 Всего точек: ${data.length}`);
    
    const issues = [];
    const stats = {};
    
    // Check each field for unrealistic values
    const checks = [
      { field: 'Speed', min: 0, max: 200, name: 'Скорость' },
      { field: 'Voltage', min: 100, max: 180, name: 'Напряжение' },
      { field: 'Current', min: -50, max: 100, name: 'Ток' },
      { field: 'Power', min: -5000, max: 15000, name: 'Мощность' },
      { field: 'BatteryLevel', min: 0, max: 100, name: 'Заряд батареи' },
      { field: 'Temperature', min: -20, max: 100, name: 'Температура' },
      { field: 'PWM', min: 0, max: 100, name: 'PWM' },
      { field: 'GPSSpeed', min: 0, max: 200, name: 'GPS скорость' },
      { field: 'PhaseCurrent', min: 0, max: 200, name: 'Фазный ток' },
      { field: 'Torque', min: 0, max: 200, name: 'Момент' },
      { field: 'Temp2', min: -20, max: 100, name: 'Температура 2' },
    ];
    
    checks.forEach(({ field, min, max, name }) => {
      const values = data
        .map(d => d[field])
        .filter(v => v !== undefined && v !== null && !isNaN(v));
      
      if (values.length === 0) return;
      
      const outOfRange = values.filter(v => v < min || v > max);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
      
      stats[field] = { min: minVal, max: maxVal, avg: avgVal, count: values.length };
      
      if (outOfRange.length > 0) {
        issues.push({
          field,
          name,
          count: outOfRange.length,
          min: minVal,
          max: maxVal,
          limitMin: min,
          limitMax: max,
          sample: outOfRange.slice(0, 3)
        });
      }
    });
    
    // Check for jumps in TotalDistance (going backwards)
    const distanceJumps = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i].TotalDistance < data[i-1].TotalDistance - 1) {
        distanceJumps.push({
          index: i,
          prev: data[i-1].TotalDistance,
          curr: data[i].TotalDistance,
          diff: data[i].TotalDistance - data[i-1].TotalDistance
        });
      }
    }
    
    if (distanceJumps.length > 0) {
      issues.push({
        field: 'TotalDistance',
        name: 'Пробег (откат назад!)',
        count: distanceJumps.length,
        sample: distanceJumps.slice(0, 3)
      });
    }
    
    // Check for time gaps
    const timeGaps = [];
    for (let i = 1; i < data.length; i++) {
      const gap = (data[i].timestamp - data[i-1].timestamp) / 1000;
      if (gap > 10) { // gaps > 10 seconds
        timeGaps.push({ index: i, gap });
      }
    }
    
    if (timeGaps.length > 0) {
      issues.push({
        field: 'timestamp',
        name: 'Разрывы во времени (>10с)',
        count: timeGaps.length,
        sample: timeGaps.slice(0, 3).map(g => `${g.gap.toFixed(1)}с`)
      });
    }
    
    // Print stats
    console.log('  📈 Статистика:');
    Object.entries(stats).forEach(([field, s]) => {
      console.log(`    ${field}: ${s.min.toFixed(1)}..${s.max.toFixed(1)} (ср: ${s.avg.toFixed(1)})`);
    });
    
    // Print issues
    if (issues.length > 0) {
      console.log('  ⚠️  Найдены проблемы:');
      issues.forEach(issue => {
        if (issue.limitMin !== undefined) {
          console.log(`    • ${issue.name}: ${issue.count} значений вне [${issue.limitMin}..${issue.limitMax}]`);
          console.log(`      Диапазон в файле: ${issue.min.toFixed(1)}..${issue.max.toFixed(1)}`);
        } else if (issue.field === 'TotalDistance') {
          console.log(`    • ${issue.name}: ${issue.count} случаев! Пробег уменьшается`);
          console.log(`      Примеры:`, issue.sample.map(s => `${s.prev}→${s.curr}`).join(', '));
        } else {
          console.log(`    • ${issue.name}: ${issue.count} случаев`);
          console.log(`      Примеры:`, issue.sample.join(', '));
        }
      });
    } else {
      console.log('  ✅ Нереалистичных значений не найдено');
    }
    
    return { filename, data, issues, stats };
    
  } catch (e) {
    console.log(`  ❌ Ошибка: ${e.message}`);
    return null;
  }
}

// Main
console.log('\n🔍 Анализ CSV логов на нереалистичные значения\n');

const files = [
  '2026_03_22_11_30_36.csv',
  '2026_04_04_15_43_41.csv',
  'Trip (02.04.2026 09_33).csv',
  'Trip (04.04.2026 00_21).csv'
];

const results = [];
files.forEach(f => {
  const result = analyzeFile(path.join(__dirname, '../../', f));
  if (result) results.push(result);
});

console.log('\n📋 Итоговый отчет:');
console.log('='.repeat(60));

let totalIssues = 0;
results.forEach(r => {
  const issueCount = r.issues.length;
  totalIssues += issueCount;
  console.log(`${r.filename}: ${issueCount > 0 ? '⚠️ ' + issueCount + ' проблем' : '✅ OK'}`);
});

console.log('='.repeat(60));
console.log(`Всего файлов: ${results.length}, с проблемами: ${results.filter(r => r.issues.length > 0).length}`);

process.exit(totalIssues > 0 ? 1 : 0);
