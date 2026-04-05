import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ChartOptions } from 'chart.js';
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
import { parseTripData, calculateSummary, downsample, filterData, defaultFilterConfig, type DataFilterConfig, getAccelerationForThresholds } from './utils/parser';
import type { TripEntry, TripSummary, SpeedThreshold } from './types';
import { 
  Activity, Battery, Gauge, Thermometer, Zap, Clock, TrendingUp, Rocket, 
  Settings, ChevronDown, ChevronUp, Upload, BarChart3, 
  Eye, EyeOff, Grid3X3, ZoomIn, ZoomOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AccelerationTable } from './components/AccelerationTable';
import { AccelerationChart } from './components/AccelerationChart';
import { ScatterPlot } from './components/ScatterPlot';
import { i18n } from './i18n';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

// Modern gradient stat card component
const StatCard = ({ title, value, icon: Icon, unit, gradient, delay = 0 }: any) => (
  <div 
    className={cn(
      "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl group",
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
);

// Modern toggle chip
const ToggleChip = ({ label, active, onClick, color = "blue" }: any) => {
  const colorMap: any = {
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    green: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-300",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-300",
    pink: "bg-pink-500/20 border-pink-500/30 text-pink-300",
  };
  
  const activeMap: any = {
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
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border flex items-center gap-1.5",
        active ? activeMap[color] : colorMap[color],
        "hover:opacity-80"
      )}
    >
      {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {label}
    </button>
  );
};

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
    batteryVoltageDrop: true, // New: voltage drop metric
    maxBatteryDrop: true, // Maximum battery drop during trip
    avgTemp: true,
    duration: false,  // Total log time (hidden by default)
    ridingTime: true, // Time while moving (shown by default)
    avgSpeed: true,
    avgMovingSpeed: true,
    totalSamples: false,
    best0to60: false,
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
  const chartRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; zoomMin: number; zoomMax: number } | null>(null);

  // Panels visibility
  const [showSettings, setShowSettings] = useState(false);

  // Data filter state
  const [filterConfig, setFilterConfig] = useState<DataFilterConfig>(defaultFilterConfig);
  const [filterStats, setFilterStats] = useState<{ removed: number; issues: string[] } | null>(null);
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
    
    // Update filter stats (only when filter is enabled and data changes)
    if (filterConfig.enabled && result.removed > 0) {
      setFilterStats({ removed: result.removed, issues: result.issues.slice(0, 5) });
    } else {
      setFilterStats(null);
    }
    
    return filtered;
  }, [data, timeRange, filterConfig, hideIdlePeriods]);

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

  // Optimized data for charts to prevent UI lag with large logs
  const displayData = useMemo(() => downsample(filteredData, 1500), [filteredData]);

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

  const handleChartDoubleClick = useCallback(() => {
    resetZoom();
  }, [resetZoom]);

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

  const commonOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          displayFormats: {
            minute: 'HH:mm'
          }
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: 'rgba(255, 255, 255, 0.7)', usePointStyle: true }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    elements: {
        line: { borderWidth: 2 },
        point: { radius: 0, hoverRadius: 5 }
    }
  };

  // Combined chart data with toggles
  const combinedChartData = useMemo(() => {
    const datasets: any[] = [];

    if (chartToggles.speed) {
      datasets.push({
        label: 'Speed (km/h)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Speed })),
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
        data: displayData.map(e => ({ x: e.timestamp, y: e.GPSSpeed })),
        borderColor: '#10b981',
        tension: 0.1,
        borderDash: [5, 5],
        yAxisID: 'y',
      });
    }

    if (chartToggles.power) {
      datasets.push({
        label: 'Power (W)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Power })),
        borderColor: '#f59e0b',
        tension: 0.1,
        yAxisID: 'y1',
      });
    }

    if (chartToggles.current) {
      datasets.push({
        label: 'Current (A)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Current })),
        borderColor: '#ef4444',
        tension: 0.1,
        yAxisID: 'y2',
      });
    }

    if (chartToggles.phaseCurrent && displayData[0]?.PhaseCurrent !== undefined) {
      datasets.push({
        label: 'Phase Current (A)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.PhaseCurrent })),
        borderColor: '#f87171',
        tension: 0.1,
        borderDash: [2, 2],
        yAxisID: 'y2',
      });
    }

    if (chartToggles.voltage) {
      datasets.push({
        label: 'Voltage (V)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Voltage })),
        borderColor: '#8b5cf6',
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (chartToggles.batteryLevel) {
      datasets.push({
        label: 'Battery %',
        data: displayData.map(e => ({ x: e.timestamp, y: e.BatteryLevel })),
        borderColor: '#ec4899',
        tension: 0.1,
        yAxisID: 'y3',
      });
    }

    if (chartToggles.temperature) {
      datasets.push({
        label: 'Temperature (°C)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Temperature })),
        borderColor: '#f97316',
        tension: 0.1,
        yAxisID: 'y',
      });
    }

    if (chartToggles.temp2 && displayData[0]?.Temp2 !== undefined) {
      datasets.push({
        label: 'Temp 2 (°C)',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Temp2 })),
        borderColor: '#fb923c',
        tension: 0.1,
        borderDash: [3, 3],
        yAxisID: 'y',
      });
    }

    if (chartToggles.torque && displayData[0]?.Torque !== undefined) {
      datasets.push({
        label: 'Torque',
        data: displayData.map(e => ({ x: e.timestamp, y: e.Torque })),
        borderColor: '#a78bfa',
        tension: 0.1,
        yAxisID: 'y4',
      });
    }

    if (chartToggles.pwm) {
      datasets.push({
        label: 'PWM',
        data: displayData.map(e => ({ x: e.timestamp, y: e.PWM })),
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
      
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-8" onDragOver={onDragOver}>
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
            "group flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all duration-300",
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
            <div className="text-center bg-slate-900/95 p-12 rounded-3xl shadow-2xl border-2 border-dashed border-blue-500/50 animate-pulse">
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
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 mb-6">
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

                {/* Data Quality Filter Section */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      {i18n.t('dataFilter')}
                    </h3>
                    <button
                      onClick={() => setFilterConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2",
                        filterConfig.enabled
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {filterConfig.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {filterConfig.enabled ? i18n.t('filterEnabled') : i18n.t('filterDisabled')}
                    </button>
                  </div>
                  
                  {filterConfig.enabled && filterStats && filterStats.removed > 0 && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-300 font-medium mb-1">
                        ⚠️ {i18n.t('filteredRecords', { count: filterStats.removed })}
                      </p>
                      <ul className="text-xs text-amber-400/80 space-y-0.5">
                        {filterStats.issues.map((issue, i) => (
                          <li key={i} className="truncate">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-xs text-slate-500">
                    {i18n.t('filterDesc')}
                  </p>
                </div>

                {/* Hide Idle Periods Toggle */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {i18n.t('hideIdlePeriods')}
                    </h3>
                    <button
                      onClick={() => setHideIdlePeriods(prev => !prev)}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2",
                        hideIdlePeriods
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                          : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {hideIdlePeriods ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {hideIdlePeriods ? i18n.t('idlePeriodsEnabled') : i18n.t('idlePeriodsDisabled')}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {i18n.t('idlePeriodsDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Summary cards - Modern gradient design */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {visibleMetrics.maxSpeed && filteredSummary!.maxSpeed > 0 && (
                <StatCard 
                  title={i18n.t('maxSpeed')} 
                  value={filteredSummary!.maxSpeed.toFixed(1)} 
                  unit="km/h" 
                  icon={Gauge} 
                  gradient={{ from: '#3b82f6', to: '#8b5cf6' }}
                />
              )}
              {visibleMetrics.distance && filteredSummary!.totalDistance > 0 && (
                <StatCard 
                  title={i18n.t('distance')} 
                  value={filteredSummary!.totalDistance.toFixed(2)} 
                  unit="km" 
                  icon={TrendingUp} 
                  gradient={{ from: '#10b981', to: '#3b82f6' }}
                />
              )}
              {visibleMetrics.maxPower && filteredSummary!.maxPower > 0 && (
                <StatCard 
                  title={i18n.t('maxPower')} 
                  value={filteredSummary!.maxPower.toFixed(0)} 
                  unit="W" 
                  icon={Zap} 
                  gradient={{ from: '#f59e0b', to: '#ef4444' }}
                />
              )}
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
              {visibleMetrics.totalSamples && (
                <StatCard 
                  title={i18n.t('totalSamples')} 
                  value={filteredData.length.toLocaleString()} 
                  unit="" 
                  icon={Activity} 
                  gradient={{ from: '#64748b', to: '#475569' }}
                />
              )}
              {/* Peak accelerations with time */}
              {visibleMetrics.peakAcceleration && (
                <div className={cn(
                  "relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl group",
                  "bg-gradient-to-br border border-white/10 backdrop-blur-sm"
                )}
                style={{ 
                  backgroundImage: 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.3))',
                }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-white/60 font-medium">{i18n.t('peakAcceleration')}</span>
                    </div>
                    <div className="space-y-2">
                      {thresholds.slice(0, 4).map((t) => {
                        const result = accelerationResults[t.id];
                        if (!result?.bestRun) return null;
                        const timeStr = result.time !== null 
                          ? (result.time < 1 ? `${(result.time * 1000).toFixed(0)} мс` : `${result.time.toFixed(2)} с`)
                          : '—';
                        return (
                          <div key={t.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-1 last:border-0 last:pb-0">
                            <span className="text-white/70">{t.label}:</span>
                            <div className="text-right">
                              <span className="font-bold text-white">{result.bestRun.peakAcceleration.toFixed(2)} м/с²</span>
                              <span className="text-white/50 text-xs ml-2">({timeStr})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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

            {/* Main Chart with Built-in Time Range & Zoom */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden mb-8 shadow-2xl">
              {/* Header with toggles and zoom */}
              <div className="p-5 border-b border-white/10">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {i18n.t('tripTelemetry')}
                      </h3>
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
                  <div className="flex items-center gap-2">
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
                className="p-6 cursor-grab active:cursor-grabbing select-none touch-none"
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleChartMouseUp}
                onMouseLeave={handleChartMouseLeave}
                onDoubleClick={handleChartDoubleClick}
                onWheel={handleChartWheel}
                onTouchStart={handleChartTouchStart}
                onTouchMove={handleChartTouchMove}
                onTouchEnd={handleChartTouchEnd}
              >
                <div className="h-[450px] w-full">
                  {chartView === 'line' ? (
                    <Line
                      ref={chartRef}
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
                        interaction: { mode: 'index', intersect: false },
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
                        }
                      } as any}
                      data={combinedChartData}
                    />
                  ) : (
                    <ScatterPlot data={filteredData} />
                  )}
                </div>
              </div>

              {/* Custom Legend - horizontal lines flowing into labels */}
              <div className="px-6 pb-2 flex items-center justify-center gap-8">
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
                    <span className="text-xs text-slate-500 whitespace-nowrap">{i18n.t('scale')}:</span>
                    <div 
                      data-timeline
                      className="flex-1 relative h-8 bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                      onMouseDown={handleTimelineMouseDown}
                      onMouseMove={handleTimelineMouseMove}
                      onMouseUp={handleTimelineMouseUp}
                      onMouseLeave={handleTimelineMouseUp}
                    >
                      {/* Full range background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
                      
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
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Rocket className="w-6 h-6 text-amber-400" />
                {i18n.t('accelerationAnalysis')}
              </h2>
              <AccelerationChart data={filteredData} />
              <AccelerationTable 
                data={filteredData} 
                thresholds={thresholds} 
                onThresholdsChange={setThresholds} 
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
              <p className="text-slate-400 max-w-md mb-8">
                {i18n.t('uploadPrompt')}
              </p>
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
