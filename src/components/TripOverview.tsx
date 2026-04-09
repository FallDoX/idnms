import React, { memo } from 'react';
import { Settings, EyeOff, Grid3X3, Gauge, TrendingUp, Clock, Zap, Battery, Thermometer, Activity, Upload, Share2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { i18n } from '../i18n';
import type { TripSummary } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Modern glassmorphism stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  unit?: string;
  gradient: { from: string; to: string };
  delay?: number;
  tooltip?: string;
}

const StatCard = memo(({ title, value, icon: Icon, unit, gradient, delay = 0, tooltip }: StatCardProps) => (
  <div
    title={tooltip || `${title}: ${value}${unit ? ' ' + unit : ''}`}
    className={cn(
      "relative rounded-xl p-2.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group",
      "bg-gradient-to-br backdrop-blur-xl border border-white/5"
    )}
    style={{
      background: `linear-gradient(135deg, ${gradient.from}22, ${gradient.to}22)`,
      animationDelay: `${delay}ms`
    }}
  >
    {/* Animated gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    {/* Subtle glow effect */}
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-8 translate-x-8 blur-xl opacity-50" />
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-1">
        <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-colors">
          <Icon className="w-3 h-3 text-white/90" strokeWidth={2} />
        </div>
        {unit && <span className="text-[8px] font-medium text-white/40 uppercase tracking-wider">{unit}</span>}
      </div>
      <p className="text-white/50 text-[8px] font-medium mb-0.5 uppercase tracking-wider">{title}</p>
      <p className="text-lg font-bold text-white tracking-tight">{value}</p>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

interface TripOverviewProps {
  summary: TripSummary;
  visibleMetrics: Record<string, boolean>;
  showSettings: boolean;
  onSettingsToggle: () => void;
  onVisibleMetricsChange: (key: string) => void;
  onFileLoad: () => void;
  onShare: () => void;
}

export function TripOverview({ summary, visibleMetrics, showSettings, onSettingsToggle, onVisibleMetricsChange, onFileLoad, onShare }: TripOverviewProps) {
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) return `${hours}ч ${minutes}м`;
    if (minutes > 0) return `${minutes}м ${seconds}с`;
    return `${seconds}с`;
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Обзор поездки</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onFileLoad}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 border text-sm bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            title="Загрузить другой файл"
          >
            <Upload className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Загрузить</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 border text-sm bg-purple-500/20 border-purple-500/40 text-purple-200 hover:bg-purple-500/30"
            title="Поделиться: сохраняет скриншот всей страницы в PNG"
          >
            <Share2 className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Поделиться</span>
          </button>
          <button
            onClick={onSettingsToggle}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 border text-sm",
              showSettings
                ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
            )}
            title={showSettings ? "Свернуть настройки" : "Настройка видимых метрик"}
          >
            {showSettings ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Settings className="w-4 h-4" strokeWidth={2} />}
            <span className="hidden sm:inline">{showSettings ? "Свернуть" : "Настройки"}</span>
          </button>
        </div>
      </div>

      {/* Settings Panel - expands inside trip overview */}
      {showSettings && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            {i18n.t('visibleMetrics')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(visibleMetrics).map(([key, value]) => (
              <button
                key={key}
                onClick={() => onVisibleMetricsChange(key)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
                  value
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                    : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                )}
              >
                {value ? <EyeOff className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Speed Metrics Section */}
        {(visibleMetrics.maxSpeed || visibleMetrics.avgSpeed || visibleMetrics.avgMovingSpeed) && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('speed')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-400" />
                Скорость
              </span>
              {collapsedSections.speed ? <Settings className="w-4 h-4 text-slate-400 rotate-[-90deg]" /> : <Settings className="w-4 h-4 text-slate-400 rotate-[180deg]" />}
            </button>
            {!collapsedSections.speed && (
              <div className="p-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-white/5">
                {visibleMetrics.maxSpeed && summary.maxSpeed > 0 && (
                  <StatCard
                    title={i18n.t('maxSpeed')}
                    value={summary.maxSpeed.toFixed(1)}
                    unit="km/h"
                    icon={Gauge}
                    gradient={{ from: '#3b82f6', to: '#6366f1' }}
                    tooltip="Максимальная скорость достигнутая во время поездки"
                  />
                )}
                {visibleMetrics.avgSpeed && summary.avgSpeed > 0 && (
                  <StatCard
                    title={i18n.t('avgSpeed')}
                    value={summary.avgSpeed.toFixed(1)}
                    unit="km/h"
                    icon={Gauge}
                    gradient={{ from: '#6366f1', to: '#8b5cf6' }}
                    tooltip="Средняя скорость за всё время поездки (включая стоянки)"
                  />
                )}
                {visibleMetrics.avgMovingSpeed && summary.avgMovingSpeed > 0 && (
                  <StatCard
                    title={i18n.t('avgMovingSpeed')}
                    value={summary.avgMovingSpeed.toFixed(1)}
                    unit="km/h"
                    icon={Gauge}
                    gradient={{ from: '#8b5cf6', to: '#a855f7' }}
                    tooltip="Средняя скорость только во время движения (скорость >5 км/ч)"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Distance & Time Section */}
        {(visibleMetrics.distance || visibleMetrics.duration || visibleMetrics.ridingTime) && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('distanceTime')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Расстояние и время
              </span>
              {collapsedSections.distanceTime ? <Settings className="w-4 h-4 text-slate-400 rotate-[-90deg]" /> : <Settings className="w-4 h-4 text-slate-400 rotate-[180deg]" />}
            </button>
            {!collapsedSections.distanceTime && (
              <div className="p-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-white/5">
                {visibleMetrics.distance && summary.totalDistance > 0 && (
                  <StatCard
                    title={i18n.t('distance')}
                    value={summary.totalDistance.toFixed(2)}
                    unit="km"
                    icon={TrendingUp}
                    gradient={{ from: '#10b981', to: '#06b6d4' }}
                    tooltip="Общее расстояние пройденное за поездку"
                  />
                )}
                {visibleMetrics.duration && summary.duration > 0 && (
                  <StatCard
                    title={i18n.t('duration')}
                    value={formatDuration(summary.duration)}
                    unit=""
                    icon={Clock}
                    gradient={{ from: '#06b6d4', to: '#3b82f6' }}
                    tooltip="Общее время поездки от старта до финиша"
                  />
                )}
                {visibleMetrics.ridingTime && summary.movingDuration > 0 && (
                  <StatCard
                    title={i18n.t('ridingTime')}
                    value={formatDuration(summary.movingDuration)}
                    unit=""
                    icon={Clock}
                    gradient={{ from: '#3b82f6', to: '#6366f1' }}
                    tooltip="Чистое время в движении (без стоянок)"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Power & Current Section */}
        {(visibleMetrics.maxPower || visibleMetrics.maxTorque || visibleMetrics.maxPhaseCurrent) && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('power')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Мощность и ток
              </span>
              {collapsedSections.power ? <Settings className="w-4 h-4 text-slate-400 rotate-[-90deg]" /> : <Settings className="w-4 h-4 text-slate-400 rotate-[180deg]" />}
            </button>
            {!collapsedSections.power && (
              <div className="p-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-white/5">
                {visibleMetrics.maxPower && summary.maxPower > 0 && (
                  <StatCard
                    title={i18n.t('maxPower')}
                    value={summary.maxPower.toFixed(0)}
                    unit="W"
                    icon={Zap}
                    gradient={{ from: '#f59e0b', to: '#ef4444' }}
                    tooltip="Максимальная потребляемая мощность в Ваттах"
                  />
                )}
                {visibleMetrics.maxTorque && summary.maxTorque !== undefined && summary.maxTorque > 0 && (
                  <StatCard
                    title={i18n.t('maxTorque')}
                    value={summary.maxTorque.toFixed(2)}
                    unit=""
                    icon={Zap}
                    gradient={{ from: '#a855f7', to: '#9333ea' }}
                    tooltip="Максимальный крутящий момент двигателя в Н·м"
                  />
                )}
                {visibleMetrics.maxPhaseCurrent && summary.maxPhaseCurrent !== undefined && summary.maxPhaseCurrent > 0 && (
                  <StatCard
                    title={i18n.t('maxPhaseI')}
                    value={summary.maxPhaseCurrent.toFixed(1)}
                    unit="A"
                    icon={Zap}
                    gradient={{ from: '#84cc16', to: '#65a30d' }}
                    tooltip="Максимальный фазный ток двигателя в Амперах"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Battery Section */}
        {(visibleMetrics.batteryDrop || visibleMetrics.maxBatteryDrop) && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('battery')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Battery className="w-4 h-4 text-pink-400" />
                Батарея
              </span>
              {collapsedSections.battery ? <Settings className="w-4 h-4 text-slate-400 rotate-[-90deg]" /> : <Settings className="w-4 h-4 text-slate-400 rotate-[180deg]" />}
            </button>
            {!collapsedSections.battery && (
              <div className="p-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-white/5">
                {visibleMetrics.batteryDrop && (
                  <StatCard
                    title={i18n.t('batteryDrop')}
                    value={summary.batteryDrop}
                    unit="%"
                    icon={Battery}
                    gradient={{ from: '#ec4899', to: '#f43f5e' }}
                    tooltip="Общий разряд батареи: разница между зарядом в начале и конце поездки"
                  />
                )}
                {visibleMetrics.maxBatteryDrop && summary.maxBatteryDrop !== undefined && summary.maxBatteryDrop > 0 && (
                  <StatCard
                    title={i18n.t('maxBatteryDrop')}
                    value={summary.maxBatteryDrop.toFixed(1)}
                    unit="%"
                    icon={Battery}
                    gradient={{ from: '#f43f5e', to: '#ef4444' }}
                    tooltip="Максимальная просадка от пика: наибольшее падение заряда от максимального уровня во время поездки"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Temperature Section */}
        {(visibleMetrics.avgTemp || visibleMetrics.maxTemp) && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('temperature')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                Температура
              </span>
              {collapsedSections.temperature ? <Settings className="w-4 h-4 text-slate-400 rotate-[-90deg]" /> : <Settings className="w-4 h-4 text-slate-400 rotate-[180deg]" />}
            </button>
            {!collapsedSections.temperature && (
              <div className="p-3 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t border-white/5">
                {visibleMetrics.avgTemp && summary.avgTemp !== undefined && summary.avgTemp > 0 && (
                  <StatCard
                    title={i18n.t('avgTemp')}
                    value={summary.avgTemp.toFixed(1)}
                    unit="°C"
                    icon={Thermometer}
                    gradient={{ from: '#f97316', to: '#ef4444' }}
                    tooltip="Средняя температура контроллера за поездку"
                  />
                )}
                {visibleMetrics.maxTemp && summary.maxTemp !== undefined && summary.maxTemp > 0 && (
                  <StatCard
                    title={i18n.t('maxTemp')}
                    value={summary.maxTemp.toFixed(1)}
                    unit="°C"
                    icon={Thermometer}
                    gradient={{ from: '#ef4444', to: '#dc2626' }}
                    tooltip="Максимальная температура контроллера достигнутая во время поездки"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Data Section */}
        {visibleMetrics.totalSamples && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('data')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                Данные
              </span>
              {collapsedSections.data ? <Settings className="w-4 h-4 text-slate-400 rotate-[-90deg]" /> : <Settings className="w-4 h-4 text-slate-400 rotate-[180deg]" />}
            </button>
            {!collapsedSections.data && (
              <div className="p-3 border-t border-white/5">
                <StatCard
                  title={i18n.t('totalSamples')}
                  value="N/A"
                  unit=""
                  icon={Activity}
                  gradient={{ from: '#64748b', to: '#475569' }}
                  tooltip="Общее количество точек данных в загруженном файле"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
