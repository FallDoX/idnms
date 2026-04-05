import Papa from 'papaparse';
import type { TripEntry, TripSummary, AccelerationRun, AccelerationResult, SpeedThreshold, CSVFormat } from '../types';

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

      // New format only fields
      entry.PhaseCurrent = parseOptional(row.phase_current);
      entry.Torque = parseOptional(row.torque);
      entry.Temp2 = parseOptional(row.temp2);
      entry.Distance = parseOptional(row.distance);
      entry.Mode = row.mode || '';
      entry.Alert = row.alert || '';
      entry.GPSHeading = parseOptional(row.gps_heading);
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

  // Distance calculation
  let totalDistance = 0;
  const validMileage = data.filter(e => e.TotalDistance > 0);
  if (validMileage.length > 1) {
    totalDistance = validMileage[validMileage.length - 1].TotalDistance - validMileage[0].TotalDistance;
  }

  const avgPower = data.reduce((acc, e) => acc + e.Power, 0) / data.length;
  const maxPower = Math.max(...data.map(e => e.Power));

  const startBattery = data[0].BatteryLevel || 0;
  const endBattery = data[data.length - 1].BatteryLevel || 0;
  const batteryDrop = startBattery - endBattery;

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

  return {
    maxSpeed,
    avgSpeed,
    avgMovingSpeed,
    movingDuration,
    totalDistance,
    avgPower,
    maxPower,
    batteryDrop,
    duration,
    best0to60,
    peakAcceleration: peakAcc,
    maxTorque,
    maxPhaseCurrent,
    avgTemp,
    maxTemp,
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

    // Смотрим вперёд максимум 60 секунд или 500 точек
    for (let j = i + 1; j < Math.min(i + 500, data.length); j++) {
      const dt = (data[j].timestamp - startTime) / 1000;
      if (dt > 60) break;

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

    // Сохраняем если набрали > 20 км/ч
    if (peakSpeed > 20) {
      const runData = data.slice(i, endIdx + 1);
      const duration = (data[endIdx].timestamp - startTime) / 1000;
      const avgAcc = duration > 0 ? (peakSpeed - data[i].Speed) / 3.6 / duration : 0;

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
