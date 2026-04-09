import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import { parseTripData, calculateSummary, downsample, filterData, defaultFilterConfig, type DataFilterConfig } from './utils/parser';
import { detectAccelerations } from './utils/acceleration';
import type { TripEntry, TripSummary, AccelerationAttempt } from './types';
import { AccelerationTab } from './components/AccelerationTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Activity, Clock, Settings, Eye, EyeOff, Grid3X3, ZoomIn, ZoomOut, Share2, Play, Upload, BarChart
} from 'lucide-react';
import { throttle } from './utils/performance';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toPng } from 'html-to-image';
import { ScatterPlot } from './components/ScatterPlot';
import { FloatingDataPanel } from './components/FloatingDataPanel';
import { TripOverview } from './components/TripOverview';
import { i18n } from './i18n';
import { useChartOptions } from './hooks/useChartOptions';
import { useChartState } from './hooks/useChartState';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Vertical cursor line plugin for chart hover - optimized for performance
const verticalCursorPlugin = {
  id: 'verticalCursor',
  afterInit: (chart: { verticalCursor?: { x: number | null; visible: boolean; lastX: number | null } }) => {
    chart.verticalCursor = { x: null, visible: false, lastX: null };
  },
  afterEvent: (chart: { verticalCursor?: { x: number | null; visible: boolean; lastX: number | null } }, args: { event: { type: string } }) => {
    // Safety check - ensure verticalCursor exists
    if (!chart.verticalCursor) {
      chart.verticalCursor = { x: null, visible: false, lastX: null };
    }

    const { event } = args;
    if (event.type === 'mousemove') {
      const points = (chart as { getElementsAtEventForMode: Function }).getElementsAtEventForMode(event, 'index', { intersect: false }, true);
      if (points.length) {
        const newX = points[0].element.x;
        // Only update if position changed significantly (>2px)
        if (Math.abs(newX - (chart.verticalCursor.lastX || 0)) > 2) {
          chart.verticalCursor.x = newX;
          chart.verticalCursor.lastX = newX;
          chart.verticalCursor.visible = true;
          (chart as { draw: (mode?: string) => void }).draw('none'); // Use 'none' mode for better performance
        }
      }
    } else if (event.type === 'mouseout') {
      chart.verticalCursor.visible = false;
      (chart as { draw: (mode?: string) => void }).draw('none');
    }
  },
  afterDraw: (chart: { verticalCursor?: { x: number | null; visible: boolean; lastX: number | null }; ctx: CanvasRenderingContext2D; chartArea: { top: number; bottom: number } }) => {
    // Safety check - ensure verticalCursor exists and is visible
    if (!chart.verticalCursor || !chart.verticalCursor.visible || chart.verticalCursor.x === null) return;

    const ctx = chart.ctx;
    const { top, bottom } = chart.chartArea;
    const x = chart.verticalCursor.x;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  }
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  verticalCursorPlugin
);

// Modern toggle chip
interface ToggleChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

const ToggleChip = memo(({ label, active, onClick, color = "blue" }: ToggleChipProps) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    green: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-300",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-300",
    pink: "bg-pink-500/20 border-pink-500/30 text-pink-300",
  };
  
  const activeMap: Record<string, string> = {
    blue: "bg-blue-500 border-blue-400 text-white",
    green: "bg-emerald-500 border-emerald-400 text-white",
    purple: "bg-purple-500 border-purple-400 text-white",
    orange: "bg-orange-500 border-orange-400 text-white",
    pink: "bg-pink-500 border-pink-400 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center gap-1.5",
        active ? activeMap[color] : colorMap[color],
        "hover:opacity-80"
      )}
    >
      {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {label}
    </button>
  );
});

