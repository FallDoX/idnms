import { memo, useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import type { ThresholdPair } from '../types';

interface AccelerationConfigProps {
  thresholdPairs: ThresholdPair[];
  onThresholdPairsChange: (pairs: ThresholdPair[]) => void;
  powerThreshold: number; // Plan 7.8
  onPowerThresholdChange: (value: number) => void; // Plan 7.8
  temperatureThreshold: number; // Plan 7.8
  onTemperatureThresholdChange: (value: number) => void; // Plan 7.8
}

const AccelerationConfig = memo(({
  thresholdPairs,
  onThresholdPairsChange,
  powerThreshold,
  onPowerThresholdChange,
  temperatureThreshold,
  onTemperatureThresholdChange
}: AccelerationConfigProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const headerButtonRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Move focus to first input when expanding, return to header when collapsing
  useEffect(() => {
    if (isExpanded && firstInputRef.current) {
      firstInputRef.current.focus();
    } else if (!isExpanded && headerButtonRef.current) {
      headerButtonRef.current.focus();
    }
  }, [isExpanded]);

  const presets = [
    { from: 0, to: 25, label: '0-25' },
    { from: 0, to: 60, label: '0-60' },
    { from: 0, to: 90, label: '0-90' },
    { from: 0, to: 100, label: '0-100' },
  ];

  const handleFromChange = (index: number, value: number) => {
    const updatedPairs = [...thresholdPairs];
    const currentPair = updatedPairs[index];
    
    // Auto-swap if from > to
    if (value > currentPair.to) {
      updatedPairs[index] = { from: currentPair.to, to: value };
    } else {
      updatedPairs[index] = { ...currentPair, from: value };
    }
    onThresholdPairsChange(updatedPairs);
  };

  const handleToChange = (index: number, value: number) => {
    const updatedPairs = [...thresholdPairs];
    const currentPair = updatedPairs[index];
    
    // Auto-swap if to < from
    if (value < currentPair.from) {
      updatedPairs[index] = { from: value, to: currentPair.from };
    } else {
      updatedPairs[index] = { ...currentPair, to: value };
    }
    onThresholdPairsChange(updatedPairs);
  };

  const handleRemove = (index: number) => {
    const updatedPairs = thresholdPairs.filter((_, i) => i !== index);
    onThresholdPairsChange(updatedPairs);
  };

  const handleAdd = () => {
    const updatedPairs = [...thresholdPairs, { from: 0, to: 60 }];
    onThresholdPairsChange(updatedPairs);
  };

  const handlePresetClick = (from: number, to: number) => {
    const updatedPairs = [...thresholdPairs, { from, to }];
    onThresholdPairsChange(updatedPairs);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 mb-4">
      {/* Compact header */}
      <button
        ref={headerButtonRef}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="acceleration-config-content"
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">
            Пороги: {thresholdPairs.length} пар
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
        <div id="acceleration-config-content" className="px-4 pb-4 border-t border-white/10 pt-4">
          {/* Threshold list */}
          <div className="space-y-2 mb-4">
            {thresholdPairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={`threshold-from-${index}`} className="block text-xs text-slate-400 mb-1">От</label>
                    <Input
                      id={`threshold-from-${index}`}
                      ref={index === 0 ? firstInputRef : undefined}
                      type="number"
                      value={pair.from}
                      onChange={(e) => handleFromChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full h-8 text-xs"
                      placeholder="0"
                      aria-label="Начальная скорость порога"
                    />
                  </div>
                  <div>
                    <label htmlFor={`threshold-to-${index}`} className="block text-xs text-slate-400 mb-1">До</label>
                    <Input
                      id={`threshold-to-${index}`}
                      type="number"
                      value={pair.to}
                      onChange={(e) => handleToChange(index, parseFloat(e.target.value) || 0)}
                      className="w-full h-8 text-xs"
                      placeholder="60"
                      aria-label="Конечная скорость порога"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="mt-5 px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                  title="Удалить"
                  aria-label="Удалить порог"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add button */}
          <Button
            onClick={handleAdd}
            variant="outline"
            size="sm"
            className="w-full mb-4 h-8 text-xs border-dashed"
            aria-label="Добавить новый порог"
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить порог
          </Button>

          {/* Presets */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Пресеты</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset.from, preset.to)}
                  className="h-7 text-xs px-2 bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  aria-label={`Добавить пресет ${preset.label}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Metrics Thresholds (Plan 7.8) */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <label className="block text-xs text-slate-400 mb-2">Пороги метрик</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="power-threshold" className="block text-xs text-slate-400 mb-1">Макс. мощность (Вт)</label>
                <Input
                  id="power-threshold"
                  type="number"
                  value={powerThreshold}
                  onChange={(e) => onPowerThresholdChange(parseFloat(e.target.value) || 2500)}
                  className="w-full h-8 text-xs"
                  placeholder="2500"
                  aria-label="Порог максимальной мощности в ваттах"
                />
              </div>
              <div>
                <label htmlFor="temperature-threshold" className="block text-xs text-slate-400 mb-1">Макс. температура (°C)</label>
                <Input
                  id="temperature-threshold"
                  type="number"
                  value={temperatureThreshold}
                  onChange={(e) => onTemperatureThresholdChange(parseFloat(e.target.value) || 45)}
                  className="w-full h-8 text-xs"
                  placeholder="45"
                  aria-label="Порог максимальной температуры в градусах Цельсия"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AccelerationConfig.displayName = 'AccelerationConfig';

export default AccelerationConfig;
