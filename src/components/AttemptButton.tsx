import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { AccelerationAttempt } from '../types';

interface AttemptButtonProps {
  attempt: AccelerationAttempt;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
  color: string;
}

const AttemptButton = memo(({ attempt, index, selected, onSelect, color }: AttemptButtonProps) => (
  <button
    onClick={() => onSelect(index)}
    className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
      selected
        ? `${color}20 border ${color}50 text-white`
        : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
    )}
  >
    {index + 1} ({attempt.startSpeed}-{attempt.endSpeed})
  </button>
));

AttemptButton.displayName = 'AttemptButton';

export default AttemptButton;
