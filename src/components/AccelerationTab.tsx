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
import { AccelerationTable } from './AccelerationTable';
import { detectAccelerations } from '../utils/acceleration';
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

interface AccelerationTabProps {
  accelerationAttempts: AccelerationAttempt[];
  showIncomplete: boolean;
  selectedColumns: Set<string>;
  onShowIncompleteToggle: () => void;
  onColumnToggle: (column: string) => void;
  data: TripEntry[];
  fromSpeed: number;
  toSpeed: number;
}

const PRESET_COLORS = {
  '0-25': '#3b82f6',
  '0-60': '#10b981',
  '0-90': '#f59e0b',
  '0-100': '#ef4444',
  'custom': '#8b5cf6',
};

const PRESETS = [
  { id: '0-25', from: 0, to: 25, label: '0-25' },
  { id: '0-60', from: 0, to: 60, label: '0-60' },
  { id: '0-90', from: 0, to: 90, label: '0-90' },
  { id: '0-100', from: 0, to: 100, label: '0-100' },
  { id: 'custom', from: -1, to: -1, label: 'Настроить' },
];

export const AccelerationTab = memo(({
  accelerationAttempts,
  showIncomplete,
  selectedColumns,
  onShowIncompleteToggle,
  onColumnToggle,
  data,
  fromSpeed,
  toSpeed,
}: AccelerationTabProps) => {
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => {
      const next = new Set(prev);
      if (next.has(presetId)) {
        next.delete(presetId);
      } else {
        next.add(presetId);
      }
      return next;
    });
  };

  const accelerationChartData = useMemo(() => {
    const datasets: Array<{
      label: string;
      data: Array<{ x: number; y: number }>;
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
      tension: number;
      pointRadius: number;
    }> = [];

    selectedPresets.forEach(presetId => {
      const preset = PRESETS.find(p => p.id === presetId);
      if (!preset || preset.id === 'custom') return;

      // Detect acceleration attempts for this preset range dynamically (use to speed as target)
      const presetAttempts = detectAccelerations(data, preset.to);

      presetAttempts.forEach((attempt, index) => {
        const attemptData = data.filter(
          e => e.timestamp >= attempt.startTimestamp && e.timestamp <= attempt.endTimestamp
        );

        if (attemptData.length > 0) {
          datasets.push({
            label: `${preset.label} #${index + 1}`,
            data: attemptData.map(e => ({ x: e.timestamp, y: e.Speed })),
            borderColor: PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS],
            backgroundColor: `${PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS]}20`,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
          });
        }
      });
    });

    // Add custom preset if selected
    if (selectedPresets.has('custom') && toSpeed >= 0) {
      const customAttempts = detectAccelerations(data, toSpeed);

      customAttempts.forEach((attempt, index) => {
        const attemptData = data.filter(
          e => e.timestamp >= attempt.startTimestamp && e.timestamp <= attempt.endTimestamp
        );

        if (attemptData.length > 0) {
          datasets.push({
            label: `${fromSpeed}-${toSpeed} #${index + 1}`,
            data: attemptData.map(e => ({ x: e.timestamp, y: e.Speed })),
            borderColor: PRESET_COLORS.custom,
            backgroundColor: `${PRESET_COLORS.custom}20`,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
          });
        }
      });
    }

    return { datasets };
  }, [selectedPresets, data, fromSpeed, toSpeed]);

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

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Выберите диапазоны для графика:</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => togglePreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                selectedPresets.has(preset.id)
                  ? `${PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS]}20 border ${PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS]}50 text-white`
                  : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {selectedPresets.has('custom') && (
          <span className="text-xs text-slate-500">
            (настроено: {fromSpeed}-{toSpeed} км/ч)
          </span>
        )}
      </div>

      {/* Chart */}
      {selectedPresets.size > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[400px]">
          <Line data={accelerationChartData} options={chartOptions} />
        </div>
      )}

      {/* Table */}
      <AccelerationTable
        accelerationAttempts={accelerationAttempts}
        showIncomplete={showIncomplete}
        selectedColumns={selectedColumns}
        onShowIncompleteToggle={onShowIncompleteToggle}
        onColumnToggle={onColumnToggle}
      />
    </div>
  );
});

AccelerationTab.displayName = 'AccelerationTab';
