const BASE = '/api';

function authHeaders(credential) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${credential}`,
  };
}

export async function fetchSettings(credential) {
  const res = await fetch(`${BASE}/settings`, { headers: authHeaders(credential) });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(credential, settings) {
  await fetch(`${BASE}/settings`, {
    method: 'PUT',
    headers: authHeaders(credential),
    body: JSON.stringify(settings),
  });
}

export async function fetchProjects(credential) {
  const res = await fetch(`${BASE}/projects`, { headers: authHeaders(credential) });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json(); // { projects: [...] | null }
}

export async function saveProjects(credential, projects) {
  await fetch(`${BASE}/projects`, {
    method: 'PUT',
    headers: authHeaders(credential),
    body: JSON.stringify(projects),
  });
}
