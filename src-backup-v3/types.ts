export interface TripEntry {
  // Core fields (unified)
  Speed: number;
  Voltage: number;
  PWM: number;
  Current: number;
  Power: number;
  BatteryLevel: number;
  TotalDistance: number;
  Temperature: number;
  GPSSpeed: number | null;
  Latitude: number | null;
  Longitude: number | null;
  Altitude: number | null;
  timestamp: number; // Parsed from Date

  // New format only fields
  PhaseCurrent?: number; // phase_current
  Torque?: number; // torque
  Temp2?: number; // temp2
  Distance?: number; // distance (trip)
  Mode?: string; // mode
  Alert?: string; // alert
  GPSSAltitude?: number | null; // gps_alt
  GPSHeading?: number | null; // gps_heading
}

export interface TripSummary {
  maxSpeed: number;
  avgSpeed: number;
  avgMovingSpeed: number; // средняя только когда > 5 км/ч
  movingDuration: number; // ms — время в движении
  totalDistance: number;
  avgPower: number;
  maxPower: number;
  batteryDrop: number;
  duration: number; // ms
  best0to60?: number | null; // seconds
  peakAcceleration?: number; // m/s²
  maxTorque?: number; // New: max torque
  maxPhaseCurrent?: number; // New: max phase current
  avgTemp?: number;
  maxTemp?: number;
}

export interface AccelerationRun {
  startTime: number;
  endTime: number;
  duration: number; // seconds
  startSpeed: number;
  endSpeed: number;
  avgAcceleration: number; // m/s²
  peakAcceleration: number; // m/s²
  dataPoints: TripEntry[];
}

export interface AccelerationResult {
  time: number | null; // seconds, null if not reached
  bestRun: AccelerationRun | null;
  allRuns: AccelerationRun[];
}

export interface SpeedThreshold {
  id: string;
  label: string;
  value: number; // km/h
}

export type CSVFormat = 'old' | 'new';
