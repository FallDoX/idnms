export interface BotTripSummary {
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
    accelerationResults?: Record<string, AccelerationResult>;
}
export interface AccelerationResult {
    time: number | null;
    timeMs: number | null;
    bestRun: {
        startTime: number;
        endTime: number;
        duration: number;
        startSpeed: number;
        endSpeed: number;
        avgAcceleration: number;
        peakAcceleration: number;
        dataPoints: any[];
    } | null;
    allRuns: any[];
}
export type { TripEntry, TripSummary, AccelerationRun, SpeedThreshold, CSVFormat, DatasetMetadata, } from '../src/types.js';
//# sourceMappingURL=types.d.ts.map