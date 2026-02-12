const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  user_id: string;
  username: string;
  email: string;
  picture: string | null;
  is_admin: boolean;
  subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

export interface DeleteUserResponse {
  message: string;
  user_id: string;
}

export interface AdminApiError {
  detail: string;
}

export type SortByField = 'user_id' | 'username' | 'email' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface GetUsersParams {
  skip?: number;
  limit?: number;
  search?: string;
  sort_by?: SortByField;
  sort_order?: SortOrder;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail: string
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

/**
 * Fetch all users with pagination, search, and sorting
 */
export async function getUsers(params: GetUsersParams = {}): Promise<UsersResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params.skip !== undefined) queryParams.set('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params.sort_order) queryParams.set('sort_order', params.sort_order);

    const url = `${API_BASE_URL}/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new AdminApiError(
        responseData.detail || 'Failed to fetch users',
        response.status,
        responseData.detail
      );
    }

    return responseData as UsersResponse;
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }
    throw new AdminApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}

/**
 * Delete a user by ID
 */
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new AdminApiError(
          'User not found',
          response.status,
          responseData.detail || 'User not found'
        );
      }
      throw new AdminApiError(
        responseData.detail || 'Failed to delete user',
        response.status,
        responseData.detail
      );
    }

    return responseData as DeleteUserResponse;
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }
    throw new AdminApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}
