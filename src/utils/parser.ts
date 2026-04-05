import Papa from 'papaparse';
import type { TripEntry, TripSummary, AccelerationRun, AccelerationResult, SpeedThreshold, CSVFormat } from '../types.js';

// Parse old format date: "02.04.2026 09:33:15.123"
function parseOldDate(dateStr: any): number {
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

// Parse new format: date="2026-03-22", time="11:30:38.234"
function parseNewDate(dateStr: any, timeStr: any): number {
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

// Auto-detect CSV format
function detectFormat(headers: string[]): CSVFormat {
  if (headers.includes('date') && headers.includes('time') && headers.includes('phase_current')) {
    return 'new';
  }
  return 'old';
}

export function parseTripData(csv: string): TripEntry[] {
  const result = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (!result.data || result.data.length === 0) return [];

  const headers = Object.keys(result.data[0] as any);
  const format = detectFormat(headers);

  const parsed = (result.data as any[]).map((row) => {
    const entry: any = {};

    const parseOptional = (val: any) => {
      if (val === "" || val === null || val === undefined) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    if (format === 'new') {
      // New format parsing
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

      // Extended sensor fields
      entry.PhaseCurrent = parseOptional(row.phase_current);
      entry.Torque = parseOptional(row.torque);
      entry.Temp2 = parseOptional(row.temp2);
      entry.Distance = parseOptional(row.distance);
      entry.Mode = row.mode || '';
      entry.Alert = row.alert || '';
      entry.GPSHeading = parseOptional(row.gps_heading);
      entry.GPSDistance = parseOptional(row.gps_distance);

      // IMU/Orientation sensors
      entry.Tilt = parseOptional(row.tilt);
      entry.Roll = parseOptional(row.roll);
    } else {
      // Old format parsing
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

      // Old format IMU sensors (if present)
      entry.Pitch = parseOptional(row.Pitch);
      entry.Roll = parseOptional(row.Roll);
    }

    // Store raw data for dynamic metric discovery (exclude already parsed fields)
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

    return entry as TripEntry;
  }).filter(e => !isNaN(e.timestamp));

  return parsed.sort((a, b) => a.timestamp - b.timestamp);
}

// Simple LTTB or similar downsampling could be complex,
// let's use a simple nth point downsampling for UI performance
export function downsample<T>(data: T[], limit: number = 2000): T[] {
  if (data.length <= limit) return data;
  const step = Math.ceil(data.length / limit);
  const result: T[] = [];
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  return result;
}

export function calculateSummary(data: TripEntry[]): TripSummary {
  if (data.length === 0) {
    return { maxSpeed: 0, avgSpeed: 0, avgMovingSpeed: 0, movingDuration: 0, totalDistance: 0, avgPower: 0, maxPower: 0, batteryDrop: 0, duration: 0 };
  }

  const maxSpeed = Math.max(...data.map(e => e.Speed));
  const avgSpeed = data.reduce((acc, e) => acc + e.Speed, 0) / data.length;

  // Средняя скорость движения (только когда > 5 км/ч)
  const movingEntries = data.filter(e => e.Speed > 5);
  const avgMovingSpeed = movingEntries.length > 0
    ? movingEntries.reduce((acc, e) => acc + e.Speed, 0) / movingEntries.length
    : 0;
  const movingDuration = movingEntries.length >= 2
    ? movingEntries[movingEntries.length - 1].timestamp - movingEntries[0].timestamp
    : 0;

  // Distance calculation - convert from meters to km
  let totalDistance = 0;
  const validMileage = data.filter(e => e.TotalDistance > 0);
  if (validMileage.length > 1) {
    const distanceMeters = validMileage[validMileage.length - 1].TotalDistance - validMileage[0].TotalDistance;
    totalDistance = distanceMeters / 1000; // Convert to km
  }

  const avgPower = data.reduce((acc, e) => acc + e.Power, 0) / data.length;
  const maxPower = Math.max(...data.map(e => e.Power));

  const startBattery = data[0].BatteryLevel || 0;
  const endBattery = data[data.length - 1].BatteryLevel || 0;
  const batteryDrop = startBattery - endBattery;

  // Calculate maximum battery drop during the trip
  let maxBatteryDrop = 0;
  let peakBattery = data[0].BatteryLevel || 0;
  for (let i = 1; i < data.length; i++) {
    const currentBattery = data[i].BatteryLevel || 0;
    if (currentBattery > peakBattery) {
      peakBattery = currentBattery;
    } else {
      const drop = peakBattery - currentBattery;
      if (drop > maxBatteryDrop) {
        maxBatteryDrop = drop;
      }
    }
  }

  const duration = data[data.length - 1].timestamp - data[0].timestamp;

  // Temperature stats
  const temps = data.map(e => e.Temperature).filter(t => t > 0);
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;

  // New format metrics
  const torques = data.map(e => e.Torque).filter((t): t is number => t !== undefined && t !== null);
  const maxTorque = torques.length > 0 ? Math.max(...torques) : undefined;

  const phaseCurrents = data.map(e => e.PhaseCurrent).filter((p): p is number => p !== undefined && p !== null);
  const maxPhaseCurrent = phaseCurrents.length > 0 ? Math.max(...phaseCurrents) : undefined;

  // Calculate acceleration metrics
  const accelerationRuns = findAccelerationRuns(data);
  const best0to60 = calculateBestTimeForThreshold(data, 60, accelerationRuns);
  const peakAcc = calculatePeakAcceleration(data);

  const maxCurrent = Math.max(...data.map(e => e.Current || 0));

  // Calculate voltage drop (peak voltage to minimum under load)
  let batteryVoltageDrop = 0;
  if (data.length > 0) {
    const voltages = data.map(e => e.Voltage).filter(v => v > 0);
    if (voltages.length > 0) {
      const maxVoltage = Math.max(...voltages);
      const minVoltage = Math.min(...voltages);
      batteryVoltageDrop = maxVoltage - minVoltage;
    }
  }

  // Calculate consumption per km (Wh/km) - only during movement
  let consumptionPerKm = 0;
  if (totalDistance > 0 && movingEntries.length > 1) {
    // Use moving entries only (Speed > 5 km/h)
    const movingDurationHours = movingDuration / 1000 / 3600;
    const avgPowerMoving = movingEntries.reduce((acc, e) => acc + e.Power, 0) / movingEntries.length;
    const totalEnergyMovingWh = avgPowerMoving * movingDurationHours;
    consumptionPerKm = totalEnergyMovingWh / totalDistance;
  }

  return {
    maxSpeed,
    avgSpeed,
    avgMovingSpeed,
    movingDuration,
    totalDistance,
    avgPower,
    maxPower,
    batteryDrop,
    batteryDischarge: batteryDrop, // Alias for clarity
    batteryVoltageDrop,
    maxBatteryDrop,
    duration,
    best0to60,
    peakAcceleration: peakAcc,
    maxTorque,
    maxPhaseCurrent,
    avgTemp,
    maxTemp,
    maxCurrent,
    consumptionPerKm,
  };
}

/**
 * Находит все попытки разгона — для каждой точки где speed <= 5
 * смотрим вперёд и фиксируем время достижения каждого порога.
 */
export function findAccelerationRuns(data: TripEntry[]): AccelerationRun[] {
  const runs: AccelerationRun[] = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].Speed > 5) continue;

    const startTime = data[i].timestamp;
    let peakSpeed = data[i].Speed;
    let peakAcc = 0;
    let endIdx = i;

    // Смотрим вперёд максимум 120 секунд или 1000 точек
    for (let j = i + 1; j < Math.min(i + 1000, data.length); j++) {
      const dt = (data[j].timestamp - startTime) / 1000;
      if (dt > 120) break;

      if (data[j].Speed > peakSpeed) {
        peakSpeed = data[j].Speed;
        endIdx = j;
      }

      // Мгновенное ускорение
      if (j > 0) {
        const dtInst = (data[j].timestamp - data[j - 1].timestamp) / 1000;
        if (dtInst > 0) {
          const acc = (data[j].Speed - data[j - 1].Speed) / 3.6 / dtInst;
          if (acc > peakAcc) peakAcc = acc;
        }
      }
    }

    // Сохраняем если набрали > 20 км/ч, длительность >= 2 сек, среднее ускорение >= 1 м/с²
    const duration = (data[endIdx].timestamp - startTime) / 1000;
    const avgAcc = duration > 0 ? (peakSpeed - data[i].Speed) / 3.6 / duration : 0;
    
    // Пиковое ускорение может быть высоким для мощных систем (до 30 м/с² ≈ 3g)
    const MAX_PEAK_ACCEL = 35.0; // м/с², примерно 3.5g - разумный максимум
    
    if (peakSpeed > 20 && duration >= 2.0 && avgAcc >= 1.0 && peakAcc <= MAX_PEAK_ACCEL) {
      // Проверяем на разрывы времени между точками
      let hasTimeGap = false;
      for (let k = i; k < endIdx; k++) {
        if ((data[k + 1]?.timestamp - data[k]?.timestamp) > 2000) {
          hasTimeGap = true;
          break;
        }
      }
      
      if (!hasTimeGap) {
        const runData = data.slice(i, endIdx + 1);

        runs.push({
          startTime,
          endTime: data[endIdx].timestamp,
          duration,
          startSpeed: data[i].Speed,
          endSpeed: peakSpeed,
          avgAcceleration: avgAcc,
          peakAcceleration: peakAcc,
          dataPoints: runData,
        });
      }
    }
  }

  return runs;
}

