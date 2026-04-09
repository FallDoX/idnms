export type Language = 'en' | 'ru';

export const translations = {
  en: {
    // Header
    appTitle: 'WindFighter EUC',
    appSubtitle: 'EUC telemetry',
    uploadCSV: 'Upload CSV',
    dropCSV: 'Drop CSV File',
    dropCSVSubtitle: 'Processing your telemetry data...',
    parsingData: 'Parsing telemetry data...',
    readyToAnalyze: 'Ready to Analyze',
    uploadPrompt: 'Drag and drop your trip CSV file here or use the upload button to visualize your journey telemetry.',

    // Display Settings
    displaySettings: 'Display Settings',
    visibleMetrics: 'Visible Metrics',
    dataFilter: 'Data Filter',
    hideIdlePeriods: 'Hide Idle Periods',
    filterEnabled: 'Enabled',
    filterDisabled: 'Disabled',
    idlePeriodsEnabled: 'Enabled',
    idlePeriodsDisabled: 'Disabled',
    idlePeriodsDesc: 'Hides periods with speed < 5 km/h for > 30 seconds',
    filterDesc: 'Filter removes: gaps > 10sec, GPS teleportation > 200km/h or > 500m in 5sec, GPS rollback, stuck GPS',
    filteredRecords: 'Filtered: {{count}} records',

    // Chart
    tripTelemetry: 'Trip Telemetry',
    zoomInfo: 'Zoom: {{minutes}} min ({{percent}}%)',
    zoomIn: 'Zoom In',
    resetZoom: 'Reset Zoom',
    chartTypeLine: '📈 Line',
    chartTypeScatter: '🔵 Scatter',

    // Metrics
    speed: 'Speed',
    gpsSpeed: 'GPS Speed',
    power: 'Power',
    current: 'Current',
    phaseCurrent: 'Phase I',
    voltage: 'Voltage',
    batteryPercent: 'Battery %',
    temp: 'Temp',
    temp2: 'Temp 2',
    torque: 'Torque',
    pwm: 'PWM',

    // Summary Cards
    maxSpeed: 'Max Speed',
    avgSpeed: 'Avg Speed',
    avgMovingSpeed: 'Avg Moving',
    distance: 'Distance',
    movingTime: 'Moving Time',
    maxPower: 'Max Power',
    batteryDrop: 'Battery Drop',
    batteryDischarge: 'Battery Discharge',
    batteryVoltageDrop: 'Voltage Drop',
    maxBatteryDrop: 'Max Drop',
    consumption: 'Consumption',
    maxCurrent: 'Max Current',
    duration: 'Duration',
    totalSamples: 'Samples',
    peakAcceleration: 'Peak Accel',
    best060: '0-60 Time',
    maxTorque: 'Max Torque',
    maxPhaseI: 'Max Phase I',
    avgTemp: 'Avg Temp',
    maxTemp: 'Max Temp',
    ridingTime: 'Riding Time',

    // Acceleration Analysis
    accelerationAnalysis: 'Acceleration Analysis',
    accelerationResults: 'Acceleration Results',
    noAccelerationData: 'No acceleration data from standstill.',
    needZeroSpeed: 'For acceleration measurement, a log starting from 0 km/h is required.',
    timeToSpeed: '{{speed}} km/h',
    peak: 'peak',

    // Scatter Plot
    axisX: 'X Axis',
    axisY: 'Y Axis',
    color: 'Color',

    // Timeline
    scale: 'Scale',
    reset: 'Reset',
    mobileHint: '📱 Mobile: 1 finger = pan | 2 fingers = pinch-zoom | 👆 Zoom buttons',
    desktopHint: '💻 PC: Horizontal swipe = pan | Shift+Scroll = zoom | Double click = zoom in',

    // File
    uploadError: 'Please upload a CSV file',

    // New UI Elements
    hideIdlePeriodsTitle: 'Hide Idle Periods',
    dataFilterTitle: 'Data Filter',
    shareTitle: 'Share',
    floatingPanelTitle: 'Floating Panel',
    snapModeTitle: 'Snap Mode',
    panelOn: 'Panel ON',
    panelOff: 'Panel OFF',
    snapOn: 'Snap ON',
    snapOff: 'Snap OFF',
    enabled: 'Enabled',
    disabled: 'Disabled',
    on: 'ON',
    off: 'OFF',

    // Tooltips
    tooltipIdlePeriods: 'Removes idle periods from the chart',
    tooltipDataFilter: 'Removes data anomalies (configurable)',
    tooltipShare: 'Screenshot of the entire page',
    tooltipFloatingPanel: 'Toggle floating data panel',
    tooltipSnapMode: 'Snap to data points on hover',
    tooltipZoomIn: 'Zoom In',
    tooltipResetZoom: 'Reset Zoom',

    // Data Panel
    dataPanelTitle: 'Data Panel',
    noData: 'No data',
    locked: 'LOCKED',
    unlock: 'Unlock',
    lock: 'Lock',

    // Messages
    noDataToSave: 'No data to save. Please upload a CSV file.',
    exportContainerNotFound: 'Export container not found',
    screenshotError: 'Error creating screenshot',
    demoLoadError: 'Error loading demo file',

    // Units and labels
    ms: 'ms',
    sec: 's',
    ms2: 'm/s²',
    kmh: 'km/h',
    watt: 'W',
    amp: 'A',
    volt: 'V',
    percent: '%',
    celsius: '°C',
    km: 'km',
    wh: 'Wh',
    whkm: 'Wh/km',
  },
  ru: {
    // Header
    appTitle: 'WindFighter EUC',
    appSubtitle: 'Телеметрия EUC',
    uploadCSV: 'Загрузить CSV',
    dropCSV: 'Перетащите CSV файл',
    dropCSVSubtitle: 'Обработка данных телеметрии...',
    parsingData: 'Парсинг данных телеметрии...',
    readyToAnalyze: 'Готов к анализу',
    uploadPrompt: 'Перетащите CSV файл с логом поездки сюда или используйте кнопку загрузки для визуализации данных.',

    // Display Settings
    displaySettings: 'Настройки отображения',
    visibleMetrics: 'Видимые метрики',
    dataFilter: 'Фильтр данных',
    hideIdlePeriods: 'Скрыть простои',
    filterEnabled: 'Включен',
    filterDisabled: 'Выключен',
    idlePeriodsEnabled: 'Включено',
    idlePeriodsDisabled: 'Выключено',
    idlePeriodsDesc: 'Скрывает периоды со скоростью < 5 км/ч длительностью > 30 секунд',
    filterDesc: 'Фильтр удаляет: разрывы > 10сек, GPS телепортации > 200км/ч или > 500м за 5сек, откат GPS, застрявший GPS',
    filteredRecords: 'Отфильтровано: {{count}} записей',

    // Chart
    tripTelemetry: 'Телеметрия поездки',
    zoomInfo: 'Зум: {{minutes}} мин ({{percent}}%)',
    zoomIn: 'Приблизить',
    resetZoom: 'Сбросить зум',
    chartTypeLine: '📈 Линии',
    chartTypeScatter: '🔵 Scatter',

    // Metrics
    speed: 'Скорость',
    gpsSpeed: 'GPS скорость',
    power: 'Мощность',
    current: 'Ток',
    phaseCurrent: 'Фазный ток',
    voltage: 'Напряжение',
    batteryPercent: 'Батарея %',
    temp: 'Температура',
    temp2: 'Темп. 2',
    torque: 'Крутящий момент',
    pwm: 'PWM',

    // Summary Cards
    maxSpeed: 'Макс. скорость',
    avgSpeed: 'Средняя скорость',
    avgMovingSpeed: 'Средняя в движении',
    distance: 'Расстояние',
    movingTime: 'Время в движении',
    maxPower: 'Макс. мощность',
    batteryDrop: 'Общий разряд батареи',
    batteryDischarge: 'Разряд за поездку',
    batteryVoltageDrop: 'Падение напряжения под нагрузкой',
    maxBatteryDrop: 'Макс. просадка от пика',
    consumption: 'Расход',
    maxCurrent: 'Макс. ток',
    duration: 'Длительность',
    totalSamples: 'Точек',
    peakAcceleration: 'Пиковое ускорение',
    best060: 'Разгон 0-60',
    maxTorque: 'Макс. момент',
    maxPhaseI: 'Макс. фазный ток',
    avgTemp: 'Средняя темп.',
    maxTemp: 'Макс. темп.',
    ridingTime: 'Время в пути',

    // Acceleration Analysis
    accelerationAnalysis: 'Анализ ускорения',
    accelerationResults: 'Результаты ускорения',
    noAccelerationData: 'Нет данных о разгоне с места.',
    needZeroSpeed: 'Для измерения ускорения нужен лог с началом движения от 0 км/ч.',
    timeToSpeed: '{{speed}} км/ч',
    peak: 'пик',

    // Scatter Plot
    axisX: 'Ось X',
    axisY: 'Ось Y',
    color: 'Цвет',

    // Timeline
    scale: 'Шкала',
    reset: 'Сброс',
    mobileHint: '📱 Телефон: 1 палец = панорама | 2 пальца = pinch-зум | 👆 Кнопки зума',
    desktopHint: '💻 ПК: Горизонтальный свайп = панорама | Shift+Scroll = зум | Двойной клик = приближение',

    // File
    uploadError: 'Пожалуйста, загрузите CSV файл',

    // New UI Elements
    hideIdlePeriodsTitle: 'Скрыть простои',
    dataFilterTitle: 'Фильтр данных',
    shareTitle: 'Поделиться',
    floatingPanelTitle: 'Плавающая панель',
    snapModeTitle: 'Прилипание к точкам',
    panelOn: 'Панель ВКЛ',
    panelOff: 'Панель ВЫКЛ',
    snapOn: 'Snap ВКЛ',
    snapOff: 'Snap ВЫКЛ',
    enabled: 'Вкл',
    disabled: 'Выкл',
    on: 'ВКЛ',
    off: 'ВЫКЛ',

    // Tooltips
    tooltipIdlePeriods: 'Убирает из графика периоды стоянки',
    tooltipDataFilter: 'Удаляет аномалии (настраивается)',
    tooltipShare: 'Скриншот всей страницы',
    tooltipFloatingPanel: 'Вкл/выкл плавающую панель',
    tooltipSnapMode: 'Прилипать к точкам при наведении',
    tooltipZoomIn: 'Приблизить',
    tooltipResetZoom: 'Сбросить зум',

    // Data Panel
    dataPanelTitle: 'Панель данных',
    noData: 'Нет данных',
    locked: 'ЗАМОК',
    unlock: 'Разморозить',
    lock: 'Заморозить',

    // Messages
    noDataToSave: 'Нет данных для сохранения. Загрузите CSV файл.',
    exportContainerNotFound: 'Не найден контейнер для экспорта',
    screenshotError: 'Ошибка создания скриншота',
    demoLoadError: 'Ошибка загрузки демо файла',

    // Units and labels
    ms: 'мс',
    sec: 'с',
    ms2: 'м/с²',
    kmh: 'км/ч',
    watt: 'Вт',
    amp: 'А',
    volt: 'В',
    percent: '%',
    celsius: '°C',
    km: 'км',
    wh: 'Втч',
    whkm: 'Втч/км',
  }
};

// Detect browser language
export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('ru')) return 'ru';
  return 'en';
}

// Create i18n hook
export function createI18n() {
  let currentLang: Language = detectLanguage();
  
  const t = (key: keyof typeof translations.en, params?: Record<string, string | number>): string => {
    let text = translations[currentLang][key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }
    
    return text;
  };
  
  const setLanguage = (lang: Language) => {
    currentLang = lang;
  };
  
  const getLanguage = () => currentLang;
  
  return { t, setLanguage, getLanguage };
}

// Singleton instance
export const i18n = createI18n();
