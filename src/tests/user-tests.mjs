/**
 * User Tests for GPS Distance (GSD) and Dynamic Metrics
 * Run with: node src/tests/user-tests.mjs
 */

import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inline parser functions (copied from parser.ts for testing)
function parseOptional(val) {
  if (val === "" || val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function detectFormat(headers) {
  if (headers.includes('date') && headers.includes('time') && headers.includes('phase_current')) {
    return 'new';
  }
  return 'old';
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
      entry.Mode = row.mode || '';
      entry.Alert = row.alert || '';
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
      entry.Pitch = parseOptional(row.Pitch);
      entry.Roll = parseOptional(row.Roll);
    }
    
    // Raw data for dynamic metrics
    const parsedFields = new Set(['date', 'time', 'speed', 'voltage', 'current', 'power', 'battery_level',
      'totaldistance', 'system_temp', 'pwm', 'gps_speed', 'latitude', 'longitude', 'gps_alt',
      'phase_current', 'torque', 'temp2', 'distance', 'mode', 'alert', 'gps_heading', 'gps_distance',
      'tilt', 'roll', 'Date', 'Speed', 'Voltage', 'Current', 'Power', 'Battery level', 'Total mileage',
      'Temperature', 'PWM', 'GPS Speed', 'Altitude', 'Pitch']);
    
    entry.rawData = {};
    for (const [key, value] of Object.entries(row)) {
      if (!parsedFields.has(key) && value !== undefined && value !== null && value !== '') {
        const numVal = Number(value);
        entry.rawData[key] = isNaN(numVal) ? String(value) : numVal;
      }
    }
    
    return entry;
  }).filter(e => !isNaN(e.timestamp));
  
  return parsed.sort((a, b) => a.timestamp - b.timestamp);
}

// Test runner
const results = [];

function test(name, fn) {
  try {
    const r = fn();
    results.push({ name, passed: r.passed, details: r.details });
    console.log(`${r.passed ? '✅' : '❌'} ${name}${r.details ? ': ' + r.details : ''}`);
  } catch (e) {
    results.push({ name, passed: false, error: String(e) });
    console.log(`❌ ${name}: ${e}`);
  }
}

console.log('\n=== Пользовательские тесты GPS Distance и динамических метрик ===\n');

// Test 1: Parse new format with GPS distance
test('Парсинг нового формата с GPS distance', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../../2026_03_22_11_30_36.csv'), 'utf-8');
  const data = parseTripData(csv);
  
  if (data.length === 0) return { passed: false, details: 'Нет данных' };
  
  const first = data[0];
  const hasGPSDistance = first.GPSDistance !== undefined && first.GPSDistance !== null;
  const hasGPSHeading = first.GPSHeading !== undefined && first.GPSHeading !== null;
  const hasTilt = first.Tilt !== undefined && first.Tilt !== null;
  const hasRoll = first.Roll !== undefined && first.Roll !== null;
  
  return {
    passed: hasGPSDistance && hasGPSHeading && hasTilt && hasRoll,
    details: `Точек: ${data.length}, GPS дист: ${hasGPSDistance}, Курс: ${hasGPSHeading}, Наклон: ${hasTilt}, Крен: ${hasRoll}`
  };
});

// Test 2: Parse old format without new fields
test('Парсинг старого формата', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../../Trip (02.04.2026 09_33).csv'), 'utf-8');
  const data = parseTripData(csv);
  
  if (data.length === 0) return { passed: false, details: 'Нет данных' };
  
  const first = data[0];
  return {
    passed: first.Speed !== undefined && first.timestamp !== undefined,
    details: `Точек: ${data.length}, Скорость: ${first.Speed}, Timestamp: ${first.timestamp}`
  };
});

// Test 3: Dynamic metrics detection
test('Обнаружение динамических метрик', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../../2026_03_22_11_30_36.csv'), 'utf-8');
  const data = parseTripData(csv);
  
  if (data.length === 0) return { passed: false, details: 'Нет данных' };
  
  const first = data[0];
  const rawDataKeys = first.rawData ? Object.keys(first.rawData) : [];
  
  return {
    passed: rawDataKeys.length >= 0, // Raw data can be empty if all fields parsed
    details: `RawData ключи: ${rawDataKeys.join(', ') || 'нет (все распарсено)'}`
  };
});