/**
 * Находит лучшее время для достижения целевой скорости из всех попыток
 */
export function calculateBestTimeForThreshold(
  data: TripEntry[],
  targetSpeed: number,
  runs?: AccelerationRun[]
): number | null {
  const accelerationRuns = runs || findAccelerationRuns(data);

  let bestTime: number | null = null;

  for (const run of accelerationRuns) {
    if (run.startSpeed > 5) continue; // Пропускаем если начали не с нуля (допуск 5 км/ч)

    // Ищем момент достижения целевой скорости
    for (let i = 0; i < run.dataPoints.length; i++) {
      if (run.dataPoints[i].Speed >= targetSpeed) {
        const time = (run.dataPoints[i].timestamp - run.startTime) / 1000;

        if (bestTime === null || time < bestTime) {
          bestTime = time;
        }
        break; // Переходим к следующей попытке
      }
    }
  }

  return bestTime;
}

/**
 * Рассчитывает пиковое ускорение по всему логу (м/с²)
 */
function calculatePeakAcceleration(data: TripEntry[]): number {
  let peak = 0;
  for (let i = 1; i < data.length; i++) {
    const dt = (data[i].timestamp - data[i - 1].timestamp) / 1000;
    if (dt > 0) {
      const dv = (data[i].Speed - data[i - 1].Speed) / 3.6; // км/ч -> м/с
      const acc = dv / dt;
      if (acc > peak) peak = acc;
    }
  }
  return peak;
}

