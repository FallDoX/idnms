import { useCallback, useEffect, useState, useRef } from 'react';

interface TimeRangeSliderProps {
  data: { timestamp: number }[];
  range: { start: number; end: number } | null;
  enabled: boolean;
  onRangeChange: (range: { start: number; end: number }) => void;
  onEnabledChange: (enabled: boolean) => void;
}

export function TimeRangeSlider({ data, range, enabled, onRangeChange, onEnabledChange }: TimeRangeSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | 'track' | null>(null);
  const dragStartPos = useRef(0);
  const dragStartRange = useRef<{ start: number; end: number } | null>(null);

  if (data.length === 0 || !range) return null;

  const minTime = data[0].timestamp;
  const maxTime = data[data.length - 1].timestamp;
  const totalDuration = maxTime - minTime;

  const toPercent = (time: number) => ((time - minTime) / totalDuration) * 100;

  const startPercent = toPercent(range.start);
  const endPercent = toPercent(range.end);

  const handleMouseDown = (type: 'start' | 'end' | 'track', e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(type);
    dragStartPos.current = e.clientX;
    dragStartRange.current = { ...range };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !containerRef.current || !dragStartRange.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos.current;
    const deltaPercent = (deltaX / rect.width) * 100;
    const deltaTime = (deltaPercent / 100) * totalDuration;

    let newStart = dragStartRange.current.start;
    let newEnd = dragStartRange.current.end;

    if (dragging === 'start') {
      newStart = Math.max(minTime, Math.min(dragStartRange.current.end - 1000, dragStartRange.current.start + deltaTime));
    } else if (dragging === 'end') {
      newEnd = Math.min(maxTime, Math.max(dragStartRange.current.start + 1000, dragStartRange.current.end + deltaTime));
    } else if (dragging === 'track') {
      const duration = dragStartRange.current.end - dragStartRange.current.start;
      newStart = Math.max(minTime, Math.min(maxTime - duration, dragStartRange.current.start + deltaTime));
      newEnd = newStart + duration;
    }

    onRangeChange({ start: newStart, end: newEnd });
  }, [dragging, minTime, maxTime, totalDuration, onRangeChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}ч ${minutes % 60}м`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с`;
    return `${seconds}с`;
  };

  const selectedDuration = range.end - range.start;

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <h3 className="text-lg font-semibold text-white">Шкала времени</h3>
        </div>
        <div className="text-sm text-slate-400 text-right">
          <div>Выбрано: <span className="text-emerald-400 font-mono">{formatDuration(selectedDuration)}</span></div>
          <div className="text-xs text-slate-500">
            {formatTime(range.start)} — {formatTime(range.end)}
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative h-12 bg-slate-900 rounded-lg cursor-col-resize select-none"
      >
        {/* Full range background */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          {/* Time ticks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const time = minTime + (totalDuration * i) / 10;
            const percent = i * 10;
            return (
              <div key={i} className="absolute bottom-0" style={{ left: `${percent}%` }}>
                <div className="w-px h-2 bg-slate-700"></div>
                {i % 2 === 0 && (
                  <div className="absolute bottom-3 -translate-x-1/2 text-[10px] text-slate-600 whitespace-nowrap">
                    {formatTime(time)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected range */}
        <div
          className="absolute top-0 bottom-0 bg-blue-600/30 border-x-2 border-blue-500 transition-opacity"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
            opacity: enabled ? 1 : 0.3,
          }}
          onMouseDown={(e) => handleMouseDown('track', e)}
        >
          {/* Track drag handle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-blue-300 font-medium opacity-0 hover:opacity-100 transition-opacity">
              ⟺ {formatDuration(selectedDuration)}
            </div>
          </div>
        </div>

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-4 bg-blue-500 rounded-l-lg hover:bg-blue-400 transition-colors flex items-center justify-center"
          style={{ left: `${startPercent}%`, transform: 'translateX(-100%)' }}
          onMouseDown={(e) => handleMouseDown('start', e)}
        >
          <div className="w-1 h-6 bg-blue-300 rounded-full"></div>
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-4 bg-blue-500 rounded-r-lg hover:bg-blue-400 transition-colors flex items-center justify-center"
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => handleMouseDown('end', e)}
        >
          <div className="w-1 h-6 bg-blue-300 rounded-full"></div>
        </div>

        {/* Labels */}
        <div 
          className="absolute -top-6 text-xs text-blue-400 font-mono"
          style={{ left: `${startPercent}%`, transform: 'translateX(-50%)' }}
        >
          {formatTime(range.start)}
        </div>
        <div 
          className="absolute -top-6 text-xs text-blue-400 font-mono"
          style={{ left: `${endPercent}%`, transform: 'translateX(-50%)' }}
        >
          {formatTime(range.end)}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onRangeChange({ start: minTime, end: maxTime })}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded transition-colors"
        >
          Весь диапазон
        </button>
        <button
          onClick={() => {
            const quarter = totalDuration / 4;
            onRangeChange({ start: minTime, end: minTime + quarter });
          }}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded transition-colors"
        >
          Первая четверть
        </button>
        <button
          onClick={() => {
            const half = totalDuration / 2;
            onRangeChange({ start: minTime + half / 2, end: minTime + half / 2 + half });
          }}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded transition-colors"
        >
          Середина
        </button>
        <button
          onClick={() => {
            const quarter = totalDuration / 4;
            onRangeChange({ start: maxTime - quarter, end: maxTime });
          }}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded transition-colors"
        >
          Последняя четверть
        </button>
      </div>
    </div>
  );
}