function App() {
  const [data, setData] = useState<TripEntry[]>([]);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Time range state
  const [timeRange, setTimeRange] = useState<{ start: number; end: number } | null>(null);

  // Visibility toggles for metrics
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    maxSpeed: true,
    distance: true,
    maxPower: true,
    batteryDrop: true,
    batteryVoltageDrop: true,
    maxBatteryDrop: true,
    avgTemp: true,
    duration: false,
    ridingTime: true,
    avgSpeed: true,
    avgMovingSpeed: true,
    totalSamples: false,
    maxTorque: true,
    maxPhaseCurrent: true,
    maxTemp: false,
  });

  // Acceleration state
  const [accelerationAttempts, setAccelerationAttempts] = useState<AccelerationAttempt[]>([]);
  const [showIncomplete, setShowIncomplete] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(['time', 'distance', 'averagePower', 'peakPower', 'batteryDrop']));
  const [accelerationThreshold, setAccelerationThreshold] = useState<number>(60);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'charts' | 'acceleration'>('charts');

  // Chart state from custom hook
  const {
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
  } = useChartState();

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Panels visibility
  const [showSettings, setShowSettings] = useState(false);

  // Floating data panel state
  const [showFloatingPanel, setShowFloatingPanel] = useState<boolean>(false);
  const [floatingPanelFrozen, setFloatingPanelFrozen] = useState<boolean>(false);
  const [floatingPanelPosition, setFloatingPanelPosition] = useState<{ x: number; y: number }>({ x: window.innerWidth * 0.65, y: 200 });
  const [floatingPanelData, setFloatingPanelData] = useState<{ label: string; value: number | null; color: string; unit?: string }[]>([]);
  const [floatingPanelTimestamp, setFloatingPanelTimestamp] = useState<string>('');
  const floatingPanelDataRef = useRef(floatingPanelData);
  floatingPanelDataRef.current = floatingPanelData;
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig>(defaultFilterConfig);
  const [hideIdlePeriods, setHideIdlePeriods] = useState<boolean>(false);

  // Filter data by time range AND apply data quality filter AND optionally hide idle periods
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];
    
    // First apply time range filter
    let timeFiltered = data;
    if (timeRange) {
      timeFiltered = data.filter(e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end);
    }
    
    // Then apply data quality filter
    const result = filterData(timeFiltered, filterConfig);
    let filtered = result.filtered;
    
    // Optionally remove long idle periods (speed < 5 km/h for > 30 seconds)
    if (hideIdlePeriods) {
      const IDLE_THRESHOLD_KMH = 5;
      const IDLE_TIME_THRESHOLD_MS = 30000; // 30 seconds

      // First, identify all idle periods
      const idlePeriods: { start: number; end: number }[] = [];
      let idleStartIndex: number | null = null;

      for (let i = 0; i < filtered.length; i++) {
        if (filtered[i].Speed < IDLE_THRESHOLD_KMH) {
          if (idleStartIndex === null) {
            idleStartIndex = i;
          }
        } else {
          if (idleStartIndex !== null) {
            const idleDuration = filtered[i].timestamp - filtered[idleStartIndex].timestamp;
            if (idleDuration >= IDLE_TIME_THRESHOLD_MS) {
              idlePeriods.push({
                start: filtered[idleStartIndex].timestamp,
                end: filtered[i].timestamp
              });
            }
            idleStartIndex = null;
          }
        }
      }

      // Check for trailing idle period
      if (idleStartIndex !== null) {
        const idleDuration = filtered[filtered.length - 1].timestamp - filtered[idleStartIndex].timestamp;
        if (idleDuration >= IDLE_TIME_THRESHOLD_MS) {
          idlePeriods.push({
            start: filtered[idleStartIndex].timestamp,
            end: filtered[filtered.length - 1].timestamp
          });
        }
      }

      // Filter out entries that fall within idle periods
      filtered = filtered.filter(entry => {
        for (const period of idlePeriods) {
          if (entry.timestamp >= period.start && entry.timestamp <= period.end) {
            return false;
          }
        }
        return true;
      });
    }
    
    return filtered;
  }, [data, timeRange, filterConfig, hideIdlePeriods]);

  // Compute active periods (non-idle segments) for collapsed timeline view
  const activePeriods = useMemo(() => {
    if (!hideIdlePeriods || filteredData.length === 0) return null;
    
    const periods: { start: number; end: number }[] = [];
    let currentStart: number | null = null;
    
    for (let i = 0; i < filteredData.length; i++) {
      const entry = filteredData[i];
      const prevEntry = i > 0 ? filteredData[i - 1] : null;
      
      // Start of a new period
      if (currentStart === null) {
        currentStart = entry.timestamp;
      }
      
      // Check if there's a gap (idle period was removed)
      if (prevEntry && entry.timestamp - prevEntry.timestamp > 5000) { // 5 second gap threshold
        periods.push({ start: currentStart, end: prevEntry.timestamp });
        currentStart = entry.timestamp;
      }
    }
    
    // Close the last period
    if (currentStart !== null && filteredData.length > 0) {
      periods.push({ start: currentStart, end: filteredData[filteredData.length - 1].timestamp });
    }
    
    return periods;
  }, [filteredData, hideIdlePeriods]);

  // Calculate collapsed timeline range (total active time only)
  const collapsedTimeRange = useMemo(() => {
    if (!hideIdlePeriods || !activePeriods || activePeriods.length === 0) return null;
    
    const totalActiveDuration = activePeriods.reduce((sum, p) => sum + (p.end - p.start), 0);
    return {
      start: 0,
      end: totalActiveDuration,
      periods: activePeriods,
    };
  }, [activePeriods, hideIdlePeriods]);

  // Calculate compressed time range based on filtered data (when filters are active)
  const compressedTimeRange = useMemo(() => {
    // Use compressed range when hideIdlePeriods is active or when data was filtered
    const isFiltered = hideIdlePeriods || (filterConfig !== defaultFilterConfig);
    
    if (!isFiltered || filteredData.length === 0) return null;
    
    const timestamps = filteredData.map(e => e.timestamp);
    return {
      start: Math.min(...timestamps),
      end: Math.max(...timestamps),
    };
  }, [filteredData, hideIdlePeriods, filterConfig]);

  // Recompute summary for filtered data
  const filteredSummary = useMemo(() => {
    if (filteredData.length === 0) return null;
    return calculateSummary(filteredData);
  }, [filteredData]);

  // Update time range when data changes
  useEffect(() => {
    if (data.length > 0 && !timeRange) {
      const timestamps = data.map(e => e.timestamp);
      setTimeRange({
        start: Math.min(...timestamps),
        end: Math.max(...timestamps),
      });
    }
  }, [data, timeRange]);

  // Optimized data for charts - aggressive downsampling for performance
  const displayData = useMemo(() => {
    const currentTimeRange = chartZoom ? { start: chartZoom.min, end: chartZoom.max } : (compressedTimeRange || timeRange);
    return downsample(filteredData, 500, currentTimeRange);
  }, [filteredData, chartZoom, timeRange, compressedTimeRange]);

  // Interactive chart handlers
  const handleChartMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    isPanning.current = true;
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      zoomMin: chartZoom?.min ?? (timeRange?.start ?? 0),
      zoomMax: chartZoom?.max ?? (timeRange?.end ?? 0),
    };
  }, [chartZoom, timeRange]);

  const handleChartMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current || !panStart.current || !timeRange) return;

    const canvas = chartContainerRef.current?.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - panStart.current.x;
    const deltaY = e.clientY - panStart.current.y;
    const pxPerMs = rect.width / (panStart.current.zoomMax - panStart.current.zoomMin);

    // Pan horizontally
    const deltaMs = -deltaX / pxPerMs;
    let newMin = panStart.current.zoomMin + deltaMs;
    let newMax = panStart.current.zoomMax + deltaMs;

    // Zoom with vertical swipe (up = zoom in, down = zoom out)
    const zoomFactor = 1 + (-deltaY / rect.height) * 0.5;
    const center = (newMin + newMax) / 2;
    const range = (newMax - newMin) * Math.max(0.1, zoomFactor);

    newMin = center - range / 2;
    newMax = center + range / 2;

    // Clamp to time range bounds
    if (newMin < timeRange.start) {
      newMax += (timeRange.start - newMin);
      newMin = timeRange.start;
    }
    if (newMax > timeRange.end) {
      newMin -= (newMax - timeRange.end);
      newMax = timeRange.end;
    }

    // Min range 1 second
    if (newMax - newMin < 1000) {
      const c = (newMin + newMax) / 2;
      newMin = c - 500;
      newMax = c + 500;
    }

    setChartZoom({ min: newMin, max: newMax });
  }, [timeRange]);

  const handleChartMouseUp = useCallback(() => {
    isPanning.current = false;
    panStart.current = null;
  }, []);

  // Timeline interaction state
  const isTimelineDragging = useRef(false);
  const timelineDragMode = useRef<'pan' | 'left' | 'right' | null>(null);
  const timelineDragStart = useRef<{ x: number; zoomMin: number; zoomMax: number } | null>(null);

  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    if (!timeRange) return;
    e.stopPropagation();
    isTimelineDragging.current = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const clickTime = timeRange.start + (timeRange.end - timeRange.start) * clickRatio;

    const currentMin = chartZoom?.min ?? timeRange.start;
    const currentMax = chartZoom?.max ?? timeRange.end;

    // Check if clicking near edges (within 8px)
    const leftEdgeX = ((currentMin - timeRange.start) / (timeRange.end - timeRange.start)) * rect.width;
    const rightEdgeX = ((currentMax - timeRange.start) / (timeRange.end - timeRange.start)) * rect.width;
    const edgeThreshold = 8;

    if (Math.abs(clickX - leftEdgeX) < edgeThreshold) {
      // Dragging left edge
      timelineDragMode.current = 'left';
      timelineDragStart.current = { x: e.clientX, zoomMin: currentMin, zoomMax: currentMax };
    } else if (Math.abs(clickX - rightEdgeX) < edgeThreshold) {
      // Dragging right edge
      timelineDragMode.current = 'right';
      timelineDragStart.current = { x: e.clientX, zoomMin: currentMin, zoomMax: currentMax };
    } else if (clickTime >= currentMin && clickTime <= currentMax) {
      // Panning inside viewport
      timelineDragMode.current = 'pan';
      timelineDragStart.current = { x: e.clientX, zoomMin: currentMin, zoomMax: currentMax };
    } else {
      // Click outside - center viewport on click
      const currentRange = currentMax - currentMin;
      const halfRange = currentRange / 2;
      setChartZoom({
        min: Math.max(timeRange.start, clickTime - halfRange),
        max: Math.min(timeRange.end, clickTime + halfRange),
      });
      timelineDragStart.current = null;
      timelineDragMode.current = null;
    }
  }, [timeRange, chartZoom]);

  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isTimelineDragging.current || !timelineDragStart.current || !timeRange) return;

    const deltaX = e.clientX - timelineDragStart.current.x;
    const timelineEl = document.querySelector('[data-timeline]');
    if (!timelineEl) return;

    const rect = timelineEl.getBoundingClientRect();
    const pxPerMs = rect.width / (timeRange.end - timeRange.start);
    const deltaMs = deltaX / pxPerMs;

    let newMin = timelineDragStart.current.zoomMin;
    let newMax = timelineDragStart.current.zoomMax;

    if (timelineDragMode.current === 'left') {
      // Stretch/shrink left edge
      newMin = Math.min(timelineDragStart.current.zoomMax - 1000, 
                        Math.max(timeRange.start, timelineDragStart.current.zoomMin + deltaMs));
    } else if (timelineDragMode.current === 'right') {
      // Stretch/shrink right edge
      newMax = Math.max(timelineDragStart.current.zoomMin + 1000, 
                        Math.min(timeRange.end, timelineDragStart.current.zoomMax + deltaMs));
    } else if (timelineDragMode.current === 'pan') {
      // Pan the whole viewport
      newMin = timelineDragStart.current.zoomMin + deltaMs;
      newMax = timelineDragStart.current.zoomMax + deltaMs;

      if (newMin < timeRange.start) {
        newMax += (timeRange.start - newMin);
        newMin = timeRange.start;
      }
      if (newMax > timeRange.end) {
        newMin -= (newMax - timeRange.end);
        newMax = timeRange.end;
      }
    }

    setChartZoom({ min: newMin, max: newMax });
  }, [timeRange]);

  const handleTimelineMouseUp = useCallback(() => {
    isTimelineDragging.current = false;
    timelineDragStart.current = null;
    timelineDragMode.current = null;
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    isPanning.current = false;
    panStart.current = null;
  }, []);

  // Touch gesture state for mobile
  const touchState = useRef<{
    touches: { clientX: number; clientY: number }[];
    initialDistance: number;
    initialZoom: { min: number; max: number } | null;
    lastTapTime: number;
  }>({ touches: [], initialDistance: 0, initialZoom: null, lastTapTime: 0 });

  const handleChartTouchStart = useCallback((e: React.TouchEvent) => {
    if (!timeRange) return;
    
    const touches = Array.from(e.touches).map(t => ({ clientX: t.clientX, clientY: t.clientY }));
    touchState.current.touches = touches;
    touchState.current.initialZoom = chartZoom ? { ...chartZoom } : { 
      min: timeRange.start, 
      max: timeRange.end 
    };
    
    if (touches.length === 2) {
      // Pinch start - calculate initial distance
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      touchState.current.initialDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }, [chartZoom, timeRange]);

  const handleChartTouchMove = useCallback((e: React.TouchEvent) => {
    if (!timeRange) return;
    e.preventDefault(); // Prevent page scroll
    
    const touches = Array.from(e.touches).map(t => ({ clientX: t.clientX, clientY: t.clientY }));
    const canvas = chartContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    if (touches.length === 2 && touchState.current.touches.length === 2) {
      // Pinch zoom
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = touchState.current.initialDistance / distance;
      const initialRange = touchState.current.initialZoom!.max - touchState.current.initialZoom!.min;
      const newRange = initialRange * scale;
      
      // Center zoom on midpoint between fingers
      const midX = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
      const midRatio = midX / rect.width;
      const timeCenter = touchState.current.initialZoom!.min + initialRange * midRatio;
      
      let newMin = timeCenter - newRange * midRatio;
      let newMax = newMin + newRange;
      
      // Clamp bounds
      if (newMin < timeRange.start) {
        newMax += (timeRange.start - newMin);
        newMin = timeRange.start;
      }
      if (newMax > timeRange.end) {
        newMin -= (newMax - timeRange.end);
        newMax = timeRange.end;
      }
      if (newMax - newMin < 1000) {
        const c = (newMin + newMax) / 2;
        newMin = c - 500;
        newMax = c + 500;
      }
      
      setChartZoom({ min: newMin, max: newMax });
    } else if (touches.length === 1 && touchState.current.touches.length === 1) {
      // Pan
      const deltaX = touches[0].clientX - touchState.current.touches[0].clientX;
      const pxPerMs = (touchState.current.initialZoom!.max - touchState.current.initialZoom!.min) / rect.width;
      const deltaMs = -deltaX * pxPerMs;
      
      let newMin = touchState.current.initialZoom!.min + deltaMs;
      let newMax = touchState.current.initialZoom!.max + deltaMs;
      
      if (newMin < timeRange.start) {
        newMax += (timeRange.start - newMin);
        newMin = timeRange.start;
      }
      if (newMax > timeRange.end) {
        newMin -= (newMax - timeRange.end);
        newMax = timeRange.end;
      }
      
      setChartZoom({ min: newMin, max: newMax });
    }
  }, [timeRange]);

  const handleChartTouchEnd = useCallback(() => {
    touchState.current.touches = [];
    touchState.current.initialDistance = 0;
    touchState.current.initialZoom = null;
  }, []);

  const handleChartDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!timeRange || !chartContainerRef.current) return;
    
    const canvas = chartContainerRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseRatio = mouseX / rect.width;
    
    const currentMin = chartZoom?.min ?? timeRange.start;
    const currentMax = chartZoom?.max ?? timeRange.end;
    
    // Zoom in by 2x centered on click point
    const zoomFactor = 0.5;
    const mouseTime = currentMin + (currentMax - currentMin) * mouseRatio;
    let newMin = mouseTime - (mouseTime - currentMin) * zoomFactor;
    let newMax = mouseTime + (currentMax - mouseTime) * zoomFactor;
    
    // Clamp to time range bounds
    if (newMin < timeRange.start) {
      newMax += (timeRange.start - newMin);
      newMin = timeRange.start;
    }
    if (newMax > timeRange.end) {
      newMin -= (newMax - timeRange.end);
      newMax = timeRange.end;
    }
    
    // Min range 1 second
    if (newMax - newMin < 1000) {
      const c = (newMin + newMax) / 2;
      newMin = c - 500;
      newMax = c + 500;
    }
    
    setChartZoom({ min: newMin, max: newMax });
  }, [timeRange, chartZoom]);

  // Shift + Scroll zoom handler
  const handleChartWheel = useCallback((e: React.WheelEvent) => {
    if (!timeRange) return;
    if (!e.shiftKey) return; // Only zoom when Shift is pressed
    
    e.preventDefault();
    
    const canvas = chartContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseRatio = mouseX / rect.width;
    
    const currentMin = chartZoom?.min ?? timeRange.start;
    const currentMax = chartZoom?.max ?? timeRange.end;
    
    // Zoom factor: scroll up (negative deltaY) = zoom in, scroll down = zoom out
    const zoomFactor = 1 + (e.deltaY > 0 ? 0.15 : -0.15);
    
    // Calculate new bounds centered on mouse position
    const mouseTime = currentMin + (currentMax - currentMin) * mouseRatio;
    let newMin = mouseTime - (mouseTime - currentMin) * zoomFactor;
    let newMax = mouseTime + (currentMax - mouseTime) * zoomFactor;
    
    // Clamp to time range bounds
    if (newMin < timeRange.start) {
      newMax += (timeRange.start - newMin);
      newMin = timeRange.start;
    }
    if (newMax > timeRange.end) {
      newMin -= (newMax - timeRange.end);
      newMax = timeRange.end;
    }
    
    // Min range 1 second
    if (newMax - newMin < 1000) {
      const c = (newMin + newMax) / 2;
      newMin = c - 500;
      newMax = c + 500;
    }
    
    setChartZoom({ min: newMin, max: newMax });
  }, [timeRange, chartZoom]);

  // Memoize acceleration detection to prevent re-detection on unnecessary re-renders
  const accelerationAttemptsMemoized = useMemo(() => {
    return detectAccelerations(data, accelerationThreshold);
  }, [data, accelerationThreshold]);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert(i18n.t('uploadError'));
      return;
    }
    setFileName(file.name);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedData = parseTripData(text);
      setData(parsedData);
      setSummary(calculateSummary(parsedData));
      setAccelerationAttempts(accelerationAttemptsMemoized);
      resetZoom(); // Reset zoom on new file load
      // Reset time range
      if (parsedData.length > 0) {
        const timestamps = parsedData.map(e => e.timestamp);
        setTimeRange({
          start: Math.min(...timestamps),
          end: Math.max(...timestamps),
        });
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Only show drag overlay if files are being dragged
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    // Only hide overlay when leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Common chart options for maximum performance
  const commonOptions = useChartOptions();

  // Optimized chart data generation with individual memoization for each dataset
  // Prevents recreating arrays when toggles change
  const chartDatasets = useMemo(() => {
    // Use compressed timestamps when hiding idle periods to collapse the chart
    const getTimestamp = (e: TripEntry) => {
      if (hideIdlePeriods && compressedTimeRange && activePeriods) {
        // Calculate compressed timestamp based on active periods
        let compressedTime = 0;
        for (const period of activePeriods) {
          if (e.timestamp >= period.start && e.timestamp <= period.end) {
            compressedTime += (e.timestamp - period.start);
            break;
          } else if (e.timestamp > period.end) {
            compressedTime += (period.end - period.start);
          }
        }
        return compressedTime;
      }
      return e.timestamp;
    };

    const datasets: Record<string, Array<{ x: number; y: number | null }>> = {
      speed: displayData.map(e => ({ x: getTimestamp(e), y: e.Speed })),
      gpsSpeed: displayData.map(e => ({ x: getTimestamp(e), y: e.GPSSpeed })),
      power: displayData.map(e => ({ x: getTimestamp(e), y: e.Power ?? null })),
      current: displayData.map(e => ({ x: getTimestamp(e), y: e.Current ?? null })),
      phaseCurrent: displayData.map(e => ({ x: getTimestamp(e), y: e.PhaseCurrent ?? null })),
      voltage: displayData.map(e => ({ x: getTimestamp(e), y: e.Voltage })),
      batteryLevel: displayData.map(e => ({ x: getTimestamp(e), y: e.BatteryLevel })),
      temperature: displayData.map(e => ({ x: getTimestamp(e), y: e.Temperature })),
      temp2: displayData.map(e => ({ x: getTimestamp(e), y: e.Temp2 ?? null })),
      torque: displayData.map(e => ({ x: getTimestamp(e), y: e.Torque ?? null })),
      pwm: displayData.map(e => ({ x: getTimestamp(e), y: e.PWM })),
    };
    return datasets;
  }, [displayData, hideIdlePeriods, compressedTimeRange, activePeriods]);

  // Combined chart data with toggles - only constructs final datasets object
  const combinedChartData = useMemo(() => {
    const datasets: Array<{
      label: string;
      data: Array<{ x: number; y: number | null | undefined }>;
      borderColor: string;
      backgroundColor?: string;
      fill?: boolean;
      tension?: number;
      yAxisID?: string;
      borderDash?: number[];
    }> = [];

    if (chartToggles.speed) {
      datasets.push({
        label: 'Speed (km/h)',
        data: chartDatasets.speed,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (chartToggles.gpsSpeed) {
      datasets.push({
        label: 'GPS Speed (km/h)',
        data: chartDatasets.gpsSpeed,
        borderColor: '#10b981',
        tension: 0.1,
        borderDash: [5, 5],
        yAxisID: 'y',
      });
    }

    if (chartToggles.power) {
      datasets.push({
        label: 'Power (W)',
        data: chartDatasets.power,
        borderColor: '#f59e0b',
        tension: 0.1,
        yAxisID: 'y1',
      });
    }

    if (chartToggles.current) {
      datasets.push({
        label: 'Current (A)',
        data: chartDatasets.current,
        borderColor: '#ef4444',
        tension: 0.1,
        yAxisID: 'y2',
      });
    }

    if (chartToggles.phaseCurrent && displayData[0]?.PhaseCurrent !== undefined) {
      datasets.push({
        label: 'Phase Current (A)',
        data: chartDatasets.phaseCurrent,
        borderColor: '#f87171',
        tension: 0.1,
        borderDash: [2, 2],
        yAxisID: 'y2',
      });
    }

    if (chartToggles.voltage) {
      datasets.push({
        label: 'Voltage (V)',
        data: chartDatasets.voltage,
        borderColor: '#8b5cf6',
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (chartToggles.batteryLevel) {
      datasets.push({
        label: 'Battery %',
        data: chartDatasets.batteryLevel,
        borderColor: '#ec4899',
        tension: 0.1,
        yAxisID: 'y3',
      });
    }

    if (chartToggles.temperature) {
      datasets.push({
        label: 'Temperature (°C)',
        data: chartDatasets.temperature,
        borderColor: '#f97316',
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (chartToggles.temp2 && displayData[0]?.Temp2 !== undefined) {
      datasets.push({
        label: 'Temp 2 (°C)',
        data: chartDatasets.temp2,
        borderColor: '#fb923c',
        tension: 0.1,
        borderDash: [3, 3],
        yAxisID: 'y',
      });
    }

    if (chartToggles.torque && displayData[0]?.Torque !== undefined) {
      datasets.push({
        label: 'Torque',
        data: chartDatasets.torque,
        borderColor: '#a78bfa',
        tension: 0.1,
        yAxisID: 'y4',
      });
    }

    if (chartToggles.pwm) {
      datasets.push({
        label: 'PWM',
        data: chartDatasets.pwm,
        borderColor: '#06b6d4',
        tension: 0.1,
        borderDash: [4, 4],
        yAxisID: 'y5',
      });
    }

    return { datasets };
  }, [chartDatasets, chartToggles, displayData]);

  // Export full page as PNG image using html-to-image
  const handleShareStats = async () => {
    if (!data.length) {
      alert('Нет данных для сохранения. Загрузите CSV файл.');
      return;
    }
    
    // Find the main content container
    const element = document.querySelector('[data-export-container]') as HTMLElement || 
                   document.querySelector('.relative.z-10') as HTMLElement;
    if (!element) {
      alert('Не найден контейнер для экспорта');
      return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'screenshot-loading';
    loadingDiv.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
        <div style="background:rgba(15,23,42,0.95);padding:24px 40px;border-radius:16px;border:1px solid rgba(59,130,246,0.3);text-align:center;">
          <div style="width:48px;height:48px;border:4px solid rgba(59,130,246,0.2);border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
          <p style="color:#fff;font-family:system-ui,sans-serif;font-size:14px;margin:0;">Создание скриншота...</p>
          <p style="color:#64748b;font-family:system-ui,sans-serif;font-size:12px;margin:8px 0 0;">Это может занять несколько секунд</p>
        </div>
      </div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(loadingDiv);
    
    // Store original styles
    const originalMaxWidth = element.style.maxWidth;
    const originalWidth = element.style.width;
    
    try {
      // Wait for UI to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Temporarily remove max-width constraint to capture full content
      element.style.maxWidth = 'none';
      element.style.width = 'auto';
      
      // Force layout recalculation
      element.getBoundingClientRect();
      
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 1.5,
        backgroundColor: '#0f172a',
        skipFonts: false,
        cacheBust: true,
        style: {
          transform: 'none',
          maxHeight: 'none',
          maxWidth: 'none',
          overflow: 'visible',
          width: 'auto'
        },
        // Ensure we capture the full scrollable width
        width: element.scrollWidth,
        height: element.scrollHeight
      });
      
      // Restore original styles
      element.style.maxWidth = originalMaxWidth;
      element.style.width = originalWidth;
      
      // Create download
      const link = document.createElement('a');
      const cleanFileName = fileName.replace(/\.csv$/i, '').replace(/[^a-z0-9а-яё_-]/gi, '_') || 'trip';
      const date = new Date().toISOString().slice(0, 10);
      link.download = `trip-log-${cleanFileName}-${date}.png`;
      link.href = dataUrl;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Screenshot failed:', error);
      alert('Ошибка создания скриншота: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      // Restore original styles on error
      element.style.maxWidth = originalMaxWidth;
      element.style.width = originalWidth;
    } finally {
      const loading = document.getElementById('screenshot-loading');
      if (loading) {
        document.body.removeChild(loading);
      }
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white transition-colors duration-500",
        isDragging && "from-blue-950 via-slate-900 to-blue-950"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div data-export-container className="relative z-10 max-w-[1600px] mx-auto px-6 py-8" onDragOver={onDragOver}>
        {/* Modern Header */}
        <header className="flex flex-col md:flex-row justify-center items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
              <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {i18n.t('appTitle')}
              </h1>
              <p className="text-slate-400 text-sm">{i18n.t('appSubtitle')}</p>
              {fileName && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-xs text-emerald-400 font-medium truncate max-w-[300px]">{fileName}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Hidden file input for start page upload */}
        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />

        {/* Drag overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-600/20 backdrop-blur-sm pointer-events-none">
            <div className="text-center bg-slate-900/95 p-10 rounded-2xl shadow-2xl border-2 border-dashed border-blue-500/50 animate-pulse">
              <Upload className="w-20 h-20 mx-auto mb-6 text-blue-400" strokeWidth={1.5} />
              <p className="text-3xl font-bold text-white mb-2">{i18n.t('dropCSV')}</p>
              <p className="text-blue-400/80">{i18n.t('dropCSVSubtitle')}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-96">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500/20 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-slate-400 mt-6 animate-pulse font-medium">{i18n.t('parsingData')}</p>
          </div>
        ) : data.length === 0 ? (
          <>
            {/* Start page - choice between large file and small demo */}
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-white">Выберите режим загрузки</h2>
                <p className="text-slate-400">Загрузите свой файл или используйте демо-данные</p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <button
                  onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                  className="group flex flex-col items-center gap-3 px-8 py-6 rounded-2xl transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 min-w-[200px]"
                >
                  <Upload className="w-8 h-8 group-hover:animate-bounce" strokeWidth={2} />
                  <span className="font-semibold text-white">Загрузить свой файл</span>
                  <span className="text-xs text-blue-200">CSV файл</span>
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch('/demo-trip-small.csv');
                      const text = await response.text();
                      const parsedData = parseTripData(text);
                      setData(parsedData);
                      setSummary(calculateSummary(parsedData));
                      setFileName('demo-trip-small.csv');
                      resetZoom();
                      if (parsedData.length > 0) {
                        const timestamps = parsedData.map(e => e.timestamp);
                        setTimeRange({
                          start: Math.min(...timestamps),
                          end: Math.max(...timestamps),
                        });
                      }
                    } catch {
                      alert('Ошибка загрузки демо-файла');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="group flex flex-col items-center gap-3 px-8 py-6 rounded-2xl transition-all duration-300 bg-gradient-to-br from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 active:scale-95 min-w-[200px]"
                >
                  <Play className="w-8 h-8 group-hover:animate-pulse" strokeWidth={2} />
                  <span className="font-semibold text-white">Маленький демо</span>
                  <span className="text-xs text-green-200">20 минут • 0.85 MB</span>
                </button>
                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const response = await fetch('/demo-trip-6hours.csv');
                      const text = await response.text();
                      const parsedData = parseTripData(text);
                      setData(parsedData);
                      setSummary(calculateSummary(parsedData));
                      setFileName('demo-trip-6hours.csv');
                      resetZoom();
                      if (parsedData.length > 0) {
                        const timestamps = parsedData.map(e => e.timestamp);
                        setTimeRange({
                          start: Math.min(...timestamps),
                          end: Math.max(...timestamps),
                        });
                      }
                    } catch {
                      alert('Ошибка загрузки демо-файла');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="group flex flex-col items-center gap-3 px-8 py-6 rounded-2xl transition-all duration-300 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-95 min-w-[200px]"
                >
                  <Play className="w-8 h-8 group-hover:animate-pulse" strokeWidth={2} />
                  <span className="font-semibold text-white">Большой демо</span>
                  <span className="text-xs text-purple-200">6 часов • 15.15 MB</span>
                </button>
              </div>
            </div>
          </>
        ) : data.length > 0 && summary ? (
          <>
            <TripOverview
              summary={filteredSummary!}
              visibleMetrics={visibleMetrics}
              showSettings={showSettings}
              onSettingsToggle={() => setShowSettings(!showSettings)}
              onVisibleMetricsChange={(key) => setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }))}
            />

            {/* Main Chart with Built-in Time Range & Zoom */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 mb-8 shadow-lg">
              {/* Header with tabs and controls */}
              <div className="p-5 border-b border-white/10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <BarChart className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                          {i18n.t('tripTelemetry')}
                        </h3>
                      </div>
                      {chartZoom && timeRange && (
                        <p className="text-xs text-blue-400">
                          {i18n.t('zoomInfo', { 
                            minutes: ((chartZoom.max - chartZoom.min) / 60000).toFixed(1), 
                            percent: ((chartZoom.max - chartZoom.min) / (timeRange.end - timeRange.start) * 100).toFixed(0) 
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Chart Controls - grouped by function */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Data Processing Group */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                      <button
                        onClick={() => setHideIdlePeriods(prev => !prev)}
                        className={cn(
                          "px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                          hideIdlePeriods
                            ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-200"
                            : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                        )}
                        title="Скрыть простои: убирает стоянки (скорость <5 км/ч >30 сек)"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{i18n.t('hideIdlePeriods')}</span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setFilterConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                          className={cn(
                            "px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                            filterConfig.enabled
                              ? "bg-amber-500/30 border-amber-500/60 text-amber-200"
                              : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                          )}
                          title="Фильтр данных: удаляет аномалии GPS и разрывы времени"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{i18n.t('dataFilter')}</span>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFilterDropdown(prev => !prev);
                            }}
                            className={cn(
                              "p-1 rounded hover:bg-white/10 transition-colors ml-1 cursor-pointer",
                              showFilterDropdown && "bg-white/10"
                            )}
                            title="Настройки фильтра"
                          >
                            <Settings className="w-3 h-3" />
                          </div>
                        </button>
                        {showFilterDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl z-50 p-4 space-y-3">
                            <span className="text-xs font-semibold text-slate-300">Настройки фильтра</span>
                            {filterConfig.enabled && (
                              <>
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-slate-400">Разрыв времени</label>
                                    <span className="text-xs text-amber-400 font-medium">{filterConfig.maxTimeGapSeconds} сек</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="60"
                                    value={filterConfig.maxTimeGapSeconds}
                                    onChange={(e) => setFilterConfig(prev => ({ ...prev, maxTimeGapSeconds: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-slate-400">GPS скорость лимит</label>
                                    <span className="text-xs text-red-400 font-medium">{filterConfig.gpsTeleportSpeedKmh} км/ч</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="100"
                                    max="500"
                                    step="10"
                                    value={filterConfig.gpsTeleportSpeedKmh}
                                    onChange={(e) => setFilterConfig(prev => ({ ...prev, gpsTeleportSpeedKmh: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                  />
                                </div>
                              </>
                            )}
                            {!filterConfig.enabled && (
                              <p className="text-xs text-slate-500">Включите фильтр для настройки параметров</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart Display Group - Tabs */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'charts' | 'acceleration')} className="w-full">
                      <TabsList className="bg-slate-800/50 rounded-lg border border-white/5 p-1">
                        <TabsTrigger value="charts" className="px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-blue-500/30 data-[state=active]:border-blue-500/60 data-[state=active]:text-blue-200">
                          <BarChart className="w-3.5 h-3.5 mr-1.5" />
                          Графики
                        </TabsTrigger>
                        <TabsTrigger value="acceleration" className="px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-blue-500/30 data-[state=active]:border-blue-500/60 data-[state=active]:text-blue-200">
                          <Activity className="w-3.5 h-3.5 mr-1.5" />
                          Ускорения
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="charts" className="mt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                            <button
                              onClick={() => setChartView(chartView === 'line' ? 'scatter' : 'line')}
                              className={cn(
                                "px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                                chartView === 'line'
                                  ? "bg-blue-500/30 border-blue-500/60 text-blue-200"
                                  : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                              )}
                              title="Переключить вид графика: Линейный график / Точечная диаграмма"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                              </svg>
                              <span className="hidden sm:inline">Линия</span>
                            </button>
                            <button
                              onClick={() => setChartView(chartView === 'line' ? 'scatter' : 'line')}
                              className={cn(
                                "px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                                chartView === 'scatter'
                                  ? "bg-purple-500/30 border-purple-500/60 text-purple-200"
                                  : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                              )}
                              title="Переключить вид графика: Линейный график / Точечная диаграмма"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="5" r="1" />
                                <circle cx="5" cy="19" r="1" />
                              </svg>
                              <span className="hidden sm:inline">Точки</span>
                            </button>
                          </div>
                          <button
                            onClick={() => setChartSnapMode(prev => !prev)}
                            className={cn(
                              "px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                              chartSnapMode
                                ? "bg-cyan-500/30 border-cyan-500/60 text-cyan-200"
                                : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                            )}
                            title="Привязка курсора: курсор привязывается к ближайшей точке данных для точного чтения значений"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <span className="hidden sm:inline">Привязка</span>
                          </button>
                          <button
                            onClick={() => setShowFloatingPanel(prev => !prev)}
                            className={cn(
                              "px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5",
                              showFloatingPanel
                                ? "bg-indigo-500/30 border-indigo-500/60 text-indigo-200"
                                : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700"
                            )}
                            title="Панель данных: показывает значения в точке курсора (перетаскиваемая)"
                          >
                            <Grid3X3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Панель</span>
                          </button>
                        </div>
                      </TabsContent>
                      <TabsContent value="acceleration" className="mt-4">
                        <AccelerationTab
                          accelerationAttempts={accelerationAttempts}
                          showIncomplete={showIncomplete}
                          selectedColumns={selectedColumns}
                          onShowIncompleteToggle={() => setShowIncomplete(prev => !prev)}
                          onColumnToggle={(column) => {
                            setSelectedColumns(prev => {
                              const next = new Set(prev);
                              if (next.has(column)) {
                                next.delete(column);
                              } else {
                                next.add(column);
                              }
                              return next;
                            });
                          }}
                        />
                      </TabsContent>
                    </Tabs>

                    {/* Zoom Group */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                      <button
                        onClick={() => {
                          if (!timeRange) return;
                          const currentMin = chartZoom?.min ?? timeRange.start;
                          const currentMax = chartZoom?.max ?? timeRange.end;
                          const currentRange = currentMax - currentMin;
                          const center = (currentMin + currentMax) / 2;
                          const newRange = currentRange * 0.7;
                          setChartZoom({ min: center - newRange / 2, max: center + newRange / 2 });
                        }}
                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors active:scale-95"
                        title="Увеличить масштаб"
                      >
                        <ZoomIn className="w-4 h-4 text-blue-300" />
                      </button>
                      <button
                        onClick={resetZoom}
                        className="p-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors active:scale-95"
                        title="Сбросить масштаб"
                      >
                        <ZoomOut className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {/* Export Group */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg border border-white/5">
                      <button
                        onClick={handleShareStats}
                        className="px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg border border-purple-500/40 transition-all duration-200 flex items-center gap-1.5 text-purple-200"
                        title="Поделиться: сохраняет скриншот всей страницы в PNG"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Поделиться</span>
                      </button>
                    </div>
                  </div>

                  {/* Toggle chips */}
                  <div className="flex flex-wrap gap-2">
                    <ToggleChip label={i18n.t('speed')} active={chartToggles.speed} onClick={() => setChartToggles(p => ({...p, speed: !p.speed}))} color="blue" />
                    <ToggleChip label={i18n.t('gpsSpeed')} active={chartToggles.gpsSpeed} onClick={() => setChartToggles(p => ({...p, gpsSpeed: !p.gpsSpeed}))} color="green" />
                    <ToggleChip label={i18n.t('power')} active={chartToggles.power} onClick={() => setChartToggles(p => ({...p, power: !p.power}))} color="orange" />
                    <ToggleChip label={i18n.t('current')} active={chartToggles.current} onClick={() => setChartToggles(p => ({...p, current: !p.current}))} color="pink" />
                    {displayData[0]?.PhaseCurrent !== undefined && (
                      <ToggleChip label={i18n.t('phaseCurrent')} active={chartToggles.phaseCurrent} onClick={() => setChartToggles(p => ({...p, phaseCurrent: !p.phaseCurrent}))} color="pink" />
                    )}
                    <ToggleChip label={i18n.t('voltage')} active={chartToggles.voltage} onClick={() => setChartToggles(p => ({...p, voltage: !p.voltage}))} color="purple" />
                    <ToggleChip label={i18n.t('batteryPercent')} active={chartToggles.batteryLevel} onClick={() => setChartToggles(p => ({...p, batteryLevel: !p.batteryLevel}))} color="pink" />
                    <ToggleChip label={i18n.t('temp')} active={chartToggles.temperature} onClick={() => setChartToggles(p => ({...p, temperature: !p.temperature}))} color="orange" />
                    {displayData[0]?.Temp2 !== undefined && (
                      <ToggleChip label={i18n.t('temp2')} active={chartToggles.temp2} onClick={() => setChartToggles(p => ({...p, temp2: !p.temp2}))} color="orange" />
                    )}
                    {displayData[0]?.Torque !== undefined && (
                      <ToggleChip label={i18n.t('torque')} active={chartToggles.torque} onClick={() => setChartToggles(p => ({...p, torque: !p.torque}))} color="purple" />
                    )}
                    <ToggleChip label={i18n.t('pwm')} active={chartToggles.pwm} onClick={() => setChartToggles(p => ({...p, pwm: !p.pwm}))} color="blue" />
                  </div>

                  {/* Compact help hints */}
                  <div className="px-5 pb-2 pt-1">
                    <p className="text-[10px] text-slate-500">
                      💡 <b>Подсказки:</b> Скрыть простои — убирает стоянки (скорость &lt;5 км/ч &gt;30 сек) • Фильтр данных — удаляет аномалии GPS и разрывы времени • Поделиться — сохраняет скриншот всей страницы в PNG
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart Area with interactive controls */}
              <div 
                ref={chartContainerRef} 
                className="p-5 cursor-grab active:cursor-grabbing select-none touch-none"
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleChartMouseUp}
                onMouseLeave={handleChartMouseLeave}
                onDoubleClick={handleChartDoubleClick}
                onWheel={handleChartWheel}
                onTouchStart={handleChartTouchStart}
                onTouchMove={handleChartTouchMove}
                onTouchEnd={handleChartTouchEnd}
                onClick={() => showFloatingPanel && setFloatingPanelFrozen(prev => !prev)}
              >
                <div className="h-[450px] w-full">
                  {chartView === 'line' ? (
                    <Line
                      options={{
                        ...commonOptions,
                        scales: {
                          x: {
                            type: 'time',
                            min: chartZoom?.min,
                            max: chartZoom?.max,
                            time: {
                              unit: 'minute',
                              displayFormats: { minute: 'HH:mm' }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } }
                          },
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 11 } },
                            border: { display: false }
                          },
                          y1: {
                            type: 'linear',
                            display: chartToggles.power,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: 'rgba(245, 158, 11, 0.7)', font: { size: 11 } },
                            border: { display: false },
                            title: { display: true, text: 'Power (W)', color: 'rgba(245, 158, 11, 0.7)', font: { size: 12, weight: 500 } }
                          },
                          y2: {
                            type: 'linear',
                            display: chartToggles.current || chartToggles.phaseCurrent,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            offset: chartToggles.current && chartToggles.phaseCurrent,
                            ticks: { color: 'rgba(239, 68, 68, 0.7)', font: { size: 11 } },
                            border: { display: false },
                            title: { display: true, text: 'Current (A)', color: 'rgba(239, 68, 68, 0.7)', font: { size: 12, weight: 500 } }
                          },
                          y3: {
                            type: 'linear',
                            display: chartToggles.batteryLevel,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            offset: true,
                            min: 0,
                            max: 100,
                            ticks: { color: 'rgba(236, 72, 153, 0.7)', font: { size: 11 } },
                            border: { display: false },
                            title: { display: true, text: 'Battery %', color: 'rgba(236, 72, 153, 0.7)', font: { size: 12, weight: 500 } }
                          },
                          y4: {
                            type: 'linear',
                            display: chartToggles.torque,
                            position: 'left',
                            grid: { drawOnChartArea: false },
                            offset: true,
                            ticks: { color: 'rgba(167, 139, 250, 0.7)', font: { size: 11 } },
                            border: { display: false },
                            title: { display: true, text: 'Torque', color: 'rgba(167, 139, 250, 0.7)', font: { size: 12, weight: 500 } }
                          },
                          y5: {
                            type: 'linear',
                            display: chartToggles.pwm,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            offset: true,
                            min: 0,
                            max: 100,
                            ticks: { color: 'rgba(6, 182, 212, 0.7)', font: { size: 11 } },
                            border: { display: false },
                            title: { display: true, text: 'PWM (%)', color: 'rgba(6, 182, 212, 0.7)', font: { size: 12, weight: 500 } }
                          },
                        },
                        interaction: { 
                          mode: chartSnapMode ? 'nearest' : 'index', 
                          intersect: chartSnapMode,
                          axis: 'x'
                        },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            boxPadding: 4,
                          }
                        },
                        onHover: throttle((_event: unknown, activeElements: unknown[]) => {
                          if (!showFloatingPanel || floatingPanelFrozen || !activeElements.length) return;

                          const dataIndex = (activeElements as { index: number }[])[0].index;
                          const dataPoint = displayData[dataIndex];
                          if (!dataPoint) return;

                          const newData = [
                            { label: 'Скорость', value: dataPoint.Speed, color: '#3b82f6', unit: 'км/ч' },
                            { label: 'GPS', value: dataPoint.GPSSpeed, color: '#10b981', unit: 'км/ч' },
                            { label: 'Мощность', value: dataPoint.Power, color: '#f59e0b', unit: 'Вт' },
                            { label: 'Ток', value: dataPoint.Current, color: '#ef4444', unit: 'А' },
                            { label: 'Напряжение', value: dataPoint.Voltage, color: '#8b5cf6', unit: 'В' },
                            { label: 'Батарея', value: dataPoint.BatteryLevel, color: '#ec4899', unit: '%' },
                            { label: 'Темп', value: dataPoint.Temperature, color: '#f97316', unit: '°C' },
                            { label: 'PWM', value: dataPoint.PWM, color: '#06b6d4', unit: '%' },
                          ];

                          const timestamp = new Date(dataPoint.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });

                          setFloatingPanelData(newData);
                          setFloatingPanelTimestamp(timestamp);
                        }, 50),
                        onClick: (_event: unknown, activeElements: unknown[]) => {
                          if (!activeElements.length) return;

                          const dataIndex = (activeElements as { index: number }[])[0].index;
                          const dataPoint = displayData[dataIndex];
                          if (!dataPoint) return;

                          const newData = [
                            { label: 'Скорость', value: dataPoint.Speed, color: '#3b82f6', unit: 'км/ч' },
                            { label: 'GPS', value: dataPoint.GPSSpeed, color: '#10b981', unit: 'км/ч' },
                            { label: 'Мощность', value: dataPoint.Power, color: '#f59e0b', unit: 'Вт' },
                            { label: 'Ток', value: dataPoint.Current, color: '#ef4444', unit: 'А' },
                            { label: 'Напряжение', value: dataPoint.Voltage, color: '#8b5cf6', unit: 'В' },
                            { label: 'Батарея', value: dataPoint.BatteryLevel, color: '#ec4899', unit: '%' },
                            { label: 'Темп', value: dataPoint.Temperature, color: '#f97316', unit: '°C' },
                            { label: 'PWM', value: dataPoint.PWM, color: '#06b6d4', unit: '%' },
                          ];

                          const timestamp = new Date(dataPoint.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          });

                          setShowFloatingPanel(true);
                          setFloatingPanelFrozen(true);
                          setFloatingPanelData(newData);
                          setFloatingPanelTimestamp(timestamp);
                        }
                      } as any}
                      data={combinedChartData}
                    />
                  ) : (
                    <ScatterPlot data={filteredData} />
                  )}
                </div>

                {/* Integrated Timeline - compact version inside chart area */}
                {timeRange && (
                  <div className="mt-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {compressedTimeRange ? 'Сжатая шкала:' : 'Шкала:'}
                      </span>
                      <div 
                        data-timeline
                        className="flex-1 relative h-5 bg-white/5 rounded overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                        onMouseDown={handleTimelineMouseDown}
                        onMouseMove={handleTimelineMouseMove}
                        onMouseUp={handleTimelineMouseUp}
                        onMouseLeave={handleTimelineMouseUp}
                      >
                        {/* Background - show segments when collapsed */}
                        {hideIdlePeriods && collapsedTimeRange ? (
                          <>
                            {collapsedTimeRange.periods.map((period, index) => {
                              const prevPeriod = index > 0 ? collapsedTimeRange.periods[index - 1] : null;
                              const gapStart = prevPeriod ? prevPeriod.end : timeRange.start;
                              const effectiveRange = compressedTimeRange || timeRange;
                              
                              return (
                                <div key={index}>
                                  {index > 0 && (
                                    <div
                                      className="absolute top-0 bottom-0 bg-slate-800/50"
                                      style={{
                                        left: `${((gapStart - effectiveRange.start) / (effectiveRange.end - effectiveRange.start)) * 100}%`,
                                        width: `${((period.start - gapStart) / (effectiveRange.end - effectiveRange.start)) * 100}%`,
                                      }}
                                    />
                                  )}
                                  <div
                                    className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"
                                    style={{
                                      left: `${((period.start - effectiveRange.start) / (effectiveRange.end - effectiveRange.start)) * 100}%`,
                                      width: `${((period.end - period.start) / (effectiveRange.end - effectiveRange.start)) * 100}%`,
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
                        )}
                        
                        {/* Current viewport with draggable edges */}
                        {chartZoom && (
                          <>
                            <div
                              className="absolute top-0 bottom-0 bg-blue-500/30 hover:bg-blue-500/40 transition-colors"
                              style={{
                                left: `${((chartZoom.min - (compressedTimeRange || timeRange).start) / ((compressedTimeRange || timeRange).end - (compressedTimeRange || timeRange).start)) * 100}%`,
                                width: `${((chartZoom.max - chartZoom.min) / ((compressedTimeRange || timeRange).end - (compressedTimeRange || timeRange).start)) * 100}%`,
                              }}
                            />
                            <div
                              className="absolute top-0 bottom-0 w-1.5 bg-blue-400/60 hover:bg-blue-400 cursor-col-resize transition-colors"
                              style={{
                                left: `${((chartZoom.min - (compressedTimeRange || timeRange).start) / ((compressedTimeRange || timeRange).end - (compressedTimeRange || timeRange).start)) * 100}%`,
                                transform: 'translateX(-50%)',
                              }}
                            />
                            <div
                              className="absolute top-0 bottom-0 w-1.5 bg-blue-400/60 hover:bg-blue-400 cursor-col-resize transition-colors"
                              style={{
                                left: `${((chartZoom.max - (compressedTimeRange || timeRange).start) / ((compressedTimeRange || timeRange).end - (compressedTimeRange || timeRange).start)) * 100}%`,
                                transform: 'translateX(-50%)',
                              }}
                            />
                          </>
                        )}
                        
                        {/* Time labels */}
                        <div className="absolute inset-0 flex justify-between px-2 items-center text-[9px] text-slate-600 pointer-events-none">
                          <span>{new Date((compressedTimeRange || timeRange).start).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                          <span>{new Date((compressedTimeRange || timeRange).end).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      {chartZoom && (
                        <button
                          onClick={resetZoom}
                          className="text-[10px] text-blue-400 hover:text-blue-300 whitespace-nowrap px-2 py-1 bg-blue-500/10 rounded border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                        >
                          Сброс
                        </button>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>

            {/* Floating Data Panel - draggable overlay */}
            <FloatingDataPanel
              data={floatingPanelData}
              timestamp={floatingPanelTimestamp}
              isVisible={showFloatingPanel}
              onClose={() => setShowFloatingPanel(false)}
              position={floatingPanelPosition}
              onPositionChange={setFloatingPanelPosition}
              isFrozen={floatingPanelFrozen}
              onToggleFreeze={() => setFloatingPanelFrozen(prev => !prev)}
            />
          </>
        ) : (
          <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl h-[500px] flex flex-col items-center justify-center text-center px-6">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
            <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl mb-6 inline-block border border-white/10">
                <Upload className="w-16 h-16 text-blue-400" strokeWidth={1.5} />
              </div>
              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {i18n.t('readyToAnalyze')}
              </h2>
              <p className="text-slate-400 max-w-md mb-4">
                {i18n.t('uploadPrompt')}
              </p>
              
              {/* Demo file button */}
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    setFileName('demo-trip.csv');
                    const response = await fetch('/demo-trip.csv');
                    const text = await response.text();
                    const parsedData = parseTripData(text);
                    setData(parsedData);
                    setSummary(calculateSummary(parsedData));
                    if (parsedData.length > 0) {
                      const timestamps = parsedData.map(e => e.timestamp);
                      setTimeRange({
                        start: Math.min(...timestamps),
                        end: Math.max(...timestamps),
                      });
                    }
                    setLoading(false);
                  } catch (error) {
                    console.error('Failed to load demo:', error);
                    alert('Ошибка загрузки демо файла');
                    setLoading(false);
                  }
                }}
                className="mb-6 px-5 py-2.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl border border-emerald-500/40 text-emerald-300 text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Загрузить демо поездку
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
