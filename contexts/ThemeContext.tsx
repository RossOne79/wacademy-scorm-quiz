import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ButtonStyle = 'filled' | 'outline' | 'gradient';
export type ButtonRadius = 'square' | 'medium' | 'pill';
export type FontStack = 'system' | 'serif' | 'mono';
export type FontScale = 'small' | 'medium' | 'large';

export interface ThemeConfig {
  primaryColor: string;
  buttonStyle: ButtonStyle;
  buttonRadius: ButtonRadius;
  fontStack: FontStack;
  fontScale: FontScale;
}

export interface ThemePreset {
  name: string;
  config: ThemeConfig;
}

interface ThemeContextType {
  theme: ThemeConfig;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  savePreset: (name: string) => void;
  loadPreset: (name: string) => void;
  deletePreset: (name: string) => void;
  presets: ThemePreset[];
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#3b82f6', // blue-500
  buttonStyle: 'filled',
  buttonRadius: 'medium',
  fontStack: 'system',
  fontScale: 'medium',
};

const THEME_STORAGE_KEY = 'video-scorm-theme';
const PRESETS_STORAGE_KEY = 'video-scorm-theme-presets';

// Helper sicuri per l'accesso a localStorage
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage non disponibile, impossibile leggere i dati tema:', error);
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('localStorage non disponibile, impossibile salvare i dati tema:', error);
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const stored = safeGetItem(THEME_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultTheme;
  });

  const [presets, setPresets] = useState<ThemePreset[]>(() => {
    const stored = safeGetItem(PRESETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primaryColor);
    
    // Button radius mapping
    const radiusMap = {
      square: '0px',
      medium: '0.375rem',
      pill: '9999px',
    };
    root.style.setProperty('--theme-button-radius', radiusMap[theme.buttonRadius]);

    // Font stack mapping
    const fontMap = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    };
    root.style.setProperty('--theme-font-family', fontMap[theme.fontStack]);

    // Font scale mapping
    const scaleMap = {
      small: '0.875',
      medium: '1',
      large: '1.125',
    };
    root.style.setProperty('--theme-font-scale', scaleMap[theme.fontScale]);

    // Save to localStorage (se disponibile)
    safeSetItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  const savePreset = (name: string) => {
    const newPreset: ThemePreset = { name, config: { ...theme } };
    const updatedPresets = [...presets.filter(p => p.name !== name), newPreset];
    setPresets(updatedPresets);
    safeSetItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  };

  const loadPreset = (name: string) => {
    const preset = presets.find(p => p.name === name);
    if (preset) {
      setTheme(preset.config);
    }
  };

  const deletePreset = (name: string) => {
    const updatedPresets = presets.filter(p => p.name !== name);
    setPresets(updatedPresets);
    safeSetItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme, savePreset, loadPreset, deletePreset, presets }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
