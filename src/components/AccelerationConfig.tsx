import React, { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const presets = [
    { from: 0, to: 25, label: '0-25' },
    { from: 0, to: 60, label: '0-60' },
    { from: 30, to: 100, label: '30-100' },
    { from: 60, to: 120, label: '60-120' },
  ];

  const handleFromSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value) || 0;
    // Auto-correct negative values
    if (value < 0) value = 0;
    // Auto-swap if from > to
    if (value > toSpeed) {
      onFromSpeedChange(toSpeed);
      onToSpeedChange(value);
    } else {
      onFromSpeedChange(value);
    }
  };

  const handleToSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value) || 0;
    // Auto-correct negative values
    if (value < 0) value = 0;
    // Auto-swap if to < from
    if (value < fromSpeed) {
      onToSpeedChange(fromSpeed);
      onFromSpeedChange(value);
    } else {
      onToSpeedChange(value);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-4">Пороги ускорения</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">От (км/ч)</label>
          <Input
            type="number"
            value={fromSpeed}
            onChange={handleFromSpeedChange}
            onBlur={onFromSpeedBlur}
            className="w-full"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">До (км/ч)</label>
          <Input
            type="number"
            value={toSpeed}
            onChange={handleToSpeedChange}
            onBlur={onToSpeedBlur}
            className="w-full"
            placeholder="60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Быстрые пресеты</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => onPresetSelect(preset.from, preset.to)}
              className={cn(
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
  );
});

AccelerationConfig.displayName = 'AccelerationConfig';

export default AccelerationConfig;
