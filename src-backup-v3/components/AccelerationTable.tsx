import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Trophy, Edit2, Check, X } from 'lucide-react';
import type { TripEntry, SpeedThreshold } from '../types';
import { getAccelerationForThresholds } from '../utils/parser';
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

const COLORS = [
  { from: 'emerald', to: 'emerald', ring: 'ring-emerald-400' },
  { from: 'blue', to: 'blue', ring: 'ring-blue-400' },
  { from: 'purple', to: 'purple', ring: 'ring-purple-400' },
  { from: 'orange', to: 'orange', ring: 'ring-orange-400' },
  { from: 'pink', to: 'pink', ring: 'ring-pink-400' },
  { from: 'cyan', to: 'cyan', ring: 'ring-cyan-400' },
  { from: 'yellow', to: 'yellow', ring: 'ring-yellow-400' },
  { from: 'red', to: 'red', ring: 'ring-red-400' },
];

const GRADIENTS = [
  'from-emerald-500 to-emerald-600',
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
  'from-yellow-500 to-yellow-600',
  'from-red-500 to-red-600',
];

export function AccelerationTable({ data, thresholds, onThresholdsChange }: AccelerationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editLabel, setEditLabel] = useState('');

  // Sync edit fields when threshold changes while editing
  useEffect(() => {
    if (editingId) {
      const threshold = thresholds.find(t => t.id === editingId);
      if (threshold) {
        setEditValue(threshold.value.toString());
        setEditLabel(threshold.label);
      }
    }
  }, [thresholds, editingId]);

  // Results are computed from current thresholds - no reparse needed!
  const results = useMemo(() => 
    getAccelerationForThresholds(data, thresholds),
    [data, thresholds]
  );

  const addThreshold = () => {
    const newId = `t${Date.now()}`;
    const maxValue = Math.max(...thresholds.map(t => t.value)) + 10;
    onThresholdsChange([...thresholds, { id: newId, label: `0-${maxValue}`, value: maxValue }]);
  };

  const removeThreshold = (id: string) => {
    if (thresholds.length > 1) {
      onThresholdsChange(thresholds.filter(t => t.id !== id));
    }
  };

  const startEdit = (threshold: SpeedThreshold) => {
    setEditingId(threshold.id);
    setEditValue(threshold.value.toString());
    setEditLabel(threshold.label);
  };

  const saveEdit = (id: string) => {
    const newValue = parseInt(editValue);
    if (!isNaN(newValue) && newValue > 0) {
      onThresholdsChange(thresholds.map(t =>
        t.id === id ? { ...t, value: newValue, label: editLabel || `0-${newValue}` } : t
      ));
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setEditLabel('');
  };

  const formatTimeShort = (seconds: number | null): string => {
    if (seconds === null) return '—';
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}мс`;
    return `${seconds.toFixed(3)}с`;
  };

  // Find best time for highlighting
  const validTimes = Object.values(results).map(r => r.time).filter((t): t is number => t !== null);
  const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : null;
  const maxTime = Math.max(...Object.values(results).map(r => r.time ?? 0));

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Trophy className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ускорение по порогам</h3>
              <p className="text-xs text-slate-400">Лучшие времена разгона</p>
            </div>
          </div>
          <button
            onClick={addThreshold}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            Добавить порог
          </button>
        </div>
      </div>

      {/* Thresholds List */}
      <div className="p-5 space-y-4">
        {thresholds.map((threshold, index) => {
          const result = results[threshold.id];
          const time = result?.time;
          const isBest = time !== null && time === bestTime;
          const barWidth = maxTime > 0 && time !== null ? (time / maxTime) * 100 : 0;
          const colorIdx = index % GRADIENTS.length;

          return (
            <div key={threshold.id} className="flex items-center gap-3 group">
              {/* Threshold Label */}
              <div className="min-w-[140px]">
                {editingId === threshold.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className="w-16 bg-white/5 text-white text-sm px-2 py-1.5 rounded border border-white/20 focus:border-blue-500 outline-none"
                      placeholder="Название"
                      autoFocus
                    />
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(threshold.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="w-14 bg-white/5 text-white text-sm px-2 py-1.5 rounded border border-white/20 focus:border-blue-500 outline-none"
                      placeholder="км/ч"
                    />
                    <button
                      onClick={() => saveEdit(threshold.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(threshold)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full",
                      isBest ? "bg-amber-500/10 border border-amber-500/30" : "hover:bg-white/5"
                    )}
                  >
                    <span className={cn(
                      "font-semibold text-sm",
                      isBest ? "text-amber-400" : "text-white"
                    )}>
                      {isBest && '🏆 '}
                      {threshold.label} км/ч
                    </span>
                    <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>

              {/* Time Bar */}
              <div className="flex-1">
                <div className="h-10 bg-white/5 rounded-lg overflow-hidden relative">
                  {time !== null && (
                    <div
                      className={cn(
                        "h-full bg-gradient-to-r rounded-lg transition-all duration-700 ease-out flex items-center px-3",
                        GRADIENTS[colorIdx],
                        isBest && `ring-2 ${COLORS[colorIdx].ring}`
                      )}
                      style={{ width: `${Math.max(barWidth, 12)}%` }}
                    >
                      <span className="text-white font-bold text-sm whitespace-nowrap">
                        {formatTimeShort(time)}
                      </span>
                    </div>
                  )}
                  {time === null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-slate-500 text-sm">Не достигнуто</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acceleration Info */}
              {time !== null && result?.bestRun && (
                <div className="min-w-[100px] text-right">
                  <div className="text-xs text-slate-400">
                    <div>пик <span className="text-slate-300 font-medium">{result.bestRun.peakAcceleration.toFixed(2)}</span> м/с²</div>
                    <div>ср <span className="text-slate-300 font-medium">{result.bestRun.avgAcceleration.toFixed(2)}</span> м/с²</div>
                  </div>
                </div>
              )}

              {/* Delete Button */}
              {thresholds.length > 1 && editingId !== threshold.id && (
                <button
                  onClick={() => removeThreshold(threshold.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10 bg-white/5 text-xs text-slate-500 flex items-center gap-4">
        <span>💡 Кликните на порог для редактирования</span>
        <span>•</span>
        <span>Enter - сохранить, Esc - отмена</span>
      </div>
    </div>
  );
}
