import { memo, useState, useMemo } from 'react';
import { Eye, EyeOff, Grid3X3, Star, ChevronRight, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import type { AccelerationAttempt } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AccelerationTableProps {
  accelerationAttempts: AccelerationAttempt[];
  showIncomplete: boolean;
  selectedColumns: Set<string>;
  onShowIncompleteToggle: () => void;
  onColumnToggle: (column: string) => void;
  onSelectionToggle?: (attemptId: string) => void;
  selectedAttempts?: Set<string>;
  powerThreshold?: number; // Plan 7.8
  temperatureThreshold?: number; // Plan 7.8
}

const columnLabels: Record<string, string> = {
  time: 'Время (с)',
  distance: 'Дистанция (м)',
  averagePower: 'Средняя мощность (Вт)',
  peakPower: 'Пиковая мощность (Вт)',
  averageCurrent: 'Средний ток (А)',
  averageVoltage: 'Среднее напряжение (В)',
  batteryDrop: 'Падение батареи (%)',
  averageTemperature: 'Средняя температура (°C)',
  startSpeed: 'Начальная скорость (км/ч)',
  endSpeed: 'Конечная скорость (км/ч)',
  targetSpeed: 'Целевая скорость (км/ч)',
  thresholdPair: 'Порог',
  // Advanced metrics (Phase 7)
  powerEfficiency: 'Эфф. мощн. (Вт/(км/ч))',
  powerConsistency: 'Согл. мощн. (0-1)',
  batteryDropRate: 'Пад. бат./с (%/с)',
  energyPerKm: 'Энерг./км (Wh/km)',
  temperaturePowerCorrelation: 'Корр. темп.',
  temperatureEfficiency: 'Эфф. темп. (0-1)',
};

export const AccelerationTable = memo(({
  accelerationAttempts,
  showIncomplete,
  selectedColumns,
  onShowIncompleteToggle,
  onColumnToggle,
  onSelectionToggle,
  selectedAttempts,
  powerThreshold,
  temperatureThreshold,
}: AccelerationTableProps) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [minPower, setMinPower] = useState<number | null>(null);
  const [maxTemperature, setMaxTemperature] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const filteredAttempts = useMemo(() => {
    let attempts = showIncomplete
      ? accelerationAttempts
      : accelerationAttempts.filter(a => a.isComplete);

    // Apply power filter
    if (minPower !== null) {
      attempts = attempts.filter(a => a.peakPower >= minPower);
    }

    // Apply temperature filter
    if (maxTemperature !== null) {
      attempts = attempts.filter(a => a.averageTemperature <= maxTemperature);
    }

    return attempts;
  }, [accelerationAttempts, showIncomplete, minPower, maxTemperature]);

  const sortedAttempts = useMemo(() => {
    if (!sortColumn) return filteredAttempts;
    
    return [...filteredAttempts].sort((a, b) => {
      const aVal = a[sortColumn as keyof AccelerationAttempt];
      const bVal = b[sortColumn as keyof AccelerationAttempt];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      // Handle thresholdPair comparison
      if (sortColumn === 'thresholdPair') {
        const aPair = `${a.thresholdPair.from}-${a.thresholdPair.to}`;
        const bPair = `${b.thresholdPair.from}-${b.thresholdPair.to}`;
        return sortDirection === 'asc' ? aPair.localeCompare(bPair) : bPair.localeCompare(aPair);
      }
      
      return 0;
    });
  }, [filteredAttempts, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const visibleColumns = Array.from(selectedColumns);

  // Define essential columns that should always be visible
  const essentialColumns = ['time', 'distance', 'peakPower', 'averagePower', 'powerEfficiency', 'energyPerKm'];

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex justify-center items-center gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Таблица попыток</h2>
          <p className="text-xs text-slate-400 mt-1">Детальная статистика всех обнаруженных ускорений</p>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title={collapsed ? "Развернуть" : "Свернуть"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>
        <button
          onClick={onShowIncompleteToggle}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 border text-sm",
            showIncomplete
              ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
          )}
          title={showIncomplete ? "Скрыть неполные попытки" : "Показать неполные попытки"}
        >
          {showIncomplete ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
          <span className="hidden sm:inline">Неполные</span>
        </button>
      </div>

      {!collapsed && (
        <div>
          {/* Filter Section */}
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-300">Фильтры</h3>
              <button
                onClick={() => {
                  setMinPower(null);
                  setMaxTemperature(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                title="Сбросить фильтры"
              >
                Сбросить
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Мин. мощность (Вт)</label>
                <input
                  type="number"
                  value={minPower ?? ''}
                  onChange={(e) => setMinPower(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Нет"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Макс. температура (°C)</label>
                <input
                  type="number"
                  value={maxTemperature ?? ''}
                  onChange={(e) => setMaxTemperature(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Нет"
                  className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Column Selector - simplified */}
          <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Отображаемые столбцы
              </h3>
              <button
                onClick={() => {
                  essentialColumns.forEach(col => onColumnToggle(col));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20"
              >
                <Star className="w-3.5 h-3.5" />
                Основные
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Выберите метрики для отображения. Основные: время, дистанция, мощность
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {Object.entries(columnLabels).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(key)}
                    onChange={() => onColumnToggle(key)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className={cn(
                    "text-xs transition-colors",
                    selectedColumns.has(key) ? "text-slate-200 font-medium" : "text-slate-400 group-hover:text-slate-300"
                  )}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Table */}
          {sortedAttempts.length === 0 ? (
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="text-white/50 text-sm mb-2">Нет попыток разгона</p>
                  <p className="text-white/30 text-xs">Настройте пороги или загрузите другой файл</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    {onSelectionToggle && <TableHead className="text-slate-300 font-medium w-10"></TableHead>}
                    <TableHead className="text-slate-300 font-medium">№</TableHead>
                    {visibleColumns.map((col) => (
                      <TableHead 
                        key={col} 
                        className="text-slate-300 font-medium cursor-pointer hover:text-slate-200 transition-colors"
                        onClick={() => handleSort(col)}
                      >
                        <div className="flex items-center gap-1">
                          {columnLabels[col] || col}
                          {sortColumn === col && (
                            <span className="text-xs">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAttempts.map((attempt, index) => (
                    <TableRow
                      key={attempt.id}
                      className={cn(
                        "border-white/5",
                        !attempt.isComplete && "text-slate-400"
                      )}
                    >
                      {onSelectionToggle && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedAttempts?.has(attempt.id) || false}
                            onChange={() => onSelectionToggle(attempt.id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-slate-300">{index + 1}</TableCell>
                      {visibleColumns.map((col) => (
                        <TableCell key={col} className={cn(
                          !attempt.isComplete && "text-slate-400",
                          // Visual warnings for threshold violations (Plan 7.8)
                          col === 'peakPower' && powerThreshold && attempt.peakPower > powerThreshold && "text-red-400 font-semibold",
                          col === 'averageTemperature' && temperatureThreshold && attempt.averageTemperature > temperatureThreshold && "text-orange-400 font-semibold"
                        )}>
                          {col === 'time' && `${attempt.time.toFixed(2)}`}
                          {col === 'distance' && `${attempt.distance.toFixed(1)}`}
                          {col === 'averagePower' && `${attempt.averagePower.toFixed(1)}`}
                          {col === 'peakPower' && `${attempt.peakPower.toFixed(1)}`}
                          {col === 'averageCurrent' && `${attempt.averageCurrent.toFixed(2)}`}
                          {col === 'averageVoltage' && `${attempt.averageVoltage.toFixed(1)}`}
                          {col === 'batteryDrop' && `${attempt.batteryDrop.toFixed(1)}`}
                          {col === 'averageTemperature' && `${attempt.averageTemperature.toFixed(1)}`}
                          {col === 'startSpeed' && `${attempt.startSpeed.toFixed(1)}`}
                          {col === 'endSpeed' && `${attempt.endSpeed.toFixed(1)}`}
                          {col === 'targetSpeed' && `${attempt.targetSpeed.toFixed(1)}`}
                      {col === 'thresholdPair' && `${attempt.thresholdPair.from}-${attempt.thresholdPair.to}`}
                      {col === 'powerEfficiency' && `${attempt.powerEfficiency.toFixed(2)}`}
                      {col === 'powerConsistency' && `${attempt.powerConsistency.toFixed(3)}`}
                      {col === 'batteryDropRate' && `${attempt.batteryDropRate.toFixed(3)}`}
                      {col === 'energyPerKm' && `${attempt.energyPerKm.toFixed(1)}`}
                      {col === 'temperaturePowerCorrelation' && `${attempt.temperaturePowerCorrelation.toFixed(3)}`}
                      {col === 'temperatureEfficiency' && `${attempt.temperatureEfficiency.toFixed(3)}`}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
          )}
        </div>
      )}
    </div>
  );
});

AccelerationTable.displayName = 'AccelerationTable';
