import React, { useEffect, useState } from 'react';
import { PowerSyncContext } from '@powersync/react-native';
import { usePowerSyncInstance } from '../hooks/usePowerSync';

interface Props {
  children: React.ReactNode;
}

export function PowerSyncProvider({ children }: Props) {
  const { db, isReady } = usePowerSyncInstance();

  if (!isReady || !db) {
    return null;
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
