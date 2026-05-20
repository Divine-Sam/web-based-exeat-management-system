const BASE = 'https://web-based-exeat-management-system-1.onrender.com/api';

function getToken(): string | null {
  return localStorage.getItem('exeat_token');
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body
      ? JSON.stringify(body)
      : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed.');
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body: unknown) => request<T>('PUT', url, body),
  delete: <T>(url: string) => request<T>('DELETE', url),
  postForm: <T>(url: string, form: FormData) => request<T>('POST', url, form, true),
  putForm: <T>(url: string, form: FormData) => request<T>('PUT', url, form, true),
};

export { BASE, getToken };
