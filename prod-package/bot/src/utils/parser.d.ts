import type { TripEntry, TripSummary, AccelerationRun, AccelerationResult, SpeedThreshold } from '../types.js';
export declare function parseTripData(csv: string): TripEntry[];
export declare function downsample<T>(data: T[], limit?: number): T[];
export declare function calculateSummary(data: TripEntry[]): TripSummary;
export declare function findAccelerationRuns(data: TripEntry[]): AccelerationRun[];
export declare function calculateBestTimeForThreshold(data: TripEntry[], targetSpeed: number, runs?: AccelerationRun[]): number | null;
export declare function getAccelerationForThresholds(data: TripEntry[], thresholds: SpeedThreshold[]): Record<string, AccelerationResult>;
export declare const defaultThresholds: SpeedThreshold[];
export interface DataFilterConfig {
    enabled: boolean;
    limits: {
        Speed: {
            min: number;
            max: number;
        };
        Voltage: {
            min: number;
            max: number;
        };
        Current: {
            min: number;
            max: number;
        };
        Power: {
            min: number;
            max: number;
        };
        BatteryLevel: {
            min: number;
            max: number;
        };
        Temperature: {
            min: number;
            max: number;
        };
        PWM: {
            min: number;
            max: number;
        };
        GPSSpeed: {
            min: number;
            max: number;
        };
        PhaseCurrent: {
            min: number;
            max: number;
        };
        Torque: {
            min: number;
            max: number;
        };
        Temp2: {
            min: number;
            max: number;
        };
    };
    maxTimeGapSeconds: number;
}
export declare const defaultFilterConfig: DataFilterConfig;
export declare function filterData(data: TripEntry[], config?: DataFilterConfig): {
    filtered: TripEntry[];
    removed: number;
    issues: string[];
};
//# sourceMappingURL=parser.d.ts.map