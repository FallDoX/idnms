import Papa from 'papaparse';
function parseOldDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string')
        return NaN;
    try {
        const trimmed = dateStr.trim();
        const parts = trimmed.split(' ');
        if (parts.length < 2)
            return NaN;
        const [datePart, timePart] = parts;
        const dateParts = datePart.split('.');
        if (dateParts.length < 3)
            return NaN;
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        const timeParts = timePart.split(':');
        if (timeParts.length < 3)
            return NaN;
        const hour = parseInt(timeParts[0]);
        const min = parseInt(timeParts[1]);
        const secParts = timeParts[2].split('.');
        const sec = parseInt(secParts[0]);
        const ms = secParts.length > 1 ? parseInt(secParts[1]) : 0;
        return new Date(year, month - 1, day, hour, min, sec, ms).getTime();
    }
    catch (e) {
        return NaN;
    }
}
function parseNewDate(dateStr, timeStr) {
    try {
        const datePart = String(dateStr).trim();
        const timePart = String(timeStr).trim();
        const dateParts = datePart.split('-');
        if (dateParts.length < 3)
            return NaN;
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]);
        const day = parseInt(dateParts[2]);
        const timeParts = timePart.split(':');
        if (timeParts.length < 2)
            return NaN;
        const hour = parseInt(timeParts[0]);
        const min = parseInt(timeParts[1]);
        const secParts = timeParts[2]?.split('.') || ['0', '0'];
        const sec = parseInt(secParts[0]);
        const ms = secParts.length > 1 ? parseInt(secParts[1].padEnd(3, '0').substring(0, 3)) : 0;
        return new Date(year, month - 1, day, hour, min, sec, ms).getTime();
    }
    catch (e) {
        return NaN;
    }
}
function detectFormat(headers) {
    if (headers.includes('date') && headers.includes('time') && headers.includes('phase_current')) {
        return 'new';
    }
    return 'old';
}
export function parseTripData(csv) {
    const result = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    if (!result.data || result.data.length === 0)
        return [];
    const headers = Object.keys(result.data[0]);
    const format = detectFormat(headers);
    const parsed = result.data.map((row) => {
        const entry = {};
        const parseOptional = (val) => {
            if (val === "" || val === null || val === undefined)
                return null;
            const n = Number(val);
            return isNaN(n) ? null : n;
        };
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
        }
        else {
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
export function downsample(data, limit = 2000) {
    if (data.length <= limit)
        return data;
    const step = Math.ceil(data.length / limit);
    const result = [];
    for (let i = 0; i < data.length; i += step) {
        result.push(data[i]);
    }
    return result;
}
export function calculateSummary(data) {
    if (data.length === 0) {
        return { maxSpeed: 0, avgSpeed: 0, avgMovingSpeed: 0, movingDuration: 0, totalDistance: 0, avgPower: 0, maxPower: 0, batteryDrop: 0, duration: 0 };
    }
    const maxSpeed = Math.max(...data.map(e => e.Speed));
    const avgSpeed = data.reduce((acc, e) => acc + e.Speed, 0) / data.length;
    const movingEntries = data.filter(e => e.Speed > 5);
    const avgMovingSpeed = movingEntries.length > 0
        ? movingEntries.reduce((acc, e) => acc + e.Speed, 0) / movingEntries.length
        : 0;
    const movingDuration = movingEntries.length >= 2
        ? movingEntries[movingEntries.length - 1].timestamp - movingEntries[0].timestamp
        : 0;
    let totalDistance = 0;
    const validMileage = data.filter(e => e.TotalDistance > 0);
    if (validMileage.length > 1) {
        const distanceMeters = validMileage[validMileage.length - 1].TotalDistance - validMileage[0].TotalDistance;
        totalDistance = distanceMeters / 1000;
    }
    const avgPower = data.reduce((acc, e) => acc + e.Power, 0) / data.length;
    const maxPower = Math.max(...data.map(e => e.Power));
    const startBattery = data[0].BatteryLevel || 0;
    const endBattery = data[data.length - 1].BatteryLevel || 0;
    const batteryDrop = startBattery - endBattery;
    let maxBatteryDrop = 0;
    let peakBattery = data[0].BatteryLevel || 0;
    for (let i = 1; i < data.length; i++) {
        const currentBattery = data[i].BatteryLevel || 0;
        if (currentBattery > peakBattery) {
            peakBattery = currentBattery;
        }
        else {
            const drop = peakBattery - currentBattery;
            if (drop > maxBatteryDrop) {
                maxBatteryDrop = drop;
            }
        }
    }
    const duration = data[data.length - 1].timestamp - data[0].timestamp;
    const temps = data.map(e => e.Temperature).filter(t => t > 0);
    const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 0;
    const torques = data.map(e => e.Torque).filter((t) => t !== undefined && t !== null);
    const maxTorque = torques.length > 0 ? Math.max(...torques) : undefined;
    const phaseCurrents = data.map(e => e.PhaseCurrent).filter((p) => p !== undefined && p !== null);
    const maxPhaseCurrent = phaseCurrents.length > 0 ? Math.max(...phaseCurrents) : undefined;
    const accelerationRuns = findAccelerationRuns(data);
    const best0to60 = calculateBestTimeForThreshold(data, 60, accelerationRuns);
    const peakAcc = calculatePeakAcceleration(data);
    const maxCurrent = Math.max(...data.map(e => e.Current || 0));
    let consumptionPerKm = 0;
    if (totalDistance > 0 && data.length > 1) {
        const tripDurationHours = (data[data.length - 1].timestamp - data[0].timestamp) / 1000 / 3600;
        const avgPowerConsumption = data.reduce((acc, e) => acc + (e.Power > 0 ? e.Power : 0), 0) / data.length;
        const totalEnergyWh = avgPowerConsumption * tripDurationHours;
        consumptionPerKm = totalEnergyWh / totalDistance;
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
export function findAccelerationRuns(data) {
    const runs = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].Speed > 5)
            continue;
        const startTime = data[i].timestamp;
        let peakSpeed = data[i].Speed;
        let peakAcc = 0;
        let endIdx = i;
        for (let j = i + 1; j < Math.min(i + 1000, data.length); j++) {
            const dt = (data[j].timestamp - startTime) / 1000;
            if (dt > 120)
                break;
            if (data[j].Speed > peakSpeed) {
                peakSpeed = data[j].Speed;
                endIdx = j;
            }
            if (j > 0) {
                const dtInst = (data[j].timestamp - data[j - 1].timestamp) / 1000;
                if (dtInst > 0) {
                    const acc = (data[j].Speed - data[j - 1].Speed) / 3.6 / dtInst;
                    if (acc > peakAcc)
                        peakAcc = acc;
                }
            }
        }
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
export function calculateBestTimeForThreshold(data, targetSpeed, runs) {
    const accelerationRuns = runs || findAccelerationRuns(data);
    let bestTime = null;
    for (const run of accelerationRuns) {
        if (run.startSpeed > 5)
            continue;
        for (let i = 0; i < run.dataPoints.length; i++) {
            if (run.dataPoints[i].Speed >= targetSpeed) {
                const time = (run.dataPoints[i].timestamp - run.startTime) / 1000;
                if (bestTime === null || time < bestTime) {
                    bestTime = time;
                }
                break;
            }
        }
    }
    return bestTime;
}
function calculatePeakAcceleration(data) {
    let peak = 0;
    for (let i = 1; i < data.length; i++) {
        const dt = (data[i].timestamp - data[i - 1].timestamp) / 1000;
        if (dt > 0) {
            const dv = (data[i].Speed - data[i - 1].Speed) / 3.6;
            const acc = dv / dt;
            if (acc > peak)
                peak = acc;
        }
    }
    return peak;
}
export function getAccelerationForThresholds(data, thresholds) {
    const runs = findAccelerationRuns(data);
    const results = {};
    for (const threshold of thresholds) {
        let bestTime = null;
        let bestRun = null;
        for (const run of runs) {
            if (run.startSpeed > 5)
                continue;
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
export const defaultThresholds = [
    { id: 't25', label: '0-25 км/ч', value: 25 },
    { id: 't60', label: '0-60 км/ч', value: 60 },
    { id: 't90', label: '0-90 км/ч', value: 90 },
    { id: 't100', label: '0-100 км/ч', value: 100 },
];
export const defaultFilterConfig = {
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
export function filterData(data, config = defaultFilterConfig) {
    if (!config.enabled) {
        return { filtered: data, removed: 0, issues: [] };
    }
    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const toRad = (deg) => deg * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const issues = [];
    let removed = 0;
    let stuckStartIndex = null;
    const filtered = data.filter((entry, index) => {
        if (entry.timestamp === undefined || entry.timestamp === null) {
            issues.push(`Missing timestamp at index ${index}`);
            removed++;
            return false;
        }
        if (index > 0) {
            const prevEntry = data[index - 1];
            const timeGap = (entry.timestamp - prevEntry.timestamp) / 1000;
            if (timeGap > config.maxTimeGapSeconds) {
                issues.push(`Time gap ${timeGap.toFixed(1)}s at index ${index}`);
                removed++;
                return false;
            }
            if (entry.Latitude !== null && entry.Longitude !== null &&
                prevEntry.Latitude !== null && prevEntry.Longitude !== null) {
                const distance = haversineDistance(prevEntry.Latitude, prevEntry.Longitude, entry.Latitude, entry.Longitude);
                const timeGap = (entry.timestamp - prevEntry.timestamp) / 1000;
                if (timeGap > 0) {
                    const speed = (distance / timeGap) * 3.6;
                    if (speed > 200 || (distance > 500 && timeGap < 5)) {
                        issues.push(`GPS teleport ${distance.toFixed(0)}m in ${timeGap.toFixed(1)}s (${speed.toFixed(0)} km/h) at index ${index}`);
                        removed++;
                        return false;
                    }
                }
            }
            if (entry.Latitude !== null && entry.Longitude !== null &&
                prevEntry.Latitude !== null && prevEntry.Longitude !== null) {
                if (entry.Latitude === prevEntry.Latitude && entry.Longitude === prevEntry.Longitude) {
                    if (stuckStartIndex === null)
                        stuckStartIndex = index - 1;
                }
                else {
                    if (stuckStartIndex !== null && index - stuckStartIndex > 10) {
                        issues.push(`Stuck GPS for ${index - stuckStartIndex} points at index ${stuckStartIndex}`);
                    }
                    stuckStartIndex = null;
                }
            }
            if (entry.GPSDistance !== undefined && entry.GPSDistance !== null &&
                prevEntry.GPSDistance !== undefined && prevEntry.GPSDistance !== null) {
                if (entry.GPSDistance < prevEntry.GPSDistance - 10) {
                    issues.push(`GPS distance rollback ${prevEntry.GPSDistance.toFixed(0)}→${entry.GPSDistance.toFixed(0)}m at index ${index}`);
                    removed++;
                    return false;
                }
            }
        }
        const checks = [
            { field: 'Speed', value: entry.Speed, limit: config.limits.Speed },
            { field: 'Voltage', value: entry.Voltage, limit: config.limits.Voltage },
            { field: 'BatteryLevel', value: entry.BatteryLevel, limit: config.limits.BatteryLevel },
            { field: 'Temperature', value: entry.Temperature, limit: config.limits.Temperature },
            { field: 'PWM', value: entry.PWM, limit: config.limits.PWM },
            { field: 'GPSSpeed', value: entry.GPSSpeed, limit: config.limits.GPSSpeed, optional: true },
            { field: 'Temp2', value: entry.Temp2, limit: config.limits.Temp2, optional: true },
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
    if (stuckStartIndex !== null && data.length - stuckStartIndex > 10) {
        issues.push(`Stuck GPS for ${data.length - stuckStartIndex} points at end`);
    }
    return { filtered, removed, issues };
}
//# sourceMappingURL=parser.js.map