/**
 * Получает результаты ускорения для всех заданных порогов
 */
export function getAccelerationForThresholds(
  data: TripEntry[],
  thresholds: SpeedThreshold[]
): Record<string, AccelerationResult> {
  const runs = findAccelerationRuns(data);
  const results: Record<string, AccelerationResult> = {};

  for (const threshold of thresholds) {
    let bestTime: number | null = null;
    let bestRun: AccelerationRun | null = null;

    for (const run of runs) {
      if (run.startSpeed > 5) continue;

      for (let i = 0; i < run.dataPoints.length; i++) {
        if (run.dataPoints[i].Speed >= threshold.value) {
          const time = (run.dataPoints[i].timestamp - run.startTime) / 1000;

          if (bestTime === null || time < bestTime) {
            bestTime = time;
            bestRun = run;
          }
          break;
        }
      }
    }

    results[threshold.id] = {
      time: bestTime,
      timeMs: bestTime !== null ? Math.round(bestTime * 1000) : null,
      bestRun,
      allRuns: runs,
    };
  }

  return results;
}

/**
 * Пороги скорости по умолчанию
 */
export const defaultThresholds: SpeedThreshold[] = [
  { id: 't25', label: '0-25 км/ч', value: 25 },
  { id: 't60', label: '0-60 км/ч', value: 60 },
  { id: 't90', label: '0-90 км/ч', value: 90 },
  { id: 't100', label: '0-100 км/ч', value: 100 },
];

export interface DataFilterConfig {
  enabled: boolean;
  limits: {
    Speed: { min: number; max: number };
    Voltage: { min: number; max: number };
    Current: { min: number; max: number };
    Power: { min: number; max: number };
    BatteryLevel: { min: number; max: number };
    Temperature: { min: number; max: number };
    PWM: { min: number; max: number };
    GPSSpeed: { min: number; max: number };
    PhaseCurrent: { min: number; max: number };
    Torque: { min: number; max: number };
    Temp2: { min: number; max: number };
  };
  maxTimeGapSeconds: number;
}

export const defaultFilterConfig: DataFilterConfig = {
  enabled: true,
  limits: {
    Speed: { min: 0, max: 200 },
    Voltage: { min: 100, max: 180 },
    Current: { min: -50, max: 100 },
    Power: { min: -5000, max: 15000 },
    BatteryLevel: { min: 0, max: 100 },
    Temperature: { min: -20, max: 100 },
    PWM: { min: 0, max: 100 },
    GPSSpeed: { min: 0, max: 200 },
    PhaseCurrent: { min: 0, max: 200 },
    Torque: { min: 0, max: 200 },
    Temp2: { min: -20, max: 100 },
  },
  maxTimeGapSeconds: 10,
};

