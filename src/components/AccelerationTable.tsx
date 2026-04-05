import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Trophy, Edit2, Check, X, Zap, Battery, Gauge, Info } from 'lucide-react';
import type { TripEntry, SpeedThreshold } from '../types';
import { getAccelerationForThresholds } from '../utils/parser';
import { Tooltip } from './Tooltip';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccelerationTableProps {
  data: TripEntry[];
  thresholds: SpeedThreshold[];
  onThresholdsChange: (thresholds: SpeedThreshold[]) => void;
}

const THRESHOLD_COLORS = [
  { bg: 'from-emerald-500/20', text: 'text-emerald-400', active: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { bg: 'from-blue-500/20', text: 'text-blue-400', active: 'bg-blue-500', ring: 'ring-blue-400' },
  { bg: 'from-purple-500/20', text: 'text-purple-400', active: 'bg-purple-500', ring: 'ring-purple-400' },
  { bg: 'from-orange-500/20', text: 'text-orange-400', active: 'bg-orange-500', ring: 'ring-orange-400' },
  { bg: 'from-pink-500/20', text: 'text-pink-400', active: 'bg-pink-500', ring: 'ring-pink-400' },
  { bg: 'from-cyan-500/20', text: 'text-cyan-400', active: 'bg-cyan-500', ring: 'ring-cyan-400' },
];

export function AccelerationTable({ data, thresholds, onThresholdsChange }: AccelerationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const results = useMemo(() => 
    getAccelerationForThresholds(data, thresholds),
    [data, thresholds]
  );

  // Consumption summary
  const consumptionStats = useMemo(() => {
    if (data.length < 2) return null;

    // Find moving segments (speed > 5 km/h)
    const movingSegments = data.filter(e => e.Speed > 5);
    if (movingSegments.length < 2) return null;

    const startTime = movingSegments[0].timestamp;
    const endTime = movingSegments[movingSegments.length - 1].timestamp;
    const duration = (endTime - startTime) / 1000; // seconds

    // Average consumption
    const avgPower = movingSegments.reduce((sum, e) => sum + e.Power, 0) / movingSegments.length;
    const avgCurrent = movingSegments.reduce((sum, e) => sum + e.Current, 0) / movingSegments.length;
    const avgVoltage = movingSegments.reduce((sum, e) => sum + e.Voltage, 0) / movingSegments.length;

    // Battery drop
    const startBattery = movingSegments[0].BatteryLevel;
    const endBattery = movingSegments[movingSegments.length - 1].BatteryLevel;
    const batteryDrop = startBattery - endBattery;

    // Wh per km
    const startDist = movingSegments[0].TotalDistance;
    const endDist = movingSegments[movingSegments.length - 1].TotalDistance;
    const distance = endDist - startDist;
    const whPerKm = distance > 0 ? (avgPower * duration / 3600) / distance * 1000 : 0;

    // Max values
    const maxPower = Math.max(...movingSegments.map(e => e.Power));
    const maxCurrent = Math.max(...movingSegments.map(e => Math.abs(e.Current)));

    // Calculate maximum battery drop during the trip
    let maxBatteryDrop = 0;
    let peakBattery = data[0].BatteryLevel || 0;
    for (let i = 1; i < data.length; i++) {
      const currentBattery = data[i].BatteryLevel || 0;
      if (currentBattery > peakBattery) {
        peakBattery = currentBattery;
      } else {
        const drop = peakBattery - currentBattery;
        if (drop > maxBatteryDrop) {
          maxBatteryDrop = drop;
        }
      }
    }

    return {
      duration,
      avgPower,
      avgCurrent,
      avgVoltage,
      batteryDrop,
      maxBatteryDrop,
      whPerKm,
      maxPower,
      maxCurrent,
      distance,
      avgSpeed: movingSegments.reduce((sum, e) => sum + e.Speed, 0) / movingSegments.length,
    };
  }, [data]);

  const validTimes = Object.values(results).map(r => r.time).filter((t): t is number => t !== null);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const maxTime = Math.max(...Object.values(results).map(r => r.time ?? 0));

  const addThreshold = () => {
    const newId = `t${Date.now()}`;
    const maxValue = Math.max(...thresholds.map(t => t.value)) + 10;
    onThresholdsChange([...thresholds, { id: newId, label: `0-${maxValue}`, value: maxValue }]);
    setEditingId(newId);
    setEditValue(maxValue.toString());
  };

  const removeThreshold = useCallback((id: string) => {
    if (thresholds.length > 1) {
      onThresholdsChange(thresholds.filter(t => t.id !== id));
      if (editingId === id) setEditingId(null);
    }
  }, [thresholds, editingId]);

  const startEdit = (threshold: SpeedThreshold) => {
    setEditingId(threshold.id);
    setEditValue(threshold.value.toString());
  };

  const saveEdit = useCallback((id: string) => {
    const newValue = parseInt(editValue);
    if (!isNaN(newValue) && newValue > 0) {
      const newLabel = `0-${newValue}`;
      onThresholdsChange(thresholds.map(t =>
        t.id === id ? { ...t, value: newValue, label: newLabel } : t
      ));
    }
    setEditingId(null);
  }, [editValue, thresholds, onThresholdsChange]);

  const cancelEdit = () => setEditingId(null);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '—';
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)} мс`;
    }
    return `${seconds.toFixed(2)} с`;
  };

  const formatTimeShort = (seconds: number | null): string => {
    if (seconds === null) return '—';
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)} мс`;
    
    // Format as hours, minutes, seconds for readability
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}ч ${mins}м ${secs}с`;
    } else if (mins > 0) {
      return `${mins}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  // Discover all available numeric metrics from the dataset
  const availableMetrics = useMemo(() => {
    if (data.length === 0) return [];

    const metrics = new Map<string, { label: string; unit: string; sample: number }>();

    // Check known fields
    const checkField = (field: keyof TripEntry, label: string, unit: string) => {
      const val = data[0][field];
      if (val !== undefined && val !== null && typeof val === 'number') {
        metrics.set(field as string, { label, unit, sample: val });
      }
    };

    checkField('PhaseCurrent', 'Фазный ток', 'A');
    checkField('Torque', 'Момент', 'Nm');
    checkField('Temp2', 'Темп 2', '°C');
    checkField('GPSHeading', 'GPS курс', '°');
    checkField('GPSDistance', 'GPS дист.', 'м');
    checkField('Tilt', 'Наклон', '°');
    checkField('Roll', 'Крен', '°');
    checkField('Pitch', 'Тангаж', '°');
    checkField('Distance', 'Дистанция', 'км');

    // Check raw data for additional metrics
    const sampleRaw = data[0].rawData;
    if (sampleRaw) {
      for (const [key, value] of Object.entries(sampleRaw)) {
        if (typeof value === 'number' && !metrics.has(key)) {
          const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          metrics.set(key, { label: cleanKey, unit: '', sample: value });
        }
      }
    }

    return Array.from(metrics.entries())
      .filter(([_, info]) => !isNaN(info.sample) && info.sample !== 0)
      .slice(0, 8); // Limit to 8 additional metrics
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Consumption Summary - Energy efficiency while riding */}
      {consumptionStats && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Энергоэффективность</h3>
                  <Tooltip content="Потребление энергии только во время движения (скорость >5 км/ч). Показывает насколько эффективно используется батарея.">
                    <Info className="w-4 h-4 text-slate-500 cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-xs text-slate-400">
                  Время в движении: {formatTimeShort(consumptionStats.duration)} • Расстояние: {(consumptionStats.distance / 1000).toFixed(1)} км
                </p>
              </div>
            </div>
          </div>
          
          {/* Main stats row */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-3">
              <Tooltip content="Средняя мощность за время движения">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Ср. мощность</span>
                </div>
              </Tooltip>
              <p className="text-xl font-bold text-white">{consumptionStats.avgPower.toFixed(0)} <span className="text-xs text-slate-500">Вт</span></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <Tooltip content="Потребление энергии на 1 км пути — чем меньше, тем эффективнее поездка">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Вт⋅ч/км</span>
                </div>
              </Tooltip>
              <p className="text-xl font-bold text-white">{consumptionStats.whPerKm.toFixed(0)} <span className="text-xs text-slate-500">Вт⋅ч/км</span></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <Tooltip content="Разряд батареи за поездку">
                <div className="flex items-center gap-2 mb-1">
                  <Battery className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Разряд батареи</span>
                </div>
              </Tooltip>
              <p className="text-xl font-bold text-white">{consumptionStats.batteryDrop.toFixed(1)} <span className="text-xs text-slate-500">%</span></p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <Tooltip content="Максимальная просадка батареи за поездку — от любого пика до минимума">
                <div className="flex items-center gap-2 mb-1">
                  <Battery className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">Макс. просадка</span>
                </div>
              </Tooltip>
              <p className="text-xl font-bold text-white">{consumptionStats.maxBatteryDrop.toFixed(1)} <span className="text-xs text-slate-500">%</span></p>
            </div>
          </div>

          {/* Dynamic Metrics from available sensors */}
          {availableMetrics.length > 0 && (
            <div className="px-5 pb-5">
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Дополнительные датчики ({availableMetrics.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availableMetrics.map(([key, info]) => (
                    <div key={key} className="bg-white/3 rounded-lg p-2.5 border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{info.label}</span>
                      <p className="text-sm font-semibold text-slate-300">
                        {info.sample.toFixed(1)} <span className="text-[10px] text-slate-500">{info.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acceleration Thresholds */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
                <Trophy className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Ускорение</h3>
                  <Tooltip content="Время разгона от 0 до заданной скорости. Показывается лучшее время из всех попыток.">
                    <Info className="w-4 h-4 text-slate-500 cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-xs text-slate-400">
                  {bestTime !== null ? `Лучшее: ${formatTime(bestTime)}` : 'Кликните для редактирования'}
                </p>
              </div>
            </div>
            <Tooltip content="Добавить новый порог скорости">
              <button
                onClick={addThreshold}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-blue-500/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center mr-2">Быстро:</span>
            {[25, 50, 60, 80, 100, 120].map(val => {
              const exists = thresholds.some(t => t.value === val);
              return (
                <button
                  key={val}
                  onClick={() => !exists && onThresholdsChange([...thresholds, { id: `t${val}`, label: `0-${val}`, value: val }])}
                  disabled={exists}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                    exists 
                      ? "bg-white/5 text-slate-600 cursor-not-allowed line-through" 
                      : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  )}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thresholds - Compact list */}
        <div className="p-5 space-y-2">
          {thresholds.map((threshold, index) => {
            const result = results[threshold.id];
            const time = result?.time;
            const isBest = time !== null && time === bestTime;
            const barWidth = maxTime > 0 && time !== null ? (time / maxTime) * 100 : 0;
            const colorIdx = index % THRESHOLD_COLORS.length;
            const colors = THRESHOLD_COLORS[colorIdx];
            const isEditing = editingId === threshold.id;

            return (
              <div 
                key={threshold.id} 
                className={cn(
                  "group flex items-center gap-4 p-3 rounded-xl border transition-all",
                  isBest 
                    ? "bg-amber-500/5 border-amber-500/30" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                {/* Label */}
                <div className="min-w-[100px]">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(threshold.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-14 bg-white/5 text-white text-sm px-2 py-1 rounded border border-white/20 focus:border-blue-500 outline-none"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(threshold.id)} className="p-1 hover:bg-white/10 rounded">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(threshold)}
                      className={cn("font-semibold text-sm flex items-center gap-1", isBest ? "text-amber-400" : "text-white")}
                    >
                      {isBest && '🏆'}
                      {threshold.label}
                      <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>

                {/* Time bar */}
                <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                  {time !== null ? (
                    <div
                      className={cn(
                        "h-full bg-gradient-to-r rounded-lg transition-all duration-500 flex items-center px-3",
                        colors.bg.replace('/20', ''),
                        isBest && `ring-1 ${colors.ring}`
                      )}
                      style={{ width: `${Math.max(barWidth, 15)}%` }}
                    >
                      <span className="text-white font-bold text-sm">{formatTime(time)}</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-slate-500 text-xs">—</span>
                    </div>
                  )}
                </div>

                {/* Delete */}
                {thresholds.length > 1 && !isEditing && (
                  <button
                    onClick={() => removeThreshold(threshold.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* Help hint */}
        <div className="px-5 pb-4 pt-2">
          <p className="text-[10px] text-slate-500 flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>
                  💡 <b>Подсказки:</b> Кликните на значение порога (например «0-60») чтобы изменить • Наведите на метрику для подсказки • Время показывается в секундах
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
