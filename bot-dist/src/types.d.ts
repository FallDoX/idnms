export interface TripEntry {
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
    PhaseCurrent?: number;
    Torque?: number;
    Temp2?: number;
    Distance?: number;
    Mode?: string;
    Alert?: string;
    GPSHeading?: number | null;
    GPSDistance?: number | null;
    Tilt?: number | null;
    Roll?: number | null;
    Pitch?: number | null;
    rawData?: Record<string, string | number | null>;
}
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
    avgMovingSpeed: number;
    movingDuration: number;
    totalDistance: number;
    avgPower: number;
    maxPower: number;
    batteryDrop: number;
    maxBatteryDrop?: number;
    duration: number;
    best0to60?: number | null;
    peakAcceleration?: number;
    maxTorque?: number;
    maxPhaseCurrent?: number;
    avgTemp?: number;
    maxTemp?: number;
    maxCurrent?: number;
    consumptionPerKm?: number;
}
export interface AccelerationRun {
    startTime: number;
    endTime: number;
    duration: number;
    startSpeed: number;
    endSpeed: number;
    avgAcceleration: number;
    peakAcceleration: number;
    dataPoints: TripEntry[];
}
export interface AccelerationResult {
    time: number | null;
    timeMs: number | null;
    bestRun: AccelerationRun | null;
    allRuns: AccelerationRun[];
}
export interface SpeedThreshold {
    id: string;
    label: string;
    value: number;
}
export type CSVFormat = 'old' | 'new';
//# sourceMappingURL=types.d.ts.map