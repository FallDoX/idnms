import Papa from 'papaparse';
import type { TripEntry, TripSummary, CSVFormat } from '../types.js';

// Parse old format date: "02.04.2026 09:33:15.123"
function parseOldDate(dateStr: string | unknown): number {
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
  } catch {
    return NaN;
  }
}

// Parse new format: date="2026-03-22", time="11:30:38.234"
function parseNewDate(dateStr: string | unknown, timeStr: string | unknown): number {
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
  } catch {
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

  const headers = Object.keys(result.data[0] as Record<string, unknown>);
  const format = detectFormat(headers);

  const parsed = (result.data as Record<string, unknown>[]).map((row) => {
    const entry: Partial<TripEntry> & { rawData?: Record<string, string | number> } = {};

    const parseOptional = (val: string | number | unknown): number | undefined => {
      if (val === "" || val === null || val === undefined) return undefined;
      const n = Number(val);
      return isNaN(n) ? undefined : n;
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
      entry.Mode = String(row.mode || '');
      entry.Alert = String(row.alert || '');
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
// Adaptive: higher limit when zoomed in (small time range)
export function downsample<T>(data: T[], limit: number = 2000, timeRange?: { start: number; end: number } | null): T[] {
  if (data.length <= limit) return data;
  
  // If zoomed in (viewing less than 30% of data), use higher limit for precision
  let adaptiveLimit = limit;
  if (timeRange && data.length > 0) {
    const dataStart = (data[0] as TripEntry).timestamp ?? 0;
    const dataEnd = (data[data.length - 1] as TripEntry).timestamp ?? dataStart;
    const totalRange = dataEnd - dataStart;
    const viewRange = timeRange.end - timeRange.start;
    
    if (totalRange > 0 && viewRange / totalRange < 0.3) {
      // Zoomed in - increase limit up to 2x for better precision
      adaptiveLimit = Math.min(limit * 2, 4000);
    }
  }
  
  const step = Math.ceil(data.length / adaptiveLimit);
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
  // Use proper time integration (trapezoidal rule) instead of simple average
  let consumptionPerKm = 0;
  if (totalDistance > 0 && movingEntries.length > 1) {
    // Calculate energy by integrating power over time
    let totalEnergyMovingWh = 0;
    for (let i = 1; i < movingEntries.length; i++) {
      const prev = movingEntries[i - 1];
      const curr = movingEntries[i];
      const dt = (curr.timestamp - prev.timestamp) / 1000 / 3600; // hours
      const avgPower = (prev.Power + curr.Power) / 2; // average power between points
      totalEnergyMovingWh += avgPower * dt;
    }
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
    maxTorque,
    maxPhaseCurrent,
    avgTemp,
    maxTemp,
    maxCurrent,
    consumptionPerKm,
  };
}

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
  gpsTeleportSpeedKmh: number;
  gpsTeleportDistanceM: number;
  gpsTeleportTimeS: number;
  stuckGpsPoints: number;
  distanceRollbackM: number;
}

export const defaultFilterConfig: DataFilterConfig = {
  enabled: true,
  limits: {
    Speed: { min: 0, max: 250 },
    Voltage: { min: 50, max: 300 },
    Current: { min: -50, max: 100 },
    Power: { min: -5000, max: 25000 },
    BatteryLevel: { min: 0, max: 100 },
    Temperature: { min: -20, max: 100 },
    PWM: { min: 0, max: 100 },
    GPSSpeed: { min: 0, max: 250 },
    PhaseCurrent: { min: 0, max: 300 },
    Torque: { min: 0, max: 200 },
    Temp2: { min: -20, max: 100 },
  },
  maxTimeGapSeconds: 10,
  gpsTeleportSpeedKmh: 300,
  gpsTeleportDistanceM: 500,
  gpsTeleportTimeS: 5,
  stuckGpsPoints: 10,
  distanceRollbackM: 10,
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

      // GPS teleportation check - use configurable thresholds
      if (entry.Latitude !== null && entry.Longitude !== null && 
          prevEntry.Latitude !== null && prevEntry.Longitude !== null) {
        const distance = haversineDistance(
          prevEntry.Latitude, prevEntry.Longitude,
          entry.Latitude, entry.Longitude
        );
        const timeGap = (entry.timestamp - prevEntry.timestamp) / 1000;
        
        if (timeGap > 0) {
          const speed = (distance / timeGap) * 3.6; // km/h
          
          // Teleportation: >config.gpsTeleportSpeedKmh km/h or >config.gpsTeleportDistanceM in <config.gpsTeleportTimeS
          if (speed > config.gpsTeleportSpeedKmh || (distance > config.gpsTeleportDistanceM && timeGap < config.gpsTeleportTimeS)) {
            issues.push(`GPS teleport ${distance.toFixed(0)}m in ${timeGap.toFixed(1)}s (${speed.toFixed(0)} km/h) at index ${index}`);
            removed++;
            return false;
          }
        }
      }

      // Stuck GPS detection (same coordinates) - configurable threshold
      if (entry.Latitude !== null && entry.Longitude !== null &&
          prevEntry.Latitude !== null && prevEntry.Longitude !== null) {
        if (entry.Latitude === prevEntry.Latitude && entry.Longitude === prevEntry.Longitude) {
          if (stuckStartIndex === null) stuckStartIndex = index - 1;
        } else {
          if (stuckStartIndex !== null && index - stuckStartIndex > config.stuckGpsPoints) {
            issues.push(`Stuck GPS for ${index - stuckStartIndex} points at index ${stuckStartIndex}`);
          }
          stuckStartIndex = null;
        }
      }

      // GPS distance backward check - configurable threshold
      if (entry.GPSDistance !== undefined && entry.GPSDistance !== null && 
          prevEntry.GPSDistance !== undefined && prevEntry.GPSDistance !== null) {
        if (entry.GPSDistance < prevEntry.GPSDistance - config.distanceRollbackM) {
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
