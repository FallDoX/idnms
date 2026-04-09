import { useState, useRef } from 'react';

/**
 * Custom hook for chart-related state management
 * Handles chart zoom, view mode, and data toggles
 */
export function useChartState() {
  // Chart data toggles
  const [chartToggles, setChartToggles] = useState<Record<string, boolean>>({
    speed: true,
    gpsSpeed: false,
    power: true,
    current: false,
    phaseCurrent: false,
    voltage: true,
    batteryLevel: false,
    temperature: true,
    temp2: false,
    torque: false,
    pwm: true,
  });

  // Chart snap mode toggle - snaps cursor to nearest data point
  const [chartSnapMode, setChartSnapMode] = useState<boolean>(false);

  // Chart zoom & pan state
  const [chartZoom, setChartZoom] = useState<{ min: number; max: number } | null>(null);
  const [chartView, setChartView] = useState<'line' | 'scatter'>('line');

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; zoomMin: number; zoomMax: number } | null>(null);

  const resetZoom = () => {
    setChartZoom(null);
  };

  return {
    chartToggles,
    setChartToggles,
    chartSnapMode,
    setChartSnapMode,
    chartZoom,
    setChartZoom,
    chartView,
    setChartView,
    isPanning,
    panStart,
    resetZoom,
  };
}
