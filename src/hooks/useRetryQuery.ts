'use client';

import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
  QueryKey,
} from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Calculates the exponential backoff delay for a given retry attempt.
 * Attempt is 0-indexed from TanStack Query's perspective, but the formula
 * uses 1-indexed: delay = 2^(n-1) seconds where n is the 1-indexed attempt number.
 *
 * - Attempt 1: 2^0 = 1 second (1000ms)
 * - Attempt 2: 2^1 = 2 seconds (2000ms)
 * - Attempt 3: 2^2 = 4 seconds (4000ms)
 */
export function calculateBackoffDelay(attemptIndex: number): number {
  // attemptIndex is 0-based from TanStack Query (0, 1, 2)
  // Formula: 2^(attemptIndex) * 1000ms
  return Math.pow(2, attemptIndex) * 1000;
}

const MAX_AUTOMATIC_RETRIES = 3;

interface UseRetryQueryOptions<TData, TError = Error>
  extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'retry' | 'retryDelay'> {
  /** Maximum number of automatic retries (default: 3) */
  maxRetries?: number;
}

interface UseRetryQueryReturn<TData, TError = Error> {
  /** The query result from TanStack Query */
  query: UseQueryResult<TData, TError>;
  /** Whether automatic retries have been exhausted and manual retry is available */
  canManualRetry: boolean;
  /** Whether a manual retry is currently in progress */
  isRetrying: boolean;
  /** Trigger a manual retry after automatic retries are exhausted */
  retry: () => void;
  /** The error from the query, if any */
  error: TError | null;
}

/**
 * Hook that wraps TanStack Query with exponential backoff retry logic.
 *
 * Behavior:
 * - Automatically retries failed queries up to 3 times with exponential backoff (1s, 2s, 4s)
 * - After automatic retries are exhausted, exposes a manual retry function
 * - Provides loading state for the retry button
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export function useRetryQuery<TData, TError = Error>(
  options: UseRetryQueryOptions<TData, TError>
): UseRetryQueryReturn<TData, TError> {
  const { maxRetries = MAX_AUTOMATIC_RETRIES, ...queryOptions } = options;
  const [isRetrying, setIsRetrying] = useState(false);

  const query = useQuery<TData, TError, TData, QueryKey>({
    ...queryOptions,
    retry: maxRetries,
    retryDelay: (attemptIndex: number) => calculateBackoffDelay(attemptIndex),
  });

  // Automatic retries are exhausted when the query is in error state
  // (TanStack Query has already tried all automatic retries)
  const canManualRetry = query.isError && !query.isFetching;

  const retry = useCallback(() => {
    if (!canManualRetry) return;

    setIsRetrying(true);
    query.refetch().finally(() => {
      setIsRetrying(false);
    });
  }, [canManualRetry, query]);

  return {
    query,
    canManualRetry,
    isRetrying: isRetrying || query.isFetching,
    retry,
    error: query.error,
  };
}
