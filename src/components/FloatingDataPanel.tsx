import { useCallback, useRef, useState } from 'react';
import { X, GripVertical, Lock, LockOpen } from 'lucide-react';
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

interface FloatingDataPanelProps {
  data: DataPoint[];
  timestamp: string;
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  isFrozen: boolean;
  onToggleFreeze: () => void;
}

export function FloatingDataPanel({ 
  data, 
  timestamp, 
  isVisible, 
  onClose, 
  position, 
  onPositionChange,
  isFrozen,
  onToggleFreeze
}: FloatingDataPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from header/grip area
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panelX: position.x,
        panelY: position.y
      };
      e.preventDefault();
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      onPositionChange({
        x: dragStart.current.panelX + dx,
        y: dragStart.current.panelY + dy
      });
    }
  }, [isDragging, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-2xl",
        "w-[220px] overflow-hidden select-none",
        isDragging && "cursor-grabbing",
        isFrozen
          ? "border-2 border-amber-500/50 shadow-amber-500/20"
          : "border border-white/20"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header with drag handle */}
      <div className={cn(
        "drag-handle flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing",
        isFrozen 
          ? "bg-gradient-to-r from-amber-900/60 to-amber-800/60 border-amber-500/30" 
          : "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-white/10"
      )}>
        <div className="flex items-center gap-2">
          <GripVertical className={cn(
            "w-4 h-4",
            isFrozen ? "text-amber-400" : "text-slate-400"
          )} />
          <span className={cn(
            "text-xs font-semibold",
            isFrozen ? "text-amber-200" : "text-slate-200"
          )}>{timestamp}</span>
          {isFrozen && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
              LOCKED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Freeze/Unfreeze button */}
          <button 
            onClick={onToggleFreeze}
            className={cn(
              "p-1 rounded transition-colors",
              isFrozen 
                ? "hover:bg-amber-500/30 text-amber-400" 
                : "hover:bg-white/10 text-slate-400 hover:text-slate-200"
            )}
            title={isFrozen ? "Разморозить" : "Заморозить"}
          >
            {isFrozen ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
          </button>
          <button 
            onClick={onClose}
            className={cn(
              "p-1 rounded transition-colors",
              isFrozen 
                ? "hover:bg-amber-500/30 text-amber-400 hover:text-amber-200" 
                : "hover:bg-white/10 text-slate-400 hover:text-slate-200"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data rows */}
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {data.filter(d => d.value !== null).map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-300">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-100">
                {typeof item.value === 'number' && !isNaN(item.value) 
                  ? item.value.toFixed(item.unit === '%' ? 1 : 0)
                  : '-'}
              </span>
              {item.unit && (
                <span className="text-[10px] text-slate-500 ml-1">{item.unit}</span>
              )}
            </div>
          </div>
        ))}
        {data.filter(d => d.value !== null).length === 0 && (
          <p className="text-xs text-slate-500 text-center py-2">Нет данных</p>
        )}
      </div>
    </div>
  );
}
