import { memo, useState, useMemo, useEffect } from 'react';
import { ChartWithZoom } from './ChartWithZoom';
import type { AccelerationAttempt, TripEntry } from '../types';

interface AccelerationTabProps {
  accelerationAttempts: AccelerationAttempt[];
  data: TripEntry[];
  clearSettings?: () => void;
}

// WindFighter Unified Color Palette (6 core colors)
// primary: #3b82f6, success: #10b981, warning: #f59e0b, danger: #ef4444, info: #8b5cf6, accent: #06b6d4
const PRESET_COLORS = {
  '0-25': '#3b82f6',   // primary
  '0-60': '#10b981',   // success
  '0-90': '#f59e0b',   // warning
  '0-100': '#ef4444',  // danger
  'custom': '#8b5cf6', // info
};

const ATTEMPT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', // 5 core colors
  '#ec4899', '#f97316', '#06b6d4', '#a78bfa', '#fb923c'  // Extended for multiple attempts
];

const PRESETS = [
  { id: '0-25', from: 0, to: 25, label: '0-25' },
  { id: '0-60', from: 0, to: 60, label: '0-60' },
  { id: '0-90', from: 0, to: 90, label: '0-90' },
  { id: '0-100', from: 0, to: 100, label: '0-100' },
  { id: 'custom', from: -1, to: -1, label: 'Все' },
];

