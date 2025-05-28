import type { User } from '@/types';

const AUTH_USER_KEY = 'stockpilot_auth_user';

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const storedUser = localStorage.getItem(AUTH_USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
};

export const setStoredUser = (user: User | null): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
};
