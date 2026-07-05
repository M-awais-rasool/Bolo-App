import React, { createContext, useContext, useMemo, useState } from 'react';

import type { CompanionType } from '../components/companions/Companion';

interface CompanionState {
  /** Currently chosen companion (defaults to Mano, the hero of the designs). */
  companion: CompanionType;
  setCompanion: (c: CompanionType) => void;
  /** The child's display name, captured on "Create profile". */
  childName: string;
  setChildName: (name: string) => void;
}

const CompanionContext = createContext<CompanionState | undefined>(undefined);

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const [companion, setCompanion] = useState<CompanionType>('mano');
  const [childName, setChildName] = useState('Ayesha');

  const value = useMemo(
    () => ({ companion, setCompanion, childName, setChildName }),
    [companion, childName],
  );

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
}

/** Access the selected companion + child name from any screen. */
export function useCompanion(): CompanionState {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error('useCompanion must be used within a CompanionProvider');
  return ctx;
}
