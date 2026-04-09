import { memo, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
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
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { AccelerationAttempt, TripEntry } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

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

  const selectedAttemptObjects = useMemo(() => {
    return accelerationAttempts.filter(a => selectedAttempts.has(a.id));
  }, [accelerationAttempts, selectedAttempts]);

  const filteredAttempts = useMemo(() => {
    if (comparisonFilter === 'all') return selectedAttemptObjects;
    if (comparisonFilter === 'best') {
      return [...selectedAttemptObjects].sort((a, b) => a.time - b.time).slice(0, 5);
    }
    if (comparisonFilter === 'worst') {
      return [...selectedAttemptObjects].sort((a, b) => b.time - a.time).slice(0, 5);
    }
    return selectedAttemptObjects;
  }, [selectedAttemptObjects, comparisonFilter]);

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
    }> = [];

    filteredAttempts.forEach((attempt, index) => {
      const attemptData = data.filter(
        e => e.timestamp >= attempt.startTimestamp && e.timestamp <= attempt.endTimestamp
      );

      if (attemptData.length > 0) {
        const isBest = bestAttempt?.id === attempt.id;
        datasets.push({
          label: `#${index + 1} (${attempt.thresholdPair.from}-${attempt.thresholdPair.to} км/ч, ${attempt.time.toFixed(2)}с)`,
          data: attemptData.map(e => ({ x: e.timestamp, y: e.Speed })),
          borderColor: ATTEMPT_COLORS[index % ATTEMPT_COLORS.length],
          backgroundColor: `${ATTEMPT_COLORS[index % ATTEMPT_COLORS.length]}20`,
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: isBest ? 3 : 1.5,
        });
      }
    });

    return { datasets };
  }, [filteredAttempts, data, bestAttempt]);

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
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          usePointStyle: true,
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
        type: 'time' as const,
        time: {
          unit: 'second' as const,
          displayFormats: {
            second: 'HH:mm:ss',
          },
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

  return (
    <div className="space-y-4">
      {/* Header with filter buttons */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Фильтр попыток:</span>
        <div className="flex gap-2">
          {(['all', 'best', 'worst'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setComparisonFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                comparisonFilter === filter
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-600/70'
              }`}
            >
              {filter === 'all' ? 'Все' : filter === 'best' ? 'Лучшие 5' : 'Худшие 5'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredAttempts.length === 0 ? (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
          <p className="text-white/50 text-sm mb-2">Нет выбранных попыток</p>
          <p className="text-white/30 text-xs">Выберите попытки в таблице для сравнения</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[400px]">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* Delta metrics table */}
          <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Таблица дельта-метрик</h2>
            <p className="text-xs text-slate-400 mb-4">
              Разница относительно лучшей попытки ({bestAttempt.time.toFixed(2)}с)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-300 font-medium py-2 px-3">№</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">Время (с)</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">Дистанция (м)</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">Пик. мощн. (Вт)</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">Ср. мощн. (Вт)</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">Падение бат. (%)</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">ΔВремя</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">ΔДистанция</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">ΔПик. мощн.</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">ΔСр. мощн.</th>
                    <th className="text-left text-slate-300 font-medium py-2 px-3">ΔПадение бат.</th>
                  </tr>
                </thead>
                <tbody>
                  {deltaMetrics.map((item, index) => (
                    <tr key={item.attempt.id} className="border-b border-white/5">
                      <td className="text-slate-300 py-2 px-3">{index + 1}</td>
                      <td className="text-slate-300 py-2 px-3">{item.attempt.time.toFixed(2)}</td>
                      <td className="text-slate-300 py-2 px-3">{item.attempt.distance.toFixed(1)}</td>
                      <td className="text-slate-300 py-2 px-3">{item.attempt.peakPower.toFixed(1)}</td>
                      <td className="text-slate-300 py-2 px-3">{item.attempt.averagePower.toFixed(1)}</td>
                      <td className="text-slate-300 py-2 px-3">{item.attempt.batteryDrop.toFixed(1)}</td>
                      <td className={item.deltaTime === 0 ? 'text-slate-400' : item.deltaTime > 0 ? 'text-red-400' : 'text-green-400'} py-2 px-3>
                        {item.deltaTime === 0 ? '-' : `${item.deltaTime > 0 ? '+' : ''}${item.deltaTime.toFixed(2)}`}
                      </td>
                      <td className={item.deltaDistance === 0 ? 'text-slate-400' : item.deltaDistance > 0 ? 'text-green-400' : 'text-red-400'} py-2 px-3>
                        {item.deltaDistance === 0 ? '-' : `${item.deltaDistance > 0 ? '+' : ''}${item.deltaDistance.toFixed(1)}`}
                      </td>
                      <td className={item.deltaPeakPower === 0 ? 'text-slate-400' : item.deltaPeakPower < 0 ? 'text-green-400' : 'text-red-400'} py-2 px-3>
                        {item.deltaPeakPower === 0 ? '-' : `${item.deltaPeakPower > 0 ? '+' : ''}${item.deltaPeakPower.toFixed(1)}`}
                      </td>
                      <td className={item.deltaAvgPower === 0 ? 'text-slate-400' : item.deltaAvgPower < 0 ? 'text-green-400' : 'text-red-400'} py-2 px-3>
                        {item.deltaAvgPower === 0 ? '-' : `${item.deltaAvgPower > 0 ? '+' : ''}${item.deltaAvgPower.toFixed(1)}`}
                      </td>
                      <td className={item.deltaBatteryDrop === 0 ? 'text-slate-400' : item.deltaBatteryDrop < 0 ? 'text-green-400' : 'text-red-400'} py-2 px-3>
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
