import { api, ApiError } from './client';

export type ResidentProfile = {
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_picture: string | null;
};

export function formatPhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return cleaned.slice(0, cleaned.startsWith('+630') ? 14 : cleaned.startsWith('+63') ? 13 : 11);
}

export function normalizePhone(value: string): string {
  const phone = value.trim();
  if (phone === '') return '';
  if (/^09\d{9}$/.test(phone)) return phone;
  if (/^\+639\d{9}$/.test(phone)) return `0${phone.slice(3)}`;
  if (/^\+6309\d{9}$/.test(phone)) return phone.slice(3);
  throw new ApiError('Enter an 11-digit mobile number starting with 09, or +639 followed by 9 digits.');
}

export async function getProfile(token: string): Promise<ResidentProfile> {
  const result = await api<ResidentProfile>('mobile_api/profile.php', {}, token);
  if (!result.user) throw new ApiError('Profile data is unavailable. Please try again.');
  return result.user;
}

export async function saveProfile(token: string, draft: Pick<ResidentProfile, 'full_name' | 'email' | 'phone' | 'address'>): Promise<ResidentProfile> {
  const name = draft.full_name.trim();
  const email = draft.email.trim().toLowerCase();
  if (!name || name.length > 100) throw new ApiError('Enter a full name (maximum 100 characters).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) throw new ApiError('Enter a valid email address.');
  const phone = normalizePhone(draft.phone ?? '');
  const address = (draft.address ?? '').trim();
  if (address.length > 255) throw new ApiError('Address must be 255 characters or fewer.');
  const form = new FormData();
  form.append('full_name', name);
  form.append('email', email);
  form.append('phone', phone);
  form.append('address', address);
  const result = await api<ResidentProfile>('mobile_api/profile.php', { method: 'POST', body: form }, token);
  if (!result.user) throw new ApiError('The server did not return the saved profile. Please refresh to check your changes.');
  return result.user;
}