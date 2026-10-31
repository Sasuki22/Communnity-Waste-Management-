import { api, ApiError } from './client';

export type Resident = { id: number; name: string; email: string };
export type ResidentSession = { token: string; user: Resident };

export async function registerResident(fullName: string, email: string, password: string, confirmation: string): Promise<void> {
  const name = fullName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!name || !normalizedEmail || !password || !confirmation) throw new ApiError('Please complete all fields.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new ApiError('Please enter a valid email.');
  if (password.length < 6) throw new ApiError('Password must be at least 6 characters.');
  if (password !== confirmation) throw new ApiError('Passwords do not match.');
  await api('register.php', {
    method: 'POST',
    body: JSON.stringify({ full_name: name, email: normalizedEmail, password, confirm_password: confirmation }),
  });
}

export async function loginResident(email: string, password: string): Promise<ResidentSession> {
  if (!email.trim() || !password) throw new ApiError('Enter your email and password.');
  const result = await api<Resident>('mobile_api/auth.php?action=login', {
    method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!result.token || !/^[a-f0-9]{64}$/i.test(result.token) || !result.user || typeof result.user.id !== 'number' || !result.user.email) {
    throw new ApiError('The server returned an invalid session. Please contact support.');
  }
  return { token: result.token, user: result.user };
}

export async function logoutResident(token: string): Promise<void> {
  await api('mobile_api/auth.php?action=logout', { method: 'POST' }, token);
}