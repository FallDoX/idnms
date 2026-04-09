import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataPoint {
  label: string;
  value: number | null;
  color: string;
  unit?: string;
}

interface ChartInfoBarProps {
  data: DataPoint[];
  timestamp: string;
  isVisible: boolean;
  onClose: () => void;
  attemptInfo?: {
    attemptNumber: number;
    speedRange: string;
  };
}

export function ChartInfoBar({
  data,
  timestamp,
  isVisible,
  onClose,
  attemptInfo
}: ChartInfoBarProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {attemptInfo ? (
            <span className="text-xs font-semibold text-slate-200">
              Попытка {attemptInfo.attemptNumber} ({attemptInfo.speedRange})
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-200">{timestamp}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded transition-colors hover:bg-white/10 text-slate-400 hover:text-slate-200"
          title="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        {data.filter(d => d.value !== null).map((item, index) => (
          <div key={index} className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-slate-400">{item.label}:</span>
            <span className="text-xs font-semibold text-slate-100">
              {typeof item.value === 'number' && !isNaN(item.value)
                ? item.value.toFixed(item.unit === '%' ? 1 : 0)
                : '-'}
            </span>
            {item.unit && (
              <span className="text-[10px] text-slate-500">{item.unit}</span>
            )}
          </div>
        ))}
        {data.filter(d => d.value !== null).length === 0 && (
          <span className="text-xs text-slate-500">Нет данных</span>
        )}
      </div>
    </div>
  );
}
