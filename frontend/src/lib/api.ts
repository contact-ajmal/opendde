const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function friendlyError(status: number, fallback: string): string {
  if (status === 404) return 'Not found. The requested resource does not exist.';
  if (status >= 500) return 'Something went wrong on the server. Try again.';
  if (status === 503) return 'Service temporarily unavailable. Try again shortly.';
  return fallback;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body.detail || '';
    } catch { /* ignore */ }
    throw new Error(detail || friendlyError(res.status, `API error: ${res.status}`));
  }
  return res.json();
}

export async function apiPost(endpoint: string, body: any) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Connection failed. Check that Docker containers are running.');
  }
  return handleResponse(res);
}

export async function apiGet(endpoint: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${endpoint}`);
  } catch {
    throw new Error('Connection failed. Check that Docker containers are running.');
  }
  return handleResponse(res);
}
