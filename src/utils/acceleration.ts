import type { TripEntry, AccelerationAttempt } from '../types.js';

export function detectAccelerations(data: TripEntry[], targetSpeed: number): AccelerationAttempt[] {
  const attempts: AccelerationAttempt[] = [];
  
  if (data.length === 0) {
    return attempts;
  }

  let attemptStart: TripEntry | null = null;
  let startIndex = 0;

  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    
    // Check for data gaps (> 500ms)
    if (attemptStart && i > startIndex) {
      const gap = current.timestamp - data[i - 1].timestamp;
      if (gap > 500) {
        // Gap detected, reset attempt
        attemptStart = null;
        startIndex = i;
        continue;
      }
    }

    // Detect when speed crosses from below targetSpeed to above targetSpeed
    if (!attemptStart && current.Speed < targetSpeed) {
      attemptStart = current;
      startIndex = i;
    } else if (attemptStart && current.Speed >= targetSpeed) {
      // Speed reached target, end of acceleration attempt
      const attemptEnd = current;
      
      // Calculate metrics
      const time = (attemptEnd.timestamp - attemptStart.timestamp) / 1000; // convert to seconds
      
      // Calculate distance using trapezoidal integration (convert km/h to m/s)
      let distance = 0;
      for (let j = startIndex; j < i; j++) {
        const point1 = data[j];
        const point2 = data[j + 1];
        const dt = (point2.timestamp - point1.timestamp) / 1000; // seconds
        const speed1 = point1.Speed / 3.6; // convert km/h to m/s
        const speed2 = point2.Speed / 3.6; // convert km/h to m/s
        distance += ((speed1 + speed2) / 2) * dt; // trapezoidal method
      }

      // Calculate power metrics
      const powerValues: number[] = [];
      const currentValues: number[] = [];
      const voltageValues: number[] = [];
      const temperatureValues: number[] = [];
      
      for (let j = startIndex; j <= i; j++) {
        powerValues.push(data[j].Power);
        currentValues.push(data[j].Current);
        voltageValues.push(data[j].Voltage);
        temperatureValues.push(data[j].Temperature);
      }

      const averagePower = powerValues.reduce((sum, val) => sum + val, 0) / powerValues.length;
      const peakPower = Math.max(...powerValues);
      const averageCurrent = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;
      const averageVoltage = voltageValues.reduce((sum, val) => sum + val, 0) / voltageValues.length;
      const batteryDrop = attemptEnd.BatteryLevel - attemptStart.BatteryLevel;
      const averageTemperature = temperatureValues.reduce((sum, val) => sum + val, 0) / temperatureValues.length;

      attempts.push({
        id: `accel-${startIndex}-${i}`,
        startTimestamp: attemptStart.timestamp,
        endTimestamp: attemptEnd.timestamp,
        startSpeed: attemptStart.Speed,
        endSpeed: attemptEnd.Speed,
        targetSpeed: targetSpeed,
        time: time,
        distance: distance,
        averagePower: averagePower,
        peakPower: peakPower,
        averageCurrent: averageCurrent,
        averageVoltage: averageVoltage,
        batteryDrop: batteryDrop,
        averageTemperature: averageTemperature,
        isComplete: true
      });

      // Reset for next attempt
      attemptStart = null;
      startIndex = i;
    }
  }

  // Handle incomplete attempts (attempts that never reached target speed)
  if (attemptStart) {
    const attemptEnd = data[data.length - 1];
    
    // Calculate metrics for incomplete attempt
    const time = (attemptEnd.timestamp - attemptStart.timestamp) / 1000;
    
    let distance = 0;
    for (let j = startIndex; j < data.length - 1; j++) {
      const point1 = data[j];
      const point2 = data[j + 1];
      const dt = (point2.timestamp - point1.timestamp) / 1000;
      const speed1 = point1.Speed / 3.6;
      const speed2 = point2.Speed / 3.6;
      distance += ((speed1 + speed2) / 2) * dt;
    }

    const powerValues: number[] = [];
    const currentValues: number[] = [];
    const voltageValues: number[] = [];
    const temperatureValues: number[] = [];
    
    for (let j = startIndex; j < data.length; j++) {
      powerValues.push(data[j].Power);
      currentValues.push(data[j].Current);
      voltageValues.push(data[j].Voltage);
      temperatureValues.push(data[j].Temperature);
    }

    const averagePower = powerValues.reduce((sum, val) => sum + val, 0) / powerValues.length;
    const peakPower = Math.max(...powerValues);
    const averageCurrent = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;
    const averageVoltage = voltageValues.reduce((sum, val) => sum + val, 0) / voltageValues.length;
    const batteryDrop = attemptEnd.BatteryLevel - attemptStart.BatteryLevel;
    const averageTemperature = temperatureValues.reduce((sum, val) => sum + val, 0) / temperatureValues.length;

    attempts.push({
      id: `accel-${startIndex}-${data.length - 1}`,
      startTimestamp: attemptStart.timestamp,
      endTimestamp: attemptEnd.timestamp,
      startSpeed: attemptStart.Speed,
      endSpeed: attemptEnd.Speed,
      targetSpeed: targetSpeed,
      time: time,
      distance: distance,
      averagePower: averagePower,
      peakPower: peakPower,
      averageCurrent: averageCurrent,
      averageVoltage: averageVoltage,
      batteryDrop: batteryDrop,
      averageTemperature: averageTemperature,
      isComplete: false
    });
  }

  return attempts;
}
