import { createCanvas } from 'canvas';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { TripEntry } from './types.js';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_WIDTH = 1200;
const CHART_HEIGHT = 700;
const LEGEND_Y = 650;
const LEGEND_START_X = 50;
const LEGEND_LINE_LENGTH = 80;
const LEGEND_TEXT_OFFSET = 10;

export async function generateChartBuffer(
  data: TripEntry[],
  type: 'main' | 'acceleration' | 'gps'
): Promise<Buffer> {
  const canvas = createCanvas(CHART_WIDTH, CHART_HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

  const chartConfig = getChartConfig(data, type);
  
  // @ts-ignore
  const chart = new Chart(ctx, chartConfig);

  drawCustomLegend(ctx, type);

  const buffer = canvas.toBuffer('image/png');
  chart.destroy();

  return buffer;
}

function drawCustomLegend(ctx: any, type: 'main' | 'acceleration' | 'gps') {
  const legendItems: { label: string; color: string }[] = [];

  if (type === 'main') {
    legendItems.push(
      { label: 'Speed (km/h)', color: '#3b82f6' },
      { label: 'Power (W)', color: '#f59e0b' },
      { label: 'Current (A)', color: '#ef4444' }
    );
  } else if (type === 'acceleration') {
    legendItems.push(
      { label: 'Speed (km/h)', color: '#3b82f6' },
      { label: 'Acceleration (m/s²)', color: '#8b5cf6' }
    );
  } else {
    legendItems.push(
      { label: 'GPS Speed (km/h)', color: '#10b981' }
    );
  }

  const spacing = (CHART_WIDTH - 100) / legendItems.length;

  ctx.font = '14px Arial';
  ctx.textBaseline = 'middle';

  legendItems.forEach((item, index) => {
    const x = LEGEND_START_X + index * spacing;
    const textY = LEGEND_Y;

    // Steel-colored 0-line (horizontal reference)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.moveTo(x, textY);
    ctx.lineTo(x + LEGEND_LINE_LENGTH, textY);
    ctx.stroke();

    // Colored line flowing into label
    ctx.beginPath();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;
    ctx.moveTo(x + 5, textY);
    ctx.lineTo(x + LEGEND_LINE_LENGTH - 5, textY);
    ctx.stroke();

    // Label text
    ctx.fillStyle = item.color;
    ctx.fillText(item.label, x + LEGEND_LINE_LENGTH + LEGEND_TEXT_OFFSET, textY);
  });
}

export async function generateSummaryImage(data: TripEntry[]): Promise<Buffer> {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 800, 600);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Trip Summary', 20, 40);

  const maxSpeed = Math.max(...data.map((d: TripEntry) => d.Speed || 0));
  const maxPower = Math.max(...data.map((d: TripEntry) => d.Power || 0));
  const maxCurrent = Math.max(...data.map((d: TripEntry) => d.Current || 0));

  ctx.font = '18px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Max Speed: ${maxSpeed.toFixed(1)} km/h`, 20, 80);
  ctx.fillText(`Max Power: ${maxPower.toFixed(0)} W`, 20, 110);
  ctx.fillText(`Max Current: ${maxCurrent.toFixed(1)} A`, 20, 140);

  return canvas.toBuffer('image/png');
}

function getChartConfig(data: TripEntry[], type: 'main' | 'acceleration' | 'gps'): any {
  const labels = data.map((d: TripEntry) => new Date(d.timestamp));

  if (type === 'main') {
    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Speed (km/h)',
            data: data.map((d: TripEntry) => d.Speed),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
            pointRadius: 0,
          },
          {
            label: 'Power (W)',
            data: data.map((d: TripEntry) => d.Power),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
            pointRadius: 0,
          },
          {
            label: 'Current (A)',
            data: data.map((d: TripEntry) => d.Current),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y2',
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: false,
        backgroundColor: '#0f172a',
        layout: { padding: { bottom: 60 } },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Trip Telemetry',
            color: '#ffffff',
            font: { size: 20, weight: 'bold' },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: { displayFormats: { minute: 'HH:mm' } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Speed (km/h)', color: '#3b82f6' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Power (W)', color: '#f59e0b' },
            grid: { drawOnChartArea: false },
            ticks: { color: '#64748b' },
          },
          y2: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Current (A)', color: '#ef4444' },
            grid: { drawOnChartArea: false },
            ticks: { color: '#64748b' },
          },
        },
      },
    };
  }

  if (type === 'acceleration') {
    const accelerationData: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const dt = (data[i].timestamp - data[i - 1].timestamp) / 1000;
      const dv = (data[i].Speed || 0) - (data[i - 1].Speed || 0);
      const accel = dt > 0 ? (dv / 3.6) / dt : 0;
      accelerationData.push(accel);
    }

    return {
      type: 'line',
      data: {
        labels: labels.slice(1),
        datasets: [
          {
            label: 'Speed (km/h)',
            data: data.map((d: TripEntry) => d.Speed).slice(1),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
            pointRadius: 0,
          },
          {
            label: 'Acceleration (m/s²)',
            data: accelerationData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1',
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: false,
        backgroundColor: '#0f172a',
        layout: { padding: { bottom: 60 } },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Acceleration Analysis',
            color: '#ffffff',
            font: { size: 20, weight: 'bold' },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: { displayFormats: { minute: 'HH:mm' } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Speed (km/h)', color: '#3b82f6' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#64748b' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Acceleration (m/s²)', color: '#8b5cf6' },
            grid: { drawOnChartArea: false },
            ticks: { color: '#64748b' },
          },
        },
      },
    };
  }

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'GPS Speed (km/h)',
          data: data.map((d: TripEntry) => d.GPSSpeed || 0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: false,
      backgroundColor: '#0f172a',
      layout: { padding: { bottom: 60 } },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'GPS Track',
          color: '#ffffff',
          font: { size: 20, weight: 'bold' },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { displayFormats: { minute: 'HH:mm' } },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' },
        },
        y: {
          type: 'linear',
          title: { display: true, text: 'GPS Speed (km/h)', color: '#10b981' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#64748b' },
        },
      },
    },
  };
}
