import { memo } from 'react';
import { Eye, EyeOff, Grid3X3, Star } from 'lucide-react';
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
};

export const AccelerationTable = memo(({
  accelerationAttempts,
  showIncomplete,
  selectedColumns,
  onShowIncompleteToggle,
  onColumnToggle,
}: AccelerationTableProps) => {
  const filteredAttempts = showIncomplete
    ? accelerationAttempts
    : accelerationAttempts.filter(a => a.isComplete);

  const visibleColumns = Array.from(selectedColumns);

  // Define essential columns that should always be visible
  const essentialColumns = ['time', 'distance', 'peakPower', 'averagePower'];

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Таблица попыток</h2>
          <p className="text-xs text-slate-400 mt-1">Детальная статистика всех обнаруженных ускорений</p>
        </div>
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
      {filteredAttempts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/50 text-sm mb-2">Ускорения не найдены</p>
          <p className="text-white/30 text-xs">Выберите диапазон выше для обнаружения ускорений</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-300 font-medium">№</TableHead>
                {visibleColumns.map((col) => (
                  <TableHead key={col} className="text-slate-300 font-medium">
                    {columnLabels[col] || col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttempts.map((attempt, index) => (
                <TableRow
                  key={attempt.id}
                  className={cn(
                    "border-white/5",
                    !attempt.isComplete && "text-slate-400"
                  )}
                >
                  <TableCell className="text-slate-300">{index + 1}</TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col} className={cn(
                      !attempt.isComplete && "text-slate-400"
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
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
});

AccelerationTable.displayName = 'AccelerationTable';
