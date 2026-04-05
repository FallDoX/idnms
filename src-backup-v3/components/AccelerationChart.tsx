import { useMemo, useState, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TripEntry } from '../types';
import { findAccelerationRuns } from '../utils/parser';
import { ZoomIn, ZoomOut, Maximize2, Timer } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface AccelerationChartProps {
  data: TripEntry[];
}

export function AccelerationChart({ data }: AccelerationChartProps) {
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
  const chartRef = useRef<any>(null);

  const { topRuns, allRuns } = useMemo(() => {
    const runs = findAccelerationRuns(data);

    // Топ-5 самых быстрых попыток (по времени до 60 км/ч или по max speed если 60 не достигнуто)
    const runsWithTime = runs
      .filter(r => r.startSpeed <= 5)
      .map(r => {
        let timeTo60: number | null = null;
        for (let i = 0; i < r.dataPoints.length; i++) {
          if (r.dataPoints[i].Speed >= 60) {
            timeTo60 = (r.dataPoints[i].timestamp - r.startTime) / 1000;
            break;
          }
        }
        return { run: r, timeTo60: timeTo60 ?? r.duration, duration: r.duration };
      })
      .filter(r => r.timeTo60 > 0)
      .sort((a, b) => a.timeTo60 - b.timeTo60)
      .slice(0, 5);

    return { bestRun: runsWithTime[0]?.run ?? null, allRuns: runs, topRuns: runsWithTime };
  }, [data]);

  const chartData = useMemo(() => {
    if (topRuns.length === 0) return { datasets: [] };

    const datasets = topRuns.map((r, idx) => {
      const startTime = r.run.startTime;
      const colors = [
        { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
        { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
        { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
      ];
      const color = colors[idx % colors.length];

      return {
        label: idx === 0 ? `Лучший (${r.timeTo60.toFixed(2)}с)` : `#${idx + 1} (${r.timeTo60.toFixed(2)}с)`,
        data: r.run.dataPoints.map(e => ({
          x: (e.timestamp - startTime) / 1000,
          y: e.Speed
        })),
        borderColor: color.border,
        backgroundColor: idx === 0 ? color.bg : 'transparent',
        fill: idx === 0,
        tension: 0.2,
        borderWidth: idx === 0 ? 3 : 2,
        pointRadius: 0,
        hoverRadius: 5,
        borderDash: idx === 0 ? [] : [5, 5],
      };
    });

    return { datasets };
  }, [topRuns]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const xScale = chart.scales.x;
    if (!xScale) return;

    const currentMin = xScale.min ?? 0;
    const currentMax = xScale.max ?? allRuns.length > 0 ? Math.max(...allRuns.flatMap(r => r.dataPoints.map(d => (d.timestamp - r.startTime) / 1000))) : 10;
    const range = currentMax - currentMin;
    const zoomFactor = 0.7;

    const center = (currentMin + currentMax) / 2;
    const newRange = range * zoomFactor;

    setZoomRange({
      start: Math.max(0, center - newRange / 2),
      end: center + newRange / 2,
    });
  }, [allRuns]);

  const handleZoomOut = useCallback(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const xScale = chart.scales.x;
    if (!xScale) return;

    const currentMin = xScale.min ?? 0;
    const currentMax = xScale.max ?? 10;
    const range = currentMax - currentMin;
    const zoomFactor = 1.4;

    const center = (currentMin + currentMax) / 2;
    const newRange = range * zoomFactor;

    const maxTime = allRuns.length > 0 ? Math.max(...allRuns.flatMap(r => r.dataPoints.map(d => (d.timestamp - r.startTime) / 1000))) : 10;

    setZoomRange({
      start: Math.max(0, center - newRange / 2),
      end: Math.min(maxTime, center + newRange / 2),
    });
  }, [allRuns]);

  const handleResetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  const handleWheelZoom = useCallback((e: React.WheelEvent) => {
    if (!chartRef.current) return;
    e.preventDefault();
    
    const chart = chartRef.current;
    const xScale = chart.scales.x;
    if (!xScale) return;

    const currentMin = xScale.min ?? 0;
    const currentMax = xScale.max ?? 10;
    const range = currentMax - currentMin;
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

    // Zoom towards mouse position
    const rect = chart.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mousePercent = mouseX / rect.width;
    const mouseValue = currentMin + range * mousePercent;

    const newRange = range * zoomFactor;
    const newMin = mouseValue - (mouseValue - currentMin) * (newRange / range);
    const newMax = mouseValue + (currentMax - mouseValue) * (newRange / range);

    const maxTime = allRuns.length > 0 ? Math.max(...allRuns.flatMap(r => r.dataPoints.map(d => (d.timestamp - r.startTime) / 1000))) : 10;

    setZoomRange({
      start: Math.max(0, newMin),
      end: Math.min(maxTime, newMax),
    });
  }, [allRuns]);

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        min: zoomRange?.start,
        max: zoomRange?.end,
        title: {
          display: true,
          text: 'Время (секунды)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 13, weight: 500 }
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 },
          callback: (value) => `${Number(value).toFixed(1)}с`
        },
        border: { display: false }
      },
      y: {
        title: {
          display: true,
          text: 'Скорость (км/ч)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: { size: 13, weight: 500 }
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 11 } },
        border: { display: false }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: 'rgba(255, 255, 255, 0.7)', usePointStyle: true, padding: 15 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const y = context.parsed.y ?? 0;
            const x = context.parsed.x ?? 0;
            return `${context.dataset.label}: ${y.toFixed(1)} км/ч @ ${x.toFixed(2)}с`;
          }
        }
      }
    },
    elements: {
      line: { borderWidth: 2 },
      point: { radius: 0, hoverRadius: 5 }
    }
  };

  if (topRuns.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Попытки разгона</h3>
        <div className="h-[350px] flex items-center justify-center text-slate-400">
          Не найдено валидных попыток разгона
        </div>
      </div>
    );
  }

  // Format time in seconds and milliseconds
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-6">
      {/* Chart Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl">
              <Timer className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Попытки разгона</h3>
              <p className="text-xs text-slate-400">
                Лучший: <span className="text-emerald-400 font-bold">{topRuns[0]?.timeTo60.toFixed(3)}с</span>
              </p>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              title="Приблизить"
            >
              <ZoomIn className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              title="Отдалить"
            >
              <ZoomOut className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
              title="Сбросить zoom"
            >
              <Maximize2 className="w-4 h-4 text-slate-300" />
            </button>
            <span className="text-xs text-slate-500 ml-2">Колесо мыши для zoom</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-5" onWheel={handleWheelZoom}>
        <div className="h-[400px] w-full">
          <Line ref={chartRef} options={commonOptions} data={chartData} />
        </div>
      </div>

      {/* Top Runs Summary */}
      <div className="p-5 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">Топ-5 попыток разгона</h4>
          <p className="text-xs text-slate-400">
            📊 Разгон от ≤5 км/ч до максимума за попытку
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topRuns.slice(0, 5).map((r, idx) => (
            <div 
              key={idx} 
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  idx === 0 ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"
                )}>
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-white">
                  {idx === 0 && '🏆 '}
                  {r.timeTo60.toFixed(3)}с
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div>🚀 Макс: <span className="text-slate-300">{r.run.endSpeed.toFixed(1)} км/ч</span></div>
                <div>⚡ Пик: <span className="text-slate-300">{r.run.peakAcceleration.toFixed(2)} м/с²</span></div>
                <div>⏱️ Длит: <span className="text-slate-300">{r.duration.toFixed(2)}с</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
