'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Routine, RoutineClass, CreateRoutineRequest, CreateClassRequest, UpdateClassRequest } from './types';
import * as api from './api';

interface UseRoutineReturn {
  // State
  routine: Routine | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  
  // Actions
  fetchRoutine: () => Promise<void>;
  createRoutine: (data: CreateRoutineRequest) => Promise<boolean>;
  deleteRoutine: () => Promise<boolean>;
  addClass: (data: CreateClassRequest) => Promise<RoutineClass | null>;
  updateClass: (classId: string, data: UpdateClassRequest) => Promise<RoutineClass | null>;
  deleteClass: (classId: string) => Promise<boolean>;
  clearError: () => void;
}

export function useRoutine(): UseRoutineReturn {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchRoutine = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getRoutine();
      setRoutine(data);
    } catch (err) {
      const message = err instanceof api.RoutineApiError ? err.detail : 'Failed to fetch routine';
      setError(message);
      setRoutine(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoutine = useCallback(async (data: CreateRoutineRequest): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setError(null);
      const newRoutine = await api.createRoutine(data);
      setRoutine(newRoutine);
      return true;
    } catch (err) {
      const message = err instanceof api.RoutineApiError ? err.detail : 'Failed to create routine';
      setError(message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const deleteRoutine = useCallback(async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setError(null);
      await api.deleteRoutine();
      setRoutine(null);
      return true;
    } catch (err) {
      const message = err instanceof api.RoutineApiError ? err.detail : 'Failed to delete routine';
      setError(message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const addClass = useCallback(async (data: CreateClassRequest): Promise<RoutineClass | null> => {
    try {
      setIsSyncing(true);
      setError(null);
      const newClass = await api.addClass(data);
      
      // Update local state
      setRoutine(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          classes: [...prev.classes, newClass],
        };
      });
      
      return newClass;
    } catch (err) {
      const message = err instanceof api.RoutineApiError ? err.detail : 'Failed to add class';
      setError(message);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const updateClass = useCallback(async (
    classId: string,
    data: UpdateClassRequest
  ): Promise<RoutineClass | null> => {
    try {
      setIsSyncing(true);
      setError(null);
      const updatedClass = await api.updateClass(classId, data);
      
      // Update local state
      setRoutine(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          classes: prev.classes.map(c => 
            c.id === classId ? updatedClass : c
          ),
        };
      });
      
      return updatedClass;
    } catch (err) {
      const message = err instanceof api.RoutineApiError ? err.detail : 'Failed to update class';
      setError(message);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const deleteClass = useCallback(async (classId: string): Promise<boolean> => {
    try {
      setIsSyncing(true);
      setError(null);
      await api.deleteClass(classId);
      
      // Update local state
      setRoutine(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          classes: prev.classes.filter(c => c.id !== classId),
        };
      });
      
      return true;
    } catch (err) {
      const message = err instanceof api.RoutineApiError ? err.detail : 'Failed to delete class';
      setError(message);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Fetch routine on mount
  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine]);

  return {
    routine,
    isLoading,
    isSyncing,
    error,
    fetchRoutine,
    createRoutine,
    deleteRoutine,
    addClass,
    updateClass,
    deleteClass,
    clearError,
  };
}
