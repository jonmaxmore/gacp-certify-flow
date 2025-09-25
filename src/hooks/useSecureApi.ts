import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { validateInput } from '@/utils/inputValidation';

/**
 * Secure API hook with built-in validation and error handling
 * Implements banking-level security practices
 */
export const useSecureApi = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Secure database query with validation
   */
  const secureQuery = useCallback(async <T>(
    tableName: string,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
    } = {}
  ): Promise<{ data: T[] | null; error: string | null }> => {
    if (!user) {
      return { data: null, error: 'Authentication required' };
    }

    setLoading(true);
    setError(null);

    try {
      // Type-safe table validation
      const validTableNames = [
        'applications', 'certificates', 'payments', 'invoices',
        'assessments', 'notifications', 'profiles', 'documents'
      ];
      
      if (!validTableNames.includes(tableName)) {
        throw new Error('Invalid table name');
      }

      // Build query step by step
      let query = supabase.from(tableName as any).select(
        options.select ? validateInput(options.select).sanitized : '*'
      );

      // Apply filters with validation
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          const validatedKey = validateInput(key).sanitized;
          const validatedValue = validateInput(String(value)).sanitized;
          query = query.eq(validatedKey, validatedValue);
        });
      }

      // Apply ordering
      if (options.orderBy) {
        const { column, ascending = true } = options.orderBy;
        const validatedColumn = validateInput(column).sanitized;
        query = query.order(validatedColumn, { ascending });
      }

      // Apply limit
      if (options.limit && options.limit > 0 && options.limit <= 1000) {
        query = query.limit(options.limit);
      }

      const { data, error: dbError } = await query;

      if (dbError) {
        throw dbError;
      }

      return { data: data as T[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database error';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Secure update operation with validation
   */
  const secureUpdate = useCallback(async <T>(
    tableName: string,
    id: string,
    updates: Record<string, any>
  ): Promise<{ data: T | null; error: string | null }> => {
    if (!user) {
      return { data: null, error: 'Authentication required' };
    }

    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      const validatedId = validateInput(id).sanitized;
      const validatedUpdates: Record<string, any> = {};

      Object.entries(updates).forEach(([key, value]) => {
        const validatedKey = validateInput(key).sanitized;
        validatedUpdates[validatedKey] = value;
      });

      const { data, error: dbError } = await supabase
        .from(tableName as any)
        .update(validatedUpdates)
        .eq('id', validatedId)
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      return { data: data as T, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update error';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    secureQuery,
    secureUpdate,
    loading,
    error,
    clearError: () => setError(null)
  };
};