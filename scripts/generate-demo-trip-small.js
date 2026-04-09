// Generate a small 20-minute demo trip CSV file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startDate = new Date('2026-04-10T08:00:00');
const durationMinutes = 20;
const intervalMs = 200; // 200ms between samples (5 samples per second)

// Starting position (Moscow coordinates)
let lat = 55.7558;
let lon = 37.6173;
let heading = 45; // Northeast
let totalDistance = 0;
let distance = 0;

// Starting values
let batteryLevel = 100;
let voltage = 163.0;
let systemTemp = 25;
let temp2 = 20;

// Generate trip segments: [durationMin, avgSpeedKmh, description]
// Multiple acceleration attempts for each threshold to demonstrate comparison chart
const segments = [
  { duration: 2, avgSpeed: 0, description: 'Idle at start' },
  // Multiple 0-25 km/h attempts with different durations
  { duration: 1, avgSpeed: 25, description: '0-25 attempt 1 (fast)' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 1.5, avgSpeed: 25, description: '0-25 attempt 2 (slower)' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 1.2, avgSpeed: 25, description: '0-25 attempt 3' },
  { duration: 2, avgSpeed: 0, description: 'Stop at traffic light' },
  // Multiple 0-60 km/h attempts
  { duration: 2, avgSpeed: 60, description: '0-60 attempt 1 (fast)' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 2.5, avgSpeed: 60, description: '0-60 attempt 2 (slower)' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 2.2, avgSpeed: 60, description: '0-60 attempt 3' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 2.8, avgSpeed: 60, description: '0-60 attempt 4 (slowest)' },
  { duration: 2, avgSpeed: 0, description: 'Coffee break' },
  // Multiple 0-90 km/h attempts
  { duration: 3, avgSpeed: 90, description: '0-90 attempt 1 (fast)' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 3.5, avgSpeed: 90, description: '0-90 attempt 2 (slower)' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 3.2, avgSpeed: 90, description: '0-90 attempt 3' },
  { duration: 2, avgSpeed: 0, description: 'Rest stop' },
  // Multiple 0-40 km/h attempts
  { duration: 1.5, avgSpeed: 40, description: '0-40 attempt 1' },
  { duration: 1, avgSpeed: 0, description: 'Stop' },
  { duration: 1.8, avgSpeed: 40, description: '0-40 attempt 2' },
  { duration: 2, avgSpeed: 0, description: 'Stop' },
  { duration: 1.3, avgSpeed: 40, description: '0-40 attempt 3' },
  { duration: 2, avgSpeed: 0, description: 'Stop' },
  { duration: 3, avgSpeed: 30, description: 'Final acceleration 0-30 km/h' },
  { duration: 2, avgSpeed: 0, description: 'End idle' },
];

const header = 'date,time,latitude,longitude,gps_speed,gps_alt,gps_heading,gps_distance,speed,voltage,phase_current,current,power,torque,pwm,battery_level,distance,totaldistance,system_temp,temp2,tilt,roll,mode,alert\n';

let csv = header;
let currentTime = new Date(startDate);

let currentSegmentIndex = 0;
let segmentStartTime = new Date(currentTime);

function addNoise(value, percent) {
  const noise = (Math.random() - 0.5) * 2 * (value * percent / 100);
  return Math.max(0, value + noise);
}

function updatePosition(speedKmh, dtSeconds) {
  if (speedKmh < 1) return;
  
  const speedMs = speedKmh / 3.6;
  const distanceM = speedMs * dtSeconds;
  
  // Move in current heading direction
  const headingRad = heading * Math.PI / 180;
  const dLat = (distanceM / 6371000) * Math.cos(headingRad);
  const dLon = (distanceM / 6371000) * Math.sin(headingRad) / Math.cos(lat * Math.PI / 180);
  
  lat += dLat;
  lon += dLon;
  
  // Gradually change heading
  heading += (Math.random() - 0.5) * 5;
  if (heading < 0) heading += 360;
  if (heading >= 360) heading -= 360;
  
  distance += distanceM;
  totalDistance += distanceM;
}

let sampleCount = 0;
const totalSamples = (durationMinutes * 60 * 1000) / intervalMs;

let currentSpeed = 0;
let targetSpeed = 0;
let speedChangeRate = 0; // km/h per second