export const AccelerationTab = memo(({
  accelerationAttempts,
  data,
  clearSettings,
}: AccelerationTabProps) => {
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());

  // Visibility state for individual attempts
  const [visibleAttempts, setVisibleAttempts] = useState<Set<string>>(new Set());

  // Initialize visible attempts when accelerationAttempts change
  useEffect(() => {
    setVisibleAttempts(new Set(accelerationAttempts.map(a => a.id)));
  }, [accelerationAttempts]);

  const toggleAttemptVisibility = (attemptId: string) => {
    setVisibleAttempts(prev => {
      const next = new Set(prev);
      if (next.has(attemptId)) {
        next.delete(attemptId);
      } else {
        next.add(attemptId);
      }
      return next;
    });
  };

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

  // Calculate time range from selected attempts (in seconds from start)
  const timeRange = useMemo(() => {
    let maxDuration = 0;

    selectedPresets.forEach(presetId => {
      const preset = PRESETS.find(p => p.id === presetId);
      if (!preset || preset.id === 'custom') return;

      // Filter attempts that reach at least the preset target speed
      const presetAttempts = accelerationAttempts.filter(
        attempt => attempt.thresholdPair.to >= preset.to && attempt.thresholdPair.from === preset.from
      );

      presetAttempts.forEach(attempt => {
        maxDuration = Math.max(maxDuration, attempt.time);
      });
    });

    if (selectedPresets.has('custom') || selectedPresets.size === 0) {
      accelerationAttempts.forEach(attempt => {
        maxDuration = Math.max(maxDuration, attempt.time);
      });
    }

    const timeRange = maxDuration > 0 ? { start: 0, end: maxDuration } : null;
    return timeRange;
  }, [accelerationAttempts, selectedPresets, PRESETS]);

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

      // Filter attempts that reach at least the preset target speed
      const presetAttempts = accelerationAttempts.filter(
        attempt => attempt.thresholdPair.to >= preset.to && attempt.thresholdPair.from === preset.from
      );

      presetAttempts.forEach((attempt, index) => {
        // Skip if attempt is hidden
        if (!visibleAttempts.has(attempt.id)) return;

        const attemptData = data.filter(
          e => e.timestamp >= attempt.startTimestamp && e.timestamp <= attempt.endTimestamp
        );

        if (attemptData.length > 0) {
          // Find the original index of this attempt to use consistent colors
          const originalIndex = accelerationAttempts.findIndex(a => a.id === attempt.id);
          
          // Truncate data to preset target speed
          let chartData = attemptData.map(e => ({ x: (e.timestamp - attempt.startTimestamp) / 1000, y: e.Speed }));
          
          // If preset has a target speed, truncate data to that speed
          if (preset.to > 0) {
            const targetIndex = chartData.findIndex(point => point.y >= preset.to);
            if (targetIndex !== -1) {
              chartData = chartData.slice(0, targetIndex + 1);
            }
          }
          
          datasets.push({
            label: `${preset.label} #${index + 1} (${attempt.time.toFixed(2)}с, ${attempt.distance.toFixed(1)}м)`,
            data: chartData,
            borderColor: ATTEMPT_COLORS[originalIndex % ATTEMPT_COLORS.length],
            backgroundColor: `${ATTEMPT_COLORS[originalIndex % ATTEMPT_COLORS.length]}33`,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
          });
        }
      });
    });

    // Show all attempts if no presets selected OR only custom selected
    const hasOnlyCustom = selectedPresets.size === 1 && selectedPresets.has('custom');
    const hasNoPresets = selectedPresets.size === 0;
    if (hasNoPresets || hasOnlyCustom) {
      accelerationAttempts.forEach((attempt, index) => {
        // Skip if attempt is hidden
        if (!visibleAttempts.has(attempt.id)) return;

        const attemptData = data.filter(
          e => e.timestamp >= attempt.startTimestamp && e.timestamp <= attempt.endTimestamp
        );

        if (attemptData.length > 0) {
          datasets.push({
            label: `#${index + 1} (${attempt.thresholdPair.from}-${attempt.thresholdPair.to} км/ч, ${attempt.time.toFixed(2)}с, ${attempt.distance.toFixed(1)}м)`,
            data: attemptData.map(e => ({ x: (e.timestamp - attempt.startTimestamp) / 1000, y: e.Speed })),
            borderColor: ATTEMPT_COLORS[index % ATTEMPT_COLORS.length],
            backgroundColor: `${ATTEMPT_COLORS[index % ATTEMPT_COLORS.length]}33`,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
          });
        }
      });
    }

    // Return empty datasets array if no data (Chart.js requires at least empty datasets)
    console.log('Chart datasets result:', {
      datasetsCount: datasets.length,
      datasets: datasets.map(d => ({ label: d.label, dataPoints: d.data.length })),
    });
    return { datasets: datasets.length > 0 ? datasets : [] };
  }, [accelerationAttempts, selectedPresets, data, visibleAttempts]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // Hide legend - using custom toggles instead
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
  }), []);

  return (
    <div className="space-y-4">
      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {selectedPresets.size > 0 ? `Выбрано пресетов: ${selectedPresets.size}` : 'Пресеты не выбраны'}
      </div>

      {/* Header with clear settings button */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">Выберите диапазоны для графика:</span>
        {clearSettings && (
          <button
            onClick={() => {
              if (confirm('Очистить настройки ускорения? Это сбросит порог и выбранные колонки к значениям по умолчанию.')) {
                clearSettings();
                alert('Настройки очищены');
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-600/70 hover:border-slate-500 transition-all"
            aria-label="Очистить настройки ускорения"
          >
            Очистить настройки
          </button>
        )}
      </div>

      {/* Preset selector */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
          {PRESETS.map((preset) => {
            const attemptCount = preset.id === 'custom'
              ? accelerationAttempts.length
              : accelerationAttempts.filter(
                  attempt => attempt.thresholdPair.to >= preset.to && attempt.thresholdPair.from === preset.from
                ).length;

            return (
              <button
                key={preset.id}
                onClick={() => togglePreset(preset.id)}
                aria-pressed={selectedPresets.has(preset.id)}
                title={`Разгон ${preset.label} км/ч. ${attemptCount > 0 ? `Найдено попыток: ${attemptCount}` : 'Нет попыток'}`}
                className={`px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all border relative shadow-sm min-h-[44px] ${
                  selectedPresets.has(preset.id)
                    ? `${PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS]}20 border ${PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS]}60 text-white shadow-lg shadow-${PRESET_COLORS[preset.id as keyof typeof PRESET_COLORS]}/20`
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-600/70 hover:border-slate-500'
                }`}
              >
                <span className="flex items-center gap-2">
                  {preset.label}
                  {attemptCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      selectedPresets.has(preset.id)
                        ? 'bg-white/30 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {attemptCount}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {selectedPresets.has('custom') && (
          <span className="text-xs text-slate-500">
            (все попытки)
          </span>
        )}
      </div>

      {/* Attempt visibility controls */}
      {accelerationAttempts.length > 0 && (
        <div className="space-y-3">
          {/* Individual attempt toggles with matching colors - sorted by time (best first) */}
          <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
            <span className="text-xs text-slate-400 mr-1">Попытки:</span>
            {[...accelerationAttempts].sort((a, b) => a.time - b.time).map((attempt, sortedIndex) => {
              const isVisible = visibleAttempts.has(attempt.id);
              // Use original index to match colors with chart lines
              const originalIndex = accelerationAttempts.findIndex(a => a.id === attempt.id);
              const color = ATTEMPT_COLORS[originalIndex % ATTEMPT_COLORS.length];
              
              // Get selected presets that match this attempt
              const matchingPresets = PRESETS.filter(preset => 
                preset.id !== 'custom' && 
                selectedPresets.has(preset.id) &&
                attempt.thresholdPair.to >= preset.to && 
                attempt.thresholdPair.from === preset.from
              ).map(p => p.label);
              
              return (
                <button
                  key={attempt.id}
                  onClick={() => toggleAttemptVisibility(attempt.id)}
                  aria-pressed={isVisible}
                  aria-label={`Попытка #${sortedIndex + 1}: ${attempt.thresholdPair.from}-${attempt.thresholdPair.to} км/ч, ${attempt.time.toFixed(2)}с. ${isVisible ? 'Скрыть' : 'Показать'}`}
                  className="flex flex-col items-center justify-center px-2 py-1.5 md:px-3 md:py-2 rounded text-[10px] md:text-xs font-semibold transition-all border min-w-[45px] md:min-w-[55px] min-h-[44px]"
                  style={{
                    backgroundColor: isVisible ? `${color}30` : 'rgba(30, 41, 59, 0.3)',
                    borderColor: isVisible ? color : 'rgba(71, 85, 105, 0.5)',
                    color: isVisible ? color : 'rgba(100, 116, 139, 0.8)',
                    textDecoration: isVisible ? 'none' : 'line-through',
                  }}
                  title={`${attempt.thresholdPair.from}-${attempt.thresholdPair.to} км/ч, ${attempt.time.toFixed(2)}с`}
                >
                  <span className="font-bold text-xs">#{sortedIndex + 1}</span>
                  <span className="text-[9px] opacity-90">{attempt.thresholdPair.to} км/ч</span>
                  <span className="text-[9px] opacity-75">{attempt.time.toFixed(2)}с</span>
                  {matchingPresets.length > 0 && (
                    <span className="text-[8px] opacity-60 mt-0.5">
                      {matchingPresets.join(', ')}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setVisibleAttempts(new Set(accelerationAttempts.map(a => a.id)))}
              aria-label="Показать все попытки"
              className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-200 hover:bg-blue-500/30 transition-colors"
            >
              Все
            </button>
            <button
              onClick={() => setVisibleAttempts(new Set())}
              aria-label="Скрыть все попытки"
              className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-700/30 border border-slate-600 text-slate-400 hover:bg-slate-600/50 transition-colors"
            >
              Скрыть все
            </button>
          </div>
        </div>
      )}

      {/* Chart with ChartWithZoom template */}
      {accelerationAttempts.length > 0 && timeRange && (
        <ChartWithZoom
          data={accelerationChartData}
          options={chartOptions}
          height={400}
          timeRange={timeRange}
          timelineMarkers={accelerationAttempts
            .filter(a => visibleAttempts.has(a.id))
            .map((attempt) => {
              // Find original index for consistent colors
              const originalIndex = accelerationAttempts.findIndex(a => a.id === attempt.id);
              return {
                id: attempt.id,
                position: (attempt.time - timeRange.start) / (timeRange.end - timeRange.start),
                color: ATTEMPT_COLORS[originalIndex % ATTEMPT_COLORS.length],
                label: `Попытка #${originalIndex + 1}: ${attempt.time.toFixed(2)}с`,
              };
            })}
          timelineLabel="Шкала времени"
          enableMeasurement={true}
        />
      )}

    </div>
  );
});

AccelerationTab.displayName = 'AccelerationTab';
