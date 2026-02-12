const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_id: string;
  message: string;
}

export interface AuthError {
  detail: string;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 400 && responseData.detail?.includes('already exists')) {
        throw new AuthApiError(
          'This email is already taken.',
          response.status,
          responseData.detail
        );
      }

      if (response.status === 422) {
        // Validation error
        throw new AuthApiError(
          'Please check your input. Password must be 8-72 characters.',
          response.status,
          responseData.detail || 'Validation error'
        );
      }

      throw new AuthApiError(
        responseData.detail || 'Signup failed',
        response.status,
        responseData.detail
      );
    }

    return responseData as AuthResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }
    throw new AuthApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        if (responseData.detail?.includes('Google Login')) {
          throw new AuthApiError(
            'Please use the Google Login button.',
            response.status,
            responseData.detail
          );
        }
        throw new AuthApiError(
          'Incorrect credentials.',
          response.status,
          responseData.detail
        );
      }

      throw new AuthApiError(
        responseData.detail || 'Login failed',
        response.status,
        responseData.detail
      );
    }

    return responseData as AuthResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }
    throw new AuthApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}
