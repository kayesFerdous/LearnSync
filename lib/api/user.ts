const API_BASE_URL = 'http://localhost:8000';

export interface UserSettings {
  timezone: string;
  theme: string;
  font: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  picture: string | null;
  is_admin: boolean;
  subscribed: boolean;
  created_at: string;
  settings: UserSettings;
}

export interface UpdateProfileRequest {
  username?: string;
  picture?: string;
}

export interface UpdateSettingsRequest {
  timezone?: string;
  theme?: string;
  font?: string;
}

export class UserApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail: string
  ) {
    super(message);
    this.name = 'UserApiError';
  }
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new UserApiError(
        responseData.detail || 'Failed to fetch profile',
        response.status,
        responseData.detail
      );
    }

    return responseData as UserProfile;
  } catch (error) {
    if (error instanceof UserApiError) {
      throw error;
    }
    throw new UserApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}

/**
 * Update user profile (username and/or picture)
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        throw new UserApiError(
          responseData.detail || 'No fields provided to update',
          response.status,
          responseData.detail
        );
      }
      throw new UserApiError(
        responseData.detail || 'Failed to update profile',
        response.status,
        responseData.detail
      );
    }

    return responseData as UserProfile;
  } catch (error) {
    if (error instanceof UserApiError) {
      throw error;
    }
    throw new UserApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}

/**
 * Update user settings
 */
export async function updateSettings(data: UpdateSettingsRequest): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE_URL}/me/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new UserApiError(
        responseData.detail || 'Failed to update settings',
        response.status,
        responseData.detail
      );
    }

    return responseData as UserProfile;
  } catch (error) {
    if (error instanceof UserApiError) {
      throw error;
    }
    throw new UserApiError(
      'Network error. Please check your connection.',
      0,
      'Network error'
    );
  }
}
