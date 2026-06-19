/**
 * hooks/useNavigation.ts
 * Hooks для навигации и управления историей
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook для навигации
 */
export const useNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  return {
    navigate,
    goBack,
    goForward,
    currentPath: location.pathname,
  };
};

/**
 * Hook для проверки текущего пути
 */
export const useIsPath = (path: string): boolean => {
  const location = useLocation();
  return location.pathname === path;
};

/**
 * Hook для получения параметров URL
 */
export const useQueryParam = (key: string): string | null => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return params.get(key);
};
