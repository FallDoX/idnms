import React, { memo } from 'react';
import { AccelerationTable } from './AccelerationTable';
import type { AccelerationAttempt } from '../types';

interface AccelerationTabProps {
  accelerationAttempts: AccelerationAttempt[];
  showIncomplete: boolean;
  selectedColumns: Set<string>;
  onShowIncompleteToggle: () => void;
  onColumnToggle: (column: string) => void;
}

export const AccelerationTab = memo(({
  accelerationAttempts,
  showIncomplete,
  selectedColumns,
  onShowIncompleteToggle,
  onColumnToggle,
}: AccelerationTabProps) => {
  return (
    <AccelerationTable
      accelerationAttempts={accelerationAttempts}
      showIncomplete={showIncomplete}
      selectedColumns={selectedColumns}
      onShowIncompleteToggle={onShowIncompleteToggle}
      onColumnToggle={onColumnToggle}
    />
  );
});

AccelerationTab.displayName = 'AccelerationTab';
