import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { toDateKey } from '@/lib/utils/date';

type Ctx = {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  selectedDateKey: string;
};

const SelectedDateContext = createContext<Ctx | null>(null);

export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDateState] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const setSelectedDate = useCallback((d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    setSelectedDateState(x);
  }, []);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const value = useMemo(
    () => ({ selectedDate, setSelectedDate, selectedDateKey }),
    [selectedDate, setSelectedDate, selectedDateKey],
  );

  return <SelectedDateContext.Provider value={value}>{children}</SelectedDateContext.Provider>;
}

export function useSelectedDate(): Ctx {
  const ctx = useContext(SelectedDateContext);
  if (!ctx) throw new Error('useSelectedDate must be used within SelectedDateProvider');
  return ctx;
}
