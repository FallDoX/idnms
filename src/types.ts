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
  timestamp: number;

  // Extended sensor fields (new format)
  PhaseCurrent?: number;
  Torque?: number;
  Temp2?: number;
  Distance?: number;
  Mode?: string;
  Alert?: string;
  GPSHeading?: number | null;
  GPSDistance?: number | null;

  // IMU/Orientation sensors
  Tilt?: number | null;
  Roll?: number | null;
  Pitch?: number | null;

  // Raw data for dynamic metrics (stores any additional CSV columns)
  rawData?: Record<string, string | number | null>;
}

// Metadata about available metrics in the current dataset
export interface DatasetMetadata {
  availableFields: string[];
  numericFields: string[];
  hasGPS: boolean;
  hasIMU: boolean;
  hasPhaseCurrent: boolean;
  hasTorque: boolean;
}

export interface TripSummary {
  maxSpeed: number;
  avgSpeed: number;
  avgMovingSpeed: number; // средняя только когда > 5 км/ч
  movingDuration: number; // ms — время в движении
  totalDistance: number;
  avgPower: number;
  maxPower: number;
  batteryDrop: number;  // Legacy: SOC % drop (start - end)
  batteryDischarge?: number;  // New: SOC % drop, renamed for clarity
  batteryVoltageDrop?: number;  // New: Voltage drop % (peak to min under load)
  maxBatteryDrop?: number; // Maximum battery SOC % drop during the trip
  duration: number; // ms
  maxTorque?: number; // New: max torque
  maxPhaseCurrent?: number; // New: max phase current
  avgTemp?: number;
  maxTemp?: number;
  maxCurrent?: number; // Max battery current
  consumptionPerKm?: number; // Wh/km
}

export type CSVFormat = 'old' | 'new';
