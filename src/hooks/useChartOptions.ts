import type { ChartOptions } from 'chart.js';

/**
 * Custom hook for common chart options optimized for performance
 * Used across all chart components for consistent configuration
 */
export function useChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    transitions: {
      active: { animation: { duration: 0 } },
      resize: { animation: { duration: 0 } },
      show: { animation: { duration: 0 } },
      hide: { animation: { duration: 0 } }
    },
    elements: {
      line: { borderWidth: 2, spanGaps: true },
      point: { radius: 0, hoverRadius: 4, hitRadius: 8 }
    },
    parsing: false,
    normalized: true,
    interaction: {
      mode: 'index',
      intersect: false,
      axis: 'x'
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false // Disable built-in tooltip for performance
      }
    }
  };
}