export function filterData(data: TripEntry[], config: DataFilterConfig = defaultFilterConfig): { filtered: TripEntry[]; removed: number; issues: string[] } {
  if (!config.enabled) {
    return { filtered: data, removed: 0, issues: [] };
  }

  // Haversine distance calculation
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const issues: string[] = [];
  let removed = 0;
  let stuckStartIndex: number | null = null;

  const filtered = data.filter((entry, index) => {
    // Skip entries with missing critical data
    if (entry.timestamp === undefined || entry.timestamp === null) {
      issues.push(`Missing timestamp at index ${index}`);
      removed++;
      return false;
    }

    // Check time gaps (except for first entry)
    if (index > 0) {
      const prevEntry = data[index - 1];
      const timeGap = (entry.timestamp - prevEntry.timestamp) / 1000;
      if (timeGap > config.maxTimeGapSeconds) {
        issues.push(`Time gap ${timeGap.toFixed(1)}s at index ${index}`);
        removed++;
        return false;
      }

      // GPS teleportation check
      if (entry.Latitude !== null && entry.Longitude !== null && 
          prevEntry.Latitude !== null && prevEntry.Longitude !== null) {
        const distance = haversineDistance(
          prevEntry.Latitude, prevEntry.Longitude,
          entry.Latitude, entry.Longitude
        );
        const timeGap = (entry.timestamp - prevEntry.timestamp) / 1000;
        
        if (timeGap > 0) {
          const speed = (distance / timeGap) * 3.6; // km/h
          
          // Teleportation: >200 km/h or >500m in <5s
          if (speed > 200 || (distance > 500 && timeGap < 5)) {
            issues.push(`GPS teleport ${distance.toFixed(0)}m in ${timeGap.toFixed(1)}s (${speed.toFixed(0)} km/h) at index ${index}`);
            removed++;
            return false;
          }
        }
      }

      // Stuck GPS detection (same coordinates)
      if (entry.Latitude !== null && entry.Longitude !== null &&
          prevEntry.Latitude !== null && prevEntry.Longitude !== null) {
        if (entry.Latitude === prevEntry.Latitude && entry.Longitude === prevEntry.Longitude) {
          if (stuckStartIndex === null) stuckStartIndex = index - 1;
        } else {
          if (stuckStartIndex !== null && index - stuckStartIndex > 10) {
            issues.push(`Stuck GPS for ${index - stuckStartIndex} points at index ${stuckStartIndex}`);
          }
          stuckStartIndex = null;
        }
      }

      // GPS distance backward check
      if (entry.GPSDistance !== undefined && entry.GPSDistance !== null && 
          prevEntry.GPSDistance !== undefined && prevEntry.GPSDistance !== null) {
        if (entry.GPSDistance < prevEntry.GPSDistance - 10) { // Decreased by >10m
          issues.push(`GPS distance rollback ${prevEntry.GPSDistance.toFixed(0)}→${entry.GPSDistance.toFixed(0)}m at index ${index}`);
          removed++;
          return false;
        }
      }
    }

    // Check value limits (only for clearly impossible values)
    const checks: Array<{ field: string; value: number | null | undefined; limit: { min: number; max: number }; optional?: boolean }> = [
      { field: 'Speed', value: entry.Speed, limit: config.limits.Speed },
      { field: 'Voltage', value: entry.Voltage, limit: config.limits.Voltage },
      { field: 'BatteryLevel', value: entry.BatteryLevel, limit: config.limits.BatteryLevel },
      { field: 'Temperature', value: entry.Temperature, limit: config.limits.Temperature },
      { field: 'PWM', value: entry.PWM, limit: config.limits.PWM },
      { field: 'GPSSpeed', value: entry.GPSSpeed, limit: config.limits.GPSSpeed, optional: true },
      { field: 'Temp2', value: entry.Temp2, limit: config.limits.Temp2, optional: true },
      // Note: Power, Current, PhaseCurrent, Torque limits removed - high-power systems can have realistic values >15kW, >100A
    ];

    for (const check of checks) {
      if (check.value === undefined || check.value === null) {
        if (!check.optional) {
          issues.push(`Missing ${check.field} at index ${index}`);
          removed++;
          return false;
        }
        continue;
      }

      if (check.value < check.limit.min || check.value > check.limit.max) {
        issues.push(`${check.field}=${check.value} out of range [${check.limit.min}..${check.limit.max}] at index ${index}`);
        removed++;
        return false;
      }
    }

    return true;
  });

  // Report remaining stuck GPS at end
  if (stuckStartIndex !== null && data.length - stuckStartIndex > 10) {
    issues.push(`Stuck GPS for ${data.length - stuckStartIndex} points at end`);
  }

  return { filtered, removed, issues };
}
