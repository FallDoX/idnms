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


export function AccelerationTable({ data, thresholds, onThresholdsChange }: AccelerationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStartValue, setEditStartValue] = useState('');
  const [editEndValue, setEditEndValue] = useState('');
  const updateThresholdFromSlider = useCallback((id: string, value: number) => {
    const threshold = thresholds.find(t => t.id === id);
    if (!threshold) return;
    const startVal = threshold.startValue ?? 0;
    const newLabel = `${startVal}-${value}`;
    onThresholdsChange(thresholds.map(t =>
      t.id === id ? { ...t, value: value, label: newLabel } : t
    ));
  }, [thresholds, onThresholdsChange]);

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
    onThresholdsChange([...thresholds, { id: newId, label: `0-${maxValue}`, value: maxValue, startValue: 0 }]);
    setEditingId(newId);
    setEditStartValue('0');
    setEditEndValue(maxValue.toString());
  };

  const removeThreshold = useCallback((id: string) => {
    if (thresholds.length > 1) {
      onThresholdsChange(thresholds.filter(t => t.id !== id));
      if (editingId === id) setEditingId(null);
    }
  }, [thresholds, editingId]);

  const startEdit = (threshold: SpeedThreshold) => {
    setEditingId(threshold.id);
    setEditStartValue((threshold.startValue ?? 0).toString());
    setEditEndValue(threshold.value.toString());
  };

  const saveEdit = useCallback((id: string) => {
    const newStartValue = parseInt(editStartValue);
    const newEndValue = parseInt(editEndValue);
    if (!isNaN(newEndValue) && newEndValue > 0 && !isNaN(newStartValue) && newStartValue >= 0 && newStartValue < newEndValue) {
      const newLabel = `${newStartValue}-${newEndValue}`;
      onThresholdsChange(thresholds.map(t =>
        t.id === id ? { ...t, value: newEndValue, startValue: newStartValue, label: newLabel } : t
      ));
    }
    setEditingId(null);
  }, [editStartValue, editEndValue, thresholds, onThresholdsChange]);

  const cancelEdit = () => {
    setEditingId(null);
  };

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
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/25">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Энергоэффективность</h3>
                  {/* Inline tooltip */}
                  <div className="relative group">
                    <Info className="w-4 h-4 text-slate-500 cursor-help hover:text-slate-400 transition-colors" />
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[260px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden">
                      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 border-b border-cyan-500/20">
                        <span className="text-xs font-bold text-cyan-200">Энергоэффективность</span>
                      </div>
                      <div className="p-3 text-xs text-slate-300 leading-relaxed">
                        Потребление энергии только во время движения (скорость {'>'}5 км/ч). Показывает насколько эффективно используется батарея.
                      </div>
                    </div>
                  </div>
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
                  {/* Inline tooltip */}
                  <div className="relative group">
                    <Info className="w-4 h-4 text-slate-500 cursor-help hover:text-slate-400 transition-colors" />
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[260px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-amber-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-2 border-b border-amber-500/20">
                        <span className="text-xs font-bold text-amber-200">Ускорение</span>
                      </div>
                      <div className="p-3 text-xs text-slate-300 leading-relaxed">
                        Время разгона от 0 до заданной скорости. Показывается лучшее время из всех попыток.
                      </div>
                    </div>
                  </div>
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

          {/* Quick presets - toggle on/off */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center mr-2">Шаблоны:</span>
            {[25, 50, 60, 80, 100, 120].map(val => {
              const existingThreshold = thresholds.find(t => t.value === val);
              const exists = !!existingThreshold;
              return (
                <button
                  key={val}
                  onClick={() => {
                    if (exists && existingThreshold) {
                      // Remove existing threshold
                      onThresholdsChange(thresholds.filter(t => t.id !== existingThreshold.id));
                    } else {
                      // Add new threshold
                      onThresholdsChange([...thresholds, { id: `t${val}`, label: `0-${val}`, value: val, startValue: 0 }]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    exists 
                      ? "bg-blue-500/30 border-blue-500/50 text-blue-200" 
                      : "bg-white/10 border-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  )}
                >
                  {exists && <Check className="w-3 h-3 inline mr-1" />}
                  {val} км/ч
                </button>
              );
            })}
          </div>
        </div>

        {/* Thresholds - Compact list */}
        <div className="p-5 space-y-2">
          {thresholds.map((threshold) => {
            const result = results[threshold.id];
            const time = result?.time;
            const isBest = time !== null && time === bestTime;
            const barWidth = maxTime > 0 && time !== null ? (time / maxTime) * 100 : 0;
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
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editStartValue}
                          onChange={e => setEditStartValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(threshold.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-12 bg-white/5 text-white text-sm px-2 py-1 rounded border border-white/20 focus:border-blue-500 outline-none"
                          placeholder="0"
                          min="0"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          value={editEndValue}
                          onChange={e => setEditEndValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(threshold.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="w-12 bg-white/5 text-white text-sm px-2 py-1 rounded border border-white/20 focus:border-blue-500 outline-none"
                          placeholder="60"
                          min="1"
                          max="200"
                        />
                        <button onClick={() => saveEdit(threshold.id)} className="p-1 hover:bg-white/10 rounded">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 hover:bg-white/10 rounded">
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
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

                {/* Time bar with integrated data display */}
                <div className="flex-1 h-12 bg-white/5 rounded-xl overflow-hidden relative group/bar border border-white/5">
                  {/* Scale labels - background */}
                  <div className="absolute inset-x-0 top-1 flex justify-between px-2 text-[7px] text-slate-600 font-medium">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200</span>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center px-2">
                    {/* Background track */}
                    <div className="absolute inset-x-2 h-3 bg-slate-800/50 rounded-full" />
                    
                    {/* Progress bar with gradient based on intensity */}
                    {time !== null && (
                      <>
                        <div
                          className={cn(
                            "absolute left-2 h-3 rounded-full transition-all duration-500 shadow-lg",
                            isBest 
                              ? "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-amber-500/30" 
                              : "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 shadow-blue-500/20"
                          )}
                          style={{ width: `calc(${Math.max(barWidth, 8)}% - 16px)` }}
                        />
                        {/* Shimmer effect for best */}
                        {isBest && (
                          <div className="absolute left-2 h-3 rounded-full overflow-hidden" style={{ width: `calc(${Math.max(barWidth, 8)}% - 16px)` }}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Data overlay - time and acceleration */}
                    {time !== null && (
                      <div className="absolute left-3 right-16 flex items-center justify-between z-10">
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-bold backdrop-blur-sm shadow-lg",
                          isBest 
                            ? "bg-amber-500/30 text-amber-200 border border-amber-400/50 shadow-amber-500/20" 
                            : "bg-slate-900/60 text-white border border-white/20 shadow-black/20"
                        )}>
                          {isBest && <span className="text-amber-400">🏆</span>}
                          <span className="tracking-wide">{formatTime(time)}</span>
                        </div>
                        
                        {result?.bestRun?.peakAcceleration && (
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg",
                            isBest
                              ? "bg-amber-400/20 text-amber-200 border border-amber-400/40 shadow-amber-500/20"
                              : "bg-slate-900/60 text-slate-200 border border-white/15 shadow-black/20"
                          )}>
                            <span className="opacity-70">a:</span>
                            <span className="font-bold">{result.bestRun.peakAcceleration.toFixed(2)}</span>
                            <span className="opacity-60">м/с²</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Interactive slider - visible on hover */}
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={threshold.value}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      updateThresholdFromSlider(threshold.id, newValue);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 group-hover/bar:opacity-100 cursor-pointer z-30 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-xl [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-xl [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                  />
                  
                  {/* Slider tooltip */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2.5 py-1 rounded-lg border border-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-40 shadow-xl font-medium">
                    {threshold.startValue ?? 0}-{threshold.value} км/ч
                  </div>
                </div>

                {/* Right side - simplified */}
                <div className="min-w-[60px] flex flex-col items-end">
                  {time !== null && isBest && (
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Лучший</span>
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
                  💡 <b>Подсказки:</b> Кликните на значение порога (например «0-60») чтобы изменить начало и конец • Наведите на полосу и используйте ползунок (0-200, шаг 5) • Время показывается в секундах
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
