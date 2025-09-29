import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';
import React from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Optimized query hook with enterprise features
 * Includes error handling, optimistic updates, and performance optimizations
 */
interface OptimizedQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  showErrorToast?: boolean;
  errorMessage?: string;
}

interface OptimizedMutationOptions<TData, TError = Error, TVariables = void> 
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[][];
  optimisticUpdate?: {
    queryKey: string[];
    updateFn: (oldData: any, variables: TVariables) => any;
  };
}

export function useOptimizedQuery<TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: OptimizedQueryOptions<TData> = {}
) {
  const {
    showErrorToast = true,
    errorMessage = 'Failed to load data',
    ...queryOptions
  } = options;

  const queryResult = useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes default
    gcTime: 10 * 60 * 1000, // 10 minutes default
    retry: (failureCount, error: any) => {
      // Don't retry for authentication or authorization errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    ...queryOptions,
  });

  // Handle error toast in React Query v5 way
  React.useEffect(() => {
    if (queryResult.error && showErrorToast) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Query error:', queryResult.error);
    }
  }, [queryResult.error, showErrorToast, errorMessage]);

  return queryResult;
}

export function useOptimizedMutation<TData, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OptimizedMutationOptions<TData, TError, TVariables> = {}
) {
  const queryClient = useQueryClient();
  
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
    invalidateQueries = [],
    optimisticUpdate,
    ...mutationOptions
  } = options;

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Optimistic update
      if (optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey });
        
        const previousData = queryClient.getQueryData(optimisticUpdate.queryKey);
        
        queryClient.setQueryData(
          optimisticUpdate.queryKey,
          (oldData: any) => optimisticUpdate.updateFn(oldData, variables)
        );
        
        return { previousData };
      }
    },
    onError: (error: any, variables, context: any) => {
      // Revert optimistic update on error
      if (optimisticUpdate && context?.previousData) {
        queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData);
      }
      
      if (showErrorToast) {
        toast({
          title: 'Error',
          description: error?.message || errorMessage,
          variant: 'destructive',
        });
      }
      console.error('Mutation error:', error);
    },
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      if (showSuccessToast) {
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default',
        });
      }
    },
    retry: 1, // Only retry once for mutations
    ...mutationOptions,
  });
}

/**
 * Hook for prefetching data to improve perceived performance
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(
    async (queryKey: string[], queryFn: () => Promise<any>) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient]
  );

  return { prefetchQuery };
}

/**
 * Hook for optimistic updates with rollback support
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const updateData = useCallback(
    <T>(queryKey: string[], updateFn: (oldData: T) => T) => {
      const previousData = queryClient.getQueryData<T>(queryKey);
      
      queryClient.setQueryData(queryKey, updateFn);
      
      return () => {
        if (previousData !== undefined) {
          queryClient.setQueryData(queryKey, previousData);
        }
      };
    },
    [queryClient]
  );

  return { updateData };
}