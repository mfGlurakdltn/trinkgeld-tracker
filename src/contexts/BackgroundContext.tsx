import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type BackgroundPreset =
  | 'liquid'
  | 'classic'
  | 'neoclassic'
  | 'cosmic'
  | 'forest'
  | 'sunset'
  | 'ocean'
  | 'midnight';

export interface BackgroundDef {
  key: BackgroundPreset;
  label: string;
  gradient: string;
  blobs: Array<{ color: string; opacity?: number }>;
  swatch: string;
  liquid: boolean;
}

export const BACKGROUND_PRESETS: Record<BackgroundPreset, BackgroundDef> = {
  liquid: {
    key: 'liquid',
    label: 'Aurora',
    gradient: 'linear-gradient(170deg, #06091A 0%, #0B1530 40%, #0E1E42 70%, #091228 100%)',
    blobs: [
      { color: 'rgba(74,144,226,0.20)' },
      { color: 'rgba(147,112,219,0.15)' },
      { color: 'rgba(91,163,255,0.12)' },
      { color: 'rgba(255,183,77,0.10)' },
    ],
    swatch: 'linear-gradient(135deg, #06091A 0%, #0E1E42 100%)',
    liquid: true,
  },
  classic: {
    key: 'classic',
    label: 'Classic',
    gradient: 'linear-gradient(180deg, #0A1128 0%, #0A1128 100%)',
    blobs: [],
    swatch: 'linear-gradient(135deg, #0A1128 0%, #1E2D4F 100%)',
    liquid: false,
  },
  neoclassic: {
    key: 'neoclassic',
    label: 'Neo Classic',
    gradient: 'linear-gradient(170deg, #0A1128 0%, #142244 50%, #0A1128 100%)',
    blobs: [],
    swatch: 'linear-gradient(135deg, #0A1128 0%, #2D5F9E 100%)',
    liquid: true,
  },
  cosmic: {
    key: 'cosmic',
    label: 'Cosmic',
    gradient: 'linear-gradient(170deg, #1A0633 0%, #2D1A4A 40%, #4A1A5C 70%, #1A0633 100%)',
    blobs: [
      { color: 'rgba(180,100,255,0.22)' },
      { color: 'rgba(255,90,200,0.16)' },
      { color: 'rgba(120,80,255,0.14)' },
      { color: 'rgba(255,180,255,0.10)' },
    ],
    swatch: 'linear-gradient(135deg, #1A0633 0%, #4A1A5C 100%)',
    liquid: true,
  },
  forest: {
    key: 'forest',
    label: 'Forest',
    gradient: 'linear-gradient(170deg, #0A1F1C 0%, #0F2E2A 40%, #1A4438 70%, #0A1F1C 100%)',
    blobs: [
      { color: 'rgba(76,200,160,0.20)' },
      { color: 'rgba(120,200,80,0.15)' },
      { color: 'rgba(60,180,140,0.13)' },
      { color: 'rgba(200,255,180,0.08)' },
    ],
    swatch: 'linear-gradient(135deg, #0A1F1C 0%, #1A4438 100%)',
    liquid: true,
  },
  sunset: {
    key: 'sunset',
    label: 'Sunset',
    gradient: 'linear-gradient(170deg, #1F0A14 0%, #3A1320 40%, #6B2C2C 70%, #1F0A0A 100%)',
    blobs: [
      { color: 'rgba(255,120,80,0.22)' },
      { color: 'rgba(255,180,80,0.16)' },
      { color: 'rgba(220,80,120,0.14)' },
      { color: 'rgba(255,200,150,0.10)' },
    ],
    swatch: 'linear-gradient(135deg, #1F0A14 0%, #6B2C2C 100%)',
    liquid: true,
  },
  ocean: {
    key: 'ocean',
    label: 'Ocean',
    gradient: 'linear-gradient(170deg, #001A2E 0%, #003049 40%, #00566B 70%, #001A2E 100%)',
    blobs: [
      { color: 'rgba(80,200,255,0.22)' },
      { color: 'rgba(60,180,200,0.16)' },
      { color: 'rgba(120,220,255,0.14)' },
      { color: 'rgba(180,240,255,0.08)' },
    ],
    swatch: 'linear-gradient(135deg, #001A2E 0%, #00566B 100%)',
    liquid: true,
  },
  midnight: {
    key: 'midnight',
    label: 'Midnight',
    gradient: 'linear-gradient(170deg, #050505 0%, #0F0F1A 40%, #1A1A2E 70%, #050505 100%)',
    blobs: [
      { color: 'rgba(120,120,180,0.18)' },
      { color: 'rgba(180,180,220,0.10)' },
      { color: 'rgba(80,80,140,0.14)' },
    ],
    swatch: 'linear-gradient(135deg, #050505 0%, #1A1A2E 100%)',
    liquid: true,
  },
};

const STORAGE_KEY = 'backgroundPreset';

interface BackgroundContextValue {
  preset: BackgroundPreset;
  def: BackgroundDef;
  setPreset: (p: BackgroundPreset) => void;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<BackgroundPreset>(() => {
    if (typeof window === 'undefined') return 'liquid';
    const stored = localStorage.getItem(STORAGE_KEY) as BackgroundPreset | null;
    return stored && stored in BACKGROUND_PRESETS ? stored : 'liquid';
  });

  const def = BACKGROUND_PRESETS[preset];

  useEffect(() => {
    document.body.style.background = def.gradient;
    document.body.style.backgroundAttachment = 'fixed';
  }, [def.gradient]);

  const setPreset = (p: BackgroundPreset) => {
    localStorage.setItem(STORAGE_KEY, p);
    setPresetState(p);
  };

  return (
    <BackgroundContext.Provider value={{ preset, def, setPreset }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error('useBackground must be used inside BackgroundProvider');
  return ctx;
}
