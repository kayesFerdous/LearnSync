import type {
  Routine,
  RoutineClass,
  CreateRoutineRequest,
  CreateClassRequest,
  UpdateClassRequest,
} from './types';

const API_BASE_URL = 'http://localhost:8000';

export class RoutineApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail: string
  ) {
    super(message);
    this.name = 'RoutineApiError';
  }
}

/**
 * Get current routine
 * GET /routines/
 */
export async function getRoutine(): Promise<Routine | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      // No routine exists
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new RoutineApiError(
        'Failed to fetch routine',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as Routine;
  } catch (error) {
    if (error instanceof RoutineApiError) {
      throw error;
    }
    throw new RoutineApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Create (or replace) routine
 * POST /routines/
 */
export async function createRoutine(
  routineData: CreateRoutineRequest
): Promise<Routine> {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routineData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new RoutineApiError(
        'Failed to create routine',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as Routine;
  } catch (error) {
    if (error instanceof RoutineApiError) {
      throw error;
    }
    throw new RoutineApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Delete routine
 * DELETE /routines/
 */
export async function deleteRoutine(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json();
      throw new RoutineApiError(
        'Failed to delete routine',
        response.status,
        data.detail || 'Unknown error'
      );
    }
  } catch (error) {
    if (error instanceof RoutineApiError) {
      throw error;
    }
    throw new RoutineApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Add a single class to the routine
 * POST /routines/classes
 */
export async function addClass(
  classData: CreateClassRequest
): Promise<RoutineClass> {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/classes`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(classData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new RoutineApiError(
        'Failed to add class',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as RoutineClass;
  } catch (error) {
    if (error instanceof RoutineApiError) {
      throw error;
    }
    throw new RoutineApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Update a class
 * PATCH /routines/classes/{class_id}
 */
export async function updateClass(
  classId: string,
  updateData: UpdateClassRequest
): Promise<RoutineClass> {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/classes/${classId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new RoutineApiError(
        'Failed to update class',
        response.status,
        data.detail || 'Unknown error'
      );
    }

    return data as RoutineClass;
  } catch (error) {
    if (error instanceof RoutineApiError) {
      throw error;
    }
    throw new RoutineApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Delete a class
 * DELETE /routines/classes/{class_id}
 */
export async function deleteClass(classId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/routines/classes/${classId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json();
      throw new RoutineApiError(
        'Failed to delete class',
        response.status,
        data.detail || 'Unknown error'
      );
    }
  } catch (error) {
    if (error instanceof RoutineApiError) {
      throw error;
    }
    throw new RoutineApiError(
      'Network error',
      0,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
