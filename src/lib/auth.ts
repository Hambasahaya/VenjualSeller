'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/services';

function hasActiveSession() {
  return Boolean(getAuthToken());
}

function redirectWithReload(pathname: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.replace(pathname);
}

function bindSessionListeners(checkSession: () => void) {
  window.addEventListener('focus', checkSession);
  window.addEventListener('pageshow', checkSession);
  window.addEventListener('storage', checkSession);

  return () => {
    window.removeEventListener('focus', checkSession);
    window.removeEventListener('pageshow', checkSession);
    window.removeEventListener('storage', checkSession);
  };
}

export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const [checkingSession, setCheckingSession] = useState(true);

  const handleSessionChange = useCallback(() => {
    const authenticated = hasActiveSession();

    if (authenticated) {
      setCheckingSession(true);
      redirectWithReload(redirectTo);
      return;
    }

    setCheckingSession(false);
  }, [redirectTo]);

  useEffect(() => {
    const timeoutId = window.setTimeout(handleSessionChange, 0);
    const unbindSessionListeners = bindSessionListeners(handleSessionChange);

    return () => {
      window.clearTimeout(timeoutId);
      unbindSessionListeners();
    };
  }, [handleSessionChange]);

  return checkingSession;
}

export function useRequireAuth(redirectTo = '/auth/login') {
  const [checkingSession, setCheckingSession] = useState(true);

  const handleSessionChange = useCallback(() => {
    const authenticated = hasActiveSession();

    if (!authenticated) {
      setCheckingSession(true);
      redirectWithReload(redirectTo);
      return;
    }

    setCheckingSession(false);
  }, [redirectTo]);

  useEffect(() => {
    const timeoutId = window.setTimeout(handleSessionChange, 0);
    const unbindSessionListeners = bindSessionListeners(handleSessionChange);

    return () => {
      window.clearTimeout(timeoutId);
      unbindSessionListeners();
    };
  }, [handleSessionChange]);

  return checkingSession;
}
