import type { Session } from '../types';

const STORAGE_PREFIX = 'bb-chat-';

export function getStoredSession(embedId: string): Session | null {
  try {
    const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${embedId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function storeSession(embedId: string, session: Session): void {
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}${embedId}`,
      JSON.stringify(session)
    );
  } catch {
    // Storage full or unavailable
  }
}

export function clearSession(embedId: string): void {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${embedId}`);
  } catch {
    // Ignore
  }
}

