import { api, ApiError } from './client';
export type Schedule = { id: number; waste_type: string; icon: string; day_of_week: string; time_slot: string; zone: string; frequency: string; description?: string };
export type Announcement = { id: number; title: string; message: string; created_at: string };
export type Notification = { id: number; status: string; message: string; is_read: number | string; created_at: string };

export async function schedules(token: string): Promise<Schedule[]> {
  const result = await api<Schedule[]>('mobile_api/content.php?action=schedules', {}, token);
  return result.data ?? [];
}
export async function announcements(token: string): Promise<Announcement[]> {
  const result = await api<Announcement[]>('mobile_api/content.php?action=announcements', {}, token);
  return result.data ?? [];
}
export async function notifications(token: string): Promise<Notification[]> {
  const result = await api<Notification[]>('mobile_api/content.php?action=notifications', {}, token);
  return result.data ?? [];
}
export async function markNotificationsRead(token: string): Promise<void> {
  await api('mobile_api/content.php?action=mark_notifications_read', { method: 'POST' }, token);
}
export async function requestPickup(token: string, data: { address: string; waste_type: string; preferred_date: string; notes: string }): Promise<void> {
  if (!data.address.trim() || !data.waste_type.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(data.preferred_date)) throw new ApiError('Provide an address, waste type, and date (YYYY-MM-DD).');
  await api('mobile_api/submissions.php?action=pickup', { method: 'POST', body: JSON.stringify({ ...data, address: data.address.trim() }) }, token);
}
export async function reportIssue(token: string, data: { issue_type: string; location: string; description: string }): Promise<void> {
  if (!data.issue_type.trim() || !data.location.trim() || !data.description.trim()) throw new ApiError('Complete all issue details.');
  await api('mobile_api/submissions.php?action=issue', { method: 'POST', body: JSON.stringify(data) }, token);
}