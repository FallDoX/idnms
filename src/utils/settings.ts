// Settings persistence utility for localStorage

export interface AppSettings {
  // Chart preferences
  chartToggles: Record<string, boolean>;
  
  // View preferences
  chartView: 'line' | 'scatter';
  hideIdlePeriods: boolean;
}

const STORAGE_KEY = 'windfighter-settings';

const DEFAULT_SETTINGS: AppSettings = {
  chartToggles: {
    speed: true,
    gpsSpeed: true,
    power: true,
    current: true,
    phaseCurrent: false,
    voltage: true,
    batteryLevel: true,
    temperature: true,
    temp2: false,
    torque: false,
    pwm: false,
  },
  chartView: 'line',
  hideIdlePeriods: false,
};

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Save settings to localStorage
 * @param settings Settings to save
 * @returns true if successful, false otherwise
 */
export function saveSettings(settings: Partial<AppSettings>): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const existingSettings = loadSettings();
    const mergedSettings = { ...existingSettings, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSettings));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

/**
 * Load settings from localStorage
 * @returns Settings object, or defaults if not available
 */
export function loadSettings(): AppSettings {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, using defaults');
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed = JSON.parse(stored);
    
    // Validate and merge with defaults
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      chartToggles: { ...DEFAULT_SETTINGS.chartToggles, ...parsed.chartToggles },
    };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Clear all settings from localStorage
 * @returns true if successful, false otherwise
 */
export function clearSettings(): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear settings:', e);
    return false;
  }
}

/**
 * Reset settings to defaults
 * @returns true if successful, false otherwise
 */
export function resetSettings(): boolean {
  return saveSettings(DEFAULT_SETTINGS);
}

/**
 * Export settings for backup
 * @returns JSON string of settings
 */
export function exportSettings(): string {
  const settings = loadSettings();
  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON string
 * @param json JSON string of settings
 * @returns true if successful, false otherwise
 */
export function importSettings(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    return saveSettings(parsed);
  } catch (e) {
    console.error('Failed to import settings:', e);
    return false;
  }
}
