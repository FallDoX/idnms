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
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(null);
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timeline drag state
  const isTimelineDragging = useRef(false);
  const timelineDragMode = useRef<'pan' | 'left' | 'right' | null>(null);
  const timelineDragStart = useRef<{ x: number; min: number; max: number } | null>(null);

  const { topRuns, maxRunTime } = useMemo(() => {
    const runs = findAccelerationRuns(data);

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

    // Find the max time across all runs for proper axis scaling
    const maxTime = runs.length > 0 
      ? Math.max(...runs.map(r => {
          const lastPoint = r.dataPoints[r.dataPoints.length - 1];
          return (lastPoint.timestamp - r.startTime) / 1000;
        }))
      : 10;

    return { bestRun: runsWithTime[0]?.run ?? null, allRuns: runs, topRuns: runsWithTime, maxRunTime: maxTime };
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

  // Zoom handlers using proper relative time
  const handleZoomIn = useCallback(() => {
    const currentMin = zoomRange?.min ?? 0;
    const currentMax = zoomRange?.max ?? maxRunTime;
    const range = currentMax - currentMin;
    const zoomFactor = 0.75;

    const center = (currentMin + currentMax) / 2;
    const newRange = Math.max(0.5, range * zoomFactor); // Min 0.5 seconds

    setZoomRange({
      min: Math.max(0, center - newRange / 2),
      max: Math.min(maxRunTime, center + newRange / 2),
    });
  }, [zoomRange, maxRunTime]);

  const handleZoomOut = useCallback(() => {
    const currentMin = zoomRange?.min ?? 0;
    const currentMax = zoomRange?.max ?? maxRunTime;
    const range = currentMax - currentMin;
    const zoomFactor = 1.33;

    const center = (currentMin + currentMax) / 2;
    const newRange = range * zoomFactor;

    if (newRange >= maxRunTime) {
      setZoomRange(null);
    } else {
      setZoomRange({
        min: Math.max(0, center - newRange / 2),
        max: Math.min(maxRunTime, center + newRange / 2),
      });
    }
  }, [zoomRange, maxRunTime]);

  const handleResetZoom = useCallback(() => {
    setZoomRange(null);
  }, []);

  // Timeline drag handlers
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    isTimelineDragging.current = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;

    const currentMin = zoomRange?.min ?? 0;
    const currentMax = zoomRange?.max ?? maxRunTime;
    const clickTime = clickRatio * maxRunTime;

    // Check edges (within 8px)
    const leftEdgeX = ((currentMin) / maxRunTime) * rect.width;
    const rightEdgeX = ((currentMax) / maxRunTime) * rect.width;
    const edgeThreshold = 8;

    if (Math.abs(clickX - leftEdgeX) < edgeThreshold && zoomRange) {
      timelineDragMode.current = 'left';
      timelineDragStart.current = { x: e.clientX, min: currentMin, max: currentMax };
    } else if (Math.abs(clickX - rightEdgeX) < edgeThreshold && zoomRange) {
      timelineDragMode.current = 'right';
      timelineDragStart.current = { x: e.clientX, min: currentMin, max: currentMax };
    } else if (zoomRange && clickTime >= currentMin && clickTime <= currentMax) {
      timelineDragMode.current = 'pan';
      timelineDragStart.current = { x: e.clientX, min: currentMin, max: currentMax };
    } else {
      // Center on click
      const currentRange = currentMax - currentMin;
      const halfRange = currentRange / 2;
      setZoomRange({
        min: Math.max(0, clickTime - halfRange),
        max: Math.min(maxRunTime, clickTime + halfRange),
      });
      timelineDragStart.current = null;
      timelineDragMode.current = null;
    }
  }, [zoomRange, maxRunTime]);

  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isTimelineDragging.current || !timelineDragStart.current) return;

    const timelineEl = document.querySelector('[data-acc-timeline]');
    if (!timelineEl) return;

    const rect = timelineEl.getBoundingClientRect();
    const deltaX = e.clientX - timelineDragStart.current.x;
    const pxPerSec = rect.width / maxRunTime;
    const deltaSec = deltaX / pxPerSec;

    let newMin = timelineDragStart.current.min;
    let newMax = timelineDragStart.current.max;

    if (timelineDragMode.current === 'left') {
      newMin = Math.min(timelineDragStart.current.max - 0.5,
                        Math.max(0, timelineDragStart.current.min + deltaSec));
    } else if (timelineDragMode.current === 'right') {
      newMax = Math.max(timelineDragStart.current.min + 0.5,
                        Math.min(maxRunTime, timelineDragStart.current.max + deltaSec));
    } else if (timelineDragMode.current === 'pan') {
      newMin = timelineDragStart.current.min + deltaSec;
      newMax = timelineDragStart.current.max + deltaSec;

      if (newMin < 0) {
        newMax += -newMin;
        newMin = 0;
      }
      if (newMax > maxRunTime) {
        newMin -= (newMax - maxRunTime);
        newMax = maxRunTime;
      }
    }

    setZoomRange({ min: Math.max(0, newMin), max: Math.min(maxRunTime, newMax) });
  }, [maxRunTime]);

  const handleTimelineMouseUp = useCallback(() => {
    isTimelineDragging.current = false;
    timelineDragStart.current = null;
    timelineDragMode.current = null;
  }, []);

  // Pan + vertical swipe zoom on chart
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; min: number; max: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    const currentMin = zoomRange?.min ?? 0;
    const currentMax = zoomRange?.max ?? maxRunTime;
    panStart.current = { x: e.clientX, y: e.clientY, min: currentMin, max: currentMax };
  }, [zoomRange, maxRunTime]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current || !panStart.current) return;

    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - panStart.current.x;
    const deltaY = e.clientY - panStart.current.y;
    const pxPerSec = rect.width / (panStart.current.max - panStart.current.min || 1);

    // Pan horizontally
    const deltaSec = -deltaX / pxPerSec;
    let newMin = panStart.current.min + deltaSec;
    let newMax = panStart.current.max + deltaSec;

    // Zoom with vertical swipe
    const zoomFactor = 1 + (-deltaY / rect.height) * 0.5;
    const center = (newMin + newMax) / 2;
    const range = Math.max(0.5, (newMax - newMin) * zoomFactor);

    newMin = center - range / 2;
    newMax = center + range / 2;

    // Clamp
    if (newMin < 0) {
      newMax += -newMin;
      newMin = 0;
    }
    if (newMax > maxRunTime) {
      newMin -= (newMax - maxRunTime);
      newMax = maxRunTime;
    }

    setZoomRange({ min: Math.max(0, newMin), max: Math.min(maxRunTime, newMax) });
  }, [maxRunTime]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    panStart.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    setZoomRange(null);
  }, []);

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        min: zoomRange?.min,
        max: zoomRange?.max,
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
                {zoomRange && ` | Zoom: ${(zoomRange.max - zoomRange.min).toFixed(1)}с`}
              </p>
            </div>
          </div>

          {/* Zoom controls */}
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
              title="Сбросить"
            >
              <Maximize2 className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area with pan/zoom */}
      <div 
        ref={containerRef}
        className="p-5 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <div className="h-[400px] w-full">
          <Line ref={chartRef} options={commonOptions} data={chartData} />
        </div>
      </div>

      {/* Mini timeline with draggable edges */}
      {zoomRange && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500">Шкала:</span>
            <div 
              data-acc-timeline
              className="flex-1 relative h-6 bg-white/5 rounded overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={handleTimelineMouseMove}
              onMouseUp={handleTimelineMouseUp}
              onMouseLeave={handleTimelineMouseUp}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-blue-900/20" />
              
              {/* Viewport area */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/30 hover:bg-emerald-500/40 transition-colors"
                style={{
                  left: `${(zoomRange.min / maxRunTime) * 100}%`,
                  width: `${((zoomRange.max - zoomRange.min) / maxRunTime) * 100}%`,
                }}
              />
              {/* Left edge handle */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-emerald-400/60 hover:bg-emerald-400 cursor-col-resize transition-colors"
                style={{
                  left: `${(zoomRange.min / maxRunTime) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              />
              {/* Right edge handle */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-emerald-400/60 hover:bg-emerald-400 cursor-col-resize transition-colors"
                style={{
                  left: `${(zoomRange.max / maxRunTime) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              />
              
              <div className="absolute inset-0 flex justify-between px-2 items-center text-[9px] text-slate-600 pointer-events-none">
                <span>0с</span>
                <span>{maxRunTime.toFixed(0)}с</span>
              </div>
            </div>
            <button
              onClick={handleResetZoom}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/30"
            >
              Сброс
            </button>
          </div>
        </div>
      )}

      {/* Top Runs Summary */}
      <div className="p-5 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">Топ-5 попыток разгона</h4>
          <p className="text-xs text-slate-400">
            📊 Разгон от ≤5 км/ч до 60 км/ч
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
                <div>⚡ Пик: <span className="text-slate-300">{r.run.peakAcceleration.toFixed(2)} м/с² / {(r.run.peakAcceleration / 9.8).toFixed(2)}g</span></div>
                <div>⏱️ Длит: <span className="text-slate-300">{r.duration.toFixed(2)}с</span></div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-3">
          🖱️ <b>Управление:</b> Горизонтальный свайп = сдвиг | Вертикальный = zoom | Тяни за края шкалы = растянуть | Двойной клик = сброс
        </p>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
