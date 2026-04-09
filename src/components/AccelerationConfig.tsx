import { memo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface AccelerationConfigProps {
  fromSpeed: number;
  toSpeed: number;
  onFromSpeedChange: (value: number) => void;
  onToSpeedChange: (value: number) => void;
  onPresetSelect: (from: number, to: number) => void;
  onFromSpeedBlur?: () => void;
  onToSpeedBlur?: () => void;
}

const AccelerationConfig = memo(({
  fromSpeed,
  toSpeed,
  onFromSpeedChange,
  onToSpeedChange,
  onPresetSelect,
  onFromSpeedBlur,
  onToSpeedBlur
}: AccelerationConfigProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const presets = [
    { from: 0, to: 25, label: '0-25' },
    { from: 0, to: 60, label: '0-60' },
    { from: 0, to: 90, label: '0-90' },
    { from: 0, to: 100, label: '0-100' },
  ];

  const handleFromSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value) || 0;
    if (value < 0) value = 0;
    if (value > toSpeed) {
      onFromSpeedChange(toSpeed);
      onToSpeedChange(value);
    } else {
      onFromSpeedChange(value);
    }
  };

  const handleToSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value) || 0;
    if (value < 0) value = 0;
    if (value < fromSpeed) {
      onToSpeedChange(fromSpeed);
      onFromSpeedChange(value);
    } else {
      onToSpeedChange(value);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 mb-4">
      {/* Compact header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">
            Пороги: {fromSpeed}-{toSpeed} км/ч
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">От (км/ч)</label>
              <Input
                type="number"
                value={fromSpeed}
                onChange={handleFromSpeedChange}
                onBlur={onFromSpeedBlur}
                className="w-full h-8 text-xs"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">До (км/ч)</label>
              <Input
                type="number"
                value={toSpeed}
                onChange={handleToSpeedChange}
                onBlur={onToSpeedBlur}
                className="w-full h-8 text-xs"
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Пресеты</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => onPresetSelect(preset.from, preset.to)}
                  className={cn(
                    "h-7 text-xs px-2",
                    fromSpeed === preset.from && toSpeed === preset.to
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  )}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AccelerationConfig.displayName = 'AccelerationConfig';

export default AccelerationConfig;
