import { api } from './client';

export type ContactFields = { name: string; email: string; message: string };

export function validateContact({ name, email, message }: ContactFields): string | null {
  if (!name.trim() || Array.from(name.trim()).length > 100) return 'Enter a name of at most 100 characters.';
  const address = email.trim().toLowerCase();
  if (address.length > 150 || !/^[^@\s]+@gmail\.com$/.test(address)) return 'Enter a valid Gmail address.';
  if (!message.trim() || Array.from(message.trim()).length > 5000) return 'Enter a message of at most 5000 characters.';
  return null;
}

export async function sendContact(fields: ContactFields): Promise<string> {
  const error = validateContact(fields);
  if (error) throw new Error(error);
  const body = new URLSearchParams({
    name: fields.name.trim(),
    email: fields.email.trim().toLowerCase(),
    message: fields.message.trim(),
  });
  const result = await api('contact.php', { method: 'POST', body });
  return result.message ?? 'Your message was sent.';
}