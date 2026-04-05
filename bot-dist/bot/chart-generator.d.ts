import 'chartjs-adapter-date-fns';
import type { TripEntry } from './types.js';
export declare function generateChartBuffer(data: TripEntry[], type: 'main' | 'acceleration' | 'gps'): Promise<Buffer>;
export declare function generateSummaryImage(data: TripEntry[]): Promise<Buffer>;
//# sourceMappingURL=chart-generator.d.ts.map