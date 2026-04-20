import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ViewMode = 'mobile' | 'desktop';

const STORAGE_KEY = 'viewMode';
const DESKTOP_MQ = '(min-width: 1024px)';

interface ViewModeContextValue {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  canUseDesktop: boolean;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [storedMode, setStoredMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'mobile';
    return localStorage.getItem(STORAGE_KEY) === 'desktop' ? 'desktop' : 'mobile';
  });

  const [canUseDesktop, setCanUseDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(DESKTOP_MQ).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const handler = (e: MediaQueryListEvent) => setCanUseDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setViewMode = (m: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    setStoredMode(m);
  };

  const viewMode: ViewMode = canUseDesktop ? storedMode : 'mobile';

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, canUseDesktop }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used inside ViewModeProvider');
  return ctx;
}