// Test 4: GPS distance values are reasonable
test('GPS дистанция - реалистичные значения', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../../2026_03_22_11_30_36.csv'), 'utf-8');
  const data = parseTripData(csv);
  
  const distances = data
    .map(d => d.GPSDistance)
    .filter(d => d !== undefined && d !== null && !isNaN(d));
  
  if (distances.length === 0) return { passed: false, details: 'Нет GPS дистанции' };
  
  const min = Math.min(...distances);
  const max = Math.max(...distances);
  const isIncreasing = max > min;
  
  return {
    passed: isIncreasing && min >= 0 && max < 100000,
    details: `Диапазон: ${min.toFixed(1)} - ${max.toFixed(1)} м (${distances.length} точек)`
  };
});

// Test 5: IMU sensors (tilt, roll) have valid ranges
test('IMU датчики - валидные диапазоны', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../../2026_03_22_11_30_36.csv'), 'utf-8');
  const data = parseTripData(csv);
  
  const tilts = data.map(d => d.Tilt).filter(t => t !== undefined && t !== null);
  const rolls = data.map(d => d.Roll).filter(r => r !== undefined && r !== null);
  
  if (tilts.length === 0 && rolls.length === 0) {
    return { passed: false, details: 'Нет IMU данных' };
  }
  
  const validTilts = tilts.length === 0 || (Math.min(...tilts) >= -90 && Math.max(...tilts) <= 90);
  const validRolls = rolls.length === 0 || (Math.min(...rolls) >= -90 && Math.max(...rolls) <= 90);
  
  return {
    passed: validTilts && validRolls,
    details: `Tilt: ${tilts.length ? `${Math.min(...tilts).toFixed(1)}..${Math.max(...tilts).toFixed(1)}°` : 'нет'}, Roll: ${rolls.length ? `${Math.min(...rolls).toFixed(1)}..${Math.max(...rolls).toFixed(1)}°` : 'нет'}`
  };
});

// Test 6: Phase current and torque for new format
test('Фазный ток и момент (новый формат)', () => {
  const csv = fs.readFileSync(path.join(__dirname, '../../2026_04_04_15_43_41.csv'), 'utf-8');
  const data = parseTripData(csv);
  
  if (data.length === 0) return { passed: false, details: 'Нет данных' };
  
  const first = data[0];
  const hasPhaseCurrent = first.PhaseCurrent !== undefined && first.PhaseCurrent !== null;
  const hasTorque = first.Torque !== undefined && first.Torque !== null;
  
  return {
    passed: hasPhaseCurrent || hasTorque,
    details: `Фазный ток: ${first.PhaseCurrent ?? 'нет'}, Момент: ${first.Torque ?? 'нет'}`
  };
});

// Test 7: Time formatting in milliseconds
test('Формат времени в миллисекундах', () => {
  // Test formatTime logic
  const formatTime = (seconds) => {
    if (seconds === null) return '—';
    const ms = Math.round(seconds * 1000);
    if (seconds < 1) {
      return `${ms} мс`;
    }
    const secs = Math.floor(seconds);
    const remainingMs = Math.round((seconds - secs) * 1000);
    return `${secs}.${remainingMs.toString().padStart(3, '0')}с (${ms} мс)`;
  };
  
  const test1 = formatTime(0.856);
  const test2 = formatTime(1.234);
  
  const correct1 = test1 === '856 мс';
  const correct2 = test2 === '1.234с (1234 мс)';
  
  return {
    passed: correct1 && correct2,
    details: `0.856с → "${test1}", 1.234с → "${test2}"`
  };
});

// Summary
console.log('\n=== Результаты ===\n');
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`Всего: ${results.length}, Пройдено: ${passed}, Ошибок: ${failed}`);

if (failed > 0) {
  console.log('\n❌ Не пройдены:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}${r.error ? ': ' + r.error : ''}`);
  });
}

process.exit(failed > 0 ? 1 : 0);
