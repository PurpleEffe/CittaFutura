interface FetchOptions extends RequestInit {
  json?: unknown;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = path.startsWith('/') ? path : `/${path}`;
  const headers = new Headers(options.headers);

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${url}`, {
    ...options,
    credentials: 'include',
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = data && typeof data.message === 'string' ? data.message : 'Errore inatteso';
    throw new Error(message);
  }

  return data as T;
}
