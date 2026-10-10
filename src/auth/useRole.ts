import { useSyncExternalStore } from 'react';
import { session } from '../services/authService';

export function useRole() {
  return useSyncExternalStore(session.subscribe, session.getRole);
}
