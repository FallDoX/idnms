import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
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
import { parseTripData, calculateSummary, downsample, filterData, defaultFilterConfig, type DataFilterConfig, getAccelerationForThresholds } from './utils/parser';
import type { TripEntry, TripSummary, SpeedThreshold } from './types';
import { 
  Activity, Battery, Gauge, Thermometer, Zap, Clock, TrendingUp, Rocket, 
  Settings, ChevronDown, ChevronUp, Upload, BarChart3, 
  Eye, EyeOff, Grid3X3, ZoomIn, ZoomOut, Share2, Info
} from 'lucide-react';
import { throttle } from './utils/performance';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toPng } from 'html-to-image';
import { AccelerationTable } from './components/AccelerationTable';
import { AccelerationChart } from './components/AccelerationChart';
import { ScatterPlot } from './components/ScatterPlot';
import { FloatingDataPanel } from './components/FloatingDataPanel';
import { i18n } from './i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Vertical cursor line plugin for chart hover - optimized for performance
const verticalCursorPlugin = {
  id: 'verticalCursor',
  afterInit: (chart: any) => {
    chart.verticalCursor = { x: null, visible: false, lastX: null };
  },
  afterEvent: (chart: any, args: any) => {
    // Safety check - ensure verticalCursor exists
    if (!chart.verticalCursor) {
      chart.verticalCursor = { x: null, visible: false, lastX: null };
    }
    
    const { event } = args;
    if (event.type === 'mousemove') {
      const points = chart.getElementsAtEventForMode(event, 'index', { intersect: false }, true);
      if (points.length) {
        const newX = points[0].element.x;
        // Only update if position changed significantly (>2px)
        if (Math.abs(newX - (chart.verticalCursor.lastX || 0)) > 2) {
          chart.verticalCursor.x = newX;
          chart.verticalCursor.lastX = newX;
          chart.verticalCursor.visible = true;
          chart.draw('none'); // Use 'none' mode for better performance
        }
      }
    } else if (event.type === 'mouseout') {
      chart.verticalCursor.visible = false;
      chart.draw('none');
    }
  },
  afterDraw: (chart: any) => {
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

// Modern gradient stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  unit?: string;
  gradient: { from: string; to: string };
  delay?: number;
}

const StatCard = memo(({ title, value, icon: Icon, unit, gradient, delay = 0 }: StatCardProps) => (
  <div 
    className={cn(
      "relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-lg group",
      "bg-gradient-to-br border border-white/10 backdrop-blur-sm"
    )}
    style={{ 
      background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
      animationDelay: `${delay}ms`
    }}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        {unit && <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{unit}</span>}
      </div>
      <p className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  </div>
));

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
    peakAcceleration: true,
    maxTorque: true,
    maxPhaseCurrent: true,
    maxTemp: false,
  });

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

  // Acceleration thresholds
  const [thresholds, setThresholds] = useState<SpeedThreshold[]>([
    { id: 't25', label: '0-25', value: 25 },
    { id: 't50', label: '0-50', value: 50 },
    { id: 't60', label: '0-60', value: 60 },
    { id: 't90', label: '0-90', value: 90 },
    { id: 't100', label: '0-100', value: 100 },
  ]);

  // Chart zoom & pan state
  const [chartZoom, setChartZoom] = useState<{ min: number; max: number } | null>(null);
  const [chartView, setChartView] = useState<'line' | 'scatter'>('line');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; zoomMin: number; zoomMax: number } | null>(null);

  // Panels visibility
  const [showSettings, setShowSettings] = useState(false);

  // Floating data panel state
  const [showFloatingPanel, setShowFloatingPanel] = useState<boolean>(false);
  const [floatingPanelFrozen, setFloatingPanelFrozen] = useState<boolean>(false);
  const [floatingPanelPosition, setFloatingPanelPosition] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
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
      
      filtered = filtered.filter((entry, index, arr) => {
        if (entry.Speed >= IDLE_THRESHOLD_KMH) return true;
        
        // Check if this is part of a long idle period
        // Look ahead to see how long the idle period lasts
        let idleEndIndex = index;
        for (let i = index + 1; i < arr.length; i++) {
          if (arr[i].Speed >= IDLE_THRESHOLD_KMH) break;
          idleEndIndex = i;
        }
        
        // Look back to find the start of this idle period
        let idleStartIndex = index;
        for (let i = index - 1; i >= 0; i--) {
          if (arr[i].Speed >= IDLE_THRESHOLD_KMH) break;
          idleStartIndex = i;
        }
        
        const idleDuration = arr[idleEndIndex].timestamp - arr[idleStartIndex].timestamp;
        
        // Keep only if idle period is short
        return idleDuration < IDLE_TIME_THRESHOLD_MS;
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

  // Recompute summary for filtered data
  const filteredSummary = useMemo(() => {
    if (filteredData.length === 0) return null;
    return calculateSummary(filteredData);
  }, [filteredData]);

  // Compute acceleration results for all thresholds (for peak acceleration display)
  const accelerationResults = useMemo(() => {
    if (filteredData.length === 0) return {};
    return getAccelerationForThresholds(filteredData, thresholds);
  }, [filteredData, thresholds]);

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
    const currentTimeRange = chartZoom ? { start: chartZoom.min, end: chartZoom.max } : timeRange;
    return downsample(filteredData, 500, currentTimeRange);
  }, [filteredData, chartZoom, timeRange]);

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

  const resetZoom = useCallback(() => {
    setChartZoom(null);
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
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
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
  const commonOptions = {
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

  // Optimized chart data generation with individual memoization for each dataset
  // Prevents recreating arrays when toggles change
  const chartDatasets = useMemo(() => {
    const datasets: Record<string, Array<{ x: number; y: number | null }>> = {
      speed: displayData.map(e => ({ x: e.timestamp, y: e.Speed })),
      gpsSpeed: displayData.map(e => ({ x: e.timestamp, y: e.GPSSpeed })),
      power: displayData.map(e => ({ x: e.timestamp, y: e.Power ?? null })),
      current: displayData.map(e => ({ x: e.timestamp, y: e.Current ?? null })),
      phaseCurrent: displayData.map(e => ({ x: e.timestamp, y: e.PhaseCurrent ?? null })),
      voltage: displayData.map(e => ({ x: e.timestamp, y: e.Voltage })),
      batteryLevel: displayData.map(e => ({ x: e.timestamp, y: e.BatteryLevel })),
      temperature: displayData.map(e => ({ x: e.timestamp, y: e.Temperature })),
      temp2: displayData.map(e => ({ x: e.timestamp, y: e.Temp2 ?? null })),
      torque: displayData.map(e => ({ x: e.timestamp, y: e.Torque ?? null })),
      pwm: displayData.map(e => ({ x: e.timestamp, y: e.PWM })),
    };
    return datasets;
  }, [displayData]);

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
  }, [displayData, chartToggles]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

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
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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
          
          <label className={cn(
            "group flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all duration-300",
            "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400",
            "shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
            "hover:scale-105 active:scale-95"
          )}>
            <Upload className="w-5 h-5 group-hover:animate-bounce" strokeWidth={2} />
            <span className="font-semibold">{i18n.t('uploadCSV')}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </header>

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
        ) : data.length > 0 && summary ? (
          <>
            {/* Settings Panel Toggle */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 border",
                  showSettings 
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300" 
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                )}
              >
                <Settings className="w-4 h-4" strokeWidth={2} />
                <span className="font-medium">{i18n.t('displaySettings')}</span>
                {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-white/5 backdrop-blur-xl p-5 rounded-xl border border-white/10 mb-6 space-y-6">
                {/* Visible Metrics */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    {i18n.t('visibleMetrics')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(visibleMetrics).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={cn(
                          "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
                          value 
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-300" 
                            : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {value ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Configuration */}
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Настройки фильтра данных
                  </h3>
                  
                  {/* Time Gap */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-400">Разрыв времени (паузы)</label>
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
                    <p className="text-[10px] text-slate-500 mt-1">Точки с паузой {'>'} этого значения будут удалены</p>
                  </div>

                  {/* GPS Teleportation */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
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
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-400">GPS дистанция лимит</label>
                        <span className="text-xs text-red-400 font-medium">{filterConfig.gpsTeleportDistanceM} м</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="50"
                        value={filterConfig.gpsTeleportDistanceM}
                        onChange={(e) => setFilterConfig(prev => ({ ...prev, gpsTeleportDistanceM: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                    </div>
                  </div>

                  {/* Stuck GPS */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-400">Застрявший GPS (точки)</label>
                      <span className="text-xs text-yellow-400 font-medium">{filterConfig.stuckGpsPoints} точек</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="50"
                      value={filterConfig.stuckGpsPoints}
                      onChange={(e) => setFilterConfig(prev => ({ ...prev, stuckGpsPoints: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Сигнал если {'>'} точек с одинаковыми координатами</p>
                  </div>

                  {/* Value Limits */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-400">Max Speed</label>
                        <span className="text-xs text-blue-400 font-medium">{filterConfig.limits.Speed.max} км/ч</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="400"
                        step="10"
                        value={filterConfig.limits.Speed.max}
                        onChange={(e) => setFilterConfig(prev => ({ 
                          ...prev, 
                          limits: { ...prev.limits, Speed: { ...prev.limits.Speed, max: parseInt(e.target.value) } }
                        }))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-slate-400">Max Voltage</label>
                        <span className="text-xs text-blue-400 font-medium">{filterConfig.limits.Voltage.max} V</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="400"
                        step="5"
                        value={filterConfig.limits.Voltage.max}
                        onChange={(e) => setFilterConfig(prev => ({ 
                          ...prev, 
                          limits: { ...prev.limits, Voltage: { ...prev.limits.Voltage, max: parseInt(e.target.value) } }
                        }))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => setFilterConfig(defaultFilterConfig)}
                    className="text-xs text-slate-400 hover:text-white underline transition-colors"
                  >
                    Сбросить настройки фильтра
                  </button>
                </div>
              </div>
            )}

            {/* Summary cards - Grouped by category in compact boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              
              {/* Speed Box */}
              {(visibleMetrics.maxSpeed || visibleMetrics.avgSpeed || visibleMetrics.avgMovingSpeed) && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Скорость
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {visibleMetrics.maxSpeed && filteredSummary!.maxSpeed > 0 && (
                      <StatCard 
                        title={i18n.t('maxSpeed')} 
                        value={filteredSummary!.maxSpeed.toFixed(1)} 
                        unit="km/h" 
                        icon={Gauge} 
                        gradient={{ from: '#3b82f6', to: '#8b5cf6' }}
                      />
                    )}
                    {visibleMetrics.avgSpeed && filteredSummary!.avgSpeed > 0 && (
                      <StatCard 
                        title={i18n.t('avgSpeed')} 
                        value={filteredSummary!.avgSpeed.toFixed(1)} 
                        unit="km/h" 
                        icon={Gauge} 
                        gradient={{ from: '#3b82f6', to: '#6366f1' }}
                      />
                    )}
                    {visibleMetrics.avgMovingSpeed && filteredSummary!.avgMovingSpeed > 0 && (
                      <StatCard 
                        title={i18n.t('avgMovingSpeed')} 
                        value={filteredSummary!.avgMovingSpeed.toFixed(1)} 
                        unit="km/h" 
                        icon={Gauge} 
                        gradient={{ from: '#6366f1', to: '#8b5cf6' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Distance & Time Box */}
              {(visibleMetrics.distance || visibleMetrics.duration || visibleMetrics.ridingTime) && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Дистанция и время
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {visibleMetrics.distance && filteredSummary!.totalDistance > 0 && (
                      <StatCard 
                        title={i18n.t('distance')} 
                        value={filteredSummary!.totalDistance.toFixed(2)} 
                        unit="km" 
                        icon={TrendingUp} 
                        gradient={{ from: '#10b981', to: '#3b82f6' }}
                      />
                    )}
                    {visibleMetrics.duration && filteredSummary!.duration > 0 && (
                      <StatCard 
                        title={i18n.t('duration')} 
                        value={formatDuration(filteredSummary!.duration)} 
                        unit="" 
                        icon={Clock} 
                        gradient={{ from: '#6366f1', to: '#4f46e5' }}
                      />
                    )}
                    {visibleMetrics.ridingTime && filteredSummary!.movingDuration > 0 && (
                      <StatCard 
                        title={i18n.t('ridingTime')} 
                        value={formatDuration(filteredSummary!.movingDuration)} 
                        unit="" 
                        icon={Clock} 
                        gradient={{ from: '#06b6d4', to: '#0891b2' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Power & Current Box */}
              {(visibleMetrics.maxPower || visibleMetrics.maxTorque || visibleMetrics.maxPhaseCurrent) && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Мощность и ток
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {visibleMetrics.maxPower && filteredSummary!.maxPower > 0 && (
                      <StatCard 
                        title={i18n.t('maxPower')} 
                        value={filteredSummary!.maxPower.toFixed(0)} 
                        unit="W" 
                        icon={Zap} 
                        gradient={{ from: '#f59e0b', to: '#ef4444' }}
                      />
                    )}
                    {visibleMetrics.maxTorque && filteredSummary!.maxTorque !== undefined && filteredSummary!.maxTorque > 0 && (
                      <StatCard 
                        title={i18n.t('maxTorque')} 
                        value={filteredSummary!.maxTorque.toFixed(2)} 
                        unit="" 
                        icon={Zap} 
                        gradient={{ from: '#a855f7', to: '#9333ea' }}
                      />
                    )}
                    {visibleMetrics.maxPhaseCurrent && filteredSummary!.maxPhaseCurrent !== undefined && filteredSummary!.maxPhaseCurrent > 0 && (
                      <StatCard 
                        title={i18n.t('maxPhaseI')} 
                        value={filteredSummary!.maxPhaseCurrent.toFixed(1)} 
                        unit="A" 
                        icon={Zap} 
                        gradient={{ from: '#84cc16', to: '#65a30d' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Battery Box */}
              {(visibleMetrics.batteryDrop || visibleMetrics.maxBatteryDrop) && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    Батарея
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleMetrics.batteryDrop && (
                      <StatCard 
                        title={i18n.t('batteryDrop')} 
                        value={filteredSummary!.batteryDrop} 
                        unit="%" 
                        icon={Battery} 
                        gradient={{ from: '#ec4899', to: '#f43f5e' }}
                      />
                    )}
                    {visibleMetrics.maxBatteryDrop && filteredSummary!.maxBatteryDrop !== undefined && filteredSummary!.maxBatteryDrop > 0 && (
                      <StatCard 
                        title={i18n.t('maxBatteryDrop')} 
                        value={filteredSummary!.maxBatteryDrop.toFixed(1)} 
                        unit="%" 
                        icon={Battery} 
                        gradient={{ from: '#f43f5e', to: '#e11d48' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Temperature Box */}
              {(visibleMetrics.avgTemp || visibleMetrics.maxTemp) && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Thermometer className="w-4 h-4" />
                    Температура
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleMetrics.avgTemp && filteredSummary!.avgTemp !== undefined && filteredSummary!.avgTemp > 0 && (
                      <StatCard 
                        title={i18n.t('avgTemp')} 
                        value={filteredSummary!.avgTemp.toFixed(1)} 
                        unit="°C" 
                        icon={Thermometer} 
                        gradient={{ from: '#f97316', to: '#ea580c' }}
                      />
                    )}
                    {visibleMetrics.maxTemp && filteredSummary!.maxTemp !== undefined && filteredSummary!.maxTemp > 0 && (
                      <StatCard 
                        title={i18n.t('maxTemp')} 
                        value={filteredSummary!.maxTemp.toFixed(1)} 
                        unit="°C" 
                        icon={Thermometer} 
                        gradient={{ from: '#ef4444', to: '#dc2626' }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Acceleration Box */}
              {visibleMetrics.peakAcceleration && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    <span>Разгон</span>
                    {/* Inline tooltip for Acceleration box */}
                    <div className="relative group">
                      <Info className="w-3 h-3 text-purple-400/70 cursor-help hover:text-purple-400 transition-colors" />
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[240px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 border-b border-purple-500/20">
                          <span className="text-xs font-bold text-purple-200">Анализ ускорения</span>
                        </div>
                        <div className="p-3 text-xs text-slate-300 leading-relaxed">
                          Время разгона между заданными скоростями. Лучший результат выделен золотым. Настройте диапазоны скоростей в таблице ниже.
                        </div>
                      </div>
                    </div>
                  </h3>
                  <div className="space-y-2">
                    {/* Best 0-60 time - highlighted */}
                    {filteredSummary?.best0to60 && filteredSummary.best0to60 > 0 && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 mb-3">
                        <span className="text-white/80 font-medium">Лучший 0-60:</span>
                        <div className="text-right">
                          <span className="font-bold text-amber-400">
                            {filteredSummary.best0to60 < 1 
                              ? `${(filteredSummary.best0to60 * 1000).toFixed(0)} мс`
                              : `${filteredSummary.best0to60.toFixed(2)} с`
                            }
                          </span>
                        </div>
                      </div>
                    )}
                    {thresholds.slice(0, 4).map((t) => {
                      const result = accelerationResults[t.id];
                      if (!result?.bestRun) return null;
                      const timeStr = result.time !== null 
                        ? (result.time < 1 ? `${(result.time * 1000).toFixed(0)} мс` : `${result.time.toFixed(2)} с`)
                        : '—';
                      return (
                        <div key={t.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-white/70 font-medium">{t.label}:</span>
                          <div className="text-right flex items-center gap-3">
                            <span className="font-bold text-white text-base">{result.bestRun.peakAcceleration.toFixed(2)} <span className="text-white/60 text-xs">м/с²</span></span>
                            <span className="font-bold text-amber-400 text-lg">{timeStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Data Stats Box */}
              {visibleMetrics.totalSamples && (
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Данные
                  </h3>
                  <StatCard 
                    title={i18n.t('totalSamples')} 
                    value={filteredData.length.toLocaleString()} 
                    unit="" 
                    icon={Activity} 
                    gradient={{ from: '#64748b', to: '#475569' }}
                  />
                </div>
              )}
            </div>

            {/* Main Chart with Built-in Time Range & Zoom */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden mb-8 shadow-lg">
              {/* Header with toggles and zoom */}
              <div className="p-5 border-b border-white/10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                          {i18n.t('tripTelemetry')}
                        </h3>
                        {/* Inline tooltip for Trip Telemetry - positioned relative to element */}
                        <div className="relative group">
                          <Info className="w-4 h-4 text-slate-500 cursor-help hover:text-slate-400 transition-colors" />
                          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[260px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-blue-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-2 border-b border-blue-500/20">
                              <span className="text-xs font-bold text-blue-200">Телеметрия поездки</span>
                            </div>
                            <div className="p-3 text-xs text-slate-300 leading-relaxed">
                              Интерактивный график всех параметров поездки. Поддерживает зум, панораму, переключение линий. Двойной клик — приближение, Shift+колесо — зум, горизонтальный свайп — панорама, вертикальный свайп — зум.
                            </div>
                          </div>
                        </div>
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

                  {/* Zoom controls - redesigned for mobile with larger touch targets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Hide Idle Periods Toggle */}
                    <div className="relative group">
                      <button
                        onClick={() => setHideIdlePeriods(prev => !prev)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2",
                          hideIdlePeriods
                            ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-200 shadow-lg shadow-emerald-500/20"
                            : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80"
                        )}
                      >
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline">{i18n.t('hideIdlePeriods')}</span>
                        <span className="sm:hidden">{hideIdlePeriods ? i18n.t('on') : i18n.t('off')}</span>
                      </button>
                      {/* Tooltip positioned to the RIGHT of button */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[260px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-2 border-b border-emerald-500/20 sticky top-0">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-emerald-500/20 rounded">
                              <Clock className="w-3 h-3 text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-emerald-200">Скрыть простои</span>
                          </div>
                        </div>
                        {/* Content */}
                        <div className="p-3 space-y-2">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Убирает из графика периоды стоянки:
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-emerald-400">1</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Стоянка на месте</p>
                                <p className="text-[9px] text-slate-500">Скорость {'<'}5 км/ч {'>'}30 сек</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-teal-400">2</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Паузы в поездке</p>
                                <p className="text-[9px] text-slate-500">Светофоры, парковка</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-cyan-400">3</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Эффект</p>
                                <p className="text-[9px] text-slate-500">Средняя скорость только в движении</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-[9px] text-emerald-400/80 flex items-center gap-1 pt-1 border-t border-slate-700/50">
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                            Полезно для чистой езды
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Data Filter Toggle */}
                    <div className="relative group">
                      <button
                        onClick={() => setFilterConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2",
                          filterConfig.enabled
                            ? "bg-amber-500/30 border-amber-500/60 text-amber-200 shadow-lg shadow-amber-500/20"
                            : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80"
                        )}
                      >
                        <Activity className="w-4 h-4" />
                        <span className="hidden sm:inline">{i18n.t('dataFilter')}</span>
                        <span className="sm:hidden">{filterConfig.enabled ? i18n.t('on') : i18n.t('off')}</span>
                      </button>
                      {/* Tooltip positioned to the RIGHT of button */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[280px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden max-h-[450px] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-2 border-b border-amber-500/20 sticky top-0">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-amber-500/20 rounded">
                              <Activity className="w-3 h-3 text-amber-400" />
                            </div>
                            <span className="text-xs font-bold text-amber-200">Фильтр данных</span>
                          </div>
                        </div>
                        {/* Content */}
                        <div className="p-3 space-y-2">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Удаляет аномалии (настраивается):
                          </p>
                          {/* Filter items - compact */}
                          <div className="space-y-1">
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-red-400">1</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">GPS телепортация</p>
                                <p className="text-[9px] text-slate-500">{'>'}{filterConfig.gpsTeleportSpeedKmh} км/ч или {'>'}{filterConfig.gpsTeleportDistanceM}м за {'<'}{filterConfig.gpsTeleportTimeS}сек</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-orange-400">2</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Разрывы времени</p>
                                <p className="text-[9px] text-slate-500">Паузы {'>'}{filterConfig.maxTimeGapSeconds} сек</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-yellow-400">3</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Застрявший GPS</p>
                                <p className="text-[9px] text-slate-500">{'>'}{filterConfig.stuckGpsPoints} точек с одинаковыми коорд</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-blue-400">4</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Невозможные значения</p>
                                <p className="text-[9px] text-slate-500">Speed 0-{filterConfig.limits.Speed.max}, Voltage {filterConfig.limits.Voltage.min}-{filterConfig.limits.Voltage.max}V</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-purple-400">5</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Откат дистанции</p>
                                <p className="text-[9px] text-slate-500">Уменьшение {'>'}{filterConfig.distanceRollbackM}м</p>
                              </div>
                            </div>
                          </div>
                          {/* Footer */}
                          <p className="text-[9px] text-amber-400/80 flex items-center gap-1 pt-1 border-t border-slate-700/50">
                            <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                            Настройки в панели ↓
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {/* Share Button */}
                    <div className="relative group">
                      <button
                        onClick={handleShareStats}
                        className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl border border-purple-500/40 transition-all duration-200 flex items-center gap-2 text-purple-200"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Поделиться</span>
                      </button>
                      {/* Tooltip positioned to the RIGHT of button */}
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[240px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden max-h-[350px] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 border-b border-purple-500/20 sticky top-0">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-purple-500/20 rounded">
                              <Share2 className="w-3 h-3 text-purple-400" />
                            </div>
                            <span className="text-xs font-bold text-purple-200">Поделиться</span>
                          </div>
                        </div>
                        {/* Content */}
                        <div className="p-3 space-y-2">
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Скриншот всей страницы:
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-purple-400">1</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Полная страница</p>
                                <p className="text-[9px] text-slate-500">Все карточки, график, таблицы</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-pink-400">2</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Высокое качество</p>
                                <p className="text-[9px] text-slate-500">PNG 1.5x scale, 4K+</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <div className="w-4 h-4 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[8px] text-fuchsia-400">3</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-medium text-slate-200">Файл</p>
                                <p className="text-[9px] text-slate-500">trip-log-[дата].png</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-[9px] text-purple-400/80 flex items-center gap-1 pt-1 border-t border-slate-700/50">
                            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                            Для соцсетей и архива
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Floating Data Panel Toggle */}
                    <button
                      onClick={() => setShowFloatingPanel(prev => !prev)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2",
                        showFloatingPanel
                          ? "bg-indigo-500/30 border-indigo-500/60 text-indigo-200 shadow-lg shadow-indigo-500/20"
                          : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80"
                      )}
                      title={showFloatingPanel ? i18n.t('tooltipFloatingPanel') : i18n.t('tooltipFloatingPanel')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                      <span className="hidden sm:inline">{showFloatingPanel ? i18n.t('panelOn') : i18n.t('panelOff')}</span>
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {/* Snap Mode Toggle */}
                    <button
                      onClick={() => setChartSnapMode(prev => !prev)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border flex items-center gap-2",
                        chartSnapMode
                          ? "bg-cyan-500/30 border-cyan-500/60 text-cyan-200 shadow-lg shadow-cyan-500/20"
                          : "bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700/80"
                      )}
                      title={chartSnapMode ? i18n.t('snapOn') : i18n.t('snapOff')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      <span className="hidden sm:inline">{chartSnapMode ? i18n.t('snapOn') : i18n.t('snapOff')}</span>
                    </button>

                    {/* Chart View Toggle */}
                    <button
                      onClick={() => setChartView(chartView === 'line' ? 'scatter' : 'line')}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-sm text-slate-300"
                    >
                      {chartView === 'line' ? i18n.t('chartTypeLine') : i18n.t('chartTypeScatter')}
                    </button>
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
                      className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl border border-blue-500/30 transition-colors active:scale-95"
                      title={i18n.t('zoomIn')}
                    >
                      <ZoomIn className="w-5 h-5 text-blue-300" />
                    </button>
                    <button
                      onClick={resetZoom}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors active:scale-95"
                      title={i18n.t('resetZoom')}
                    >
                      <ZoomOut className="w-5 h-5 text-slate-300" />
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
                        onHover: throttle((_event: any, activeElements: any[], _chart: any) => {
                          if (!showFloatingPanel || floatingPanelFrozen || !activeElements.length) return;
                          
                          const dataIndex = activeElements[0].index;
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
                        }, 50)
                      } as any}
                      data={combinedChartData}
                    />
                  ) : (
                    <ScatterPlot data={filteredData} />
                  )}
                </div>
              </div>

              {/* Custom Legend - horizontal lines flowing into labels - hidden on mobile */}
              <div className="hidden sm:flex px-6 pb-2 items-center justify-center gap-8">
                {/* Speed */}
                <div className="flex items-center gap-2">
                  {/* Steel 0-line */}
                  <div className="w-16 h-px bg-slate-400/30"></div>
                  {/* Colored line segment */}
                  <div className="w-12 h-0.5 bg-blue-500 -ml-14"></div>
                  <span className="text-sm text-blue-400 font-medium">Speed (km/h)</span>
                </div>
                
                {/* Power */}
                {chartToggles.power && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-px bg-slate-400/30"></div>
                    <div className="w-12 h-0.5 bg-amber-500 -ml-14"></div>
                    <span className="text-sm text-amber-400 font-medium">Power (W)</span>
                  </div>
                )}
                
                {/* Current */}
                {(chartToggles.current || chartToggles.phaseCurrent) && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-px bg-slate-400/30"></div>
                    <div className="w-12 h-0.5 bg-red-500 -ml-14"></div>
                    <span className="text-sm text-red-400 font-medium">Current (A)</span>
                  </div>
                )}
                
                {/* Battery */}
                {chartToggles.batteryLevel && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-px bg-slate-400/30"></div>
                    <div className="w-12 h-0.5 bg-pink-500 -ml-14"></div>
                    <span className="text-sm text-pink-400 font-medium">Battery %</span>
                  </div>
                )}
                
                {/* Torque */}
                {chartToggles.torque && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-px bg-slate-400/30"></div>
                    <div className="w-12 h-0.5 bg-purple-400 -ml-14"></div>
                    <span className="text-sm text-purple-300 font-medium">Torque</span>
                  </div>
                )}
                
                {/* PWM */}
                {chartToggles.pwm && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-px bg-slate-400/30"></div>
                    <div className="w-12 h-0.5 bg-cyan-500 -ml-14"></div>
                    <span className="text-sm text-cyan-400 font-medium">PWM %</span>
                  </div>
                )}
              </div>

              {/* Interactive Mini Timeline Overview */}
              {timeRange && (
                <div className="px-6 pb-4 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {hideIdlePeriods ? 'Активное время:' : i18n.t('scale') + ':'}
                    </span>
                    <div 
                      data-timeline
                      className="flex-1 relative h-8 bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                      onMouseDown={handleTimelineMouseDown}
                      onMouseMove={handleTimelineMouseMove}
                      onMouseUp={handleTimelineMouseUp}
                      onMouseLeave={handleTimelineMouseUp}
                    >
                      {/* Background - show segments when collapsed */}
                      {hideIdlePeriods && collapsedTimeRange ? (
                        <>
                          {/* Render gaps (idle periods) as darker segments */}
                          {collapsedTimeRange.periods.map((period, index) => {
                            const prevPeriod = index > 0 ? collapsedTimeRange.periods[index - 1] : null;
                            const gapStart = prevPeriod ? prevPeriod.end : timeRange.start;
                            const totalRange = timeRange.end - timeRange.start;
                            
                            return (
                              <div key={index}>
                                {/* Gap before this period (if not first) */}
                                {index > 0 && (
                                  <div
                                    className="absolute top-0 bottom-0 bg-slate-800/50"
                                    style={{
                                      left: `${((gapStart - timeRange.start) / totalRange) * 100}%`,
                                      width: `${((period.start - gapStart) / totalRange) * 100}%`,
                                    }}
                                  />
                                )}
                                {/* Active period */}
                                <div
                                  className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"
                                  style={{
                                    left: `${((period.start - timeRange.start) / totalRange) * 100}%`,
                                    width: `${((period.end - period.start) / totalRange) * 100}%`,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        /* Full range background */
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
                      )}
                      
                      {/* Current viewport with draggable edges */}
                      {chartZoom && (
                        <>
                          {/* Main viewport area */}
                          <div
                            className="absolute top-0 bottom-0 bg-blue-500/30 hover:bg-blue-500/40 transition-colors"
                            style={{
                              left: `${((chartZoom.min - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                              width: `${((chartZoom.max - chartZoom.min) / (timeRange.end - timeRange.start)) * 100}%`,
                            }}
                          />
                          {/* Left edge handle */}
                          <div
                            className="absolute top-0 bottom-0 w-2 bg-blue-400/60 hover:bg-blue-400 cursor-col-resize transition-colors"
                            style={{
                              left: `${((chartZoom.min - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                              transform: 'translateX(-50%)',
                            }}
                          />
                          {/* Right edge handle */}
                          <div
                            className="absolute top-0 bottom-0 w-2 bg-blue-400/60 hover:bg-blue-400 cursor-col-resize transition-colors"
                            style={{
                              left: `${((chartZoom.max - timeRange.start) / (timeRange.end - timeRange.start)) * 100}%`,
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </>
                      )}
                      
                      {/* Time labels */}
                      <div className="absolute inset-0 flex justify-between px-2 items-center text-[10px] text-slate-600 pointer-events-none">
                        <span>{new Date(timeRange.start).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>{new Date(timeRange.end).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    {chartZoom && (
                      <button
                        onClick={resetZoom}
                        className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                      >
                        {i18n.t('reset')}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2">
                    {i18n.t('mobileHint')}<br/>
                    {i18n.t('desktopHint')}
                  </p>
                </div>
              )}
            </div>

            {/* Acceleration Analysis Section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">
                  {i18n.t('accelerationAnalysis')}
                </h2>
                {/* Inline tooltip for Acceleration Analysis section */}
                <div className="relative group">
                  <Info className="w-4 h-4 text-slate-500 cursor-help hover:text-slate-400 transition-colors" />
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-[260px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-2 border-b border-purple-500/20">
                      <span className="text-xs font-bold text-purple-200">Анализ ускорения</span>
                    </div>
                    <div className="p-3 text-xs text-slate-300 leading-relaxed">
                      Анализ разгона с места. Показывает время достижения заданных скоростей (0-60, 0-100 и др.) и энергоэффективность. Кликайте пороги для редактирования, используйте ползунок на полосе для быстрой настройки.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Acceleration Scatter Plots */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Speed vs Power Scatter */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Скорость vs Мощность
                  </h3>
                  <div className="h-[300px]">
                    <Scatter
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            type: 'linear' as const,
                            position: 'bottom' as const,
                            title: { display: true, text: 'Скорость (км/ч)', color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                            min: 0,
                          },
                          y: {
                            type: 'linear' as const,
                            position: 'left' as const,
                            title: { display: true, text: 'Мощность (Вт)', color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                          },
                        },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                          },
                        },
                      }}
                      data={{
                        datasets: [{
                          label: 'Speed vs Power',
                          data: filteredData
                            .filter(d => d.Speed > 5 && d.Power > 0)
                            .map(d => ({ x: d.Speed, y: d.Power })),
                          backgroundColor: 'rgba(245, 158, 11, 0.6)',
                          borderColor: 'rgba(245, 158, 11, 0.8)',
                          pointRadius: 2,
                          pointHoverRadius: 4,
                        }],
                      }}
                    />
                  </div>
                </div>

                {/* Speed vs Current Scatter */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Скорость vs Ток
                  </h3>
                  <div className="h-[300px]">
                    <Scatter
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            type: 'linear' as const,
                            position: 'bottom' as const,
                            title: { display: true, text: 'Скорость (км/ч)', color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                            min: 0,
                          },
                          y: {
                            type: 'linear' as const,
                            position: 'left' as const,
                            title: { display: true, text: 'Ток (А)', color: 'rgba(255, 255, 255, 0.7)' },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                          },
                        },
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#cbd5e1',
                          },
                        },
                      }}
                      data={{
                        datasets: [{
                          label: 'Speed vs Current',
                          data: filteredData
                            .filter(d => d.Speed > 5 && d.Current > 0)
                            .map(d => ({ x: d.Speed, y: d.Current })),
                          backgroundColor: 'rgba(239, 68, 68, 0.6)',
                          borderColor: 'rgba(239, 68, 68, 0.8)',
                          pointRadius: 2,
                          pointHoverRadius: 4,
                        }],
                      }}
                    />
                  </div>
                </div>
              </div>
              <AccelerationChart data={filteredData} />
              <AccelerationTable 
                data={filteredData} 
                thresholds={thresholds} 
                onThresholdsChange={setThresholds} 
              />
              
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
            </div>
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
              
              <div className="flex flex-wrap justify-center gap-3">
                {[i18n.t('speed'), i18n.t('power'), i18n.t('temp'), i18n.t('voltage'), 'GPS'].map((item) => (
                  <span key={item} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
