import { calculateProfile } from './profile';

const API_URL = import.meta.env.VITE_PRISMA_API_URL || 'http://localhost:8000';

export async function createProfile(payload, rawAnswers) {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Profile request failed');
    return await response.json();
  } catch {
    return calculateProfile(rawAnswers);
  }
}
