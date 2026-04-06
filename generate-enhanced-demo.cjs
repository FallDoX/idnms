// Generate enhanced demo trip data with multiple drag races
const fs = require('fs');

const header = 'date,time,speed,voltage,current,power,battery_level,totaldistance,system_temp,pwm,gps_speed,latitude,longitude,gps_alt,phase_current,torque,temp2,distance,mode,alert,gps_heading,gps_distance,tilt,roll';

function formatTime(date) {
  return date.toTimeString().split(' ')[0] + '.' + String(date.getMilliseconds()).padStart(3, '0');
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateDragRace(startTime, startSpeed, targetSpeed, pwmLimit, startDistance, startLat, startLon) {
  const entries = [];
  let currentTime = new Date(startTime);
  let speed = startSpeed;
  let distance = startDistance;
  let lat = startLat;
  let lon = startLon;
  
  // Generate acceleration phase
  const accelerationTime = (targetSpeed - startSpeed) * 0.04; // ~40ms per km/h
  const steps = Math.ceil(accelerationTime * 10); // 100ms steps
  
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    speed = startSpeed + (targetSpeed - startSpeed) * progress;
    
    // PWM increases then hits limit
    const pwm = Math.min(95, progress * 120);
    
    // Power increases with speed and PWM
    const power = Math.min(8000, speed * 80 + pwm * 20 + Math.random() * 200);
    const voltage = 126.5 - speed * 0.05 - power * 0.001;
    const current = power / voltage;
    const phaseCurrent = current * 1.5;
    const torque = power / Math.max(speed, 1) * 0.5;
    
    distance += speed * 0.0278 * 0.1; // 100ms at current speed
    lat += 0.00001 * speed * 0.1;
    lon += 0.00002 * speed * 0.1;
    
    entries.push({
      date: formatDate(currentTime),
      time: formatTime(currentTime),
      speed: Math.round(speed),
      voltage: voltage.toFixed(1),
      current: current.toFixed(1),
      power: Math.round(power),
      battery_level: (100 - distance * 0.002).toFixed(1),
      totaldistance: (12345.2 + distance).toFixed(1),
      system_temp: Math.round(25 + power * 0.003),
      pwm: Math.round(pwm),
      gps_speed: (speed * 0.95).toFixed(1),
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      gps_alt: 156,
      phase_current: phaseCurrent.toFixed(1),
      torque: torque.toFixed(1),
      temp2: Math.round(24 + power * 0.002),
      distance: distance.toFixed(1),
      mode: 'Riding',
      alert: '',
      gps_heading: Math.round(speed * 2),
      gps_distance: (12345.2 + distance).toFixed(1),
      tilt: -2,
      roll: 1
    });
    
    currentTime = new Date(currentTime.getTime() + 100); // 100ms steps
  }
  
  // Add a few cruising entries at target speed
  for (let i = 0; i < 5; i++) {
    const power = speed * 30 + Math.random() * 100;
    const voltage = 126.5 - speed * 0.05;
    const current = power / voltage;
    
    distance += speed * 0.0278 * 0.1;
    lat += 0.00001 * speed * 0.1;
    lon += 0.00002 * speed * 0.1;
    
    entries.push({
      date: formatDate(currentTime),
      time: formatTime(currentTime),
      speed: Math.round(speed),
      voltage: voltage.toFixed(1),
      current: current.toFixed(1),
      power: Math.round(power),
      battery_level: (100 - distance * 0.002).toFixed(1),
      totaldistance: (12345.2 + distance).toFixed(1),
      system_temp: Math.round(25 + power * 0.003),
      pwm: Math.round(40 + speed * 0.5),
      gps_speed: (speed * 0.95).toFixed(1),
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      gps_alt: 156,
      phase_current: (current * 1.3).toFixed(1),
      torque: (power / speed * 0.3).toFixed(1),
      temp2: Math.round(24 + power * 0.002),
      distance: distance.toFixed(1),
      mode: 'Riding',
      alert: '',
      gps_heading: Math.round(speed * 2),
      gps_distance: (12345.2 + distance).toFixed(1),
      tilt: -2,
      roll: 1
    });
    
    currentTime = new Date(currentTime.getTime() + 100);
  }
  
  return { entries, finalTime: currentTime, finalDistance: distance, finalLat: lat, finalLon: lon };
}

