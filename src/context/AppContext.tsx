import React, { createContext, useContext } from 'react';

export type AppState = 'loading' | 'logged_out' | 'admin' | 'customer';

interface AppContextValue {
  appState: AppState;
  /** Call this to trigger a full stack switch (e.g. after login or logout) */
  setAppState: (state: AppState) => void;
}

export const AppContext = createContext<AppContextValue>({
  appState: 'loading',
  setAppState: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