while (sampleCount < totalSamples) {
  const segment = segments[currentSegmentIndex];
  const segmentElapsed = (currentTime - segmentStartTime) / 1000 / 60; // minutes
  
  if (segmentElapsed >= segment.duration) {
    currentSegmentIndex = (currentSegmentIndex + 1) % segments.length;
    segmentStartTime = new Date(currentTime);
    const newSegment = segments[currentSegmentIndex];
    targetSpeed = newSegment.avgSpeed;
    
    // Calculate acceleration/deceleration rate (gradual change over 3 seconds for demo)
    const speedDiff = targetSpeed - currentSpeed;
    speedChangeRate = speedDiff / 3; // Change over 3 seconds
  }
  
  // Gradually change speed towards target
  const dtSeconds = intervalMs / 1000;
  if (Math.abs(currentSpeed - targetSpeed) > 0.5) {
    currentSpeed += speedChangeRate * dtSeconds;
    // Don't overshoot
    if (speedChangeRate > 0 && currentSpeed > targetSpeed) {
      currentSpeed = targetSpeed;
    } else if (speedChangeRate < 0 && currentSpeed < targetSpeed) {
      currentSpeed = targetSpeed;
    }
  }
  
  const speedNoise = addNoise(currentSpeed, 5);
  const speed = Math.max(0, speedNoise);
  
  // Calculate power based on speed
  const basePower = speed > 0 ? speed * 50 : 50; // Base power for idle
  const power = addNoise(basePower, 30);
  
  // Calculate current from power and voltage
  const current = power / voltage;
  
  // Calculate phase current (roughly 2x current)
  const phaseCurrent = current * 2 + addNoise(0, 10);
  
  // Calculate PWM based on speed
  const pwm = speed > 0 ? Math.min(100, (speed / 50) * 100) : 5;
  
  // Update battery level (drains faster at higher power)
  batteryLevel -= (power / 1000000) * (intervalMs / 1000) * 60;
  batteryLevel = Math.max(0, batteryLevel);
  
  // Voltage drops as battery drains
  voltage = 163 - (100 - batteryLevel) * 0.3 + addNoise(0, 1);
  
  // Temperature rises with power
  const targetTemp = 25 + (power / 5000) * 20;
  systemTemp += (targetTemp - systemTemp) * 0.01 + addNoise(0, 2);
  temp2 = systemTemp - 5 + addNoise(0, 3);
  
  // GPS speed matches wheel speed with some noise
  const gpsSpeed = addNoise(speed, 5);
  
  // GPS altitude varies slightly
  const gpsAlt = 150 + addNoise(0, 10);
  
  // Update position
  updatePosition(speed, intervalMs / 1000);
  
  // Format date and time
  const dateStr = currentTime.toISOString().split('T')[0];
  const timeStr = currentTime.toISOString().split('T')[1].replace('Z', '');
  
  // Generate CSV row
  const row = [
    dateStr,
    timeStr,
    lat.toFixed(8),
    lon.toFixed(8),
    gpsSpeed.toFixed(6),
    gpsAlt.toFixed(6),
    heading.toFixed(1),
    totalDistance.toFixed(0),
    speed.toFixed(2),
    voltage.toFixed(2),
    phaseCurrent.toFixed(2),
    current.toFixed(2),
    power.toFixed(2),
    (speed * 0.5).toFixed(2), // torque estimate
    pwm.toFixed(0),
    batteryLevel.toFixed(0),
    distance.toFixed(0),
    totalDistance.toFixed(0),
    systemTemp.toFixed(0),
    temp2.toFixed(0),
    '0.00',
    '0.00',
    '',
    ''
  ].join(',');
  
  csv += row + '\n';
  
  currentTime = new Date(currentTime.getTime() + intervalMs);
  sampleCount++;
  
  if (sampleCount % 10000 === 0) {
    console.log(`Generated ${sampleCount} samples (${(sampleCount / totalSamples * 100).toFixed(1)}%)`);
  }
}

const outputPath = path.join(__dirname, '..', 'public', 'demo-trip-small.csv');
fs.writeFileSync(outputPath, csv);
console.log(`\nGenerated ${sampleCount} samples over ${durationMinutes} minutes`);
console.log(`Output saved to: ${outputPath}`);
console.log(`File size: ${(csv.length / 1024 / 1024).toFixed(2)} MB`);
