/**
 * hooks/useAsync.ts
 * Hook для асинхронных операций (загрузка данных, отправка формы и т.д.)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { LoadingState } from '../types';

interface UseAsyncState<T> {
  state: LoadingState;
  data?: T;
  error?: string;
}

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

/**
 * Hook для управления асинхронными операциями
 */
export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = false,
  options?: UseAsyncOptions<T>
) => {
  const [state, setState] = useState<UseAsyncState<T>>({
    state: 'idle',
  });

  const isMountedRef = useRef(true);

  // Основная функция для выполнения асинхронной операции
  const execute = useCallback(async () => {
    setState({ state: 'loading' });

    try {
      const response = await asyncFunction();

      if (!isMountedRef.current) return;

      setState({ state: 'success', data: response });
      options?.onSuccess?.(response);
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      setState({ state: 'error', error: errorMessage });
      options?.onError?.(errorMessage);
    }
  }, [asyncFunction, options]);

  // Выполняем при монтировании, если нужно
  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, immediate]);

  const isLoading = state.state === 'loading';
  const isSuccess = state.state === 'success';
  const isError = state.state === 'error';

  return {
    ...state,
    isLoading,
    isSuccess,
    isError,
    execute,
  };
};

/**
 * Более простой hook для загрузки данных
 */
export const useAsyncData = <T,>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFunction();
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Unknown error occurred'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return { data, isLoading, error };
};