function generateDeceleration(startTime, startSpeed, startDistance, startLat, startLon) {
  const entries = [];
  let currentTime = new Date(startTime);
  let speed = startSpeed;
  let distance = startDistance;
  let lat = startLat;
  let lon = startLon;
  
  // Decelerate to stop
  while (speed > 0) {
    speed = Math.max(0, speed - 2);
    
    const power = speed * 10 + Math.random() * 50;
    const voltage = 126.5 - speed * 0.05;
    const current = power / voltage;
    
    distance += speed * 0.0278 * 0.1;
    lat += 0.00001 * speed * 0.1;
    lon += 0.00002 * speed * 0.1;
    
    entries.push({
      date: formatDate(currentTime),
      time: formatTime(currentTime),
      speed: Math.round(speed),
      voltage: voltage.toFixed(1),
      current: current.toFixed(1),
      power: Math.round(power),
      battery_level: (100 - distance * 0.002).toFixed(1),
      totaldistance: (12345.2 + distance).toFixed(1),
      system_temp: Math.round(25 + power * 0.003),
      pwm: Math.round(speed * 0.3),
      gps_speed: (speed * 0.95).toFixed(1),
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      gps_alt: 156,
      phase_current: (current * 1.2).toFixed(1),
      torque: (power / Math.max(speed, 1) * 0.2).toFixed(1),
      temp2: Math.round(24 + power * 0.002),
      distance: distance.toFixed(1),
      mode: speed > 3 ? 'Riding' : 'Standby',
      alert: '',
      gps_heading: Math.round(speed * 2),
      gps_distance: (12345.2 + distance).toFixed(1),
      tilt: -2,
      roll: 1
    });
    
    currentTime = new Date(currentTime.getTime() + 100);
  }
  
  // Standby for a few seconds
  for (let i = 0; i < 30; i++) {
    entries.push({
      date: formatDate(currentTime),
      time: formatTime(currentTime),
      speed: 0,
      voltage: '126.5',
      current: '0',
      power: 0,
      battery_level: (100 - distance * 0.002).toFixed(1),
      totaldistance: (12345.2 + distance).toFixed(1),
      system_temp: 25,
      pwm: 0,
      gps_speed: '0',
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      gps_alt: 156,
      phase_current: '0',
      torque: '0',
      temp2: 24,
      distance: distance.toFixed(1),
      mode: 'Standby',
      alert: '',
      gps_heading: 0,
      gps_distance: (12345.2 + distance).toFixed(1),
      tilt: 0,
      roll: 0
    });
    
    currentTime = new Date(currentTime.getTime() + 100);
  }
  
  return { entries, finalTime: currentTime, finalDistance: distance, finalLat: lat, finalLon: lon };
}

// Generate the trip
let allEntries = [];
let currentTime = new Date('2026-04-05T10:00:00');
let distance = 0;
let lat = 55.7558;
let lon = 37.6173;

// 5 drag races to different speeds with PWM limit
const races = [
  { startSpeed: 0, targetSpeed: 60, pwmLimit: 95 },   // 0-60
  { startSpeed: 0, targetSpeed: 50, pwmLimit: 90 },   // 0-50
  { startSpeed: 0, targetSpeed: 70, pwmLimit: 95 },   // 0-70
  { startSpeed: 0, targetSpeed: 40, pwmLimit: 85 },   // 0-40
  { startSpeed: 0, targetSpeed: 55, pwmLimit: 92 },    // 0-55
];

races.forEach((race, index) => {
  console.log(`Generating race ${index + 1}: 0-${race.targetSpeed} km/h`);
  
  // Drag race
  const raceResult = generateDragRace(
    currentTime, 
    race.startSpeed, 
    race.targetSpeed, 
    race.pwmLimit,
    distance,
    lat,
    lon
  );
  
  allEntries = allEntries.concat(raceResult.entries);
  currentTime = raceResult.finalTime;
  distance = raceResult.finalDistance;
  lat = raceResult.finalLat;
  lon = raceResult.finalLon;
  
  // Decelerate and wait
  const stopResult = generateDeceleration(currentTime, race.targetSpeed, distance, lat, lon);
  allEntries = allEntries.concat(stopResult.entries);
  currentTime = stopResult.finalTime;
  distance = stopResult.finalDistance;
  lat = stopResult.finalLat;
  lon = stopResult.finalLon;
});

// Write CSV
const csvContent = [header, ...allEntries.map(e => 
  `${e.date},${e.time},${e.speed},${e.voltage},${e.current},${e.power},${e.battery_level},${e.totaldistance},${e.system_temp},${e.pwm},${e.gps_speed},${e.latitude},${e.longitude},${e.gps_alt},${e.phase_current},${e.torque},${e.temp2},${e.distance},${e.mode},${e.alert},${e.gps_heading},${e.gps_distance},${e.tilt},${e.roll}`
)].join('\n');

fs.writeFileSync('public/demo-trip-enhanced.csv', csvContent);
console.log(`\nGenerated ${allEntries.length} data points`);
console.log('Saved to: public/demo-trip-enhanced.csv');
