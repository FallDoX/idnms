import { memo, useState, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChartWithZoom } from './ChartWithZoom';
import type { AccelerationAttempt, TripEntry } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ATTEMPT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#f97316', '#06b6d4', '#a78bfa', '#fb923c'
];

interface AccelerationComparisonProps {
  accelerationAttempts: AccelerationAttempt[];
  selectedAttempts: Set<string>;
  data: TripEntry[];
}

export const AccelerationComparison = memo(({
  accelerationAttempts,
  selectedAttempts,
  data,
}: AccelerationComparisonProps) => {
  const [comparisonFilter, setComparisonFilter] = useState<'all' | 'best' | 'worst'>('all');
  const [showPowerCurve, setShowPowerCurve] = useState(false);
  const [filterLimit, setFilterLimit] = useState(5);

  const selectedAttemptObjects = useMemo(() => {
    return accelerationAttempts.filter(a => selectedAttempts.has(a.id));
  }, [accelerationAttempts, selectedAttempts]);

  const filteredAttempts = useMemo(() => {
    if (comparisonFilter === 'all') return selectedAttemptObjects;
    if (comparisonFilter === 'best') {
      return [...selectedAttemptObjects].sort((a, b) => a.time - b.time).slice(0, filterLimit);
    }
    if (comparisonFilter === 'worst') {
      return [...selectedAttemptObjects].sort((a, b) => b.time - a.time).slice(0, filterLimit);
    }
    return selectedAttemptObjects;
  }, [selectedAttemptObjects, comparisonFilter, filterLimit]);

  // Calculate time range (in seconds from start)
  const timeRange = useMemo(() => {
    let maxDuration = 0;
    filteredAttempts.forEach(attempt => {
      maxDuration = Math.max(maxDuration, attempt.time);
    });
    return maxDuration > 0 ? { start: 0, end: maxDuration } : null;
  }, [filteredAttempts]);

  const bestAttempt = useMemo(() => {
    if (filteredAttempts.length === 0) return null;
    return filteredAttempts.reduce((best, current) => current.time < best.time ? current : best);
  }, [filteredAttempts]);

  const chartData = useMemo(() => {
    const datasets: Array<{
      label: string;
      data: Array<{ x: number; y: number }>;
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
      pointRadius: number;
      borderWidth: number;
      borderDash?: number[];
      yAxisID?: string;
    }> = [];

    filteredAttempts.forEach((attempt, index) => {
      const attemptData = data.filter(
        e => e.timestamp >= attempt.startTimestamp && e.timestamp <= attempt.endTimestamp
      );

      if (attemptData.length > 0) {
        const isBest = bestAttempt?.id === attempt.id;
        // Speed dataset - normalized time (seconds from start)
        datasets.push({
          label: `#${index + 1} (${attempt.thresholdPair.from}-${attempt.thresholdPair.to} км/ч, ${attempt.time.toFixed(2)}с)`,
          data: attemptData.map(e => ({ x: (e.timestamp - attempt.startTimestamp) / 1000, y: e.Speed })),
          borderColor: ATTEMPT_COLORS[index % ATTEMPT_COLORS.length],
          backgroundColor: `${ATTEMPT_COLORS[index % ATTEMPT_COLORS.length]}20`,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: isBest ? 3 : 1.5,
          yAxisID: 'y',
        });

        // Power dataset (when showPowerCurve is true) - normalized time
        if (showPowerCurve) {
          datasets.push({
            label: `#${index + 1} Мощность`,
            data: attemptData.map(e => ({ x: (e.timestamp - attempt.startTimestamp) / 1000, y: e.Power })),
            borderColor: ATTEMPT_COLORS[index % ATTEMPT_COLORS.length],
            backgroundColor: `${ATTEMPT_COLORS[index % ATTEMPT_COLORS.length]}20`,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [5, 5],
            yAxisID: 'y1',
          });
        }
      }
    });

    return { datasets };
  }, [filteredAttempts, data, bestAttempt, showPowerCurve]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        align: 'end' as const,
        onClick: (e: any) => {
          e.stopPropagation();
        },
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: 'Время (сек)',
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Скорость (км/ч)',
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
        },
      },
      y1: showPowerCurve ? {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Мощность (Вт)',
          color: '#94a3b8',
          font: { size: 11 },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
        },
      } : undefined,
    },
  };

  const deltaMetrics = useMemo(() => {
    if (!bestAttempt) return [];
    return filteredAttempts.map((attempt) => ({
      attempt,
      deltaTime: attempt.time - bestAttempt.time,
      deltaDistance: attempt.distance - bestAttempt.distance,
      deltaPeakPower: attempt.peakPower - bestAttempt.peakPower,
      deltaAvgPower: attempt.averagePower - bestAttempt.averagePower,
      deltaBatteryDrop: attempt.batteryDrop - bestAttempt.batteryDrop,
    }));
  }, [filteredAttempts, bestAttempt]);

  const timelineMarkers = useMemo(() => {
    if (!timeRange) return [];
    return filteredAttempts.map((attempt, index) => ({
      id: attempt.id,
      position: attempt.time / timeRange.end,
      color: ATTEMPT_COLORS[index % ATTEMPT_COLORS.length],
      label: `#${index + 1}: ${attempt.time.toFixed(2)}с`,
    }));
  }, [filteredAttempts, timeRange]);

  return (
    <div className="space-y-4">
      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {comparisonFilter === 'all' 
          ? `Показаны все попытки: ${filteredAttempts.length}`
          : comparisonFilter === 'best'
          ? `Показаны лучшие ${filterLimit} попыток из ${selectedAttemptObjects.length}`
          : `Показаны худшие ${filterLimit} попыток из ${selectedAttemptObjects.length}`
        }
      </div>

      {/* Header with filter buttons */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">Фильтр попыток:</span>
        <div className="flex gap-2 items-center">
          {(['all', 'best', 'worst'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setComparisonFilter(filter)}
              aria-pressed={comparisonFilter === filter}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                comparisonFilter === filter
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-600/70'
              }`}
            >
              {filter === 'all' ? 'Все' : filter === 'best' ? `Лучшие ${filterLimit}` : `Худшие ${filterLimit}`}
            </button>
          ))}
          <button
            onClick={() => setShowPowerCurve(!showPowerCurve)}
            aria-pressed={showPowerCurve}
            aria-label={showPowerCurve ? 'Скрыть график мощности' : 'Показать график мощности'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              showPowerCurve
                ? 'bg-green-500/20 border-green-500/50 text-green-300'
                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-600/70'
            }`}
          >
            Мощность
          </button>
          <div className="flex items-center gap-2 ml-2">
            <label htmlFor="filter-limit" className="text-xs text-slate-400">Лимит:</label>
            <input
              id="filter-limit"
              type="number"
              min="1"
              max="50"
              value={filterLimit}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 50) {
                  setFilterLimit(value);
                }
              }}
              className="w-16 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-700/50 border border-slate-600 text-slate-300 focus:outline-none focus:border-blue-500"
              aria-label="Лимит количества попыток"
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredAttempts.length === 0 ? (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <p className="text-white/50 text-sm mb-2">Нет выбранных попыток</p>
              <p className="text-white/30 text-xs">Выберите попытки в таблице для сравнения</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chart with ChartWithZoom */}
          {timeRange && (
            <ChartWithZoom
              data={chartData}
              options={chartOptions}
              height={400}
              timeRange={timeRange}
              timelineMarkers={timelineMarkers}
              timelineLabel="Шкала времени"
            />
          )}

          {/* Delta metrics table */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4 text-center">Таблица дельта-метрик</h2>
            <p className="text-xs text-slate-400 mb-4 text-center">
              Разница относительно лучшей попытки ({bestAttempt?.time.toFixed(2)}с)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-center text-slate-300 font-medium py-2 px-3">№</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">Время (с)</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">Дистанция (м)</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">Пик. мощн. (Вт)</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">Ср. мощн. (Вт)</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">Падение бат. (%)</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">ΔВремя</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">ΔДистанция</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">ΔПик. мощн.</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">ΔСр. мощн.</th>
                    <th className="text-center text-slate-300 font-medium py-2 px-3">ΔПадение бат.</th>
                  </tr>
                </thead>
                <tbody>
                  {deltaMetrics.map((item, index) => (
                    <tr key={item.attempt.id} className="border-b border-white/5">
                      <td className="text-slate-300 py-2 px-3 text-center">{index + 1}</td>
                      <td className="text-slate-300 py-2 px-3 text-center">{item.attempt.time.toFixed(2)}</td>
                      <td className="text-slate-300 py-2 px-3 text-center">{item.attempt.distance.toFixed(1)}</td>
                      <td className="text-slate-300 py-2 px-3 text-center">{item.attempt.peakPower.toFixed(1)}</td>
                      <td className="text-slate-300 py-2 px-3 text-center">{item.attempt.averagePower.toFixed(1)}</td>
                      <td className="text-slate-300 py-2 px-3 text-center">{item.attempt.batteryDrop.toFixed(1)}</td>
                      <td className={cn(item.deltaTime === 0 ? 'text-slate-400' : item.deltaTime > 0 ? 'text-red-400' : 'text-green-400', 'py-2 px-3 text-center')}>
                        {item.deltaTime === 0 ? '-' : `${item.deltaTime > 0 ? '+' : ''}${item.deltaTime.toFixed(2)}`}
                      </td>
                      <td className={cn(item.deltaDistance === 0 ? 'text-slate-400' : item.deltaDistance > 0 ? 'text-green-400' : 'text-red-400', 'py-2 px-3 text-center')}>
                        {item.deltaDistance === 0 ? '-' : `${item.deltaDistance > 0 ? '+' : ''}${item.deltaDistance.toFixed(1)}`}
                      </td>
                      <td className={cn(item.deltaPeakPower === 0 ? 'text-slate-400' : item.deltaPeakPower < 0 ? 'text-green-400' : 'text-red-400', 'py-2 px-3 text-center')}>
                        {item.deltaPeakPower === 0 ? '-' : `${item.deltaPeakPower > 0 ? '+' : ''}${item.deltaPeakPower.toFixed(1)}`}
                      </td>
                      <td className={cn(item.deltaAvgPower === 0 ? 'text-slate-400' : item.deltaAvgPower < 0 ? 'text-green-400' : 'text-red-400', 'py-2 px-3 text-center')}>
                        {item.deltaAvgPower === 0 ? '-' : `${item.deltaAvgPower > 0 ? '+' : ''}${item.deltaAvgPower.toFixed(1)}`}
                      </td>
                      <td className={cn(item.deltaBatteryDrop === 0 ? 'text-slate-400' : item.deltaBatteryDrop < 0 ? 'text-green-400' : 'text-red-400', 'py-2 px-3 text-center')}>
                        {item.deltaBatteryDrop === 0 ? '-' : `${item.deltaBatteryDrop > 0 ? '+' : ''}${item.deltaBatteryDrop.toFixed(1)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

AccelerationComparison.displayName = 'AccelerationComparison';
